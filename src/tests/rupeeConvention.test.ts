import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { formatShortRupee } from '../utils/formatters';

// D-3 — how this product writes a rupee. Answered by Rahul on 16 August 2026:
//
//   "the word, not the abbreviation. No space after the symbol. One decimal
//    above a lakh — ₹1.28 crore, ₹89.1 lakh, ₹59,190."
//
// It was recorded on the launch gate and then not implemented for two days,
// which is dd-011's failure exactly: a decision with no detector drifts, and
// nothing on the tree could tell anyone it had. The insurance overhaul found it
// by printing "₹ 55.86 Lakh" on a brand new screen.
//
// "Cr" is the specific thing the ruling names. It is a trading-desk
// abbreviation, and the whole rebuild is walking away from the terminal
// aesthetic it belongs to.

const ROOT = path.resolve(__dirname, '../..');

describe('D-3 — the rupee convention', () => {
  it('reproduces the three figures the ruling wrote down', () => {
    expect(formatShortRupee(12800000)).toBe('₹1.28 crore');
    expect(formatShortRupee(8910000)).toBe('₹89.1 lakh');
    expect(formatShortRupee(59190)).toBe('₹59,190');
  });

  it('writes the word and never the abbreviation', () => {
    for (const v of [10000000, 25000000, 999999999]) {
      expect(formatShortRupee(v)).toContain('crore');
      expect(formatShortRupee(v)).not.toMatch(/\bCr\b/);
    }
    for (const v of [100000, 550000, 9999999]) {
      expect(formatShortRupee(v)).toContain('lakh');
      // Lower case: a unit is a word, not a label, and capitalising it makes it
      // shout inside a sentence.
      expect(formatShortRupee(v)).not.toContain('Lakh');
    }
  });

  it('leaves no space after the symbol', () => {
    for (const v of [0, 999, 59190, 550000, 12800000]) {
      expect(formatShortRupee(v)).not.toContain('₹ ');
    }
  });

  it('puts the sign outside the symbol', () => {
    // "-₹11.1 lakh", never "₹-11.1 lakh". A minus between the symbol and the
    // digits reads as part of the number rather than as its direction.
    expect(formatShortRupee(-1108000)).toBe('-₹11.1 lakh');
    expect(formatShortRupee(-59190)).toBe('-₹59,190');
    expect(formatShortRupee(-12800000)).toBe('-₹1.28 crore');
  });

  it('never leaks paise', () => {
    // sol-041's neighbour: the first computed rather than typed figure to reach
    // this function printed "₹ 59,189.846".
    expect(formatShortRupee(59189.846)).toBe('₹59,190');
    expect(formatShortRupee(0.4)).toBe('₹0');
  });

  it('a swept page never builds its own crore or lakh string', () => {
    // dd-013: one quantity, one rendering. A page that grows its own formatter
    // again is a page that can disagree with the one beside it about the same
    // number — which is not hypothetical. The SIP engine's chart tooltip held a
    // verbatim copy of `formatShortRupee`, so the moment the shared one was
    // brought in line with D-3 the tooltip and the cards on that same page
    // printed the same figure two different ways.
    //
    // SWEPT, not whole-tree, on the pattern `typeFloor` and `paletteContrast`
    // already set here: a test that is red on work nobody has started is a test
    // that gets disabled. What remains is on the launch gate and is listed
    // below so it cannot be forgotten.
    //
    // sip-engine is deliberately NOT here yet: its chart's Y-AXIS ticks still
    // read "₹1.2Cr" and "₹5L", and an axis tick has a width constraint a card
    // does not. Spelling the word out there is a layout decision at 375px, and
    // this session did not rewrite that page. Its tooltip WAS fixed, because
    // that was a live disagreement rather than a layout question. The backlog
    // ratchet below is what stops the rest from growing.
    const SWEPT = ['src/pages/insurance-analyzer.astro'];
    const ownFormatter = /`₹\s*\$\{[^}]*\}\s*(Cr|Lakh|crore|lakh)/;

    const offenders = SWEPT.filter((f) =>
      ownFormatter.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))
    );
    expect(offenders, `swept pages formatting rupees for themselves:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('the unswept backlog only ever shrinks', () => {
    // Two left, both recorded on the gate with what is wrong with each:
    //
    //   sip-engine.astro   — the chart's Y-AXIS ticks still read "₹1.2Cr" and
    //                        "₹5L". An axis tick has a real constraint a card
    //                        does not, so shortening the word is a layout
    //                        decision at 375px rather than a find-and-replace.
    //   tax-calculator.astro — `inWords()` follows D-3's word convention but
    //                        gives two decimals at lakh where the ruling's own
    //                        example gives one (₹89.1 lakh).
    //
    // Neither is a wrong number. Both are a second definition of one rendering.
    const BACKLOG_CEILING = 2;
    const pages = fs
      .readdirSync(path.join(ROOT, 'src/pages'))
      .filter((f) => f.endsWith('.astro'))
      .map((f) => `src/pages/${f}`);

    const own = /`₹\s*\$\{[^}]*\}\s*(Cr|L|Lakh|crore|lakh)/;
    const offenders = pages.filter((f) =>
      own.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))
    );
    expect(
      offenders.length,
      `pages with their own rupee rendering rose to ${offenders.length}:\n${offenders.join('\n')}`
    ).toBeLessThanOrEqual(BACKLOG_CEILING);
  });
});
