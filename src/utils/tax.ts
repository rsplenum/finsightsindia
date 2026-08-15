export interface TaxInput {
    grossSalary: number;
    otherIncome: number;
    ageBracket: 'below60' | '60_80' | 'above80';
    
    // HRA details
    basicSalary: number;
    hraReceived: number;
    rentPaid: number;
    isMetro: boolean;
    
    // Deductions (Old Regime)
    sec80c: number;
    sec80d: number;
    sec80ccd1b: number;
    homeLoanInterest: number;
}

export interface SlabDetail {
    range: string;
    rate: string;
    tax: number;
}

export interface TaxRegimeResult {
    grossIncome: number;
    exemptions: number;
    deductions: number;
    standardDeduction: number;
    taxableIncome: number;
    
    slabs: SlabDetail[];
    baseTax: number;
    rebate87A: number;
    surcharge: number;
    marginalRelief: number;
    cess: number;
    totalTax: number;
    
    effectiveRate: string;
}

export interface TaxComparisonResult {
    newRegime: TaxRegimeResult;
    oldRegime: TaxRegimeResult;
    savingsAmount: number;
    isNewBetter: boolean;
    isOldBetter: boolean;
}

// Helper to round to nearest 10 (Section 288A and 288B)
function round10(val: number): number {
    return Math.round(val / 10) * 10;
}

function calculateHRAExemption(input: TaxInput): number {
    if (input.rentPaid <= 0 || input.hraReceived <= 0 || input.basicSalary <= 0) return 0;
    const rule1 = input.hraReceived;
    const rule2 = input.isMetro ? 0.5 * input.basicSalary : 0.4 * input.basicSalary;
    const rule3 = Math.max(0, input.rentPaid - 0.1 * input.basicSalary);
    return Math.min(rule1, rule2, rule3);
}

function computeSurchargeAndRelief(taxableIncome: number, baseTax: number, isNewRegime: boolean): { surcharge: number, relief: number } {
    let surcharge = 0;
    let threshold = 0;
    let surchargeRate = 0;

    if (taxableIncome > 50000000) { // 5 Cr
        threshold = 50000000;
        surchargeRate = isNewRegime ? 0.25 : 0.37;
    } else if (taxableIncome > 20000000) { // 2 Cr
        threshold = 20000000;
        surchargeRate = 0.25;
    } else if (taxableIncome > 10000000) { // 1 Cr
        threshold = 10000000;
        surchargeRate = 0.15;
    } else if (taxableIncome > 5000000) { // 50 L
        threshold = 5000000;
        surchargeRate = 0.10;
    }

    if (surchargeRate === 0) return { surcharge: 0, relief: 0 };

    const rawSurcharge = baseTax * surchargeRate;
    const taxWithSurcharge = baseTax + rawSurcharge;

    // To compute marginal relief, we need the tax at the exact threshold.
    // For simplicity, we re-evaluate the base tax at the threshold here.
    let taxAtThreshold = 0;
    if (isNewRegime) {
        // Evaluate new regime tax at threshold
        taxAtThreshold = computeNewRegimeBaseTax(threshold).baseTax;
    } else {
        // Old regime tax at threshold requires knowing the age, but since threshold >= 50L, 
        // the difference is just a flat amount based on exemption limit.
        // It's safer to let the caller compute this, but we can do a quick calc:
        // Actually, for old regime > 10L, tax is (Income - 10L)*30% + 112500 (or 110000 or 100000)
        // Since threshold >= 50L, we are always in the 30% bracket.
        // The difference in base tax is exactly (taxableIncome - threshold) * 0.30 for old
        // and (taxableIncome - threshold) * 0.30 for new (since threshold >= 24L).
        taxAtThreshold = baseTax - (taxableIncome - threshold) * 0.30;
    }

    // Surcharge at threshold
    let surchargeAtThreshold = 0;
    if (threshold === 50000000) surchargeAtThreshold = taxAtThreshold * 0.25; // Previous tier
    else if (threshold === 20000000) surchargeAtThreshold = taxAtThreshold * 0.15;
    else if (threshold === 10000000) surchargeAtThreshold = taxAtThreshold * 0.10;
    else surchargeAtThreshold = 0;

    const maxTaxAllowed = (taxAtThreshold + surchargeAtThreshold) + (taxableIncome - threshold);

    if (taxWithSurcharge > maxTaxAllowed) {
        const relief = taxWithSurcharge - maxTaxAllowed;
        return { surcharge: rawSurcharge, relief };
    }

    return { surcharge: rawSurcharge, relief: 0 };
}

