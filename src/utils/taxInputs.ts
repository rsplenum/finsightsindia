import { parseFormattedNumber } from './formatters';
import type { BusinessInput, HousePropertyInput, TaxInput } from './tax';

/**
 * The tax calculator's one DOM reader.
 *
 * Same job, and the same reason, as `plannerInputs.ts`, `sipInputs.ts` and
 * `insuranceInputs.ts`: the engine must never know that a form exists, and
 * nothing else on the page may read a field.
 *
 * WHY NOW, WHEN NOTHING IS BROKEN. This page has one surface today, so its
 * eleven inline field reads cannot yet disagree with anything - there is no
 * second reader to disagree WITH. That is the whole point. sol-026 was found
 * from the screen, at a factor of five, because the planner grew its second
 * surface while the reads were still scattered; sol-039 caught the same shape on
 * the insurance page one surface earlier, where the frictions card defaulted the
 * premium independently of the analysis it sat beside. Every remaining T6 item -
 * the income heads, capital gains, presumptive, losses, the disclosure - adds a
 * surface. The reader goes in before them, not after the first disagreement.
 *
 * It is deliberately boring. Its only job is to be the ONLY DOM reader.
 */

/** The form's field ids. Nothing outside this file names a field. */
const F = {
  grossSalary: 'inGrossSalary',
  otherIncome: 'inOtherIncome',
  ageBracket: 'inAgeBracket',

  basicSalary: 'inBasicSalary',
  hraReceived: 'inHraReceived',
  rentPaid: 'inRentPaid',
  isMetro: 'inIsMetro',

  sec80c: 'inSec80c',
  sec80d: 'inSec80d',
  sec80ccd1b: 'inSec80ccd',

  // Head 2 - house property. `inHomeLoan` keeps its id because it is the same
  // question the reader was always being asked; what changed is where the
  // answer goes. It used to be deducted from gross total income like a
  // Chapter VI-A item. It is s.24(b) interest, and it belongs to a head.
  hpKind: 'inHpKind',
  hpRent: 'inHpRent',
  hpMunicipalTaxes: 'inHpMunicipalTaxes',
  hpInterest: 'inHomeLoan',

  // Head 3 - business or profession. Both presumptive bases are always costed
  // by the engine, so the page can show the election rather than hide it.
  businessProfit: 'inBusinessProfit',
  businessTurnover: 'inBusinessTurnover',
  businessReceipts: 'inProfessionalReceipts',
  businessDigitalShare: 'inBusinessDigitalShare',
  businessBasis: 'inBusinessBasis',

  // Head 4 - capital gains, split by the RATE that applies rather than by the
  // asset, because the rate is all the arithmetic cares about. The chip opens
  // with the first two; the other two are one layer deeper (see
  // TaxAnswer.checks.md).
  cgStcg111A: 'inCgStcgEquity',
  cgLtcg112A: 'inCgLtcgEquity',
  cgLtcg112: 'inCgLtcgOther',
  cgStcgSlab: 'inCgStcgOther',
} as const;

/**
 * Every money field on this page, in the order the form asks for them.
 *
 * Exported because the page has to bind change handlers to exactly this set,
 * and a list of ids maintained twice is a list that will disagree with itself.
 * Today's page keeps its own literal array and it is already missing nothing
 * only by luck.
 */
export const MONEY_FIELD_IDS: readonly string[] = [
  F.grossSalary,
  F.otherIncome,
  F.basicSalary,
  F.hraReceived,
  F.rentPaid,
  F.sec80c,
  F.sec80d,
  F.sec80ccd1b,
  F.hpInterest,
  F.hpRent,
  F.hpMunicipalTaxes,
  F.businessProfit,
  F.businessTurnover,
  F.businessReceipts,
  F.cgStcg111A,
  F.cgLtcg112A,
  F.cgLtcg112,
  F.cgStcgSlab,
];

/** The non-money controls, which fire `change` rather than blur. */
export const CHOICE_FIELD_IDS: readonly string[] = [
  F.ageBracket,
  F.isMetro,
  F.hpKind,
  F.businessBasis,
  F.businessDigitalShare,
];

const el = (id: string) => document.getElementById(id) as HTMLInputElement | null;

/**
 * A money field, where A TYPED ZERO IS AN ANSWER and an empty box is not.
 *
 * sol-041: `parseFormattedNumber(field) || fallback` is a coalescing operator
 * wearing a validity check's clothes. It cannot tell "the reader typed 0" from
 * "the field is empty", so on the insurance page a maturity benefit the reader
 * had explicitly set to nothing came back as Rs 10 lakh.
 *
 * There is no live instance of that fault here: every fallback on this page is
 * currently 0, so the two cases genuinely coincide and nothing is being
 * silently overridden. But the trap is one non-zero default away - and a tax
 * form is full of fields that will want one - so the distinction is built in
 * before it is needed rather than after it bites.
 *
 * Unlike the insurance page, which made zero-honouring opt-in for the two
 * fields that needed it, here it is the rule for every money field. On a tax
 * return zero is a legitimate answer to all of them: no other income, no rent,
 * no 80C. There is no field where "the reader typed 0" should mean "use our
 * number instead", so there is no reason to make honouring it a decision.
 */
