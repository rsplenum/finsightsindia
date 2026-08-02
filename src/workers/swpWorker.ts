/**
 * SWP Monte Carlo Simulation Web Worker
 * Performs 10,000 trial stochastic simulations for Systematic Withdrawal Plans
 * using the Capital Buffer & Target Restoration Dynamic Guardrails Architecture.
 */

self.onmessage = function (e) {
  const data = e.data || {};

  // Extract parameters with robust defaults
  const initialCorpus = Number(data.initialCorpus) || 10000000;
  const monthlyWithdrawal = Number(data.monthlyWithdrawal) || 50000;
  const annualStepUp = Number(data.annualStepUp) || 5; // %
  const expectedReturn = Number(data.expectedReturn) || 12; // %
  const annualVolatility = Number(data.annualVolatility) || 15; // %
  const expectedInflation = Number(data.expectedInflation) || 6; // %
  const ltcgTax = Number(data.ltcgTax) || 12.5; // %
  const horizonYears = Number(data.horizonYears) || 30;
  const numSimulations = Number(data.numSimulations) || 10000;
  const useGuardrails = Boolean(data.useGuardrails);
  
  // Black-Scholes Hedging Params
  const bsEnabled = Boolean(data.bsEnabled);
  const hedgingDragCost = Number(data.hedgingDragCost) || 1.85; // %
  const hedgingFloorLimit = Number(data.hedgingFloorLimit) || -10; // %

  // Rate conversions
  const mu = expectedReturn / 100;
  const sigma = annualVolatility / 100;
  const taxRate = ltcgTax / 100;
  const dragCost = hedgingDragCost / 100;
  const floorLimit = hedgingFloorLimit / 100;

  // Compounded annual escalation factor: (1 + expectedInflation/100) * (1 + annualStepUp/100)
  const escalationFactor = (1 + expectedInflation / 100) * (1 + annualStepUp / 100);

  // 1. PRE-LOOP INITIALIZATION
  const startingPaycheck = monthlyWithdrawal;
  const initialAnnualWithdrawal = startingPaycheck * 12;
  const initialWithdrawalRate = initialCorpus > 0 ? initialAnnualWithdrawal / initialCorpus : 0;
  const maxSafeWithdrawalRate = initialWithdrawalRate * 1.20;

  const yearsCount = horizonYears + 1;
  const yearlyBalancesMatrix = Array.from({ length: yearsCount }, () => new Float64Array(numSimulations));
  const yearlyWithdrawalsMatrix = Array.from({ length: yearsCount }, () => new Float64Array(numSimulations));
  const yearlyTaxesMatrix = Array.from({ length: yearsCount }, () => new Float64Array(numSimulations));
  const yearlyMonthlyPaychecksMatrix = Array.from({ length: yearsCount }, () => new Float64Array(numSimulations));

  const trialLowestPaychecks = new Float64Array(numSimulations);
  const trialSacrifices = new Float64Array(numSimulations);
  const trialRockBottoms = new Float64Array(numSimulations);

  // Initialize Year 0 balances
  for (let i = 0; i < numSimulations; i++) {
    yearlyBalancesMatrix[0][i] = initialCorpus;
    yearlyWithdrawalsMatrix[0][i] = 0;
    yearlyTaxesMatrix[0][i] = 0;
    yearlyMonthlyPaychecksMatrix[0][i] = startingPaycheck;
    trialLowestPaychecks[i] = startingPaycheck;
    trialSacrifices[i] = 0;
    trialRockBottoms[i] = startingPaycheck;
  }

  let successfulTrials = 0;
  let totalTaxCollectedAllTrials = 0;
  let totalWithdrawalsPaidAllTrials = 0;

  // Store a sample set of paths for UI visualization (first 10 paths)
  const samplePathCount = Math.min(10, numSimulations);
  const samplePaths = Array.from({ length: samplePathCount }, () => new Float64Array(yearsCount));
  for (let s = 0; s < samplePathCount; s++) {
    samplePaths[s][0] = initialCorpus;
  }

  // Box-Muller transform generator for standard normal N(0, 1)
  function getRandomNormal() {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  // 2. THE YEARLY TIME-SERIES SIMULATION LOOP
  for (let sim = 0; sim < numSimulations; sim++) {
    let currentBalance = initialCorpus;
    let costBasis = initialCorpus;
    let trialLowestPaycheck = startingPaycheck;
    let trialMinPurchasingPower = 1.0;
    let trialIdealGross = 0;
    let trialActualGross = 0;
    let trialFailed = false;
    let trialTotalTax = 0;
    let trialTotalWithdrawals = 0;

    for (let year = 1; year <= horizonYears; year++) {
      if (trialFailed || currentBalance <= 0) {
        yearlyBalancesMatrix[year][sim] = 0;
        yearlyWithdrawalsMatrix[year][sim] = 0;
        yearlyTaxesMatrix[year][sim] = 0;
        yearlyMonthlyPaychecksMatrix[year][sim] = 0;
        if (sim < samplePathCount) {
          samplePaths[sim][year] = 0;
        }
        continue;
      }

      const idealAnnualPaycheck = initialAnnualWithdrawal * Math.pow(escalationFactor, year - 1);
      const idealMonthlyPaycheck = idealAnnualPaycheck / 12;
      const requiredCapitalBuffer = maxSafeWithdrawalRate > 0 ? idealAnnualPaycheck / maxSafeWithdrawalRate : 0;

      let actualAnnualPaycheck;
      if (useGuardrails && currentBalance < requiredCapitalBuffer && maxSafeWithdrawalRate > 0) {
        actualAnnualPaycheck = currentBalance * maxSafeWithdrawalRate;
      } else {
        actualAnnualPaycheck = idealAnnualPaycheck;
      }

      const currentMonthlyPaycheck = actualAnnualPaycheck / 12;
      yearlyMonthlyPaychecksMatrix[year][sim] = currentMonthlyPaycheck;

      trialIdealGross += idealAnnualPaycheck;

      if (currentBalance > 0) {
        trialLowestPaycheck = Math.min(trialLowestPaycheck, currentMonthlyPaycheck);
        const retentionRatio = idealMonthlyPaycheck > 0 ? currentMonthlyPaycheck / idealMonthlyPaycheck : 1.0;
        trialMinPurchasingPower = Math.min(trialMinPurchasingPower, retentionRatio);
      }

      let randomReturn = mu + sigma * getRandomNormal();
      if (bsEnabled) {
          randomReturn = Math.max(floorLimit, randomReturn) - dragCost;
      }
      const grownBalance = currentBalance * (1 + randomReturn);

      const capitalGain = Math.max(0, grownBalance - costBasis);
      const gainRatio = grownBalance > 0 ? capitalGain / grownBalance : 0;

      const intendedWithdrawal = actualAnnualPaycheck;
      const actualWithdrawal = Math.min(intendedWithdrawal, grownBalance);
      trialActualGross += actualWithdrawal;

      if (actualWithdrawal <= 0) {
        yearlyBalancesMatrix[year][sim] = 0;
        yearlyWithdrawalsMatrix[year][sim] = 0;
        yearlyTaxesMatrix[year][sim] = 0;
        yearlyMonthlyPaychecksMatrix[year][sim] = 0;
        currentBalance = 0;
        costBasis = 0;
        trialFailed = true;
        continue;
      }

      const gainPortionInWithdrawal = actualWithdrawal * gainRatio;
      const principalPortionInWithdrawal = actualWithdrawal * (1 - gainRatio);
      const ltcgTaxAmount = gainPortionInWithdrawal * taxRate;

      yearlyWithdrawalsMatrix[year][sim] = actualWithdrawal;
      yearlyTaxesMatrix[year][sim] = ltcgTaxAmount;

      const totalOutflow = actualWithdrawal + ltcgTaxAmount;

      if (grownBalance < totalOutflow) {
        currentBalance = 0;
        costBasis = 0;
        trialFailed = true;
        yearlyBalancesMatrix[year][sim] = 0;
      } else {
        currentBalance = grownBalance - totalOutflow;
        costBasis = Math.max(0, costBasis - principalPortionInWithdrawal);
        yearlyBalancesMatrix[year][sim] = currentBalance;
        
        trialTotalTax += ltcgTaxAmount;
        trialTotalWithdrawals += actualWithdrawal;
      }

      if (sim < samplePathCount) {
        samplePaths[sim][year] = currentBalance;
      }
    }

    if (!trialFailed && currentBalance > 0) {
      successfulTrials++;
    }

    const trialSacrifice = trialIdealGross - trialActualGross;
    const trialRockBottomRealValue = Math.round(startingPaycheck * trialMinPurchasingPower);

    trialLowestPaychecks[sim] = trialLowestPaycheck;
    trialSacrifices[sim] = trialSacrifice;
    trialRockBottoms[sim] = trialRockBottomRealValue;

    totalTaxCollectedAllTrials += trialTotalTax;
    totalWithdrawalsPaidAllTrials += trialTotalWithdrawals;
  }

  const probabilityOfSuccess = Number(((successfulTrials / numSimulations) * 100).toFixed(2));

  const years = [];
  const p10 = [];
  const p25 = [];
  const p50 = [];
  const p75 = [];
  const p90 = [];
  const medianWithdrawals = [0];
  const medianTaxes = [0];
  const idealPaycheckTimeline = [];
  const actualPaycheckTimeline = [];

  const idx10 = Math.floor(0.10 * (numSimulations - 1));
  const idx25 = Math.floor(0.25 * (numSimulations - 1));
  const idx50 = Math.floor(0.50 * (numSimulations - 1));
  const idx75 = Math.floor(0.75 * (numSimulations - 1));
  const idx90 = Math.floor(0.90 * (numSimulations - 1));

  let idealPaycheckRunner = startingPaycheck;

  for (let year = 0; year <= horizonYears; year++) {
    years.push(year);

    const yearBalances = Array.from(yearlyBalancesMatrix[year]).sort((a, b) => a - b);

    p10.push(Math.round(yearBalances[idx10]));
    p25.push(Math.round(yearBalances[idx25]));
    p50.push(Math.round(yearBalances[idx50]));
    p75.push(Math.round(yearBalances[idx75]));
    p90.push(Math.round(yearBalances[idx90]));

    if (year === 0) {
      idealPaycheckTimeline.push(Math.round(startingPaycheck));
      actualPaycheckTimeline.push(Math.round(startingPaycheck));
    } else {
      if (year > 1) {
        idealPaycheckRunner = idealPaycheckRunner * escalationFactor;
      }
      idealPaycheckTimeline.push(Math.round(idealPaycheckRunner));

      const yearPaychecks = Array.from(yearlyMonthlyPaychecksMatrix[year]).sort((a, b) => a - b);
      actualPaycheckTimeline.push(Math.round(yearPaychecks[idx50]));

      const yearWithdrawals = Array.from(yearlyWithdrawalsMatrix[year]).sort((a, b) => a - b);
      const yearTaxes = Array.from(yearlyTaxesMatrix[year]).sort((a, b) => a - b);

      medianWithdrawals.push(Math.round(yearWithdrawals[idx50]));
      medianTaxes.push(Math.round(yearTaxes[idx50]));
    }
  }

  const sortedLowestPaychecks = Array.from(trialLowestPaychecks).sort((a, b) => a - b);
  const sortedSacrifices = Array.from(trialSacrifices).sort((a, b) => a - b);
  const sortedRockBottoms = Array.from(trialRockBottoms).sort((a, b) => a - b);

  const lowestMonthlyPaycheck = Math.round(sortedLowestPaychecks[idx50]);
  const lifestyleSacrificeAmount = Math.round(sortedSacrifices[idx50]);
  const rockBottomRealValue = Math.round(sortedRockBottoms[idx50]);

  const plainSamplePaths = samplePaths.map((arr) => Array.from(arr).map((v) => Math.round(v)));

  self.postMessage({
    years,
    p10,
    p25,
    p50,
    p75,
    p90,
    medianWithdrawals,
    medianTaxes,
    idealPaycheckTimeline,
    actualPaycheckTimeline,
    probabilityOfSuccess,
    medianFinalBalance: p50[p50.length - 1],
    p10FinalBalance: p10[p10.length - 1],
    p90FinalBalance: p90[p90.length - 1],
    avgTotalWithdrawals: Math.round(totalWithdrawalsPaidAllTrials / numSimulations),
    avgTotalTaxPaid: Math.round(totalTaxCollectedAllTrials / numSimulations),
    lowestMonthlyPaycheck,
    lifestyleSacrificeAmount,
    rockBottomRealValue,
    useGuardrails,
    bsEnabled,
    dragCostPercent: dragCost,
    floorLimit,
    samplePaths: plainSamplePaths,
    numSimulations,
  });
};
