import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// F-02 / D-2. The wall behind the browser measurement.
//
// The ground truth for contrast is a canvas-resolved colour composited up the
// real ancestor chain in a real browser, and it cannot run here. What CAN run
// here is the rule that measurement produced, and this file is that rule.
//
// It exists because the gold sweep of 16 Aug codemodded 76 `text-gold-600`
// usages across 24 files and still missed `.badge-gold`, which carried the same
// failing colour as a raw hex in CSS rather than as a class. A codemod only
// sees what it greps for; a test sees the whole tree every run.
//
// Three things are asserted:
//   1. the text-on-light tokens actually clear 4.5:1 on every ground in use,
//      so nobody can "fix" a token by lightening it back;
//   2. no chassis file uses a SIGNAL colour as text on a light ground, whether
//      by class, by raw hex, or by an alpha modifier that spends the headroom;
//   3. light/dark colour pairs are not inverted — the lighter tone belongs on
//      the dark ground, and 38 places had it backwards.
//
// Scope is what has actually been MEASURED in the browser and swept: the five
// calculator pages, the homepage, the four trust pages, the shared input and the
// shared layout. It is deliberately NOT the whole tree.
//
// The meta pages (solutions, standards, research-ledger, creator-log, reels,
// shelved-ideas, tax-code, example-svg) are still on the stock slate palette and
// have never been measured; src/content/**, components/illustrations/**,
// components/mdx/** and components/article/** are the content workstream's.
// Asserting over them would fail on work this sweep did not do, which is how a
// ratchet gets disabled. They are listed in the launch gate instead; widen SCOPE
// here as each is measured, and the test then holds it.

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ---------------------------------------------------------------- contrast maths
const hexToRgb = (h: string) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const luminance = (h: string) => {
  const [r, g, b] = hexToRgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const css = read('src/styles/global.css');
const tokens: Record<string, string> = {};
for (const m of css.matchAll(/--color-([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) tokens[m[1]] = m[2];

// The grounds these colours actually sit on, measured off the live pages with the
// canvas probe rather than assumed: white, the page ground, and the tinted badges.
const LIGHT_GROUNDS: Record<string, string> = {
  white: '#FFFFFF',
  'navy-50': '#F8FAFC',
  'amber tint': '#FEF5E6',
  'emerald tint': '#E7F8F2',
  'gold tint': '#FBF7EB',
};
const DARK_GROUNDS: Record<string, string> = {
  'navy-900': '#0F172A',
  'navy-950': '#0A192F',
};

// ---------------------------------------------------------------- the swept surface
// Every file here was measured at 0 failing nodes in BOTH themes with the canvas
// probe on 16 Aug. The two Calculators/ widgets that appear only inside articles
// (FOAuditTrigger, MSMEDInterestCalculator) are excluded: they are in this
// directory but were never on a measured page and are still on stock slate.
const MEASURED_PAGES = [
  'swp-planner', 'sip-engine', 'tax-calculator', 'insurance-analyzer',
  'black-scholes', 'index', 'faq', 'about', 'privacy', 'terms', 'contact',
].map((p) => `src/pages/${p}.astro`);

const NOT_YET_MEASURED = new Set([
  'src/components/Calculators/FOAuditTrigger.astro',
  'src/components/Calculators/MSMEDInterestCalculator.astro',
]);

const rungs = fs
  .readdirSync(path.join(ROOT, 'src/components/Calculators'))
  .filter((f) => f.endsWith('.astro'))
  .map((f) => `src/components/Calculators/${f}`)
  .filter((f) => !NOT_YET_MEASURED.has(f));

const chassis = [
  ...rungs,
  ...MEASURED_PAGES,
  'src/components/InputGroup.astro',
  'src/layouts/Layout.astro',
].filter((f) => fs.existsSync(path.join(ROOT, f)));

// A signal colour IS correct on a permanently dark ground, and a static rule
// cannot see the ground — only the browser probe can. Each exception therefore
// carries the measured ratio that justifies it, not just a path.
const DARK_GROUND_EXCEPTIONS: Record<string, string> = {
  'src/layouts/Layout.astro:text-gold-500':
    'the footer wordmark. The footer is bg-navy-900 in LIGHT theme and navy-950 in dark, ' +
    'so it is a dark ground in both: gold-500 measures 8.49:1 there, while gold-700 — the ' +
    'text-on-light gold — measured 3.40:1 and failed. The pair was inverted, not exempt.',
};

describe('F-02 — the palette clears AA on the grounds it actually sits on', () => {
  it('finds the chassis', () => {
    expect(chassis.length).toBeGreaterThan(20);
  });

  // 1. The text-on-light tokens must stay dark enough. Lightening one back
  //    towards its brand tone is exactly how gold-600 survived for so long.
  const TEXT_ON_LIGHT = ['gold-700', 'emerald-700', 'amber-700', 'rose-700'];
  for (const t of TEXT_ON_LIGHT) {
    it(`${t} clears 4.5:1 on every light ground in use`, () => {
      expect(tokens[t], `--color-${t} is missing from global.css`).toBeDefined();
      for (const [name, ground] of Object.entries(LIGHT_GROUNDS)) {
        const r = contrast(tokens[t], ground);
        expect(r, `${t} (${tokens[t]}) on ${name} (${ground}) = ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  // 2. The -500/-400 signal colours must NOT clear it — if one ever does, it has
  //    drifted away from being a signal and the split above has quietly collapsed.
  it('the signal colours are still signals, not text', () => {
    for (const t of ['emerald-500', 'rose-500', 'gold-500', 'gold-600']) {
      expect(contrast(tokens[t], '#FFFFFF')).toBeLessThan(4.5);
    }
  });

  // 3. The dark-theme tones must clear AA on the dark grounds.
  it('the -400 tones clear 4.5:1 on the dark grounds', () => {
    for (const t of ['navy-400', 'gold-400', 'emerald-400', 'amber-400', 'rose-400']) {
      for (const [name, ground] of Object.entries(DARK_GROUNDS)) {
        const r = contrast(tokens[t], ground);
        expect(r, `${t} (${tokens[t]}) on ${name} = ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('F-02 — no chassis file reaches past the tokens', () => {
  // Tailwind stock -600s have no token behind them and are NOT our palette:
  // stock emerald-600 is #009966, amber-600 #E17100, rose-600 #EC003F — a
  // different hue from our own rose-500 #EF4444. Each measured below 4.5:1.
  const BANNED_AS_LIGHT_TEXT = [
    'text-gold-600', 'text-gold-500',
    'text-emerald-600', 'text-emerald-500',
    'text-amber-600',
    'text-rose-600', 'text-rose-500',
    'text-slate-400', 'text-slate-500',
  ];

  it('uses no signal or stock colour as text on a light ground', () => {
    const hits: string[] = [];
    for (const f of chassis) {
      read(f).split('\n').forEach((line, i) => {
        for (const b of BANNED_AS_LIGHT_TEXT) {
          // `dark:text-x` and `hover:`/`group-*:` variants are fine — those are
          // either the dark ground or a transient state, not resting light text.
          const re = new RegExp(`(?<![\\w:-])${b}(?![\\w-])`, 'g');
          if (!re.test(line)) continue;
          if (DARK_GROUND_EXCEPTIONS[`${f}:${b}`]) continue;
          hits.push(`${f}:${i + 1}  ${b}`);
        }
      });
    }
    expect(hits, `signal/stock colour used as light text:\n${hits.join('\n')}`).toEqual([]);
  });

  it('every dark-ground exception still states its measured ratio', () => {
    // An exception without a reason is how a rule quietly becomes a suggestion.
    for (const [key, why] of Object.entries(DARK_GROUND_EXCEPTIONS)) {
      const [file] = key.split(':');
      expect(fs.existsSync(path.join(ROOT, file)), `${key} names a file that is gone`).toBe(true);
      expect(why, `${key} must state the measured ratio`).toMatch(/\d\.\d\d:1/);
    }
  });

  it('sets no badge colour as a raw hex — this is how .badge-gold survived the codemod', () => {
    const start = css.indexOf('STATUS BADGES');
    expect(start, 'the STATUS BADGES block has been renamed or removed').toBeGreaterThan(-1);
    // Bound the slice to the badge block, not the rest of the stylesheet.
    const rest = css.slice(start);
    const end = rest.indexOf('====', rest.indexOf('.badge-gold'));
    const badges = end > -1 ? rest.slice(0, end) : rest;
    const raw = [...badges.matchAll(/^\s*color:\s*(#[0-9A-Fa-f]{6})/gm)].map((m) => m[1]);
    expect(raw, `badge colours must reference a token, not a literal: ${raw.join(', ')}`).toEqual([]);
  });

  it('puts no alpha modifier on a light-ground text colour', () => {
    // text-amber-700/70 measured 2.89:1 — the modifier spends exactly the
    // headroom the token was darkened to provide. Restricted to light-ground
    // text: the dark-theme tones sit on a different ground and are governed by
    // the browser probe, not by this rule.
    const hits: string[] = [];
    for (const f of chassis) {
      read(f).split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/(?<![\w:-])text-(?:navy|gold|emerald|amber|rose)-\d00\/\d+/g)) {
          hits.push(`${f}:${i + 1}  ${m[0]}`);
        }
      });
    }
    expect(hits, `alpha modifier on light-ground text colour:\n${hits.join('\n')}`).toEqual([]);
  });
});

describe('F-02 — light/dark pairs are not inverted', () => {
  // The lighter tone belongs on the DARK ground. `text-navy-400 dark:text-navy-500`
  // is backwards and fails in both themes at once: 2.56:1 light, 3.70:1 dark.
  // 38 places in the tree had it that way against 266 correct ones.
  const INVERTED = [
    'text-navy-400 dark:text-navy-500',
    'text-navy-400 dark:text-navy-600',
    'text-navy-500 dark:text-navy-500',
    'text-navy-300 dark:text-navy-400',
  ];

  it('never puts the lighter navy on the light ground', () => {
    const hits: string[] = [];
    for (const f of chassis) {
      read(f).split('\n').forEach((line, i) => {
        for (const p of INVERTED) if (line.includes(p)) hits.push(`${f}:${i + 1}  ${p}`);
      });
    }
    expect(hits, `inverted light/dark pair:\n${hits.join('\n')}`).toEqual([]);
  });

  it('never writes a dark: variant without the text- prefix', () => {
    // `dark:amber-400` was a live typo on the planner: it silently did nothing,
    // leaving the light-ground amber in place on the dark ground.
    const hits: string[] = [];
    for (const f of chassis) {
      read(f).split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/(?<![\w-])dark:(?:navy|gold|emerald|amber|rose|slate)-\d00(?![\w-])/g)) {
          hits.push(`${f}:${i + 1}  ${m[0]} — missing "text-"`);
        }
      });
    }
    expect(hits, `malformed dark: variant:\n${hits.join('\n')}`).toEqual([]);
  });
});
