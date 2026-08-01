// sipWorker.ts
function getRandomNormal() {
	let u1 = 0, u2 = 0;
	while (u1 === 0) u1 = Math.random();
	while (u2 === 0) u2 = Math.random();
	return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
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

	const monthlyFloor = -0.08 / 12;
	const sqrt12 = Math.sqrt(12);

	const eqDrift = (0.12 - 0.5 * 0.15 * 0.15) / 12;
	const debtDrift = (0.071 - 0.5 * 0.02 * 0.02) / 12;
	const goldDrift = (0.085 - 0.5 * 0.10 * 0.10) / 12;

	let lowSip = 0;
	let highSip = 10000000;
	const numMiniSims = 250;

	while (highSip - lowSip > 100) {
		let midSip = (lowSip + highSip) / 2;
		const finalRealValues = new Float64Array(numMiniSims);

		let totalInvested = seedCapital;
		let projectedSip = midSip;
		let globalMonth = 0;
		for (let yr = 1; yr <= horizonYears; yr++) {
			if (yr > 1) { projectedSip = projectedSip * (1 + stepUpRate); }
			for (let m = 1; m <= 12; m++) {
				globalMonth++;
				totalInvested += projectedSip / Math.pow(1 + inflationRate, globalMonth / 12);
			}
		}

		for (let s = 0; s < numMiniSims; s++) {
			let portBal = seedCapital;
			let currentSip = midSip;
			for (let yr = 1; yr <= horizonYears; yr++) {
				if (yr > 1) { currentSip = currentSip * (1 + stepUpRate); }
				for (let m = 1; m <= 12; m++) {
					portBal += currentSip;

					let rEqM = Math.exp(eqDrift + (0.15 / sqrt12) * getRandomNormal()) - 1;
					if (bsEnabled) { rEqM = Math.max(monthlyFloor, rEqM) - (annualHedgingDragCost / 12); }
					
					const rDebtM = Math.exp(debtDrift + (0.02 / sqrt12) * getRandomNormal()) - 1;
					const rGoldM = Math.exp(goldDrift + (0.10 / sqrt12) * getRandomNormal()) - 1;
					
					const portReturn = (eqPct * rEqM) + (debtPct * rDebtM) + (goldPct * rGoldM);
					portBal = portBal * (1 + portReturn);
				}
			}
			let realWealth = portBal / Math.pow(1 + inflationRate, horizonYears);
			if (isPostTax) {
				realWealth = realWealth - Math.max(0, (realWealth - totalInvested - 125000) * 0.125);
			}
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

	const numSims = 2000;
	const sqrt12 = Math.sqrt(12);

	let realOutflowPV = seedCapital;
	let projectedSip = monthlySip;
	let globalMonthCounter = 0;
	for (let yr = 1; yr <= horizonYears; yr++) {
		if (yr > 1) { projectedSip = projectedSip * (1 + stepUpRate); }
		for (let m = 1; m <= 12; m++) {
			globalMonthCounter++;
			realOutflowPV += projectedSip / Math.pow(1 + inflationRate, globalMonthCounter / 12);
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

				const eqDrift = (0.12 - 0.5 * 0.15 * 0.15) / 12;
				const eqVol = (0.15 / sqrt12) * getRandomNormal();
				let rEqM = Math.exp(eqDrift + eqVol) - 1;

				if (bsEnabled) {
					const monthlyFloor = -0.08 / 12;
					rEqM = Math.max(monthlyFloor, rEqM) - (annualHedgingDragCost / 12);
				}

				const debtDrift = (0.071 - 0.5 * 0.02 * 0.02) / 12;
				const debtVol = (0.02 / sqrt12) * getRandomNormal();
				const rDebtM = Math.exp(debtDrift + debtVol) - 1;

				const goldDrift = (0.085 - 0.5 * 0.10 * 0.10) / 12;
				const goldVol = (0.10 / sqrt12) * getRandomNormal();
				const rGoldM = Math.exp(goldDrift + goldVol) - 1;

				const portMonthlyReturn = (eqPct * rEqM) + (debtPct * rDebtM) + (goldPct * rGoldM);
				portBal = portBal * (1 + portMonthlyReturn);
			}

			yearlyPathsNominal[yr][s] = Math.max(0, portBal);
		}
	}

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

		const discount = Math.pow(1 + inflationRate, yr);

		p10Real.push(Math.round(nom10 / discount));
		p50Real.push(Math.round(nom50 / discount));
		p90Real.push(Math.round(nom90 / discount));
	}

	return {
		p90Real,
		p50Real,
		p10Real,
		realOutflowPV,
		expectedNominalMedian
	};
}
