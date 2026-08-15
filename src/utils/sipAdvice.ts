import { runSimulation, runGoalSeek } from '../workers/sipWorker';

/**
 * Turning an accumulation projection into a decision.
 *
 * The mirror of swpAdvice.ts, and deliberately the same shape: an outlook
 * derived from a simulation someone else already ran, plus the smallest change
 * on each of three levers that reaches an acceptable outcome. The planner
 * proved the pattern (sol-019, dd-002); T3's scope, settled 15 Aug, is that
 * this page inherits it whole rather than growing a second one beside it.
 *
 * The question is different, though, and the difference matters. A retiree asks
 * "will it last?", which is a survival probability. A saver asks "do I get
 * there?", which is a probability over ENDING wealth against a goal they named.
 * Everything below is that one question, and the three ways out of a no.
 */

export interface SipInputs {
  /** Lump sum already in hand, deployed at the start. */
  seedCapital: number;
  monthlySip: number;
  /** The goal, in TODAY'S money. A goal in future rupees is not a goal. */
  targetRealWealth: number;
  /** Annual increase in the monthly contribution, %. */
  annualStepUp: number;
  horizonYears: number;
  expectedInflation: number;
  /** Equity growth, %, from the regime preset. Arithmetic, matching swpWorker. */
  expectedReturn: number;
  /** Equity roughness, %, from the same preset - a regime is a pair. */
  annualVolatility: number;
  ltcgTax: number;
  /** Whether the figures are shown after the tax due on selling up. */
  isPostTax: boolean;
  /** Allocation, as fractions summing to 1. */
  eqPct: number;
  debtPct: number;
  goldPct: number;
  bsEnabled: boolean;
  /** PRICED, not chosen. % a year of the equity sleeve insured - see putPricing. */
  hedgingDragCost: number;
  /** Depth of the floor, negative %, e.g. -10. */
  hedgingFloorLimit: number;
  numSimulations?: number;
  seed?: number;
}

/**
 * Evaluations during a search must be comparable, so every one runs on the same
 * market paths - the same rule, and the same seed, as the planner's remedy
 * search. Without it a bisection can walk the wrong way on a coin flip.
 */
export const SEARCH_SEED = 20260815;
const SEARCH_SIMS = 400;

/**
 * The bar the levers solve to: the goal is reached on the typical path.
 *
 * A DELIBERATE DIFFERENCE from the planner's 0.85, and the reasoning is
 * dd-012's - judge a thing by the situation it exists for. Missing a savings
 * goal by a year is not the same event as a retiree's money running out, so
 * importing a ruin-risk bar would demand a contribution most savers cannot
 * make and would read as the tool calling every ordinary plan broken.
 *
 * The honesty cost is paid in the copy, not hidden in the constant: every
 * screen that quotes a remedy also states how often that remedy still falls
 * short, because "typically" is a 50/50 word and dressing it up as safety would
 * be exactly the reduction dd-001 forbids.
 *
 * PUT TO RAHUL AND SETTLED, 16 Aug: 50%, with the four candidate bars costed
 * first so the choice was a real one rather than a defence of my own default.
 * On the shipped plan - 25,000 a month, twenty years, a crore in today's money
 * - the lever card reads "18,000 more" at this bar and "58,000 more" at the
 * planner's 85%. The second is equally true and useless to nearly everyone the
 * page is for. Do not raise this constant without re-costing it and asking
 * again; it is a judgement about what is good enough for a stranger's money,
 * not a parameter.
 */
export const TYPICAL_ODDS = 0.5;

/**
 * Reader-facing inputs to engine parameters. The ONLY translation, on purpose:
 * the premium conversion below is the kind of arithmetic that gets hand-copied
 * to a second call site and then fixed in only one of them (sol-018 was exactly
 * that, twice, in this very engine).
 */
export function toEngineParams(inputs: SipInputs, over: Record<string, any> = {}) {
  return {
    seedCapital: inputs.seedCapital,
    monthlySip: inputs.monthlySip,
    targetRealWealth: inputs.targetRealWealth,
    stepUpRate: inputs.annualStepUp / 100,
    horizonYears: inputs.horizonYears,
    inflationRate: inputs.expectedInflation / 100,
    eqPct: inputs.eqPct,
    debtPct: inputs.debtPct,
    goldPct: inputs.goldPct,
    equityReturn: inputs.expectedReturn,
    equityVolatility: inputs.annualVolatility,
    hedgingFloorLimit: inputs.hedgingFloorLimit,
    bsEnabled: inputs.bsEnabled,
    // The quoted premium is a percentage of the EQUITY SLEEVE - that is what
    // the put is written on - while the engine charges a fraction of the whole
    // portfolio. Multiplying by the equity share is the conversion between
    // them, and doing it twice was sol-029's fault on the planner.
    annualHedgingDragCost: inputs.bsEnabled
      ? (inputs.hedgingDragCost / 100) * inputs.eqPct
      : 0,
    ltcgTaxPct: inputs.ltcgTax,
    isPostTax: inputs.isPostTax,
    numSims: inputs.numSimulations,
    seed: inputs.seed ?? SEARCH_SEED,
    ...over,
  };
}

