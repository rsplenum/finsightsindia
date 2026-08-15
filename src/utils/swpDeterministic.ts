export interface SWPInputs {
    initialCorpus: number;
    monthlyWithdrawal: number;
    annualStepUp: number;
    expectedReturn: number;
    expectedInflation: number;
    ltcgTax: number;
    horizonYears: number;
    useGuardrails?: boolean;
    hedgingDragCost?: number;
    hedgingFloorLimit?: number;
    bsEnabled?: boolean;
    /**
     * Optional per-year returns, as percentages, indexed from year 1.
     * When supplied these override expectedReturn for that year, which lets a
     * caller hold a set of returns fixed and only change their ORDER - the
     * only way to show that sequence matters while proving the average did
     * not move. Omitted years fall back to expectedReturn.
     */
    returnsByYear?: number[];
}

export interface SWPDeterministicOutput {
    years: number[];
    withdrawals: number[];
    taxes: number[];
    growth: number[];
    balances: number[];
    netMonthly: number[];
}

export function runDeterministicSWP(inputs: SWPInputs): SWPDeterministicOutput {
    const {
        initialCorpus = 10000000,
        monthlyWithdrawal = 50000,
        annualStepUp = 5,
        expectedReturn = 12,
        expectedInflation = 6,
        ltcgTax = 12.5,
        horizonYears = 30,
        useGuardrails = false,
        hedgingDragCost = 1.85,
        hedgingFloorLimit = -10,
        bsEnabled = false,
        returnsByYear
    } = inputs;

    const mu = expectedReturn / 100;
    const taxRate = ltcgTax / 100;
    const dragCost = hedgingDragCost / 100;
    const escalationFactor = (1 + expectedInflation / 100) * (1 + annualStepUp / 100);

    const startingPaycheck = monthlyWithdrawal;
    const initialAnnualWithdrawal = startingPaycheck * 12;
    const initialWithdrawalRate = initialCorpus > 0 ? initialAnnualWithdrawal / initialCorpus : 0;
    const maxSafeWithdrawalRate = initialWithdrawalRate * 1.20;

    let currentBalance = initialCorpus;
    let costBasis = initialCorpus;

    const years = [0];
    const withdrawals = [0];
    const taxes = [0];
    const growth = [0];
    const balances = [initialCorpus];
    const netMonthly = [startingPaycheck];

    for (let year = 1; year <= horizonYears; year++) {
        if (currentBalance <= 0) {
            years.push(year);
            withdrawals.push(0);
            taxes.push(0);
            growth.push(0);
            balances.push(0);
            netMonthly.push(0);
            continue;
        }

        const idealAnnualPaycheck = initialAnnualWithdrawal * Math.pow(escalationFactor, year - 1);
        const requiredCapitalBuffer = maxSafeWithdrawalRate > 0 ? idealAnnualPaycheck / maxSafeWithdrawalRate : 0;

        let actualAnnualPaycheck;
        if (useGuardrails && currentBalance < requiredCapitalBuffer && maxSafeWithdrawalRate > 0) {
            actualAnnualPaycheck = currentBalance * maxSafeWithdrawalRate;
        } else {
            actualAnnualPaycheck = idealAnnualPaycheck;
        }

        // A supplied per-year return wins over the flat assumption, so a
        // caller can permute a fixed set of returns and change nothing else.
        const override = returnsByYear?.[year - 1];
        let currentReturn = (override === undefined || !Number.isFinite(override))
            ? mu
            : override / 100;
        if (bsEnabled) {
            currentReturn = currentReturn - dragCost;
        }
        
        const grownBalance = currentBalance * (1 + currentReturn);
        const yearGrowth = grownBalance - currentBalance;

        const capitalGain = Math.max(0, grownBalance - costBasis);
        const gainRatio = grownBalance > 0 ? capitalGain / grownBalance : 0;

        const actualWithdrawal = Math.min(actualAnnualPaycheck, grownBalance);

        if (actualWithdrawal <= 0) {
            years.push(year);
            withdrawals.push(0);
            taxes.push(0);
            growth.push(yearGrowth);
            balances.push(0);
            netMonthly.push(0);
            currentBalance = 0;
            continue;
        }

        const gainPortionInWithdrawal = actualWithdrawal * gainRatio;
        const principalPortionInWithdrawal = actualWithdrawal * (1 - gainRatio);
        const ltcgTaxAmount = gainPortionInWithdrawal * taxRate;

        // The withdrawal IS the gross paycheck: LTCG is deducted out of it, not
        // levied on top of it. Debiting withdrawal + tax while also reporting
        // net income as withdrawal - tax charged the same tax twice and quietly
        // cost the portfolio ~3 years of runway on the default scenario.
        const totalOutflow = actualWithdrawal;

        let finalBalance = 0;
        if (grownBalance < totalOutflow) {
            finalBalance = 0;
            costBasis = 0;
        } else {
            finalBalance = grownBalance - totalOutflow;
            costBasis = Math.max(0, costBasis - principalPortionInWithdrawal);
        }

        years.push(year);
        withdrawals.push(actualWithdrawal);
        taxes.push(ltcgTaxAmount);
        growth.push(yearGrowth);
        balances.push(finalBalance);
        netMonthly.push(actualWithdrawal > 0 ? (actualWithdrawal - ltcgTaxAmount) / 12 : 0);

        currentBalance = finalBalance;
    }

    return {
        years,
        withdrawals,
        taxes,
        growth,
        balances,
        netMonthly
    };
}
