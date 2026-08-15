import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Enforcement for sol-019 and T7: the UI obeys the same ban list as the prose.
//
// sol-019 claims to be checkable rather than aspirational. This is the part
// that makes that true. The site currently breaks its own rules - the
// homepage headline is "THE DECISION PARADIGM SHIFT", and "paradigm shift" is
// on the Shared Ban List the content factory enforces on every article.
//
// This is a RATCHET, not a pass/fail gate. Failing outright on day one would
// put the suite permanently red, which is exactly the failure mode that let
// tax.test.ts rot unnoticed - people learn to scroll past. Instead the
// current debt is recorded in a baseline, and the test enforces two things:
//
//   1. no NEW violation may appear (the debt cannot grow)
//   2. no baseline entry may remain once it is fixed (the debt must shrink)
//
// The second direction matters as much as the first. Without it the baseline
// becomes a permanent excuse rather than a worklist.

const DIST = 'dist';
const BASELINE = 'src/tests/doctrineJargon.baseline.json';
const hasDist = fs.existsSync(DIST);

// Reader-facing chrome only. Terms drawn from Part F of the drafting SKILL.md
// plus the quantitative vocabulary that makes the calculators intimidating.
const BANNED = [
  'stochastic', 'brownian motion', 'variance drain', 'newton-raphson',
  'newton raphson', 'sequence-of-returns', 'decision intelligence',
  'paradigm shift', 'delve', 'tapestry', 'ever-evolving', 'game changer',
  'navigate the complexities', 'unlocking potential',
  'institutional quantitative', 'leptokurtic', 'heteroskedastic',
];

// Pages that document how the site is built, for an audience that came to
// read about the process. The ban list exists so a layperson meeting a
// calculator is not intimidated by vocabulary; it is not a prohibition on
// naming a term while explaining it. sol-019 itself lists the banned words,
// and /solutions renders sol-019 - so without this the doctrine page can
// never satisfy the doctrine.
//
// FAQ is deliberately NOT here. It is product copy a confused user reaches
// for, so "stochastic" on /faq stays flagged.
const META_ROUTES = new Set([
  'solutions', 'creator-log', 'shelved-ideas', 'standards',
  'research-ledger', 'reels',
]);

const routeOf = (file: string): string =>
  file.replace(`${DIST}/`, '').replace(/\/index\.html$/, '').replace(/\.html$/, '') || '/';

function scan(): Record<string, string[]> {
  const found: Record<string, Set<string>> = {};
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      if (META_ROUTES.has(routeOf(p))) continue;

      const text = fs
        .readFileSync(p, 'utf-8')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '') // bundled JS is not copy
        .replace(/<[^>]+>/g, ' ')
        .toLowerCase();

      for (const term of BANNED) {
        if (text.includes(term)) {
          (found[term] ??= new Set()).add(routeOf(p));
        }
      }
    }
  };
  walk(DIST);
  return Object.fromEntries(
    Object.entries(found).map(([k, v]) => [k, [...v].sort()])
  );
}

describe.skipIf(!hasDist)('sol-019 / T7 - the UI obeys the article ban list', () => {
  const current = hasDist ? scan() : {};
  const baseline: Record<string, string[]> = fs.existsSync(BASELINE)
    ? JSON.parse(fs.readFileSync(BASELINE, 'utf-8'))
    : {};

  it('no new banned term appears anywhere in reader-facing copy', () => {
    const added: string[] = [];
    for (const [term, routes] of Object.entries(current)) {
      const known = new Set(baseline[term] ?? []);
      for (const r of routes) {
        if (!known.has(r)) added.push(`"${term}" on /${r}`);
      }
    }
    expect(
      added,
      `New jargon introduced. Either rewrite the copy, or if this is a ` +
      `deliberate exception, add it to ${BASELINE} with a reason.\n` +
      added.map((a) => `  - ${a}`).join('\n')
    ).toEqual([]);
  });

  it('the baseline shrinks - fixed entries must be removed from it', () => {
    // Stops the baseline becoming a permanent excuse. When copy is cleaned
    // up, this fails until the debt list is updated to match reality.
    const stale: string[] = [];
    for (const [term, routes] of Object.entries(baseline)) {
      const still = new Set(current[term] ?? []);
      for (const r of routes) {
        if (!still.has(r)) stale.push(`"${term}" on /${r}`);
      }
    }
    expect(
      stale,
      `Fixed - remove these from ${BASELINE} so the ratchet tightens:\n` +
      stale.map((s) => `  - ${s}`).join('\n')
    ).toEqual([]);
  });

  it('reports the outstanding debt', () => {
    const total = Object.values(current).reduce((n, r) => n + r.length, 0);
    const worst = Object.entries(current)
      .flatMap(([t, rs]) => rs.map((r) => r))
      .reduce<Record<string, number>>((acc, r) => ((acc[r] = (acc[r] ?? 0) + 1), acc), {});
    const ranked = Object.entries(worst).sort((a, b) => b[1] - a[1]).slice(0, 3);
    console.log(
      `\n  T7 debt: ${total} occurrence(s) across ${Object.keys(current).length} term(s).` +
      `\n  Worst pages: ${ranked.map(([r, n]) => `/${r} (${n})`).join(', ')}\n`
    );
    expect(total).toBeGreaterThanOrEqual(0);
  });
});
