import { parseFormattedNumber } from './formatters';
import { DEFAULT_FUND_COST, fundCostById } from './fundCosts';
import { LTCG_RATE_PCT, LTCG_EXEMPTION, type PolicyInputs } from './insuranceReplication';

/**
 * The insurance analyser's one DOM reader.
 *
 * Same job, and the same reason, as `plannerInputs.ts` and `sipInputs.ts`: the
 * engine must never know that a form exists, and nothing else on the page may
 * read a field. The analyser had begun to grow the sol-026 fault already - the
 * frictions panel re-read `inPremium` and `inPPT` for itself, with its own
 * fallbacks, so a premium the analysis had defaulted and a premium the GST card
 * had defaulted were two separate decisions that merely happened to agree.
 *
 * REBUILT 18 AUG, and the change that matters most is what is NOT here any
 * more: the fallbacks. Every money field used to fall back to a figure of ours
 * - a Rs 1,00,000 premium, a Rs 1,20,000 income, Rs 10,00,000 at the end - so a
 * reader who had typed nothing at all was shown a confident verdict about a
 * policy nobody owns. Under dd-022 a pre-filled box is worse than an empty one:
 * it is a question the reader must read, check and correct, and if they do not,
 * the answer on the screen is ours wearing their name. Everything now falls
 * back to zero, and `readinessOf()` tells the page what it is still waiting on.
 */

/**
 * What the policy gives back, and when. The one question the page opens on.
 *
 * A dd-020 filter rather than a guess: an endowment plan has no annual income,
 * so "the policy year the income starts" cannot apply to it, and a money-back
 * plan with no terminal bonus has no maturity year. The question removes real
 * questions, which is the only thing that entitles it to be asked at all
 * (dd-020/dont-2).
 */
export type PolicyShape = 'income' | 'lumpSum' | 'both';

export interface ShapeSpec {
  id: PolicyShape;
  label: string;
  /** What this shape is, in the words a policy document uses. */
  hint: string;
}

export const POLICY_SHAPES: ShapeSpec[] = [
  {
    id: 'income',
    label: 'A regular income, later',
    hint: 'Money-back and guaranteed income plans. You pay for some years, then it pays you every year.',
  },
  {
    id: 'lumpSum',
    label: 'One lump sum, at the end',
    hint: 'Endowment and guaranteed savings plans. You pay for some years, then it pays you once.',
  },
  {
    id: 'both',
    label: 'Both — income and a lump sum',
    hint: 'The common hybrid: a yearly income for a period, and a maturity amount when it finishes.',
  },
];

export interface PolicyArchetype {
  id: string;
  name: string;
  popularPlans: string;
  shape: PolicyShape;
  hint: string;
}

export const POLICY_ARCHETYPES: PolicyArchetype[] = [
  {
    id: 'guaranteed_income',
    name: 'Guaranteed Regular Income',
    popularPlans: 'HDFC Sanchay Plus, ICICI Pru GIFT, Tata AIA Fortune Guarantee',
    shape: 'income',
    hint: 'Pay for a fixed term (e.g. 10 yrs), receive guaranteed regular income every year thereafter.',
  },
  {
    id: 'endowment_savings',
    name: 'Endowment / Lump Sum Maturity',
    popularPlans: 'LIC Jeevan Labh, LIC Jeevan Anand, SBI Smart Platina',
    shape: 'lumpSum',
    hint: 'Pay for a set number of years, receive one single lump sum maturity payout at the end.',
  },
  {
    id: 'money_back',
    name: 'Money-Back / Hybrid Plan',
    popularPlans: 'LIC 20-Year Money Back, Max Life Guaranteed Income',
    shape: 'both',
    hint: 'Receive periodic survival payouts during the policy term, plus a final lump sum at maturity.',
  },
];

