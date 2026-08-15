import { parseFormattedNumber } from './formatters';
import { pricePut } from './putPricing';
import type { SipInputs } from './sipAdvice';

/**
 * One set of inputs, one simulation, for every surface on the SIP page.
 *
 * The planner's plannerInputs.ts, for accumulation. It exists for the same
 * reason and it is deliberately just as boring: it is a DOM reader, and its
 * only job is to be the ONLY DOM reader.
 *
 * sol-026 is the fault it prevents. On the planner the ladder read three fields
 * and hardcoded the macro assumptions while the advanced panel read the whole
 * form; the two disagreed by small amounts always and by a factor of five
 * whenever the reader touched an assumption the ladder could not see. Neither
 * knew the other existed. The fix is structural (dd-013): the advanced form is
 * the single source of truth, the three entry fields at the top are a
 * PROJECTION of it rather than a second copy, and one simulation at one size
 * with one seed feeds the Answer, every rung and the panel.
 */

/** The canonical run size and seed. Not per-surface, on purpose. */
export const SIP_SIMS = 10000;
export const SIP_SEED = 20260815;

/** The advanced form's field ids - the single source of truth. */
const F = {
  seed: 'seedCapital',
  monthly: 'monthlySip',
  target: 'targetRealWealth',
  stepUp: 'stepUpRate',
  years: 'investmentYears',
  inflation: 'inflationRate',
  ret: 'sipExpectedReturn',
  vol: 'sipVolatility',
  tax: 'sipLtcgTax',
  postTax: 'taxToggleBtn',
  eq: 'equitySlider',
  debt: 'debtSlider',
  gold: 'goldSlider',
  hedgeToggle: 'bsHedgingToggle',
  premium: 'sipHedgingDrag',
  floor: 'sipHedgingFloor',
} as const;

/** The three entry fields, which mirror three of the above and nothing more. */
const ENTRY = {
  monthly: 'sipAnsMonthly',
  years: 'sipAnsYears',
  target: 'sipAnsTarget',
} as const;

const el = (id: string) => document.getElementById(id) as HTMLInputElement | null;

const num = (id: string, fallback: number): number => {
  const v = parseFloat(el(id)?.value ?? '');
  return Number.isFinite(v) ? v : fallback;
};

const money = (id: string, fallback: number): number => {
  const v = parseFormattedNumber(el(id)?.value ?? '');
  return v > 0 ? v : fallback;
};

const checked = (id: string): boolean => el(id)?.checked ?? false;

/**
 * The post-tax view is a button rather than a checkbox, and it used to keep its
 * state in a module-scoped `let isPostTax` that no other surface could see. It
 * is on the element now, where the one reader can find it - state that lives in
 * a closure is state that a second surface will silently disagree about.
 */
const pressed = (id: string): boolean =>
  document.getElementById(id)?.getAttribute('aria-pressed') === 'true';

/** Rolls every 12 months, matching the planner. The term selector is not shipped. */
const HEDGE_TERM_MONTHS = 12;

/** Read the one true input set. Every surface calls this and nothing else. */
export function readSipInputs(): SipInputs {
  const roughness = num(F.vol, 28.4);
  const floorPct = num(F.floor, -10);

  // The allocation sliders keep themselves at 100 between them; normalising
  // here as well means a stray URL parameter cannot hand the engine a portfolio
  // that is 130% invested.
  const eq = num(F.eq, 70);
  const debt = num(F.debt, 20);
  const gold = num(F.gold, 10);
  const total = eq + debt + gold || 100;

  return {
    seedCapital: parseFormattedNumber(el(F.seed)?.value ?? '') || 0,
    monthlySip: money(F.monthly, 0),
    targetRealWealth: money(F.target, 0),
    annualStepUp: num(F.stepUp, 0),
    horizonYears: Math.max(1, Math.min(60, Math.round(num(F.years, 20)))),
    expectedInflation: num(F.inflation, 6),
    expectedReturn: num(F.ret, 13.4),
    annualVolatility: roughness,
    ltcgTax: num(F.tax, 12.5),
    isPostTax: pressed(F.postTax),
    eqPct: eq / total,
    debtPct: debt / total,
    goldPct: gold / total,
    bsEnabled: checked(F.hedgeToggle),
    // PRICED, not read. dd-013 and sol-029: the planner shipped a free premium
    // input that still said 1.85% while rung 5 priced the same contract at
    // 5.73%, and the ledger duly reported a return per rupee on a floor nobody
    // would sell at that price. This page's premium was worse - the literal
    // `0.0185` appeared at two call sites and moved for nothing at all.
    //
    // Quoted as a percentage of the sleeve the put is written on. sipAdvice
    // does the one conversion to a portfolio-level charge.
    hedgingDragCost: pricePut(floorPct, roughness, HEDGE_TERM_MONTHS).annual,
    hedgingFloorLimit: floorPct,
    numSimulations: SIP_SIMS,
    seed: SIP_SEED,
  };
}

const grp = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

/**
 * Push the three shared values in whichever direction the reader just typed.
 * Only these three exist on both surfaces; everything else lives in one place
 * and therefore cannot disagree with itself.
 */
export function syncEntryFromAdvanced(): void {
  const i = readSipInputs();
  const set = (id: string, v: string) => {
    const e = el(id);
    if (e && e.value !== v) e.value = v;
  };
  set(ENTRY.monthly, grp(i.monthlySip));
  set(ENTRY.years, String(i.horizonYears));
  set(ENTRY.target, grp(i.targetRealWealth));
  // The premium field is a readout, not a control - show what was priced.
  set(F.premium, i.hedgingDragCost.toFixed(2));
}

export function syncAdvancedFromEntry(): void {
  const clean = (s: string) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;
  const set = (id: string, v: string) => {
    const e = el(id);
    if (e && e.value !== v) e.value = v;
  };
  const monthly = clean(el(ENTRY.monthly)?.value ?? '');
  const years = Math.max(1, Math.min(60, clean(el(ENTRY.years)?.value ?? '')));
  const target = clean(el(ENTRY.target)?.value ?? '');
  if (monthly > 0) set(F.monthly, grp(monthly));
  if (years > 0) set(F.years, String(years));
  if (target > 0) set(F.target, grp(target));
}

/**
 * Ask the compute host for a fresh run. Anything on the page may call this;
 * exactly one listener answers it, which is what keeps the surfaces in step.
 */
export function requestRecompute(): void {
  window.dispatchEvent(new CustomEvent('sip:recompute'));
}
