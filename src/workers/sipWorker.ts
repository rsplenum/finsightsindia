// sipWorker.ts
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

let rand = mulberry32(1234567);

// Box-Muller transform optimized to use both generated normals
let hasSpare = false;
let spare = 0;
function getRandomNormal() {
	if (hasSpare) {
		hasSpare = false;
		return spare;
	}
	let u1 = 0, u2 = 0;
	while (u1 === 0) u1 = rand();
	while (u2 === 0) u2 = rand();
	const mag = Math.sqrt(-2.0 * Math.log(u1));
	const z0 = mag * Math.cos(2.0 * Math.PI * u2);
	const z1 = mag * Math.sin(2.0 * Math.PI * u2);
	spare = z1;
	hasSpare = true;
	return z0;
}

// Asset assumptions. Hoisted to module scope because runGoalSeek and
// runSimulation had identical copies of them, and duplicated constants are how
// two engines drift apart.
const SQRT12 = Math.sqrt(12);

const eqDrift = (0.12 - 0.5 * 0.15 * 0.15) / 12;
const debtDrift = (0.071 - 0.5 * 0.02 * 0.02) / 12;
const goldDrift = (0.085 - 0.5 * 0.10 * 0.10) / 12;

const eqVolMult = 0.15 / SQRT12;
const debtVolMult = 0.02 / SQRT12;
const goldVolMult = 0.10 / SQRT12;

// --- Portfolio insurance (sol-018) -------------------------------------------
//
// A rate compounds; a floor binds. The two are not interchangeable, and the
// original defect was `const monthlyFloor = -0.08 / 12` — an annual floor
// divided by twelve and applied to every month, which truncated the loss in
// 35.8% of months where a real annual floor binds in about 10% of years, and
// so made insurance more than double the median outcome.
//
// The four modelling decisions recorded as open on sol-018, answered here:
//
//   1. WHAT THE FLOOR IS MEASURED ON. The index, not the portfolio. A put is
//      written on NIFTY, so protection is a function of the equity RETURN
//      SERIES, which `hedgeIndex` tracks and resets at each roll. The
//      portfolio's own money-weighted return is a different, higher-variance
//      number once instalments arrive; flooring that would over-protect —
//      the original bug wearing a new hat.
//
//   2. ROLLING, NOT CONTINUOUS. A 12-month put, rolled at each anniversary —
//      the short end of the site's own "rolling every 12 to 18 months". The
//      consequence is real and deliberate: protection RESETS every year and
//      never accumulates, so two consecutive floored years lose about 15% and
//      not 8%; and a crash that falls and recovers inside one term pays
//      nothing at all, because the put is European and only expiry counts.
//
//   3. CONTRIBUTIONS ARE NOT RETROACTIVELY INSURED. `coveredNotional` is fixed
//      at the strike date. An instalment arriving in month 11 bought no
//      protection for that year, so it earns no payout. Paying out on the
//      whole year-end balance would credit insurance that was never bought.
//
//   4. THE PREMIUM IS PAID WHETHER OR NOT THE PUT PAYS. It is charged up front
//      at every strike and is never netted against a payoff — they are two
//      separate statements in the loop below, deliberately not one expression,
//      because netting them is exactly what would make hedging look free.
//
// `annualHedgingDragCost` is the annual premium as a fraction of the TOTAL
// portfolio — the same meaning it carries in swpWorker and in the planner's
// tooltip. Call sites pass `0.0185 * eqPct`, so the charge works out to 1.85%
// of the equity sleeve actually insured, which is the same balance
// `coveredNotional` is taken from. Previously the premium was subtracted from
// the equity return and then weighted by eqPct a second time, charging
// 1.85% × eqPct² and undercharging the premium by a third at a 70% equity
// allocation.
const HEDGE_FLOOR_ANNUAL = -0.08;
const HEDGE_TERM_MONTHS = 12;

