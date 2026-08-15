import { describe, it, expect } from 'vitest';
import { findRemedies, outlook, growthCurve, sequenceRisk, protectionCurve, HEALTHY_SURVIVAL, type AdviceInputs } from '../utils/swpAdvice';
import { runDeterministicSWP } from '../utils/swpDeterministic';
import { pricePut, VOL_RISK_PREMIUM_POINTS } from '../utils/putPricing';

// sol-019: never leave the user at a verdict. These check that the remedies
// are real - that following the advice actually reaches the target - rather
// than that they merely render.

const failing: AdviceInputs = {
  initialCorpus: 10000000,
  monthlyWithdrawal: 60000,   // 7.2% initial draw - too high to last
  annualStepUp: 0,
  expectedReturn: 12,
  expectedInflation: 6,
  annualVolatility: 15,
  ltcgTax: 12.5,
  horizonYears: 30,
};

const healthy: AdviceInputs = { ...failing, monthlyWithdrawal: 20000 };

describe('outlook', () => {
  it('an over-drawn plan is reported unhealthy, with a depletion year', () => {
    const o = outlook(failing, 400);
    expect(o.healthy).toBe(false);
    expect(o.medianDepletionYear).toBeGreaterThan(0);
    expect(o.medianDepletionYear).toBeLessThanOrEqual(failing.horizonYears);
  });

  it('a sustainable plan survives with money left over', () => {
    const o = outlook(healthy, 400);
    expect(o.healthy).toBe(true);
    expect(o.medianDepletionYear).toBeNull();
    expect(o.medianFinalBalance).toBeGreaterThan(0);
  });
});

describe('the shipped defaults must describe a plan that works', () => {
  // sol-019: the default state is the pitch. A first-time visitor lands on
  // these numbers before entering anything of their own, so they must not
  // open on a warning.
  //
  // Rahul's decision (2026-08-15): defaults describe a plan that works, and
  // 85% stays the bar for now - revisited after launch with real user
  // feedback. Previously the page shipped 1 Cr / 40k, which reads 78.8%.
  //
  // These values are duplicated in RetirementAnswer.astro and swp-planner.astro;
  // this test is what stops the three drifting apart.
  const shipped: AdviceInputs = {
    initialCorpus: 15000000,
    monthlyWithdrawal: 40000,
    annualStepUp: 0,
    expectedReturn: 12,
    expectedInflation: 6,
    annualVolatility: 15,
    ltcgTax: 12.5,
    horizonYears: 30,
  };

  it('the landing scenario is healthy, with margin above the bar', () => {
    const o = outlook(shipped, 2000);
    expect(o.healthy).toBe(true);
    // Not merely over the line: a plan sitting at 85.x% could flip between
    // visits on simulation noise and show remedies inconsistently.
    expect(o.survival).toBeGreaterThan(HEALTHY_SURVIVAL + 0.03);
  });

  it('the landing scenario offers no remedies', () => {
    expect(findRemedies(shipped)).toEqual([]);
  });

  it('it survives a real disappointment in growth, not just a perfect run', () => {
    // Rung 3 shows the reader the growth rate below which the plan fails. If
    // the default sits half a point from that line, the pitch and the lesson
    // contradict each other: "comfortable" would mean "comfortable only if
    // markets deliver exactly what we assumed". At least 1.5 points of room.
    const c = growthCurve(shipped, 6, 14, 0.5, 250);
    expect(c.breakeven).not.toBeNull();
    expect(shipped.expectedReturn - c.breakeven!).toBeGreaterThanOrEqual(1.5);
  });

  it('its withdrawal rate sits near the rule of thumb a reader may know', () => {
    const rate = outlook(shipped, 400).flow.initialRate;
    expect(rate).toBeGreaterThan(2.5);
    expect(rate).toBeLessThan(4.5);
  });
});

