import { runSWPMonteCarlo } from '../workers/swpWorker';

/**
 * Turning a verdict into a decision.
 *
 * The planner currently reports a survival probability and stops. A reader who
 * is told their money runs out has learned something alarming and been given
 * nothing to do about it - which is the analysis without the help. sol-019
 * requires that when the outcome is a failure state, the screen offers the
 * lever.
 *
 * There are only three levers on a withdrawal plan: draw less, start with
 * more, or draw for fewer years. This module finds, for each one, the smallest
 * change that reaches an acceptable outcome - so the answer is "cut 6,200 a
 * month, or add 34 lakh, or wait three years", not "22%".
 */

export interface AdviceInputs {
  initialCorpus: number;
  monthlyWithdrawal: number;
  annualStepUp: number;
  expectedReturn: number;
  expectedInflation: number;
  annualVolatility: number;
  ltcgTax: number;
  horizonYears: number;
  useGuardrails?: boolean;
  bsEnabled?: boolean;
  hedgingDragCost?: number;
  hedgingFloorLimit?: number;
}

export type RemedyKind = 'spend_less' | 'save_more' | 'shorten_horizon';

export interface Remedy {
  kind: RemedyKind;
  /** The value the input would need to take. */
  value: number;
  /** How far that is from where the user is now, always positive. */
  delta: number;
  /** Survival probability achieved at `value`. */
  survival: number;
  /** True when no achievable value within the search range reaches the target. */
  outOfReach: boolean;
}

export interface Outlook {
  survival: number;
  /** Year the median path runs dry, or null if it lasts the whole horizon. */
  medianDepletionYear: number | null;
  /** Median balance remaining at the end of the horizon. */
  medianFinalBalance: number;
  healthy: boolean;
  /** Where the money actually went, over the whole horizon. */
  flow: {
    started: number;
    /** Everything the portfolio earned. Derived as a residual so the five
     *  figures always reconcile on screen: started + growth = drawn + left. */
    growth: number;
    /** Gross withdrawn, tax included. */
    drawn: number;
    tax: number;
    /** What actually reached the user's pocket. */
    netToYou: number;
    left: number;
    /** Gross drawn as a multiple of the starting corpus. */
    multiple: number;
    /** First-year withdrawal as a percentage of the starting corpus. */
    initialRate: number;
    /**
     * The same journey in today's money (dd-004). A reader knows what a rupee
     * buys now and has no intuition for what one buys in 2056, so this is the
     * frame we lead with; the nominal figures above are the opt-in.
     * Each year's flow is discounted at its own distance, not the total at the
     * end - money drawn in year 2 has barely lost value, money drawn in year
     * 30 has lost most of it.
     */
    real: {
      drawn: number;
      tax: number;
      netToYou: number;
      left: number;
      multiple: number;
    };
  };
}

/**
 * Evaluations during a search must be comparable, so every one runs on the
 * same market paths. Without a fixed seed the objective is noisy and a
 * bisection can walk in the wrong direction on a coin flip; with it, survival
 * is a clean monotonic function of each lever.
 */
const SEARCH_SEED = 20260815;
const SEARCH_SIMS = 600;

/** Above this we stop calling a plan broken. */
export const HEALTHY_SURVIVAL = 0.85;

function survivalAt(inputs: AdviceInputs, sims = SEARCH_SIMS): number {
  const r = runSWPMonteCarlo({ ...inputs, numSimulations: sims, seed: SEARCH_SEED });
  return r.probabilityOfSuccess / 100;
}

export function outlook(inputs: AdviceInputs, sims = 2000): Outlook {
  const r = runSWPMonteCarlo({ ...inputs, numSimulations: sims, seed: SEARCH_SEED });
  const p50: number[] = r.p50;

  let depletion: number | null = null;
  for (let y = 1; y < p50.length; y++) {
    if (p50[y] <= 0) { depletion = y; break; }
  }

  const started = inputs.initialCorpus;
  const drawn = r.avgTotalWithdrawals;
  const tax = r.avgTotalTaxPaid;
  const left = r.medianFinalBalance;

  // Discount each year's flow at its own distance. Deflating the 30-year total
  // by 30 years of inflation would be wrong by a wide margin, because most of
  // the money comes out long before year 30.
  const d = (n: number, years: number) =>
    n / Math.pow(1 + inputs.expectedInflation / 100, years);
  const w: number[] = r.medianWithdrawals ?? [];
  const t: number[] = r.medianTaxes ?? [];
  let realDrawn = 0;
  let realTax = 0;
  for (let y = 1; y < w.length; y++) realDrawn += d(w[y] ?? 0, y);
  for (let y = 1; y < t.length; y++) realTax += d(t[y] ?? 0, y);
  const realLeft = d(left, inputs.horizonYears);

  return {
    survival: r.probabilityOfSuccess / 100,
    medianDepletionYear: depletion,
    medianFinalBalance: left,
    healthy: r.probabilityOfSuccess / 100 >= HEALTHY_SURVIVAL,
    flow: {
      started,
      growth: drawn + left - started,
      drawn,
      tax,
      netToYou: drawn - tax,
      left,
      multiple: started > 0 ? drawn / started : 0,
      initialRate: started > 0 ? (inputs.monthlyWithdrawal * 12) / started * 100 : 0,
      real: {
        drawn: realDrawn,
        tax: realTax,
        netToYou: realDrawn - realTax,
        left: realLeft,
        multiple: started > 0 ? realDrawn / started : 0,
      },
    },
  };
}

