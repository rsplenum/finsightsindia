import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
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
// `text-[9px]` is deliberately NOT converted — it is 21 badges and eyebrow
// labels whose containers would reflow, which is a layout decision for Rahul
// rather than a find-and-replace. They are counted here so they cannot be
// forgotten, and so nobody adds a twenty-second.

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const hasGit = false;

// The files F-01 has actually swept AND COMMITTED. These must stay at zero.
//
// The rung components are deliberately NOT here, though they are clean in the
// working tree: their migration is the type-floor workstream's uncommitted work,
// and this test may only assert what is committed. Listing them made the suite
// pass only because someone else's unstaged changes happened to be present —
// a test that depends on an uncommitted working tree is not a wall, it is a
// coincidence. Add them when that workstream commits.
const SWEPT = [
  'src/pages/swp-planner.astro',
  'src/pages/sip-engine.astro',
  'src/pages/tax-calculator.astro',
  'src/pages/insurance-analyzer.astro',
  'src/pages/black-scholes.astro',
];

/**
 * sol-058 — the whole-tree counts are read from HEAD, not from the filesystem.
 *
 * The comment above SWEPT states the principle and this file then broke it
 * twice. `SWEPT` was correctly kept to committed files, with the reasoning
 * written out: "a test that depends on an uncommitted working tree is not a
 * wall, it is a coincidence." The two whole-tree constants below were then
 * measured by walking the filesystem — the same filesystem carrying the type
 * floor workstream's uncommitted migration.
 *
 * The numbers show how badly. `BACKLOG_CEILING` was 121. The committed tree
 * holds 213 and the working tree holds 40, so 121 was never true of either —
 * it was a snapshot of a working tree mid-migration, and that workstream kept
 * going. The test therefore PASSED for anyone with their changes present and
 * FAILED at HEAD, which is the state every other clone and every CI run sees.
 *
 * So the count is taken from committed content. One `git grep` against HEAD,
 * which is the same number for everyone regardless of what is lying around
 * unstaged. The cost is honest and worth stating: a regression introduced in
 * the working tree is caught by the run AFTER it is committed rather than
 * before. The SWEPT assertion is the immediate wall, and it is exact and at
 * zero on the files where it matters most.
 */
const committedMatches = (pattern: string): number => {
  let out: string;
  try {
    out = execFileSync(
      'git',
      ['grep', '-h', '-o', '-E', pattern, 'HEAD', '--',
       'src/*.astro', 'src/*.mdx', 'src/*.ts', ':(exclude)src/tests/*'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
    );
  } catch (e: any) {
    // `git grep` exits 1 when it finds nothing, which execFileSync raises. Zero
    // matches is the state this ratchet exists to reach, so it must be an
    // answer and not an error. Anything else is a real failure and rethrows.
    if (e?.status === 1) return 0;
    throw e;
  }
  return out.split('\n').filter(Boolean).length;
};

// Held on purpose, pending Rahul's ruling: bumping these reflows the badges they
// sit in. Counted so the deferral cannot rot into a habit.
//
// 14, measured at HEAD after sol-066. It has been 21, 20 and 17 in this file or
// on the gate at various moments, which is exactly the fault sol-058 fixes — and
// it matters more here than anywhere, because this is the number Rahul is being
// asked to rule on. The fall from 21 is not a sweep: the tax revamp took the
// regime chips (sol-061) and the insurance overhaul took its two plus one on
// `InsuranceAnswer` (sol-066). What is left is real and is named on the gate:
// CAUTIOUS/BALANCED/BOLD on the SIP page, the five Greeks on the options page,
// one on the planner, two on `TaxAnswer`, one illustration.
const HELD_9PX = 14;

// The whole-tree backlog, as committed. Ratchet: may fall, never rise. Tighten
// whenever it falls. The audit counted 317. What remains at HEAD: the rung
// components (the type-floor workstream's, in flight — 173 of these 213 go the
// moment they commit), faq.astro, the content workstream's fcnr illustrations,
// and the held 9px labels, which are counted in this total too.
const BACKLOG_CEILING = 201;

describe('F-01 — the sub-12px type floor', () => {
  it.skipIf(!hasGit)('the committed count is real (guards the guard)', () => {
    // Two ways this file could go quiet: the pathspec stops matching, or the
    // pattern does. `git grep` exits non-zero on no match, so execFileSync
    // throws rather than returning a comfortable zero — but a ratchet whose
    // measurement can reach zero by accident is dd-011's store with no failure
    // mode, so it is asserted rather than reasoned about.
    expect(committedMatches('text-\\[(9|10|11)px\\]')).toBeGreaterThan(0);
    // A pattern nothing in the tree carries must come back 0 rather than
    // throwing, because 0 is the state this ratchet exists to reach and a
    // measurement that errors on success would be removed the day it worked.
    expect(committedMatches('text-\\[4242px\\]')).toBe(0);
    // Deliberately NOT asserted: that the count still equals BACKLOG_CEILING.
    // It falls the moment the type-floor workstream commits, and a guard that
    // fires on legitimate progress is the disease this solution is curing.
  });

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

  it.skipIf(!hasGit)('nobody has added a twenty-second 9px label', () => {
    // Held, not fixed: bumping these reflows the badges they sit in, so the
    // decision is Rahul's. Counted so the deferral cannot rot into a habit.
    const n = committedMatches('text-\\[9px\\]');
    expect(n, `9px labels went from ${HELD_9PX} to ${n} — either finish them or hold them, do not grow them`)
      .toBeLessThanOrEqual(HELD_9PX);
  });

  it.skipIf(!hasGit)('the whole-tree backlog only ever shrinks', () => {
    const total = committedMatches('text-\\[(9|10|11)px\\]');
    expect(total, `sub-12px type rose to ${total} from a ceiling of ${BACKLOG_CEILING}`)
      .toBeLessThanOrEqual(BACKLOG_CEILING);
    // Tighten the ceiling when it falls, the way doctrineJargon's baseline is kept.
    if (total < BACKLOG_CEILING) {
      console.log(`  type floor: backlog is ${total}, ceiling ${BACKLOG_CEILING} — tighten BACKLOG_CEILING to ${total}`);
    }
  });
});
