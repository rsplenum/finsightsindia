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

// Asset assumptions.
//
// sol-028, second instance. Until now the two lines that mattered most on this
// page were module constants:
//
//     const eqDrift   = (0.12 - 0.5 * 0.15 * 0.15) / 12;
//     const eqVolMult = 0.15 / SQRT12;
//
// 12% growth and 15% roughness, typed in, unreachable from anywhere. The
// planner shipped the same pair and Rahul's own monthly series showed 15% to be
// the calmest decade in thirty-five years; the fix there was named periods
// computed from the record (src/utils/regimePresets.ts). None of it reached
// here, because here the numbers were not inputs at all. A preset control on
// this page would have moved a label and nothing else - the rungs deaf to the
// assumption, which is sol-026 with a different engine underneath.
//
// So equity is now supplied by the caller and REQUIRED. No default: a default
// is exactly how the last one survived unexamined for as long as it did, and a
// silent fallback would let a call site that forgot to pass the regime go on
// answering at 12% in perfect silence.
//
// Debt and gold are still typed in below. They are the same class of assumption
// and they have the same problem; they are not fixed here because there is no
// return series in the repo to derive them from, and inventing one would be the
// fabricated-figure fault (sol-023) wearing a data label. Recorded on the gate
// rather than left as a comment nobody reads.
const SQRT12 = Math.sqrt(12);

const DEBT_RETURN_PCT = 7.1;
const DEBT_VOL_PCT = 2.0;
const GOLD_RETURN_PCT = 8.5;
const GOLD_VOL_PCT = 10.0;

/**
 * Monthly log-drift and monthly volatility multiplier for a lognormal walk.
 *
 * `returnPct` is the ARITHMETIC expected annual return, matching swpWorker's
 * `mu + sigma * N(0,1)`. The two engines therefore read a growth assumption the
 * same way, which is the only reason a preset can be shared between them.
 */
function assetDrift(returnPct: number, volPct: number) {
  const mu = returnPct / 100;
  const sigma = volPct / 100;
  return { drift: (mu - 0.5 * sigma * sigma) / 12, volMult: sigma / SQRT12 };
}

const debt = assetDrift(DEBT_RETURN_PCT, DEBT_VOL_PCT);
const gold = assetDrift(GOLD_RETURN_PCT, GOLD_VOL_PCT);

/**
 * A number the caller must actually state. Throws rather than defaulting,
 * because the whole of sol-028 is that an unexamined default outlives every
 * intention to revisit it.
 */
function required(params: any, key: string): number {
  const v = Number(params?.[key]);
  if (!Number.isFinite(v)) {
    throw new Error(
      `sipWorker: ${key} is required and was ${JSON.stringify(params?.[key])}. ` +
      `Growth, roughness and the floor are assumptions about the world; this ` +
      `engine holds no opinion about them (sol-028).`
    );
  }
  return v;
}

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
// The floor depth used to be typed in here at -0.08 while the planner's own
// control defaulted to -10% and the copy on both pages spoke of "-10% or -15%"
// - three numbers for one contract, which is dd-013 spread across two pages
// instead of two panels. It is a parameter now, so the page's control drives
// it; the shipped page passes the planner's -10%. Which depth to recommend is
// still Rahul's call and still on the gate.
const HEDGE_TERM_MONTHS = 12;

/**
 * One Monte Carlo path, shared by both engines. Extracted because the floor
 * defect existed twice, in two hand-copied loops, and a fix applied to one of
 * them would have left the other quietly wrong.
 *
 * `recordYear` is called with the nominal balance at each year end, plus the
 * premium paid and floor payout received during that year. sol-023: the
 * hedging ledger used to recompute those two figures beside the engine and so
 * could not disagree with it visibly - the numbers now cross from here to the
 * view rather than being re-derived on arrival. Goal seek passes null and
 * reads the return value.
 */
interface World {
	seedCapital: number;
	monthlySip: number;
	stepUpRate: number;
	horizonYears: number;
	eqPct: number;
	debtPct: number;
	goldPct: number;
	bsEnabled: boolean;
	annualHedgingDragCost: number;
	/** Arithmetic expected annual equity return, %. From the regime preset. */
	equityReturn: number;
	/** Annual spread of equity returns, %. From the same preset - a regime is a pair. */
	equityVolatility: number;
	/** Depth of the protective floor, negative %, e.g. -10. */
	hedgingFloorLimit: number;
}

