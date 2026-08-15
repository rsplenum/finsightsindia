import { describe, it, expect } from 'vitest';
import { findRemedies, outlook, HEALTHY_SURVIVAL, type AdviceInputs } from '../utils/swpAdvice';

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
