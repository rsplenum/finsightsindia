import { parseFormattedNumber } from './formatters';
import { CHAPTER_VIA_RULES } from './tax';
import type {
  AgeBracket,
  BusinessInput,
  ChapterVIASection,
  HousePropertyInput,
  LossesInput,
  TaxInput,
} from './tax';
import { DEDUCTIONS, INCOME_SOURCES, type CatalogueEntry } from './taxCatalogue';

/**
 * The tax calculator's one DOM reader.
 *
 * Same job, and the same reason, as `plannerInputs.ts`, `sipInputs.ts` and
 * `insuranceInputs.ts`: the engine must never know that a form exists, and
 * nothing else on the page may read a field.
 *
 * WHY IT IMPORTS THE CATALOGUE, WHEN `tax.ts` MAY NOT. The engine is barred
 * from `taxCatalogue.ts` and a test enforces it, because a category filter must
 * never be able to reach the arithmetic (dd-020/dont-3). The READER is the
 * opposite case: it exists to carry what the form collected to where the engine
 * expects it, and the catalogue is the only place that says where each field's
 * rupees are meant to land.
 *
 * IT SUMS BY TARGET, IT DOES NOT READ ONE ID PER FIELD. Several catalogue
 * entries share one engine field on purpose - salary, pension and arrears are
 * one figure to the slabs; a shop's profit, F&O, intraday, freelance and gig
 * income are one business profit. That is what a head DOES. A reader that took
 * the last field written would drop the others in silence, which is sol-041 on
 * a form with nineteen income sources.
 *
 * AND IT READS `data-active`, NOT PRESENCE. Every eligible field is rendered by
 * the server and hidden until the reader adds it, so presence no longer means
 * anything: a section merely on the page must not read as claimed. The
 * distinction is load-bearing for Chapter VI-A, where a section absent from the
 * map was never claimed and a section standing at zero was claimed as nothing -
 * the same rupees and a different sentence, and the Income Computation panel
 * prints the sentence.
 */

/** The form's own field ids, for the controls no catalogue entry owns. */
const F = {
  ageBracket: 'inAgeBracket',

  // HRA is an exemption computed from four facts rather than a figure the
  // reader states, so it cannot be a catalogue entry: an entry names ONE target
  // and this names none. It stays a hand-built group on the form, and it stays
  // there for every category, because salary is offered to every category.
  basicSalary: 'inBasicSalary',
  hraReceived: 'inHraReceived',
  rentPaid: 'inRentPaid',
  isMetro: 'inIsMetro',

  // Head 3 - the presumptive election. The engine costs every basis regardless,
  // so this chooses which one is charged, not which one is computed.
  businessDigitalShare: 'inBusinessDigitalShare',
  businessBasis: 'inBusinessBasis',

  // Losses. Not income and not a deduction, so not a catalogue entry either -
  // they are set-off, with their own three rules. The only genuinely
  // retrospective input on the page: the reader needs last year's return.
  lossStcCurrent: 'inLossStcgCurrent',
  lossLtcCurrent: 'inLossLtcgCurrent',
  lossBfBusiness: 'inLossBfBusiness',
  lossBfHouseProperty: 'inLossBfHouseProperty',
  lossBfShortTerm: 'inLossBfShortTerm',
  lossBfLongTerm: 'inLossBfLongTerm',
} as const;

/**
 * The field id for one catalogue entry, derived rather than listed.
 *
 * Derived for the reason sol-056 derived the Chapter VI-A ids and sol-057 then
 * had to teach the dead-id wall to see: an entry added to the catalogue gets a
 * field, a change handler and a place in the input set without anyone
 * remembering three files. The catalogue's ids are unique by test, so these are
 * too.
 */
export const taxFieldId = (entryId: string) => `inFld_${entryId}`;

/** Every catalogue entry with a field on the form - everything but the automatic and the pending. */
export const CATALOGUE_FIELDS: CatalogueEntry[] = [...INCOME_SOURCES, ...DEDUCTIONS].filter(
  (e) => Boolean(e.target)
);

export const CHAPTER_VIA_SECTIONS = Object.keys(CHAPTER_VIA_RULES) as ChapterVIASection[];

/**
 * Every money field on the page, in the order the form asks for them.
 *
 * Exported because the page has to bind change handlers to exactly this set,
 * and a list of ids maintained twice is a list that will disagree with itself.
 */
export const MONEY_FIELD_IDS: readonly string[] = [
  ...CATALOGUE_FIELDS.map((e) => taxFieldId(e.id)),
  F.basicSalary,
  F.hraReceived,
  F.rentPaid,
  F.lossStcCurrent,
  F.lossLtcCurrent,
  F.lossBfBusiness,
  F.lossBfHouseProperty,
  F.lossBfShortTerm,
  F.lossBfLongTerm,
];

