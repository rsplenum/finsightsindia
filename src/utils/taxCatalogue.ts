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
 * dd-001/do-3 and dd-022 together — within the eligible set, offer EVERYTHING,
 *   and show ONE. `primaryFor` names the single field a category opens on; every
 *   other entry is reached through the add control. The two rules are not in
 *   tension, they are the architecture: what is offered is exhaustive, what is
 *   on screen at rest is one field, and the complexity lives underneath.
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
   * THE ONE FIELD THIS CATEGORY OPENS ON — dd-022.
   *
   * There was a `common` boolean here, meaning "permanently visible rather than
   * in the dropdown", and it produced a form with ten boxes standing at zero
   * before the reader had typed anything. Rahul overturned that reading on 18
   * Aug: after the category is answered, exactly ONE field is on screen and
   * every other one arrives because the reader asked for it.
   *
   * It is deleted rather than reinterpreted. A flag left in place with a new
   * meaning lets the old meaning be re-derived by the next person to read the
   * file, which is dd-012's failure exactly.
   *
   * Visibility, not availability: what is OFFERED stays exhaustive within the
   * eligible set (dd-001/do-3). Only what is on screen at rest has changed.
   */
  primaryFor?: string[];
  /** Categories that cannot lawfully choose this, each with its provision. */
  excluded?: Exclusion[];
}

export interface IncomeSource extends CatalogueEntry {
  head: Head;
  /**
   * WHY THIS SOURCE CANNOT BE CLUBBED WITH THE OTHERS — and it is a reason
   * string rather than a boolean, for the same rule as `Exclusion.statute`: you
   * cannot take a source out of the ordinary income block without saying what
   * the arithmetic would lose if it stayed.
   *
   * This is Rahul's block (2), settled on 17 Aug when he read back the one
   * illegible word on sheet 2: *"only those that can't be clubbed in
   * dropdown-1"*. Dropdown 1's sources ADD UP — salary, pension and arrears are
   * one figure to the slabs, and five kinds of business income are one profit.
   * These cannot join them, because summing them would destroy the only thing
   * the arithmetic cares about.
   *
   * A source that shares its `target` with another is clubbed BY CONSTRUCTION —
   * the form sums them into one field — so claiming it cannot be clubbed would
   * be a promise the engine does not keep. `taxCatalogue.test.ts` enforces
   * exactly that, and it is what decides the F&O case rather than taste.
   */
  unclubbable?: string;
}

/**
 * Income sources. Everything a reader might have to declare, grouped by the
 * head it falls under, because `tax.ts` is structured by s.14 and the screen
 * should not invent a different taxonomy from the engine's.
 */
