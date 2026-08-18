import { describe, it, expect } from 'vitest';
import {
  analyseReplication,
  replicate,
  buildLedger,
  realBreakEvenYear,
  investableCapitalOf,
  frictionsOf,
  verdictFor,
  grossUpForTax,
  payoutInYear,
  payoutTaxationOf,
  LTCG_RATE_PCT,
  LTCG_EXEMPTION,
  type PolicyInputs,
  type Taxation,
} from '../utils/insuranceReplication';
import { DEFAULT_SLAB_PCT, SLAB_RATES_PCT, spineFor } from '../utils/insuranceInputs';
import { DEFAULT_FUND_COST } from '../utils/fundCosts';

/** The two taxations the page uses, plus the untaxed one kept only for tests. */
const CG: Taxation = {
  kind: 'capitalGains',
  ratePct: LTCG_RATE_PCT,
  annualExemption: LTCG_EXEMPTION,
};
const NO_TAX: Taxation = { kind: 'none' };
const slab = (ratePct: number): Taxation => ({ kind: 'slabOnAccrual', ratePct });

/**
 * How well a route did, as ONE number that stays monotone past exhaustion.
 *
 * `finalBalance` alone cannot be compared here: sol-040 floors it at zero, and
 * the shipped safe route already runs out — so two routes that fail by wildly
 * different amounts both read 0. Surplus above the line, shortfall below it.
 */
const outcome = (r: { finalBalance: number; unfundedPayout: number }) =>
  r.finalBalance - r.unfundedPayout;

// The insurance analyser's engine, which until now could not be tested at all.
//
// It lived inside a <script> tag on a 35KB page, read its inputs from the DOM
// and returned pre-formatted strings, so every claim about the page had to be
// settled by looking at the screen. These tests are the reason the rest of T5 is
// cheap: the verdict labels, the sign of the surplus and the unbundling
// headline are all statements about numbers that can now be asserted.
//
// The figures below are the SHIPPED ones - characterization, not doctrine. They
// are not sacred and several of them are wrong in ways noted here. What must
// never happen is that they move without somebody deciding they should.

/** The page's own defaults: a ₹1 L premium for 10 years, ₹1.2 L a year for 20, ₹10 L at the end. */
const shipped: PolicyInputs = {
  premium: 100000,
  ppt: 10,
  payoutStartYear: 11,
  payoutYears: 20,
  payoutAmount: 120000,
  // A LEVEL INCOME AND A COSTLESS FUND, on purpose. Both are new parameters and
  // both are set to the value that leaves the walk exactly as it was, so every
  // characterization figure below still measures what it measured when it was
  // written. What each new parameter DOES is asserted separately, in its own
  // describe block, against the page's real defaults.
  payoutGrowthPct: 0,
  equityFeePct: 0,
  maturityBenefit: 1000000,
  // Rs 1 crore of life cover against a Rs 1 lakh premium - one percent, well
  // inside s.10(10D)'s ten. The shipped policy is exempt, which is the ordinary
  // case and the one these figures were measured in.
  sumAssured: 10000000,
  inflationRate: 6,
  safeRate: 7.1,
  equityRate: 12,
  // The advanced panel's defaults - ₹1 cr of term at ₹12,000 and ₹50 L of
  // accident cover at ₹5,000.
  termCost: 12000,
  accidentCost: 5000,
  ltcgRatePct: LTCG_RATE_PCT,
  slabRatePct: DEFAULT_SLAB_PCT,
  ltcgExemption: LTCG_EXEMPTION,
  // Fixed, so that the same policy yields the same yield twice. The page passes
  // today's date; the engine never reaches for a clock of its own.
  startDate: new Date('2026-01-01T00:00:00Z'),
};

const at = (over: Partial<PolicyInputs> = {}): PolicyInputs => ({ ...shipped, ...over });

describe('the policy, as it stands', () => {
  it('reports the shipped yield and the shipped payouts', () => {
    const r = analyseReplication(shipped);

    // 7.22% is what the page prints today, and it is the number the whole
    // argument turns on: it sits barely above the 7.1% safe rate and well below
    // the 12% equity assumption.
    expect(r.policy.xirrPct).toBeCloseTo(7.22, 2);
    expect(r.policy.totalNominalPayout).toBe(3400000);
    expect(r.policy.totalRealPayout).toBeCloseTo(942679.42, 2);
    expect(r.totalYears).toBe(30);
    expect(r.payoutEndYear).toBe(30);
  });

  it('is worth about a quarter of its headline once inflation is taken out', () => {
    // ₹34 L promised, ₹9.4 L of purchasing power. dd-004: the same quantity in
    // two moneys, and the reader is owed both.
    const r = analyseReplication(shipped);
    expect(r.policy.totalRealPayout).toBeLessThan(r.policy.totalNominalPayout / 3);
  });

  it('does not repay its own premiums, in real terms, until the final year', () => {
    // Year 30 - and only because the maturity lump sum lands there. Anything
    // that moves this is a substantive change to what the page claims.
    expect(analyseReplication(shipped).policy.breakEvenYear).toBe(30);
  });

  it('reports no break-even year at all when the policy never repays', () => {
    // A policy whose income is trivial: cumulative real payouts never overtake
    // cumulative real premiums, and the view prints 'Never / Term'.
    const r = analyseReplication(at({ payoutAmount: 1000, maturityBenefit: 0 }));
    expect(r.policy.breakEvenYear).toBeNull();
  });

  it('charges GST at 4.5% in the first year and 2.25% after it', () => {
    const f = frictionsOf(shipped);
    expect(f.gstPaid).toBeCloseTo(100000 * 0.045 + 9 * 100000 * 0.0225, 6);
    expect(f.gstPaid).toBeCloseTo(24750, 6);
    expect(f.estCommission).toBeCloseTo(20000, 6);
  });
});

