import { describe, it, expect } from 'vitest';
import {
  simulate, outlookFrom, findRemedies, growthCurve, toEngineParams,
  TYPICAL_ODDS, type SipInputs,
} from '../utils/sipAdvice';
import { DEFAULT_REGIME } from '../utils/regimePresets';

// The SIP ladder's derivation layer. The planner's equivalent (swpAdvice.test)
// is 480 lines; this is the same job for accumulation, and the same rule
// applies - the numbers are not sacred, but nothing may move them by accident.

const base: SipInputs = {
  seedCapital: 0,
  monthlySip: 25000,
  targetRealWealth: 50000000,
  // dd-017: the monthly figure is in today's money and holds its value. A real
  // step-up of zero is a complete plan, not an absent one.
  contributionMode: 'real' as const,
  realStepUp: 0,
  monthlyIncome: 0,
  savingsRatePct: 20,
  horizonYears: 20,
  expectedInflation: 6,
  expectedReturn: DEFAULT_REGIME.growth,
  annualVolatility: DEFAULT_REGIME.roughness,
  ltcgTax: 12.5,
  isPostTax: false,
  eqPct: 0.7,
  debtPct: 0.2,
  goldPct: 0.1,
  bsEnabled: false,
  hedgingDragCost: 0,
  hedgingFloorLimit: -10,
  // Zero, stated. These figures were recorded before the engine knew a fund
  // charges anything to own; writing the zero down keeps them describing the
  // world they were taken from rather than silently inheriting a new one.
  expenseRatio: 0,
  numSimulations: 400,
};

const run = (over: Partial<SipInputs> = {}) => {
  const inputs = { ...base, ...over };
  const r = simulate(inputs);
  return { inputs, r, outlook: outlookFrom(r, inputs) };
};

describe('sipAdvice - the shipped page runs on the record, not on 12 and 15', () => {
  it('the default regime is the thirty-year one, and it is not the old default', () => {
    // sol-028's whole point. If this ever passes at 12/15 again, the presets
    // have been quietly reverted to the calmest decade in thirty-five years.
    expect(DEFAULT_REGIME.id).toBe('thirty');
    expect(DEFAULT_REGIME.roughness).toBeGreaterThan(20);
    expect(base.annualVolatility).toBe(DEFAULT_REGIME.roughness);
  });

  it('the regime reaches the engine through the only translation there is', () => {
    const p = toEngineParams(base);
    expect(p.equityReturn).toBe(DEFAULT_REGIME.growth);
    expect(p.equityVolatility).toBe(DEFAULT_REGIME.roughness);
    expect(p.hedgingFloorLimit).toBe(-10);
  });

  it('the premium is charged on the equity sleeve, once', () => {
    // sol-029: the planner had two sources for this and charged eqPct twice.
    // A quoted 1.85% of a 70% equity sleeve is 1.295% of the portfolio.
    const p = toEngineParams({ ...base, bsEnabled: true, hedgingDragCost: 1.85 });
    expect(p.annualHedgingDragCost).toBeCloseTo(0.0185 * 0.7, 10);
  });

  it('an unbought floor costs nothing, whatever the quote says', () => {
    expect(toEngineParams({ ...base, bsEnabled: false, hedgingDragCost: 5 })
      .annualHedgingDragCost).toBe(0);
  });
});