export const INCOME_SOURCES: IncomeSource[] = [
  // ---- Head 1: Salaries -------------------------------------------------
  {
    id: 'grossSalary', head: 'salaries', target: 'grossSalary',
    primaryFor: ['salaried'],
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
  {
    id: 'directorRemuneration', head: 'salaries', target: 'grossSalary',
    label: 'Director’s remuneration, as an employee',
    hint: 'Salary drawn as a whole-time or managing director. You are an employee of the company, so it is salary and it earns the standard deduction. Sitting fees are a different thing — see the other sources list.',
  },
  {
    id: 'bonusCommissionSalary', head: 'salaries', target: 'grossSalary',
    label: 'Bonus or commission from your employer',
    hint: 'Anything your employer pays on top of basic pay. Taxed as salary in the year you receive it, not the year you earned it.',
  },
  {
    id: 'esopPerquisite', head: 'salaries', target: 'grossSalary',
    label: 'ESOPs exercised this year',
    hint: 'The difference between the market price on the day you exercised and what you paid, taxed as a perquisite. Selling the shares later is a separate capital gain.',
  },
  {
    id: 'retirementBenefits', head: 'salaries', target: 'grossSalary',
    label: 'Gratuity, leave encashment or a retirement payout',
    hint: 'Enter only the TAXABLE part. Large exemptions apply — up to ₹20 lakh of gratuity and ₹25 lakh of leave encashment — and this page does not work them out for you.',
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
    id: 'letOutRent', head: 'houseProperty', target: 'houseProperty.annualRent',
    label: 'Rent received',
    hint: 'Rent from a property you own and let out, for the whole year.',
  },

  // ---- Head 3: Business or profession -----------------------------------
  {
    id: 'businessBooks', head: 'businessProfession', target: 'business.netProfit',
    primaryFor: ['business', 'professional'],
    // Not "Business profit". Under dd-022 this is the ONE question a business or
    // a professional sees on opening the form, and a practising doctor reading
    // "Business profit" as their only question would hesitate. The same field
    // serves a shop, a surgery and a chambers; the label now does too.
    label: 'Profit from your books',
    hint: 'Actual profit — turnover less expenses — as your accounts show it.',
    excluded: [
      { category: 'salaried', statute: 'A salaried filer has no business income to declare under this head; if they do run a business, the Business category is the one that fits.' },
    ],
  },
  {
    id: 'presumptive44AD', head: 'businessProfession', target: 'business.turnover',
    label: 'Presumptive business income (44AD)',
    hint: 'Declare a deemed profit — 6% of banked turnover, 8% of cash — instead of keeping full books. Enter the turnover; the engine costs both bases and shows you the difference.',
    unclubbable:
      'This is turnover, not profit, and a deemed profit is struck from it by a statutory percentage. Adding turnover to a profit would tax the same trade twice over and at the wrong figure.',
    excluded: [
      { category: 'salaried', statute: 's.44AD applies to an eligible BUSINESS. A salaried filer has no eligible business, so the election is not available.' },
      { category: 'professional', statute: 's.44AD(6) excludes a person carrying on a profession referred to in s.44AA(1); professionals elect under s.44ADA instead.' },
    ],
  },
  {
    id: 'presumptive44ADA', head: 'businessProfession', target: 'business.professionalReceipts',
    label: 'Presumptive professional income (44ADA)',
    hint: 'Declare 50% of gross receipts as profit instead of keeping full books. Enter the receipts, not the profit.',
    unclubbable:
      'These are gross receipts, not profit. Half of them is deemed to be the profit, so adding them to a profit figure would count the practice twice and at a figure the section never meant.',
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
    //
    // AND DELIBERATELY NOT `unclubbable`, THOUGH RAHUL'S SHEET LISTS IT IN BLOCK
    // (2). It shares `business.netProfit` with four other sources, so the form
    // sums it with them and the engine sees one profit. Putting it in the block
    // headed "these cannot be added to the figures above" would tell the reader
    // something the arithmetic does not do. The separation he has in mind is
    // real in the Act - F&O is non-speculative where intraday is speculative,
    // and their losses do not meet the same income - but it is a separation the
    // ENGINE does not yet make, so the honest place to record it is the launch
    // gate, not a block heading. On the gate, for Rahul.
    excluded: [],
  },
  {
    id: 'intradayEquity', head: 'businessProfession', target: 'business.netProfit',
    label: 'Intraday equity trading',
    hint: 'Bought and sold the same day. Speculative business income — a PROFIT is taxed like any other business profit, which is what this field takes. A speculative LOSS sets off only against speculative gains, and that is not modelled here.',
  },
  {
    id: 'freelanceReceipts', head: 'businessProfession', target: 'business.netProfit',
    primaryFor: ['selfEmployed'],
    label: 'Freelance or contract income',
    hint: 'Paid per project or per hour rather than by an employer. Enter what is left after your costs; to declare presumptively instead, use 44ADA above and enter the gross receipts.',
  },
  {
    id: 'gigIncome', head: 'businessProfession', target: 'business.netProfit',
    label: 'Gig or platform income',
    hint: 'Driving, delivery, creator platforms, marketplaces. Enter what is left after your costs.',
  },
  {
    id: 'partnerRemuneration', head: 'businessProfession', target: 'business.netProfit',
    label: 'Remuneration from a firm you are a partner in',
    hint: 'Salary, bonus or commission paid to you by your partnership firm. s.28(v) makes it business income in your hands, not salary — so it earns no standard deduction.',
  },
  {
    id: 'partnerInterestOnCapital', head: 'businessProfession', target: 'business.netProfit',
    label: 'Interest on your capital in a firm',
    hint: 'Interest the firm pays you on your capital account. Business income under s.28(v), and taxable only to the extent the firm was allowed to deduct it.',
  },
  {
    id: 'commissionBrokerage', head: 'businessProfession', target: 'business.netProfit',
    label: 'Commission or brokerage',
    hint: 'Earned by bringing business to somebody else — insurance, property, distribution. Enter what is left after your costs.',
  },
  {
    id: 'royaltyIncome', head: 'businessProfession', target: 'business.netProfit',
    label: 'Royalties or licence fees',
    hint: 'From books, music, patents, software or a brand you license out. A book or a patent may also earn you a deduction — see s.80QQB and s.80RRB in the deductions list.',
  },
  {
    id: 'commodityCurrencyDerivatives', head: 'businessProfession', target: 'business.netProfit',
    label: 'Commodity or currency derivatives',
    hint: 'Traded on a recognised exchange. Non-speculative business income, like F&O — enter the profit after costs.',
  },

  // ---- Head 4: Capital gains --------------------------------------------
  {
    id: 'stcg111A', head: 'capitalGains', target: 'capitalGains.stcg111A',
    label: 'Short-term gains on shares or equity funds',
    hint: 'Listed equity held 12 months or less, sold on an exchange. Taxed at a flat 20% under s.111A.',
    unclubbable:
      'It carries its own flat rate under s.111A. Added to your salary it would be charged at your slab rate instead, which is the rate this section exists to displace.',
  },
  {
    id: 'ltcg112A', head: 'capitalGains', target: 'capitalGains.ltcg112A',
    label: 'Long-term gains on shares or equity funds',
    hint: 'Listed equity held over 12 months. 12.5% under s.112A, with the first ₹1.25 lakh of gains exempt.',
    unclubbable:
      'It has both its own rate and its own yearly exemption under s.112A. Summed with anything else, the exemption would be spent on income that was never entitled to it.',
  },
  {
    id: 'stcgOther', head: 'capitalGains', target: 'capitalGains.stcgSlab',
    label: 'Short-term gains on other assets',
    hint: 'Property, gold, debt funds, unlisted shares held under the long-term threshold. Taxed at your slab rate, not at 20%.',
    unclubbable:
      'It is taxed at your slab rate, but it is still a capital gain: a capital loss may be set against it and against nothing else. Folded into ordinary income, a loss you are entitled to use would have nowhere to go.',
  },
  {
    id: 'ltcgOther', head: 'capitalGains', target: 'capitalGains.ltcg112',
    label: 'Long-term gains on other assets',
    hint: 'Property, gold or unlisted shares held past the long-term threshold. 12.5% under s.112.',
    unclubbable:
      'It carries its own flat rate under s.112. Added to your other income it would be charged at your slab rate, which for most owners of property or gold is the higher one.',
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
    id: 'savingsInterest', head: 'otherSources', target: 'otherIncome',
    label: 'Savings account interest',
    hint: 'Interest credited by your bank on a savings account. Up to ₹10,000 of it comes back as a deduction under 80TTA — or ₹50,000 under 80TTB from age 60.',
  },
  {
    id: 'depositInterest', head: 'otherSources', target: 'otherIncome',
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
    id: 'exemptFirmProfit', head: 'otherSources', target: 'exemptIncome',
    label: 'Your share of a firm’s profit',
    hint: 'Exempt in your hands under s.10(2A) — the firm has already paid tax on it. Declared here so it appears in your computation, and it will not change what you owe.',
  },
  {
    id: 'directorSittingFees', head: 'otherSources', target: 'otherIncome',
    label: 'Director’s sitting fees',
    hint: 'Paid to a non-executive director for attending board meetings. Not salary — you are not an employee — so it falls here and earns no standard deduction.',
  },
  {
    id: 'giftsReceived', head: 'otherSources', target: 'otherIncome',
    label: 'Gifts received',
    hint: 's.56(2)(x). Gifts from relatives, and anything received on your marriage, are exempt whatever the amount. Otherwise, once the year’s gifts pass ₹50,000 the WHOLE sum is taxable, not just the excess — enter it only if you have crossed that line.',
  },
  {
    id: 'bondInterest', head: 'otherSources', target: 'otherIncome',
    label: 'Interest on bonds, debentures or NCDs',
    hint: 'Taxed at your slab rate as it accrues. A capital gain on selling the bond itself is a separate thing.',
  },
  {
    id: 'p2pInterest', head: 'otherSources', target: 'otherIncome',
    label: 'Peer-to-peer lending interest',
    hint: 'Interest earned through a P2P platform. Fully taxable at your slab rate — and a borrower who defaults gives you no deduction for the loss.',
  },
  {
    id: 'epfInterestTaxable', head: 'otherSources', target: 'otherIncome',
    label: 'Taxable interest on provident fund',
    hint: 'Interest on your own PF contributions above ₹2.5 lakh in a year — ₹5 lakh where your employer contributes nothing. Only the interest on the excess is taxable.',
  },
  {
    id: 'refundInterest', head: 'otherSources', target: 'otherIncome',
    label: 'Interest on an income tax refund',
    hint: 's.244A interest paid to you by the department. Taxable in the year you receive it, and routinely forgotten because it arrives with the refund itself.',
  },
  {
    id: 'rentFromMachinery', head: 'otherSources', target: 'otherIncome',
    label: 'Rent from machinery, plant or furniture',
    hint: 'Letting out equipment rather than property. It falls here rather than under house property, so it earns no 30% standard deduction.',
  },
  {
    id: 'subLettingRent', head: 'otherSources', target: 'otherIncome',
    label: 'Rent from sub-letting',
    hint: 'Rent you receive on a place you do not own. You are not the owner, so it is not house property — enter the rent received less the rent you pay.',
  },
  {
    id: 'annuityFromInsurer', head: 'otherSources', target: 'otherIncome',
    label: 'Annuity or pension from an insurer',
    hint: 'A pension bought from an insurance company rather than paid by a former employer. It falls here, so it earns no standard deduction.',
  },
  {
    id: 'compensationInterest', head: 'otherSources', target: 'otherIncome',
    label: 'Interest on compensation or enhanced compensation',
    hint: 'Usually on compulsorily acquired land. Half of it is deductible under s.57(iv), so enter the other half — the part you are actually taxed on.',
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
    id: 'standardDeduction', section: 's.16(ia)', regimes: ['old', 'new'],
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
    id: 'sec80c', section: 's.80C', target: 'chapterVIA.80C',
    label: 'Investments and payments (80C)',
    hint: 'EPF, PPF, ELSS, life insurance premium, principal on a home loan, tuition fees. Capped at ₹1.5 lakh.',
  },
  {
    id: 'sec80d', section: 's.80D', target: 'chapterVIA.80D',
    label: 'Health insurance premium (80D)',
    hint: 'Premium for yourself, your family and your parents. The ceiling rises when the insured is a senior citizen.',
  },
  {
    id: 'sec80ccd1b', section: 's.80CCD(1B)', target: 'chapterVIA.80CCD1B',
    label: 'NPS, your own contribution (80CCD(1B))',
    hint: 'An extra ₹50,000 over and above the 80C ceiling.',
  },
  {
    id: 'homeLoanInterest', section: 's.24(b)', regimes: ['old'], target: 'houseProperty.interest',
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
    id: 'sec80ccc', section: 's.80CCC', target: 'chapterVIA.80CCC',
    label: 'Pension plan from an insurer (80CCC)',
    hint: 'Premium on an annuity or pension policy from a life insurer. It shares the ₹1.5 lakh ceiling with 80C and 80CCD(1) — s.80CCE caps the three together, not each.',
  },
  {
    id: 'sec80ccd1', section: 's.80CCD(1)', target: 'chapterVIA.80CCD1',
    label: 'NPS, your own contribution within the 80C ceiling (80CCD(1))',
    hint: 'Capped at 10% of your salary, or 20% of your total income if you have none. It shares the ₹1.5 lakh ceiling with 80C — the separate ₹50,000 under 80CCD(1B) is the one that stacks on top.',
  },
  {
    id: 'sec80cch1', section: 's.80CCH(1)', target: 'chapterVIA.80CCH1',
    label: 'Agniveer Corpus Fund, your own contribution (80CCH(1))',
    hint: 'What you paid into the fund under the Agnipath scheme. No ceiling. Old regime only — the government’s own contribution is the half that survives the new regime.',
  },
  {
    id: 'sec80cch2', section: 's.80CCH(2)', target: 'chapterVIA.80CCH2',
    label: 'Agniveer Corpus Fund, the government’s contribution (80CCH(2))',
    hint: 'What the Central Government paid into your fund account. It is added to your income and then deducted, so it costs you nothing — and it is one of only three deductions the new regime keeps.',
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
    id: 'sec80ee', section: 's.80EE', target: 'chapterVIA.80EE',
    label: 'Extra home loan interest, first home (80EE)',
    hint: 'Up to ₹50,000 on top of the ₹2 lakh under s.24(b). Only for a loan sanctioned in FY 2016-17 on a first home — the window is closed to new borrowers.',
  },
  {
    id: 'sec80eea', section: 's.80EEA', target: 'chapterVIA.80EEA',
    label: 'Extra home loan interest, affordable housing (80EEA)',
    hint: 'Up to ₹1.5 lakh on top of s.24(b), for a loan sanctioned between April 2019 and March 2022 on a house under ₹45 lakh. Cannot be claimed alongside 80EE.',
  },
  {
    id: 'sec80eeb', section: 's.80EEB', target: 'chapterVIA.80EEB',
    label: 'Electric vehicle loan interest (80EEB)',
    hint: 'Up to ₹1.5 lakh of interest on a loan to buy an electric vehicle, sanctioned between April 2019 and March 2023.',
  },
  {
    id: 'sec80gga', section: 's.80GGA', target: 'chapterVIA.80GGA',
    label: 'Donations for scientific research or rural development (80GGA)',
    hint: 'No ceiling, and no requirement that it be a charity — it is for approved research institutions. Not available if you already have business income, which has its own section for this.',
  },
  {
    id: 'sec80ggc', section: 's.80GGC', target: 'chapterVIA.80GGC',
    label: 'Contribution to a political party (80GGC)',
    hint: 'The whole amount, with no ceiling — but not a rupee of it in cash. Anything paid in cash is disallowed entirely.',
  },
  {
    id: 'sec80jjaa', section: 's.80JJAA', target: 'chapterVIA.80JJAA',
    label: 'Wages of new employees you took on (80JJAA)',
    hint: '30% of what you paid employees hired this year, for three years running. One of only three deductions the new regime keeps, and the only one that is a business deduction.',
    excluded: [
      { category: 'salaried', statute: 's.80JJAA is a deduction against the profits of a business or profession for the cost of additional employees. A salaried filer has no such profits to reduce.' },
    ],
  },
  {
    id: 'sec80qqb', section: 's.80QQB', target: 'chapterVIA.80QQB',
    label: 'Royalty on a book you wrote (80QQB)',
    hint: 'Up to ₹3 lakh of royalty or copyright income from a book — literary, artistic or scientific, but not a textbook or a guide.',
  },
  {
    id: 'sec80rrb', section: 's.80RRB', target: 'chapterVIA.80RRB',
    label: 'Royalty on a patent you hold (80RRB)',
    hint: 'Up to ₹3 lakh of royalty on a patent registered in your own name under the Patents Act.',
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

/**
 * The two income blocks on Rahul's sheet: what adds up, and what must be kept
 * apart. `separate` is block (2) — *"only those that can't be clubbed in
 * dropdown-1"* — and its members say why, one by one.
 */
export const incomeBlocksFor = (category: string): { clubbable: IncomeSource[]; separate: IncomeSource[] } => {
  const eligible = incomeSourcesFor(category);
  return {
    clubbable: eligible.filter((s) => !s.unclubbable),
    separate: eligible.filter((s) => s.unclubbable),
  };
};

/** Everything this category may lawfully claim, in this regime. */
export const deductionsFor = (category: string, regime: Regime): Deduction[] =>
  DEDUCTIONS.filter(
    (d) => !d.pending && !isExcluded(d, category) && regimesForDeduction(d).includes(regime)
  );

/**
 * The one field this category opens on — dd-022, and there is exactly one.
 *
 * Everything else in the form is reached through the add control. This replaces
 * `splitByVisibility`, which answered "which fields stay on screen" and was the
 * encoding of a reading Rahul overturned on 18 Aug: the answer is not a set, it
 * is a field.
 *
 * Deductions and the sources that cannot be clubbed have no primary at all, and
 * that is correct rather than an omission: the standard deduction is applied
 * without being asked, and nobody has a capital gain by default.
 */
export const primaryIncomeFor = (category: string): IncomeSource | null =>
  INCOME_SOURCES.find(
    (s) => (s.primaryFor ?? []).includes(category) && !s.pending && !isExcluded(s, category)
  ) ?? null;

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