describe('the ledger', () => {
  it('pays premiums for the premium term and income for the payout window', () => {
    const rows = buildLedger(shipped);
    expect(rows).toHaveLength(30);
    expect(rows.filter((r) => r.premiumOut > 0).map((r) => r.year)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(rows.filter((r) => r.payoutIn > 0)[0].year).toBe(11);
    expect(rows.every((r) => r.net === r.payoutIn - r.premiumOut)).toBe(true);
  });

  it('lands the maturity benefit in the final payout year and nowhere else', () => {
    const rows = buildLedger(shipped);
    expect(rows[29].payoutIn).toBe(120000 + 1000000);
    expect(rows[28].payoutIn).toBe(120000);
  });

  it('discounts the premium from the start of its year and the payout from the end', () => {
    // The timing convention every real figure on the page inherits. Year 1's
    // premium is paid today, so it is worth its face value.
    const rows = buildLedger(shipped);
    expect(rows[0].realPremium).toBeCloseTo(100000, 6);
    expect(rows[10].realValue).toBeCloseTo(120000 / Math.pow(1.06, 11), 6);
  });

  it('runs to the end of the premium term even when the income stops first', () => {
    const r = analyseReplication(at({ ppt: 20, payoutStartYear: 3, payoutYears: 5 }));
    expect(r.payoutEndYear).toBe(7);
    expect(r.totalYears).toBe(20);
    expect(r.ledger).toHaveLength(20);
  });
});

describe('replication - one walk, at any rate', () => {
  it('is the same walk for the headline route and the sensitivity table', () => {
    // sol-038, pre-empted. The original wrote this loop twice: once inline for
    // the two headline routes and once inside a nested getEquitySurplus() for
    // the table. Two copies of one derivation is exactly what printed 6.7% and
    // 6.9% for one quantity on the SIP page. If these two ever disagree, the
    // silo has grown back.
    const r = analyseReplication(shipped);
    const baseline = r.sensitivity.find((row) => row.isBaseline);

    expect(baseline).toBeDefined();
    expect(baseline!.rate).toBe(shipped.equityRate);
    expect(baseline!.surplus).toBe(r.growth.finalBalance);
  });

  it('marks the reader own rate, and includes it even when it is not one of ours', () => {
    // The view used to hardcode `rate === 12` for the '(Your Input)' marker,
    // which would have pointed at the wrong row the day the assumption moved.
    const r = analyseReplication(at({ equityRate: 11 }));
    expect(r.sensitivity.map((row) => row.rate)).toEqual([8, 10, 11, 12, 14]);
    expect(r.sensitivity.filter((row) => row.isBaseline).map((row) => row.rate)).toEqual([11]);
  });

  it('walks the four shipped rates when the reader is on the default', () => {
    expect(analyseReplication(shipped).sensitivity.map((r) => r.rate)).toEqual([8, 10, 12, 14]);
  });

  it('ends at roughly nothing when the DIY route earns exactly the policy yield', () => {
    // The property that says the walk and the yield describe the same contract:
    // fund the identical payouts out of the identical premiums at the policy's
    // own IRR and there should be nothing left over either way. The residual is
    // the XIRR's own two-decimal rounding, not a modelling gap - under half a
    // percent of the capital put in.
    const noCover = at({ termCost: 0, accidentCost: 0 });
    const irr = analyseReplication(noCover).policy.xirrPct;
    const route = replicate(noCover, irr, NO_TAX);

    expect(Math.abs(route.finalBalance)).toBeLessThan(0.005 * route.capitalInvested);
  });

  it('is monotonic in the rate while the route stays solvent', () => {
    const r = analyseReplication(shipped);
    const surpluses = r.sensitivity.map((row) => row.surplus);
    expect([...surpluses].sort((a, b) => a - b)).toEqual(surpluses);
  });

  it('a higher return is never a worse outcome', () => {
    // The defect this replaced, in full, because it is the kind that comes back:
    // the walk used to let the balance go negative and keep compounding it, so
    // an exhausted portfolio grew a DEBT at the equity rate. The sensitivity
    // table - whose entire purpose is 'what if returns are lower than you hope'
    // - therefore read
    //
    //   8% -> -1.73 Cr    10% -> -1.81 Cr    12% -> -1.81 Cr    14% -> -1.63 Cr
    //
    // and told the reader that earning more left them worse off. Now the money
    // simply runs out, and the same table reports a shortfall that SHRINKS as
    // returns rise. Asserted on a policy nobody can replicate, which is the
    // only place the old shape could show itself.
    const generous = at({ payoutAmount: 400000, maturityBenefit: 5000000 });
    const s = analyseReplication(generous).sensitivity;
    const short = (rate: number) => {
      const v = s.find((row) => row.rate === rate)!.verdict;
      return v.kind === 'shortfall' ? v.unfunded : 0;
    };

    expect(short(10)).toBeLessThan(short(8));
    expect(short(12)).toBeLessThan(short(10));
    expect(short(14)).toBeLessThan(short(12));
  });

  it('the money lasts longer at a higher return', () => {
    // The other half of the same statement, and the one a person actually
    // lives through (dd-010): year 14, 15, 16, 18.
    const generous = at({ payoutAmount: 400000, maturityBenefit: 5000000 });
    const ranOut = (rate: number) => replicate(generous, rate, CG).exhaustedInYear!;

    expect(ranOut(8)).toBeLessThanOrEqual(ranOut(10));
    expect(ranOut(10)).toBeLessThanOrEqual(ranOut(12));
    expect(ranOut(12)).toBeLessThan(ranOut(14));

    // The exact years, pinned - because this is where a floating-point residue
    // in the gross-up once put a false year on the page. The engine reported a
    // policy running out in year 12 when it ran out in year 15, and only the
    // jaggedness across rates gave it away: 14, 12, 15, 16, 14, 18. A shortfall
    // of 1e-9 was being counted as a missed instalment.
    expect([8, 9, 10, 11, 12, 14].map(ranOut)).toEqual([14, 15, 15, 16, 16, 18]);
  });

  it('never lets a portfolio go below zero', () => {
    // The property, stated directly. A portfolio that cannot meet a withdrawal
    // is empty; it does not borrow at the equity rate and carry on.
    const broke = at({ payoutAmount: 400000, maturityBenefit: 5000000 });
    for (const rate of [0, 4, 8, 11, 12, 14, 20]) {
      expect(replicate(broke, rate, NO_TAX).finalBalance).toBeGreaterThanOrEqual(0);
      expect(replicate(broke, rate, CG).finalBalance).toBeGreaterThanOrEqual(0);
    }
  });

  it('accounts for every rupee the policy promised - paid or unpaid', () => {
    // Conservation. What the route paid out plus what it could not pay must be
    // exactly what the policy owed. Without this, 'ran out in year 16' could
    // quietly lose money rather than report it.
    const broke = at({ payoutAmount: 400000, maturityBenefit: 5000000 });
    const r = analyseReplication(broke);
    const owed = r.ledger.reduce((sum, row) => sum + row.payoutIn, 0);
    const paid = owed - r.growth.unfundedPayout;

    expect(paid + r.growth.unfundedPayout).toBeCloseTo(owed, 6);
    expect(r.growth.unfundedPayout).toBeGreaterThan(0);
    expect(paid).toBeGreaterThan(0);
  });

  it('is deterministic - the same inputs twice give the same numbers', () => {
    // The original called `new Date()` inside itself, so its yield was a
    // function of the day it was read on as well as of the policy.
    expect(analyseReplication(shipped)).toEqual(analyseReplication(shipped));
  });
});

describe('unbundling - what the cover costs', () => {
  it('takes the cover out of the premium before anything is invested', () => {
    expect(investableCapitalOf(shipped)).toBe(100000 - 17000);
    expect(analyseReplication(shipped).riskCostPaid).toBe(17000 * 10);
  });

  it('invests the whole premium when the reader turns unbundling off', () => {
    // The toggle reaches the engine only as a cost of zero. There is no mode.
    const off = at({ termCost: 0, accidentCost: 0 });
    expect(investableCapitalOf(off)).toBe(100000);
    expect(analyseReplication(off).riskCostPaid).toBe(0);
  });

  it('never invests a negative premium when the cover costs more than the policy', () => {
    expect(investableCapitalOf(at({ premium: 20000, termCost: 15000, accidentCost: 10000 }))).toBe(0);
  });

  it('makes the DIY route look better with the cover switched off, because it buys nothing', () => {
    // Worth an assertion because it is the comparison the page's bottom line
    // makes, and it is not like for like: with the toggle off the reader keeps
    // more money AND loses the protection. The copy has to say so.
    const on = analyseReplication(shipped).growth.finalBalance;
    const off = analyseReplication(at({ termCost: 0, accidentCost: 0 })).growth.finalBalance;
    expect(off).toBeGreaterThan(on);
  });
});

describe('tax on the growth route', () => {
  it('taxes the gain in every sale, not just what is left at the end', () => {
    // The old model taxed ONE number: the terminal balance above total capital
    // invested. It therefore ignored the gain realised in twenty years of
    // withdrawals - about ₹34 lakh of payouts, funded by selling units, every
    // sale of which realises gain. Applying a single ₹1.25 lakh exemption
    // instead of thirty overstated the tax by roughly ₹4.5 lakh; ignoring the
    // realised gains understated it by considerably more. The net was that the
    // page UNDERTAXED the DIY route - flattering the case it was making.
    //
    // ₹6.42 lakh -> ₹8.38 lakh, and the surplus ₹54.48 L -> ₹52.52 L.
    const r = analyseReplication(shipped);
    expect(r.growth.taxDrag).toBeCloseTo(838088.97, 2);

    const terminalOnly =
      Math.max(0, r.growth.finalBalance + r.growth.taxDrag - r.growth.capitalInvested - LTCG_EXEMPTION) *
      0.125;
    expect(r.growth.taxDrag).toBeGreaterThan(terminalOnly * 0.9);
  });

  it('uses the exemption every year, not once', () => {
    // Run the same policy with the exemption and without it. If the exemption
    // were granted once, the whole difference could not exceed one year's worth
    // of it - ₹125,000 × 12.5% = ₹15,625. It is many times that, because the
    // fund sells units in each of twenty payout years and each of those years
    // brings its own exemption.
    const withExemption = analyseReplication(shipped).growth.taxDrag;
    const withoutExemption = analyseReplication(at({ ltcgExemption: 0 })).growth.taxDrag;

    const oneYearOfExemption = LTCG_EXEMPTION * (LTCG_RATE_PCT / 100);
    expect(withoutExemption - withExemption).toBeGreaterThan(oneYearOfExemption * 10);
  });


  it('charges tax on the sales it managed to make before running out', () => {
    // It used to charge nothing here, because there was no terminal balance to
    // tax. But the fund did sell units for four years of income before it
    // emptied, and those sales realised gains.
    const r = analyseReplication(at({ payoutAmount: 400000, maturityBenefit: 5000000 }));
    expect(r.growth.finalBalance).toBe(0);
    expect(r.growth.unfundedPayout).toBeGreaterThan(0);
    expect(r.growth.taxDrag).toBeGreaterThan(0);
  });

  it('taxes the safe route too - sol-060, and this test used to assert the opposite', () => {
    // It read: "leaves the safe route untaxed - which is a defect, recorded here
    // rather than defended". The defect is fixed, so the test that named it had
    // to be the test that inverts. Keeping it in place, rather than deleting it
    // and writing a fresh one elsewhere, is the point: the ledger of what this
    // engine assumes should show its own corrections.
    //
    // Interest on a bond or a PPF-alternative is taxed at slab as it accrues.
    // The reader picks the rate (Rahul, 17 Aug: "ask them to choose a slab. 10,
    // 20, 30"), because assuming one would put our number inside their
    // comparison.
    const r = analyseReplication(at({ payoutAmount: 20000, maturityBenefit: 0 }));
    expect(r.safe.finalBalance).toBeGreaterThan(0);
    expect(r.safe.taxDrag).toBeCloseTo(574359.38, 2);
  });
});

describe('the verdict - sign, word and badge cannot disagree', () => {
  it('the safe route runs out at the shipped defaults, and says so', () => {
    // What the page used to print here: '-₹11.08 Lakh' in emerald green, under
    // a heading reading 'Surplus Wealth / Deficit', beside a badge saying
    // POLICY WINS, while the bottom line called it SURPLUS WEALTH. Four
    // independent decisions about one fact.
    //
    // What it says now: the money runs out in year 25 and ₹17.18 lakh of the
    // promised income - ₹3.19 lakh in today's money - never arrives. The
    // policy's 7.22% beats the 7.1% safe rate, so bonds genuinely cannot
    // replicate it, and that is a real finding rather than a formatting bug.
    //
    // sol-060 MOVED THESE FIGURES, and they moved a long way: year 30 to year
    // 25, and ₹11.08 lakh of unpaid income to ₹17.18 lakh. Charging the safe
    // route the slab tax a bond investor actually pays makes the POLICY look
    // materially better. That is the direction dd-021 warned about - the page
    // was built to argue the policy is beatable, and the untaxed bond route was
    // that argument sitting in the defaults.
    const r = analyseReplication(shipped);
    const v = verdictFor(r.safe);

    expect(r.safe.finalBalance).toBe(0);
    expect(v.kind).toBe('shortfall');
    expect(v.tone).toBe('bad');
    if (v.kind !== 'shortfall') throw new Error('unreachable');
    expect(v.exhaustedInYear).toBe(25);
    expect(v.unfunded).toBeCloseTo(1717521.99, 2);
    expect(v.unfundedReal).toBeCloseTo(319269.59, 2);
  });

  it('the growth route wins at the shipped defaults, by a lot', () => {
    const r = analyseReplication(shipped);
    const v = verdictFor(r.growth);

    expect(v.kind).toBe('surplus');
    expect(v.tone).toBe('good');
    expect(r.growth.finalBalance).toBeCloseTo(5251909.23, 2);
    expect(r.growth.taxDrag).toBeCloseTo(838088.97, 2);
    expect(r.growth.unfundedPayout).toBe(0);
  });

  it('a shortfall on one route does not imply one on the other', () => {
    // Which is why the two cards cannot share a verdict, and why the headline
    // has to say which comparison it is making.
    const r = analyseReplication(shipped);
    expect(verdictFor(r.safe).kind).toBe('shortfall');
    expect(verdictFor(r.growth).kind).toBe('surplus');
  });

  it('never reports a surplus and a shortfall at the same time', () => {
    // The property the labels rest on. Across a wide spread of policies and
    // rates, a route either funded everything or it did not - and the verdict's
    // tone follows from that one fact, never from a second reading of the sign.
    const policies = [
      shipped,
      at({ termCost: 0, accidentCost: 0 }),
      at({ payoutAmount: 400000, maturityBenefit: 5000000 }),
      at({ payoutAmount: 1000, maturityBenefit: 0 }),
      at({ ppt: 20, payoutStartYear: 3, payoutYears: 5 }),
      at({ premium: 20000, termCost: 15000, accidentCost: 10000 }),
    ];

    for (const p of policies) {
      for (const rate of [0, 5, 7.1, 12, 20]) {
        const route = replicate(p, rate, CG);
        const v = verdictFor(route);

        expect(route.finalBalance).toBeGreaterThanOrEqual(0);

        if (v.kind === 'shortfall') {
          expect(v.tone).toBe('bad');
          expect(v.unfunded).toBeGreaterThan(0);
          expect(v.exhaustedInYear).toBeGreaterThan(0);
          // The balance is NOT necessarily zero here - see the refill case
          // below - but the shortfall must name a real year inside the policy.
          expect(v.exhaustedInYear).toBeLessThanOrEqual(analyseReplication(p).totalYears);
        } else {
          expect(v.tone).toBe('good');
          expect(route.unfundedPayout).toBe(0);
          expect(route.exhaustedInYear).toBeNull();
        }
      }
    }
  });

  it('leads with the missed payment even when the pot refills afterwards', () => {
    // Income starting in year 3 while premiums run to year 20: the pot is too
    // thin to pay early, misses instalments, and is then refilled by premiums
    // that keep arriving - ending with money in it. A positive closing balance
    // does not undo a payment the reader did not receive in year 3, so the
    // verdict is still a shortfall. This is why the label reads off the
    // verdict rather than off the sign of the balance.
    const r = analyseReplication(at({ ppt: 20, payoutStartYear: 3, payoutYears: 5 }));
    const route = replicate(r.inputs, 20, CG);
    const v = verdictFor(route);

    expect(route.finalBalance).toBeGreaterThan(0);
    expect(v.kind).toBe('shortfall');
    expect(v.tone).toBe('bad');
  });

  it('calls a rupee either way exact, not a surplus', () => {
    // A headline that announces ₹0 of surplus wealth is a worse answer than one
    // that says the route just about covered it.
    const route: Parameters<typeof verdictFor>[0] = {
      finalBalance: 0.4,
      finalBalanceReal: 0.2,
      capitalInvested: 100,
      riskCostPaid: 0,
      taxDrag: 0,
      exhaustedInYear: null,
      unfundedPayout: 0,
      unfundedPayoutReal: 0,
    };
    expect(verdictFor(route).kind).toBe('exact');
  });
});

describe('the maturity benefit input', () => {
  it('honours a zero maturity benefit in the engine', () => {
    // The engine is fine. The DOM reader is not: `parseFormattedNumber(...) ||
    // 1000000` turns a typed 0 back into ₹10 lakh, and the field's own tooltip
    // says 'Type 0 if there is no final bonus'. Recorded in the launch gate;
    // the engine's behaviour is pinned here so the fix has something to land
    // against.
    const rows = buildLedger(at({ maturityBenefit: 0 }));
    expect(rows[29].payoutIn).toBe(120000);
    expect(analyseReplication(at({ maturityBenefit: 0 })).policy.totalNominalPayout).toBe(2400000);
  });
});

describe('real break-even, on its own', () => {
  it('is the first year cumulative real payouts overtake cumulative real premiums', () => {
    const row = (year: number, premiumOut: number, payout: number) => ({
      year,
      premiumOut,
      payoutIn: payout,
      payoutTax: 0,
      payoutNet: payout,
      net: payout - premiumOut,
      realValue: payout,
      realNet: payout,
      realPremium: premiumOut,
    });
    const rows = [row(1, 100, 0), row(2, 0, 60), row(3, 0, 60)];
    expect(realBreakEvenYear(rows)).toBe(3);
    expect(realBreakEvenYear(rows.slice(0, 2))).toBeNull();
  });
});

describe('grossing up a withdrawal for tax', () => {
  it('delivers exactly what was promised', () => {
    // The property the payout comparison rests on: both routes pay the SAME
    // income. If the fund netted the tax out of the payout instead of selling
    // enough to cover it, the DIY reader would quietly receive less than the
    // policyholder and the page would still call the two comparable.
    for (const want of [40000, 120000, 400000, 1500000]) {
      for (const g of [0, 0.1, 0.5, 0.9, 1]) {
        for (const exemption of [0, 125000]) {
          const sold = grossUpForTax(want, g, 0.125, exemption);
          const taxable = Math.max(0, sold * g - exemption);
          const delivered = sold - taxable * 0.125;
          expect(delivered).toBeCloseTo(want, 6);
        }
      }
    }
  });

  it('sells nothing extra when there is no gain, no tax, or nothing wanted', () => {
    expect(grossUpForTax(100000, 0, 0.125, 0)).toBe(100000);
    expect(grossUpForTax(100000, 0.5, 0, 0)).toBe(100000);
    expect(grossUpForTax(0, 0.5, 0.125, 0)).toBe(0);
  });

  it('sells exactly the payout while the gain stays inside the exemption', () => {
    // ₹40,000 of payout at a 50% gain ratio realises ₹20,000 - well under the
    // exemption, so nothing is sold to cover a tax that is not owed.
    expect(grossUpForTax(40000, 0.5, 0.125, 125000)).toBe(40000);
  });
});


/**
 * sol-060 — the safe route is taxed, and taxed the way interest actually is.
 *
 * Until now it paid nothing at all while the growth route paid 12.5%, which
 * flattered the DIY side the page already argues for. dd-021's own test caught
 * it: "if either route is charged a tax or a fee the other is spared, the thesis
 * has already been built into the defaults." Rahul ruled on 17 Aug that the
 * reader chooses the rate — "ask them to choose a slab. 10, 20, 30" — because
 * assuming one would put OUR number inside the reader's comparison.
 */
describe('sol-060 — interest is taxed as it accrues, not when it is withdrawn', () => {
  it('the safe route now pays tax, where it used to pay none', () => {
    const r = analyseReplication(shipped);
    expect(r.safe.taxDrag).toBeGreaterThan(0);
    // And it is not a rounding artefact — it is a material sum over 30 years.
    expect(r.safe.taxDrag).toBeGreaterThan(100000);
  });

  it('a higher slab always leaves the reader worse off, never better', () => {
    // The monotonicity is the property worth pinning. An accrual tax that could
    // ever IMPROVE a balance would mean the leak is being credited somewhere.
    const results = SLAB_RATES_PCT.map((pct) =>
      outcome(replicate(at({ slabRatePct: pct }), shipped.safeRate, slab(pct)))
    );
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBeLessThan(results[i - 1]);
    }
  });

  it('taxing on accrual costs MORE than taxing the same rate on sale', () => {
    // This is the whole reason a bond route could not be modelled by pointing
    // the equity path at a different rate. Tax paid every year is money that
    // never compounds again; tax paid on sale compounds until the sale. Same
    // rate, same return, different money — and the accrual case must be worse.
    const p = at({ slabRatePct: 30 });
    const accrual = outcome(replicate(p, p.safeRate, slab(30)));
    const onSale = outcome(
      replicate(p, p.safeRate, { kind: 'capitalGains', ratePct: 30, annualExemption: 0 })
    );
    expect(accrual).toBeLessThan(onSale);
  });

  it('the growth route is untouched by the slab — it pays LTCG, not slab', () => {
    const a = analyseReplication(at({ slabRatePct: 10 }));
    const b = analyseReplication(at({ slabRatePct: 30 }));
    expect(outcome(a.growth)).toBe(outcome(b.growth));
    expect(a.growth.taxDrag).toBe(b.growth.taxDrag);
    // ...while the safe route moves, which is what says the input reached it.
    expect(outcome(a.safe)).toBeGreaterThan(outcome(b.safe));
  });

  it('a zero rate reproduces the untaxed walk exactly', () => {
    // The bridge to the old behaviour. If these ever diverge, the accrual path
    // is doing something beyond taxing.
    const p = at();
    expect(outcome(replicate(p, p.safeRate, slab(0)))).toBeCloseTo(
      outcome(replicate(p, p.safeRate, NO_TAX)),
      6
    );
  });

  it('neither route is spared what the other pays — dd-021, as an assertion', () => {
    const r = analyseReplication(shipped);
    expect(r.safe.taxDrag).toBeGreaterThan(0);
    expect(r.growth.taxDrag).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// The three costs the overhaul added, 18 Aug. Each of them was a figure of zero
// typed in by omission, and dd-021's test is that a route charged something the
// other is spared is a route the design is arguing against.

describe('the fund fee - the growth route was owning its fund for nothing', () => {
  it('the page does not ship a costless fund', () => {
    // The whole defect in one line: sol-028's fault a third time. If this ever
    // reads zero again, the growth route is being flattered against a bond
    // route whose zero is a fact.
    expect(DEFAULT_FUND_COST.expenseRatio).toBeGreaterThan(0);
  });

  it('costs the growth route real money over the policy s life', () => {
    const free = analyseReplication(at({ equityFeePct: 0 }));
    const charged = analyseReplication(at({ equityFeePct: DEFAULT_FUND_COST.expenseRatio }));

    expect(outcome(charged.growth)).toBeLessThan(outcome(free.growth));
    // Not a rounding difference. A fifth of a percent, charged every year for
    // thirty years on a balance that is compounding, is the point of the fix.
    expect(outcome(free.growth) - outcome(charged.growth)).toBeGreaterThan(100000);
  });

  it('leaves the safe route alone, because a government bond has no annual charge', () => {
    const free = analyseReplication(at({ equityFeePct: 0 }));
    const charged = analyseReplication(at({ equityFeePct: 1.75 }));
    expect(charged.safe.finalBalance).toBeCloseTo(free.safe.finalBalance, 6);
  });

  it('charges the sensitivity table the same fee as the headline', () => {
    // dd-013/dont-2. A table built at the gross rate beside a headline built at
    // the net one is one quantity with two values, and the reader would find it
    // by noticing that the row marked as theirs disagreed with the card above.
    const fee = 0.8;
    const r = analyseReplication(at({ equityFeePct: fee, equityRate: 12 }));
    const ownRow = r.sensitivity.find((row) => row.isBaseline)!;
    expect(ownRow.rate).toBe(12);
    expect(ownRow.surplus).toBeCloseTo(r.growth.finalBalance, 6);
  });
});

describe('an income that grows - simple escalation on the starting income', () => {
  it('is level when the escalation is zero', () => {
    const rows = buildLedger(at({ payoutGrowthPct: 0 }));
    expect(payoutInYear(at({ payoutGrowthPct: 0 }), 11)).toBe(120000);
    expect(payoutInYear(at({ payoutGrowthPct: 0 }), 20)).toBe(120000);
    expect(rows[10].payoutIn).toBe(120000);
  });

  it('adds the same step every year, not a compounding one', () => {
    // 5% SIMPLE: year one pays the base, year eleven pays base + 10 x 5%.
    // Compounding would give 1.05^10 = 1.629 and the difference is not small,
    // which is exactly why the reading is stated on the field rather than left
    // for the reader to assume.
    const inputs = at({ payoutGrowthPct: 5 });
    expect(payoutInYear(inputs, 11)).toBe(120000);
    expect(payoutInYear(inputs, 12)).toBeCloseTo(126000, 6);
    expect(payoutInYear(inputs, 21)).toBeCloseTo(120000 * 1.5, 6);
  });

  it('pays nothing outside the payout window, whatever the escalation', () => {
    const inputs = at({ payoutGrowthPct: 5 });
    expect(payoutInYear(inputs, 10)).toBe(0);
    expect(payoutInYear(inputs, 31)).toBe(0);
  });

  it('makes the policy worth more, and the engine says so', () => {
    // The direction is the whole point: a rising income was being priced as a
    // level one, which understated the policy. This correction favours the
    // product, which is what dd-021 requires of a tool that is not arguing.
    const level = analyseReplication(at({ payoutGrowthPct: 0 }));
    const rising = analyseReplication(at({ payoutGrowthPct: 5 }));
    expect(rising.policy.xirrPct).toBeGreaterThan(level.policy.xirrPct);
    expect(outcome(rising.growth)).toBeLessThan(outcome(level.growth));
  });
});

describe('s.10(10D) - the policy s own tax, which was assumed away', () => {
  it('exempts an ordinary policy, where the premium is well inside a tenth of the cover', () => {
    const t = payoutTaxationOf(shipped);
    expect(t.exempt).toBe(true);
    expect(t.taxableFraction).toBe(0);
    expect(analyseReplication(shipped).policy.taxOnPayouts).toBe(0);
  });

  it('withdraws the exemption when the cover is token beside the premium', () => {
    // Rs 1 lakh a year against Rs 5 lakh of cover: the premium is a fifth of the
    // sum assured, twice the statutory tenth. This is what a savings plan sold
    // as an investment actually looks like, and it is the shape this tool exists
    // to examine.
    const t = payoutTaxationOf(at({ sumAssured: 500000 }));
    expect(t.exempt).toBe(false);
    expect(t.reason).toBeTruthy();
    expect(t.taxableFraction).toBeGreaterThan(0);
    expect(t.taxableFraction).toBeLessThan(1);
  });

  it('taxes only the income inside the proceeds, never the premiums back', () => {
    // Conservation: the taxable fraction times the gross payout is the gross
    // payout less every rupee of premium the reader put in.
    const inputs = at({ sumAssured: 500000 });
    const r = analyseReplication(inputs);
    const gross = r.policy.totalNominalPayout;
    const premiums = inputs.premium * inputs.ppt;
    const taxed = gross * payoutTaxationOf(inputs).taxableFraction;
    expect(taxed).toBeCloseTo(gross - premiums, 4);
  });

  it('has nothing to tax where the policy pays back less than it took', () => {
    const t = payoutTaxationOf(at({ sumAssured: 100000, payoutAmount: 0, maturityBenefit: 500000 }));
    expect(t.exempt).toBe(false);
    expect(t.taxableFraction).toBe(0);
  });

  it('makes the replica fund what the reader KEEPS, not what the brochure states', () => {
    // The premise the whole page rests on is that both routes pay the identical
    // income. Once the policy s payout can be taxed, matching the gross figure
    // would quietly make the replica do more work for the same verdict.
    const rows = buildLedger(at({ sumAssured: 500000 }));
    const payingYear = rows[10];
    expect(payingYear.payoutTax).toBeGreaterThan(0);
    expect(payingYear.payoutNet).toBeCloseTo(payingYear.payoutIn - payingYear.payoutTax, 6);
    expect(payingYear.payoutNet).toBeLessThan(payingYear.payoutIn);
  });

  it('reports both yields, and they part company exactly when the exemption does', () => {
    const exempt = analyseReplication(shipped);
    expect(exempt.policy.xirrPct).toBeCloseTo(exempt.policy.xirrPreTaxPct, 9);
    expect(exempt.policy.taxFree).toBe(true);

    const taxed = analyseReplication(at({ sumAssured: 500000 }));
    expect(taxed.policy.taxFree).toBe(false);
    expect(taxed.policy.xirrPct).toBeLessThan(taxed.policy.xirrPreTaxPct);
  });

  it('a bigger slab costs a taxable policy more and an exempt one nothing', () => {
    const exemptLow = analyseReplication(at({ slabRatePct: 10 }));
    const exemptHigh = analyseReplication(at({ slabRatePct: 30 }));
    expect(exemptHigh.policy.xirrPct).toBeCloseTo(exemptLow.policy.xirrPct, 9);

    const taxedLow = analyseReplication(at({ sumAssured: 500000, slabRatePct: 10 }));
    const taxedHigh = analyseReplication(at({ sumAssured: 500000, slabRatePct: 30 }));
    expect(taxedHigh.policy.xirrPct).toBeLessThan(taxedLow.policy.xirrPct);
  });

  it('break-even is measured on what the reader keeps', () => {
    const exemptYear = analyseReplication(shipped).policy.breakEvenYear;
    const taxedYear = analyseReplication(at({ sumAssured: 500000 })).policy.breakEvenYear;
    // Later, or never. A policy whose proceeds are taxed takes longer to repay
    // its own premiums, and measuring on the gross figure would have said it
    // repaid them on the same day it always did.
    if (exemptYear !== null && taxedYear !== null) expect(taxedYear).toBeGreaterThanOrEqual(exemptYear);
    else expect(taxedYear).toBeNull();
  });
});

describe('dd-021 - the corrections do not all point one way', () => {
  it('two of the three favour the policy and one favours the replica', () => {
    const base = at({ payoutGrowthPct: 0, equityFeePct: 0, sumAssured: 10000000 });

    // The fund fee takes money off the replica: it favours the POLICY.
    const withFee = analyseReplication({ ...base, equityFeePct: 0.2 });
    expect(outcome(withFee.growth)).toBeLessThan(outcome(analyseReplication(base).growth));

    // An escalating income makes the policy pay more: it favours the POLICY.
    const withGrowth = analyseReplication({ ...base, payoutGrowthPct: 5 });
    expect(withGrowth.policy.xirrPct).toBeGreaterThan(analyseReplication(base).policy.xirrPct);

    // s.10(10D) takes money off the policy: it favours the REPLICA.
    const taxed = analyseReplication({ ...base, sumAssured: 500000 });
    expect(taxed.policy.xirrPct).toBeLessThan(analyseReplication(base).policy.xirrPct);
  });

  it('can print a verdict for the policy from a policy that deserves one', () => {
    // The brief's own test: "Feed it a genuinely good policy. Does the screen
    // say so, plainly, without hedging?" A tool that can only produce one answer
    // is advocacy, so this asserts that the other answer is reachable at all.
    const good = at({
      payoutAmount: 260000,
      payoutGrowthPct: 5,
      maturityBenefit: 2000000,
      equityFeePct: 1.75,
    });
    const r = analyseReplication(good);
    expect(verdictFor(r.growth).kind).toBe('shortfall');
    expect(verdictFor(r.safe).kind).toBe('shortfall');
    expect(r.policy.xirrPct).toBeGreaterThan(good.equityRate - good.equityFeePct);
  });
});

describe('the spine - which questions this policy shape actually needs', () => {
  it('asks nothing until the shape is known', () => {
    expect(spineFor(null)).toEqual([]);
  });

  it('never asks an endowment when its income starts', () => {
    const fields = spineFor('lumpSum').map((s) => s.field);
    expect(fields).not.toContain('inPayout');
    expect(fields).not.toContain('inPayoutStart');
    expect(fields).not.toContain('inPayoutYears');
    // It has to say WHEN it pays, though - that is the question the shape swaps in.
    expect(fields).toContain('inMaturityYear');
  });

  it('never asks a pure money-back plan for a maturity amount', () => {
    const fields = spineFor('income').map((s) => s.field);
    expect(fields).not.toContain('inMaturity');
    expect(fields).not.toContain('inMaturityYear');
    expect(fields).toContain('inPayoutStart');
  });

  it('asks a hybrid for both, but only asks WHEN once', () => {
    // dd-020/dont-2: the maturity of a policy that also pays an income lands in
    // the last income year, so asking for its year again would be a question
    // that removes nothing.
    const fields = spineFor('both').map((s) => s.field);
    expect(fields).toContain('inPayoutStart');
    expect(fields).toContain('inMaturity');
    expect(fields).not.toContain('inMaturityYear');
  });

  it('ends every shape on the cover and the slab', () => {
    for (const shape of ['income', 'lumpSum', 'both'] as const) {
      const fields = spineFor(shape).map((s) => s.field);
      expect(fields.slice(-2)).toEqual(['inTermCover', 'inSlabRate']);
    }
  });

  it('every step says what it is waiting for, in words a reader could read', () => {
    for (const shape of ['income', 'lumpSum', 'both'] as const) {
      for (const step of spineFor(shape)) {
        expect(step.waitingFor.length).toBeGreaterThan(10);
        expect(step.waitingFor).not.toMatch(/[A-Z]{4,}|_|\bin[A-Z]/);
      }
    }
  });
});

describe('the two figures the page must not work out for itself', () => {
  it('discounts the cover cost on the premium s own timing', () => {
    // dd-013/dont-1: a view that computes a figure is a second engine waiting
    // to disagree with the first. The cover is bought at the START of each year,
    // like the premium it comes out of, so year one is not discounted at all.
    const r = analyseReplication(shipped);
    expect(r.riskCostPaid).toBe((shipped.termCost + shipped.accidentCost) * shipped.ppt);
    expect(r.riskCostPaidReal).toBeLessThan(r.riskCostPaid);

    const infl = shipped.inflationRate / 100;
    let expected = 0;
    for (let yr = 1; yr <= shipped.ppt; yr++) {
      expected += (shipped.termCost + shipped.accidentCost) / Math.pow(1 + infl, yr - 1);
    }
    expect(r.riskCostPaidReal).toBeCloseTo(expected, 6);
  });

  it('measures what the fee cost, compounding included, rather than adding it up', () => {
    const free = analyseReplication(at({ equityFeePct: 0 }));
    const charged = analyseReplication(at({ equityFeePct: 0.2 }));

    expect(free.growthFeeCost).toBe(0);
    expect(charged.growthFeeCost).toBeGreaterThan(0);
    // It is the difference between the two walks, which is the fee plus every
    // rupee of growth it would have earned - much more than the fee alone.
    expect(charged.growthFeeCost).toBeCloseTo(
      outcome(free.growth) - outcome(charged.growth),
      4
    );
    const feesAlone = 0.002 * charged.investableCapital * charged.inputs.ppt;
    expect(charged.growthFeeCost).toBeGreaterThan(feesAlone);
  });
});

describe('3-way premium decomposition (mortality vs friction vs net invested capital)', () => {
  it('splits premium into pure cover, intermediary loading/GST, and net invested capital', () => {
    const r = analyseReplication(shipped);
    const d = r.premiumDecomposition;

    expect(d.annualPremium).toBe(100000);
    expect(d.mortalityCost).toBe(17000); // 12,000 term + 5,000 accident
    expect(d.mortalityPct).toBe(17.0);

    // GST + Commission annualized over 10 years PPT
    // gstPaid = 24,750 / 10 = 2,475; commission = 20,000 / 10 = 2,000 -> 4,475
    expect(d.intermediaryFrictionCost).toBe(4475);
    expect(d.intermediaryFrictionPct).toBe(4.5);

    // Net capital = 100,000 - 17,000 - 4,475 = 78,525
    expect(d.netInvestedCapital).toBe(78525);
    expect(d.netInvestedPct).toBe(78.5);

    // Total parts sum to 100%
    expect(d.mortalityCost + d.intermediaryFrictionCost + d.netInvestedCapital).toBe(d.annualPremium);
    expect(d.mortalityPct + d.intermediaryFrictionPct + d.netInvestedPct).toBeCloseTo(100.0, 1);
  });

  it('handles zero premium gracefully', () => {
    const r = analyseReplication(at({ premium: 0 }));
    const d = r.premiumDecomposition;
    expect(d.annualPremium).toBe(0);
    expect(d.mortalityCost).toBe(0);
    expect(d.intermediaryFrictionCost).toBe(0);
    expect(d.netInvestedCapital).toBe(0);
  });
});

describe('sunk-cost / surrender & paid-up arbitrage solver', () => {
  it('returns undefined when evaluating a new policy (currentPolicyYear = 0)', () => {
    const r = analyseReplication(shipped);
    expect(r.surrenderAnalysis).toBeUndefined();
  });

  it('evaluates IRDAI Special Surrender Value (SSV) curve accurately across policy ages', () => {
    // Year 1: 0% SSV
    const yr1 = analyseReplication(at({ currentPolicyYear: 1, premiumsPaidSoFar: 1 })).surrenderAnalysis!;
    expect(yr1).toBeDefined();
    expect(yr1.ssvFactorPct).toBe(0);
    expect(yr1.estimatedSurrenderValue).toBe(0);
    expect(yr1.surrenderHaircutLoss).toBe(100000);

    // Year 3: 35% SSV
    const yr3 = analyseReplication(at({ currentPolicyYear: 3, premiumsPaidSoFar: 3 })).surrenderAnalysis!;
    expect(yr3.ssvFactorPct).toBe(35);
    expect(yr3.totalPremiumsPaidToDate).toBe(300000);
    expect(yr3.estimatedSurrenderValue).toBe(105000);
    expect(yr3.surrenderHaircutLoss).toBe(195000);

    // Year 5: 50% SSV
    const yr5 = analyseReplication(at({ currentPolicyYear: 5, premiumsPaidSoFar: 5 })).surrenderAnalysis!;
    expect(yr5.ssvFactorPct).toBe(50);
    expect(yr5.totalPremiumsPaidToDate).toBe(500000);
    expect(yr5.estimatedSurrenderValue).toBe(250000);
    expect(yr5.surrenderHaircutLoss).toBe(250000);

    // Year 10: 50% + 3*5% = 65% SSV
    const yr10 = analyseReplication(at({ currentPolicyYear: 10, premiumsPaidSoFar: 10 })).surrenderAnalysis!;
    expect(yr10.ssvFactorPct).toBe(65);
    expect(yr10.totalPremiumsPaidToDate).toBe(1000000);
    expect(yr10.estimatedSurrenderValue).toBe(650000);
    expect(yr10.surrenderHaircutLoss).toBe(350000);
  });

  it('proves surrender & pivot creates massive wealth surplus over holding a sub-5% policy with 25 years left', () => {
    const poorPolicy = at({
      premium: 100000,
      ppt: 10,
      payoutStartYear: 11,
      payoutYears: 20,
      payoutAmount: 60000, // Very low 3-4% yield policy
      maturityBenefit: 500000,
      currentPolicyYear: 5,
      premiumsPaidSoFar: 5,
    });

    const r = analyseReplication(poorPolicy);
    const s = r.surrenderAnalysis!;

    expect(s.recommendedAction).toBe('SURRENDER_AND_PIVOT');
    expect(s.arbitrageDeltaVsHold).toBeGreaterThan(0);
    expect(s.optionASurrenderAndReinvest.terminalCorpus).toBeGreaterThan(s.optionCHoldToMaturity.terminalPayoutsTotal);
  });

  it('recommends holding to maturity when near the end (e.g. year 19 of 20) where haircut cannot be recouped', () => {
    const nearMaturity = at({
      premium: 100000,
      ppt: 10,
      payoutStartYear: 11,
      payoutYears: 10,
      payoutAmount: 150000,
      maturityBenefit: 2000000,
      currentPolicyYear: 19,
      premiumsPaidSoFar: 10, // All premiums already paid
    });

    const r = analyseReplication(nearMaturity);
    const s = r.surrenderAnalysis!;

    expect(s.recommendedAction).toBe('HOLD_TO_MATURITY');
  });
});

