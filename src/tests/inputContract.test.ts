import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

/**
 * sol-044: the page read a field its own input reader has never returned.
 *
 * `readPlannerInputs()` returns `monthlyWithdrawal`. `renderDashboard` destructured
 * `initialMonthly`. Astro does not typecheck the client `<script>` block, so the
 * build was clean and the field was simply `undefined` on every page load. One
 * wrong word produced three defects, and only one of them was visible:
 *
 *   - the sensitivity table printed `NaN%` in all four rows (visible)
 *   - the safe-withdrawal-rate warning could never fire, because `NaN > 6`
 *     is false (silent, and it is a safety check)
 *   - the endurance figure silently dropped its months component, because
 *     `Math.min(11, Math.max(0, NaN))` is NaN and `NaN > 0` is false (silent)
 *
 * The gate has carried "a typed boundary between the compute host and the rungs"
 * as an open item since sol-035, and this is that item's second instance. The
 * proper fix is the typed boundary; `astro check` would also catch it but needs
 * a dependency this repo does not have. Until one of those lands, this is the
 * detector — dd-011/do-1, a store with no failure mode drifts.
 *
 * It is deliberately a string-level check rather than a type-level one, because
 * the defect lives exactly where the type system was not looking.
 */

/** Keys declared by an interface block, by name. */
const ifaceKeys = (src: string, name: string): string[] => {
  const m = src.match(new RegExp(`export interface ${name}[^{]*\\{([\\s\\S]*?)\\n\\}`));
  return m ? [...m[1].matchAll(/^\s*(\w+)\??\s*:/gm)].map((x) => x[1]) : [];
};

/** Keys the reader's return literal actually produces — the runtime truth. */
const returnKeys = (src: string, fn: string): string[] => {
  const m = src.match(new RegExp(`export function ${fn}\\(\\)[^{]*\\{([\\s\\S]*?)\\n\\}`));
  if (!m) return [];
  const literal = m[1].replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...literal.matchAll(/^\s{4}(\w+)\s*:/gm)].map((x) => x[1]);
};

