import { CHAPTER_VIA_RULES, type ChapterVIASection, type Regime } from './tax';

/**
 * The tax calculator's catalogue: every income source and every deduction the
 * form can offer, and which categories are ELIGIBLE for each.
 *
 * This is the data layer Rahul's sheet 2 asks for — "the dropdowns will have
 * exhaustive sources of money & deductions category wise" — and it is data
 * rather than four hard-coded branches because the sheet ends its category list
 * with `etc.`, written in his own hand. More categories are coming.
 *
 * FOUR RULES ARE LOAD-BEARING HERE.
 *
 * dd-020 — a category removes what CANNOT APPLY, never what is merely unlikely.
 *   The enforcement is structural: an exclusion is not a boolean, it is a
 *   `statute` string. You cannot exclude an option without naming the provision
 *   that forbids it, and `taxCatalogue.test.ts` fails on an empty one. That
 *   turns dd-020's own test — "is this removed because the statute forbids it,
 *   or because we guessed?" — into something a machine can ask.
 *
 * dd-020/dont-3 — a category filter must never change a computed answer. This
 *   module therefore holds NO arithmetic and is not imported by `tax.ts`. It
 *   decides what the form OFFERS; the engine computes from whatever arrives.
 *   A reader who switches category does not get a different tax on the same
 *   facts, only a different set of questions.
 *
 * dd-001/do-3 — within the eligible set, offer EVERYTHING, not a shortlist.
 *   Hence `common` is a visibility flag, not a filter: the uncommon options are
 *   one click away in the dropdown, never absent. "Only the most common options
 *   should be permanently visible" is answered by what stays on screen, not by
 *   what exists.
 *
 * sol-041 — AND EVERY OPTION HAS SOMEWHERE FOR ITS RUPEES TO GO. This is the
 *   rule the first draft of this file did not have, and it is the one that
 *   would have hurt. An option offered with no field behind it produces a box
 *   the reader fills in and a bill that does not move — the worst kind of
 *   defect this project has met, because it is invisible from the screen and
 *   confident on it. Every entry names a `target`: a path into the engine's
 *   `TaxInput`, checked by a test against the real thing. An option the engine
 *   genuinely cannot price yet is `pending` and is NOT OFFERED — and it says
 *   what is missing, so the gap is a queue rather than a silence.
 *
 * WHEN IN DOUBT, INCLUDE. An option wrongly offered costs the reader one glance.
 * An option wrongly withheld means the reader it fits never learns it existed,
 * and silently files a wrong return. The asymmetry is the whole of dd-020/dont-1.
 */

/** Open-ended by construction — the sheet says `etc.`. */
export interface Category {
  id: string;
  label: string;
  /** What this category means, in the reader's words rather than the statute's. */
  hint: string;
}

export const CATEGORIES: Category[] = [
  { id: 'salaried', label: 'Salaried', hint: 'You draw a salary or a pension from an employer.' },
  { id: 'business', label: 'Business', hint: 'You trade, manufacture or sell — a shop, a factory, a firm.' },
  { id: 'professional', label: 'Professional', hint: 'You practise a profession — medicine, law, architecture, accountancy, technical consultancy.' },
  { id: 'selfEmployed', label: 'Self-employed', hint: 'You work for yourself — freelance, contract or gig work.' },
];

/** The five heads of income, s.14. Every source belongs to exactly one. */
export type Head =
  | 'salaries'
  | 'houseProperty'
  | 'businessProfession'
  | 'capitalGains'
  | 'otherSources';

export const HEAD_LABEL: Record<Head, string> = {
  salaries: 'Salary',
  houseProperty: 'House property',
  businessProfession: 'Business or profession',
  capitalGains: 'Capital gains',
  otherSources: 'Other sources',
};

/**
 * An exclusion names the provision that forbids the option to this category.
 * There is deliberately no way to express "we think this is unlikely".
 */
export interface Exclusion {
  category: string;
  statute: string;
}

export interface CatalogueEntry {
  id: string;
  label: string;
  /** One line the reader can act on, in plain words. */
  hint: string;
  /**
   * Where this option's rupees land in the engine's `TaxInput`.
   *
   * A dotted path — `capitalGains.stcg111A` — or `chapterVIA.<SECTION>` for a
   * deduction, which the engine holds in a map rather than a named field.
   * Several entries may share a target and the form SUMS them, which is right:
   * F&O profit and intraday profit and a shop's profit are all business income
   * and the head takes their total.
   *
   * Absent only when `automatic` or `pending` is set.
   */
  target?: string;
  /**
   * The engine applies this without being asked, so there is no field for it.
   * The standard deduction is the only one today.
   */
  automatic?: boolean;
  /**
   * The engine cannot price this yet, and this says what is missing. A pending
   * entry is NOT OFFERED — see `incomeSourcesFor`. It is kept rather than
   * deleted so the gap is a queue with a reason rather than an absence nobody
   * can see, which is the same discipline as an exclusion naming its statute.
   */
  pending?: string;
  /**
   * Permanently visible rather than in the dropdown. This is a VISIBILITY
   * decision only — an uncommon option is still offered, one click away.
   */
  common?: boolean;
  /** Categories that cannot lawfully choose this, each with its provision. */
  excluded?: Exclusion[];
}