/**
 * Pull the world out of a params bag once, loudly, so that a missing assumption
 * fails at the call site rather than quietly becoming 12% again.
 */
function readWorld(params: any): World {
	return {
		seedCapital: Number(params.seedCapital) || 0,
		monthlySip: Number(params.monthlySip) || 0,
		stepUpRate: Number(params.stepUpRate) || 0,
		horizonYears: Math.max(1, Math.round(required(params, 'horizonYears'))),
		eqPct: Number(params.eqPct) || 0,
		debtPct: Number(params.debtPct) || 0,
		goldPct: Number(params.goldPct) || 0,
		bsEnabled: !!params.bsEnabled,
		annualHedgingDragCost: Number(params.annualHedgingDragCost) || 0,
		equityReturn: required(params, 'equityReturn'),
		equityVolatility: required(params, 'equityVolatility'),
		hedgingFloorLimit: required(params, 'hedgingFloorLimit'),
	};
}

function simulatePath(
	w: World,
	monthlySip: number,
	recordYear:
		((yr: number, balance: number, premiumPaid: number, floorPayout: number) => void)
		| null,
	hedgeOverride?: { bsEnabled: boolean; annualHedgingDragCost: number }
): number {
	const {
		seedCapital, stepUpRate, horizonYears, eqPct, debtPct, goldPct,
	} = w;
	const bsEnabled = hedgeOverride ? hedgeOverride.bsEnabled : w.bsEnabled;
	const annualHedgingDragCost = hedgeOverride
		? hedgeOverride.annualHedgingDragCost
		: w.annualHedgingDragCost;

	const eq = assetDrift(w.equityReturn, w.equityVolatility);
	const floor = w.hedgingFloorLimit / 100;
	let portBal = seedCapital;
	let currentSip = monthlySip;

	// Nothing to insure if there is no equity sleeve, so no premium is charged.
	const hedged = !!bsEnabled && eqPct > 0;
	let hedgeIndex = 1;
	let coveredNotional = 0;
	let monthOfTerm = 0;

	// Per-year ledger figures, reset each year end.
	let premiumThisYear = 0;
	let payoutThisYear = 0;

	for (let yr = 1; yr <= horizonYears; yr++) {
		if (yr > 1) { currentSip = currentSip * (1 + stepUpRate); }

		for (let m = 1; m <= 12; m++) {
			portBal += currentSip;

			if (hedged) {
				if (monthOfTerm === 0) {
					// Strike a new put: fix the notional, pay the premium, and
					// start the index it is written on again from par.
					coveredNotional = eqPct * portBal;
					const premium = portBal * annualHedgingDragCost;
					portBal -= premium;
					premiumThisYear += premium;
					hedgeIndex = 1;
				}
				monthOfTerm++;
			}

			const rEqM = Math.exp(eq.drift + eq.volMult * getRandomNormal()) - 1;
			const rDebtM = Math.exp(debt.drift + debt.volMult * getRandomNormal()) - 1;
			const rGoldM = Math.exp(gold.drift + gold.volMult * getRandomNormal()) - 1;

			// The equity return itself is never truncated. The put is an asset
			// held alongside the portfolio, not a cap on monthly returns.
			if (hedged) { hedgeIndex = hedgeIndex * (1 + rEqM); }

			const portReturn = (eqPct * rEqM) + (debtPct * rDebtM) + (goldPct * rGoldM);
			portBal = portBal * (1 + portReturn);

			if (hedged && monthOfTerm === HEDGE_TERM_MONTHS) {
				const indexReturn = hedgeIndex - 1;
				if (indexReturn < floor) {
					const payout = coveredNotional * (floor - indexReturn);
					portBal += payout;
					payoutThisYear += payout;
				}
				monthOfTerm = 0;
			}
		}

		if (recordYear) {
			recordYear(yr, Math.max(0, portBal), premiumThisYear, payoutThisYear);
		}
		premiumThisYear = 0;
		payoutThisYear = 0;
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

/**
 * The exemption on long-term capital gains. Statutory rather than an assumption
 * about the world, so unlike growth and roughness it is properly a constant
 * here; the RATE is a parameter because the planner already exposes it.
 */
const LTCG_EXEMPTION = 125000;

/**
 * What the plan costs, in both moneys, and how much of it has been paid in by
 * the end of each year. Deterministic - no market involved.
 *
 * The per-year figure is the cost basis, which is what makes tax computable at
 * any year rather than only at the horizon.
 */
function contributions(w: World, monthlySip: number, inflationRate: number) {
	const nominalByYear = [w.seedCapital];
	let nominal = w.seedCapital;
	let realPV = w.seedCapital;
	let sip = monthlySip;
	let month = 0;
	for (let yr = 1; yr <= w.horizonYears; yr++) {
		if (yr > 1) sip = sip * (1 + w.stepUpRate);
		for (let m = 1; m <= 12; m++) {
			month++;
			nominal += sip;
			realPV += sip / Math.pow(1 + inflationRate, month / 12);
		}
		nominalByYear.push(nominal);
	}
	return { nominal, realPV, nominalByYear };
}

/**
 * One path's ending wealth, in today's money, after tax if the reader asked for
 * it. Extracted because goal seek and the simulation each had their own copy of
 * this arithmetic, and the page had a third - `calculateNetRealWealth` - which
 * is how a view comes to re-derive what the engine already knows (sol-023).
 */
function netRealFinal(
	nominal: number,
	investedNominal: number,
	isPostTax: boolean,
	ltcgTaxPct: number,
	inflationRate: number,
	years: number
): number {
	let after = nominal;
	if (isPostTax) {
		const taxableGain = Math.max(0, nominal - investedNominal - LTCG_EXEMPTION);
		after = nominal - taxableGain * (ltcgTaxPct / 100);
	}
	return Math.max(0, after / Math.pow(1 + inflationRate, years));
}

const DEFAULT_SEED = 1234567;
const seedOf = (params: any) =>
	Number(params.seed) > 0 ? Number(params.seed) : DEFAULT_SEED;

function reseed(seed: number) {
	rand = mulberry32(seed);
	hasSpare = false;
}

export function runGoalSeek(params: any) {
	const w = readWorld(params);
	const targetRealWealth = required(params, 'targetRealWealth');
	const inflationRate = Number(params.inflationRate) || 0;
	const ltcgTaxPct = Number.isFinite(Number(params.ltcgTaxPct))
		? Number(params.ltcgTaxPct) : 12.5;
	const isPostTax = !!params.isPostTax;
	const seed = seedOf(params);

	let lowSip = 0;
	let highSip = 10000000;
	const numMiniSims = Number(params.numMiniSims) > 0
		? Number(params.numMiniSims) : 250;

	while (highSip - lowSip > 100) {
		const midSip = (lowSip + highSip) / 2;
		const finalRealValues = new Float64Array(numMiniSims);

		// Every candidate is evaluated on the SAME market paths. Previously the
		// seed was set once, outside the loop, so each bisection step drew fresh
		// randomness and the objective it was bisecting on moved underneath it -
		// a search can walk the wrong way on a coin flip. swpAdvice fixed this
		// for the planner's remedy search with a fixed SEARCH_SEED; this is the
		// same fix. It makes required-SIP a clean monotonic function of the goal,
		// which is what the test asserting monotonicity was hoping for.
		reseed(seed);

		const cost = contributions(w, midSip, inflationRate);
		for (let s = 0; s < numMiniSims; s++) {
			const portBal = simulatePath(w, midSip, null);
			finalRealValues[s] = netRealFinal(
				portBal, cost.nominal, isPostTax, ltcgTaxPct, inflationRate, w.horizonYears
			);
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
	const w = readWorld(params);
	const { horizonYears, bsEnabled } = w;
	const monthlySip = Number(params.monthlySip) || 0;
	const inflationRate = Number(params.inflationRate) || 0;
	const ltcgTaxPct = Number.isFinite(Number(params.ltcgTaxPct))
		? Number(params.ltcgTaxPct) : 12.5;
	const isPostTax = !!params.isPostTax;
	// Optional. When present the engine reports how often the plan actually got
	// there, which is the one number the Answer is built on.
	const targetRealWealth = Number(params.targetRealWealth) > 0
		? Number(params.targetRealWealth) : null;

	const seed = seedOf(params);
	reseed(seed);

	// Injectable so tests can run a smaller sweep. Production callers omit it.
	const numSims = Number(params.numSims) > 0 ? Number(params.numSims) : 10000;

	const cost = contributions(w, monthlySip, inflationRate);
	const realOutflowPV = cost.realPV;
	const nominalTotalInvested = cost.nominal;

	const yearlyPathsNominal = Array.from({ length: horizonYears + 1 }, () => new Float64Array(numSims));

	// Cumulative premium paid and floor payout received, per path per year.
	// Collected only when hedging is on, because they are all zero otherwise.
	const wantLedger = !!bsEnabled;
	const cumPremium = wantLedger
		? Array.from({ length: horizonYears + 1 }, () => new Float64Array(numSims)) : null;
	const cumPayout = wantLedger
		? Array.from({ length: horizonYears + 1 }, () => new Float64Array(numSims)) : null;
	const bindingYears = new Float64Array(wantLedger ? numSims : 0);

	for (let s = 0; s < numSims; s++) {
		let runningPremium = 0;
		let runningPayout = 0;
		simulatePath(
			w, monthlySip,
			(yr, balance, premiumPaid, floorPayout) => {
				yearlyPathsNominal[yr][s] = balance;
				if (cumPremium && cumPayout) {
					runningPremium += premiumPaid;
					runningPayout += floorPayout;
					cumPremium[yr][s] = runningPremium;
					cumPayout[yr][s] = runningPayout;
					if (floorPayout > 0) bindingYears[s]++;
				}
			}
		);
	}

	// The unhedged twin, on the SAME paths. Running it here rather than asking
	// the page for a second call is the point of sol-023: the comparison the
	// ledger shows is then the engine's own, computed against identical market
	// draws, and cannot drift from the hedged figures beside it.
	const unhedgedP50Nominal: number[] | null = wantLedger ? [] : null;
	if (unhedgedP50Nominal) {
		reseed(seed);
		const twin = Array.from({ length: horizonYears + 1 }, () => new Float64Array(numSims));
		for (let s = 0; s < numSims; s++) {
			simulatePath(
				w, monthlySip,
				(yr, balance) => { twin[yr][s] = balance; },
				{ bsEnabled: false, annualHedgingDragCost: 0 }
			);
		}
		for (let yr = 0; yr <= horizonYears; yr++) {
			const sorted = Array.from(twin[yr]).sort((a, b) => a - b);
			unhedgedP50Nominal.push(Math.round(sorted[Math.floor(numSims * 0.50)] || 0));
		}
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

	// The ledger, in today's money, straight from the simulation above.
	let hedging = null;
	if (cumPremium && cumPayout && unhedgedP50Nominal) {
		const median = (arr: Float64Array) => {
			const sorted = Array.from(arr).sort((a, b) => a - b);
			return sorted[Math.floor(numSims * 0.50)] || 0;
		};
		const premiumPaidReal = [];
		const floorPayoutReal = [];
		const unhedgedReal = [];
		for (let yr = 0; yr <= horizonYears; yr++) {
			const discount = Math.pow(1 + inflationRate, yr);
			premiumPaidReal.push(Math.round(median(cumPremium[yr]) / discount));
			floorPayoutReal.push(Math.round(median(cumPayout[yr]) / discount));
			unhedgedReal.push(Math.round(unhedgedP50Nominal[yr] / discount));
		}
		hedging = {
			/** Cumulative premium paid by the median path, in today's money. */
			premiumPaidReal,
			/** Cumulative floor payout received by the median path, today's money. */
			floorPayoutReal,
			/** The same paths without the hedge, median, in today's money. */
			unhedgedReal,
			/**
			 * Median number of years, out of the horizon, in which the floor
			 * paid anything. Counted per path and then taken as a median -
			 * NOT read off the median cumulative payout, which rises for
			 * reasons that have nothing to do with any one path's experience.
			 */
			yearsFloorPaid: (() => {
				const sorted = Array.from(bindingYears).sort((a, b) => a - b);
				return sorted[Math.floor(numSims * 0.50)] || 0;
			})(),
		};
	}

	// What the reader actually ends up with, per path, after tax if they asked
	// for it - and how often that cleared the goal.
	//
	// This lives here rather than on the page because the page's own version
	// (`calculateNetRealWealth`) could only reach the three percentile figures.
	// A probability cannot be derived from a percentile: "did you get there" has
	// to be asked of every path, one at a time, and only the engine holds them.
	// The old page therefore had no way to answer the one question a saver
	// arrives with, and so never asked it.
	const finalNominal = yearlyPathsNominal[horizonYears];
	const netReal = new Float64Array(numSims);
	for (let s = 0; s < numSims; s++) {
		netReal[s] = netRealFinal(
			finalNominal[s], nominalTotalInvested, isPostTax, ltcgTaxPct, inflationRate, horizonYears
		);
	}
	const sortedNet = Array.from(netReal).sort((a, b) => a - b);
	const at = (q: number) => sortedNet[Math.floor(numSims * q)] || 0;

	// The tax the TYPICAL path pays, not the average tax across all of them.
	//
	// The average was the obvious thing to compute and it is the wrong number
	// for this screen: it is dragged upwards by the lucky futures with enormous
	// gains, so it does not reconcile with any of the median figures beside it.
	// A reader adding the column up would find it short by lakhs. Because the
	// tax is monotone in the ending balance, the median before tax and the
	// median after tax are the SAME PATH, and the difference between them is
	// exactly what that path paid - so the flow rung's arithmetic closes.
	//
	// Zero, exactly, when the reader is looking at before-tax figures. Deriving
	// it from the gap even then leaves a rupee or two of rounding noise, and a
	// screen reporting "₹1 of tax" on a plan with no tax is the kind of small
	// wrongness that costs a reader their trust in every other figure.
	const grossMedianReal = p50Real[horizonYears] ?? 0;
	const taxPaidReal = isPostTax ? Math.max(0, grossMedianReal - at(0.50)) : 0;
	const reached = targetRealWealth === null
		? null
		: sortedNet.filter((v) => v >= targetRealWealth).length / numSims;

	// The same quantity at every year: what you would keep, in today's money,
	// if you sold up that year. One frame for the whole ladder (dd-004) - the
	// alternative was a headline stated after tax sitting beside a reach-year
	// read off a before-tax curve, which is two number systems on one screen
	// with nothing saying so.
	//
	// Identical to the gross curve when the reader is looking at pre-tax
	// figures, and computed only when it is not, because then it is free.
	let p50RealNet = p50Real;
	if (isPostTax) {
		p50RealNet = [];
		const perPath = new Float64Array(numSims);
		for (let yr = 0; yr <= horizonYears; yr++) {
			const basis = cost.nominalByYear[yr] ?? nominalTotalInvested;
			for (let s = 0; s < numSims; s++) {
				perPath[s] = netRealFinal(
					yearlyPathsNominal[yr][s], basis, true, ltcgTaxPct, inflationRate, yr
				);
			}
			const sorted = Array.from(perPath).sort((a, b) => a - b);
			p50RealNet.push(Math.round(sorted[Math.floor(numSims * 0.50)] || 0));
		}
	}

	const final = {
		/**
		 * Median wealth in today's money at each year end, after the tax that
		 * would be due on selling up that year. The lived question is "when do I
		 * get there", and it is asked of this (dd-010).
		 */
		p50RealNet,
		/** Ending wealth in today's money, after tax when post-tax is on. */
		realNet: { p10: Math.round(at(0.10)), p50: Math.round(at(0.50)), p90: Math.round(at(0.90)) },
		/** Share of futures that finished at or above the goal, 0..1. Null with no goal. */
		reachedTarget: reached,
		/**
		 * What the median path pays in tax on selling up, in today's money.
		 * Defined as the gap between that path's before-tax and after-tax
		 * value, so it reconciles with every other figure on the screen.
		 */
		taxPaidReal: Math.round(taxPaidReal),
		/** The same, in the rupees of the final year. */
		taxPaidNominal: Math.round(taxPaidReal * Math.pow(1 + inflationRate, horizonYears)),
		/** Ending wealth BEFORE that tax, today's money - the flow rung's top line. */
		grossRealFinal: Math.round(grossMedianReal),
		/** Restated so every consumer reads the goal the engine actually used. */
		targetRealWealth,
		isPostTax,
	};

	return {
		hedging,
		final,
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
