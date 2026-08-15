import { describe, it, expect } from 'vitest';
import { calculateIndiaTaxEngine, type TaxInput } from '../utils/tax';

// These tests previously called calculateIndiaTaxEngine(income, deductions) and
// read result.newTax / result.oldTax. That signature hasn't existed since the
// engine moved to a TaxInput object, so all three failed with `undefined` and
// the tax engine has effectively been untested. The expected rupee values below
// are the ones the original tests asserted - they were right; only the call was
// stale.

const base: TaxInput = {
  grossSalary: 0,
  otherIncome: 0,
  ageBracket: 'below60',
  basicSalary: 0,
  hraReceived: 0,
  rentPaid: 0,
  isMetro: false,
  sec80c: 0,
  sec80d: 0,
  sec80ccd1b: 0,
  homeLoanInterest: 0,
};

const salary = (grossSalary: number, over: Partial<TaxInput> = {}): TaxInput =>
  ({ ...base, grossSalary, ...over });

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
