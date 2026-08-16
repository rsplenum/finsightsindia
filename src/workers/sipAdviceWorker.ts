import {
  simulate, outlookFrom, findRemedies, growthCurve, sequenceRisk, protectionCurve,
  type SipInputs,
} from '../utils/sipAdvice';

/**
 * The compute host for the SIP ladder, off the main thread.
 *
 * Thin by design, like every other worker here: all logic lives in sipAdvice.ts
 * so it stays testable without a worker runtime.
 *
 * ONE simulation, for every surface on the page (sol-026, dd-013). The raw
 * result travels with the outlook so the expert panel renders from the very
 * same numbers rather than running a second sweep of its own - which is exactly
 * what the planner was caught doing, printing 17.02 cr beside 17.15 cr at
 * identical inputs.
 *
 * Staged, because the three lever searches are roughly 30,000 simulated
 * lifetimes and the growth track another 8,000. Both are fast, neither is fast
 * enough to hold up the headline while somebody is typing.
 */
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = (e) => {
    const inputs = e.data as SipInputs;
    try {
      const simulation = simulate(inputs);
      const outlook = outlookFrom(simulation, inputs);

      // The answer first, so the top of the page can render while the levers
      // are still being searched for.
      self.postMessage({ ok: true, stage: 'primary', simulation, outlook });
      self.postMessage({
        ok: true,
        stage: 'remedies',
        remedies: findRemedies(simulation, inputs),
      });
      // The sweep is handed the page's own run so its anchor point is the
      // Answer's figure rather than a smaller sample of the same plan.
      self.postMessage({
        ok: true, stage: 'curve',
        curve: growthCurve(inputs, undefined, undefined, undefined, undefined, simulation),
      });

      // Rung 5. Deterministic and cheap - one path per placement, three
      // durations - so it costs less than any of the searches above it.
      self.postMessage({
        ok: true, stage: 'sequence', sequence: sequenceRisk(inputs),
      });

      // Rung 6, and the most expensive thing on the page: two simulated worlds
      // at every roughness on the track. Last on purpose, and it is the reason
      // these stages exist at all - the headline must never wait on it.
      self.postMessage({
        ok: true, stage: 'protection', protection: protectionCurve(inputs),
      });
    } catch (err) {
      self.postMessage({ ok: false, error: (err as Error).message });
    }
  };
}
