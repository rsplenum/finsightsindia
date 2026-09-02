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

/**
 * sol-051: the markup declared handles that nothing anywhere holds.
 *
 * The same contract as the rest of this file, read in the other direction. The
 * checks above ask whether every field the page READS is one the reader
 * produces. This one asks whether every handle the page OFFERS is one somebody
 * takes. Both failures are invisible for the same reason: Astro does not
 * typecheck the client `<script>`, so a `getElementById` that was renamed,
 * or never written at all, leaves the markup behind and the build stays green.
 *
 * The one that mattered was `tier3ActionableFooter`. It shipped the sentence
 * "Calculating actionable financial guidance..." and no script ever wrote to
 * it, so it said that permanently, sitting under a finished answer. A reader
 * cannot tell a promise that is still loading from one that was never kept;
 * they wait for it. That is the reader's time spent on nothing, which is the
 * one currency CLAUDE.md says we are paid in.
 *
 * TWO REMEDIES, AND PICKING THE WRONG ONE BREAKS THE PAGE. An unreferenced id
 * means the HANDLE is dead, not necessarily the ELEMENT:
 *
 *   - the element is dead too       -> delete the element (tier3ActionableFooter)
 *   - the element is alive, id unused -> delete ONLY the id attribute
 *
 * Six of the seven found on the planner were the second kind. `wowMetricBanner`
 * is the entire lifetime-cash-flow dashboard and `sacrificeMetric1` wraps
 * `valSacrificeTotalCash`, which the script writes on every run. Deleting those
 * elements because their ids were unreferenced would have removed working
 * output from the page. The failure message below says this, because the next
 * person to see it will be reading it in a hurry.
 *
 * Scoped to `src/pages`, which is where the audit found the class and where the
 * tree is now at zero. Components carry ~21 more, most of them section anchors
 * (`rungFlow`, `taxAnswer`) that look like deliberate landmarks for T9's
 * deep-linking rather than debris. Sorting those is a navigation judgement, not
 * a deletion, so it is recorded in the launch gate instead of guessed at here.
 */