export interface IncomeSource extends CatalogueEntry {
  head: Head;
}

/**
 * Income sources. Everything a reader might have to declare, grouped by the
 * head it falls under, because `tax.ts` is structured by s.14 and the screen
 * should not invent a different taxonomy from the engine's.
 */
export const INCOME_SOURCES: IncomeSource[] = [
  // ---- Head 1: Salaries -------------------------------------------------
  {
    id: 'grossSalary', head: 'salaries', common: true, target: 'grossSalary',
    label: 'Salary',
    hint: 'Everything on your payslip before deductions — basic, allowances, bonus.',
    excluded: [],
  },
  {
    id: 'pension', head: 'salaries', target: 'grossSalary',
    label: 'Pension',
    hint: 'A pension from a former employer. Taxed as salary, and it earns the same standard deduction.',
  },
  {
    id: 'salaryArrears', head: 'salaries', target: 'grossSalary',
    label: 'Salary arrears',
    hint: 'Back pay received this year for an earlier one. Taxed in full here; relief under s.89 is claimed separately and is not computed on this page.',
  },

  // ---- Head 2: House property -------------------------------------------
  //
  // The self-occupied interest entry that used to sit here has gone. It was the
  // same rupees as the s.24(b) deduction below, in a second place, and the two
  // would have written the same field — a reader adding both would have typed
  // one number twice and had one of them silently disregarded. On Rahul's sheet
  // home loan interest is a DEDUCTION, which is also where the reader looks for
  // it; the engine's house property head is where it lands.
  {
    id: 'letOutRent', head: 'houseProperty', common: true, target: 'houseProperty.annualRent',
    label: 'Rent received',
    hint: 'Rent from a property you own and let out, for the whole year.',
  },

  // ---- Head 3: Business or profession -----------------------------------
  {
    id: 'businessBooks', head: 'businessProfession', common: true, target: 'business.netProfit',
    label: 'Business profit (from your books)',
    hint: 'Actual profit — turnover less expenses — as your accounts show it.',
    excluded: [
      { category: 'salaried', statute: 'A salaried filer has no business income to declare under this head; if they do run a business, the Business category is the one that fits.' },
    ],
  },
  {
    id: 'presumptive44AD', head: 'businessProfession', target: 'business.turnover',
    label: 'Presumptive business income (44AD)',
    hint: 'Declare a deemed profit — 6% of banked turnover, 8% of cash — instead of keeping full books. Enter the turnover; the engine costs both bases and shows you the difference.',
    excluded: [
      { category: 'salaried', statute: 's.44AD applies to an eligible BUSINESS. A salaried filer has no eligible business, so the election is not available.' },
      { category: 'professional', statute: 's.44AD(6) excludes a person carrying on a profession referred to in s.44AA(1); professionals elect under s.44ADA instead.' },
    ],
  },
  {
    id: 'presumptive44ADA', head: 'businessProfession', target: 'business.professionalReceipts',
    label: 'Presumptive professional income (44ADA)',
    hint: 'Declare 50% of gross receipts as profit instead of keeping full books. Enter the receipts, not the profit.',
    excluded: [
      { category: 'salaried', statute: 's.44ADA applies to a resident carrying on a profession referred to in s.44AA(1). A salaried filer is not carrying on that profession.' },
      { category: 'business', statute: 's.44ADA is confined to the professions listed in s.44AA(1); a trading or manufacturing business elects under s.44AD instead.' },
    ],
  },
  {
    id: 'futuresOptions', head: 'businessProfession', target: 'business.netProfit',
    label: 'Futures and options (F&O)',
    hint: 'Derivatives trading. Non-speculative business income, whoever earns it — enter the profit after costs.',
    // Deliberately available to EVERY category, including salaried. dd-020/do-3
    // names this exact case: uncommon for a salaried filer, entirely lawful, and
    // hiding it would mean the reader it fits never learns it was there.
    excluded: [],
  },
  {
    id: 'intradayEquity', head: 'businessProfession', target: 'business.netProfit',
    label: 'Intraday equity trading',
    hint: 'Bought and sold the same day. Speculative business income — a PROFIT is taxed like any other business profit, which is what this field takes. A speculative LOSS sets off only against speculative gains, and that is not modelled here.',
  },
  {
    id: 'freelanceReceipts', head: 'businessProfession', target: 'business.netProfit',
    label: 'Freelance or contract income',
    hint: 'Paid per project or per hour rather than by an employer. Enter what is left after your costs; to declare presumptively instead, use 44ADA above and enter the gross receipts.',
  },
  {
    id: 'gigIncome', head: 'businessProfession', target: 'business.netProfit',
    label: 'Gig or platform income',
    hint: 'Driving, delivery, creator platforms, marketplaces. Enter what is left after your costs.',
  },

  // ---- Head 4: Capital gains --------------------------------------------
  {
    id: 'stcg111A', head: 'capitalGains', common: true, target: 'capitalGains.stcg111A',
    label: 'Short-term gains on shares or equity funds',
    hint: 'Listed equity held 12 months or less, sold on an exchange. Taxed at a flat 20% under s.111A.',
  },
  {
    id: 'ltcg112A', head: 'capitalGains', common: true, target: 'capitalGains.ltcg112A',
    label: 'Long-term gains on shares or equity funds',
    hint: 'Listed equity held over 12 months. 12.5% under s.112A, with the first ₹1.25 lakh of gains exempt.',
  },
  {
    id: 'stcgOther', head: 'capitalGains', target: 'capitalGains.stcgSlab',
    label: 'Short-term gains on other assets',
    hint: 'Property, gold, debt funds, unlisted shares held under the long-term threshold. Taxed at your slab rate, not at 20%.',
  },
  {
    id: 'ltcgOther', head: 'capitalGains', target: 'capitalGains.ltcg112',
    label: 'Long-term gains on other assets',
    hint: 'Property, gold or unlisted shares held past the long-term threshold. 12.5% under s.112.',
  },
  {
    id: 'vda', head: 'capitalGains',
    label: 'Crypto and other virtual digital assets',
    hint: 'A flat 30% under s.115BBH. No deduction except cost, and losses set off against nothing at all.',
    pending:
      's.115BBH is a flat rate that takes no share of the basic exemption and admits no set-off, so it cannot ride on the capital-gains buckets, which do both. It needs its own special-rate path through surcharge, 87A and cess.',
  },

  // ---- Head 5: Other sources --------------------------------------------
  {
    id: 'savingsInterest', head: 'otherSources', common: true, target: 'otherIncome',
    label: 'Savings account interest',
    hint: 'Interest credited by your bank on a savings account. Up to ₹10,000 of it comes back as a deduction under 80TTA — or ₹50,000 under 80TTB from age 60.',
  },
  {
    id: 'depositInterest', head: 'otherSources', common: true, target: 'otherIncome',
    label: 'Fixed deposit interest',
    hint: 'Interest on FDs and recurring deposits, taxed as it accrues rather than when it is paid out.',
  },
  {
    id: 'dividends', head: 'otherSources', target: 'otherIncome',
    label: 'Dividends',
    hint: 'Dividends from shares or mutual funds. Taxed at your slab rate since FY 2020-21.',
  },
  {
    id: 'familyPension', head: 'otherSources', target: 'otherIncome',
    label: 'Family pension',
    hint: 'A pension received as the family member of a deceased employee. Taxed under other sources, not salary — and the s.57(iia) standard deduction on it is not computed here, so this figure is taxed in full.',
  },
  {
    id: 'winnings', head: 'otherSources',
    label: 'Lottery, betting or game-show winnings',
    hint: 'A flat 30% under s.115BB, with no deduction and no basic exemption against it.',
    pending:
      's.115BB is a flat rate with no basic exemption behind it. Putting it in `otherIncome` would tax it at slab — nil for a small earner — which understates it, and understating tax is the one direction this engine must never round.',
  },
];

