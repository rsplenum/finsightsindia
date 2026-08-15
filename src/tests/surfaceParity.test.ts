import { describe, it, expect } from 'vitest';
import { runSWPMonteCarlo } from '../workers/swpWorker';
import { outlookFrom, type AdviceInputs } from '../utils/swpAdvice';

// sol-026 / dd-013. The missing assertion.
//
// Every test in this suite exercised ONE engine in isolation, and the parity
// test that existed compared the two SWP ENGINES at zero volatility. Nothing
// compared the two SURFACES at the user's own inputs, which is where the fault
// actually lived: the ladder ran 2,000 paths seeded 20260815 while the advanced
// panel ran 10,000 unseeded, and the page printed both. Balance left read
// 17.15 cr in one place and 17.02 cr in the other.
//
// These tests assert the property that makes that impossible: one simulation,
// derived into many views, never re-run.

const inputs: AdviceInputs = {
  initialCorpus: 15000000,
  monthlyWithdrawal: 40000,
  annualStepUp: 0,
  expectedReturn: 12,
  expectedInflation: 6,
  annualVolatility: 15,
  ltcgTax: 12.5,
  horizonYears: 30,
};

// What the page does: run once, derive twice.
const simulate = (over: Partial<AdviceInputs> & Record<string, any> = {}) =>
  runSWPMonteCarlo({ ...inputs, ...over, numSimulations: 2000, seed: 20260815 });

describe('surface parity - the ladder and the advanced panel cannot disagree', () => {
  it('both surfaces read the same quantities off one simulation', () => {
    // The panel renders the raw result; the ladder renders outlookFrom() of it.
    // Every figure that appears in both places must be the same figure, not a
    // near-enough one.
    const sim = simulate();
    const o = outlookFrom(sim, inputs);

    expect(o.survival).toBe(sim.probabilityOfSuccess / 100);
    expect(o.flow.left).toBe(sim.medianFinalBalance);
    expect(o.flow.drawn).toBe(sim.avgTotalWithdrawals);
    expect(o.flow.tax).toBe(sim.avgTotalTaxPaid);
    expect(o.medianFinalBalance).toBe(sim.medianFinalBalance);
  });

  it('they still agree across a sweep of every input', () => {
    // The old fault only became glaring once an input moved, because the ladder
    // was deaf to most of them. So this moves each one.
    const sweeps: Array<Partial<AdviceInputs> & Record<string, any>> = [
      { expectedReturn: 8 },
      { expectedReturn: 16 },
      { annualVolatility: 5 },
      { annualVolatility: 28 },
      { expectedInflation: 3 },
      { expectedInflation: 9 },
      { ltcgTax: 0 },
      { annualStepUp: 5 },
      { horizonYears: 15 },
      { monthlyWithdrawal: 90000 },
      { initialCorpus: 5000000 },
      { useGuardrails: true },
      { bsEnabled: true, hedgingDragCost: 1.85, hedgingFloorLimit: -10 },
    ];

    for (const over of sweeps) {
      const sim = simulate(over);
      const o = outlookFrom(sim, { ...inputs, ...over });
      const where = JSON.stringify(over);
      expect(o.survival, where).toBe(sim.probabilityOfSuccess / 100);
      expect(o.flow.left, where).toBe(sim.medianFinalBalance);
      expect(o.flow.drawn, where).toBe(sim.avgTotalWithdrawals);
      expect(o.flow.tax, where).toBe(sim.avgTotalTaxPaid);
    }
  });

  it('the toggles actually move the numbers, so being deaf to them would show', () => {
    // The specific silence that made sol-026 so damaging: the ladder never
    // received bsEnabled or useGuardrails, so switching insurance on changed
    // the panel and nothing else. If these ever stop differing, this test has
    // stopped protecting anything and should be rewritten, not deleted.
    const plain = simulate();
    const hedged = simulate({ bsEnabled: true, hedgingDragCost: 1.85, hedgingFloorLimit: -10 });
    const railed = simulate({ useGuardrails: true, monthlyWithdrawal: 90000 });
    const railless = simulate({ monthlyWithdrawal: 90000 });

    expect(hedged.medianFinalBalance).not.toBe(plain.medianFinalBalance);
    expect(railed.probabilityOfSuccess).not.toBe(railless.probabilityOfSuccess);
  });

  it('the macro assumptions move the answer, so hardcoding them would show', () => {
    // readInputs() used to hardcode 12 / 6 / 15 / 12.5. At 10% growth the
    // ladder went on reporting the 12% answer - 17.15 cr against a true
    // 3.32 cr, wrong by five times and silent about it.
    const base = simulate().medianFinalBalance;
    for (const over of [{ expectedReturn: 10 }, { expectedInflation: 9 }, { annualVolatility: 25 }]) {
      expect(simulate(over).medianFinalBalance, JSON.stringify(over)).not.toBe(base);
    }

    // LTCG is the exception, and deliberately so: tax is paid OUT OF the
    // withdrawal, so it changes what reaches the reader's pocket and leaves the
    // corpus alone. Asserted rather than assumed, because the first version of
    // this test expected the balance to move and was wrong about the model.
    expect(simulate({ ltcgTax: 0 }).medianFinalBalance).toBe(base);
    expect(simulate({ ltcgTax: 0 }).avgTotalTaxPaid).toBeLessThan(simulate().avgTotalTaxPaid);
  });
});
