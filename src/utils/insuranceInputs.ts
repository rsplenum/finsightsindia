import { parseFormattedNumber } from './formatters';
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
 */

/** The form's field ids. */
const F = {
  premium: 'inPremium',
  ppt: 'inPPT',
  payoutStart: 'inPayoutStart',
  payoutYears: 'inPayoutYears',
  payout: 'inPayout',
  maturity: 'inMaturity',
  inflation: 'inInflation',
  unbundle: 'unbundleToggle',
  termCover: 'inTermCover',
  accidentCover: 'inAccidentCover',
  termCost: 'inTermCostOverride',
  accidentCost: 'inAccidentCostOverride',
} as const;

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

/**
 * Open-market term cover, per ₹1 crore of sum assured, per year, and the same
 * for an accident rider. Estimates for a healthy non-smoker in their thirties;
 * the reader can override both under Advanced, which is what the override
 * fields are for.
 */
export const TERM_COST_PER_CRORE = 12000;
export const ACCIDENT_COST_PER_CRORE = 10000;

const el = (id: string) => document.getElementById(id) as HTMLInputElement | null;

const money = (id: string, fallback: number): number =>
  parseFormattedNumber(el(id)?.value ?? '') || fallback;

const int = (id: string, fallback: number): number => {
  const v = parseInt(el(id)?.value ?? '', 10);
  return Number.isFinite(v) && v !== 0 ? v : fallback;
};

const num = (id: string, fallback: number): number => {
  const v = parseFloat(el(id)?.value ?? '');
  return Number.isFinite(v) && v !== 0 ? v : fallback;
};

/** Read the one true input set. Every surface on the page goes through this. */
export function readPolicyInputs(now: Date = new Date()): PolicyInputs {
  const unbundle = el(F.unbundle)?.checked ?? true;

  return {
    premium: money(F.premium, 100000),
    ppt: int(F.ppt, 10),
    payoutStartYear: int(F.payoutStart, 11),
    payoutYears: int(F.payoutYears, 20),
    payoutAmount: money(F.payout, 120000),
    maturityBenefit: parseFormattedNumber(el(F.maturity)?.value ?? '') || 1000000,
    inflationRate: num(F.inflation, 6.0),
    safeRate: SAFE_RATE_PCT,
    equityRate: EQUITY_RATE_PCT,
    // With the toggle off, the reader is asking what the premium alone would do
    // if invested - no cover bought, no cover paid for. The comparison is then
    // deliberately unfair to the policy, and the page says so.
    termCost: unbundle ? money(F.termCost, 0) : 0,
    accidentCost: unbundle ? money(F.accidentCost, 0) : 0,
    ltcgRatePct: LTCG_RATE_PCT,
    ltcgExemption: LTCG_EXEMPTION,
    startDate: now,
  };
}

/** Is the reader unbundling? The engine sees this only as a cost of zero. */
export function isUnbundling(): boolean {
  return el(F.unbundle)?.checked ?? true;
}

/**
 * Price the cover the reader typed, and put it in the override fields.
 *
 * A DOM writer, so it lives beside the reader rather than in the page - the
 * same place `syncEntryFromAdvanced` lives on the SIP page, for the same
 * reason.
 */
export function syncRiskCostsFromCover(): void {
  const termCover = parseFormattedNumber(el(F.termCover)?.value ?? '') || 0;
  const accidentCover = parseFormattedNumber(el(F.accidentCover)?.value ?? '') || 0;

  const termCostEl = el(F.termCost);
  const accidentCostEl = el(F.accidentCost);

  if (termCostEl) {
    termCostEl.value = Math.round(costForCover(termCover, TERM_COST_PER_CRORE)).toLocaleString(
      'en-IN'
    );
  }
  if (accidentCostEl) {
    accidentCostEl.value = Math.round(
      costForCover(accidentCover, ACCIDENT_COST_PER_CRORE)
    ).toLocaleString('en-IN');
  }
}

/** Annual premium for a given sum assured, at a given rate per crore. */
export function costForCover(cover: number, ratePerCrore: number): number {
  return (cover / 10000000) * ratePerCrore;
}