/** The non-money controls, which fire `change` rather than blur. */
export const CHOICE_FIELD_IDS: readonly string[] = [
  F.ageBracket,
  F.isMetro,
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
 * On a tax return zero is a legitimate answer to every money field - no other
 * income, no rent, no 80C - so honouring it is the rule here rather than an
 * opt-in for the two fields that happened to need it.
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

/**
 * The facts no catalogue entry owns. Kept apart from the summed targets so the
 * assembly below can be tested without a DOM.
 */
export interface TaxChoices {
  ageBracket: AgeBracket;
  isMetro: boolean;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  businessBasis: BusinessInput['basis'];
  digitalSharePct: number;
  losses: LossesInput;
}

export const DEFAULT_CHOICES: TaxChoices = {
  ageBracket: 'below60',
  isMetro: false,
  basicSalary: 0,
  hraReceived: 0,
  rentPaid: 0,
  businessBasis: 'books',
  // Fully banked: both the common case for anyone filing online and the one
  // that gives the reader the better deemed rate. Stated on the screen rather
  // than assumed silently.
  digitalSharePct: 100,
  losses: {
    shortTermLoss: 0,
    longTermLoss: 0,
    broughtForwardBusiness: 0,
    broughtForwardHouseProperty: 0,
    broughtForwardShortTerm: 0,
    broughtForwardLongTerm: 0,
  },
};

/**
 * Which kind of property this is - DERIVED from what the reader declared rather
 * than asked as a separate question.
 *
 * A reader who declares rent has let the place out; a reader who declares only
 * loan interest lives in it. Asking a fourth time buys no simplification and
 * would be one more question that removes nothing (dd-020/dont-2) - and worse,
 * a selector left on its default while the reader fills in rent is a box that
 * moves no money, which is the sol-041 shape in the view layer.
 *
 * IT READS THE FIGURES, NOT WHETHER THE FIELD IS ON SCREEN. The rent field is
 * one of the few that are permanently visible, so it is active for everybody:
 * keying off presence made every reader with a home loan into a landlord, and a
 * let-out property has no cap on its interest where a home you live in is
 * capped at Rs 2 lakh. Where the reader has stated nothing, the conservative
 * reading is the one that applies the cap.
 */
const housePropertyKind = (targets: Map<string, number>): HousePropertyInput['kind'] => {
  const declared = (path: string) => (targets.get(path) ?? 0) > 0;
  if (declared('houseProperty.annualRent') || declared('houseProperty.municipalTaxes')) {
    return 'letOut';
  }
  return declared('houseProperty.interest') ? 'selfOccupied' : 'none';
};

/**
 * Assemble the engine's input from the summed targets and the rest.
 *
 * Pure, and separate from the DOM for one reason worth the extra function: a
 * test can put a rupee on EVERY target the catalogue names and assert it
 * arrives. sol-059's test proves each target resolves against `TaxInput`;
 * this one proves the reader actually delivers to it, which is the half that
 * would otherwise be checked by reading.
 */
export function buildTaxInput(targets: Map<string, number>, choices: TaxChoices): TaxInput {
  const at = (path: string) => targets.get(path) ?? 0;

  // A section is in the map only when the reader ACTIVATED a field for it. An
  // absent section was never claimed; a present one standing at zero was
  // claimed as nothing. Same rupees, different sentence.
  const chapterVIA: Partial<Record<ChapterVIASection, number>> = {};
  for (const [path, value] of targets) {
    if (!path.startsWith('chapterVIA.')) continue;
    chapterVIA[path.slice('chapterVIA.'.length) as ChapterVIASection] = value;
  }

  return {
    grossSalary: at('grossSalary'),
    otherIncome: at('otherIncome'),
    ageBracket: choices.ageBracket,

    basicSalary: choices.basicSalary,
    hraReceived: choices.hraReceived,
    rentPaid: choices.rentPaid,
    isMetro: choices.isMetro,

    houseProperty: {
      kind: housePropertyKind(targets),
      annualRent: at('houseProperty.annualRent'),
      municipalTaxes: at('houseProperty.municipalTaxes'),
      interest: at('houseProperty.interest'),
    },

    business: {
      netProfit: at('business.netProfit'),
      turnover: at('business.turnover'),
      professionalReceipts: at('business.professionalReceipts'),
      digitalSharePct: choices.digitalSharePct,
      basis: choices.businessBasis,
    },

    losses: choices.losses,

    capitalGains: {
      stcg111A: at('capitalGains.stcg111A'),
      ltcg112A: at('capitalGains.ltcg112A'),
      ltcg112: at('capitalGains.ltcg112'),
      stcgSlab: at('capitalGains.stcgSlab'),
    },

    professionalTax: at('professionalTax'),

    // The statutory caps are the engine's business, not the form's. It already
    // applies them, and applying them here as well would be sol-038's shape:
    // one rule, two places, and a cap that changes in one Budget and one file.
    chapterVIA,
  };
}

/**
 * Every ACTIVE field's rupees, summed by the target it is aimed at.
 *
 * A field is active when the reader has added it or it is one of the few that
 * are permanently on screen. An inactive field is on the page - rendered by the
 * server so that switching category never has to build one - and contributes
 * nothing.
 */
function readActiveTargets(): Map<string, number> {
  const targets = new Map<string, number>();
  for (const entry of CATALOGUE_FIELDS) {
    const id = taxFieldId(entry.id);
    const node = el(id);
    if (!node || node.dataset.active !== 'true') continue;
    targets.set(entry.target!, (targets.get(entry.target!) ?? 0) + money(id));
  }
  return targets;
}

/** Read the one true input set. Every surface on the page goes through this. */
export function readTaxInputs(): TaxInput {
  return buildTaxInput(readActiveTargets(), {
    ageBracket: ageBracket(),
    isMetro: isMetro(),
    basicSalary: money(F.basicSalary),
    hraReceived: money(F.hraReceived),
    rentPaid: money(F.rentPaid),
    businessBasis: businessBasis(),
    digitalSharePct: pct(F.businessDigitalShare, DEFAULT_CHOICES.digitalSharePct),
    losses: {
      shortTermLoss: money(F.lossStcCurrent),
      longTermLoss: money(F.lossLtcCurrent),
      broughtForwardBusiness: money(F.lossBfBusiness),
      broughtForwardHouseProperty: money(F.lossBfHouseProperty),
      broughtForwardShortTerm: money(F.lossBfShortTerm),
      broughtForwardLongTerm: money(F.lossBfLongTerm),
    },
  });
}