function computeNewRegimeBaseTax(income: number): { baseTax: number, slabs: SlabDetail[] } {
    let tax = 0;
    const slabs: SlabDetail[] = [];

    const addSlab = (range: string, rate: string, amount: number) => {
        if (amount > 0) slabs.push({ range, rate, tax: amount });
    };

    if (income > 2400000) {
        const t = (income - 2400000) * 0.30;
        tax += 240000 + t; // sum of previous is 2.4L
        addSlab('0 - 4L', '0%', 0);
        addSlab('4L - 8L', '5%', 20000);
        addSlab('8L - 12L', '10%', 40000);
        addSlab('12L - 16L', '15%', 60000);
        addSlab('16L - 20L', '20%', 80000);
        addSlab('20L - 24L', '25%', 100000);
        addSlab('> 24L', '30%', t);
    } else if (income > 2000000) {
        const t = (income - 2000000) * 0.25; tax += 140000 + t;
        addSlab('20L - 24L', '25%', t);
    } else if (income > 1600000) {
        const t = (income - 1600000) * 0.20; tax += 60000 + t;
        addSlab('16L - 20L', '20%', t);
    } else if (income > 1200000) {
        const t = (income - 1200000) * 0.15; tax += 20000 + t;
        addSlab('12L - 16L', '15%', t);
    } else if (income > 800000) {
        const t = (income - 800000) * 0.10; tax += 20000 + t;
        addSlab('8L - 12L', '10%', t);
    } else if (income > 400000) {
        const t = (income - 400000) * 0.05; tax += t;
        addSlab('4L - 8L', '5%', t);
    } else {
        addSlab('0 - 4L', '0%', 0);
    }

    // Re-fill lower slabs if not > 24L but something was added (just for simple visual completion, skipped here for brevity, the UI can handle it or we just return the highest populated slab).
    // Actually, building from bottom up is better for the UI array.
    const fullSlabs: SlabDetail[] = [];
    let rem = income;
    const limits = [400000, 400000, 400000, 400000, 400000, 400000, Infinity];
    const rates = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
    const labels = ['0 - 4L', '4L - 8L', '8L - 12L', '12L - 16L', '16L - 20L', '20L - 24L', '> 24L'];
    
    let totalTax = 0;
    for (let i = 0; i < limits.length; i++) {
        if (rem <= 0) break;
        const taxableInSlab = Math.min(rem, limits[i]);
        const taxInSlab = taxableInSlab * rates[i];
        totalTax += taxInSlab;
        fullSlabs.push({ range: labels[i], rate: `${rates[i]*100}%`, tax: taxInSlab });
        rem -= taxableInSlab;
    }

    return { baseTax: totalTax, slabs: fullSlabs };
}

function computeOldRegimeBaseTax(income: number, age: string): { baseTax: number, slabs: SlabDetail[] } {
    let exemption = 250000;
    if (age === '60_80') exemption = 300000;
    if (age === 'above80') exemption = 500000;

    const fullSlabs: SlabDetail[] = [];
    let totalTax = 0;
    let rem = income;
    
    // Slab 1: Exemption
    const slab1 = Math.min(rem, exemption);
    fullSlabs.push({ range: `0 - ${(exemption/100000).toFixed(1)}L`, rate: '0%', tax: 0 });
    rem -= slab1;

    // Slab 2: Up to 5L (5%)
    if (rem > 0 && exemption < 500000) {
        const gap = 500000 - exemption;
        const taxable = Math.min(rem, gap);
        const t = taxable * 0.05;
        totalTax += t;
        fullSlabs.push({ range: `${(exemption/100000).toFixed(1)}L - 5L`, rate: '5%', tax: t });
        rem -= taxable;
    }

    // Slab 3: 5L - 10L (20%)
    if (rem > 0) {
        const taxable = Math.min(rem, 500000);
        const t = taxable * 0.20;
        totalTax += t;
        fullSlabs.push({ range: '5L - 10L', rate: '20%', tax: t });
        rem -= taxable;
    }

    // Slab 4: > 10L (30%)
    if (rem > 0) {
        const t = rem * 0.30;
        totalTax += t;
        fullSlabs.push({ range: '> 10L', rate: '30%', tax: t });
    }

    return { baseTax: totalTax, slabs: fullSlabs };
}

