import { describe, it, expect } from 'vitest';
import {
  calculateIndiaTaxEngine,
  computeHousePropertyIncome,
  EMPTY_TAX_INPUT,
  type TaxInput,
} from '../utils/tax';

// These tests previously called calculateIndiaTaxEngine(income, deductions) and
// read result.newTax / result.oldTax. That signature hasn't existed since the
// engine moved to a TaxInput object, so all three failed with `undefined` and
// the tax engine has effectively been untested. The expected rupee values below
// are the ones the original tests asserted - they were right; only the call was
// stale.
//
// The rupee expectations survived the move to income heads UNCHANGED, which is
// the point of keeping them: `homeLoanInterest` used to be deducted from gross
// total income like a Chapter VI-A item, and is now a self-occupied house
// property loss set off against the other heads. Two different places in the
// Act, the same arithmetic for the simple case - so these tests are the guard
// that the restructure moved the calculation without moving the answer.

const base: TaxInput = EMPTY_TAX_INPUT;

const salary = (grossSalary: number, over: Partial<TaxInput> = {}): TaxInput => ({
  ...base,
  grossSalary,
  ...over,
});

/** A self-occupied home with a loan - the old `homeLoanInterest` field. */
const sop = (interest: number): Partial<TaxInput> => ({
  houseProperty: { kind: 'selfOccupied', annualRent: 0, municipalTaxes: 0, interest },
});

describe('India Tax Engine - totals', () => {
  it('zero tax under the new regime at 12.75L (75k std deduction + 87A rebate)', () => {
    const r = calculateIndiaTaxEngine(salary(1275000));
    expect(r.newRegime.taxableIncome).toBe(1200000);
    expect(r.newRegime.totalTax).toBe(0);
  });

  it('old regime at 10L: 12500 + 90000, +4% cess', () => {
    const r = calculateIndiaTaxEngine(salary(1000000));
    expect(r.oldRegime.taxableIncome).toBe(950000);
    expect(r.oldRegime.totalTax).toBe(106600);
  });

  it('15L with 1.5L of 80C: new regime wins', () => {
    const r = calculateIndiaTaxEngine(salary(1500000, { sec80c: 150000 }));
    expect(r.newRegime.totalTax).toBe(97500);
    expect(r.oldRegime.totalTax).toBe(210600);
    expect(r.isNewBetter).toBe(true);
  });

  it('87A marginal relief caps tax at income over 12L', () => {
    // Taxable 12.25L. Slab tax 63750, but relief caps payable at the 25000 excess.
    const r = calculateIndiaTaxEngine(salary(1300000));
    expect(r.newRegime.taxableIncome).toBe(1225000);
    expect(r.newRegime.totalTax).toBe(26000); // 25000 + 4% cess
  });
});

describe('India Tax Engine - the breakdown must reconcile', () => {
  // The breakdown is what makes the number believable. If the arithmetic a
  // reader can do by hand doesn't land on the headline figure, the calculator
  // is worse than useless - it looks authoritative while being wrong.
  // This caught base tax being double-counted in both regimes: the pre-rebate
  // slab tax had the rebate added back onto it before display.
  const cases: Array<[string, Partial<TaxInput>]> = [
    ['4L salary (under exemption)', { grossSalary: 400000 }],
    ['10L salary', { grossSalary: 1000000 }],
    ['12.75L salary (full 87A rebate)', { grossSalary: 1275000 }],
    ['13L salary (87A marginal relief)', { grossSalary: 1300000 }],
    ['60L salary (10% surcharge)', { grossSalary: 6000000 }],
    ['1.2Cr salary (15% surcharge)', { grossSalary: 12000000 }],
    ['senior citizen, 10L', { grossSalary: 1000000, ageBracket: '60_80' }],
  ];

  for (const [label, over] of cases) {
    for (const regime of ['newRegime', 'oldRegime'] as const) {
      it(`${regime} reconciles: ${label}`, () => {
        const r = calculateIndiaTaxEngine({ ...base, ...over })[regime];
        const reconciled =
          r.baseTax - r.rebate87A - r.marginalRelief + r.surcharge + r.cess;
        // totalTax is rounded to the nearest 10 per s.288B
        expect(Math.abs(reconciled - r.totalTax)).toBeLessThanOrEqual(5);
      });
    }

    it(`newRegime slabs sum to baseTax: ${label}`, () => {
      const r = calculateIndiaTaxEngine({ ...base, ...over }).newRegime;
      const slabSum = r.slabs.reduce((a, s) => a + s.tax, 0);
      expect(Math.round(slabSum)).toBe(Math.round(r.baseTax));
    });

    it(`oldRegime slabs sum to baseTax: ${label}`, () => {
      const r = calculateIndiaTaxEngine({ ...base, ...over }).oldRegime;
      const slabSum = r.slabs.reduce((a, s) => a + s.tax, 0);
      expect(Math.round(slabSum)).toBe(Math.round(r.baseTax));
    });
  }
});