describe('the money-flow figures must reconcile on screen', () => {
  // Five numbers are shown side by side and a reader can add them up. If they
  // do not balance, the whole screen loses its authority - the same failure as
  // the tax breakdown that displayed double the base tax.
  it('what went in equals what came out', () => {
    const f = outlook(healthy, 600).flow;
    expect(Math.abs((f.started + f.growth) - (f.drawn + f.left))).toBeLessThan(1);
  });

  it('net to the user is the gross draw less tax', () => {
    const f = outlook(healthy, 600).flow;
    expect(Math.abs(f.netToYou - (f.drawn - f.tax))).toBeLessThan(1);
  });

  it('the stated withdrawal rate matches the inputs', () => {
    const f = outlook(healthy, 400).flow;
    expect(f.initialRate).toBeCloseTo((20000 * 12) / 10000000 * 100, 6);
  });

  it('a sustainable plan earns more than it draws', () => {
    const f = outlook(healthy, 600).flow;
    expect(f.growth).toBeGreaterThan(f.drawn);
  });
});

describe('remedies', () => {
  it('a healthy plan is offered none - do not invent a problem', () => {
    expect(findRemedies(healthy)).toEqual([]);
  });

  it('a failing plan gets all three levers', () => {
    const r = findRemedies(failing);
    expect(r.map((x) => x.kind).sort()).toEqual(
      ['save_more', 'shorten_horizon', 'spend_less']
    );
  });

  it('every remedy actually reaches the target - the advice must work', () => {
    // The point of the whole module. If following the advice does not fix the
    // plan, the advice is decoration.
    for (const r of findRemedies(failing)) {
      if (r.outOfReach) continue;
      expect(
        r.survival,
        `${r.kind} claimed to fix the plan but only reaches ${(r.survival * 100).toFixed(1)}%`
      ).toBeGreaterThanOrEqual(HEALTHY_SURVIVAL - 0.02);
    }
  });

  it('each remedy moves its own lever in the helpful direction', () => {
    const byKind = Object.fromEntries(findRemedies(failing).map((r) => [r.kind, r]));
    expect(byKind.spend_less.value).toBeLessThan(failing.monthlyWithdrawal);
    expect(byKind.save_more.value).toBeGreaterThan(failing.initialCorpus);
    expect(byKind.shorten_horizon.value).toBeLessThan(failing.horizonYears);
  });

  it('deltas are positive and match the stated values', () => {
    const byKind = Object.fromEntries(findRemedies(failing).map((r) => [r.kind, r]));
    expect(byKind.spend_less.delta).toBe(failing.monthlyWithdrawal - byKind.spend_less.value);
    expect(byKind.save_more.delta).toBe(byKind.save_more.value - failing.initialCorpus);
    expect(byKind.shorten_horizon.delta).toBe(failing.horizonYears - byKind.shorten_horizon.value);
    for (const r of Object.values(byKind)) expect(r.delta).toBeGreaterThan(0);
  });

  it('the advice is stable - the same question gets the same answer', () => {
    // Shared random paths across evaluations. Without this the bisection is
    // searching a noisy surface and the advice wobbles between runs, which
    // would read as the tool guessing.
    const a = findRemedies(failing).map((r) => [r.kind, r.value]);
    const b = findRemedies(failing).map((r) => [r.kind, r.value]);
    expect(a).toEqual(b);
  });

  it('a worse plan needs a bigger correction', () => {
    const worse = { ...failing, monthlyWithdrawal: 90000 };
    const cut = (i: AdviceInputs) =>
      findRemedies(i).find((r) => r.kind === 'spend_less')!.delta;
    expect(cut(worse)).toBeGreaterThan(cut(failing));
  });
});

describe('the growth curve behind rung 3', () => {
  const plan: AdviceInputs = {
    initialCorpus: 15000000, monthlyWithdrawal: 40000, annualStepUp: 0,
    expectedReturn: 12, expectedInflation: 6, annualVolatility: 15,
    ltcgTax: 12.5, horizonYears: 30,
  };

  it('survival rises with growth, so the boundary is a single crossing', () => {
    const c = growthCurve(plan, 6, 16, 2, 250);
    for (let i = 1; i < c.points.length; i++) {
      // Monte Carlo noise permits small dips; a real inversion would break the
      // premise that one breakeven exists.
      expect(c.points[i].survival).toBeGreaterThan(c.points[i - 1].survival - 0.08);
    }
    expect(c.points[c.points.length - 1].survival).toBeGreaterThan(c.points[0].survival);
  });

  it('real growth is the ratio, not the difference', () => {
    const c = growthCurve(plan, 12, 12, 1, 100);
    // 12% against 6% leaves 5.66%, not 6%.
    expect(c.points[0].real).toBeCloseTo(5.66, 1);
  });

  it('the breakeven is the lowest growth that still clears the bar', () => {
    const c = growthCurve(plan, 8, 16, 1, 300);
    expect(c.breakeven).not.toBeNull();
    const at = c.points.find((p) => p.growth === c.breakeven)!;
    expect(at.survival).toBeGreaterThanOrEqual(HEALTHY_SURVIVAL);
    const below = c.points.filter((p) => p.growth < c.breakeven!);
    for (const p of below) expect(p.survival).toBeLessThan(HEALTHY_SURVIVAL);
  });

  it('reports no breakeven when growth alone cannot rescue the plan', () => {
    const hopeless = { ...plan, monthlyWithdrawal: 150000 };
    expect(growthCurve(hopeless, 4, 12, 2, 200).breakeven).toBeNull();
  });
});