/**
 * One Monte Carlo path, shared by both engines. Extracted because the floor
 * defect existed twice, in two hand-copied loops, and a fix applied to one of
 * them would have left the other quietly wrong.
 *
 * `recordYear` is called with the nominal balance at each year end; goal seek
 * passes null and reads the return value.
 */
function simulatePath(
	seedCapital: number,
	monthlySip: number,
	stepUpRate: number,
	horizonYears: number,
	eqPct: number,
	debtPct: number,
	goldPct: number,
	bsEnabled: boolean,
	annualHedgingDragCost: number,
	recordYear: ((yr: number, balance: number) => void) | null
): number {
	let portBal = seedCapital;
	let currentSip = monthlySip;

	// Nothing to insure if there is no equity sleeve, so no premium is charged.
	const hedged = !!bsEnabled && eqPct > 0;
	let hedgeIndex = 1;
	let coveredNotional = 0;
	let monthOfTerm = 0;

	for (let yr = 1; yr <= horizonYears; yr++) {
		if (yr > 1) { currentSip = currentSip * (1 + stepUpRate); }

		for (let m = 1; m <= 12; m++) {
			portBal += currentSip;

			if (hedged) {
				if (monthOfTerm === 0) {
					// Strike a new put: fix the notional, pay the premium, and
					// start the index it is written on again from par.
					coveredNotional = eqPct * portBal;
					portBal -= portBal * annualHedgingDragCost;
					hedgeIndex = 1;
				}
				monthOfTerm++;
			}

			const rEqM = Math.exp(eqDrift + eqVolMult * getRandomNormal()) - 1;
			const rDebtM = Math.exp(debtDrift + debtVolMult * getRandomNormal()) - 1;
			const rGoldM = Math.exp(goldDrift + goldVolMult * getRandomNormal()) - 1;

			// The equity return itself is never truncated. The put is an asset
			// held alongside the portfolio, not a cap on monthly returns.
			if (hedged) { hedgeIndex = hedgeIndex * (1 + rEqM); }

			const portReturn = (eqPct * rEqM) + (debtPct * rDebtM) + (goldPct * rGoldM);
			portBal = portBal * (1 + portReturn);

			if (hedged && monthOfTerm === HEDGE_TERM_MONTHS) {
				const indexReturn = hedgeIndex - 1;
				if (indexReturn < HEDGE_FLOOR_ANNUAL) {
					portBal += coveredNotional * (HEDGE_FLOOR_ANNUAL - indexReturn);
				}
				monthOfTerm = 0;
			}
		}

		if (recordYear) { recordYear(yr, Math.max(0, portBal)); }
	}

	return portBal;
}

// Worker entry point, kept thin. All logic lives in the exported functions
// below so they can be tested without a worker runtime. Guarded so the module
// can be imported in a plain Node/vitest context where `self` does not exist.
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
	self.onmessage = (e) => {
		const { type, params } = e.data;

		if (type === 'GOAL_SEEK') {
			self.postMessage({ type: 'GOAL_SEEK_RESULT', result: runGoalSeek(params) });
		} else if (type === 'SIMULATE') {
			self.postMessage({ type: 'SIMULATE_RESULT', result: runSimulation(params) });
		}
	};
}