/** The form's field ids. */
const F = {
  status: 'inPolicyStatus',
  yearsPaid: 'inYearsPaid',
  shape: 'inPolicyShape',
  shapeRestate: 'inPolicyShapeRestate',
  premium: 'inPremium',
  ppt: 'inPPT',
  payoutStart: 'inPayoutStart',
  payoutYears: 'inPayoutYears',
  payout: 'inPayout',
  payoutGrowth: 'inPayoutGrowth',
  maturity: 'inMaturity',
  maturityYear: 'inMaturityYear',
  termCover: 'inTermCover',
  accidentCover: 'inAccidentCover',
  inflation: 'inInflation',
  fundPlan: 'inFundPlan',
  termCost: 'inTermCostOverride',
  accidentCost: 'inAccidentCostOverride',
  slabRate: 'inSlabRate',
} as const;

/** Every id the page has to listen to, so a new field cannot be added and stay dead. */
export const MONEY_FIELD_IDS = [
  F.premium,
  F.payout,
  F.maturity,
  F.termCover,
  F.accidentCover,
  F.termCost,
  F.accidentCost,
] as const;

export const CHOICE_FIELD_IDS = [
  F.status,
  F.yearsPaid,
  F.shape,
  F.shapeRestate,
  F.ppt,
  F.payoutStart,
  F.payoutYears,
  F.payoutGrowth,
  F.maturityYear,
  F.inflation,
  F.fundPlan,
  F.slabRate,
] as const;

/**
 * The slabs the reader may pick from, and the one the form opens on.
 *
 * Rahul, 17 Aug: "ask them to choose a slab. 10, 20, 30." Three rates, not a
 * single conservative assumption - a tool that quietly assumed 30% would tax
 * the DIY route harder than most readers are taxed and hand the win to the
 * policy, which is the same fault as leaving it untaxed, pointing the other way.
 *
 * The default is the MIDDLE one. Any default flatters somebody: 10% flatters
 * DIY, 30% flatters the policy, and dd-021's test is that neither route may be
 * charged something the other is spared. 20% is the only choice here that is
 * not an argument, and the control sits in the open so the reader can correct it.
 */
export const SLAB_RATES_PCT = [10, 20, 30] as const;
export const DEFAULT_SLAB_PCT = 20;

/**
 * The two DIY routes' returns.
 *
 * Typed in, not derived - the same fault as sol-028, and the launch gate lists
 * it as Rahul's to settle. 7.1% is roughly the long bond / PPF neighbourhood and
 * 12% is the equity number the sensitivity table exists to stress. They are
 * named here rather than buried in the arithmetic so that the day they are
 * derived from a series, there is one place to change.
 */
export const SAFE_RATE_PCT = 7.1;
export const EQUITY_RATE_PCT = 12.0;

export const DEFAULT_INFLATION_PCT = 6.0;

/**
 * Open-market term cover, per Rs 1 crore of sum assured, per year, and the same
 * for an accident rider. Estimates for a healthy non-smoker in their thirties,
 * ALL-IN - that is, what actually leaves the bank account, GST included.
 *
 * The all-in reading is stated rather than left implied, because it is what
 * makes the comparison like for like. The premium the reader enters for their
 * policy is gross of GST too, so both sides of the subtraction are the money
 * that really moves. Quoting the cover ex-GST and the policy gross would have
 * spared the do-it-yourself route a tax the policy pays - dd-021/do-5 - and the
 * asymmetry would have been invisible, because neither figure would have looked
 * wrong on its own.
 */
export const TERM_COST_PER_CRORE = 12000;
export const ACCIDENT_COST_PER_CRORE = 10000;

const el = (id: string) =>
  typeof document !== 'undefined'
    ? (document.getElementById(id) as HTMLInputElement | null)
    : null;

const raw = (id: string): string => (el(id)?.value ?? '').trim();

/**
 * A money field, with NO fallback of ours.
 *
 * Empty reads as zero, and zero is a real answer here: a policy with no
 * terminal bonus, or no accident rider, has one. What the page must never do is
 * treat zero as "not answered" - `readinessOf()` below asks the DOM whether the
 * box is empty, which is a different question and the only one that can tell
 * them apart (sol-041).
 */
