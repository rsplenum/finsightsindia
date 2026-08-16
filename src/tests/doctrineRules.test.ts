import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadDoctrine,
  applicableToCalculators,
  rulesOf,
  render,
} from '../../scripts/doctrine-rules.js';

// Enforcement for dd-016: a recorded lesson is not followable until it has been
// reduced to do's and don'ts.
//
// The evidence that this gap is real is dd-012. dd-009 and dd-010 were recorded
// the same day, cited BY ID in the rung's own checks file, and violated in that
// same rung. The citation was honest. It simply was not an instruction - the
// builder had to re-derive "don't headline a difference of two averages" from a
// paragraph, and under pressure did not.
//
// dd-011 says a rule broken twice needs a mechanism, not a firmer intention.
// Four mechanisms, in order of what they catch:
//
//   1. an entry recorded without its do's/don'ts turns the suite red
//   2. the flat page is a projection and cannot drift from the JSON (dd-013)
//   3. a checks file must ANSWER each applicable don't by id, not name its entry
//   4. the count of files still in the old free-text format may only fall

const DIR = 'src/components/Calculators';
const OUT = 'docs/doctrine-rules.md';
const STRICT_HEADING = '## Doctrine rules — answered';

// Checks files written before dd-016. They cite entries but do not answer rules.
// A debt list, not an exemption: the count is ratcheted and may only shrink.
// 12 on 16 Aug, when dd-016 landed. Retrofit one whenever you touch its
// component - RungSipFlow was the first, on the day the fee row went in.
const LEGACY_LIMIT = 9;

const doctrine = loadDoctrine();

describe('dd-016 - every entry is extracted into do\'s and don\'ts', () => {
  it('no entry is recorded without them', () => {
    const missing = doctrine
      .filter((e: any) => !e.do?.length || !e.dont?.length)
      .map((e: any) => e.id);
    expect(
      missing,
      'Entries with no extracted rules. Recording is half the job: add `do` and ' +
        '`dont` arrays to these entries in src/data/design-doctrine.json. dd-016.'
    ).toEqual([]);
  });

  it('every rule is one checkable line, not a paragraph', () => {
    const tooLong: string[] = [];
    for (const e of doctrine) {
      for (const r of rulesOf(e)) {
        if (r.text.length > 140) tooLong.push(`${r.id} (${r.text.length} chars)`);
      }
    }
    expect(
      tooLong,
      'A rule that needs its own paragraph has not been extracted yet. dd-016.'
    ).toEqual([]);
  });

  it('every don\'t is phrased as a prohibition', () => {
    const wrong: string[] = [];
    for (const e of doctrine) {
      for (const r of rulesOf(e).filter((r: any) => r.kind === 'dont')) {
        if (!/^Don't\b/.test(r.text)) wrong.push(r.id);
      }
    }
    expect(wrong, 'A don\'t must read as one. Start it with "Don\'t".').toEqual([]);
  });

  it('rule ids are unique across the doctrine', () => {
    const ids = doctrine.flatMap((e: any) => rulesOf(e).map((r: any) => r.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('dd-016 / dd-013 - the flat page is a projection, never a copy', () => {
  it('docs/doctrine-rules.md is byte-identical to a regeneration', () => {
    const have = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf-8') : '(missing)';
    expect(
      have === render(doctrine),
      `${OUT} is stale or hand-edited. Run: npm run doctrine. It is generated ` +
        `from src/data/design-doctrine.json; editing it directly creates a second ` +
        `source of truth, which is dd-013.`
    ).toBe(true);
  });
});

describe('dd-016 - a checks file answers don\'ts, it does not merely cite entries', () => {
  const components = fs.existsSync(DIR)
    ? fs.readdirSync(DIR).filter((f) => f.endsWith('.checks.md'))
    : [];
  const required = applicableToCalculators(doctrine)
    .flatMap((e: any) => rulesOf(e))
    .filter((r: any) => r.kind === 'dont')
    .map((r: any) => r.id);

  const strict = components.filter((f) =>
    fs.readFileSync(path.join(DIR, f), 'utf-8').includes(STRICT_HEADING)
  );

  it('there is something to check', () => {
    expect(components.length).toBeGreaterThan(0);
    expect(required.length).toBeGreaterThan(0);
  });

  it('the pre-dd-016 debt does not grow', () => {
    const legacy = components.length - strict.length;
    expect(
      legacy,
      `${legacy} checks files predate dd-016 and answer no rules by id. That number ` +
        `may fall, never rise. A new component gets its skeleton from ` +
        `\`npm run doctrine:checks <Component>\`.`
    ).toBeLessThanOrEqual(LEGACY_LIMIT);
  });

  for (const f of strict) {
    const body = fs.readFileSync(path.join(DIR, f), 'utf-8');
    const rows = [...body.matchAll(/^\|\s*(dd-\d{3}\/dont-\d+)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/gm)];
    const byId = new Map(rows.map((m) => [m[1], { verdict: m[2], why: m[3] }]));

    it(`${f} answers every applicable don't`, () => {
      const unanswered = required.filter((id: string) => !byId.has(id));
      expect(
        unanswered,
        `${f} does not answer these rules. This is the dd-012 failure exactly: ` +
          `naming an entry is not the same as being handed its instruction.`
      ).toEqual([]);
    });

    it(`${f} carries a real verdict for each`, () => {
      const bad: string[] = [];
      for (const [id, { verdict, why }] of byId) {
        if (!['PASS', 'N/A', 'RISK'].includes(verdict)) {
          bad.push(`${id}: verdict "${verdict}" - use PASS, N/A or RISK`);
        } else if (verdict !== 'N/A' && why.trim().length < 25) {
          // N/A may stand alone; a claim of compliance may not. Rubber-stamping
          // a PASS has to cost the same as thinking about it, or it will happen.
          bad.push(`${id}: ${verdict} with no reason given`);
        }
      }
      expect(bad, `${f} has unfinished answers`).toEqual([]);
    });

    it(`${f} has no TODO left in it`, () => {
      expect(body.includes('TODO'), `${f} still contains a TODO from the skeleton`).toBe(false);
    });
  }
});
