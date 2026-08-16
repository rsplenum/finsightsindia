import { runSimulation, runGoalSeek } from '../workers/sipWorker';
import { pricePut } from './putPricing';

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

export type ContributionMode = 'real' | 'salary' | 'fixed';

export interface SipInputs {
  /** Lump sum already in hand, deployed at the start. */
  seedCapital: number;
  monthlySip: number;
  /** The goal, in TODAY'S money. A goal in future rupees is not a goal. */
  targetRealWealth: number;
  /**
   * How the reader means their monthly figure. dd-017.
   *
   *  - `real`   the number is in TODAY'S money and is raised each year to keep
   *             its purchasing power. The default, because it is what a person
   *             means, and because the same person will later ask us for a
   *             withdrawal in exactly these terms.
   *  - `salary` a share of monthly income. Income rises with prices by itself,
   *             so this holds purchasing power too - it is the same plan in the
   *             vocabulary of someone with a payslip.
   *  - `fixed`  a flat rupee amount, forever. Kept because some people genuinely
   *             mean it, and because seeing what it costs is the lesson.
   */
  contributionMode: ContributionMode;
  /**
   * An optional REAL rise each year, % - career progression on top of merely
   * keeping pace. Zero is a complete, sensible plan; it is not "no plan".
   */
  realStepUp: number;
  /** `salary` mode only: monthly income, and the share of it saved. */
  monthlyIncome: number;
  savingsRatePct: number;
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
  /**
   * What the fund charges to own it, % a year. The only CERTAIN cost in the
   * whole projection - see fundCosts.ts. Both engines assumed zero until now.
   */
  expenseRatio: number;
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
/**
 * What the reader actually committed to, in the engine's terms.
 *
 * The three modes are one arithmetic wearing three vocabularies, which is why
 * none of them needed a new engine parameter. The engine escalates the
 * instalment by (1 + inflation) * (1 + realStep), matching the planner, so:
 *
 *   real    realStep as given. At zero the instalment holds its value.
 *   salary  the same, with the rupee amount derived from income and share.
 *   fixed   the real step that makes the NOMINAL amount stand still, which is
 *           negative. That is not a trick - a flat rupee instalment IS a plan to
 *           cut your real saving every year, and computing it this way is the
 *           only honest way to say so on the screen.
 */
export function contributionPlan(inputs: SipInputs) {
  const i = inputs.expectedInflation / 100;
  const monthly = inputs.contributionMode === 'salary'
    ? Math.max(0, inputs.monthlyIncome) * (inputs.savingsRatePct / 100)
    : inputs.monthlySip;

  const realStep = inputs.contributionMode === 'fixed'
    ? 1 / (1 + i) - 1
    : inputs.realStepUp / 100;

  return {
    monthly,
    realStep,
    /** What the instalment actually does year on year, in cash. */
    nominalStep: (1 + i) * (1 + realStep) - 1,
    holdsPurchasingPower: inputs.contributionMode !== 'fixed',
  };
}

/** The instalment in cash, in a given year. Year 1 is the number they typed. */
export function instalmentInYear(inputs: SipInputs, year: number): number {
  const p = contributionPlan(inputs);
  return p.monthly * Math.pow(1 + p.nominalStep, Math.max(0, year - 1));
}

export function toEngineParams(inputs: SipInputs, over: Record<string, any> = {}) {
  const plan = contributionPlan(inputs);
  return {
    seedCapital: inputs.seedCapital,
    monthlySip: plan.monthly,
    targetRealWealth: inputs.targetRealWealth,
    stepUpRate: plan.realStep,
    horizonYears: inputs.horizonYears,
    inflationRate: inputs.expectedInflation / 100,
    eqPct: inputs.eqPct,
    debtPct: inputs.debtPct,
    goldPct: inputs.goldPct,
    equityReturn: inputs.expectedReturn,
    equityVolatility: inputs.annualVolatility,
    hedgingFloorLimit: inputs.hedgingFloorLimit,
    annualExpenseRatio: inputs.expenseRatio,
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
    /**
     * What the fund charged to own it, in today's money, on the same path.
     *
     * Its own row rather than folded into the growth figure, and that is the
     * whole reason it exists. Netting a cost against a return is what made this
     * cost invisible for as long as it was: the engine simply grew the balance
     * more slowly and nobody could see why. A cost the reader cannot point at
     * is a cost they cannot act on, and this is the one cost on the page they
     * CAN act on - it is a choice of fund, not a forecast.
     */
    feeReal: number;
    /** The same fees, as the raw sum of rupees handed over. */
    feeNominal: number;
    /**
     * The ledger's two landing points, both ALWAYS computed.
     *
     * sol-037's second instance. The flow rung printed "not counted yet" for
     * tax whenever the page's BEFORE TAX button was in its shipped position, so
     * the one screen whose whole job is to show where the money goes was
     * silently omitting the last thing that takes some. A ledger with a
     * conditional line is not a ledger.
     */
    preTaxEndReal: number;
    preTaxEndNominal: number;
    /** Tax on selling up, on the median path, whichever view is selected. */
    taxAlwaysReal: number;
    taxAlwaysNominal: number;
    afterTaxEndReal: number;
    afterTaxEndNominal: number;
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
      // What the MARKET added, before the fund took its cut and before tax.
      // The engine has already deducted the fee, so it is added back here -
      // otherwise the fee would be counted twice: once invisibly, as growth
      // that never happened, and again on its own row.
      growthNominal: r.expectedNominalMedian - investedNominal + r.final.feePaidNominal,
      endReal: endReal.p50,
      // Before the fee and before tax, so the column reads as a reader would
      // add it up: put in + market added − the fund's cut − tax = kept.
      growthReal: r.final.grossRealFinal - investedReal + r.final.feePaidReal,
      feeReal: r.final.feePaidReal,
      feeNominal: r.final.feePaidNominal,
      taxReal: r.final.taxPaidReal,
      taxNominal: r.final.taxPaidNominal,
      multiple: investedReal > 0 ? endReal.p50 / investedReal : 0,
      // Derived from two figures the engine reports unconditionally, so the
      // column closes twice - once before tax and once after - and contains
      // whichever number the Answer above is currently showing. Neither surface
      // can therefore contradict the other (dd-013).
      preTaxEndReal: r.final.grossRealFinal,
      preTaxEndNominal: Math.round(
        r.final.grossRealFinal * Math.pow(1 + inputs.expectedInflation / 100, years)
      ),
      taxAlwaysReal: Math.max(0, r.final.grossRealFinal - r.final.afterTaxRealP50),
      taxAlwaysNominal: Math.round(
        Math.max(0, r.final.grossRealFinal - r.final.afterTaxRealP50) *
          Math.pow(1 + inputs.expectedInflation / 100, years)
      ),
      afterTaxEndReal: r.final.afterTaxRealP50,
      afterTaxEndNominal: Math.round(
        r.final.afterTaxRealP50 * Math.pow(1 + inputs.expectedInflation / 100, years)
      ),
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

/**
 * The forces acting on a rupee, in the order a reader meets them. ONE
 * definition, consumed by every surface that shows them.
 *
 * Rahul, 16 Aug: "are we operating in silos, why is an update in one part of
 * the SIP engine not updating the same thing in the other part?"
 *
 * He was right and the evidence was on the page. The fund fee was added to
 * rung 4's chain and not to rung 2's, so the two rungs printed 6.7% and 6.9%
 * for the identical quantity - dd-013, introduced while fixing dd-013's cousin
 * one rung at a time. There was never a second engine; there were two hand-
 * written copies of the same four-line derivation in two components, and a new
 * force had to be carried to each by hand.
 *
 * So the rule this function exists to enforce: a cost is added HERE, once, and
 * every rung that renders the chain picks it up without being touched. If a
 * future force (an exit load, a platform charge) needs a row, it is added to
 * this return value and the rungs inherit it.
 *
 * Everything compounds; nothing subtracts. 13.3 - 0.2 - 6 gives 7.1 and the
 * true answer is 6.7, which is why the rungs carry a caption saying so.
 */
export interface RealRateChain {
  /** What the market does, before any cost. % a year. */
  growth: number;
  /** The fund's fee. % a year, positive - the view renders the minus sign. */
  fee: number;
  /** What prices do. % a year, positive - likewise. */
  inflation: number;
  /** Growth once the fund has been paid. % a year. */
  afterFee: number;
  /** What is genuinely left, after the fee and after inflation. % a year. */
  real: number;
  /** The share of a year's growth the saver keeps. Exposed for tests. */
  keptAfterFee: number;
}

export function realRateChain(
  inputs: SipInputs,
  growthPct: number = inputs.expectedReturn
): RealRateChain {
  // Twelve monthly charges, matching how the engine actually levies it, so the
  // rate a rung prints and the simulation beneath it describe one world.
  const keptAfterFee = Math.pow(1 - inputs.expenseRatio / 100 / 12, 12);
  const afterFeeFactor = (1 + growthPct / 100) * keptAfterFee;
  return {
    growth: growthPct,
    fee: inputs.expenseRatio,
    inflation: inputs.expectedInflation,
    afterFee: (afterFeeFactor - 1) * 100,
    real: (afterFeeFactor / (1 + inputs.expectedInflation / 100) - 1) * 100,
    keptAfterFee,
  };
}

export interface SipGrowthPoint {
  /** Assumed equity growth before any cost, %. What the market does. */
  growth: number;
  /**
   * What is left of that growth after the fund has taken its fee, %.
   *
   * The engine has charged this since sol-033, so the rung was quoting a real
   * rate its own simulation no longer used - a headline figure and the maths
   * underneath it disagreeing on one screen (dd-009, dd-013).
   */
  afterFee: number;
  /** After the fee AND after inflation, %. Compounded, never subtracted. */
  real: number;
  /** Median ending wealth in today's money at this assumption. Reader's view. */
  endReal: number;
  /** The same, BEFORE the tax due on selling up. Always present. */
  endRealPreTax: number;
  /** The same, AFTER that tax. Always present, whichever view is selected. */
  endRealPostTax: number;
  /** Odds of reaching the goal, 0..1. Reader's view. */
  odds: number;
  /** Odds once the tax on selling up is paid. The honest one. */
  oddsAfterTax: number;
}

export interface SipGrowthCurve {
  points: SipGrowthPoint[];
  /** Lowest growth on the track at which the typical path still gets there. */
  breakeven: number | null;
  /** Where the reader's own assumption sits, so the track can mark it. */
  readerGrowth: number;
  /** The fund's fee, % a year. Constant across the track - it is not a forecast. */
  expenseRatio: number;
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
  sims = 300,
  /**
   * The page's own full-fidelity run, if the caller has one.
   *
   * The sweep uses a few hundred paths per point because thirty points at ten
   * thousand each would take seconds. That is fine for the SHAPE and for the
   * boundary, and it was not fine for the anchor: at the reader's own growth
   * the sweep printed Rs 90.0 lakh while the Answer above printed Rs 89.1 lakh
   * for the same plan, because they had drawn different numbers of paths. One
   * quantity, two values (dd-013). The anchor point is replaced by the real run
   * when it is available, so the figure the reader checks against the headline
   * is the headline's own.
   */
  anchorRun: any = null
): SipGrowthCurve {
  // The share of a year's growth the reader keeps once the fund has been paid.
  // Twelve monthly charges, matching the engine exactly rather than
  // approximately - a rung whose stated rate is a rounding away from the
  // simulation beneath it is the same defect as one that ignores the fee.

  // Anchor the grid on the reader's OWN assumption so it lands exactly on a
  // computed point.
  //
  // The planner recorded this lesson on its protection track and it had not
  // reached here: with a grid of 4.0, 4.5 ... 13.5, a shipped assumption of
  // 13.3% put the slider thumb at 13.5 while every readout beside it said 13.3.
  // The control and the number disagreeing on screen is small, invisible in
  // code, and corrosive - it is the reader's first evidence that the tool is
  // approximate. Shifting the grid costs nothing: the same number of points,
  // moved so that one of them is the reader's.
  const anchor = Math.min(max, Math.max(min, inputs.expectedReturn));
  const below = Math.ceil((anchor - min) / step);
  const gridMin = Math.round((anchor - below * step) * 10) / 10;
  const span = Math.ceil((max - gridMin) / step);
  const gridMax = Math.round((gridMin + span * step) * 10) / 10;

  const points: SipGrowthPoint[] = [];
  for (let g = gridMin; g <= gridMax + 1e-9; g += step) {
    const growth = Math.round(g * 10) / 10;
    const chain = realRateChain(inputs, growth);
    const r = simulate(inputs, {
      equityReturn: growth, numSims: sims, seed: SEARCH_SEED,
    });
    points.push({
      growth,
      // The ratio, not the difference: 12% against 6% leaves 5.66%, and over
      // twenty years treating it as 6% compounds into a large error.
      // Three forces in the order the reader meets them, and each one is a
      // MULTIPLICATION rather than a subtraction. The fee is charged monthly on
      // the balance, exactly as the engine charges it, so this rate and the
      // simulation beside it describe the same world.
      afterFee: chain.afterFee,
      real: chain.real,
      endReal: r.final.realNet.p50,
      // Both frames, from the SAME run and the same median path, so the two
      // rows of the rung reconcile with each other and with the flow rung's
      // tax line rather than merely looking plausible together (dd-006).
      endRealPreTax: r.final.grossRealFinal,
      endRealPostTax: r.final.afterTaxRealP50,
      odds: r.final.reachedTarget ?? 0,
      oddsAfterTax: r.final.reachedTargetAfterTax ?? 0,
    });
  }
  // Replace the anchor with the full-fidelity figures before anything is read
  // off the curve, so the breakeven is computed against the same series the
  // reader sees.
  if (anchorRun) {
    const anchorPoint = points.find((p) => p.growth === anchor);
    if (anchorPoint) {
      anchorPoint.endReal = anchorRun.final.realNet.p50;
      anchorPoint.endRealPreTax = anchorRun.final.grossRealFinal;
      anchorPoint.endRealPostTax = anchorRun.final.afterTaxRealP50;
      anchorPoint.odds = anchorRun.final.reachedTarget ?? anchorPoint.odds;
      anchorPoint.oddsAfterTax =
        anchorRun.final.reachedTargetAfterTax ?? anchorPoint.oddsAfterTax;
    }
  }

  const crossing = points.find((p) => p.odds >= TYPICAL_ODDS);
  return {
    points,
    breakeven: crossing ? crossing.growth : null,
    readerGrowth: inputs.expectedReturn,
    expenseRatio: inputs.expenseRatio,
    min: gridMin,
    max: gridMax,
    step,
  };
}

// --- Rung 5: the same bad years, moved ---------------------------------------

export interface SipSequencePoint {
  /** Year the bad run begins. */
  startYear: number;
  /** Year it ends - the moment the reader looks at the damage. */
  endYear: number;
  /**
   * THE LIVED FIGURE (dd-010). At the moment the bad run ends, the savings are
   * worth what they were worth in some earlier year of the same plan without
   * it. This is the distance back: "five years of saving, gone."
   *
   * Chosen after the obvious metric failed. The first attempt was the delay to
   * the goal - how many years later you arrive - and it collapsed to "never" on
   * the page's own shipped plan, which does not reach its goal even without a
   * crash. A headline that goes blank on the default inputs is not a headline.
   * This one is always defined, always concrete, and is the direct mirror of
   * the planner's cushion-in-years.
   */
  setbackYears: number;
  /** What the plan is worth at the reader's own horizon, today's money. */
  endReal: number;
  /** The same, as a share of the smooth plan's ending wealth, 0..1. */
  vsSmooth: number;
}

export interface SipSequenceProfile {
  /** How many consecutive bad years this profile assumes. */
  durationYears: number;
  points: SipSequencePoint[];
  /** Identical across every point in the profile, by construction. */
  averageReturn: number;
  /** Least and most damaging placement. Named, not left for the view to find. */
  best: SipSequencePoint;
  worst: SipSequencePoint;
}

export interface SipSequenceRisk {
  profiles: SipSequenceProfile[];
  /** The smooth world's ending wealth, today's money - this rung's zero point. */
  smoothEndReal: number;
  /** Stated so the screen can say why the average is not the assumption (dd-009). */
  normalReturn: number;
  crashPct: number;
  horizonYears: number;
  /** Durations offered, shortest first. */
  durations: number[];
}

/**
 * The same bad years, moved - and the mirror of the planner's rung 4.
 *
 * Sequence-of-returns risk points the OTHER WAY for someone saving, and that
 * inversion is the whole reason this screen exists. A retiree is ruined by a
 * crash EARLY: they are forced to sell units cheap that can never be bought
 * back. A saver is barely scratched by an early crash - the pot is small, and
 * every instalment for the next twenty years buys in at the lower price. What
 * costs a saver is a crash LATE, when the pot is at its largest and there are
 * no contributions left to buy the recovery with.
 *
 * The intuition nearly everyone arrives with - "a crash is bad" - is not wrong
 * so much as undated, and the date decides whether it costs a few months or
 * half a decade.
 *
 * Held fixed exactly as the planner holds it: `duration` bad years and the rest
 * at the expected rate, permuting only WHERE the run falls. The arithmetic mean
 * over the reader's horizon is therefore identical within a profile by
 * construction, not by approximation, which is what makes this a proof rather
 * than an anecdote.
 *
 * Deterministic, through the same engine, on the fixed-sequence path added for
 * it (dd-013). A Monte Carlo would blur the very effect being isolated, and a
 * second deterministic walk beside the engine is how the LTCG double-charge
 * came to need fixing twice on the planner.
 */
export function sequenceRisk(
  inputs: SipInputs,
  crashPct = -30,
  durations = [1, 2, 3]
): SipSequenceRisk {
  const years = inputs.horizonYears;
  const normal = inputs.expectedReturn;

  /** One fixed-sequence run: the whole real-money curve, year by year. */
  const walk = (returnsPct: number[]): number[] => {
    const r = simulate(inputs, {
      horizonYears: years,
      numSims: 1,
      equityVolatility: 0,
      equityReturnsByYear: returnsPct.map((x) => x / 100),
    });
    return r.final.p50RealNet ?? r.p50Real;
  };

  // The smooth world: no bad years anywhere. This rung's own zero point, and it
  // is printed on the screen rather than left implicit - the Answer above
  // quotes a median drawn from a ROUGH world, and two frames on one page with
  // nothing saying so is dd-004 and, at worst, dd-013.
  const smooth = walk(Array.from({ length: years }, () => normal));

  /**
   * Which year of the smooth plan this balance belongs to, interpolated.
   * The setback is then just how far that is behind where the reader stands.
   */
  const smoothYearOf = (balance: number): number => {
    if (balance <= (smooth[0] ?? 0)) return 0;
    for (let y = 1; y <= years; y++) {
      const lo = smooth[y - 1] ?? 0;
      const hi = smooth[y] ?? 0;
      if (balance <= hi) {
        return hi > lo ? y - 1 + (balance - lo) / (hi - lo) : y;
      }
    }
    return years;
  };

  const profiles: SipSequenceProfile[] = durations
    .filter((d) => d >= 1 && d <= years)
    .map((duration) => {
      const points: SipSequencePoint[] = [];
      for (let startYear = 1; startYear <= years - duration + 1; startYear++) {
        const endYear = startYear + duration - 1;
        const returns = Array.from({ length: years }, (_, i) => {
          const y = i + 1;
          return y >= startYear && y < startYear + duration ? crashPct : normal;
        });
        const curve = walk(returns);
        const atEnd = curve[endYear] ?? 0;
        points.push({
          startYear,
          endYear,
          setbackYears: Math.max(0, endYear - smoothYearOf(atEnd)),
          endReal: curve[years] ?? 0,
          vsSmooth: (smooth[years] ?? 0) > 0 ? (curve[years] ?? 0) / (smooth[years] ?? 1) : 0,
        });
      }
      return {
        durationYears: duration,
        points,
        averageReturn: ((years - duration) * normal + duration * crashPct) / years,
        best: points.reduce((a, b) => (b.setbackYears < a.setbackYears ? b : a)),
        worst: points.reduce((a, b) => (b.setbackYears > a.setbackYears ? b : a)),
      };
    });

  return {
    profiles,
    smoothEndReal: smooth[years] ?? 0,
    normalReturn: normal,
    crashPct,
    horizonYears: years,
    durations: profiles.map((p) => p.durationYears),
  };
}

// --- Rung 6: what protection costs -------------------------------------------

export interface SipProtectionPoint {
  /** Market roughness - the annual spread of returns, %. */
  roughness: number;
  /** Share of years the floor binds, 0..1. Closed form, not sampled. */
  bindFrequency: number;
  /** One year in this many ends below the floor. */
  oneYearIn: number;
  /** Average annual payout, % of the insured sleeve. Closed form. */
  payout: number;
  /** The premium, %. Constant across the track, and that is the lesson. */
  premium: number;
  /** payout - premium, %. Negative means it loses money on average. */
  net: number;

  // What the reader actually lives through, in the situation the floor exists
  // for. Out of 100 futures, how many finished short of the goal (dd-012).
  missedUnprotected: number;
  missedProtected: number;
  /** The worst 1-in-10 futures: ending wealth in today's money. The verdict. */
  p10Unprotected: number;
  p10Protected: number;
  /** The typical future, where the premium is pure cost. Shown, never hidden. */
  p50Unprotected: number;
  p50Protected: number;
}

export interface SipProtectionCurve {
  points: SipProtectionPoint[];
  termMonths: number;
  floor: number;
  premium: number;
  /** Black-Scholes value at the roughness actually realised, annualised %. */
  fairValueAtReaderRoughness: number;
  markupAtReaderRoughness: number;
  /**
   * Lowest roughness from which protection never again leaves more savers
   * short. Null when it never earns its price anywhere on the track.
   */
  breakeven: number | null;
  /** Where the reader's own assumption sits, so the track can mark it. */
  readerRoughness: number;
  /**
   * Three consecutive floored years, compounded. An annual floor resets, so
   * -10% three times running is not -10%, and the reader learns that from us
   * rather than discovering it in 2027 (dd-012).
   */
  consecutiveThreeYearLoss: number;
  min: number;
  max: number;
  step: number;
}

/** Standard normal CDF, Abramowitz-Stegun. */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 +
      t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

/**
 * What protection costs a saver, and what it is worth, across the range of
 * markets they might have to face.
 *
 * The dd-012 pattern, inherited from the planner's rung 5 and NOT its
 * arithmetic. That screen leads with retirements ruined; this one leads with
 * the worst one-in-ten futures and how many savers finished short of the goal,
 * because those are the situations a floor exists for. An average taken over
 * all ten thousand futures would judge the contract by the one measure it was
 * never built to move, and would read as an argument against it.
 *
 * The premium is FIXED at whatever the contract prices at the reader's own
 * roughness, and then held across the whole track. That asymmetry - a certain
 * price against an uncertain payout - is the whole subject reduced to one
 * comparison (dd-005). Re-pricing at every position was tried on the planner
 * and destroyed the screen: cost rose in step with benefit and it stopped
 * saying anything.
 *
 * Frequency and payout are closed form rather than sampled, so they are
 * traceable arithmetic and do not jitter between drags (dd-008). The formula
 * differs from the planner's on purpose: swpWorker draws an ANNUAL NORMAL
 * return, while this engine compounds twelve LOGNORMAL months. The annual log
 * return is therefore N(mu - sigma^2/2, sigma^2), so for a floor K the binding
 * share is Phi(d) with d = (ln(1+K) - m)/sigma, and the expected shortfall is
 * (1+K)Phi(d) - e^mu Phi(d - sigma). Using the planner's normal-model formula
 * here would have been a figure that quietly disagreed with the simulation
 * beside it.
 */
export function protectionCurve(
  inputs: SipInputs,
  min = 8,
  max = 32,
  step = 1,
  sims = 400,
  termMonths = 12
): SipProtectionCurve {
  const floor = inputs.hedgingFloorLimit ?? -10;
  const term = Math.max(1, Math.min(12, Math.round(termMonths)));
  const rollsPerYear = 12 / term;
  const k = Math.log(1 + floor / 100);

  // Priced ONCE, at the reader's own assumption. You buy the contract today, at
  // today's implied volatility; what the market subsequently does cannot change
  // what you paid. The floor and the term are things the reader chooses before
  // buying, so those do move the price. Roughness is not.
  const quote = pricePut(floor, inputs.annualVolatility, term);
  const premium = quote.annual;

  const points: SipProtectionPoint[] = [];
  for (let r = min; r <= max + 1e-9; r += step) {
    const roughness = Math.round(r * 10) / 10;

    const mu = inputs.expectedReturn / 100 / rollsPerYear;
    const sigma = roughness / 100 / Math.sqrt(rollsPerYear);
    const m = mu - 0.5 * sigma * sigma;
    const d = (k - m) / sigma;
    const bindFrequency = normalCdf(d);
    const shortfall =
      (1 + floor / 100) * normalCdf(d) - Math.exp(mu) * normalCdf(d - sigma);
    const payout = Math.max(0, shortfall) * 100 * rollsPerYear;

    const at = { annualVolatility: roughness };
    // Both runs on the same seed and the same paths, so every difference
    // between the columns is the floor and nothing else.
    const common = { numSims: sims, seed: SEARCH_SEED, equityVolatility: roughness };
    const u = simulate({ ...inputs, ...at, bsEnabled: false }, {
      ...common, bsEnabled: false, annualHedgingDragCost: 0,
    });
    const h = simulate({ ...inputs, ...at, bsEnabled: true }, {
      ...common,
      bsEnabled: true,
      hedgingFloorLimit: floor,
      annualHedgingDragCost: (premium / 100) * inputs.eqPct,
    });

    points.push({
      roughness,
      bindFrequency,
      oneYearIn: bindFrequency > 0 ? Math.round(1 / bindFrequency) : Infinity,
      payout,
      premium,
      net: payout - premium,
      missedUnprotected: (1 - (u.final.reachedTarget ?? 0)) * 100,
      missedProtected: (1 - (h.final.reachedTarget ?? 0)) * 100,
      p10Unprotected: u.final.realNet.p10,
      p10Protected: h.final.realNet.p10,
      p50Unprotected: u.final.realNet.p50,
      p50Protected: h.final.realNet.p50,
    });
  }

  // The boundary is defined on the quantity the SCREEN headlines - what you are
  // left with in the worst one in ten futures - and not on the analytic average
  // payout, and not on the count of savers who fall short.
  //
  // All three were computed and they genuinely disagree. On the shipped plan the
  // average payout never covers the premium anywhere on the track; the count
  // falling short gets WORSE with protection until about 25% roughness and then
  // better; the worst decile turns positive at 20%. All three are right, because
  // they measure different things - and shipping more than one would put a
  // contradiction in front of the reader, which is dd-012's fourth rule. The
  // worst decile is chosen because it is the only one of the three the reader
  // can picture a single concrete instance of: it is rupees, in their hand, in a
  // bad future.
  //
  // Taken as the first point from which protection never falls behind again, so
  // one noisy sample near the crossing cannot move it.
  const crossing = points.find((_, i) =>
    points.slice(i).every((q) => q.p10Protected >= q.p10Unprotected)
  );

  return {
    points,
    breakeven: crossing ? crossing.roughness : null,
    floor,
    premium,
    termMonths: term,
    fairValueAtReaderRoughness: quote.fairValue,
    markupAtReaderRoughness: quote.markup,
    readerRoughness: inputs.annualVolatility,
    consecutiveThreeYearLoss: (Math.pow(1 + floor / 100, 3) - 1) * 100,
    min,
    max,
    step,
  };
}
