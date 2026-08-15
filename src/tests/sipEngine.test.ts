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
    // 20k/month, 10% annual step-up, 20 years, no seed capital.
    let expected = 0;
    let s = 20000;
    for (let yr = 1; yr <= 20; yr++) {
      if (yr > 1) s *= 1.10;
      expected += s * 12;
    }
    expect(Math.abs(sim().nominalTotalInvested - expected)).toBeLessThan(1);
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