export function calculateIndiaTaxEngine(input: TaxInput): TaxComparisonResult {
    const grossIncome = input.grossSalary + input.otherIncome;
    
    // --- NEW REGIME ---
    const newStdDed = input.grossSalary > 0 ? Math.min(input.grossSalary, 75000) : 0;
    const newTaxableIncome = round10(Math.max(0, grossIncome - newStdDed));
    
    const newBase = computeNewRegimeBaseTax(newTaxableIncome);
    let newBaseTax = newBase.baseTax;
    
    // 87A Marginal Relief New Regime (up to 12L)
    let newRebate87A = 0;
    let new87AMarginalRelief = 0;
    if (newTaxableIncome <= 1200000) {
        newRebate87A = newBaseTax;
        newBaseTax = 0;
    } else {
        // Marginal Relief: Tax payable cannot exceed Income - 12L
        const excessIncome = newTaxableIncome - 1200000;
        if (newBaseTax > excessIncome) {
            new87AMarginalRelief = newBaseTax - excessIncome;
            newBaseTax = excessIncome;
        }
    }

    const newSur = computeSurchargeAndRelief(newTaxableIncome, newBaseTax, true);
    const newTaxWithSurcharge = newBaseTax + newSur.surcharge - newSur.relief;
    const newCess = newTaxWithSurcharge * 0.04;
    const newTotalTax = round10(newTaxWithSurcharge + newCess);

    // --- OLD REGIME ---
    const oldStdDed = input.grossSalary > 0 ? Math.min(input.grossSalary, 50000) : 0;
    const hraExemption = calculateHRAExemption(input);
    const sec80c = Math.min(150000, input.sec80c);
    const sec80d = Math.min(100000, input.sec80d); // Cap at 1L max (Senior self + Senior parents)
    const sec80ccd1b = Math.min(50000, input.sec80ccd1b);
    const homeLoan = Math.min(200000, input.homeLoanInterest);
    
    const totalOldExemptions = hraExemption;
    const totalOldDeductions = sec80c + sec80d + sec80ccd1b + homeLoan;
    
    const oldTaxableIncome = round10(Math.max(0, grossIncome - oldStdDed - totalOldExemptions - totalOldDeductions));
    const oldBase = computeOldRegimeBaseTax(oldTaxableIncome, input.ageBracket);
    let oldBaseTax = oldBase.baseTax;
    
    // 87A Old Regime (up to 5L) - No marginal relief by law
    let oldRebate87A = 0;
    if (oldTaxableIncome <= 500000) {
        oldRebate87A = oldBaseTax;
        oldBaseTax = 0;
    }

    const oldSur = computeSurchargeAndRelief(oldTaxableIncome, oldBaseTax, false);
    const oldTaxWithSurcharge = oldBaseTax + oldSur.surcharge - oldSur.relief;
    const oldCess = oldTaxWithSurcharge * 0.04;
    const oldTotalTax = round10(oldTaxWithSurcharge + oldCess);

    return {
        newRegime: {
            grossIncome,
            exemptions: 0,
            deductions: 0,
            standardDeduction: newStdDed,
            taxableIncome: newTaxableIncome,
            slabs: newBase.slabs,
            // Pre-rebate slab tax. The rebate and reliefs are separate line
            // items below, so adding them back here would count them twice
            // and the on-screen breakdown would stop reconciling to totalTax.
            baseTax: newBase.baseTax,
            rebate87A: newRebate87A,
            surcharge: newSur.surcharge,
            marginalRelief: new87AMarginalRelief + newSur.relief,
            cess: newCess,
            totalTax: newTotalTax,
            effectiveRate: grossIncome > 0 ? ((newTotalTax / grossIncome) * 100).toFixed(2) : '0.00'
        },
        oldRegime: {
            grossIncome,
            exemptions: totalOldExemptions,
            deductions: totalOldDeductions,
            standardDeduction: oldStdDed,
            taxableIncome: oldTaxableIncome,
            slabs: oldBase.slabs,
            baseTax: oldBase.baseTax,
            rebate87A: oldRebate87A,
            surcharge: oldSur.surcharge,
            marginalRelief: oldSur.relief,
            cess: oldCess,
            totalTax: oldTotalTax,
            effectiveRate: grossIncome > 0 ? ((oldTotalTax / grossIncome) * 100).toFixed(2) : '0.00'
        },
        savingsAmount: Math.abs(newTotalTax - oldTotalTax),
        isNewBetter: newTotalTax < oldTotalTax,
        isOldBetter: oldTotalTax < newTotalTax
    };
}
