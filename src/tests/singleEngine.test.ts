import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// dd-013, enforced. "There is one engine" is a claim about the codebase, and a
// claim with no detector is an intention (dd-011).
//
// The SWP planner used to render from two independent implementations of the
// same withdrawal, tax and cost-basis maths: runSWPMonteCarlo and
// runDeterministicSWP. The cost of that was not theoretical - the LTCG
// double-charge existed in both and had to be found and fixed twice, and a
// parity test was all that stood between us and a page whose table silently
// contradicted its own headline.
//
// swpWorker now accepts an explicit `returnsByYear`, so the one engine can be
// driven deterministically and the duplicate has no production caller left.
// This test stops it acquiring one.

const ROOTS = ['src/pages', 'src/components', 'src/layouts', 'src/workers', 'src/utils'];

/** Every source file that ships to a reader, tests excluded. */
function productionFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|astro)$/.test(entry.name)) out.push(full);
    }
  };
  for (const r of ROOTS) walk(r);
  return out;
}

describe('dd-013 - each calculator runs on one engine', () => {
  const files = productionFiles();

  it('there are production files to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('nothing in production imports the retired deterministic engine', () => {
    // swpDeterministic.ts survives only as a harness for the tests that guard
    // the LTCG double-charge. Those tests are worth more than the file's
    // deletion is, so it stays until they are ported - but it must not come
    // back into the product. If this fails, the fix is to drive
    // runSWPMonteCarlo with `returnsByYear`, not to add an exemption.
    const offenders = files.filter((f) => {
      if (f.endsWith('swpDeterministic.ts')) return false;
      return /from\s+['"].*swpDeterministic['"]/.test(fs.readFileSync(f, 'utf-8'));
    });
    expect(offenders, 'production code importing swpDeterministic').toEqual([]);
  });

  // sol-026: two `new Worker(...)` calls on one page meant two simulations and
  // two answers to one question, shown side by side.
  //
  // Originally this asserted a single Worker across the whole calculator tree,
  // which was true only while the planner was the one page with a ladder. The
  // rule was never "one worker in the repository" - it is ONE COMPUTE HOST PER
  // PAGE, and a page that computes nothing itself. Stated that way it survives
  // the SIP page inheriting the pattern, and it still fails on the thing that
  // actually went wrong.
  const COMPUTE_HOSTS = [
    'src/components/Calculators/RetirementAnswer.astro',
    'src/components/Calculators/SipAnswer.astro',
  ];

  it('each compute host constructs exactly one Worker', () => {
    for (const host of COMPUTE_HOSTS) {
      const body = fs.readFileSync(host, 'utf-8');
      const n = (body.match(/new Worker\(/g) ?? []).length;
      expect(n, `${host} should own exactly one worker`).toBe(1);
    }
  });

  it('no page and no rung constructs a Worker of its own', () => {
    // The rungs and the expert panel subscribe to the host's broadcast. A page
    // that starts its own worker is running a second simulation, and the two
    // will print different numbers for the same input the moment anything
    // about them diverges - which is exactly what the planner was caught doing.
    const offenders = files
      .filter((f) => f.startsWith('src/pages/') || f.includes('Calculators'))
      .filter((f) => !COMPUTE_HOSTS.includes(f))
      .filter((f) => /new Worker\(/.test(fs.readFileSync(f, 'utf-8')));
    expect(offenders, 'files running a simulation of their own').toEqual([]);
  });

  it('only the two engine files contain a simulation loop', () => {
    // A derivation may sweep the engine; it may never grow its own RNG. This
    // is what keeps the ladder a VIEW of the maths rather than a second copy
    // of it - which is the whole point of the layer.
    //
    // Scoped to the seeded-RNG markers the engines actually use. A bare
    // Math.random() is not evidence of a financial model - RelatedArticles
    // shuffles a list with one - so matching on it flagged an article
    // component and would have taught the next person to add an exemption
    // list, which is how a detector rots.
    const simulators = files.filter((f) =>
      /mulberry32|getRandomNormal|Box-Muller/.test(fs.readFileSync(f, 'utf-8'))
    );
    expect(simulators.sort()).toEqual(
      ['src/workers/sipWorker.ts', 'src/workers/swpWorker.ts'].sort()
    );
  });

  it('no calculator surface rolls its own randomness', () => {
    // The narrower rule, where it matters: anything under workers/ or utils/,
    // or any calculator component, must get its randomness from an engine
    // rather than from Math.random.
    const calculators = files.filter(
      (f) =>
        f.startsWith('src/workers/') ||
        f.startsWith('src/utils/') ||
        f.includes('Calculators')
    );
    const offenders = calculators.filter(
      (f) =>
        !f.endsWith('sipWorker.ts') &&
        !f.endsWith('swpWorker.ts') &&
        /Math\.random\(/.test(fs.readFileSync(f, 'utf-8'))
    );
    expect(offenders, 'calculator code using Math.random').toEqual([]);
  });
});