/**
 * Smallest monthly withdrawal reduction that reaches the target.
 * Searches downward from the current figure.
 */
function solveSpendLess(inputs: AdviceInputs, target: number): Remedy {
  let lo = 0;
  let hi = inputs.monthlyWithdrawal;
  if (survivalAt({ ...inputs, monthlyWithdrawal: lo }) < target) {
    return { kind: 'spend_less', value: 0, delta: hi, survival: survivalAt({ ...inputs, monthlyWithdrawal: 0 }), outOfReach: true };
  }
  // Survival falls as withdrawal rises, so bisect on the crossing point.
  for (let i = 0; i < 18 && hi - lo > 100; i++) {
    const mid = (lo + hi) / 2;
    if (survivalAt({ ...inputs, monthlyWithdrawal: mid }) >= target) lo = mid;
    else hi = mid;
  }
  const value = Math.floor(lo / 100) * 100;
  return {
    kind: 'spend_less',
    value,
    delta: inputs.monthlyWithdrawal - value,
    survival: survivalAt({ ...inputs, monthlyWithdrawal: value }),
    outOfReach: false,
  };
}

/** Smallest additional starting corpus that reaches the target. */
function solveSaveMore(inputs: AdviceInputs, target: number): Remedy {
  let lo = inputs.initialCorpus;
  let hi = inputs.initialCorpus * 6;
  if (survivalAt({ ...inputs, initialCorpus: hi }) < target) {
    return { kind: 'save_more', value: hi, delta: hi - inputs.initialCorpus, survival: survivalAt({ ...inputs, initialCorpus: hi }), outOfReach: true };
  }
  for (let i = 0; i < 18 && hi - lo > 50000; i++) {
    const mid = (lo + hi) / 2;
    if (survivalAt({ ...inputs, initialCorpus: mid }) >= target) hi = mid;
    else lo = mid;
  }
  const value = Math.ceil(hi / 100000) * 100000;
  return {
    kind: 'save_more',
    value,
    delta: value - inputs.initialCorpus,
    survival: survivalAt({ ...inputs, initialCorpus: value }),
    outOfReach: false,
  };
}

/**
 * Longest horizon that still reaches the target - i.e. how many fewer years
 * the plan must fund. In practice this reads as retiring later, since a later
 * start shortens the span the corpus has to cover.
 */
function solveShortenHorizon(inputs: AdviceInputs, target: number): Remedy {
  let best: number | null = null;
  for (let years = inputs.horizonYears; years >= 1; years--) {
    if (survivalAt({ ...inputs, horizonYears: years }) >= target) { best = years; break; }
  }
  if (best === null) {
    return { kind: 'shorten_horizon', value: 1, delta: inputs.horizonYears - 1, survival: survivalAt({ ...inputs, horizonYears: 1 }), outOfReach: true };
  }
  return {
    kind: 'shorten_horizon',
    value: best,
    delta: inputs.horizonYears - best,
    survival: survivalAt({ ...inputs, horizonYears: best }),
    outOfReach: false,
  };
}

/**
 * All three levers, cheapest-looking first is NOT imposed - the caller decides
 * presentation order. Returns an empty list when the plan is already healthy,
 * because offering remedies for a working plan invents a problem.
 */
export function findRemedies(
  inputs: AdviceInputs,
  target: number = HEALTHY_SURVIVAL
): Remedy[] {
  if (survivalAt(inputs) >= target) return [];
  return [
    solveSpendLess(inputs, target),
    solveSaveMore(inputs, target),
    solveShortenHorizon(inputs, target),
  ];
}
