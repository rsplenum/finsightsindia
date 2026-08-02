export function calculateIndiaTaxEngine(grossSalary, userDeductions) {
    // NEW TAX REGIME (FY 2025-26)
    const newStdDed = 75000;
    const newTaxableIncome = Math.max(0, grossSalary - newStdDed);
    let newTax = 0;

    if (newTaxableIncome <= 400000) {
        newTax = 0;
    } else if (newTaxableIncome <= 800000) {
        newTax = (newTaxableIncome - 400000) * 0.05;
    } else if (newTaxableIncome <= 1200000) {
        newTax = (400000 * 0.05) + (newTaxableIncome - 800000) * 0.10;
    } else if (newTaxableIncome <= 1600000) {
        newTax = (400000 * 0.05) + (400000 * 0.10) + (newTaxableIncome - 1200000) * 0.15;
    } else if (newTaxableIncome <= 2000000) {
        newTax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (newTaxableIncome - 1600000) * 0.20;
    } else if (newTaxableIncome <= 2400000) {
        newTax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (400000 * 0.20) + (newTaxableIncome - 2000000) * 0.25;
    } else {
        newTax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (400000 * 0.20) + (400000 * 0.25) + (newTaxableIncome - 2400000) * 0.30;
    }

    // Sec 87A Rebate for New Regime (Taxable Income <= ₹12 Lakh has 100% tax rebate)
    if (newTaxableIncome <= 1200000) {
        newTax = 0;
    }

    // Add 4% Cess
    newTax = Math.round(newTax * 1.04);

    // OLD TAX REGIME (FY 2025-26)
    const oldStdDed = 50000;
    const oldTaxableIncome = Math.max(0, grossSalary - oldStdDed - userDeductions);
    let oldTax = 0;

    if (oldTaxableIncome <= 250000) {
        oldTax = 0;
    } else if (oldTaxableIncome <= 500000) {
        oldTax = (oldTaxableIncome - 250000) * 0.05;
    } else if (oldTaxableIncome <= 1000000) {
        oldTax = (250000 * 0.05) + (oldTaxableIncome - 500000) * 0.20;
    } else {
        oldTax = (250000 * 0.05) + (500000 * 0.20) + (oldTaxableIncome - 1000000) * 0.30;
    }

    // Sec 87A rebate for old regime
    if (oldTaxableIncome <= 500000) {
        oldTax = 0; 
    }

    // Add 4% Cess
    oldTax = Math.round(oldTax * 1.04);

    return {
        newTax,
        oldTax,
        newEffectiveRate: grossSalary > 0 ? ((newTax / grossSalary) * 100).toFixed(1) : '0.0',
        oldEffectiveRate: grossSalary > 0 ? ((oldTax / grossSalary) * 100).toFixed(1) : '0.0',
        savingsAmount: Math.abs(newTax - oldTax),
        isNewBetter: newTax < oldTax,
        isOldBetter: oldTax < newTax
    };
}