describe('sipAdvice - the outlook answers the saver s question', () => {
  it('the odds and the ending wealth come from one simulation', () => {
    const { r, outlook } = run();
    expect(outlook.odds).toBe(r.final.reachedTarget);
    expect(outlook.endReal.p50).toBe(r.final.realNet.p50);
    expect(outlook.flow.endReal).toBe(r.final.realNet.p50);
  });

  it('the money flow column closes, before tax and after', () => {
    // Put in + what the market added − tax = what you keep. A reader adds a
    // column of figures up; if it does not tie, the screen is wrong however
    // defensible each number is on its own. This caught a real fault: the tax
    // figure was the AVERAGE across futures while every other row was the
    // median path, so the column was short by lakhs.
    for (const isPostTax of [false, true]) {
      const { outlook } = run({ isPostTax });
      const f = outlook.flow;
      expect(f.investedReal + f.growthReal - f.taxReal, `post-tax: ${isPostTax}`)
        .toBeCloseTo(f.endReal, 0);
    }
  });

  it('the real cost of the plan is below its nominal cost', () => {
    // dd-004. A saver's instinct - "I will have put in 60 lakh" - is the
    // nominal sum, and it overstates the real sacrifice.
    const { outlook } = run();
    expect(outlook.flow.investedReal).toBeLessThan(outlook.flow.investedNominal);
  });

  it('the reach year is the first year the typical path covers the goal', () => {
    const { r, outlook } = run({ targetRealWealth: 5000000 });
    expect(outlook.reachYear).not.toBeNull();
    const curve = r.final.p50RealNet;
    expect(curve[outlook.reachYear!]).toBeGreaterThanOrEqual(5000000);
    expect(curve[outlook.reachYear! - 1]).toBeLessThan(5000000);
  });

  it('a goal beyond the horizon has no reach year rather than a wrong one', () => {
    expect(run({ targetRealWealth: 5000000000 }).outlook.reachYear).toBeNull();
  });

  it('healthy means the typical path gets there, and nothing softer', () => {
    const easy = run({ targetRealWealth: 2000000 }).outlook;
    const hard = run({ targetRealWealth: 500000000 }).outlook;
    expect(easy.healthy).toBe(true);
    expect(easy.odds).toBeGreaterThanOrEqual(TYPICAL_ODDS);
    expect(hard.healthy).toBe(false);
  });

  it('post-tax figures keep less and say what tax was paid', () => {
    const gross = run().outlook;
    const net = run({ isPostTax: true }).outlook;
    expect(net.endReal.p50).toBeLessThan(gross.endReal.p50);
    expect(net.flow.taxReal).toBeGreaterThan(0);
    expect(gross.flow.taxReal).toBe(0);
    // The tax is exactly the gap it opened between the two views, on the same
    // path. Any other definition puts two irreconcilable numbers on one screen.
    expect(net.flow.taxReal).toBeCloseTo(gross.endReal.p50 - net.endReal.p50, 0);
    // Nominal is the same money, carried to the final year.
    expect(net.flow.taxNominal).toBeGreaterThan(net.flow.taxReal);
  });
});

// Each of these runs the goal-seek, which is a full Monte Carlo per iteration.
// They take a couple of seconds alone and comfortably exceed vitest's 5s
// default when the machine is also running a build - which produced three RED
// tests on a green tree twice in one session. A suite that fails because
// something else was busy is a suite people learn to scroll past, so the limit
// is stated here rather than left to chance. It is a ceiling against a hang,
// not a performance assertion.
describe('sipAdvice - the three levers', { timeout: 30000 }, () => {
  // A plan that plainly does not reach, so all three levers exist.
  const short = { ...base, monthlySip: 10000, targetRealWealth: 50000000 };

  it('a plan that already gets there is offered no remedies', () => {
    const { r, inputs } = run({ targetRealWealth: 1000000 });
    expect(findRemedies(r, inputs)).toEqual([]);
  });

  it('all three appear when the plan falls short', () => {
    const r = simulate(short);
    const kinds = findRemedies(r, short).map((x) => x.kind);
    expect(kinds).toEqual(['invest_more', 'wait_longer', 'aim_lower']);
  });

  it('every lever offered actually reaches the bar', () => {
    // The point of the whole module. A remedy that does not work is worse than
    // no remedy: it is the analysis, plus a false promise.
    const r = simulate(short);
    for (const remedy of findRemedies(r, short)) {
      if (remedy.outOfReach) continue;
      expect(remedy.odds, `${remedy.kind} claims to fix the plan`)
        .toBeGreaterThanOrEqual(TYPICAL_ODDS - 0.06);
    }
  });

  it('each lever moves in the direction it promises', () => {
    const r = simulate(short);
    const by = Object.fromEntries(findRemedies(r, short).map((x) => [x.kind, x]));
    expect(by.invest_more.value).toBeGreaterThan(short.monthlySip);
    expect(by.wait_longer.value).toBeGreaterThan(short.horizonYears);
    expect(by.aim_lower.value).toBeLessThan(short.targetRealWealth);
    expect(by.invest_more.delta).toBeGreaterThan(0);
    expect(by.wait_longer.delta).toBeGreaterThan(0);
    expect(by.aim_lower.delta).toBeGreaterThan(0);
  });

  it('a harder goal needs a bigger contribution', () => {
    const ask = (t: number) => {
      const i = { ...short, targetRealWealth: t };
      return findRemedies(simulate(i), i).find((x) => x.kind === 'invest_more')!.value;
    };
    expect(ask(80000000)).toBeGreaterThan(ask(40000000));
  });

  it('the reachable goal is never rounded up past what the plan reaches', () => {
    // Rounding a goal UP would hand back a number the plan does not reach.
    const r = simulate(short);
    const lower = findRemedies(r, short).find((x) => x.kind === 'aim_lower')!;
    expect(lower.value).toBeLessThanOrEqual(r.final.realNet.p50);
  });
});

