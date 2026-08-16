import { describe, it, expect } from 'vitest';
import { runGoalSeek, runSimulation } from '../workers/sipWorker';

// Characterization tests for the SIP engine. Until now this was 228 lines of
// simulation with zero coverage, all of it sealed inside self.onmessage. T3
// redesigns this page, so these lock current behaviour first: the point is not
// that these numbers are sacred, it's that a UI refactor must not move them
// without someone deciding to.

const base = {
  seedCapital: 0,
  stepUpRate: 0.10,
  horizonYears: 20,
  inflationRate: 0.06,
  eqPct: 0.70,
  debtPct: 0.20,
  goldPct: 0.10,
  bsEnabled: false,
  annualHedgingDragCost: 0,
  // sol-028, second instance. These three were module constants inside the
  // engine until 15 Aug - 12% growth, 15% roughness, a -8% floor - which is
  // why no control on the page could move them. They are stated here so that
  // every characterization figure below still describes exactly the world it
  // was recorded in, and so that the world is now VISIBLE rather than
  // inherited. The shipped page passes the regime preset instead.
  equityReturn: 12,
  equityVolatility: 15,
  hedgingFloorLimit: -8,
  // Zero, stated. Every figure below was recorded in a world where the fund was
  // free to own, because until 16 Aug the engine had no idea funds charged
  // anything. Writing the zero down rather than inheriting it is the whole
  // point of sol-028 - and it keeps these characterization figures describing
  // the world they were actually taken from. What the fee does is asserted
  // separately, below.
  annualExpenseRatio: 0,
};

const sim = (over = {}) => runSimulation({ ...base, monthlySip: 20000, numSims: 800, ...over });

describe('SIP simulation - reproducibility', () => {
  it('the same inputs give the same projection twice', () => {
    const a = sim();
    const b = sim();
    expect(a.p50Real).toEqual(b.p50Real);
    expect(a.expectedNominalMedian).toBe(b.expectedNominalMedian);
  });

  it('a different seed gives a different draw', () => {
    expect(sim({ seed: 1 }).expectedNominalMedian)
      .not.toBe(sim({ seed: 2 }).expectedNominalMedian);
  });
});

// sol-028, second instance. The planner was fixed on 15 Aug and this engine was
// not, because here the growth and roughness were not inputs at all - they were
// `const eqDrift = (0.12 - 0.5 * 0.15 * 0.15) / 12` at module scope. A regime
// preset on this page would have moved a label and left every number alone.
// These are the guards that say the assumption now reaches the maths.
describe('sol-028 - the engine has no opinion about the market', () => {
  it('growth and roughness must be stated, not inherited', () => {
    // A silent fallback is how the last default survived unexamined. Omitting
    // the assumption is an error, and the error says which one is missing.
    const { equityReturn, ...noGrowth } = base;
    expect(() => runSimulation({ ...noGrowth, monthlySip: 20000, numSims: 10 }))
      .toThrow(/equityReturn is required/);

    const { equityVolatility, ...noVol } = base;
    expect(() => runSimulation({ ...noVol, monthlySip: 20000, numSims: 10 }))
      .toThrow(/equityVolatility is required/);

    const { hedgingFloorLimit, ...noFloor } = base;
    expect(() => runSimulation({ ...noFloor, monthlySip: 20000, numSims: 10 }))
      .toThrow(/hedgingFloorLimit is required/);
  });

  it('the fund fee must be stated too - a free fund is not a default', () => {
    // The newest assumption gets the strictest treatment, because a zero that
    // arrives by omission is the hardest kind to find. Growth is uncertain and
    // the crash is uncertain; this one is charged every year regardless, and it
    // was the only cost missing.
    const { annualExpenseRatio, ...noFee } = base;
    expect(() => runSimulation({ ...noFee, monthlySip: 20000, numSims: 10 }))
      .toThrow(/annualExpenseRatio is required/);
  });

  it('a different regime gives a different answer', () => {
    // The last-10-years preset and the last-30-years preset describe worlds
    // that are not close to each other. If this passes at equality the presets
    // are decoration.
    const calm = sim({ equityReturn: 15.9, equityVolatility: 8.9 });
    const long = sim({ equityReturn: 13.4, equityVolatility: 28.4 });
    expect(long.expectedNominalMedian).not.toBe(calm.expectedNominalMedian);
    // Rougher AND lower-growth: the median must be worse, and the spread wider.
    expect(long.expectedNominalMedian).toBeLessThan(calm.expectedNominalMedian);
    const spread = (r: any) =>
      (r.p90Nominal[20] - r.p10Nominal[20]) / r.p50Nominal[20];
    expect(spread(long)).toBeGreaterThan(spread(calm));
  });

  it('roughness alone drags the median down, at the same growth', () => {
    // Volatility drag, isolated. Same expected return, rougher ride, worse
    // median - the thing the planner's own copy claims and this engine has
    // never been able to demonstrate because roughness was welded shut.
    const smooth = sim({ equityVolatility: 10 });
    const rough = sim({ equityVolatility: 30 });
    expect(rough.p50Nominal[20]).toBeLessThan(smooth.p50Nominal[20]);
  });

  it('the floor depth is a parameter, and a deeper floor protects less', () => {
    // Priced at zero so this compares the contract and nothing else. A -20%
    // floor binds in far fewer years than a -5% one, so it is worth less.
    const free = { bsEnabled: true, annualHedgingDragCost: 0 };
    const shallow = sim({ ...free, hedgingFloorLimit: -5 });
    const deep = sim({ ...free, hedgingFloorLimit: -20 });
    expect(deep.p10Nominal[20]).toBeLessThan(shallow.p10Nominal[20]);
  });
});

