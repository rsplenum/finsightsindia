import { runDeterministicSWP } from '../src/utils/swpDeterministic.js';

const conservativeInput = {
    initialCorpus: 10000000,
    monthlyWithdrawal: 50000,
    annualStepUp: 0,
    expectedReturn: 8,
    expectedInflation: 6,
    ltcgTax: 12.5,
    horizonYears: 10
};

const result = runDeterministicSWP(conservativeInput);

console.log("Conservative SWP Deterministic Verification");
console.log("-----------------------------------------");
console.log("Year 1 Withdrawal:", Math.round(result.withdrawals[1]));
console.log("Year 1 Balance:", Math.round(result.balances[1]));
console.log("Year 1 Tax:", Math.round(result.taxes[1]));
console.log("Year 10 Balance:", Math.round(result.balances[10]));

// Verification values
const expectedYear1Withdrawal = 600000;
const expectedYear1Balance = 10194444; // 1,00,00,000 * 1.08 = 1,08,00,000. Gain = 8,00,000. Gain Ratio = 8/108 = 0.074074. Tax = 6,00,000 * 0.074074 * 0.125 = 5555.55. Net Outflow = 605555.55. Bal = 10194444.44
const expectedYear1Tax = 5556;

if (
    Math.round(result.withdrawals[1]) === expectedYear1Withdrawal &&
    Math.round(result.balances[1]) === expectedYear1Balance &&
    Math.round(result.taxes[1]) === expectedYear1Tax
) {
    console.log("✅ Basic deterministic math verified successfully!");
} else {
    console.error("❌ Deterministic math failed.");
    console.log("Expected Bal:", expectedYear1Balance, "Got:", Math.round(result.balances[1]));
}