export function simulate(inputs: SipInputs, over: Record<string, any> = {}) {
  return runSimulation(toEngineParams(inputs, over));
}

/** Odds of finishing at or above the goal, on a small comparable sweep. */
function oddsAt(inputs: SipInputs, over: Record<string, any> = {}): number {
  const r = simulate(inputs, { numSims: SEARCH_SIMS, seed: SEARCH_SEED, ...over });
  return r.final.reachedTarget ?? 0;
}

export interface SipOutlook {
  /** Share of futures finishing at or above the goal, 0..1. */
  odds: number;
  /** True when the typical path gets there. */
  healthy: boolean;
  /**
   * The year the median path's savings first cover the goal, or null if they
   * never do inside the horizon.
   *
   * dd-010: nobody experiences a terminal balance. A saver experiences the year
   * the goal stopped being hypothetical - and finding out it arrives three
   * years early, or four years late, is the thing they came for.
   */
  reachYear: number | null;
  /** Ending wealth in today's money: the bad, typical and good cases. */
  endReal: { p10: number; p50: number; p90: number };
  target: number;
  /**
   * Where the money came from and what it cost, over the whole plan. Stated in
   * BOTH moneys because a rupee paid in year 20 is not a rupee paid today, and
   * a saver's instinct - "I will have put in 60 lakh" - is the nominal sum,
   * which overstates the real sacrifice by a wide margin (dd-004).
   */
  flow: {
    investedNominal: number;
    /** The same contributions, each discounted from the year it was paid. */
    investedReal: number;
    /**
     * The same "what you keep" figure in the rupees of the final year. Net when
     * the reader is looking at after-tax figures, so the two columns of the
     * flow rung are never in different frames (dd-004).
     */
    endNominal: number;
    /** What the market added before tax, in the rupees of the final year. */
    growthNominal: number;
    /** What you keep, in today's money, after the tax due on selling up. */
    endReal: number;
    /**
     * Everything the market added BEFORE tax, in today's money. A residual, so
     * the rung's column closes exactly: put in + market added − tax = kept.
     */
    growthReal: number;
    /**
     * Tax on selling up, in today's money, for the SAME path the other figures
     * describe. Zero when the reader is looking at before-tax figures.
     */
    taxReal: number;
    /** The same tax, in the rupees of the final year. */
    taxNominal: number;
    /** What you keep as a multiple of what you really gave up. */
    multiple: number;
  };
}

/**
 * The outlook, derived from a simulation someone else already ran.
 *
 * Split from the run for the same reason swpAdvice splits them (sol-026): ONE
 * simulation feeds the Answer, every rung and the expert panel, so agreement
 * between surfaces is structural rather than a coincidence of two call sites
 * passing the same arguments (dd-013).
 */
export function outlookFrom(r: any, inputs: SipInputs): SipOutlook {
  const years = inputs.horizonYears;
  const target = inputs.targetRealWealth;
  const netCurve: number[] = r.final.p50RealNet ?? r.p50Real;

  let reachYear: number | null = null;
  for (let y = 1; y <= years; y++) {
    if ((netCurve[y] ?? 0) >= target) { reachYear = y; break; }
  }

  const endReal = r.final.realNet;
  const investedNominal = r.nominalTotalInvested;
  const investedReal = r.realOutflowPV;

  return {
    odds: r.final.reachedTarget ?? 0,
    healthy: (r.final.reachedTarget ?? 0) >= TYPICAL_ODDS,
    reachYear,
    endReal,
    target,
    flow: {
      investedNominal,
      investedReal,
      endNominal: r.expectedNominalMedian - r.final.taxPaidNominal,
      growthNominal: r.expectedNominalMedian - investedNominal,
      endReal: endReal.p50,
      // Before tax, so the column reads as a reader would add it up.
      growthReal: r.final.grossRealFinal - investedReal,
      taxReal: r.final.taxPaidReal,
      taxNominal: r.final.taxPaidNominal,
      multiple: investedReal > 0 ? endReal.p50 / investedReal : 0,
    },
  };
}

export type SipRemedyKind = 'invest_more' | 'wait_longer' | 'aim_lower';

export interface SipRemedy {
  kind: SipRemedyKind;
  /** The value the input would need to take. */
  value: number;
  /** How far that is from where the reader is now, always positive. */
  delta: number;
  /** Odds of reaching the goal at `value`, 0..1. */
  odds: number;
  /** True when nothing inside the search range reaches the bar. */
  outOfReach: boolean;
}

/**
 * Invest more each month. This IS the reverse goal seek the page used to hide
 * behind a mode switch labelled "REVERSE: GOAL-SEEK" - a saver's first question
 * asked in the engine's vocabulary, on the far side of a toggle. It is a lever
 * on the Answer now, which is what T3's "goal seek becomes the default" means:
 * not a different mode, the same question asked in the reader's words.
 */
