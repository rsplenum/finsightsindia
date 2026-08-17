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
  slabRate: 'inSlabRate',
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
/**
 * The slabs the reader may pick from, and the one the form opens on.
 *
 * Rahul, 17 Aug: "ask them to choose a slab. 10, 20, 30." Three rates, not a
 * single conservative assumption — a tool that quietly assumed 30% would tax
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

/**
 * For the fields where ZERO IS AN ANSWER, not an empty box.
 *
 * `parseFormattedNumber(...) || fallback` cannot tell "the reader typed 0" from
 * "the reader typed nothing", so it silently overrode both. The maturity field's
 * own tooltip says "Type 0 if there is no final bonus" - and typing 0 gave you
 * back a Rs 10 lakh terminal bonus you had explicitly said you would not
 * receive, inflating the policy's yield and its real value on a page whose
 * whole purpose is to tell you the policy is worth less than it claims.
 *
 * A blank field still falls back. A typed zero is now honoured.
 */
const moneyAllowingZero = (id: string, fallback: number): number => {
  const raw = (el(id)?.value ?? '').trim();
  if (raw === '') return fallback;
  const v = parseFormattedNumber(raw);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

const int = (id: string, fallback: number): number => {
  const v = parseInt(el(id)?.value ?? '', 10);
  return Number.isFinite(v) && v !== 0 ? v : fallback;
};

const num = (id: string, fallback: number): number => {
  const v = parseFloat(el(id)?.value ?? '');
  return Number.isFinite(v) && v !== 0 ? v : fallback;
};

/** Read the one true input set. Every surface on the page goes through this. */
/**
 * The reader's slab, accepted only if it is one we offer.
 *
 * `Number(value) || DEFAULT` would have been the short way and it is the sol-041
 * shape in a percentage's clothes: a renamed option would fall through to 20%
 * and quietly retax the route this page argues for, with nothing on screen to
 * say so.
 */
const slabRate = (): number => {
  const raw = Number((el(F.slabRate) as HTMLSelectElement | null)?.value);
  return (SLAB_RATES_PCT as readonly number[]).includes(raw) ? raw : DEFAULT_SLAB_PCT;
};

export function readPolicyInputs(now: Date = new Date()): PolicyInputs {
  const unbundle = el(F.unbundle)?.checked ?? true;

  return {
    premium: money(F.premium, 100000),
    ppt: int(F.ppt, 10),
    payoutStartYear: int(F.payoutStart, 11),
    payoutYears: int(F.payoutYears, 20),
    // Both of these can legitimately be zero: a policy that pays only a lump
    // sum at the end has no annual income, and a policy with no terminal bonus
    // has no maturity benefit. Neither is an empty field.
    payoutAmount: moneyAllowingZero(F.payout, 120000),
    maturityBenefit: moneyAllowingZero(F.maturity, 1000000),
    inflationRate: num(F.inflation, 6.0),
    safeRate: SAFE_RATE_PCT,
    equityRate: EQUITY_RATE_PCT,
    // With the toggle off, the reader is asking what the premium alone would do
    // if invested - no cover bought, no cover paid for. The comparison is then
    // deliberately unfair to the policy, and the page says so.
    termCost: unbundle ? money(F.termCost, 0) : 0,
    accidentCost: unbundle ? money(F.accidentCost, 0) : 0,
    slabRatePct: slabRate(),
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