export interface Deduction extends CatalogueEntry {
  /** How the reader will see the provision cited, e.g. `s.80C`. */
  section: string;
  /**
   * Which regimes allow it — declared ONLY where the answer is not the engine's
   * to give. A Chapter VI-A entry must leave this unset: its regimes come from
   * `CHAPTER_VIA_RULES`, and a second copy here is sol-038's shape, one rule in
   * two places, with a Budget every February to pull them apart.
   */
  regimes?: readonly Regime[];
}

export const DEDUCTIONS: Deduction[] = [
  {
    id: 'standardDeduction', section: 's.16(ia)', regimes: ['old', 'new'], common: true,
    automatic: true,
    label: 'Standard deduction',
    hint: 'A flat deduction against salary or pension. Applied automatically — you do not claim it, and the amount differs by regime.',
    excluded: [
      { category: 'business', statute: 's.16(ia) is a deduction from income chargeable under the head Salaries. A business with no salary income has nothing for it to reduce.' },
      { category: 'professional', statute: 's.16(ia) applies to income under the head Salaries; professional receipts fall under business or profession.' },
      { category: 'selfEmployed', statute: 's.16(ia) applies to income under the head Salaries; self-employment receipts fall under business or profession.' },
    ],
  },
  {
    id: 'sec80c', section: 's.80C', target: 'chapterVIA.80C', common: true,
    label: 'Investments and payments (80C)',
    hint: 'EPF, PPF, ELSS, life insurance premium, principal on a home loan, tuition fees. Capped at ₹1.5 lakh.',
  },
  {
    id: 'sec80d', section: 's.80D', target: 'chapterVIA.80D', common: true,
    label: 'Health insurance premium (80D)',
    hint: 'Premium for yourself, your family and your parents. The ceiling rises when the insured is a senior citizen.',
  },
  {
    id: 'sec80ccd1b', section: 's.80CCD(1B)', target: 'chapterVIA.80CCD1B', common: true,
    label: 'NPS, your own contribution (80CCD(1B))',
    hint: 'An extra ₹50,000 over and above the 80C ceiling.',
  },
  {
    id: 'homeLoanInterest', section: 's.24(b)', regimes: ['old'], target: 'houseProperty.interest',
    common: true,
    label: 'Home loan interest (24(b))',
    hint: 'Up to ₹2 lakh against the home you live in, and uncapped against one you let out. This is a house-property deduction, not a Chapter VI-A one — which is why s.115BAC withdraws it entirely on a home you live in, and why that is the single biggest reason a borrower stays on the old regime.',
  },
  {
    id: 'municipalTaxes', section: 's.23(1)', regimes: ['old', 'new'],
    target: 'houseProperty.municipalTaxes',
    label: 'Municipal tax paid on a let-out property',
    hint: 'Comes off the rent before the 30% standard deduction, so it is worth more than it looks. Only what you actually paid this year.',
  },
  {
    id: 'sec80ccd2', section: 's.80CCD(2)', target: 'chapterVIA.80CCD2',
    label: 'NPS, your employer’s contribution (80CCD(2))',
    hint: 'One of the few deductions that survives the new regime — s.115BAC keeps it. Capped at a share of your salary: 14% under the new regime, 10% under the old.',
    excluded: [
      { category: 'business', statute: 's.80CCD(2) is a deduction for an employer’s contribution on behalf of an EMPLOYEE; a proprietor has no employer contributing for them.' },
      { category: 'professional', statute: 's.80CCD(2) requires a contribution by an employer to an employee’s account; a practising professional has none.' },
      { category: 'selfEmployed', statute: 's.80CCD(2) requires an employer’s contribution; a self-employed filer contributes under s.80CCD(1) or (1B) instead.' },
    ],
  },
  {
    id: 'sec80tta', section: 's.80TTA', target: 'chapterVIA.80TTA',
    label: 'Savings interest (80TTA)',
    hint: 'Up to ₹10,000 of savings-account interest. From age 60 the wider 80TTB replaces it, and the two can never both be claimed.',
  },
  {
    id: 'sec80ttb', section: 's.80TTB', target: 'chapterVIA.80TTB',
    label: 'Senior citizen interest (80TTB)',
    hint: 'Up to ₹50,000 of interest — deposits as well as savings — from age 60. Replaces 80TTA rather than adding to it.',
  },
  {
    id: 'sec80e', section: 's.80E', target: 'chapterVIA.80E',
    label: 'Education loan interest (80E)',
    hint: 'Interest on a loan for higher education. No ceiling at all, but limited to eight years from when repayment starts.',
  },
  {
    id: 'sec80g', section: 's.80G', target: 'chapterVIA.80G',
    label: 'Donations (80G)',
    hint: 'Donations to approved funds and institutions. Some qualify at 100%, some at 50%, and some are further capped against your income — enter the amount you can actually deduct.',
  },
  {
    id: 'sec80gg', section: 's.80GG', target: 'chapterVIA.80GG',
    label: 'Rent paid, when you get no HRA (80GG)',
    hint: 'For a reader who pays rent but receives no house rent allowance. Capped at ₹60,000.',
  },
  {
    id: 'sec80dd', section: 's.80DD', target: 'chapterVIA.80DD',
    label: 'Maintenance of a dependant with disability (80DD)',
    hint: 'A fixed sum rather than a reimbursement: ₹75,000, or ₹1,25,000 where the disability is severe.',
  },
  {
    id: 'sec80ddb', section: 's.80DDB', target: 'chapterVIA.80DDB',
    label: 'Treatment of specified diseases (80DDB)',
    hint: 'Actual expenditure on specified illnesses, up to ₹40,000 — or ₹1,00,000 where the patient is 60 or over.',
  },
  {
    id: 'sec80u', section: 's.80U', target: 'chapterVIA.80U',
    label: 'Your own disability (80U)',
    hint: 'A fixed sum where the filer themselves has a certified disability: ₹75,000, or ₹1,25,000 where it is severe.',
  },
  {
    id: 'professionalTax', section: 's.16(iii)', regimes: ['old'], target: 'professionalTax',
    label: 'Professional tax',
    hint: 'The tax your state levies on employment, deducted from your salary. It comes off salary itself rather than off gross total income, which is why it survives even when Chapter VI-A does not apply to you.',
    excluded: [
      { category: 'business', statute: 's.16(iii) is a deduction from income under the head Salaries; a business pays professional tax as a business expense instead.' },
      { category: 'professional', statute: 's.16(iii) applies to income under the head Salaries, which professional receipts are not.' },
      { category: 'selfEmployed', statute: 's.16(iii) applies to income under the head Salaries, which self-employment receipts are not.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Selectors. These decide what the form OFFERS. They compute nothing.
// ---------------------------------------------------------------------------

const isExcluded = (e: CatalogueEntry, category: string) =>
  (e.excluded ?? []).some((x) => x.category === category);

/** The Chapter VI-A section an entry targets, or null if it targets a field. */
export const chapterVIASectionOf = (entry: CatalogueEntry): ChapterVIASection | null =>
  entry.target?.startsWith('chapterVIA.')
    ? (entry.target.slice('chapterVIA.'.length) as ChapterVIASection)
    : null;

/**
 * Which regimes allow a deduction — from the engine's table wherever the engine
 * owns the answer, so the two can never drift apart.
 */
export const regimesForDeduction = (d: Deduction): readonly Regime[] => {
  const section = chapterVIASectionOf(d);
  return section ? CHAPTER_VIA_RULES[section].regimes : (d.regimes ?? ['old', 'new']);
};

/** Everything this category may lawfully declare. Exhaustive — dd-001/do-3. */
export const incomeSourcesFor = (category: string): IncomeSource[] =>
  INCOME_SOURCES.filter((s) => !s.pending && !isExcluded(s, category));

/** Everything this category may lawfully claim, in this regime. */
export const deductionsFor = (category: string, regime: Regime): Deduction[] =>
  DEDUCTIONS.filter(
    (d) => !d.pending && !isExcluded(d, category) && regimesForDeduction(d).includes(regime)
  );

/**
 * The split the sheet asks for: what stays on screen, and what waits in the
 * dropdown. Both halves are offered — this is visibility, never availability.
 */
export const splitByVisibility = <T extends CatalogueEntry>(entries: T[]) => ({
  visible: entries.filter((e) => e.common),
  inDropdown: entries.filter((e) => !e.common),
});

/** Grouped for the dropdown, since the engine is structured by s.14 heads. */
export const groupByHead = (sources: IncomeSource[]): Array<{ head: Head; label: string; sources: IncomeSource[] }> =>
  (Object.keys(HEAD_LABEL) as Head[])
    .map((head) => ({ head, label: HEAD_LABEL[head], sources: sources.filter((s) => s.head === head) }))
    .filter((g) => g.sources.length > 0);

/**
 * Why an option is not on offer. Exists so the answer is always available to
 * the reader and to a test — an exclusion nobody can interrogate is
 * indistinguishable from a guess.
 */
export const whyExcluded = (entryId: string, category: string): string | null => {
  const entry = [...INCOME_SOURCES, ...DEDUCTIONS].find((e) => e.id === entryId);
  return (entry?.excluded ?? []).find((x) => x.category === category)?.statute ?? null;
};

/**
 * What the engine cannot price yet, with the reason. Two today: s.115BBH on
 * virtual digital assets and s.115BB on winnings, both flat rates that take no
 * share of the basic exemption and so cannot ride on the capital-gains path.
 *
 * Surfaced rather than buried so the queue is visible to a test and to whoever
 * picks this up next. `taxCatalogue.test.ts` ratchets the count downward.
 */
export const PENDING_ENTRIES: CatalogueEntry[] = [...INCOME_SOURCES, ...DEDUCTIONS].filter(
  (e) => Boolean(e.pending)
);
