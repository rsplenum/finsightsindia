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

self.onmessage = (e) => {
	const { type, params } = e.data;
	
	if (type === 'GOAL_SEEK') {
		const result = runGoalSeek(params);
		self.postMessage({ type: 'GOAL_SEEK_RESULT', result });
	} else if (type === 'SIMULATE') {
		const result = runSimulation(params);
		self.postMessage({ type: 'SIMULATE_RESULT', result });
	}
};

function runGoalSeek(params: any) {
	const {
		targetRealWealth, seedCapital, stepUpRate, horizonYears, inflationRate,
		eqPct, debtPct, goldPct, bsEnabled, annualHedgingDragCost, isPostTax
	} = params;

	// Reset RNG seed for deterministic runs
	rand = mulberry32(1234567);
	hasSpare = false;

	const monthlyFloor = -0.08 / 12;
	const sqrt12 = Math.sqrt(12);

	const eqDrift = (0.12 - 0.5 * 0.15 * 0.15) / 12;
	const debtDrift = (0.071 - 0.5 * 0.02 * 0.02) / 12;
	const goldDrift = (0.085 - 0.5 * 0.10 * 0.10) / 12;

    const eqVolMult = 0.15 / sqrt12;
    const debtVolMult = 0.02 / sqrt12;
    const goldVolMult = 0.10 / sqrt12;

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
			let portBal = seedCapital;
			let currentSip = midSip;
			for (let yr = 1; yr <= horizonYears; yr++) {
				if (yr > 1) { currentSip = currentSip * (1 + stepUpRate); }
				for (let m = 1; m <= 12; m++) {
					portBal += currentSip;

					let rEqM = Math.exp(eqDrift + eqVolMult * getRandomNormal()) - 1;
					if (bsEnabled) { rEqM = Math.max(monthlyFloor, rEqM) - (annualHedgingDragCost / 12); }
					
					const rDebtM = Math.exp(debtDrift + debtVolMult * getRandomNormal()) - 1;
					const rGoldM = Math.exp(goldDrift + goldVolMult * getRandomNormal()) - 1;
					
					const portReturn = (eqPct * rEqM) + (debtPct * rDebtM) + (goldPct * rGoldM);
					portBal = portBal * (1 + portReturn);
				}
			}
			
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

function runSimulation(params: any) {
	const {
		seedCapital, monthlySip, stepUpRate, horizonYears, inflationRate,
		eqPct, debtPct, goldPct, bsEnabled, annualHedgingDragCost
	} = params;

	// Reset RNG seed for deterministic runs
	rand = mulberry32(1234567);
	hasSpare = false;

	const numSims = 10000;
	const sqrt12 = Math.sqrt(12);

    const eqDrift = (0.12 - 0.5 * 0.15 * 0.15) / 12;
    const debtDrift = (0.071 - 0.5 * 0.02 * 0.02) / 12;
    const goldDrift = (0.085 - 0.5 * 0.10 * 0.10) / 12;

    const eqVolMult = 0.15 / sqrt12;
    const debtVolMult = 0.02 / sqrt12;
    const goldVolMult = 0.10 / sqrt12;
    const monthlyFloor = -0.08 / 12;
    const dragMonthly = annualHedgingDragCost / 12;

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
		let portBal = seedCapital;
		let currentSip = monthlySip;

		for (let yr = 1; yr <= horizonYears; yr++) {
			if (yr > 1) { currentSip = currentSip * (1 + stepUpRate); }

			for (let m = 1; m <= 12; m++) {
				portBal += currentSip;

				let rEqM = Math.exp(eqDrift + eqVolMult * getRandomNormal()) - 1;
				if (bsEnabled) {
					rEqM = Math.max(monthlyFloor, rEqM) - dragMonthly;
				}

				const rDebtM = Math.exp(debtDrift + debtVolMult * getRandomNormal()) - 1;
				const rGoldM = Math.exp(goldDrift + goldVolMult * getRandomNormal()) - 1;

				const portMonthlyReturn = (eqPct * rEqM) + (debtPct * rDebtM) + (goldPct * rGoldM);
				portBal = portBal * (1 + portMonthlyReturn);
			}

			yearlyPathsNominal[yr][s] = Math.max(0, portBal);
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
