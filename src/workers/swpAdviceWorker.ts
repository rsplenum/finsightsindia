import { outlookFrom, findRemedies, growthCurve, sequenceRisk, protectionCurve, type AdviceInputs } from '../utils/swpAdvice';
import { runSWPMonteCarlo } from './swpWorker';

/**
 * Runs the outlook and the remedy search off the main thread.
 *
 * Finding the three levers means bisecting over the Monte Carlo three times -
 * roughly 30,000 simulated lifetimes. That is fast, but not fast enough to do
 * on the main thread without the input freezing under the user's hands while
 * they type, which would make the calculator feel broken exactly when it is
 * being most helpful.
 *
 * Thin by design, like the other workers: all logic lives in swpAdvice.ts so
 * it stays testable without a worker runtime.
 */
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = (e) => {
    const inputs = e.data as AdviceInputs;
    try {
      // ONE simulation, for every surface on the page (sol-026, dd-013).
      //
      // This used to be `outlook(inputs)`, which ran its own 2,000-path sweep,
      // while the advanced panel ran a separate 10,000-path sweep of its own
      // from a second worker. Two runs meant two answers to one question, and
      // the reader was shown both. The raw result now travels with the outlook
      // so the panel can render from the very same numbers rather than
      // recomputing them - a view must never re-derive what the engine already
      // knows, which is sol-023's rule at the scale of a page.
      const simulation = runSWPMonteCarlo(inputs);

      // The answer and the levers first, so the top of the page can render
      // while the curve is still being built.
      self.postMessage({
        ok: true,
        stage: 'primary',
        simulation,
        outlook: outlookFrom(simulation, inputs),
        remedies: findRemedies(inputs),
      });
      self.postMessage({
        ok: true,
        stage: 'curve',
        curve: growthCurve(inputs),
      });
      // Deterministic and cheap - no Monte Carlo - so it lands last but fast.
      self.postMessage({
        ok: true,
        stage: 'sequence',
        // One, two and three-year downturns. A single bad year is not the
        // frightening case; 2000-2002 and 2008-2009 are.
        sequences: {
          1: sequenceRisk(inputs, -30, 1),
          2: sequenceRisk(inputs, -30, 2),
          3: sequenceRisk(inputs, -30, 3),
        },
      });
      // Rung 5. Two survival sweeps across the roughness range, so it is the
      // most expensive stage and deliberately the last: by the time it lands
      // the reader is still four rungs above it.
      self.postMessage({
        ok: true,
        stage: 'protection',
        curve: protectionCurve(inputs),
      });
    } catch (err) {
      self.postMessage({ ok: false, error: (err as Error).message });
    }
  };
}