describe('sipAdvice - the growth track', () => {
  const curve = growthCurve({ ...base, monthlySip: 40000 }, 6, 16, 2, 200);

  it('covers the whole track the control can reach', () => {
    // The grid is ANCHORED on the reader's own assumption so the slider thumb
    // can sit exactly where the readouts say it does, so the endpoints are the
    // requested range rounded outwards rather than the request itself. It must
    // still cover everything the control can reach, and it must contain the
    // reader's growth exactly.
    expect(curve.points[0].growth).toBeLessThanOrEqual(6);
    expect(curve.points[curve.points.length - 1].growth).toBeGreaterThanOrEqual(16);
    expect(curve.readerGrowth).toBe(DEFAULT_REGIME.growth);
    expect(curve.points.some((p) => p.growth === DEFAULT_REGIME.growth)).toBe(true);
  });

  it('better growth is never worse for the goal', () => {
    for (let i = 1; i < curve.points.length; i++) {
      expect(curve.points[i].endReal)
        .toBeGreaterThan(curve.points[i - 1].endReal);
      expect(curve.points[i].odds)
        .toBeGreaterThanOrEqual(curve.points[i - 1].odds - 0.02);
    }
  });

  it('real growth is the ratio, not the difference', () => {
    // 12% against 6% leaves 5.66%. Over twenty years the difference between
    // that and 6% is not a rounding error.
    //
    // Asked of a point the curve actually computed rather than of the round
    // number 12. Looking a point up by a tidy value only ever worked because
    // the grid happened to start on one, which is the same accident that put
    // the slider thumb half a step from the reader's own assumption.
    const p = curve.points.find((x) => x.growth === curve.readerGrowth)!;
    const g = 1 + p.growth / 100;
    const kept = Math.pow(1 - base.expenseRatio / 100 / 12, 12);
    expect(p.real).toBeCloseTo((g * kept / 1.06 - 1) * 100, 6);
    // With no fee it collapses to the plain two-rate ratio it always was.
    const free = growthCurve({ ...base, monthlySip: 40000, expenseRatio: 0 }, 6, 16, 2, 40);
    const q = free.points.find((x) => x.growth === free.readerGrowth)!;
    expect(q.real).toBeCloseTo((1 + q.growth / 100) / 1.06 * 100 - 100, 6);
  });

  it('the breakeven is the first growth rate that reaches the goal', () => {
    if (curve.breakeven === null) return;
    const at = curve.points.find((p) => p.growth === curve.breakeven)!;
    expect(at.odds).toBeGreaterThanOrEqual(TYPICAL_ODDS);
    const before = curve.points[curve.points.indexOf(at) - 1];
    if (before) expect(before.odds).toBeLessThan(TYPICAL_ODDS);
  });
});
