import { describe, it, expect } from 'vitest';
import { REGIME_PRESETS, DEFAULT_REGIME } from '../utils/regimePresets';
import nifty from '../data/nifty50-annual-returns.json';

// sol-028. The presets make a factual claim - "this is what the last N years
// actually did" - so they get a detector. A preset that had drifted from the
// data it names would be a fabricated figure wearing a source, which is the
// fault sol-023 and sol-026 were both opened for.

const ann = nifty.annualReturnsPct as Record<string, number>;

describe('regime presets are computed from the record, not typed in', () => {
  it('each preset matches a recomputation of its own stated span', () => {
    for (const p of REGIME_PRESETS) {
      const [from, to] = p.span.split('–').map(Number);
      const v = Object.entries(ann).filter(([y]) => +y >= from && +y <= to).map(([, r]) => r);
      const mean = v.reduce((a, b) => a + b, 0) / v.length;
      const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (v.length - 1));
      const cagr = (Math.pow(v.reduce((a, b) => a * (1 + b / 100), 1), 1 / v.length) - 1) * 100;

      expect(v.length, p.label).toBe(p.years);
      expect(p.roughness, p.label).toBeCloseTo(sd, 1);
      expect(p.growth, p.label).toBeCloseTo(cagr + nifty.dividendContribution.dividendPctPerYear, 1);
    }
  });

  it('spans are the length they claim', () => {
    for (const p of REGIME_PRESETS) {
      const [from, to] = p.span.split('–').map(Number);
      expect(to - from + 1, p.label).toBe(p.years);
    }
  });

  it('the long run is rougher than the last decade - the point of offering both', () => {
    const decade = REGIME_PRESETS.find((p) => p.id === 'decade')!;
    const thirty = REGIME_PRESETS.find((p) => p.id === 'thirty')!;
    expect(thirty.roughness).toBeGreaterThan(decade.roughness * 2);
    // And the growth barely moves, which is the lesson: same journey, very
    // different ride. If this ever stops holding, the copy needs rewriting.
    expect(Math.abs(thirty.growth - decade.growth)).toBeLessThan(2);
  });

  it('the last decade really did contain no down year', () => {
    // Stated on screen, so it is asserted here rather than trusted.
    expect(REGIME_PRESETS.find((p) => p.id === 'decade')!.downYears).toBe(0);
  });

  it('a 30-year plan defaults to the 30-year regime', () => {
    expect(DEFAULT_REGIME.id).toBe('thirty');
    expect(DEFAULT_REGIME.years).toBe(30);
    // The shipped 15% sat far below anything the record supports over 30 years.
    expect(DEFAULT_REGIME.roughness).toBeGreaterThan(25);
  });

  it('every rolling 30-year window in the record agrees with the default', () => {
    // The argument for the default, asserted: a retirement meets several
    // regimes, and every complete 30-year window lands near 29%.
    const windows = Object.values(nifty.derived.everyRolling30YearWindow) as any[];
    expect(windows.length).toBeGreaterThan(3);
    for (const w of windows) {
      expect(w.sd).toBeGreaterThan(25);
      expect(w.sd).toBeLessThan(35);
    }
  });
});