describe('India Tax Engine - HRA', () => {
  it('takes the least of the three statutory limits', () => {
    // HRA 3L, 50% of 12L basic = 6L, rent 3.6L - 1.2L = 2.4L -> least is 2.4L
    const r = calculateIndiaTaxEngine(
      salary(2000000, {
        basicSalary: 1200000,
        hraReceived: 300000,
        rentPaid: 360000,
        isMetro: true,
      })
    );
    expect(r.oldRegime.exemptions).toBe(240000);
  });

  it('is zero when no rent is paid', () => {
    const r = calculateIndiaTaxEngine(
      salary(2000000, { basicSalary: 1200000, hraReceived: 300000, rentPaid: 0 })
    );
    expect(r.oldRegime.exemptions).toBe(0);
  });
});

describe('India Tax Engine - house property', () => {
  // The head that is negative far more often than a reader expects: a home you
  // live in produces no income at all, only a deduction.

  it('a self-occupied home is a loss capped at 2L, and ONLY under the old regime', () => {
    // s.115BAC withdraws the s.24(b) deduction for a self-occupied property
    // entirely - not capped lower, withdrawn. This is the single largest reason
    // a homeowner with a big loan is still better off under the old regime, and
    // getting its direction backwards would flatter the new regime on exactly
    // the readers for whom it is the wrong answer.
    const hp = { kind: 'selfOccupied' as const, annualRent: 0, municipalTaxes: 0, interest: 350000 };
    expect(computeHousePropertyIncome(hp, 'old')).toBe(-200000);
    expect(computeHousePropertyIncome(hp, 'new')).toBe(0);
  });

  it('a let-out property nets 30% of NAV and UNCAPPED interest', () => {
    // Rent 6L, municipal taxes 20k -> NAV 5.8L. Less 30% (1.74L) leaves 4.06L,
    // less 4L of interest -> 6,000 of income. The interest is not capped here;
    // what gets capped is the LOSS it creates, and that is a different rule in
    // a different section.
    const hp = {
      kind: 'letOut' as const,
      annualRent: 600000,
      municipalTaxes: 20000,
      interest: 400000,
    };
    expect(computeHousePropertyIncome(hp, 'old')).toBe(6000);
    // Let-out interest survives under BOTH regimes - it is set against rent
    // that is itself taxable.
    expect(computeHousePropertyIncome(hp, 'new')).toBe(6000);
  });

  it('municipal taxes are deducted before the 30%, not after', () => {
    // The order matters and is easy to get backwards: taxes come off the gross
    // annual value FIRST, and the 30% is then taken on what is left. Deducting
    // them after would over-relieve by 30% of the taxes every year.
    const withTax = computeHousePropertyIncome(
      { kind: 'letOut', annualRent: 600000, municipalTaxes: 20000, interest: 0 },
      'old'
    );
    const without = computeHousePropertyIncome(
      { kind: 'letOut', annualRent: 600000, municipalTaxes: 0, interest: 0 },
      'old'
    );
    expect(without - withTax).toBe(14000); // 20,000 less 30% of it, not 20,000
  });

  it('a let-out property in profit is added, not set off', () => {
    const hp = { kind: 'letOut' as const, annualRent: 600000, municipalTaxes: 0, interest: 0 };
    expect(computeHousePropertyIncome(hp, 'old')).toBe(420000);
    const r = calculateIndiaTaxEngine(salary(1000000, { houseProperty: hp }));
    expect(r.oldRegime.heads.housePropertyIncome).toBe(420000);
    expect(r.oldRegime.heads.housePropertySetOff).toBe(0);
    expect(r.oldRegime.heads.housePropertyCarriedForward).toBe(0);
  });

  it('the inter-head set-off of a house property loss is capped at 2L, old regime', () => {
    // 5L of loss on a let-out property: 2L is used this year, 3L is carried.
    const hp = {
      kind: 'letOut' as const,
      annualRent: 0,
      municipalTaxes: 0,
      interest: 500000,
    };
    const r = calculateIndiaTaxEngine(salary(1500000, { houseProperty: hp }));
    expect(r.oldRegime.heads.housePropertyIncome).toBe(-500000);
    expect(r.oldRegime.heads.housePropertySetOff).toBe(200000);
    expect(r.oldRegime.heads.housePropertyCarriedForward).toBe(300000);
  });

  it('the new regime allows NO house property loss against other heads', () => {
    const hp = { kind: 'letOut' as const, annualRent: 0, municipalTaxes: 0, interest: 500000 };
    const r = calculateIndiaTaxEngine(salary(1500000, { houseProperty: hp }));
    expect(r.newRegime.heads.housePropertySetOff).toBe(0);
    expect(r.newRegime.heads.housePropertyCarriedForward).toBe(500000);
    // and the taxable income is therefore untouched by the loss
    expect(r.newRegime.taxableIncome).toBe(1425000);
  });

  it('a set-off cannot exceed the income there is to absorb it', () => {
    // 3L salary against a 5L loss: only the salary that exists can be wiped
    // out, and the rest is carried forward rather than becoming a refund.
    const hp = { kind: 'letOut' as const, annualRent: 0, municipalTaxes: 0, interest: 500000 };
    const r = calculateIndiaTaxEngine(salary(300000, { houseProperty: hp }));
    expect(r.oldRegime.heads.salary).toBe(250000);
    expect(r.oldRegime.heads.housePropertySetOff).toBe(200000);
    expect(r.oldRegime.heads.housePropertyCarriedForward).toBe(300000);
    expect(r.oldRegime.taxableIncome).toBe(50000);
  });

  it('the home loan field moved head without moving the answer', () => {
    // The regression this file exists to prevent. `homeLoanInterest` used to be
    // a Chapter VI-A style deduction from gross total income; it is now a
    // self-occupied house property loss. Different section, same rupees.
    const r = calculateIndiaTaxEngine(salary(1500000, sop(200000)));
    expect(r.oldRegime.taxableIncome).toBe(1250000); // 15L - 50k std - 2L
    expect(r.newRegime.taxableIncome).toBe(1425000); // 15L - 75k std, no relief
  });
});