describe('sol-051 - no page declares an id that nothing references', () => {
  const REF_ATTRS = [
    'for', 'href', 'aria-labelledby', 'aria-controls', 'aria-describedby',
    'aria-activedescendant', 'form', 'list', 'headers', 'data-target', 'popovertarget',
  ];

  const walk = (dir: string, out: string[] = []): string[] => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p, out);
      else if (/\.(astro|ts|js|tsx|jsx|css|mdx|md|html)$/.test(e.name)) out.push(p);
    }
    return out;
  };

  // src/tests is excluded on purpose, and this file is the reason. Its prose and
  // its own assertions name the very ids it is checking, so leaving it in would
  // let the test vouch for the thing it is testing. The principle is wider than
  // the accident: a test naming an id is not a page USING one, so a handle whose
  // only holder is a test is still a handle nothing on screen holds.
  const files = [...walk('src'), ...(fs.existsSync('public') ? walk('public') : [])]
    .filter((f) => !f.startsWith('src/tests/'));

  /**
   * Every token in the tree that could be holding a handle. Built once over the
   * whole corpus rather than per-id, so this stays a single pass.
   *
   * `id="..."` is stripped before harvesting quoted strings. Without that, a
   * declaration would be indistinguishable from a reference and every id would
   * vouch for itself - the test would pass for all inputs, which is dd-011's
   * store with no failure mode.
   */
  const referenced = new Set<string>();
  /**
   * Handles that are BUILT rather than written, as `` `inDed${section}` ``.
   *
   * The harvest above only sees a handle spelled out in full, so the moment a
   * page stopped listing its Chapter VI-A fields and started deriving them from
   * the engine's rules table, three live fields read as dead. The wall was
   * right to fire - it could not see the holder - and wrong about the fact, and
   * a wall that fires on correct code is a wall someone eventually switches
   * off.
   *
   * A prefix is only harvested when it is at least four characters, so a bare
   * `` `${x}` `` cannot admit everything and quietly turn this test green for
   * all inputs.
   */
  const constructedPrefixes: string[] = [];
  for (const f of files) {
    // Comments are stripped for the reason given at the top of this file: a name
    // that appears only in prose must not vouch for itself. An HTML comment
    // counts too - the commit that deletes a dead element usually leaves a note
    // where it stood, and that note must not resurrect the id it describes.
    const raw = fs
      .readFileSync(f, 'utf-8')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

    const body = raw.replace(/\bid="[^"]*"/g, ' ');

    // getElementById('x'), querySelector-by-string, and the ['a','b'].forEach
    // shape the SIP page uses to bind its inputs.
    for (const m of body.matchAll(/(['"`])([A-Za-z][\w-]*)\1/g)) referenced.add(m[2]);

    for (const m of body.matchAll(/`([A-Za-z][\w-]{3,})\$\{/g)) constructedPrefixes.push(m[1]);

    // '#x' as a CSS rule, a selector string, or an anchor target.
    for (const m of body.matchAll(/#([A-Za-z][\w-]*)/g)) referenced.add(m[1]);

    // Attributes that point at an id by name; several take a space-separated list.
    for (const attr of REF_ATTRS) {
      for (const m of raw.matchAll(new RegExp(`\\b${attr}="([^"]*)"`, 'g'))) {
        for (const tok of m[1].trim().split(/\s+/)) {
          referenced.add(tok.startsWith('#') ? tok.slice(1) : tok);
        }
      }
    }
  }

  const isHeld = (id: string) =>
    referenced.has(id) || constructedPrefixes.some((p) => id.startsWith(p));

  const pages = files.filter((f) => f.startsWith('src/pages/') && f.endsWith('.astro'));
  const idsIn = (src: string) =>
    [...new Set([...src.matchAll(/\bid="([A-Za-z][\w-]*)"/g)].map((m) => m[1]))];

  it('the harvest is real (guards the guard)', () => {
    // Three ways this test could pass while checking nothing: no pages found,
    // no ids found, or a `referenced` set so permissive that it contains
    // everything. One assertion each.
    expect(pages.length).toBeGreaterThan(10);
    expect(files.flatMap((f) => idsIn(fs.readFileSync(f, 'utf-8'))).length)
      .toBeGreaterThan(40);
    expect(referenced.has('downloadPdfBtn')).toBe(true);
    expect(referenced.has('tier3ActionableFooter')).toBe(false);
    expect(referenced.has('sacrificeMetric1')).toBe(false);
    // The constructed-prefix widening must stay narrow enough to still fail.
    // Both dead ids above have to survive it, and the derived Chapter VI-A
    // fields have to be admitted by it - otherwise it is either useless or a
    // blanket amnesty.
    // The live example moved when the tax form stopped deriving its ids from
    // the engine's Chapter VI-A table alone and started deriving every field
    // from the catalogue. `inDed${section}` became `inFld_${entryId}`; the
    // widening this asserts is the same one, still narrow.
    expect(constructedPrefixes).toContain('inFld_');
    expect(isHeld('inFld_sec80c')).toBe(true);
    expect(isHeld('sacrificeMetric1')).toBe(false);
    expect(isHeld('tier3ActionableFooter')).toBe(false);
  });

  for (const page of ['src/pages/swp-planner.astro', 'src/pages/sip-engine.astro']) {
    it(`${page} declares no id that nothing holds`, () => {
      const dead = idsIn(fs.readFileSync(page, 'utf-8')).filter((id) => !isHeld(id));
      expect(dead, deadIdMessage(page, dead)).toEqual([]);
    });
  }

  it('no other page declares an id that nothing holds', () => {
    const offenders: string[] = [];
    for (const page of pages) {
      for (const id of idsIn(fs.readFileSync(page, 'utf-8'))) {
        if (!isHeld(id)) offenders.push(`${page}  ${id}`);
      }
    }
    expect(offenders, deadIdMessage('src/pages', offenders)).toEqual([]);
  });

  function deadIdMessage(where: string, dead: string[]): string {
    return (
      `${where} declares ${dead.length} id(s) that nothing in src/ or public/ ` +
      `references - no getElementById, no selector, no label, no anchor:\n` +
      dead.map((d) => `  - ${d}`).join('\n') +
      `\n\nDo NOT reflexively delete the element. Check which kind it is:\n` +
      `  - nothing on screen depends on it  -> delete the element\n` +
      `  - it renders or wraps live output  -> delete ONLY the id="" attribute\n` +
      `sol-051 found six of the second kind and one of the first. Deleting the ` +
      `six would have taken the planner's whole cash-flow dashboard with them.`
    );
  }
});