const money = (id: string, fallback = 0): number => {
  const raw = (el(id)?.value ?? '').trim();
  if (raw === '') return fallback;
  const v = parseFormattedNumber(raw);
  // Negative income or a negative deduction is not a thing the slabs can take.
  // Losses are a separate head with their own set-off rules, not a minus sign
  // in an income box.
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

const AGE_BRACKETS = ['below60', '60_80', 'above80'] as const;
type AgeBracket = (typeof AGE_BRACKETS)[number];

/**
 * Read the select, and only accept a value the engine actually understands.
 *
 * The page used to write `?.value as any || 'below60'`, which types away the
 * one thing worth checking. A renamed option would have reached
 * `computeOldRegimeBaseTax` as an unknown string and fallen through to the
 * below-60 exemption of Rs 2.5 lakh - a senior citizen quietly taxed on an
 * extra Rs 50,000, with nothing on screen to say so.
 */
const ageBracket = (): AgeBracket => {
  const v = (document.getElementById(F.ageBracket) as HTMLSelectElement | null)?.value;
  return (AGE_BRACKETS as readonly string[]).includes(v ?? '') ? (v as AgeBracket) : 'below60';
};

const isMetro = (): boolean =>
  (document.getElementById(F.isMetro) as HTMLSelectElement | null)?.value === 'true';

/** A 0-100 share. Clamped, because a percentage outside it is not an opinion. */
const pct = (id: string, fallback: number): number => {
  const raw = (el(id)?.value ?? '').trim();
  if (raw === '') return fallback;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : fallback;
};

const BUSINESS_BASES = ['books', '44AD', '44ADA'] as const;

/** Which basis the reader elected. The engine costs all of them regardless. */
const businessBasis = (): BusinessInput['basis'] => {
  const v = (document.getElementById(F.businessBasis) as HTMLSelectElement | null)?.value;
  return (BUSINESS_BASES as readonly string[]).includes(v ?? '')
    ? (v as BusinessInput['basis'])
    : 'books';
};

const HP_KINDS = ['none', 'selfOccupied', 'letOut'] as const;

/**
 * Which house property chip is open, if any.
 *
 * Defaults to `selfOccupied` rather than `none` so that the interest field the
 * page has always had keeps working when the chip UI is not yet on the page.
 * The moment the chips ship this reads whatever the reader chose.
 */
const housePropertyKind = (): HousePropertyInput['kind'] => {
  const v = (document.getElementById(F.hpKind) as HTMLSelectElement | null)?.value;
  if ((HP_KINDS as readonly string[]).includes(v ?? '')) return v as HousePropertyInput['kind'];
  return 'selfOccupied';
};

/** Read the one true input set. Every surface on the page goes through this. */
export function readTaxInputs(): TaxInput {
  return {
    grossSalary: money(F.grossSalary),
    otherIncome: money(F.otherIncome),
    ageBracket: ageBracket(),

    basicSalary: money(F.basicSalary),
    hraReceived: money(F.hraReceived),
    rentPaid: money(F.rentPaid),
    isMetro: isMetro(),

    houseProperty: {
      kind: housePropertyKind(),
      annualRent: money(F.hpRent),
      municipalTaxes: money(F.hpMunicipalTaxes),
      interest: money(F.hpInterest),
    },

    business: {
      netProfit: money(F.businessProfit),
      turnover: money(F.businessTurnover),
      professionalReceipts: money(F.businessReceipts),
      // Defaults to fully banked, which is both the common case for anyone
      // filing online and the one that gives the reader the better rate. It is
      // stated on the screen rather than assumed silently.
      digitalSharePct: pct(F.businessDigitalShare, 100),
      basis: businessBasis(),
    },

    capitalGains: {
      stcg111A: money(F.cgStcg111A),
      ltcg112A: money(F.cgLtcg112A),
      ltcg112: money(F.cgLtcg112),
      stcgSlab: money(F.cgStcgSlab),
    },

    // The statutory caps are the engine's business, not the form's. It already
    // applies them, and applying them here as well would be sol-038's shape:
    // one rule, two places, and a cap that changes in one Budget and one file.
    sec80c: money(F.sec80c),
    sec80d: money(F.sec80d),
    sec80ccd1b: money(F.sec80ccd1b),
  };
}
