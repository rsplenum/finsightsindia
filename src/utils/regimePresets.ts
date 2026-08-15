import nifty from '../data/nifty50-annual-returns.json';

/**
 * Named market regimes, derived from the record rather than chosen.
 *
 * sol-028: the planner shipped with 12% growth and 15% roughness, and its
 * tooltip asserted "NIFTY 50 is ~15%" as a plain fact. On Rahul's own monthly
 * series that figure describes the calmest stretch in thirty-five years - the
 * last decade contains no down year at all - while every complete 30-year
 * window in the record sits between 28.4% and 31.2%.
 *
 * Rahul's decision, 15 Aug: named presets, "which makes the assumption a
 * deliberate choice rather than a default someone inherits."
 *
 * Two things make these honest:
 *
 *  - They are COMPUTED from src/data/nifty50-annual-returns.json at module
 *    load, never typed in. A preset that drifted from the data it claims to
 *    describe would be a fabricated figure wearing a factual label, which is
 *    the fault sol-023 and sol-026 were both opened for.
 *  - Each sets growth AND roughness together, because a regime is a pair. A
 *    reader who took the calm decade's roughness with the long run's growth
 *    would be assuming a world that has never existed.
 */

const ann = nifty.annualReturnsPct as Record<string, number>;
const DIVIDEND = nifty.dividendContribution.dividendPctPerYear;

function stats(from: number, to: number) {
  const v = Object.entries(ann)
    .filter(([y]) => +y >= from && +y <= to)
    .map(([, r]) => r);
  const n = v.length;
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const priceCagr = (Math.pow(v.reduce((a, b) => a * (1 + b / 100), 1), 1 / n) - 1) * 100;
  return {
    years: n,
    // The file holds PRICE returns; a real holder also received dividends, so
    // the measured dividend contribution is added back rather than assumed.
    growth: Math.round((priceCagr + DIVIDEND) * 10) / 10,
    roughness: Math.round(sd * 10) / 10,
    downYears: v.filter((x) => x < 0).length,
    yearsBelowMinus10: v.filter((x) => x < -10).length,
    worstYear: Math.round(Math.min(...v) * 10) / 10,
  };
}

export interface RegimePreset {
  id: string;
  label: string;
  span: string;
  /** Total return including dividends, % a year. */
  growth: number;
  /** Standard deviation of annual returns, %. */
  roughness: number;
  years: number;
  downYears: number;
  yearsBelowMinus10: number;
  worstYear: number;
}

const LATEST = Math.max(...Object.keys(ann).map(Number));

export const REGIME_PRESETS: RegimePreset[] = [
  { id: 'decade', label: 'The last 10 years', from: LATEST - 9 },
  { id: 'twenty', label: 'The last 20 years', from: LATEST - 19 },
  { id: 'thirty', label: 'The last 30 years', from: LATEST - 29 },
].map((p) => ({
  id: p.id,
  label: p.label,
  span: `${p.from}–${LATEST}`,
  ...stats(p.from, LATEST),
}));

/**
 * The one a 30-year retirement should open on. Matching the assumption to the
 * length of the projection is the only defensible pairing: a retirement does
 * not happen inside one regime, and every 30-year window in the record has
 * roughly this roughness.
 */
export const DEFAULT_REGIME = REGIME_PRESETS.find((p) => p.id === 'thirty')!;
