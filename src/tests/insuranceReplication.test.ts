import { describe, it, expect } from 'vitest';
import {
  analyseReplication,
  replicate,
  buildLedger,
  realBreakEvenYear,
  investableCapitalOf,
  frictionsOf,
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

  it('is NOT monotonic once the route runs out of money - a defect, pinned', () => {
    // Found on the live page within minutes of the engine being callable.
    //
    // The walk lets the balance go negative and then keeps compounding it, so
    // an exhausted portfolio grows a DEBT at the equity rate. The reader is
    // told, in a table whose entire purpose is 'what if returns are lower than
    // you hope', that a HIGHER return leaves them worse off:
    //
    //   8% -> -1.73 Cr    10% -> -1.81 Cr    12% -> -1.81 Cr    14% -> -1.63 Cr
    //
    // No investor experiences this. A portfolio that cannot meet a withdrawal
    // is exhausted; it does not borrow at 12% and carry on. The honest answer
    // is the year the money ran out, which is also the only answer that makes
    // the deficit figure mean anything. Deferred rather than fixed inside the
    // extraction, and listed on the launch gate - it changes what the page
    // reports, which is a decision, not a refactor.
    const generous = at({ payoutAmount: 400000, maturityBenefit: 5000000 });
    const s = analyseReplication(generous).sensitivity;
    const by = (rate: number) => s.find((row) => row.rate === rate)!.surplus;

    expect(by(10)).toBeLessThan(by(8));
    expect(by(14)).toBeGreaterThan(by(12));
  });

  it('lets an exhausted balance compound into a larger debt - the same defect, isolated', () => {
    // The deficit is worst in the MIDDLE of the range, around 11%: high enough
    // to have been compounding the shortfall for years, not high enough to have
    // outgrown it. Nothing but the sign of the balance produces that shape. If
    // a fix ever floors the walk at zero and reports the year the money ran
    // out, this test is the one that should fail.
    const broke = at({ payoutAmount: 400000, maturityBenefit: 5000000 });
    const worst = replicate(broke, 11, false).finalBalance;

    expect(worst).toBeLessThan(replicate(broke, 8, false).finalBalance);
    expect(worst).toBeLessThan(replicate(broke, 14, false).finalBalance);
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
  it('charges 12.5% above the exemption on the terminal gain', () => {
    const r = analyseReplication(shipped);
    const gross = r.growth.finalBalance + r.growth.taxDrag;
    const expected = Math.max(0, gross - r.growth.capitalInvested - LTCG_EXEMPTION) * 0.125;

    expect(r.growth.taxDrag).toBeCloseTo(expected, 6);
    expect(r.growth.taxDrag).toBeGreaterThan(0);
  });

  it('charges nothing when the route ends under water', () => {
    const r = analyseReplication(at({ payoutAmount: 400000, maturityBenefit: 5000000 }));
    expect(r.growth.finalBalance).toBeLessThan(0);
    expect(r.growth.taxDrag).toBe(0);
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

describe('what the page currently says, and where its labels break', () => {
  it('the safe route FALLS SHORT at the shipped defaults', () => {
    // The finding the next T5 item exists to fix, pinned as a number.
    //
    // At the defaults the safe route ends ₹11.08 LAKH SHORT of funding the
    // policy's promises - the policy's 7.22% beats 7.1%, so bonds cannot
    // replicate it. The page prints that figure under a heading that reads
    // 'Surplus Wealth / Deficit', in emerald green, with a badge that says
    // POLICY WINS. Sign, word and colour disagree with one another.
    const r = analyseReplication(shipped);
    expect(r.safe.finalBalance).toBeLessThan(0);
    expect(r.safe.finalBalance).toBeCloseTo(-1108260.16, 2);
  });

  it('the growth route wins at the shipped defaults, by a lot', () => {
    const r = analyseReplication(shipped);
    expect(r.growth.finalBalance).toBeCloseTo(5448123.42, 2);
    expect(r.growth.taxDrag).toBeCloseTo(641874.77, 2);
  });

  it('the growth route can fall short too, and the bottom line still says SURPLUS WEALTH', () => {
    // A generous policy - ₹4 L a year and ₹50 L at maturity - which 12% equity
    // cannot fund either. The takeaway sentence is unconditional today: it
    // reports a negative number as surplus wealth.
    const r = analyseReplication(at({ payoutAmount: 400000, maturityBenefit: 5000000 }));
    expect(r.policy.xirrPct).toBeGreaterThan(12);
    expect(r.safe.finalBalance).toBeLessThan(0);
    expect(r.growth.finalBalance).toBeLessThan(0);
  });

  it('a deficit on the safe route does not imply one on the growth route', () => {
    // Which is why the two cards cannot share one verdict, and why the page
    // needs the unbundling headline to say which comparison it is making.
    const r = analyseReplication(shipped);
    expect(r.safe.finalBalance).toBeLessThan(0);
    expect(r.growth.finalBalance).toBeGreaterThan(0);
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