const money = (id: string): number => {
  const v = parseFormattedNumber(raw(id));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

const int = (id: string): number => {
  const v = parseInt(raw(id), 10);
  return Number.isFinite(v) ? v : 0;
};

const num = (id: string, fallback: number): number => {
  const v = parseFloat(raw(id));
  return Number.isFinite(v) ? v : fallback;
};

/**
 * The reader's slab, accepted only if it is one we offer.
 *
 * `Number(value) || DEFAULT` would have been the short way and it is the sol-041
 * shape in a percentage's clothes: a renamed option would fall through to 20%
 * and quietly retax the route this page argues for, with nothing on screen to
 * say so.
 */
const slabRate = (): number => {
  const v = Number((el(F.slabRate) as HTMLSelectElement | null)?.value);
  return (SLAB_RATES_PCT as readonly number[]).includes(v) ? v : DEFAULT_SLAB_PCT;
};

/** Which shape the reader picked, or null before they have. */
export function policyShape(): PolicyShape | null {
  const v = (el(F.shape) as HTMLSelectElement | null)?.value ?? '';
  return POLICY_SHAPES.some((s) => s.id === v) ? (v as PolicyShape) : null;
}

/** Does this shape pay a yearly income? */
export const hasIncome = (shape: PolicyShape | null) => shape === 'income' || shape === 'both';
/** Does this shape pay a lump sum at the end? */
export const hasLumpSum = (shape: PolicyShape | null) => shape === 'lumpSum' || shape === 'both';

/** What the fund charges, from the same catalogue the SIP and SWP pages use. */
export function fundPlan() {
  return fundCostById((el(F.fundPlan) as HTMLSelectElement | null)?.value ?? DEFAULT_FUND_COST.id);
}

/**
 * The questions this policy shape needs answered, in the order they are asked.
 *
 * This is the spine, and it is DATA rather than a sequence of `if`s scattered
 * through the page, so that the form, the readiness note and the reader's
 * progress cannot disagree about which question is next - dd-013/dont-2 applied
 * to a piece of state rather than to a figure.
 */
export interface SpineStep {
  /** The field this step is waiting on. */
  field: string;
  /** What the working panel says while it waits. */
  waitingFor: string;
}

export function isExistingPolicy(): boolean {
  return (el(F.status) as HTMLSelectElement | null)?.value === 'existing';
}

export function spineFor(shape: PolicyShape | null): SpineStep[] {
  if (!shape) return [];

  const steps: SpineStep[] = [
    { field: F.premium, waitingFor: 'what you pay for this policy each year' },
    { field: F.ppt, waitingFor: 'how many years you pay it for' },
  ];

  if (isExistingPolicy()) {
    steps.push({ field: F.yearsPaid, waitingFor: 'how many annual premiums you have paid so far' });
  }

  if (hasIncome(shape)) {
    steps.push(
      { field: F.payout, waitingFor: 'the income the policy pays you each year' },
      { field: F.payoutStart, waitingFor: 'the policy year that income starts' },
      { field: F.payoutYears, waitingFor: 'how many years the income runs for' }
    );
  }

  if (hasLumpSum(shape)) {
    steps.push({ field: F.maturity, waitingFor: 'the lump sum it pays at the end' });
    // A policy paying ONLY a lump sum has to say when. Where there is also an
    // income, the maturity lands in the last income year and asking again would
    // be a question that removes nothing (dd-020/dont-2).
    if (shape === 'lumpSum') {
      steps.push({ field: F.maturityYear, waitingFor: 'the policy year it pays out' });
    }
  }

  steps.push(
    { field: F.termCover, waitingFor: 'the life cover this policy carries' },
    { field: F.slabRate, waitingFor: 'the income tax slab you are in' }
  );

  return steps;
}

export interface Readiness {
  shape: PolicyShape | null;
  /** Every step, in order. */
  steps: SpineStep[];
  /** Steps whose field the reader has actually filled in. */
  answered: number;
  /** The first unanswered step, or null when the spine is complete. */
  next: SpineStep | null;
  complete: boolean;
}

/**
 * How far through the policy the reader is.
 *
 * ANSWERED MEANS THE BOX IS NOT EMPTY, not that the value is non-zero. A
 * maturity benefit of nil is an answer about a policy that has no terminal
 * bonus; treating it as unanswered would stall the form on a question the
 * reader had already given us (sol-041, in the readiness layer this time).
 */
export function readinessOf(): Readiness {
  const shape = policyShape();
  const steps = spineFor(shape);

  let answered = 0;
  let next: SpineStep | null = null;

  for (const step of steps) {
    if (raw(step.field) !== '') {
      answered++;
    } else {
      next = step;
      break;
    }
  }

  return { shape, steps, answered, next, complete: shape !== null && next === null };
}

/** Read the one true input set. Every surface on the page goes through this. */
export function readPolicyInputs(now: Date = new Date()): PolicyInputs {
  const shape = policyShape();
  const sumAssured = money(F.termCover);

  // The shape decides which fields reach the engine, and it is the ONLY place
  // that mapping happens. A pure endowment is one payout in one year: the
  // engine's payout window collapses to a single year and the income is nil,
  // which is the same walk rather than a second one (sol-038's rule).
  const incomeYears = hasIncome(shape) ? int(F.payoutYears) : 1;
  const startYear = hasIncome(shape) ? int(F.payoutStart) : int(F.maturityYear);

  const yearsPaid = int(F.yearsPaid);

  return {
    premium: money(F.premium),
    ppt: int(F.ppt),
    payoutStartYear: startYear,
    payoutYears: incomeYears,
    payoutAmount: hasIncome(shape) ? money(F.payout) : 0,
    payoutGrowthPct: hasIncome(shape) ? num(F.payoutGrowth, 0) : 0,
    maturityBenefit: hasLumpSum(shape) ? money(F.maturity) : 0,
    sumAssured,
    inflationRate: num(F.inflation, DEFAULT_INFLATION_PCT),
    safeRate: SAFE_RATE_PCT,
    equityRate: EQUITY_RATE_PCT,
    equityFeePct: fundPlan().expenseRatio,
    termCost: money(F.termCost),
    accidentCost: money(F.accidentCost),
    slabRatePct: slabRate(),
    ltcgRatePct: LTCG_RATE_PCT,
    ltcgExemption: LTCG_EXEMPTION,
    startDate: now,
    currentPolicyYear: yearsPaid > 0 ? yearsPaid : 0,
    premiumsPaidSoFar: yearsPaid > 0 ? yearsPaid : 0,
  };
}

/**
 * Price the cover the reader typed, and put it in the override fields.
 *
 * A DOM writer, so it lives beside the reader rather than in the page - the
 * same place `syncEntryFromAdvanced` lives on the SIP page, for the same
 * reason.
 *
 * It will not overwrite a figure the reader has typed for themselves: once the
 * override has been edited by hand it is their number, and replacing it because
 * they adjusted the sum assured afterwards would be the page arguing with them.
 */
export function syncRiskCostsFromCover(): void {
  const termCover = money(F.termCover);
  const accidentCover = money(F.accidentCover);

  const write = (id: string, value: number) => {
    const target = el(id);
    if (!target || target.dataset.edited === 'true') return;
    target.value = Math.round(value).toLocaleString('en-IN');
  };

  write(F.termCost, costForCover(termCover, TERM_COST_PER_CRORE));
  write(F.accidentCost, costForCover(accidentCover, ACCIDENT_COST_PER_CRORE));
}

/** Annual premium for a given sum assured, at a given rate per crore. */
export function costForCover(cover: number, ratePerCrore: number): number {
  return (cover / 10000000) * ratePerCrore;
}
