import { outlook, findRemedies, growthCurve, sequenceRisk, type AdviceInputs } from '../utils/swpAdvice';

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
      // The answer and the levers first, so the top of the page can render
      // while the curve is still being built.
      self.postMessage({
        ok: true,
        stage: 'primary',
        outlook: outlook(inputs),
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
        sequence: sequenceRisk(inputs),
      });
    } catch (err) {
      self.postMessage({ ok: false, error: (err as Error).message });
    }
  };
}