function solveInvestMore(inputs: SipInputs): SipRemedy {
  const required = runGoalSeek(
    toEngineParams(inputs, { numMiniSims: 250, seed: SEARCH_SEED })
  );
  // The bisection's ceiling. A goal that needs more than a crore a month is not
  // a goal this page can help with, and saying so is better than printing it.
  const outOfReach = required >= 9_900_000;
  const value = Math.ceil(required / 500) * 500;
  return {
    kind: 'invest_more',
    value,
    delta: Math.max(0, value - inputs.monthlySip),
    odds: oddsAt(inputs, { monthlySip: value }),
    outOfReach,
  };
}

/**
 * Give it more years. Searched rather than solved: the horizon is an integer
 * and there are at most a few dozen candidates, so a scan is exact where a
 * bisection over a step function is fiddly and can miss by a year.
 */
function solveWaitLonger(inputs: SipInputs): SipRemedy {
  const MAX = 50;
  for (let years = inputs.horizonYears + 1; years <= MAX; years++) {
    const odds = oddsAt(inputs, { horizonYears: years });
    if (odds >= TYPICAL_ODDS) {
      return {
        kind: 'wait_longer',
        value: years,
        delta: years - inputs.horizonYears,
        odds,
        outOfReach: false,
      };
    }
  }
  return {
    kind: 'wait_longer',
    value: MAX,
    delta: MAX - inputs.horizonYears,
    odds: oddsAt(inputs, { horizonYears: MAX }),
    outOfReach: true,
  };
}

/**
 * Aim lower. No search: the goal the current plan already reaches on the
 * typical path is the median ending wealth, which the simulation has already
 * computed. Rounded DOWN to a lakh - rounding a reachable goal up would hand
 * back a number the plan does not actually reach.
 */
function solveAimLower(r: any, inputs: SipInputs): SipRemedy {
  const reachable = Math.floor((r.final.realNet.p50 ?? 0) / 100000) * 100000;
  return {
    kind: 'aim_lower',
    value: reachable,
    delta: Math.max(0, inputs.targetRealWealth - reachable),
    odds: oddsAt(inputs, { targetRealWealth: Math.max(1, reachable) }),
    outOfReach: reachable <= 0,
  };
}

/**
 * All three levers. Empty when the plan already gets there, because offering
 * remedies for a working plan invents a problem the reader did not have.
 */
export function findRemedies(r: any, inputs: SipInputs): SipRemedy[] {
  if ((r.final.reachedTarget ?? 0) >= TYPICAL_ODDS) return [];
  return [solveInvestMore(inputs), solveWaitLonger(inputs), solveAimLower(r, inputs)];
}

export interface SipGrowthPoint {
  /** Assumed equity growth, %. */
  growth: number;
  /** After inflation, %. The ratio, not the difference. */
  real: number;
  /** Median ending wealth in today's money at this assumption. */
  endReal: number;
  /** Odds of reaching the goal, 0..1. */
  odds: number;
}

export interface SipGrowthCurve {
  points: SipGrowthPoint[];
  /** Lowest growth on the track at which the typical path still gets there. */
  breakeven: number | null;
  /** Where the reader's own assumption sits, so the track can mark it. */
  readerGrowth: number;
  min: number;
  max: number;
  step: number;
}

/**
 * The goal's odds across a range of growth assumptions, computed in one batch.
 *
 * Precomputed for the same reason the planner's is (dd-008): evaluating while a
 * slider moves means either a stutter under the reader's hand or a number that
 * lags the control, and a number that arrives late reads as the tool being
 * unsure. One batch up front makes dragging an array lookup.
 *
 * The breakeven is the whole sentence the rung needs - naming where the plan
 * stops working covers every position of the control at once, so no prose has
 * to change as the reader drags.
 */
export function growthCurve(
  inputs: SipInputs,
  min = 4,
  max = 18,
  step = 0.5,
  sims = 300
): SipGrowthCurve {
  const points: SipGrowthPoint[] = [];
  for (let g = min; g <= max + 1e-9; g += step) {
    const growth = Math.round(g * 10) / 10;
    const r = simulate(inputs, {
      equityReturn: growth, numSims: sims, seed: SEARCH_SEED,
    });
    points.push({
      growth,
      // The ratio, not the difference: 12% against 6% leaves 5.66%, and over
      // twenty years treating it as 6% compounds into a large error.
      real: ((1 + growth / 100) / (1 + inputs.expectedInflation / 100) - 1) * 100,
      endReal: r.final.realNet.p50,
      odds: r.final.reachedTarget ?? 0,
    });
  }
  const crossing = points.find((p) => p.odds >= TYPICAL_ODDS);
  return {
    points,
    breakeven: crossing ? crossing.growth : null,
    readerGrowth: inputs.expectedReturn,
    min,
    max,
    step,
  };
}