describe('SIP simulation - internal consistency', () => {
  it('real values are the nominal values discounted at the stated inflation', () => {
    const r = sim();
    for (const yr of [1, 5, 10, 20]) {
      const discount = Math.pow(1 + base.inflationRate, yr);
      expect(Math.abs(r.p50Real[yr] - r.p50Nominal[yr] / discount)).toBeLessThanOrEqual(1);
    }
  });

  it('percentiles are ordered p10 <= p50 <= p90 at every year', () => {
    const r = sim();
    for (let yr = 1; yr <= base.horizonYears; yr++) {
      expect(r.p10Nominal[yr]).toBeLessThanOrEqual(r.p50Nominal[yr]);
      expect(r.p50Nominal[yr]).toBeLessThanOrEqual(r.p90Nominal[yr]);
    }
  });

  it('total invested matches the step-up schedule', () => {
    // 20k/month, 20 years, no seed capital, and a step-up that is now a REAL
    // 10% on top of holding pace with 6% inflation (dd-017). The instalment
    // therefore rises by 1.06 * 1.10 a year in cash.
    //
    // This figure moved when the meaning of `stepUpRate` changed, and it moved
    // deliberately: the field used to be the whole of the escalation, so a
    // 10% step-up meant the saver's real contribution grew by only 3.8% a year
    // while the planner's identically named field meant a real 10% on the other
    // side of the same product.
    let expected = 0;
    let s = 20000;
    const escalation = 1.06 * 1.10;
    for (let yr = 1; yr <= 20; yr++) {
      if (yr > 1) s *= escalation;
      expected += s * 12;
    }
    expect(Math.abs(sim().nominalTotalInvested - expected)).toBeLessThan(1);
  });

  it('a real step-up of zero holds the instalment\'s purchasing power', () => {
    // dd-017, and the reason the default is what it is. At a zero real step the
    // contribution still rises in cash, exactly with prices, so what the saver
    // gives up each month never changes. It used to stand still in cash and
    // fall by two thirds in value across the horizon.
    const flat = sim({ stepUpRate: 0 });
    let expected = 0;
    let s = 20000;
    for (let yr = 1; yr <= 20; yr++) {
      if (yr > 1) s *= 1.06;
      expected += s * 12;
    }
    expect(Math.abs(flat.nominalTotalInvested - expected)).toBeLessThan(1);

    // And the real cost per year is genuinely constant: 20,000 x 12, every
    // year, discounted back. Twenty years of it, to within rounding.
    expect(flat.realOutflowPV / (20000 * 12 * 20)).toBeGreaterThan(0.94);
    expect(flat.realOutflowPV / (20000 * 12 * 20)).toBeLessThan(1.0);
  });

  it('the real cost of the plan is less than its nominal cost', () => {
    // Money paid in year 20 is worth less than money paid in year 1, so the
    // present value of the outflow must sit below the raw sum.
    const r = sim();
    expect(r.realOutflowPV).toBeLessThan(r.nominalTotalInvested);
    expect(r.realOutflowPV).toBeGreaterThan(0);
  });
});

