import { parseFormattedNumber } from './formatters';
import type { AdviceInputs } from './swpAdvice';
import { pricePut } from './putPricing';

/**
 * One set of inputs, one simulation, for every surface on the SWP planner.
 *
 * sol-026: the page used to run two engines against two input sets and show
 * both to the reader at once. The ladder read three fields and hardcoded the
 * macro assumptions; the advanced panel read the whole form. They disagreed by
 * small amounts always, and by a factor of five whenever the reader touched an
 * assumption the ladder could not see. Neither knew the other existed.
 *
 * The fix is structural rather than arithmetical (dd-013): the advanced form is
 * the single source of truth, the three entry fields at the top are a
 * projection of it rather than a second copy, and one simulation at one size
 * with one seed feeds the Answer, all five rungs and the advanced panel.
 *
 * Everything here is deliberately boring. It is a DOM reader, and its only job
 * is to be the ONLY DOM reader.
 */

/**
 * The canonical run size and seed. Both surfaces used to pick their own - 2,000
 * seeded against 10,000 unseeded - which was enough on its own to make the same
 * quantity print two different values. They are constants now so that "the same
 * inputs" can only ever mean one thing.
 */
export const PLANNER_SIMS = 10000;
export const PLANNER_SEED = 20260815;

/** The advanced form's field ids - the single source of truth. */
const F = {
  corpus: 'initialCorpus',
  monthly: 'monthlyWithdrawal',
  stepUp: 'stepUp',
  ret: 'expectedReturn',
  vol: 'annualVolatility',
  inflation: 'expectedInflation',
  tax: 'ltcgTax',
  years: 'horizonYears',
  guardrails: 'useGuardrails',
  hedgeToggle: 'bsHedgingToggle',
  premium: 'hedgingDragCost',
  floor: 'hedgingFloorLimit',
} as const;

/** The three entry fields, which mirror three of the above and nothing more. */
const ENTRY = {
  corpus: 'ansCorpus',
  monthly: 'ansMonthly',
  years: 'ansYears',
} as const;

export interface PlannerInputs extends AdviceInputs {
  useGuardrails: boolean;
  bsEnabled: boolean;
  hedgingDragCost: number;
  hedgingFloorLimit: number;
  numSimulations: number;
  seed: number;
}

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

/** Rolls every 12 months. The term selector is not shipped yet - see the gate. */
const HEDGE_TERM_MONTHS = 12;

/** Read the one true input set. Every surface calls this and nothing else. */
export function readPlannerInputs(): PlannerInputs {
  const roughness = num(F.vol, 15);
  const floorPct = num(F.floor, -10);
  return {
    initialCorpus: money(F.corpus, 0),
    monthlyWithdrawal: money(F.monthly, 0),
    annualStepUp: num(F.stepUp, 0),
    expectedReturn: num(F.ret, 12),
    annualVolatility: roughness,
    expectedInflation: num(F.inflation, 6),
    ltcgTax: num(F.tax, 12.5),
    horizonYears: Math.max(1, Math.min(60, Math.round(num(F.years, 30)))),
    useGuardrails: checked(F.guardrails),
    bsEnabled: checked(F.hedgeToggle),
    // PRICED, not read. dd-013: rung 5 prices the premium from the floor depth
    // and the assumed roughness, and the panel used to read a free input that
    // still said 1.85%. At a 28.4% assumption those are 5.73% and 1.85% - two
    // surfaces quoting different prices for the same contract, and the ledger
    // duly reported 1.76 rupees back per rupee paid on a floor nobody would
    // sell at that price. The premium has one source now.
    hedgingDragCost: pricePut(floorPct, roughness, HEDGE_TERM_MONTHS).annual,
    hedgingFloorLimit: floorPct,
    numSimulations: PLANNER_SIMS,
    seed: PLANNER_SEED,
  };
}

const grp = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

/**
 * Push the three shared values in whichever direction the reader just typed.
 * Only these three exist on both surfaces; everything else lives in one place
 * and therefore cannot disagree with itself.
 */
export function syncEntryFromAdvanced(): void {
  const i = readPlannerInputs();
  const set = (id: string, v: string) => {
    const e = el(id);
    if (e && e.value !== v) e.value = v;
  };
  set(ENTRY.corpus, grp(i.initialCorpus));
  set(ENTRY.monthly, grp(i.monthlyWithdrawal));
  set(ENTRY.years, String(i.horizonYears));
  // The premium field is a readout, not a control - show what was priced.
  set(F.premium, i.hedgingDragCost.toFixed(2));
}

export function syncAdvancedFromEntry(): void {
  const clean = (s: string) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;
  const set = (id: string, v: string) => {
    const e = el(id);
    if (e && e.value !== v) e.value = v;
  };
  const corpus = clean(el(ENTRY.corpus)?.value ?? '');
  const monthly = clean(el(ENTRY.monthly)?.value ?? '');
  const years = Math.max(1, Math.min(60, clean(el(ENTRY.years)?.value ?? '')));
  if (corpus > 0) set(F.corpus, grp(corpus));
  if (monthly > 0) set(F.monthly, grp(monthly));
  if (years > 0) set(F.years, String(years));
}

/**
 * Ask the compute host for a fresh run. Anything on the page may call this;
 * exactly one listener answers it, which is what keeps the surfaces in step.
 */
export function requestRecompute(): void {
  window.dispatchEvent(new CustomEvent('swp:recompute'));
}