describe('sequence risk behind rung 4', () => {
  const plan: AdviceInputs = {
    initialCorpus: 15000000, monthlyWithdrawal: 40000, annualStepUp: 0,
    expectedReturn: 12, expectedInflation: 6, annualVolatility: 15,
    ltcgTax: 12.5, horizonYears: 30,
  };

  it('every scenario has the identical average return - that is the whole claim', () => {
    // If the averages differed, the demonstration would be showing the effect
    // of a better market rather than of better timing, and the screen would be
    // making a claim it had not earned.
    const r = sequenceRisk(plan, -30, 1);
    const expected = ((30 - 1) * 12 + -30) / 30;
    expect(r.averageReturn).toBeCloseTo(expected, 10);
    expect(r.points).toHaveLength(30);
  });

  it('a later crash is never worse than an earlier one', () => {
    const r = sequenceRisk(plan, -30);
    for (let i = 1; i < r.points.length; i++) {
      expect(r.points[i].finalBalance).toBeGreaterThanOrEqual(
        r.points[i - 1].finalBalance - 1
      );
    }
  });

  it('the earliest crash is the worst and the latest is the best', () => {
    const r = sequenceRisk(plan, -30);
    expect(r.worst.startYear).toBe(1);
    expect(r.best.startYear).toBe(plan.horizonYears);
    expect(r.best.finalBalance).toBeGreaterThan(r.worst.finalBalance);
  });

  it('timing alone moves the outcome materially', () => {
    // The point of the rung. If moving the same crash changed nothing, there
    // would be nothing to teach.
    const r = sequenceRisk(plan, -30);
    expect(r.best.finalBalance / r.worst.finalBalance).toBeGreaterThan(1.3);
  });

  it('a tighter plan is sunk by an early crash and survives a late one', () => {
    const tight = { ...plan, monthlyWithdrawal: 75000 };
    const r = sequenceRisk(tight, -30, 1);
    expect(r.points[0].survived).toBe(false);
    expect(r.safeFromYear).not.toBeNull();
    expect(r.safeFromYear!).toBeGreaterThan(1);
  });

  it('per-year returns override the flat rate without disturbing anything else', () => {
    // Guards the engine change this rung required.
    const flat = sequenceRisk(plan, 12, 1);   // "crash" equal to the normal return
    const base = runDeterministicSWP(plan);
    expect(Math.abs(flat.points[0].finalBalance - base.balances[30])).toBeLessThan(1);
  });
});