describe('SIP simulation - behaviour responds to inputs', () => {
  it('more monthly investment produces more wealth', () => {
    expect(sim({ monthlySip: 40000 }).expectedNominalMedian)
      .toBeGreaterThan(sim({ monthlySip: 20000 }).expectedNominalMedian);
  });

  it('a step-up beats a flat contribution', () => {
    expect(sim({ stepUpRate: 0.10 }).expectedNominalMedian)
      .toBeGreaterThan(sim({ stepUpRate: 0 }).expectedNominalMedian);
  });

  it('an all-debt portfolio is far narrower than an all-equity one', () => {
    const spread = (r: any) =>
      (r.p90Nominal[20] - r.p10Nominal[20]) / r.p50Nominal[20];
    const debt = sim({ eqPct: 0, debtPct: 1, goldPct: 0 });
    const equity = sim({ eqPct: 1, debtPct: 0, goldPct: 0 });
    expect(spread(debt)).toBeLessThan(spread(equity));
  });

  it('seed capital carries through to the outcome', () => {
    expect(sim({ seedCapital: 2500000 }).expectedNominalMedian)
      .toBeGreaterThan(sim({ seedCapital: 0 }).expectedNominalMedian);
  });
});

// Portfolio insurance - sol-018, fixed. These replace a deliberate `it.fails`
// that recorded the defect while it stood. Each test below pins one of the
// four modelling decisions that were answered before the fix was written, so
// that a future change to the hedging loop cannot quietly re-decide any of
// them. The premium the site charges is 1.85% of the equity sleeve, which the
// call sites pass as a portfolio-level rate of 0.0185 * eqPct.
describe('SIP simulation - portfolio insurance', () => {
  const PREMIUM = 0.0185 * base.eqPct;
  const hedged = (over = {}) => sim({ bsEnabled: true, annualHedgingDragCost: PREMIUM, ...over });
  const last = (r: any, k: 'p10Nominal' | 'p50Nominal' | 'p90Nominal') => r[k][base.horizonYears];

  it('hedging costs return at the median - the premium is real', () => {
    // The headline defect. Before the fix this ratio was 2.45: insurance more
    // than doubled the median outcome, inverting the site's own claim that
    // rolling puts cost money.
    expect(hedged().expectedNominalMedian).toBeLessThan(sim().expectedNominalMedian);
  });

  it('a -8% ANNUAL floor is worth a few percent, not a doubling', () => {
    // The regression guard on "a rate compounds, a floor binds". Priced at
    // zero, the floor can only help, and the size of that help is the whole
    // question: an annual floor at -8% binds in about 10% of years, so it is
    // worth a few percent over 20 years. Dividing it by 12 and applying it
    // monthly bound in 35.8% of months and was worth +145%.
    const free = sim({ bsEnabled: true, annualHedgingDragCost: 0 });
    const ratio = free.expectedNominalMedian / sim().expectedNominalMedian;
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(1.15);
  });

  it('the premium is charged exactly once, never netted against the payoff', () => {
    // Decision 4. With no contributions the premium is a deterministic
    // multiplicative haircut, so hedging with a premium must land on hedging
    // without one times (1 - premium)^years. Charging it twice - the easy
    // mistake, once as a return drag and once as cash - would square that.
    const lump = { seedCapital: 10000000, monthlySip: 0, stepUpRate: 0, numSims: 400 };
    const withPremium = sim({ ...lump, bsEnabled: true, annualHedgingDragCost: PREMIUM });
    const noPremium = sim({ ...lump, bsEnabled: true, annualHedgingDragCost: 0 });

    const oneCharge = Math.pow(1 - PREMIUM, base.horizonYears);
    const observed = last(withPremium, 'p50Nominal') / last(noPremium, 'p50Nominal');
    expect(Math.abs(observed / oneCharge - 1)).toBeLessThan(0.01);
    expect(observed).toBeGreaterThan(oneCharge * oneCharge * 1.2);
  });

  it('a dearer premium is worse at every percentile', () => {
    // The payoff does not depend on what was paid for it, so raising the
    // premium must move the whole distribution down. If premium and payoff
    // were ever netted into one number this would go soft somewhere.
    const cheap = sim({ bsEnabled: true, annualHedgingDragCost: 0.001 });
    const dear = sim({ bsEnabled: true, annualHedgingDragCost: 0.05 });
    for (const k of ['p10Nominal', 'p50Nominal', 'p90Nominal'] as const) {
      expect(last(dear, k)).toBeLessThan(last(cheap, k));
    }
  });

  it('what protection there is lands in the bad tail, not the good one', () => {
    // The signature of insurance, and the reason the median falling is not by
    // itself proof of a correct model. The premium is paid in every path; the
    // payoff arrives only in bad ones. So the cost of hedging must be largest
    // at p90, where the put expires worthless, and smallest at p10, where it
    // pays. A model that over-protects inverts this ordering.
    const u = sim();
    const h = hedged();
    const cost = (k: 'p10Nominal' | 'p50Nominal' | 'p90Nominal') => 1 - last(h, k) / last(u, k);
    expect(cost('p90Nominal')).toBeGreaterThan(cost('p50Nominal'));
    expect(cost('p50Nominal')).toBeGreaterThan(cost('p10Nominal'));
    expect(cost('p10Nominal')).toBeGreaterThan(0);
  });

  it('instalments arriving mid-term are not retroactively insured', () => {
    // Decision 3. The notional is fixed when the put is struck, so a lump sum
    // sitting there all year is fully covered while a monthly stream is not -
    // money that arrives in month 11 bought no protection for that year.
    // Priced at zero so this compares coverage and nothing else.
    const free = { bsEnabled: true, annualHedgingDragCost: 0 };
    const lump = { seedCapital: 10000000, monthlySip: 0, stepUpRate: 0, numSims: 400 };

    const lumpGain =
      last(sim({ ...lump, ...free }), 'p10Nominal') / last(sim(lump), 'p10Nominal');
    const streamGain = last(sim(free), 'p10Nominal') / last(sim(), 'p10Nominal');

    expect(lumpGain).toBeGreaterThan(streamGain);
  });

  it('an unhedged run is untouched by the premium parameter', () => {
    // bsEnabled off must mean no hedge state at all, not a zero-sized one.
    expect(sim({ annualHedgingDragCost: 0.05 }).expectedNominalMedian)
      .toBe(sim({ annualHedgingDragCost: 0 }).expectedNominalMedian);
  });

  it('an all-debt portfolio buys no equity insurance and pays no premium', () => {
    // There is no equity sleeve to write a put on, so the premium must not be
    // charged against debt and gold.
    const allDebt = { eqPct: 0, debtPct: 1, goldPct: 0 };
    expect(sim({ ...allDebt, bsEnabled: true, annualHedgingDragCost: PREMIUM }).expectedNominalMedian)
      .toBe(sim(allDebt).expectedNominalMedian);
  });
});

