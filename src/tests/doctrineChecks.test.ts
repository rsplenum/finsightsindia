import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Enforcement for dd-000: run the doctrine checks BEFORE designing.
//
// That rule was written, then broken. The evidence is unusually clean: the
// checks were run and posted before rung 3, which survived review; they were
// skipped before rung 4, which failed review on six counts and had to be
// rebuilt. Same day, same doctrine, opposite outcomes.
//
// It had already been "fixed" once by stating the rule more firmly, and that
// did not work, because an intention is not a mechanism. So: every reader-
// facing calculator component must ship with a sibling `.checks.md` recording
// which doctrine entries were considered and what the answers were. No file,
// no build - the test fails and says which component is missing one.
//
// This is not paperwork. The file is written BEFORE the component, while the
// design is still cheap to change; that is the whole value, and the only
// reason it has teeth is that the suite goes red without it.

const DIR = 'src/components/Calculators';

// Components predating the doctrine. Deliberately listed rather than silently
// skipped: this is a debt list that should shrink, not a permanent exemption.
const PREDATES_DOCTRINE = new Set([
  'FOAuditTrigger.astro',
  'MSMEDInterestCalculator.astro',
]);

const components = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter((f) => f.endsWith('.astro'))
  : [];

describe('dd-000 - every calculator screen records its design checks', () => {
  it('there are components to check', () => {
    expect(components.length).toBeGreaterThan(0);
  });

  it('each new component has a sibling .checks.md', () => {
    const missing = components
      .filter((f) => !PREDATES_DOCTRINE.has(f))
      .filter((f) => !fs.existsSync(path.join(DIR, f.replace(/\.astro$/, '.checks.md'))));

    expect(
      missing,
      `Missing design checks. Write ${missing
        .map((f) => f.replace(/\.astro$/, '.checks.md'))
        .join(', ')} BEFORE the component, answering the relevant tests in ` +
        `src/data/design-doctrine.json. dd-000: recording a lesson and then ` +
        `designing without consulting it is the same failure as never recording it.`
    ).toEqual([]);
  });

  it('each checks file actually answers doctrine entries, not just exists', () => {
    // A file that mentions no dd- entry is a box ticked, not a check run.
    const empty: string[] = [];
    for (const f of components) {
      const p = path.join(DIR, f.replace(/\.astro$/, '.checks.md'));
      if (!fs.existsSync(p)) continue;
      const body = fs.readFileSync(p, 'utf-8');
      const cited = body.match(/dd-\d{3}/g) ?? [];
      if (new Set(cited).size < 3) empty.push(`${path.basename(p)} (cites ${new Set(cited).size})`);
    }
    expect(empty, 'checks files that cite fewer than 3 doctrine entries').toEqual([]);
  });

  it('the pre-doctrine debt list does not grow', () => {
    // Adding to this set would turn an exemption into a loophole.
    expect(PREDATES_DOCTRINE.size).toBeLessThanOrEqual(2);
    for (const f of PREDATES_DOCTRINE) {
      expect(components, `${f} is exempted but no longer exists - remove it`).toContain(f);
    }
  });
});