export function runGoalSeek(params: any) {
	const {
		targetRealWealth, seedCapital, stepUpRate, horizonYears, inflationRate,
		eqPct, debtPct, goldPct, bsEnabled, annualHedgingDragCost, isPostTax
	} = params;

	// Reset RNG seed for deterministic runs
	rand = mulberry32(1234567);
	hasSpare = false;

	let lowSip = 0;
	let highSip = 10000000;
	const numMiniSims = 250;

	while (highSip - lowSip > 100) {
		let midSip = (lowSip + highSip) / 2;
		const finalRealValues = new Float64Array(numMiniSims);

		let totalNominalInvested = seedCapital;
		let projectedSip = midSip;
		for (let yr = 1; yr <= horizonYears; yr++) {
			if (yr > 1) { projectedSip = projectedSip * (1 + stepUpRate); }
			totalNominalInvested += projectedSip * 12;
		}

		for (let s = 0; s < numMiniSims; s++) {
			const portBal = simulatePath(
				seedCapital, midSip, stepUpRate, horizonYears,
				eqPct, debtPct, goldPct, bsEnabled, annualHedgingDragCost, null
			);

            let postTaxNominal = portBal;
			if (isPostTax) {
                const taxableGain = Math.max(0, portBal - totalNominalInvested - 125000);
				postTaxNominal = portBal - (taxableGain * 0.125);
			}
            
            let realWealth = postTaxNominal / Math.pow(1 + inflationRate, horizonYears);
			finalRealValues[s] = Math.max(0, realWealth);
		}

		finalRealValues.sort();
		const medianRealWealth = finalRealValues[Math.floor(numMiniSims * 0.50)];

		if (medianRealWealth < targetRealWealth) {
			lowSip = midSip;
		} else {
			highSip = midSip;
		}
	}

	return Math.round((lowSip + highSip) / 2);
}

export function runSimulation(params: any) {
	const {
		seedCapital, monthlySip, stepUpRate, horizonYears, inflationRate,
		eqPct, debtPct, goldPct, bsEnabled, annualHedgingDragCost
	} = params;

	// Reset RNG seed for deterministic runs
	rand = mulberry32(Number(params.seed) > 0 ? Number(params.seed) : 1234567);
	hasSpare = false;

	// Injectable so tests can run a smaller sweep. Production callers omit it.
	const numSims = Number(params.numSims) > 0 ? Number(params.numSims) : 10000;

	let realOutflowPV = seedCapital;
    let nominalTotalInvested = seedCapital;
	let projectedSip = monthlySip;
	let globalMonthCounter = 0;
    
	for (let yr = 1; yr <= horizonYears; yr++) {
		if (yr > 1) { projectedSip = projectedSip * (1 + stepUpRate); }
		for (let m = 1; m <= 12; m++) {
			globalMonthCounter++;
			realOutflowPV += projectedSip / Math.pow(1 + inflationRate, globalMonthCounter / 12);
            nominalTotalInvested += projectedSip;
		}
	}

	const yearlyPathsNominal = Array.from({ length: horizonYears + 1 }, () => new Float64Array(numSims));

	for (let s = 0; s < numSims; s++) {
		simulatePath(
			seedCapital, monthlySip, stepUpRate, horizonYears,
			eqPct, debtPct, goldPct, bsEnabled, annualHedgingDragCost,
			(yr, balance) => { yearlyPathsNominal[yr][s] = balance; }
		);
	}

    const p90Nominal = [];
    const p50Nominal = [];
    const p10Nominal = [];

	const p90Real = [];
	const p50Real = [];
	const p10Real = [];

	let expectedNominalMedian = 0;

	for (let yr = 0; yr <= horizonYears; yr++) {
		const sorted = Array.from(yearlyPathsNominal[yr]).sort((a, b) => a - b);
		const nom10 = sorted[Math.floor(numSims * 0.10)] || 0;
		const nom50 = sorted[Math.floor(numSims * 0.50)] || 0;
		const nom90 = sorted[Math.floor(numSims * 0.90)] || 0;
		
		if (yr === horizonYears) {
			expectedNominalMedian = nom50;
		}

        p10Nominal.push(Math.round(nom10));
        p50Nominal.push(Math.round(nom50));
        p90Nominal.push(Math.round(nom90));

		const discount = Math.pow(1 + inflationRate, yr);
		p10Real.push(Math.round(nom10 / discount));
		p50Real.push(Math.round(nom50 / discount));
		p90Real.push(Math.round(nom90 / discount));
	}

	return {
        nominalTotalInvested,
		realOutflowPV,
		expectedNominalMedian,
        p90Nominal,
        p50Nominal,
        p10Nominal,
		p90Real,
		p50Real,
		p10Real
	};
}
