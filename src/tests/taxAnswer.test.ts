import { describe, it, expect } from 'vitest';
import { calculateIndiaTaxEngine, EMPTY_TAX_INPUT, type TaxInput } from '../utils/tax';
import { breakEvenDeductions, buildTaxAnswer, verdictFor } from '../utils/taxAnswer';

const base = EMPTY_TAX_INPUT;
const salary = (grossSalary: number, over: Partial<TaxInput> = {}): TaxInput => ({
    ...base,
    grossSalary,
    ...over,
});

describe('verdictFor - one decision, for every surface to render from', () => {
    // sol-043: the page recommended the LOSING regime. The engine was right the
    // whole time; the emerald colour, the font weight and the DEFAULT/OPTIONAL
    // captions were static classes that had stopped agreeing with it.

    it('names the cheaper regime as the winner, whichever one it is', () => {
        const newWins = verdictFor(calculateIndiaTaxEngine(salary(1500000)));
        expect(newWins.winner).toBe('new');
        expect(newWins.better.totalTax).toBeLessThan(newWins.worse.totalTax);

        const oldWins = verdictFor(
            calculateIndiaTaxEngine(
                salary(1500000, {
                    sec80c: 150000,
                    sec80d: 100000,
                    sec80ccd1b: 50000,
                    basicSalary: 750000,
                    hraReceived: 400000,
                    rentPaid: 500000,
                    houseProperty: {
                        kind: 'selfOccupied',
                        annualRent: 0,
                        municipalTaxes: 0,
                        interest: 200000,
                    },
                })
            )
        );
        expect(oldWins.winner).toBe('old');
        expect(oldWins.better.totalTax).toBeLessThan(oldWins.worse.totalTax);
    });

    it('the winner is ALWAYS the cheaper bill, across a sweep', () => {
        // The assertion sol-043 needed and nobody had written: whatever the
        // inputs, the regime the page will emphasise is the one that costs
        // less. No styling may be decided any other way.
        for (const gross of [300000, 700000, 1275000, 1500000, 3000000, 12000000]) {
            for (const c of [0, 150000]) {
                for (const interest of [0, 200000, 500000]) {
                    const v = verdictFor(
                        calculateIndiaTaxEngine(
                            salary(gross, {
                                sec80c: c,
                                houseProperty: {
                                    kind: 'selfOccupied',
                                    annualRent: 0,
                                    municipalTaxes: 0,
                                    interest,
                                },
                            })
                        )
                    );
                    expect(v.better.totalTax).toBeLessThanOrEqual(v.worse.totalTax);
                    if (v.winner === 'tie') expect(v.saves).toBe(0);
                    else expect(v.saves).toBe(v.worse.totalTax - v.better.totalTax);
                }
            }
        }
    });

    it('a tie is a tie, not a silent win for the default', () => {
        // Two readers with no income at all owe nothing under either regime.
        // The page must not quietly promote the new regime on that basis.
        const v = verdictFor(calculateIndiaTaxEngine(base));
        expect(v.winner).toBe('tie');
        expect(v.saves).toBe(0);
        expect(v.label).toBe('Either regime');
    });
});

