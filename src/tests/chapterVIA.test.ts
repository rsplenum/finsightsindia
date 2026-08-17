import { describe, it, expect } from 'vitest';
import {
  CHAPTER_VIA_RULES,
  calculateIndiaTaxEngine,
  EMPTY_TAX_INPUT,
  type ChapterVIASection,
  type TaxInput,
} from '../utils/tax';

/**
 * sol-056 - Chapter VI-A becomes a table, and the table has to be interrogable.
 *
 * The engine used to carry three sections as three named fields with three
 * ceilings written inline as `Math.min`. Rahul's tax sketch asks the deductions
 * dropdown to be EXHAUSTIVE within what the reader is eligible for (dd-001/do-3),
 * and thirteen ceilings written inline is sol-038's shape - one rule, many
 * places - with a decade of Budgets ahead of it.
 *
 * What these tests hold is not the rupee arithmetic, which the older suite
 * already pins. It is the three properties that make the table safe to grow:
 *
 *   1. A ceiling is applied, and it is the STATUTORY one, not a guess.
 *   2. A claim that is cut is REPORTED, never swallowed. sol-041's whole lesson
 *      is that a number the reader typed which quietly stops mattering is a
 *      defect even when the rupees are right.
 *   3. Nothing is priced that s.115BAC has withdrawn, and the one survivor
 *      survives.
 */

const salary = (grossSalary: number, over: Partial<TaxInput> = {}): TaxInput => ({
  ...EMPTY_TAX_INPUT,
  grossSalary,
  ...over,
});

const oldLines = (input: TaxInput) =>
  calculateIndiaTaxEngine(input).oldRegime.chapterVIADetail.lines;

const lineFor = (input: TaxInput, section: ChapterVIASection) =>
  oldLines(input).find((l) => l.section === section);

describe('sol-056 - the Chapter VI-A rules table', () => {
  it('every section carries a regime list, and only one survives the new regime', () => {
    const sections = Object.keys(CHAPTER_VIA_RULES) as ChapterVIASection[];
    expect(sections.length).toBeGreaterThan(10);

    for (const s of sections) {
      expect(CHAPTER_VIA_RULES[s].regimes.length, `${s} allows no regime at all`)
        .toBeGreaterThan(0);
    }

    const survivors = sections.filter((s) => CHAPTER_VIA_RULES[s].regimes.includes('new'));
    // s.115BAC withdraws the whole chapter bar the employer's NPS contribution.
    // If this ever grows, it grew because a Budget said so - not by accident.
    expect(survivors).toEqual(['80CCD2']);
  });

  it('a section with a fixed ceiling states it, and a section with none says null', () => {
    expect(CHAPTER_VIA_RULES['80C'].cap).toBe(150000);
    expect(CHAPTER_VIA_RULES['80CCD1B'].cap).toBe(50000);
    expect(CHAPTER_VIA_RULES['80D'].cap).toBe(100000);
    expect(CHAPTER_VIA_RULES['80GG'].cap).toBe(60000);
    // 80E sets no ceiling on education loan interest and 80G's qualifying
    // amount depends on the donee. Inventing a cap here would understate a real
    // deduction, which is the same class of harm as inventing one.
    expect(CHAPTER_VIA_RULES['80E'].cap).toBeNull();
    expect(CHAPTER_VIA_RULES['80G'].cap).toBeNull();
  });
});

describe('sol-056 - a claim that is cut is reported, never swallowed', () => {
  it('80C above the ceiling is capped, and the line says what happened', () => {
    const line = lineFor(salary(2000000, { chapterVIA: { '80C': 400000 } }), '80C');
    expect(line).toBeDefined();
    expect(line!.claimed).toBe(400000);
    expect(line!.allowed).toBe(150000);
    expect(line!.cap).toBe(150000);
    expect(line!.reason).not.toBe('');
  });

  it('a claim within the ceiling stands whole and carries no reason', () => {
    const line = lineFor(salary(2000000, { chapterVIA: { '80C': 90000 } }), '80C');
    expect(line!.allowed).toBe(90000);
    expect(line!.reason).toBe('');
  });

  it('a section the reader never opened is not a line at all', () => {
    const lines = oldLines(salary(2000000, { chapterVIA: { '80C': 90000 } }));
    expect(lines.map((l) => l.section)).toEqual(['80C']);
  });

  it('a section opened and left at zero IS a line - claimed, and worth nothing', () => {
    // Same rupees as never claiming it, a different sentence on the panel. The
    // reader who added 80G and typed nothing should see it standing at nil
    // rather than see it vanish.
    const lines = oldLines(salary(2000000, { chapterVIA: { '80G': 0 } }));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ section: '80G', claimed: 0, allowed: 0 });
  });
});

