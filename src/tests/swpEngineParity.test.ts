import { describe, it, expect } from 'vitest';
import { runDeterministicSWP } from '../utils/swpDeterministic';
import { runSWPMonteCarlo } from '../workers/swpWorker';

// The SWP planner renders from TWO engines. The year-by-year table comes from
// runDeterministicSWP; the headline survival score and percentile bands come
// from the Monte Carlo worker. They implement the same withdrawal, tax and
// cost-basis maths independently.
//
// Nothing asserted they agreed. Today's LTCG double-charge existed in both and
// had to be fixed twice - if only one had been fixed, the page would have shown
// a table that contradicted its own headline, and nothing would have failed.
//
// At zero volatility the Monte Carlo reduces to the deterministic path exactly,
// so this is a real equivalence, not an approximation. Any future edit to one
// engine that isn't mirrored in the other breaks this test.

const params = {
  initialCorpus: 10000000,
  monthlyWithdrawal: 40000,
  annualStepUp: 5,
  expectedReturn: 12,
  expectedInflation: 6,
  ltcgTax: 12.5,
  horizonYears: 30,
};

describe('the two SWP engines must not drift apart', () => {
  it('at zero volatility the Monte Carlo equals the deterministic path', () => {
    const det = runDeterministicSWP(params);
    const mc = runSWPMonteCarlo({
      ...params,
      annualVolatility: 0,
      numSimulations: 1,
    });

    // p50 of a single zero-volatility trial is that trial's balance path.
    for (let y = 0; y <= params.horizonYears; y++) {
      expect(
        Math.abs(mc.p50[y] - det.balances[y]),
        `year ${y}: monte carlo ${mc.p50[y]} vs deterministic ${det.balances[y]}`
      ).toBeLessThanOrEqual(1); // worker rounds to whole rupees
    }
  });

  it('both engines deplete in the same year for an over-drawn corpus', () => {
    const over = { ...params, monthlyWithdrawal: 200000 };
    const det = runDeterministicSWP(over);
    const mc = runSWPMonteCarlo({ ...over, annualVolatility: 0, numSimulations: 1 });

    const firstZero = (arr: number[]) => arr.findIndex((v, i) => i > 0 && v <= 0);
    expect(firstZero(mc.p50)).toBe(firstZero(det.balances));
  });

  it('both engines agree on withdrawals and tax in the same year', () => {
    const det = runDeterministicSWP(params);
    const mc = runSWPMonteCarlo({ ...params, annualVolatility: 0, numSimulations: 1 });

    for (let y = 1; y <= 10; y++) {
      expect(Math.abs(mc.medianWithdrawals[y] - det.withdrawals[y])).toBeLessThanOrEqual(1);
      expect(Math.abs(mc.medianTaxes[y] - det.taxes[y])).toBeLessThanOrEqual(1);
    }
  });
});

describe('a zero the user typed must mean zero', () => {
  // This is the bug the parity test caught on its first run. The worker read
  // its inputs with `Number(x) || fallback`, and 0 is falsy, so every numeric
  // input silently reverted to its default when set to zero.
  //
  // The page ships with stepUp = "0.0" and its tooltip says "Set to 0 to
  // simply maintain purchasing power". The Monte Carlo ran it at 5% - on top
  // of 6% inflation - so the default view reported ~22% survival where the
  // stated inputs give ~78%. The deterministic table underneath read 0
  // correctly and disagreed with the headline all along.

  it('step-up 0 is not silently turned into 5', () => {
    const zero = runSWPMonteCarlo({ ...params, annualStepUp: 0, numSimulations: 300 });
    const five = runSWPMonteCarlo({ ...params, annualStepUp: 5, numSimulations: 300 });
    expect(zero.probabilityOfSuccess).not.toBe(five.probabilityOfSuccess);
    expect(zero.probabilityOfSuccess).toBeGreaterThan(five.probabilityOfSuccess);
  });

  it('volatility 0 is not silently turned into 15', () => {
    const r = runSWPMonteCarlo({ ...params, annualVolatility: 0, numSimulations: 50 });
    expect(r.p90FinalBalance - r.p10FinalBalance).toBe(0);
  });

  it('LTCG 0 means no tax is charged', () => {
    const r = runSWPMonteCarlo({ ...params, ltcgTax: 0, annualVolatility: 0, numSimulations: 1 });
    expect(r.avgTotalTaxPaid).toBe(0);
  });

  it('inflation 0 holds the paycheck flat when step-up is also 0', () => {
    const r = runSWPMonteCarlo({
      ...params, expectedInflation: 0, annualStepUp: 0,
      annualVolatility: 0, numSimulations: 1,
    });
    expect(r.idealPaycheckTimeline[1]).toBe(r.idealPaycheckTimeline[10]);
  });

  it('a genuinely absent value still falls back to the default', () => {
    const absent = runSWPMonteCarlo({ ...params, expectedReturn: undefined, annualVolatility: 0, numSimulations: 1 });
    const explicit = runSWPMonteCarlo({ ...params, expectedReturn: 12, annualVolatility: 0, numSimulations: 1 });
    expect(absent.medianFinalBalance).toBe(explicit.medianFinalBalance);
  });
});

describe('the Monte Carlo must be reproducible', () => {
  it('the same inputs give the same survival score twice', () => {
    const a = runSWPMonteCarlo({ ...params, annualVolatility: 15, numSimulations: 500 });
    const b = runSWPMonteCarlo({ ...params, annualVolatility: 15, numSimulations: 500 });
    expect(a.probabilityOfSuccess).toBe(b.probabilityOfSuccess);
    expect(a.medianFinalBalance).toBe(b.medianFinalBalance);
  });

  it('a different seed gives a different draw', () => {
    // Uses a survivable withdrawal rate on purpose: at the default 40k/month
    // the median outcome is depletion, so every seed reports a final balance
    // of zero and the assertion would pass or fail for the wrong reason.
    const survivable = { ...params, monthlyWithdrawal: 20000, annualStepUp: 0 };
    const a = runSWPMonteCarlo({ ...survivable, annualVolatility: 15, numSimulations: 500, seed: 1 });
    const b = runSWPMonteCarlo({ ...survivable, annualVolatility: 15, numSimulations: 500, seed: 2 });
    expect(a.medianFinalBalance).toBeGreaterThan(0);
    expect(a.medianFinalBalance).not.toBe(b.medianFinalBalance);
  });

  it('volatility widens the percentile band; zero volatility collapses it', () => {
    const flat = runSWPMonteCarlo({ ...params, annualVolatility: 0, numSimulations: 200 });
    const vol = runSWPMonteCarlo({ ...params, annualVolatility: 20, numSimulations: 200 });
    const spread = (r: any) => r.p90FinalBalance - r.p10FinalBalance;
    expect(spread(flat)).toBe(0);
    expect(spread(vol)).toBeGreaterThan(0);
  });
});