describe('breakEvenDeductions - the number the page is really for', () => {
    it('finds the point where the two bills actually meet', () => {
        const input = salary(1500000);
        const be = breakEvenDeductions(input);
        expect(be.exists).toBe(true);
        expect(be.shortfall).toBeGreaterThan(0);

        // The claim is checkable: at the break-even the old regime is no dearer,
        // and a rupee less is not enough. Verified THROUGH the engine, so this
        // cannot drift from the figures the page prints.
        const atBreakEven = calculateIndiaTaxEngine({
            ...input,
            whatIfExtraDeduction: be.shortfall,
        });
        expect(atBreakEven.oldRegime.totalTax).toBeLessThanOrEqual(
            atBreakEven.newRegime.totalTax
        );

        const justUnder = calculateIndiaTaxEngine({
            ...input,
            whatIfExtraDeduction: Math.max(0, be.shortfall - 2),
        });
        expect(justUnder.oldRegime.totalTax).toBeGreaterThan(justUnder.newRegime.totalTax);
    });

    it('is zero when the old regime already wins', () => {
        // Note what it takes: the full Rs 3 lakh of Chapter VI-A is NOT enough
        // at this income - old is 1,63,800 against new's 97,500. It takes the
        // HRA exemption and the home loan on top. Worth pinning, because "max
        // out your 80C and the old regime wins" is exactly the folk belief this
        // number exists to correct.
        const be = breakEvenDeductions(
            salary(1500000, {
                sec80c: 150000,
                sec80d: 100000,
                sec80ccd1b: 50000,
                basicSalary: 750000,
                hraReceived: 400000,
                rentPaid: 500000,
                houseProperty: {
                    kind: 'selfOccupied',
                    annualRent: 0,
                    municipalTaxes: 0,
                    interest: 200000,
                },
            })
        );
        expect(be.shortfall).toBe(0);
        expect(be.required).toBe(be.claimed);
    });

    it('80C alone does not get there at 15 lakh, and says how far short', () => {
        const be = breakEvenDeductions(
            salary(1500000, { sec80c: 150000, sec80d: 100000, sec80ccd1b: 50000 })
        );
        expect(be.exists).toBe(true);
        expect(be.shortfall).toBeGreaterThan(0);
        expect(be.required).toBe(be.claimed + be.shortfall);
    });

    it('reports no crossing when no deduction could ever catch up', () => {
        // Gains only, no slab income. The new regime shelters 4 lakh of basic
        // exemption against the gain and the old regime only 2.5 lakh, so the
        // old bill is permanently higher - and a deduction cannot touch a
        // capital gain, so no amount of relief closes it. Saying "you need
        // Rs X" here would be a lie with a number attached.
        const input: TaxInput = {
            ...base,
            capitalGains: { ...base.capitalGains, ltcg112A: 1000000 },
        };
        const r = calculateIndiaTaxEngine(input);
        expect(r.oldRegime.totalTax).toBeGreaterThan(r.newRegime.totalTax);
        expect(breakEvenDeductions(input).exists).toBe(false);
    });

    it('a crossing DOES exist where the old regime can reach zero too', () => {
        // At 12.75 lakh the new bill is already zero under 87A, which looks
        // like it should be uncatchable - but the old regime has its own
        // rebate, so 7.25 lakh of relief brings it to zero as well. Recorded
        // because I assumed the opposite and the test corrected me.
        const be = breakEvenDeductions(salary(1275000));
        expect(calculateIndiaTaxEngine(salary(1275000)).newRegime.totalTax).toBe(0);
        expect(be.exists).toBe(true);
        expect(be.shortfall).toBeGreaterThan(0);
        const atBe = calculateIndiaTaxEngine({
            ...salary(1275000),
            whatIfExtraDeduction: be.shortfall,
        });
        expect(atBe.oldRegime.totalTax).toBe(0);
    });

    it('counts HRA and the house property set-off as deductions already claimed', () => {
        // What the reader has "claimed" is everything reducing their old-regime
        // bill, not only Chapter VI-A. Counting just 80C would understate it and
        // make the shortfall look larger than it is.
        const be = breakEvenDeductions(
            salary(1500000, {
                sec80c: 150000,
                basicSalary: 750000,
                hraReceived: 300000,
                rentPaid: 240000,
                houseProperty: {
                    kind: 'selfOccupied',
                    annualRent: 0,
                    municipalTaxes: 0,
                    interest: 200000,
                },
            })
        );
        // 1.5L of 80C + 1.65L of HRA + 2L of house property loss
        expect(be.claimed).toBe(150000 + 165000 + 200000);
    });
});

describe('buildTaxAnswer - the lived quantity', () => {
    it('headlines the monthly bite, and it reconciles to the annual bill', () => {
        // dd-010: nobody experiences Rs 97,500 once; they experience the TDS.
        // dd-013/dont-2: and the two figures may never disagree.
        const m = buildTaxAnswer(salary(1500000));
        expect(m.monthly).toBe(Math.round(m.verdict.better.totalTax / 12));
        expect(m.verdict.better.totalTax).toBe(m.result.newRegime.totalTax);
    });

    it('take-home plus tax is the whole income, every time', () => {
        for (const gross of [600000, 1275000, 2500000]) {
            const m = buildTaxAnswer(salary(gross));
            const annualTakeHome = m.takeHomeMonthly * 12;
            const total = annualTakeHome + m.verdict.better.totalTax;
            // within a rupee a month of rounding
            expect(Math.abs(total - m.verdict.better.grossIncome)).toBeLessThanOrEqual(12);
        }
    });
});
