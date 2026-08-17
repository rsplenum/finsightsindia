import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// F-01 — the sub-12px type floor, as a ratchet.
//
// A ratchet rather than a flat ban, for the same reason `doctrineJargon` is one:
// the audit counted 317 pieces of type below 12px across the whole tree, most of
// them in the content workstream's articles and illustrations. Failing on all of
// them would mean this test is red on work nobody has started, and a permanently
// red test is a disabled test.
//
// So the rule is: the count may fall, never rise. New sub-12px type in a swept
// file fails immediately; the untouched backlog is recorded and shrinks.
//
// The convention, set by the type-floor migration already in the tree and
// followed here: text-[11px] -> text-sm (14px), text-[10px] -> text-xs (12px).
// `text-[9px]` is deliberately NOT converted — it is 17 badges and eyebrow
// labels whose containers would reflow, which is a layout decision for Rahul
// rather than a find-and-replace. They are counted here so they cannot be
// forgotten, and so nobody adds an eighteenth.

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const walk = (dir: string, out: string[] = []) => {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    // src/tests is excluded because this file's own regexes contain the very
    // literals it counts — it found 18 of 17 on the first run, and the
    // eighteenth was itself.
    if (rel.startsWith('src/tests')) continue;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(astro|mdx|ts)$/.test(e.name)) out.push(rel);
  }
  return out;
};

const SUB12 = /text-\[(?:[0-9]|10|11)px\]/g;
const countIn = (f: string) => (read(f).match(SUB12) ?? []).length;

// The files F-01 has actually swept. These must stay at zero for 10px and 11px.
const SWEPT = [
  'src/pages/swp-planner.astro',
  'src/pages/sip-engine.astro',
  'src/pages/tax-calculator.astro',
  'src/pages/insurance-analyzer.astro',
  'src/pages/black-scholes.astro',
  ...fs
    .readdirSync(path.join(ROOT, 'src/components/Calculators'))
    .filter((f) => f.endsWith('.astro'))
    .map((f) => `src/components/Calculators/${f}`),
];

// Verified in the browser at 1280x900 on 17 Aug: every remaining sub-12px node on
// the five calculator pages is one of these, and each was HELD on purpose.
const HELD_9PX = 17;

// The whole-tree backlog. Ratchet: may fall, never rise. Tighten it whenever it
// falls — the audit counted 317, it was 163 before this sweep and is 68 after.
// What is left: faq.astro (14), the content workstream's fcnr illustrations
// (~30), and the 17 held 9px labels, which are counted in this total too.
const BACKLOG_CEILING = 68;

describe('F-01 — the sub-12px type floor', () => {
  it('the swept files carry no 10px or 11px type', () => {
    const hits: string[] = [];
    for (const f of SWEPT) {
      if (!fs.existsSync(path.join(ROOT, f))) continue;
      read(f).split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/text-\[(10|11)px\]/g)) hits.push(`${f}:${i + 1}  ${m[0]}`);
      });
    }
    expect(hits, `sub-12px type reintroduced into a swept file:\n${hits.join('\n')}`).toEqual([]);
  });

  it('nobody has added an eighteenth 9px label', () => {
    // Held, not fixed: bumping these reflows the badges they sit in, so the
    // decision is Rahul's. Counted so the deferral cannot rot into a habit.
    const n = walk('src').reduce((a, f) => a + (read(f).match(/text-\[9px\]/g) ?? []).length, 0);
    expect(n, `9px labels went from ${HELD_9PX} to ${n} — either finish them or hold them, do not grow them`)
      .toBeLessThanOrEqual(HELD_9PX);
  });

  it('the whole-tree backlog only ever shrinks', () => {
    const total = walk('src').reduce((a, f) => a + countIn(f), 0);
    expect(total, `sub-12px type rose to ${total} from a ceiling of ${BACKLOG_CEILING}`)
      .toBeLessThanOrEqual(BACKLOG_CEILING);
    // Tighten the ceiling when it falls, the way doctrineJargon's baseline is kept.
    if (total < BACKLOG_CEILING) {
      console.log(`  type floor: backlog is ${total}, ceiling ${BACKLOG_CEILING} — tighten BACKLOG_CEILING to ${total}`);
    }
  });
});
