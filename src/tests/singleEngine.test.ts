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

describe('dd-013 - the planner runs on one engine', () => {
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

  it('exactly one Worker is constructed for the planner page', () => {
    // sol-026: two `new Worker(...)` calls meant two simulations and two
    // answers to one question, shown side by side.
    const planner = files.filter(
      (f) => f.includes('swp-planner') || f.includes('Calculators')
    );
    const constructions = planner.flatMap((f) => {
      const body = fs.readFileSync(f, 'utf-8');
      return (body.match(/new Worker\(/g) ?? []).map(() => f);
    });
    expect(constructions.length, `Workers constructed in: ${constructions.join(', ')}`).toBe(1);
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