describe('sol-056 - ceilings that move with the filer', () => {
  it('80DDB is 40,000 below 60 and 1,00,000 from 60', () => {
    const claim = { chapterVIA: { '80DDB': 150000 } };
    expect(lineFor(salary(2000000, claim), '80DDB')!.allowed).toBe(40000);
    expect(
      lineFor(salary(2000000, { ...claim, ageBracket: '60_80' }), '80DDB')!.allowed
    ).toBe(100000);
  });

  it('80TTA and 80TTB are the same relief at two ages, and never both', () => {
    // The statute gives a filer exactly one of these. Barring rather than
    // capping, because a 65-year-old claiming 80TTA has not claimed too much -
    // they have claimed under the wrong section, and the screen must say which.
    const under60 = salary(800000, { chapterVIA: { '80TTA': 10000, '80TTB': 50000 } });
    expect(lineFor(under60, '80TTA')!.allowed).toBe(10000);
    expect(lineFor(under60, '80TTB')!.allowed).toBe(0);
    expect(lineFor(under60, '80TTB')!.reason).toContain('80TTB');

    const senior = { ...under60, ageBracket: '60_80' as const };
    expect(lineFor(senior, '80TTA')!.allowed).toBe(0);
    expect(lineFor(senior, '80TTB')!.allowed).toBe(50000);
  });

  it("80CCD(2) is a share of salary, and the share differs by regime", () => {
    const input = salary(1000000, {
      basicSalary: 500000,
      chapterVIA: { '80CCD2': 200000 },
    });
    const r = calculateIndiaTaxEngine(input);
    const line = (regime: 'newRegime' | 'oldRegime') =>
      r[regime].chapterVIADetail.lines.find((l) => l.section === '80CCD2')!;

    expect(line('newRegime').allowed).toBe(70000); // 14% of 5,00,000
    expect(line('oldRegime').allowed).toBe(50000); // 10% of 5,00,000
  });
});

describe('sol-056 - s.115BAC, and s.80A(2)', () => {
  it('the new regime allows nothing but 80CCD(2), and says why', () => {
    const r = calculateIndiaTaxEngine(
      salary(2000000, { chapterVIA: { '80C': 150000, '80D': 25000 } })
    );
    expect(r.newRegime.deductions).toBe(0);
    for (const line of r.newRegime.chapterVIADetail.lines) {
      expect(line.allowed).toBe(0);
      expect(line.reason).toContain('115BAC');
    }
    // ...and the old regime still allows them, so this is a regime difference
    // rather than the map failing to arrive.
    expect(r.oldRegime.deductions).toBe(175000);
  });

  it('Chapter VI-A can reduce income to nil but never below it', () => {
    // s.80A(2). Reported as its own quantity rather than spread back across the
    // lines: "your 80C was cut" is a different sentence from "you did not earn
    // enough for all of this to be worth claiming".
    const d = calculateIndiaTaxEngine(
      salary(200000, { chapterVIA: { '80C': 150000, '80D': 100000 } })
    ).oldRegime.chapterVIADetail;

    expect(d.beforeGtiClamp).toBe(250000);
    expect(d.total).toBe(150000); // gross salary less the 50,000 standard deduction
    expect(d.clampedByGti).toBe(100000);
  });

  it('the deduction total and the lines agree, always', () => {
    // The panel prints the lines and the total separately. If they can ever
    // disagree, the screen stops adding up and dd-009/do-1 is broken - the
    // reader could not derive the figure from what is in front of them.
    for (const gross of [300000, 800000, 1500000, 4000000]) {
      for (const age of ['below60', '60_80'] as const) {
        const d = calculateIndiaTaxEngine(
          salary(gross, {
            ageBracket: age,
            basicSalary: gross / 2,
            chapterVIA: { '80C': 200000, '80D': 60000, '80TTA': 15000, '80E': 90000 },
          })
        ).oldRegime.chapterVIADetail;

        const summed = d.lines.reduce((s, l) => s + l.allowed, 0);
        expect(summed).toBe(d.beforeGtiClamp);
        expect(d.total).toBe(d.beforeGtiClamp - d.clampedByGti);
        expect(d.total).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('sol-056 - professional tax is s.16(iii), not Chapter VI-A', () => {
  it('it comes off salary itself, and only under the old regime', () => {
    const r = calculateIndiaTaxEngine(salary(1000000, { professionalTax: 2500 }));

    expect(r.oldRegime.professionalTax).toBe(2500);
    expect(r.newRegime.professionalTax).toBe(0);

    // It is not a Chapter VI-A line, so it must not appear as one.
    expect(r.oldRegime.chapterVIADetail.lines).toHaveLength(0);

    // And it must actually reduce the bill, by 2,500 of slab income.
    const without = calculateIndiaTaxEngine(salary(1000000));
    expect(without.oldRegime.taxableIncome - r.oldRegime.taxableIncome).toBe(2500);
  });
});
