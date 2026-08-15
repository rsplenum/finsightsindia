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
  return outlookFrom(
    runSWPMonteCarlo({ ...inputs, numSimulations: sims, seed: SEARCH_SEED }),
    inputs
  );
}

/**
 * The same outlook, derived from a simulation someone else already ran.
 *
 * sol-026: the ladder and the advanced panel each ran their own Monte Carlo and
 * then printed overlapping quantities that did not match. Splitting the
 * derivation from the run is what lets ONE simulation feed every surface, so
 * agreement is structural rather than a coincidence of two call sites happening
 * to pass the same arguments (dd-013).
 */
export function outlookFrom(r: any, inputs: AdviceInputs): Outlook {
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

export interface SequencePoint {
  startYear: number;
  finalBalance: number;
  survived: boolean;
  /** Year the pot ran dry, or null if it lasted. */
  depletionYear: number | null;
  /**
   * The lived metric (dd-010). At its lowest point, how many years of that
   * year's spending was the pot still worth? Nobody experiences a terminal
   * balance; they experience the year the money looked thinnest. Two is
   * frightening, ten is comfortable.
   */
  minCushionYears: number;
  /** The year that low point happened - the one they would remember. */
  minCushionYear: number;
}

export interface SequenceRisk {
  points: SequencePoint[];
  /** Starting the downturn in this year or later leaves the plan intact. */
  safeFromYear: number | null;
  /** Identical for every scenario, by construction - this is the whole point. */
  averageReturn: number;
  /** Stated so the screen can explain why the average is not the assumption. */
  normalReturn: number;
  crashPct: number;
  durationYears: number;
  best: SequencePoint;
  worst: SequencePoint;
}

/**
 * The same bad years, moved.
 *
 * Sequence-of-returns risk is the least intuitive thing about drawing down a
 * portfolio and the most consequential: two retirements with the SAME average
 * return can end decades apart depending only on when the bad years fall.
 * While you are withdrawing, a fall early forces you to sell units cheap that
 * can never be bought back, and every later recovery compounds on a smaller
 * pot.
 *
 * The demonstration holds the multiset of yearly returns fixed - `duration`
 * crash years and the rest at the expected rate - and only permutes WHERE the
 * bad run starts. The arithmetic mean is therefore identical across every
 * scenario by construction, not by approximation, which is what makes the
 * comparison a proof rather than an anecdote.
 *
 * `duration` exists because a single bad year is not the frightening case. The
 * frightening case is 2000-2002 or 2008-2009: a downturn that outlasts your
 * patience while you are still drawing an income from it.
 *
 * Deterministic on purpose. A Monte Carlo here would blur the very effect
 * being isolated.
 */
/**
 * Drive the ONE engine along a fixed sequence of annual returns.
 *
 * This used to call runDeterministicSWP - a second, independent implementation
 * of the same withdrawal, tax and cost-basis maths. Two engines meant the LTCG
 * double-charge had to be found and fixed twice, and only a parity test stood
 * between us and a table that silently contradicted its own headline. The
 * Monte Carlo engine now accepts an explicit return sequence, so the duplicate
 * is gone rather than policed (dd-013).
 *
 * One trial, zero volatility, returns supplied: the percentile arrays collapse
 * to that single path, which is exactly the deterministic walk.
 */
function runFixedSequence(inputs: AdviceInputs, returnsPct: number[]) {
  const r = runSWPMonteCarlo({
    ...inputs,
    annualVolatility: 0,
    numSimulations: 1,
    returnsByYear: returnsPct.map((x) => x / 100),
  });
  return { balances: r.p50 as number[], withdrawals: r.medianWithdrawals as number[] };
}

export function sequenceRisk(
  inputs: AdviceInputs,
  crashPct = -30,
  durationYears = 1
): SequenceRisk {
  const years = inputs.horizonYears;
  const duration = Math.max(1, Math.min(durationYears, years));
  const points: SequencePoint[] = [];

  for (let startYear = 1; startYear <= years - duration + 1; startYear++) {
    const returns = Array.from({ length: years }, (_, i) => {
      const y = i + 1;
      return y >= startYear && y < startYear + duration ? crashPct : inputs.expectedReturn;
    });
    const run = runFixedSequence(inputs, returns);

    let depletionYear: number | null = null;
    for (let y = 1; y < run.balances.length; y++) {
      if (run.balances[y] <= 0) { depletionYear = y; break; }
    }

    // Cushion: the balance measured in years of that year's own spending, so
    // it stays meaningful as the cost of living rises.
    let minCushionYears = Infinity;
    let minCushionYear = 1;
    for (let y = 1; y <= years; y++) {
      const spend = run.withdrawals[y] ?? 0;
      if (spend <= 0) continue;
      const cushion = (run.balances[y] ?? 0) / spend;
      if (cushion < minCushionYears) { minCushionYears = cushion; minCushionYear = y; }
    }
    if (!Number.isFinite(minCushionYears)) minCushionYears = 0;

    points.push({
      startYear,
      finalBalance: run.balances[years] ?? 0,
      survived: (run.balances[years] ?? 0) > 0,
      depletionYear,
      minCushionYears,
      minCushionYear,
    });
  }

  const survivors = points.filter((p) => p.survived);
  const safeFromYear = survivors.length ? survivors[0].startYear : null;

  return {
    points,
    safeFromYear,
    averageReturn:
      ((years - duration) * inputs.expectedReturn + duration * crashPct) / years,
    normalReturn: inputs.expectedReturn,
    crashPct,
    durationYears: duration,
    best: points.reduce((a, b) => (b.finalBalance > a.finalBalance ? b : a)),
    worst: points.reduce((a, b) => (b.finalBalance < a.finalBalance ? b : a)),
  };
}

export interface GrowthPoint {
  growth: number;      // nominal expected return, %
  real: number;        // after inflation, %
  headroom: number;    // real growth less the withdrawal rate, %
  survival: number;    // 0..1
}

export interface GrowthCurve {
  points: GrowthPoint[];
  /** Lowest growth rate on the curve that still reaches the healthy bar. */
  breakeven: number | null;
  min: number;
  max: number;
  step: number;
}

/**
 * Survival across a range of growth assumptions, computed once.
 *
 * Deliberately precomputed rather than evaluated per drag. Running the
 * simulation while a slider is moving means either a stutter under the user's
 * hand or a debounce that makes the number lag behind the control - and a
 * number that arrives late reads as the tool being unsure. One batch up front
 * makes dragging an array lookup.
 *
 * It also yields the breakeven for free, which is the only sentence rung 3
 * needs: naming where the plan stops working covers the whole range of the
 * control at once, so no prose has to change as the reader drags (dd-008).
 */
export function growthCurve(
  inputs: AdviceInputs,
  min = 4,
  max = 18,
  step = 0.5,
  sims = 300
): GrowthCurve {
  const points: GrowthPoint[] = [];
  const drawRate = inputs.initialCorpus > 0
    ? (inputs.monthlyWithdrawal * 12) / inputs.initialCorpus * 100
    : 0;

  for (let g = min; g <= max + 1e-9; g += step) {
    const growth = Math.round(g * 10) / 10;
    // Real growth is the ratio, not the difference: 12% against 6% leaves
    // 5.66%, and over thirty years treating it as 6% compounds badly.
    const real = ((1 + growth / 100) / (1 + inputs.expectedInflation / 100) - 1) * 100;
    points.push({
      growth,
      real,
      headroom: real - drawRate,
      survival: survivalAt({ ...inputs, expectedReturn: growth }, sims),
    });
  }

  // Survival rises with growth, so the first crossing is the boundary.
  const crossing = points.find((p) => p.survival >= HEALTHY_SURVIVAL);
  return { points, breakeven: crossing ? crossing.growth : null, min, max, step };
}

export interface ProtectionPoint {
  /** Market roughness - the annual spread of returns, %. */
  roughness: number;
  /** Share of years ending below the floor, 0..1. Closed form, not simulated. */
  bindFrequency: number;
  /** One year in this many ends below the floor. Rounded for display. */
  oneYearIn: number;
  /** Average annual payout from the floor, as % of the pot. Closed form. */
  payout: number;
  /** The premium, %. Constant across the curve, and that is the lesson. */
  premium: number;
  /** payout - premium, %. Negative means protection loses money on average. */
  net: number;
  survivalUnprotected: number; // 0..1
  survivalProtected: number;   // 0..1

  // The bad futures. A floor can only act here, so this is what the screen
  // leads with rather than an average taken over every future (dd-012).
  /** Out of 100 futures, how many ended with the money gone. */
  ruinedUnprotected: number;
  ruinedProtected: number;
}

export interface ProtectionCurve {
  points: ProtectionPoint[];
  /**
   * Lowest roughness at which the average payout covers the premium. Null when
   * protection never pays for itself anywhere on the track.
   */
  breakeven: number | null;
  /** Depth of the floor, %, e.g. -10. */
  floor: number;
  premium: number;
  min: number;
  max: number;
  step: number;
}

/** Standard normal CDF, via the Abramowitz-Stegun error function. */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 +
    t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

function normalPdf(z: number): number {
  return 0.3989422804014327 * Math.exp(-z * z / 2);
}

/**
 * What protection costs, and what it is worth, across the range of markets it
 * might have to face.
 *
 * The premium is FIXED - Rahul settled it at 1.85% and it is not a knob. So the
 * only thing left varying is how rough the market turns out to be, which is
 * also the one thing neither we nor the reader chooses. That asymmetry is the
 * whole subject reduced to one comparison (dd-005): a certain price against an
 * uncertain payout.
 *
 * Frequency and payout are CLOSED FORM, not simulated. swpWorker draws annual
 * returns as `mu + sigma * N(0,1)`, so for a floor K the share of years that
 * breach it is Phi((K - mu)/sigma) exactly, and the average payout is
 * sigma * (z * Phi(z) + phi(z)) - the expected shortfall of a normal. Two
 * reasons this matters and neither is elegance: the figures are then traceable
 * arithmetic rather than a sample, and they do not jitter between drags. A
 * number that wobbles when nothing changed is re-read every time, which is
 * exactly what dd-008 exists to prevent.
 *
 * Survival IS simulated, and the two columns run on the same seed and the same
 * paths, so the gap between them is the hedge and nothing else.
 */
export function protectionCurve(
  inputs: AdviceInputs,
  min = 8,
  max = 32,
  // Step 1 so that whatever roughness the reader has actually assumed lands
  // exactly on a computed point. At step 2 a shipped assumption of 15% snapped
  // the slider thumb to 16 while the readout showed the nearest point, 14 -
  // the control and the number disagreeing on screen.
  step = 1,
  sims = 600
): ProtectionCurve {
  const premium = inputs.hedgingDragCost ?? 1.85;
  const floor = inputs.hedgingFloorLimit ?? -10;
  const mu = inputs.expectedReturn / 100;
  const k = floor / 100;

  const points: ProtectionPoint[] = [];
  for (let r = min; r <= max + 1e-9; r += step) {
    const roughness = Math.round(r * 10) / 10;
    const sigma = roughness / 100;

    const z = (k - mu) / sigma;
    const bindFrequency = normalCdf(z);
    // Expected shortfall below the floor: E[max(0, K - R)] for R ~ N(mu, sigma).
    const payout = sigma * (z * normalCdf(z) + normalPdf(z)) * 100;

    const at = { ...inputs, annualVolatility: roughness };
    // Both runs on the same seed and the same paths, so every difference
    // between the columns is the hedge and nothing else.
    const u = runSWPMonteCarlo({
      ...at, bsEnabled: false, numSimulations: sims, seed: SEARCH_SEED,
    });
    const h = runSWPMonteCarlo({
      ...at, bsEnabled: true, hedgingDragCost: premium, hedgingFloorLimit: floor,
      numSimulations: sims, seed: SEARCH_SEED,
    });
    points.push({
      roughness,
      bindFrequency,
      oneYearIn: bindFrequency > 0 ? Math.round(1 / bindFrequency) : Infinity,
      payout,
      premium,
      net: payout - premium,
      survivalUnprotected: u.probabilityOfSuccess / 100,
      survivalProtected: h.probabilityOfSuccess / 100,
      ruinedUnprotected: (u.failureCount / sims) * 100,
      ruinedProtected: (h.failureCount / sims) * 100,
    });
  }

  // The payout rises monotonically with roughness while the premium does not
  // move, so the first crossing is the boundary for the whole track.
  const crossing = points.find((p) => p.net >= 0);
  return {
    points,
    breakeven: crossing ? crossing.roughness : null,
    floor,
    premium,
    min,
    max,
    step,
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
