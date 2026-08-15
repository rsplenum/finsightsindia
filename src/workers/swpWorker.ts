/**
 * SWP Monte Carlo Simulation Web Worker
 * Performs 10,000 trial stochastic simulations for Systematic Withdrawal Plans
 * using the Capital Buffer & Target Restoration Dynamic Guardrails Architecture.
 */

/**
 * Run the Monte Carlo simulation.
 *
 * Exported as a plain function so it can be tested without a worker runtime.
 * Previously all of this lived inside `self.onmessage`, which made 300 lines
 * of simulation logic unreachable by any test - and this is the code that
 * produces the headline survival score.
 */
export function runSWPMonteCarlo(data: any = {}) {

  // `Number(x) || fallback` treats a deliberate 0 as a missing value, because 0
  // is falsy. Every numeric input here was affected: setting Market Volatility
  // to 0 silently ran at 15%, and setting Lifestyle Step-Up to 0 silently ran
  // at 5% - even though the input's own tooltip instructs "Set to 0 to simply
  // maintain purchasing power". Following the app's instruction produced an
  // escalation the user had explicitly declined, and made the headline
  // disagree with the year-by-year table, which reads its inputs correctly.
  const num = (v: any, fallback: number): number => {
    if (v === undefined || v === null || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // Extract parameters with robust defaults
  const initialCorpus = num(data.initialCorpus, 10000000);
  const monthlyWithdrawal = num(data.monthlyWithdrawal, 50000);
  const annualStepUp = num(data.annualStepUp, 5); // %
  const expectedReturn = num(data.expectedReturn, 12); // %
  const annualVolatility = num(data.annualVolatility, 15); // %
  const expectedInflation = num(data.expectedInflation, 6); // %
  const ltcgTax = num(data.ltcgTax, 12.5); // %
  const horizonYears = Math.max(1, num(data.horizonYears, 30));
  const numSimulations = Math.max(1, num(data.numSimulations, 10000));
  const useGuardrails = Boolean(data.useGuardrails);
  
  // Black-Scholes Hedging Params
  const bsEnabled = Boolean(data.bsEnabled);
  const hedgingDragCost = num(data.hedgingDragCost, 1.85); // %
  const hedgingFloorLimit = num(data.hedgingFloorLimit, -10); // %

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

  // Seeded PRNG, matching sipWorker. This used to call Math.random() directly,
  // which meant the survival score changed on every page refresh - the same
  // inputs would report 22.79% and then 22.6%, which reads as the tool being
  // unsure of itself. It also made the result impossible to assert in a test.
  // Callers may pass `seed` to explore a different draw deliberately.
  function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(Number(data.seed) || 1234567);

  // Box-Muller transform generator for standard normal N(0, 1)
  function getRandomNormal() {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = rand();
    while (u2 === 0) u2 = rand();
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

      // A withdrawal of zero has two very different causes and they were being
      // treated identically. If the portfolio is gone, the trial has failed.
      // If the user simply asked for nothing, the corpus should just keep
      // compounding - that is a plan that trivially survives, not one that
      // collapsed. Conflating them made survival at a zero withdrawal report
      // 0%, which is how the "spend less" remedy search first surfaced this.
      if (grownBalance <= 0) {
        yearlyBalancesMatrix[year][sim] = 0;
        yearlyWithdrawalsMatrix[year][sim] = 0;
        yearlyTaxesMatrix[year][sim] = 0;
        yearlyMonthlyPaychecksMatrix[year][sim] = 0;
        currentBalance = 0;
        costBasis = 0;
        trialFailed = true;
        continue;
      }

      if (actualWithdrawal <= 0) {
        yearlyBalancesMatrix[year][sim] = grownBalance;
        yearlyWithdrawalsMatrix[year][sim] = 0;
        yearlyTaxesMatrix[year][sim] = 0;
        yearlyMonthlyPaychecksMatrix[year][sim] = 0;
        currentBalance = grownBalance;
        if (sim < samplePathCount) samplePaths[sim][year] = currentBalance;
        continue;
      }

      const gainPortionInWithdrawal = actualWithdrawal * gainRatio;
      const principalPortionInWithdrawal = actualWithdrawal * (1 - gainRatio);
      const ltcgTaxAmount = gainPortionInWithdrawal * taxRate;

      yearlyWithdrawalsMatrix[year][sim] = actualWithdrawal;
      yearlyTaxesMatrix[year][sim] = ltcgTaxAmount;

      // Gross paycheck out; LTCG comes out of it, not on top of it. Must stay
      // identical to runDeterministicSWP - if these two drift, the headline
      // survival score stops matching the year-by-year table beneath it.
      const totalOutflow = actualWithdrawal;

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

  // Statistical Diagnostics on Final Balances
  const finalBalances = Array.from(yearlyBalancesMatrix[horizonYears]);
  let sum = 0;
  for (let i = 0; i < numSimulations; i++) {
      sum += finalBalances[i];
  }
  const meanFinalBalance = sum / numSimulations;

  let sumSqDiff = 0;
  let sumCubeDiff = 0;
  for (let i = 0; i < numSimulations; i++) {
      const diff = finalBalances[i] - meanFinalBalance;
      sumSqDiff += diff * diff;
      sumCubeDiff += diff * diff * diff;
  }
  const variance = sumSqDiff / numSimulations;
  const stdDevFinalBalance = Math.sqrt(variance);
  const skewnessFinalBalance = stdDevFinalBalance > 0 ? (sumCubeDiff / numSimulations) / Math.pow(stdDevFinalBalance, 3) : 0;

  return {
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
    diagnostics: {
      meanFinalBalance,
      stdDevFinalBalance,
      skewnessFinalBalance
    }
  };
}

// Worker entry point, kept deliberately thin. All logic lives in the exported
// function above; this only moves data across the worker boundary. Guarded so
// the module can be imported in a plain Node/vitest context where `self` does
// not exist.
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = function (e) {
    self.postMessage(runSWPMonteCarlo(e.data || {}));
  };
}