describe('multi-year downturns and the lived metric', () => {
  const plan: AdviceInputs = {
    initialCorpus: 15000000, monthlyWithdrawal: 40000, annualStepUp: 0,
    expectedReturn: 12, expectedInflation: 6, annualVolatility: 15,
    ltcgTax: 12.5, horizonYears: 30,
  };

  it('a longer downturn is strictly harder to survive', () => {
    // The reason the single-year version was not enough: it never broke the
    // plan, so it could not show the reader what actually breaks one.
    const one = sequenceRisk(plan, -30, 1).points[0];
    const two = sequenceRisk(plan, -30, 2).points[0];
    const three = sequenceRisk(plan, -30, 3).points[0];
    expect(one.finalBalance).toBeGreaterThan(two.finalBalance);
    expect(two.finalBalance).toBeGreaterThanOrEqual(three.finalBalance);
    expect(one.survived).toBe(true);
    expect(three.survived).toBe(false);
  });

  it('the stated average matches the returns actually used', () => {
    // dd-009: an unexplained number is a question handed to the reader. The
    // screen explains this figure, so it had better be the true one.
    for (const dur of [1, 2, 3]) {
      const r = sequenceRisk(plan, -30, dur);
      expect(r.averageReturn).toBeCloseTo(((30 - dur) * 12 + dur * -30) / 30, 10);
      expect(r.normalReturn).toBe(12);
      expect(r.durationYears).toBe(dur);
    }
  });

  it('the cushion is measured in years of that year\'s own spending', () => {
    const p = sequenceRisk(plan, -30, 1).points.find((x) => x.startYear === 30)!;
    expect(p.minCushionYears).toBeGreaterThan(0);
    expect(p.minCushionYear).toBeGreaterThanOrEqual(1);
    expect(p.minCushionYear).toBeLessThanOrEqual(30);
  });

  it('an early downturn leaves a thinner cushion than a late one', () => {
    // dd-010: this is the quantity a person actually lives through.
    const r = sequenceRisk(plan, -30, 2);
    const early = r.points.find((p) => p.startYear === 5)!;
    const late = r.points.find((p) => p.startYear === 25)!;
    expect(early.minCushionYears).toBeLessThan(late.minCushionYears);
  });

  it('a plan that fails reports zero cushion, not a misleading number', () => {
    const r = sequenceRisk(plan, -30, 3);
    const doomed = r.points.find((p) => !p.survived)!;
    expect(doomed.minCushionYears).toBe(0);
    expect(doomed.depletionYear).toBeGreaterThan(0);
  });
});

// Rung 5, sol-018 downstream. The engine behind this rung was wrong for the
// whole of its previous life, so it gets a detector rather than a promise.
describe('protection curve - what a floor costs and what it is worth', () => {
  const plan: AdviceInputs = {
    initialCorpus: 15000000,
    monthlyWithdrawal: 40000,
    annualStepUp: 0,
    expectedReturn: 12,
    expectedInflation: 6,
    annualVolatility: 15,
    ltcgTax: 12.5,
    horizonYears: 30,
  };
  // Coarse and cheap: these assert shape and arithmetic, not precision.
  const curve = protectionCurve(plan, 8, 32, 4, 200);

  it('the premium never moves across the whole range', () => {
    // The fixed price against the variable payout is the entire lesson
    // (dd-005). If the premium ever varied with roughness the rung would be
    // making a different, softer point.
    for (const p of curve.points) expect(p.premium).toBe(curve.premium);
  });

  it('the payout rises with roughness, always', () => {
    for (let i = 1; i < curve.points.length; i++) {
      expect(curve.points[i].payout).toBeGreaterThan(curve.points[i - 1].payout);
    }
  });

  it('frequency and payout are the closed forms, not a sample', () => {
    // At 15% spread against a -10% floor and a 12% mean, z = -1.4667, so
    // Phi(z) = 7.12% of years bind and the expected shortfall is 0.475%.
    // Checked to 3 decimals because these must be exact arithmetic - a
    // simulated figure would jitter between drags and be re-read every time.
    const c = protectionCurve(plan, 15, 15, 1, 50);
    const p = c.points[0];
    expect(p.bindFrequency).toBeCloseTo(0.0712, 3);
    expect(p.payout).toBeCloseTo(0.475, 2);
    expect(p.oneYearIn).toBe(14);
  });

  it('net is payout less premium, so the screen reconciles', () => {
    // dd-009: the reader must be able to derive the last row from the two
    // above it. If this ever drifts, they cannot.
    for (const p of curve.points) {
      expect(p.net).toBeCloseTo(p.payout - p.premium, 10);
    }
  });

  it('the breakeven is the first roughness where the floor pays its way', () => {
    expect(curve.breakeven).not.toBeNull();
    const at = curve.points.find((p) => p.roughness === curve.breakeven)!;
    expect(at.net).toBeGreaterThanOrEqual(0);
    for (const p of curve.points) {
      if (p.roughness < curve.breakeven!) expect(p.net).toBeLessThan(0);
    }
  });

  it('leads with the futures that failed, and they respond the right way', () => {
    // dd-012: the quantity rung 5 headlines. A count of ruined retirements,
    // not a survival average - and it must move the opposite way to survival,
    // or the screen is saying two different things at once.
    for (const p of curve.points) {
      expect(p.ruinedUnprotected).toBeCloseTo((1 - p.survivalUnprotected) * 100, 6);
      expect(p.ruinedProtected).toBeCloseTo((1 - p.survivalProtected) * 100, 6);
    }
    // Rough markets ruin more plans than calm ones, unprotected.
    const calm = curve.points[0];
    const rough = curve.points[curve.points.length - 1];
    expect(rough.ruinedUnprotected).toBeGreaterThan(calm.ruinedUnprotected);
  });

  it('a floor in a calm market ruins MORE plans than it saves', () => {
    // The finding rung 5 now states outright, and the one the first version
    // buried in an average. At low roughness the fee is charged every year and
    // the floor almost never triggers, so protection is a net destroyer.
    const calm = curve.points[0];
    expect(calm.ruinedProtected).toBeGreaterThan(calm.ruinedUnprotected);
  });

  it('protection costs survival in calm markets and buys it in rough ones', () => {
    // The finding rung 5 is built on, and the one sol-018 had backwards. At
    // the shipped 15% assumption this protection is a net loss; it only earns
    // its price when the market is far rougher than anyone is assuming.
    const calm = curve.points[0];
    const rough = curve.points[curve.points.length - 1];
    expect(calm.survivalProtected).toBeLessThanOrEqual(calm.survivalUnprotected);
    expect(rough.survivalProtected).toBeGreaterThan(rough.survivalUnprotected);
  });

  it('protection flattens the range - that is what is being bought', () => {
    // The rung's central claim, in one assertion: unprotected survival falls
    // away as the market roughens, protected survival barely moves. If this
    // stops holding, the prose on the screen has become false.
    const first = curve.points[0];
    const last = curve.points[curve.points.length - 1];
    const unprotectedFall = first.survivalUnprotected - last.survivalUnprotected;
    const protectedFall = first.survivalProtected - last.survivalProtected;
    expect(unprotectedFall).toBeGreaterThan(0.2);
    expect(protectedFall).toBeLessThan(unprotectedFall / 2);
  });
});

