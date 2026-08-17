import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// F-03 — the emphasis ceiling. The third of D-2's three lint rules, and the
// last one written.
//
// The audit counted 317 uppercase letterspaced runs. On the insurance page ten
// all-caps strings were visible in a single viewport. All-caps is measurably
// slower to read because it destroys word shape, which is what a fluent reader
// actually recognises — so it is a device for ONE thing on a screen: the label
// that must be found before anything else. Used everywhere it emphasises
// nothing and merely raises the volume of the page. That is dd-007 inverted.
//
// The rule this encodes, in the order the rules actually bite:
//
//   1. A full sentence is NEVER all-caps. This is the objective one and it
//      caught the worst offenders — "A LOSS COSTS MORE THAN THE SAME-SIZED GAIN
//      GIVES BACK" and "TO MAKE THIS SAFER, CHANGE ONE OF THESE" were both
//      shouting a whole clause.
//   2. Within a rung, only the card's own eyebrow ("Next question" / "Last
//      question") keeps its caps. Every other element wearing the same eyebrow
//      style is a sub-heading inside the SAME card and loses it.
//   3. Headings, table headers, field labels and frame captions are sentence
//      case at a real size. A table header set in caps competes with the
//      figures underneath it, and the figures are what the reader came for.
//
// Scope is what has been swept: the rung components, SectionTitle, and the two
// engine pages. tax-calculator, insurance-analyzer and black-scholes are
// scheduled for their own rewrites, so they are ratcheted by count rather than
// held at zero — see the launch gate.

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const rungs = fs
  .readdirSync(path.join(ROOT, 'src/components/Calculators'))
  .filter((f) => f.endsWith('.astro'))
  .map((f) => `src/components/Calculators/${f}`);

const SWEPT = [...rungs, 'src/pages/swp-planner.astro', 'src/pages/sip-engine.astro'];

// Ratchet for the pages awaiting their own rewrite. May fall, never rise.
const NOT_YET_SWEPT: Record<string, number> = {
  'src/pages/tax-calculator.astro': 23,
  'src/pages/insurance-analyzer.astro': 24,
  'src/pages/black-scholes.astro': 12,
  'src/pages/faq.astro': 19,
  'src/pages/index.astro': 10,
};

const countUppercase = (src: string) => (stripComments(src).match(/\buppercase\b/g) ?? []).length;

// Comments describing the rule necessarily contain the words the rule forbids.
// typeFloor.test.ts hit the same trap and counted itself.
const stripComments = (src: string) =>
  src.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// An Astro/JS expression is not prose — `{p.label.replace('The last ', '')}`
// renders as "10 years", not as four words of shouting.
const isExpression = (t: string) => /[{}]/.test(t);

describe('F-03 — the emphasis ceiling', () => {
  it('a rung keeps its caps for the card eyebrow and nothing else', () => {
    const bad: string[] = [];
    for (const f of rungs) {
      const src = read(f);
      // every element that still renders uppercase
      const lines = stripComments(src).split('\n');
      lines.forEach((line, i) => {
        if (!/\buppercase\b/.test(line)) return;
        if (/badge-/.test(line)) return; // a verdict badge is the sanctioned one-per-card
        // the eyebrow style, whose text sits on the next non-empty line
        let text = '';
        for (let j = i + 1; j < lines.length && j < i + 4; j++) {
          const t = lines[j].replace(/<[^>]*>/g, '').trim();
          if (t) { text = t; break; }
        }
        if (/^(Next|Last) question$/.test(text)) return;
        bad.push(`${f}:${i + 1}  «${text.slice(0, 44)}»`);
      });
    }
    expect(bad, `uppercase beyond the card eyebrow:\n${bad.join('\n')}`).toEqual([]);
  });

  it('never sets a full sentence in capitals', () => {
    // Four or more words in a row, rendered uppercase, is a sentence shouting.
    const bad: string[] = [];
    for (const f of SWEPT) {
      if (!fs.existsSync(path.join(ROOT, f))) continue;
      const lines = stripComments(read(f)).split('\n');
      lines.forEach((line, i) => {
        if (!/\buppercase\b/.test(line)) return;
        if (/badge-/.test(line)) return;
        const inline = line.match(/>([^<>]{4,})</);
        let text = inline ? inline[1] : '';
        if (!text) {
          for (let j = i + 1; j < lines.length && j < i + 3; j++) {
            const t = lines[j].replace(/<[^>]*>/g, '').trim();
            if (t) { text = t; break; }
          }
        }
        if (isExpression(text)) return;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        if (words >= 4) bad.push(`${f}:${i + 1}  ${words} words «${text.trim().slice(0, 50)}»`);
      });
    }
    expect(bad, `a full sentence set in capitals:\n${bad.join('\n')}`).toEqual([]);
  });

  it('SectionTitle is sentence case — it carries clauses, not labels', () => {
    // It once set "Tax, and how long it must last" in seven words of all-caps.
    const src = stripComments(read('src/components/SectionTitle.astro'));
    expect(src).not.toMatch(/\buppercase\b/);
  });

  it('no SectionTitle is given an all-caps title', () => {
    const bad: string[] = [];
    for (const f of [...SWEPT, ...Object.keys(NOT_YET_SWEPT)]) {
      if (!fs.existsSync(path.join(ROOT, f))) continue;
      for (const m of read(f).matchAll(/SectionTitle\s+title="([^"]+)"/g)) {
        const letters = m[1].replace(/[^A-Za-z]/g, '');
        if (letters.length >= 6 && letters === letters.toUpperCase()) bad.push(`${f}  «${m[1]}»`);
      }
    }
    expect(bad, `SectionTitle given a shouted title:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the unswept pages only ever get quieter', () => {
    const risen: string[] = [];
    for (const [f, ceiling] of Object.entries(NOT_YET_SWEPT)) {
      if (!fs.existsSync(path.join(ROOT, f))) continue;
      const n = countUppercase(read(f));
      if (n > ceiling) risen.push(`${f}: ${n} > ceiling ${ceiling}`);
    }
    expect(risen, `emphasis rose on a page awaiting its rewrite:\n${risen.join('\n')}`).toEqual([]);
  });
});