describe('India Tax Engine - business and other sources', () => {
  it('business profit is taxed at slab rates under both regimes', () => {
    const r = calculateIndiaTaxEngine({ ...base, business: { netProfit: 1000000 } });
    // No salary, so no standard deduction under either regime.
    expect(r.newRegime.taxableIncome).toBe(1000000);
    expect(r.oldRegime.taxableIncome).toBe(1000000);
    expect(r.newRegime.heads.salary).toBe(0);
    expect(r.newRegime.standardDeduction).toBe(0);
  });

  it('a business LOSS is reported, not silently swallowed', () => {
    // Inter-head set-off of business losses is the loss item on the gate and is
    // deliberately not modelled yet. What must not happen is that a number the
    // reader typed quietly stops mattering with nothing on screen to say so.
    const r = calculateIndiaTaxEngine(salary(1000000, { business: { netProfit: -300000 } }));
    expect(r.newRegime.heads.business).toBe(0);
    expect(r.newRegime.heads.businessLossNotSetOff).toBe(300000);
    expect(r.newRegime.taxableIncome).toBe(925000); // untouched by the loss
  });

  it('the standard deduction cannot shelter non-salary income', () => {
    // A relief against salary is a relief against SALARY. Letting it run
    // negative into interest income would be a deduction the Act never gave.
    const r = calculateIndiaTaxEngine(salary(30000, { otherIncome: 900000 }));
    expect(r.newRegime.heads.salary).toBe(0);
    expect(r.newRegime.taxableIncome).toBe(900000);
  });

  it('every head lands in gross income and the effective rate divides by it', () => {
    const r = calculateIndiaTaxEngine(
      salary(1200000, {
        business: { netProfit: 300000 },
        otherIncome: 100000,
        houseProperty: { kind: 'letOut', annualRent: 240000, municipalTaxes: 0, interest: 0 },
      })
    );
    // 12L salary + 1.68L house property (240k less 30%) + 3L business + 1L other
    expect(r.newRegime.grossIncome).toBe(1200000 + 168000 + 300000 + 100000);
    const eff = (r.newRegime.totalTax / r.newRegime.grossIncome) * 100;
    expect(r.newRegime.effectiveRate).toBe(eff.toFixed(2));
  });
});
