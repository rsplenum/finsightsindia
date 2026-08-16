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

    for (const regime of ['newRegime', 'oldRegime'] as const) {
      it(`${regime} slabs sum to the SLAB tax: ${label}`, () => {
        const r = calculateIndiaTaxEngine({ ...base, ...over })[regime];
        const slabSum = r.slabs.reduce((a, s) => a + s.tax, 0);
        // Against slabTax, not baseTax. Capital gains are taxed outside the
        // slabs, so once they exist the slab rows cannot add up to the whole
        // bill and asserting that they do would have forced the wrong fix.
        expect(Math.round(slabSum)).toBe(Math.round(r.slabTax));
      });

      it(`${regime} baseTax is exactly slab + special: ${label}`, () => {
        const r = calculateIndiaTaxEngine({ ...base, ...over })[regime];
        expect(Math.round(r.baseTax)).toBe(Math.round(r.slabTax + r.specialRateTax));
      });
    }
  }
});

describe('India Tax Engine - loss set-off and carry-forward', () => {
  const losses = (over: Partial<TaxInput['losses']>): Partial<TaxInput> => ({
    losses: { ...base.losses, ...over },
  });
  const gains = (over: Partial<TaxInput['capitalGains']>): Partial<TaxInput> => ({
    capitalGains: { ...base.capitalGains, ...over },
  });

  it('a capital loss can NEVER touch salary, however large', () => {
    // The rule readers most often get wrong. A 10 lakh capital loss beside a
    // 15 lakh salary moves the bill by nothing at all, and the engine says so
    // explicitly rather than leaving the reader to notice the absence.
    const plain = calculateIndiaTaxEngine(salary(1500000));
    const withLoss = calculateIndiaTaxEngine(salary(1500000, losses({ longTermLoss: 1000000 })));
    expect(withLoss.newRegime.totalTax).toBe(plain.newRegime.totalTax);
    expect(withLoss.newRegime.losses.capitalLossBarredFromOtherHeads).toBe(true);
    expect(withLoss.newRegime.losses.longTerm.carriedForward).toBe(1000000);
  });

  it('a long-term loss goes to s.112 gains BEFORE s.112A, to spare the exemption', () => {
    // Both are taxed at 12.5%, so the ORDER only matters because 112A gains
    // carry their own Rs 1.25 lakh exemption. Spending the loss there first
    // would waste it on income that was going to be exempt anyway.
    const r = calculateIndiaTaxEngine({
      ...base,
      ...gains({ ltcg112: 300000, ltcg112A: 300000 }),
      ...losses({ longTermLoss: 300000 }),
    });
    const d = r.newRegime.capitalGains;
    expect(d.ltcg112.gain).toBe(0); // the loss landed here
    expect(d.ltcg112A.gain).toBe(300000); // and left this alone
    expect(d.ltcg112A.ownExemption).toBe(125000); // so the exemption still works
  });

  it('a short-term loss goes to the dearest gain first', () => {
    // Short-term losses may meet either kind, so they go to the 20% bucket
    // before the 12.5% ones.
    const r = calculateIndiaTaxEngine({
      ...base,
      ...gains({ stcg111A: 200000, ltcg112: 200000 }),
      ...losses({ shortTermLoss: 200000 }),
    });
    const d = r.newRegime.capitalGains;
    expect(d.stcg111A.gain).toBe(0);
    expect(d.ltcg112.gain).toBe(200000);
  });

  it('a long-term loss may NOT be set against a short-term gain', () => {
    // The asymmetry: short-term losses are flexible, long-term ones are not.
    const r = calculateIndiaTaxEngine({
      ...base,
      ...gains({ stcg111A: 500000 }),
      ...losses({ longTermLoss: 500000 }),
    });
    expect(r.newRegime.capitalGains.stcg111A.gain).toBe(500000);
    expect(r.newRegime.losses.longTerm.carriedForward).toBe(500000);
  });

  it('a business loss may be set against rent and interest, but NOT salary', () => {
    // s.71. 5L of business loss against 12L of salary and 3L of interest: the
    // interest goes, the salary does not, and 2L is carried forward.
    const r = calculateIndiaTaxEngine(
      salary(1275000, {
        otherIncome: 300000,
        business: { ...base.business, netProfit: -500000 },
      })
    );
    const n = r.newRegime;
    expect(n.heads.salary).toBe(1200000);
    expect(n.slabIncome).toBe(1200000); // the 3L of interest was absorbed
    expect(n.losses.business.used).toBe(300000);
    expect(n.losses.business.carriedForward).toBe(200000);
  });

  it('a business loss CAN reach capital gains when the slab heads run out', () => {
    // s.71 excludes salary and nothing else, so gains are fair game - and the
    // dearest bucket goes first, as everywhere else.
    const r = calculateIndiaTaxEngine({
      ...base,
      ...gains({ stcg111A: 400000 }),
      business: { ...base.business, netProfit: -300000 },
    });
    expect(r.newRegime.capitalGains.stcg111A.gain).toBe(100000);
    expect(r.newRegime.losses.business.used).toBe(300000);
    expect(r.newRegime.losses.business.carriedForward).toBe(0);
  });

  it('a brought-forward business loss meets business income ONLY', () => {
    // s.72 is stricter than s.71: once carried forward, a business loss can no
    // longer reach the other heads at all.
    const r = calculateIndiaTaxEngine(
      salary(1275000, {
        otherIncome: 500000,
        ...losses({ broughtForwardBusiness: 400000 }),
      })
    );
    // No business income this year, so none of it can be used.
    expect(r.newRegime.losses.business.used).toBe(0);
    expect(r.newRegime.losses.business.carriedForward).toBe(400000);
    expect(r.newRegime.slabIncome).toBe(1700000); // interest untouched

    const withBusiness = calculateIndiaTaxEngine({
      ...base,
      business: { ...base.business, netProfit: 1000000 },
      ...losses({ broughtForwardBusiness: 400000 }),
    });
    expect(withBusiness.newRegime.losses.business.used).toBe(400000);
    expect(withBusiness.newRegime.slabIncome).toBe(600000);
  });

  it('a brought-forward house property loss meets house property income ONLY', () => {
    const r = calculateIndiaTaxEngine(
      salary(1275000, {
        houseProperty: { kind: 'letOut', annualRent: 500000, municipalTaxes: 0, interest: 0 },
        ...losses({ broughtForwardHouseProperty: 200000 }),
      })
    );
    // Rent 5L less 30% = 3.5L of house property income; 2L of it absorbed.
    expect(r.oldRegime.losses.houseProperty.used).toBe(200000);
    expect(r.oldRegime.losses.houseProperty.carriedForward).toBe(0);
  });

  it('what cannot be used this year is carried forward, not destroyed', () => {
    // The invariant that matters across every loss: available = used + carried.
    const r = calculateIndiaTaxEngine(
      salary(800000, {
        ...gains({ stcg111A: 100000, ltcg112A: 50000 }),
        business: { ...base.business, netProfit: -900000 },
        ...losses({
          shortTermLoss: 400000,
          longTermLoss: 300000,
          broughtForwardBusiness: 250000,
          broughtForwardShortTerm: 150000,
        }),
      })
    );
    for (const regime of [r.newRegime, r.oldRegime]) {
      for (const k of ['shortTerm', 'longTerm', 'business', 'houseProperty'] as const) {
        const u = regime.losses[k];
        expect(u.used + u.carriedForward).toBe(u.available);
        expect(u.used).toBeGreaterThanOrEqual(0);
        expect(u.carriedForward).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('a loss never turns tax negative, and never manufactures a refund', () => {
    const r = calculateIndiaTaxEngine(
      salary(400000, {
        business: { ...base.business, netProfit: -5000000 },
        ...losses({ shortTermLoss: 5000000, broughtForwardHouseProperty: 5000000 }),
      })
    );
    for (const regime of [r.newRegime, r.oldRegime]) {
      expect(regime.totalTax).toBeGreaterThanOrEqual(0);
      expect(regime.slabIncome).toBeGreaterThanOrEqual(0);
      expect(regime.taxableIncome).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('India Tax Engine - presumptive taxation, 44AD and 44ADA', () => {
  const biz = (over: Partial<TaxInput['business']>): Partial<TaxInput> => ({
    business: {
      netProfit: 0,
      turnover: 0,
      professionalReceipts: 0,
      digitalSharePct: 100,
      basis: 'books',
      ...over,
    },
  });

  it('44AD deems 6% on bank receipts and 8% on cash, blended', () => {
    // Half through a bank, half in cash: 6% on one half, 8% on the other.
    const r = calculateIndiaTaxEngine({
      ...base,
      ...biz({ turnover: 10000000, digitalSharePct: 50, basis: '44AD' }),
    });
    const d = r.newRegime.heads.businessDetail;
    expect(d.ad44.effectiveRate).toBeCloseTo(0.07, 10);
    expect(d.ad44.deemedProfit).toBe(700000);
    expect(d.taxedProfit).toBe(700000);
  });

  it('all-digital turnover is deemed at 6%, all-cash at 8%', () => {
    const digital = calculateIndiaTaxEngine({
      ...base,
      ...biz({ turnover: 10000000, digitalSharePct: 100, basis: '44AD' }),
    }).newRegime.heads.businessDetail;
    const cash = calculateIndiaTaxEngine({
      ...base,
      ...biz({ turnover: 10000000, digitalSharePct: 0, basis: '44AD' }),
    }).newRegime.heads.businessDetail;
    expect(digital.ad44.deemedProfit).toBe(600000);
    expect(cash.ad44.deemedProfit).toBe(800000);
  });

  it('the 44AD ceiling is 2 crore, but 3 crore when cash is 5% or less', () => {
    // The raised ceiling is the reason the digital share is one field doing two
    // jobs, and getting the boundary wrong silently disqualifies a real filer.
    const at25WithCash = calculateIndiaTaxEngine({
      ...base,
      ...biz({ turnover: 25000000, digitalSharePct: 90, basis: '44AD' }),
    }).newRegime.heads.businessDetail;
    const at25MostlyDigital = calculateIndiaTaxEngine({
      ...base,
      ...biz({ turnover: 25000000, digitalSharePct: 95, basis: '44AD' }),
    }).newRegime.heads.businessDetail;

    expect(at25WithCash.ad44.available).toBe(false);
    expect(at25WithCash.ad44.limit).toBe(20000000);
    expect(at25MostlyDigital.ad44.available).toBe(true);
    expect(at25MostlyDigital.ad44.limit).toBe(30000000);
  });

  it('44ADA deems half of professional receipts, ceiling 50L / 75L', () => {
    const r = calculateIndiaTaxEngine({
      ...base,
      ...biz({ professionalReceipts: 4000000, digitalSharePct: 100, basis: '44ADA' }),
    });
    const d = r.newRegime.heads.businessDetail;
    expect(d.ada44.deemedProfit).toBe(2000000);
    expect(d.ada44.limit).toBe(7500000);
    expect(d.taxedProfit).toBe(2000000);
  });

  it('an election the reader is not eligible for falls back to the books', () => {
    // Silently deeming zero profit on income they really have would be worse
    // than ignoring the election, and it is the shape a bad default takes.
    const r = calculateIndiaTaxEngine({
      ...base,
      ...biz({
        turnover: 50000000, // way over even the raised ceiling
        netProfit: 900000,
        digitalSharePct: 100,
        basis: '44AD',
      }),
    });
    const d = r.newRegime.heads.businessDetail;
    expect(d.ad44.available).toBe(false);
    expect(d.ad44.unavailableReason).toContain('ceiling');
    expect(d.basis).toBe('books');
    expect(d.taxedProfit).toBe(900000);
  });

  it('BOTH bases are costed even when only one is elected', () => {
    // dd-006/dont-2: the difference between actual and deemed profit is the
    // lesson for a small business, so the page must be able to show both at
    // once. That is only possible if the engine always computes both.
    const r = calculateIndiaTaxEngine({
      ...base,
      ...biz({
        turnover: 10000000,
        professionalReceipts: 3000000,
        netProfit: 1500000,
        digitalSharePct: 100,
        basis: 'books',
      }),
    });
    const d = r.newRegime.heads.businessDetail;
    expect(d.basis).toBe('books');
    expect(d.taxedProfit).toBe(1500000);
    // ...and the roads not taken are still priced
    expect(d.ad44.deemedProfit).toBe(600000);
    expect(d.ada44.deemedProfit).toBe(1500000);
  });

  it('electing 44AD changes the tax, and the change is the whole point', () => {
    const common = { turnover: 10000000, netProfit: 1500000, digitalSharePct: 100 };
    const books = calculateIndiaTaxEngine({ ...base, ...biz({ ...common, basis: 'books' }) });
    const presumptive = calculateIndiaTaxEngine({ ...base, ...biz({ ...common, basis: '44AD' }) });
    expect(books.newRegime.slabIncome).toBe(1500000);
    expect(presumptive.newRegime.slabIncome).toBe(600000);
    expect(presumptive.newRegime.totalTax).toBeLessThan(books.newRegime.totalTax);
  });
});

describe('India Tax Engine - capital gains and the 87A interaction', () => {
  const cg = (over: Partial<TaxInput['capitalGains']>): Partial<TaxInput> => ({
    capitalGains: { stcg111A: 0, ltcg112A: 0, ltcg112: 0, stcgSlab: 0, ...over },
  });

  it('STCG on listed equity is 20%, outside the slabs', () => {
    // 15% until 23 July 2024, 20% since. A reader who last checked in 2023 has
    // the wrong number, so this is worth pinning.
    const r = calculateIndiaTaxEngine(salary(1500000, cg({ stcg111A: 500000 })));
    expect(r.newRegime.capitalGains.stcg111A.rate).toBe(0.2);
    expect(r.newRegime.capitalGains.stcg111A.tax).toBe(100000);
    expect(r.newRegime.slabIncome).toBe(1425000); // gains are NOT in here
    expect(r.newRegime.taxableIncome).toBe(1925000); // but they ARE in total income
  });

  it('the first 1.25L of listed equity LTCG is free, the rest is 12.5%', () => {
    const r = calculateIndiaTaxEngine(salary(1500000, cg({ ltcg112A: 325000 })));
    const d = r.newRegime.capitalGains.ltcg112A;
    expect(d.ownExemption).toBe(125000);
    expect(d.taxed).toBe(200000);
    expect(d.tax).toBe(25000);
  });

  it('short-term gains that are NOT 111A go through the slabs', () => {
    // Property, gold, unlisted shares, post-2023 debt funds. The commonest
    // reader mistake is assuming every "STCG" gets the 20% rate.
    const r = calculateIndiaTaxEngine(salary(1000000, cg({ stcgSlab: 500000 })));
    expect(r.newRegime.slabIncome).toBe(1425000); // 10L - 75k + 5L
    expect(r.newRegime.specialRateTax).toBe(0);
  });

  // --- THE 87A INTERACTION. Verified against two sources, not assumed. ---

  it('the 12L threshold EXCLUDES special-rate income, so the rebate survives', () => {
    // 11L of salary beside 2L of STCG. Total income is 13L. Reading the
    // threshold against TOTAL income would deny the rebate outright; the
    // Finance Act 2025 position is that it is tested on slab income alone, so
    // the salary keeps its rebate and only the gain is taxed.
    const r = calculateIndiaTaxEngine(salary(1175000, cg({ stcg111A: 200000 })));
    const n = r.newRegime;
    expect(n.slabIncome).toBe(1100000);
    expect(n.taxableIncome).toBe(1300000);
    expect(n.slabTax).toBe(50000);
    expect(n.rebate87A).toBe(50000); // the salary is wiped out
    expect(n.specialRateTax).toBe(40000); // the gain is not
    expect(n.totalTax).toBe(41600); // 40,000 + 4% cess, and nothing else
  });

  it('an unused rebate does NOT spill onto the gains', () => {
    // 4L of slab income owes no tax at all, so the whole rebate is unused.
    // None of it may be set against the 20% on the STCG.
    const r = calculateIndiaTaxEngine(salary(475000, cg({ stcg111A: 200000 })));
    const n = r.newRegime;
    expect(n.slabIncome).toBe(400000);
    expect(n.slabTax).toBe(0);
    expect(n.specialRateTax).toBe(40000);
    expect(n.totalTax).toBe(41600);
  });

  // --- The basic exemption limit, borrowed against gains ---

  it('unused basic exemption is absorbed by the gains', () => {
    // A retiree with no salary and a year of realised gains - exactly the
    // reader least likely to know this rule exists.
    const r = calculateIndiaTaxEngine({ ...base, ...cg({ ltcg112A: 600000 }) });
    const d = r.newRegime.capitalGains;
    expect(d.ltcg112A.ownExemption).toBe(125000);
    expect(d.basicExemptionAbsorbed).toBe(400000);
    expect(d.ltcg112A.taxed).toBe(75000);
    expect(r.newRegime.totalTax).toBe(9750); // 9,375 + 4% cess
  });

  it('the exemption is absorbed by the DEAREST gain first', () => {
    // 3L of 20% STCG and 3L of 12.5% LTCG against 4L of unused exemption. Spent
    // on the STCG first it leaves 2L of LTCG taxed at 12.5% = 25,000. Spent the
    // other way round it would leave 2L of STCG at 20% = 40,000. The Act lets
    // the assessee choose, so choosing the dearer bucket is not optional for us.
    const r = calculateIndiaTaxEngine({ ...base, ...cg({ stcg111A: 300000, ltcg112: 300000 }) });
    const d = r.newRegime.capitalGains;
    expect(d.stcg111A.basicExemptionUsed).toBe(300000);
    expect(d.stcg111A.taxed).toBe(0);
    expect(d.ltcg112.taxed).toBe(200000);
    expect(r.newRegime.specialRateTax).toBe(25000);
    expect(r.newRegime.totalTax).toBe(26000);
  });

  it('Chapter VI-A cannot shelter a capital gain', () => {
    // s.112A(6) and s.111A(2). An 80C investment reduces slab income and can
    // wipe out the slab tax entirely, and the gain is untouched by all of it.
    const r = calculateIndiaTaxEngine(
      salary(550000, { sec80c: 150000, ...cg({ ltcg112A: 500000 }) })
    );
    const o = r.oldRegime;
    expect(o.slabIncome).toBe(350000);
    expect(o.rebate87A).toBe(5000); // slab tax gone
    expect(o.specialRateTax).toBe(46875); // (5L - 1.25L) at 12.5%, untouched
    expect(o.totalTax).toBe(48750);
  });

  it('surcharge on capital gains is capped at 15% while the slab part is not', () => {
    // 3 crore of salary and 3 crore of equity LTCG: total income 6 crore, so
    // the new regime's top surcharge of 25% applies - but only to the slab
    // part. Without the cap the gains would carry 25% too.
    const r = calculateIndiaTaxEngine(salary(30075000, cg({ ltcg112A: 30000000 })));
    const n = r.newRegime;
    expect(n.slabIncome).toBe(30000000);
    // Asserted relationally against the engine's own components, so this stays
    // true if the slab arithmetic ever changes and fails loudly if the cap goes.
    expect(n.surcharge).toBeCloseTo(n.slabTax * 0.25 + n.specialRateTax * 0.15, 2);
    expect(n.surcharge).not.toBeCloseTo((n.slabTax + n.specialRateTax) * 0.25, 2);
  });

  it('the two derived totals move together across a sweep', () => {
    // The pair worth asserting together: total tax and the components it is
    // built from. A jagged one beside a smooth one is how two of 16 Aug's
    // defects gave themselves away.
    const sweep = [0, 100000, 125000, 200000, 1000000, 5000000];
    for (const g of sweep) {
      for (const salaryAmt of [0, 500000, 1275000, 3000000]) {
        const r = calculateIndiaTaxEngine(salary(salaryAmt, cg({ ltcg112A: g })));
        for (const regime of [r.newRegime, r.oldRegime]) {
          const reconciled =
            regime.baseTax -
            regime.rebate87A -
            regime.marginalRelief +
            regime.surcharge +
            regime.cess;
          expect(Math.abs(reconciled - regime.totalTax)).toBeLessThanOrEqual(5);
          expect(Math.round(regime.baseTax)).toBe(
            Math.round(regime.slabTax + regime.specialRateTax)
          );
        }
        // and the badge can never disagree with the two columns
        expect(r.savingsAmount).toBe(Math.abs(r.newRegime.totalTax - r.oldRegime.totalTax));
      }
    }
  });
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

  it('a house property with nothing in it returns positive zero, not -0', () => {
    // Found on the live page as "-Rs 0" in the House Property row of a return
    // with no home loan. `-Math.min(0, cap)` is negative zero; `-0 >= 0` is
    // true, so it passed every sign check and reached Intl, which printed the
    // sign faithfully. Object.is is the only assertion that can see this.
    for (const regime of ['new', 'old'] as const) {
      const v = computeHousePropertyIncome(
        { kind: 'selfOccupied', annualRent: 0, municipalTaxes: 0, interest: 0 },
        regime
      );
      expect(Object.is(v, -0)).toBe(false);
      expect(v).toBe(0);
    }
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