const readerKeys = (): Set<string> => {
  const planner = fs.readFileSync('src/utils/plannerInputs.ts', 'utf-8');
  const advice = fs.readFileSync('src/utils/swpAdvice.ts', 'utf-8');

  const keys = new Set<string>();

  // The fields AdviceInputs declares, which PlannerInputs extends.
  const iface = advice.match(/export interface AdviceInputs\s*\{([\s\S]*?)\n\}/);
  if (iface) for (const m of iface[1].matchAll(/^\s*(\w+)\??\s*:/gm)) keys.add(m[1]);

  // The fields PlannerInputs adds on top.
  const own = planner.match(/export interface PlannerInputs[^{]*\{([\s\S]*?)\n\}/);
  if (own) for (const m of own[1].matchAll(/^\s*(\w+)\??\s*:/gm)) keys.add(m[1]);

  // The keys the return literal actually produces — the runtime truth, which is
  // what the page meets. Comments inside it are stripped first so that a key
  // named in prose cannot vouch for itself.
  const body = planner.match(/export function readPlannerInputs\(\)[^{]*\{([\s\S]*?)\n\}/);
  if (body) {
    const literal = body[1]
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of literal.matchAll(/^\s{4}(\w+)\s*:/gm)) keys.add(m[1]);
  }

  return keys;
};

/** Every field the page reads off the one input object, with comments stripped. */
const fieldsReadFrom = (file: string): string[] => {
  const src = fs
    .readFileSync(file, 'utf-8')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const read = new Set<string>();

  // inputs.someField
  for (const m of src.matchAll(/\binputs\.(\w+)/g)) read.add(m[1]);

  // const { a, b: alias, c } = inputs;  — the KEY is what must exist, so an
  // alias is read from the left of the colon. This is the exact shape that
  // broke: `initialMonthly` was a key, not an alias.
  for (const m of src.matchAll(/\{([^{}]*?)\}\s*=\s*inputs\b/g)) {
    for (const part of m[1].split(',')) {
      const key = part.trim().split(':')[0].trim().replace(/^\.\.\./, '');
      if (/^\w+$/.test(key)) read.add(key);
    }
  }

  return [...read].sort();
};

describe('sol-044 - every field the planner reads is a field its reader returns', () => {
  const produced = readerKeys();

  it('readPlannerInputs is parsed correctly (guards the guard)', () => {
    // If this regex ever stops matching, the test below would pass vacuously by
    // comparing against an empty set. dd-011: a detector that cannot fail is
    // already drifting.
    expect(produced.has('monthlyWithdrawal')).toBe(true);
    expect(produced.has('initialCorpus')).toBe(true);
    expect(produced.size).toBeGreaterThan(8);
  });

  for (const file of ['src/pages/swp-planner.astro', 'src/utils/chart-helpers.ts']) {
    it(`${file} reads no field that does not exist`, () => {
      const missing = fieldsReadFrom(file).filter((f) => !produced.has(f));
      expect(
        missing,
        `These are read off the planner's input object but readPlannerInputs ` +
        `never returns them, so they are undefined at runtime and the build ` +
        `stays green:\n` +
        missing.map((f) => `  - inputs.${f}`).join('\n') +
        `\n\nProduced: ${[...produced].sort().join(', ')}`
      ).toEqual([]);
    });
  }
});

/**
 * sol-046: the same defect on the SIP page, found by extending this check to it
 * rather than by anyone noticing. `inputs.annualStepUp` — the reader returns
 * `realStepUp` — made every instalment from year 2 onward NaN in the real-yield
 * calculation. calculateXIRR did not return NaN or throw; it absorbed 348 NaN
 * flows out of 361 and returned 19.20%, which the page printed as the plan's
 * return after inflation. The truthful figure is about 5.7%.
 *
 * That is why this file checks every page rather than the one that broke: the
 * visible NaN on the planner was the lucky case. Here the same fault produced a
 * confident, plausible, wrong headline number instead.
 */
describe('sol-046 - every field the SIP page reads is a field its reader returns', () => {
  const src = fs.readFileSync('src/utils/sipInputs.ts', 'utf-8');
  const produced = new Set([
    ...ifaceKeys(src, 'SipInputs'),
    ...returnKeys(src, 'readSipInputs'),
  ]);

  it('readSipInputs is parsed correctly (guards the guard)', () => {
    expect(produced.has('realStepUp')).toBe(true);
    expect(produced.has('monthlySip')).toBe(true);
    expect(produced.size).toBeGreaterThan(8);
  });

  for (const file of ['src/pages/sip-engine.astro', 'src/components/Calculators/SipAnswer.astro']) {
    it(`${file} reads no field that does not exist`, () => {
      const missing = fieldsReadFrom(file).filter((f) => !produced.has(f));
      expect(
        missing,
        `Read off the SIP input object but never produced by readSipInputs:\n` +
        missing.map((f) => `  - inputs.${f}`).join('\n') +
        `\n\nProduced: ${[...produced].sort().join(', ')}`
      ).toEqual([]);
    });
  }
});

/**
 * sol-047: the two engine pages must assume the same world, and neither may
 * carry a typed copy of a figure the repo computes.
 *
 * Both pages already RENDERED `DEFAULT_REGIME.growth` into their CAGR field, so
 * they looked consistent. Their readers did not: the planner fell back to 12%
 * and 15% - sol-028's original pair, the numbers that solution existed to
 * delete - and the SIP page fell back to a hand-typed 13.4% against a computed
 * 13.3%. A fallback is reachable by clearing the field, and on the planner that
 * silently moved the shipped answer from Rs 1.28 crore to Rs 59.5 lakh.
 *
 * regimePresets.ts opens by saying a preset must be computed and never typed,
 * "a fabricated figure wearing a factual label". This is that check, applied to
 * the readers standing one import away from it.
 */
describe('sol-047 - no typed copy of a computed market assumption', () => {
  const readers = ['src/utils/plannerInputs.ts', 'src/utils/sipInputs.ts'];

  it('both readers import the regime rather than restating it', () => {
    for (const f of readers) {
      expect(fs.readFileSync(f, 'utf-8'), `${f} must derive its market fallback`)
        .toContain('DEFAULT_REGIME');
    }
  });

  for (const file of readers) {
    it(`${file} falls back to no hardcoded growth or roughness`, () => {
      const src = fs
        .readFileSync(file, 'utf-8')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      // The market assumption is read through these two field keys. Whatever
      // stands in when the box is empty must be derived, not a literal.
      const offenders: string[] = [];
      for (const m of src.matchAll(/num\(\s*F\.(ret|vol)\s*,\s*([^)]+)\)/g)) {
        if (/^-?\d/.test(m[2].trim())) offenders.push(`F.${m[1]} falls back to ${m[2].trim()}`);
      }
      expect(
        offenders,
        `A market assumption is typed in here instead of computed from ` +
        `nifty50-annual-returns.json. sol-028 is the reason this matters and ` +
        `sol-047 is the reason it is checked:\n` +
        offenders.map((o) => `  - ${o}`).join('\n')
      ).toEqual([]);
    });
  }

  it('the two pages assume one world', () => {
    // Not a string check: the point is that both resolve to the same regime.
    const planner = fs.readFileSync('src/utils/plannerInputs.ts', 'utf-8');
    const sip = fs.readFileSync('src/utils/sipInputs.ts', 'utf-8');
    const growthOf = (s: string) => s.match(/num\(\s*F\.ret\s*,\s*([^)]+)\)/)?.[1].trim();
    const roughOf = (s: string) => s.match(/num\(\s*F\.vol\s*,\s*([^)]+)\)/)?.[1].trim();
    expect(growthOf(planner)).toBe(growthOf(sip));
    expect(roughOf(planner)).toBe(roughOf(sip));
  });
});