// P2. The premium is priced, never set - so the price itself needs a guard.
describe('put pricing - the premium follows from the cover asked for', () => {
  it("Rahul's 1.85% is the price of ONE combination, and lands exactly", () => {
    // -10% floor, 15% roughness, rolled every 12 months. The implied-vol spread
    // in putPricing.ts is calibrated to this and nothing else, so if the anchor
    // ever moves, that constant is what moved.
    const q = pricePut(-10, 15, 12);
    expect(q.annual).toBeCloseTo(1.85, 2);
  });

  it('the calibrated spread is a real market number, not a fudge', () => {
    // Index puts trade 3 to 5 volatility points above realised. A spread
    // outside that range would mean the anchor had been forced.
    expect(VOL_RISK_PREMIUM_POINTS).toBeGreaterThan(3);
    expect(VOL_RISK_PREMIUM_POINTS).toBeLessThan(5);
  });

  it('a shallower floor always costs more', () => {
    const depths = [-5, -10, -15, -20].map((f) => pricePut(f, 15, 12).annual);
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]).toBeLessThan(depths[i - 1]);
    }
  });

  it('a rougher market always costs more', () => {
    const rough = [10, 15, 20, 25, 30].map((v) => pricePut(-10, v, 12).annual);
    for (let i = 1; i < rough.length; i++) {
      expect(rough[i]).toBeGreaterThan(rough[i - 1]);
    }
  });

  it('the reader is always charged above fair value - that is the seller\'s margin', () => {
    // If this ever inverts, the model is offering free money and the screen's
    // central claim - that insurance loses on average - would be false.
    for (const f of [-5, -10, -15, -20]) {
      for (const v of [10, 15, 22, 30]) {
        const q = pricePut(f, v, 12);
        expect(q.annual, `floor ${f} rough ${v}`).toBeGreaterThan(q.fairValue);
        expect(q.markup).toBeGreaterThan(1);
      }
    }
  });
});