// The Answer layer (sol-019) asks one question: do you get there? That is a
// probability over paths, and a probability cannot be recovered from three
// percentiles - so it has to be the engine's, computed while it still holds
// every path. The page's old `calculateNetRealWealth` could only ever reach
// p10, p50 and p90, which is why the question was never asked.
describe('SIP simulation - did you get there', () => {
  // A goal this plan does NOT walk to, so tax and rates still move the odds.
  // Under dd-017 the instalment holds its purchasing power, which lifted these
  // inputs to a near-certain success and flattened every assertion below to 1.
  const withGoal = (over = {}) =>
    sim({ targetRealWealth: 10000000, stepUpRate: 0, monthlySip: 16000, ...over });

  it('there is no verdict without a goal', () => {
    expect(sim().final.reachedTarget).toBeNull();
  });

  it('the odds of reaching a goal fall as the goal rises', () => {
    const odds = [5000000, 10000000, 20000000, 40000000].map(
      (t) => withGoal({ targetRealWealth: t }).final.reachedTarget
    );
    for (let i = 1; i < odds.length; i++) {
      expect(odds[i]).toBeLessThanOrEqual(odds[i - 1]);
    }
    expect(odds[0]).toBeGreaterThan(odds[odds.length - 1]);
  });

  it('the median net figure is the median path, not a taxed percentile', () => {
    // Pre-tax the two must agree exactly, which is the check that the new
    // per-path block and the old percentile arrays describe one simulation.
    const r = withGoal();
    expect(r.final.realNet.p50).toBe(r.p50Real[base.horizonYears]);
    expect(r.final.realNet.p10).toBe(r.p10Real[base.horizonYears]);
  });

  it('tax lowers what you keep and the odds of getting there', () => {
    const gross = withGoal();
    const net = withGoal({ isPostTax: true });
    expect(net.final.realNet.p50).toBeLessThan(gross.final.realNet.p50);
    expect(net.final.reachedTarget!).toBeLessThan(gross.final.reachedTarget!);
    expect(net.final.taxPaidNominal).toBeGreaterThan(0);
    expect(gross.final.taxPaidNominal).toBe(0);
  });

  it('a gentler tax rate keeps more', () => {
    // The rate is a parameter now, matching the planner's own LTCG input, so
    // the two pages can be told the same thing about tax.
    const high = withGoal({ isPostTax: true, ltcgTaxPct: 20 });
    const low = withGoal({ isPostTax: true, ltcgTaxPct: 5 });
    expect(low.final.realNet.p50).toBeGreaterThan(high.final.realNet.p50);
  });
});

