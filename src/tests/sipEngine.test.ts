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

  // KNOWN DEFECT - deliberately recorded as `it.fails`, not deleted or skipped.
  //
  // Buying portfolio insurance currently MORE THAN DOUBLES the median outcome
  // (~8.2 Cr hedged vs ~3.4 Cr unhedged), which is backwards: the site's own
  // copy says rolling puts cost 1.5-2.2% a year. The cause is in sipWorker's
  // hedging branch:
  //
  //     const monthlyFloor = -0.08 / 12;              // an ANNUAL floor / 12
  //     rEqM = Math.max(monthlyFloor, rEqM) - drag;   // applied MONTHLY
  //
  // A floor is not a rate and cannot be divided. Flooring every month at
  // -0.67% truncates the loss in 35.8% of all months - roughly 86 months out
  // of 240 - where an actual -8% annual floor would bind in about 10% of
  // years. The put ends up buying far more protection than it could.
  //
  // swpWorker gets this right: it applies an annual floor to an annual return.
  // Fixing it here means tracking the equity sleeve separately so the floor
  // can be applied at year end, which is a redesign of the simulation loop -
  // that belongs to T4 (portfolio insurance mechanics), not to a test pass.
  //
  // `it.fails` keeps the suite green while the defect stands AND turns red the
  // moment someone fixes it, forcing this comment to be revisited rather than
  // quietly outliving the bug.
  it.fails('KNOWN DEFECT: hedging should cost return, currently it pays', () => {
    const hedged = sim({ bsEnabled: true, annualHedgingDragCost: 0.0185 * base.eqPct });
    expect(hedged.expectedNominalMedian).toBeLessThan(sim().expectedNominalMedian);
  });

  it('the hedging drag itself is at least applied', () => {
    // Independent of the floor bug: two hedged runs differing only in premium
    // must differ, so we would notice if the drag stopped being subtracted.
    const cheap = sim({ bsEnabled: true, annualHedgingDragCost: 0.001 });
    const dear = sim({ bsEnabled: true, annualHedgingDragCost: 0.05 });
    expect(dear.expectedNominalMedian).toBeLessThan(cheap.expectedNominalMedian);
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
});
