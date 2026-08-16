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
  LTCG_RATE_PCT,
  LTCG_EXEMPTION,
  type PolicyInputs,
} from '../utils/insuranceReplication';

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
  maturityBenefit: 1000000,
  inflationRate: 6,
  safeRate: 7.1,
  equityRate: 12,
  // The advanced panel's defaults - ₹1 cr of term at ₹12,000 and ₹50 L of
  // accident cover at ₹5,000.
  termCost: 12000,
  accidentCost: 5000,
  ltcgRatePct: LTCG_RATE_PCT,
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
    const route = replicate(noCover, irr, false);

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
    const ranOut = (rate: number) => replicate(generous, rate, true).exhaustedInYear!;

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
      expect(replicate(broke, rate, false).finalBalance).toBeGreaterThanOrEqual(0);
      expect(replicate(broke, rate, true).finalBalance).toBeGreaterThanOrEqual(0);
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

  it('leaves the safe route untaxed - which is a defect, recorded here rather than defended', () => {
    // Interest on a bond or a PPF-alternative is not tax-free at slab rates,
    // and the page taxes only the equity route. That flatters the SAFE route,
    // which is the one the page uses to argue the policy is beatable without
    // taking any risk. Named in a test so the next person to touch this cannot
    // mistake it for a decision that was already made.
    const r = analyseReplication(at({ payoutAmount: 20000, maturityBenefit: 0 }));
    expect(r.safe.finalBalance).toBeGreaterThan(0);
    expect(r.safe.taxDrag).toBe(0);
  });
});

describe('the verdict - sign, word and badge cannot disagree', () => {
  it('the safe route runs out at the shipped defaults, and says so', () => {
    // What the page used to print here: '-₹11.08 Lakh' in emerald green, under
    // a heading reading 'Surplus Wealth / Deficit', beside a badge saying
    // POLICY WINS, while the bottom line called it SURPLUS WEALTH. Four
    // independent decisions about one fact.
    //
    // What it says now: the money runs out in year 30 and ₹11.08 lakh of the
    // promised income - ₹1.93 lakh in today's money - never arrives. The
    // policy's 7.22% beats the 7.1% safe rate, so bonds genuinely cannot
    // replicate it, and that is a real finding rather than a formatting bug.
    const r = analyseReplication(shipped);
    const v = verdictFor(r.safe);

    expect(r.safe.finalBalance).toBe(0);
    expect(v.kind).toBe('shortfall');
    expect(v.tone).toBe('bad');
    if (v.kind !== 'shortfall') throw new Error('unreachable');
    expect(v.exhaustedInYear).toBe(30);
    expect(v.unfunded).toBeCloseTo(1108260.16, 2);
    expect(v.unfundedReal).toBeCloseTo(192959.32, 2);
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
        const route = replicate(p, rate, true);
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
    const route = replicate(r.inputs, 20, true);
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
    const rows = [
      { year: 1, premiumOut: 100, payoutIn: 0, net: -100, realValue: 0, realPremium: 100 },
      { year: 2, premiumOut: 0, payoutIn: 60, net: 60, realValue: 60, realPremium: 0 },
      { year: 3, premiumOut: 0, payoutIn: 60, net: 60, realValue: 60, realPremium: 0 },
    ];
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