describe('SIP goal seek', () => {
  const seek = (over = {}) =>
    runGoalSeek({ ...base, targetRealWealth: 10000000, isPostTax: false, ...over });

  it('the SIP it returns actually reaches the target', () => {
    // The round trip is the real test: feed the answer back into the
    // simulation and the median real outcome should land on the goal.
    const required = seek();
    const achieved = runSimulation({ ...base, monthlySip: required, numSims: 3000 })
      .p50Real[base.horizonYears];
    expect(Math.abs(achieved / 10000000 - 1)).toBeLessThan(0.08);
  });

  it('a bigger goal needs a bigger SIP, monotonically', () => {
    const sips = [5000000, 10000000, 20000000, 40000000].map((t) =>
      seek({ targetRealWealth: t })
    );
    for (let i = 1; i < sips.length; i++) {
      expect(sips[i]).toBeGreaterThan(sips[i - 1]);
    }
  });

  it('a longer horizon needs a smaller monthly SIP for the same goal', () => {
    expect(seek({ horizonYears: 30 })).toBeLessThan(seek({ horizonYears: 15 }));
  });

  it('seed capital reduces the required SIP', () => {
    expect(seek({ seedCapital: 5000000 })).toBeLessThan(seek({ seedCapital: 0 }));
  });

  it('accounting for tax raises the required SIP', () => {
    expect(seek({ isPostTax: true })).toBeGreaterThan(seek({ isPostTax: false }));
  });

  it('paying for insurance raises the required SIP', () => {
    // sol-018 lived in two hand-copied loops and only one of them was ever
    // tested. Goal seek had the same divided floor, so buying protection cut
    // the SIP needed to hit a goal from 19,646 to 7,744 - the calculator
    // telling a saver that insurance funds their retirement. Both engines now
    // share one path, and this is the guard that says so.
    expect(seek({ bsEnabled: true, annualHedgingDragCost: 0.0185 * base.eqPct }))
      .toBeGreaterThan(seek({ bsEnabled: false, annualHedgingDragCost: 0 }));
  });
});

// sol-023. The hedging ledger used to compute its columns beside the engine
// rather than from it, which is why fixing sol-018 moved none of them. These
// pin the engine's own ledger output, so the screen has something real to read.
describe('SIP simulation - the hedging ledger', () => {
  const PREMIUM = 0.0185 * base.eqPct;
  const hedged = (over = {}) =>
    sim({ bsEnabled: true, annualHedgingDragCost: PREMIUM, ...over });

  it('there is no ledger when there is no hedge', () => {
    // Not a ledger of zeroes - an absent one. A table of zeroes reads as a
    // measurement; null makes the screen say why there is nothing to show.
    expect(sim().hedging).toBeNull();
  });

  it('the unhedged column is the same paths without the hedge, exactly', () => {
    // The whole point of computing the twin inside the engine: the comparison
    // the ledger prints is run on identical market draws, so it cannot drift
    // from the hedged figures beside it.
    const h = hedged();
    const u = sim();
    for (const yr of [1, 5, 10, 20]) {
      expect(h.hedging.unhedgedReal[yr]).toBe(u.p50Real[yr]);
    }
  });

  it('the premium only ever accumulates, and it starts at zero', () => {
    const l = hedged().hedging;
    expect(l.premiumPaidReal[0]).toBe(0);
    for (let yr = 1; yr <= base.horizonYears; yr++) {
      expect(l.premiumPaidReal[yr]).toBeGreaterThanOrEqual(l.premiumPaidReal[yr - 1]);
      expect(l.floorPayoutReal[yr]).toBeGreaterThanOrEqual(l.floorPayoutReal[yr - 1]);
    }
    expect(l.premiumPaidReal[base.horizonYears]).toBeGreaterThan(0);
  });

  it('the premium is paid in far more years than the floor pays out', () => {
    // The ledger's honest shape, and the one the old fabricated columns
    // inverted: a -8% annual floor binds in about 10% of years, so a typical
    // 20-year path sees it pay two or three times while paying premium 20.
    const l = hedged().hedging;
    expect(l.yearsFloorPaid).toBeGreaterThan(0);
    expect(l.yearsFloorPaid).toBeLessThan(base.horizonYears / 3);
  });

  it('a costlier premium shows up in the ledger, not just in the outcome', () => {
    expect(hedged({ annualHedgingDragCost: 0.05 }).hedging.premiumPaidReal[20])
      .toBeGreaterThan(hedged().hedging.premiumPaidReal[20]);
  });
});
