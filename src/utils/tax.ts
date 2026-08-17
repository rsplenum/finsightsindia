/**
 * India income tax, FY 2025-26 (AY 2026-27), for a resident individual.
 *
 * Structured by the five heads of income in s.14, because that is what the Act
 * does and because the reader's own question - "I also have a rented flat" - is
 * a question about a head. A page organised as one flat list of fields cannot
 * answer it without showing every field to everybody.
 */

export type AgeBracket = 'below60' | '60_80' | 'above80';
export type Regime = 'new' | 'old';

/**
 * Head 2 - income from house property.
 *
 * `interest` is s.24(b), interest on borrowed capital. Note the asymmetry the
 * reader will not expect: on a SELF-OCCUPIED property it is capped at Rs 2 lakh
 * and allowed only under the old regime; on a LET-OUT property it is uncapped,
 * but the LOSS it creates is what gets capped instead, at Rs 2 lakh a year
 * against other heads (s.71(3A)).
 */
export interface HousePropertyInput {
    kind: 'none' | 'selfOccupied' | 'letOut';
    /** Annual rent received or receivable. Let-out only. */
    annualRent: number;
    /** Municipal taxes actually PAID by the owner in the year. Let-out only. */
    municipalTaxes: number;
    /** Interest on borrowed capital, s.24(b). */
    interest: number;
}

/**
 * Head 3 - profits and gains of business or profession.
 *
 * Presumptive taxation is an ELECTION, not a fact about the reader, so the
 * engine computes every basis that is open to them and lets the page show them
 * side by side. The difference between declaring actual profit and declaring a
 * deemed one is the whole lesson for a small business (dd-006/dont-2), so it
 * must not sit behind a dropdown that shows one answer at a time.
 */
export interface BusinessInput {
    /** Net profit as per books. May be negative. */
    netProfit: number;
    /** Business turnover, for s.44AD. */
    turnover: number;
    /** Professional gross receipts, for s.44ADA. */
    professionalReceipts: number;
    /**
     * Share of receipts taken through banking or prescribed electronic modes,
     * 0-100. It does two jobs: it sets the 44AD rate (6% on the digital part,
     * 8% on the cash part) and it raises both turnover ceilings when cash is
     * 5% or less. One field rather than two because the reader thinks of it as
     * one fact about how they get paid.
     */
    digitalSharePct: number;
    /** Which basis the reader is electing. Both are always computed. */
    basis: 'books' | '44AD' | '44ADA';
}

/** s.44AD - 8% of turnover, 6% on whatever came through a bank. */
export const RATE_44AD_CASH = 0.08;
export const RATE_44AD_DIGITAL = 0.06;
/** s.44ADA - half of gross receipts, for the professions in s.44AA(1). */
export const RATE_44ADA = 0.5;
/** Ceilings, and the raised ones that apply when cash receipts are <= 5%. */
export const LIMIT_44AD = 20000000;
export const LIMIT_44AD_MOSTLY_DIGITAL = 30000000;
export const LIMIT_44ADA = 5000000;
export const LIMIT_44ADA_MOSTLY_DIGITAL = 7500000;
/** Cash may be no more than this share of receipts to earn the raised ceiling. */
export const CASH_SHARE_FOR_RAISED_LIMIT = 5;

/** One presumptive basis: whether it is open, and what it would deem. */
export interface PresumptiveDetail {
    available: boolean;
    /** The ceiling that applied, given how much came through a bank. */
    limit: number;
    /** Turnover or gross receipts, whichever this basis runs on. */
    receipts: number;
    /** Blended for 44AD; a flat 50% for 44ADA. */
    effectiveRate: number;
    deemedProfit: number;
    /** Why it is not available, in the reader's words. Empty when it is. */
    unavailableReason: string;
}

export interface BusinessDetail {
    /** What actually entered the computation, on the elected basis. */
    taxedProfit: number;
    basis: BusinessInput['basis'];
    booksProfit: number;
    ad44: PresumptiveDetail;
    ada44: PresumptiveDetail;
}

/**
 * Head 4 - capital gains, split by the RATE that applies rather than by the
 * asset, because the rate is the only thing the arithmetic cares about.
 *
 * Three of these four are taxed at their own flat rate and sit OUTSIDE the
 * slabs entirely. That is what makes this head different from every other one
 * and is the reason it gets its own item on the gate.
 */
export interface CapitalGainsInput {
    /** Listed equity and equity MF, STT paid, held <= 12 months. s.111A. */
    stcg111A: number;
    /** Listed equity and equity MF held > 12 months. s.112A. */
    ltcg112A: number;
    /** Other long-term gains - property, gold, unlisted, debt. s.112. */
    ltcg112: number;
    /**
     * Short-term gains that are NOT s.111A - property, gold, unlisted shares,
     * and post-April-2023 debt funds. These are ordinary income at slab rates,
     * and the commonest reader mistake is assuming all "short term capital
     * gains" mean the 20% rate.
     */
    stcgSlab: number;
}

/** s.111A - listed equity STCG. 15% until 23 July 2024; 20% since. */
export const STCG_111A_RATE = 0.2;
/** s.112A - listed equity LTCG, and s.112 for everything else long-term. */
export const LTCG_RATE = 0.125;
/** s.112A(1) - the first Rs 1.25 lakh of listed equity LTCG each year. */
export const LTCG_112A_EXEMPTION = 125000;
/**
 * Surcharge on income taxed under s.111A, s.112A and s.112 is capped at 15%,
 * however high the total income goes. Without this a reader at 6 crore would
 * be shown 25% or 37% surcharge on their capital gains.
 */
export const CG_SURCHARGE_CAP = 0.15;

/** What each bucket of gain did: what was exempt, what was taxed, at what. */
export interface GainDetail {
    gain: number;
    /** Exempt under s.112A's own Rs 1.25 lakh allowance. Zero for the others. */
    ownExemption: number;
    /** Unused basic exemption limit soaked up by this bucket. */
    basicExemptionUsed: number;
    taxed: number;
    rate: number;
    tax: number;
}

export interface CapitalGainsDetail {
    /** Short-term gains that are ordinary income; already inside the slabs. */
    slabTaxed: number;
    stcg111A: GainDetail;
    ltcg112A: GainDetail;
    ltcg112: GainDetail;
    /** Total gain taxed outside the slabs. */
    specialRateIncome: number;
    /** Tax on it, before surcharge and cess. */
    specialRateTax: number;
    /** Unused basic exemption absorbed against gains, across all buckets. */
    basicExemptionAbsorbed: number;
}

/**
 * Losses - this year's, and the ones brought forward from earlier years.
 *
 * The Act keeps three rules apart and readers routinely merge them:
 *   INTRA-HEAD (s.70)  a loss against income of its own kind.
 *   INTER-HEAD (s.71)  what is left, against other heads - with a business loss
 *                      barred from salary, and a capital loss barred from
 *                      everything outside capital gains.
 *   CARRY-FORWARD      what still remains, for up to eight years, and only
 *                      against its own kind from then on.
 */
export interface LossesInput {
    /** This year's capital losses. */
    shortTermLoss: number;
    longTermLoss: number;
    /** Brought forward from earlier years - s.72, s.74, s.71B. */
    broughtForwardBusiness: number;
    broughtForwardHouseProperty: number;
    broughtForwardShortTerm: number;
    broughtForwardLongTerm: number;
}

/** One loss: what came in, what was used, what goes to next year. */
export interface LossUse {
    available: number;
    used: number;
    carriedForward: number;
}

export interface LossDetail {
    shortTerm: LossUse;
    longTerm: LossUse;
    business: LossUse;
    houseProperty: LossUse;
    /**
     * A capital loss can NEVER be set against salary, rent or interest - only
     * against capital gains. Surfaced so the screen can say so, because a
     * reader watching a large loss fail to move their bill deserves the reason.
     */
    capitalLossBarredFromOtherHeads: boolean;
}

/**
 * The Chapter VI-A sections the engine can price.
 *
 * Deliberately a closed union rather than a free string: an unknown section
 * reaching the deduction total would be a silent, uncapped deduction, and the
 * gate's highest-value item is precisely that a renamed field becomes
 * `undefined` at runtime while the build stays green.
 */
export type ChapterVIASection =
    | '80C'
    | '80CCC'
    | '80CCD1'
    | '80CCD1B'
    | '80CCD2'
    | '80CCH1'
    | '80CCH2'
    | '80D'
    | '80DD'
    | '80DDB'
    | '80E'
    | '80EE'
    | '80EEA'
    | '80EEB'
    | '80G'
    | '80GG'
    | '80GGA'
    | '80GGC'
    | '80JJAA'
    | '80QQB'
    | '80RRB'
    | '80TTA'
    | '80TTB'
    | '80U';

interface ChapterVIARule {
    /** Which regimes allow it. s.115BAC withdraws all but three of these. */
    regimes: readonly Regime[];
    /** The statutory ceiling, or `null` where the section sets none. */
    cap: number | null;
    /**
     * A ceiling that moves with the filer's own facts - age, salary, or gross
     * total income. `gti` is passed because s.80CCD(1)'s ceiling is a share of
     * SALARY for an employee and of GROSS TOTAL INCOME for everybody else, and
     * a rule that cannot see gross total income would have to overstate the
     * ceiling for every self-employed filer. Overstating a deduction understates
     * the tax, which is the one direction this engine must never round.
     */
    capFor?: (input: TaxInput, regime: Regime, gti: number) => number | null;
    /** Non-empty when the filer cannot claim this section at all. */
    barredFor?: (input: TaxInput) => string;
}

/**
 * SECTIONS THAT SHARE ONE CEILING BETWEEN THEM, rather than each having their own.
 *
 * s.80CCE is the reason this exists, and it is the reason 80CCC and 80CCD(1)
 * could not simply be added to the table above. Each of the three sets its own
 * limit of Rs 1.5 lakh, and s.80CCE then caps the THREE TOGETHER at Rs 1.5 lakh.
 * A reader claiming the maximum under each would otherwise be handed Rs 4.5 lakh
 * of deductions the Act does not allow - a silent understatement of tax on the
 * commonest deduction on the form.
 *
 * The order is the order of the table, and it does not change the bill: all
 * three reduce slab income at the same rate. It changes only which section the
 * screen reports as cut, and the reason names the provision that did it.
 */
export const CHAPTER_VIA_GROUPS: ReadonlyArray<{
    id: string;
    sections: readonly ChapterVIASection[];
    cap: number;
    reason: string;
}> = [
    {
        id: '80CCE',
        sections: ['80C', '80CCC', '80CCD1'],
        cap: 150000,
        reason:
            's.80CCE caps s.80C, s.80CCC and s.80CCD(1) at Rs 1,50,000 BETWEEN them, not each. Your earlier claims used the ceiling up.',
    },
];

/**
 * Every ceiling in Chapter VI-A, in one table, for FY 2025-26.
 *
 * A ceiling here is the STATUTORY MAXIMUM, not a judgement about what a reader
 * is likely to claim. Where the section genuinely sets none - 80E on education
 * loan interest, 80G where the qualifying amount depends on the donee - the cap
 * is `null` and the reader's figure stands. Inventing a ceiling to feel safe
 * would understate a real deduction, which is the same class of harm as
 * inventing a deduction.
 */
export const CHAPTER_VIA_RULES: Record<ChapterVIASection, ChapterVIARule> = {
    '80C': { regimes: ['old'], cap: 150000 },
    // Its own limit is Rs 1.5 lakh and s.80CCE then shares that between the
    // three - see CHAPTER_VIA_GROUPS.
    '80CCC': { regimes: ['old'], cap: 150000 },
    // The filer's OWN contribution to the NPS, and its ceiling is the reason
    // `capFor` had to be given gross total income: 10% of salary for an
    // employee, 20% of gross total income for anyone else.
    '80CCD1': {
        regimes: ['old'],
        cap: 150000,
        capFor: (input, _regime, gti) => {
            if (input.grossSalary > 0) {
                const salary = input.basicSalary > 0 ? input.basicSalary : input.grossSalary;
                return Math.round(salary * 0.1);
            }
            return Math.round(Math.max(0, gti) * 0.2);
        },
    },
    '80CCD1B': { regimes: ['old'], cap: 50000 },
    // The one survivor of s.115BAC, and the reason it is worth a reader's while
    // to ask their employer for it. The ceiling is a share of salary rather than
    // a flat sum: 14% under the new regime, 10% under the old for a non-government
    // employee. `basicSalary` here is basic plus DA, the statute's "salary"; it
    // falls back to gross when the reader has not broken it out, which overstates
    // the ceiling rather than silently zeroing a real deduction.
    '80CCD2': {
        regimes: ['old', 'new'],
        cap: null,
        capFor: (input, regime) => {
            const salary = input.basicSalary > 0 ? input.basicSalary : input.grossSalary;
            return Math.round(salary * (regime === 'new' ? 0.14 : 0.1));
        },
    },
    // The Agnipath scheme, s.80CCH, and it is TWO sections because the two
    // halves survive s.115BAC differently. The Agniveer's own contribution is an
    // old-regime deduction; the Central Government's contribution to their
    // Corpus Fund account is one of the three things the new regime keeps.
    // Modelling them as one field would have given the new regime a deduction it
    // does not allow, or withheld one it does.
    '80CCH1': { regimes: ['old'], cap: null },
    '80CCH2': { regimes: ['old', 'new'], cap: null },
    // 25,000 for the filer's own family, 50,000 where the insured is a senior
    // citizen, and the two stack - so 1,00,000 is the aggregate maximum.
    '80D': { regimes: ['old'], cap: 100000 },
    // A FIXED sum, not a reimbursement: 75,000, or 1,25,000 where the disability
    // is severe. The cap is the severe figure because the engine is not told
    // which it is, and the reader who types the lower one gets it unchanged.
    '80DD': { regimes: ['old'], cap: 125000 },
    // 40,000, or 1,00,000 where the patient is a senior citizen.
    '80DDB': {
        regimes: ['old'],
        cap: 40000,
        capFor: (input) => (input.ageBracket === 'below60' ? 40000 : 100000),
    },
    '80E': { regimes: ['old'], cap: null },
    // The two extra slices of home loan interest, each shut to new borrowers by
    // the date its window closed. The ceilings are what the Act sets; whether
    // this filer's loan falls inside the window is theirs to know.
    '80EE': { regimes: ['old'], cap: 50000 },
    '80EEA': { regimes: ['old'], cap: 150000 },
    '80EEB': { regimes: ['old'], cap: 150000 },
    '80G': { regimes: ['old'], cap: null },
    '80GG': { regimes: ['old'], cap: 60000 },
    '80GGA': { regimes: ['old'], cap: null },
    '80GGC': { regimes: ['old'], cap: null },
    // The second survivor of s.115BAC after 80CCD(2), and the only one that is
    // a BUSINESS deduction: 30% of the wages of employees taken on this year,
    // for three years running.
    '80JJAA': { regimes: ['old', 'new'], cap: null },
    '80QQB': { regimes: ['old'], cap: 300000 },
    '80RRB': { regimes: ['old'], cap: 300000 },
    // 80TTA and 80TTB are the same relief at two ages, and the statute lets a
    // filer have exactly one of them. Barring rather than capping, because the
    // reader who is 65 and claims 80TTA has not claimed too much - they have
    // claimed under the wrong section, and the screen should say which.
    '80TTA': {
        regimes: ['old'],
        cap: 10000,
        barredFor: (input) =>
            input.ageBracket === 'below60'
                ? ''
                : 's.80TTA is for filers under 60. At your age the wider s.80TTB applies instead, and the two cannot both be claimed.',
    },
    '80TTB': {
        regimes: ['old'],
        cap: 50000,
        barredFor: (input) =>
            input.ageBracket === 'below60'
                ? 's.80TTB is available only from age 60. Below that the narrower s.80TTA applies instead.'
                : '',
    },
    '80U': { regimes: ['old'], cap: 125000 },
};

/** What happened to one claimed section, so the screen can say it. */
export interface ChapterVIALine {
    section: ChapterVIASection;
    claimed: number;
    allowed: number;
    /**
     * The ceiling that applied to this filer, or `null` where the section sets
     * none. Carried as a number rather than baked into `reason`, because a
     * figure the engine has formatted into a sentence is a figure the screen
     * cannot frame - dd-019 wants the quantity, the amount and the frame
     * arriving together, and only the view knows how this page says rupees.
     */
    cap: number | null;
    /**
     * Why less was allowed than claimed. Empty when the whole claim stood.
     *
     * Present for the same reason `businessLossNotSetOff` is: a number the
     * reader typed that quietly stops mattering is the sol-041 shape, and a
     * screen that cannot say "this is not being used" can only not use it.
     */
    reason: string;
}

export interface ChapterVIADetail {
    /** One line per section the reader claimed, in the order of the table above. */
    lines: ChapterVIALine[];
    /** The sum of what the sections allowed, before s.80A(2) bites. */
    beforeGtiClamp: number;
    /** What s.80A(2) removed - Chapter VI-A may reduce income to nil, never below. */
    clampedByGti: number;
    /** What actually came off gross total income. */
    total: number;
}

export interface TaxInput {
    // --- Head 1: Salaries ---
    grossSalary: number;
    basicSalary: number;
    hraReceived: number;
    rentPaid: number;
    isMetro: boolean;

    // --- Head 2: House property ---
    houseProperty: HousePropertyInput;

    // --- Head 3: Business or profession ---
    business: BusinessInput;

    // --- Head 4: Capital gains ---
    capitalGains: CapitalGainsInput;

    // --- Head 5: Other sources ---
    otherIncome: number;

    /**
     * INCOME THAT IS DECLARED AND NOT TAXED - a partner's share of a firm's
     * profit under s.10(2A) is the common case.
     *
     * It touches no tax figure at all, and that is the point rather than an
     * oversight. It is here because a reader who received it wants to see it
     * accounted for; leaving it off the form makes them either omit real money
     * or push it into a taxable box.
     *
     * This is the one field on the form that is ALLOWED to move no bill, and it
     * is not sol-041's fault wearing a disguise: the difference is that the
     * screen SAYS it is exempt, on its own row, naming the provision. sol-041 is
     * about a figure that quietly stops mattering. This one loudly does not.
     */
    exemptIncome: number;

    losses: LossesInput;

    ageBracket: AgeBracket;

    /**
     * Professional tax, s.16(iii). NOT Chapter VI-A - it comes off salary
     * itself, before gross total income is struck, which is why it cannot live
     * in the map below however much it looks like it belongs there.
     */
    professionalTax: number;

    /**
     * Chapter VI-A, one entry per section.
     *
     * This was three named fields - `sec80c`, `sec80d`, `sec80ccd1b` - each
     * with its ceiling written inline as a `Math.min`. Three was liveable; the
     * catalogue offers thirteen, and thirteen inline ceilings is sol-038's
     * shape with a decade of Budgets ahead of it. One map, one rules table, one
     * place a ceiling changes.
     *
     * A section absent from the map is not claimed. A section present with 0 is
     * claimed as nothing, which is the same rupees and a different sentence -
     * the distinction matters to the screen, not to the arithmetic.
     */
    chapterVIA: Partial<Record<ChapterVIASection, number>>;

    /**
     * NOT A FORM FIELD. The break-even solver asks "what if this reader could
     * claim d more?" by bisecting on this, and it does so THROUGH THIS ENGINE
     * rather than reimplementing the old regime beside it. A second derivation
     * of the same tax is sol-038's fault exactly, and the break-even would
     * eventually disagree with the two columns it sits under.
     *
     * Uncapped on purpose: it stands for any further relief the reader might
     * find, not for a particular section with a particular ceiling.
     */
    whatIfExtraDeduction?: number;
}

export interface SlabDetail {
    range: string;
    rate: string;
    tax: number;
}

/** What each head contributed, after the set-off rules that apply to it. */
export interface HeadDetail {
    /** Gross salary less the standard deduction and (old regime) HRA. */
    salary: number;
    /**
     * House property income as computed - negative when interest exceeds the
     * net annual value, which is the normal case for a self-occupied home.
     */
    housePropertyIncome: number;
    /**
     * How much of a house property LOSS was actually allowed against the other
     * heads this year. Old regime: capped at Rs 2 lakh (s.71(3A)), and further
     * capped by the income available to absorb it. New regime: always zero.
     */
    housePropertySetOff: number;
    /** The part of the loss that could not be used this year. */
    housePropertyCarriedForward: number;
    business: number;
    /** Every basis costed, so the page can show the election rather than hide it. */
    businessDetail: BusinessDetail;
    /**
     * A business loss the engine has NOT set off, because inter-head set-off of
     * business losses is the loss item on the gate and is not modelled yet.
     * Reported rather than silently floored to zero: a number the reader typed
     * that quietly stops mattering is the sol-041 shape, and the screen must be
     * able to say "this is not being used" instead of just not using it.
     */
    businessLossNotSetOff: number;
    otherSources: number;
}

export interface TaxRegimeResult {
    /** Sum of the heads BEFORE the standard deduction, HRA or Chapter VI-A. */
    grossIncome: number;
    /**
     * GROSS TOTAL INCOME - s.80B(5). The heads after every set-off the year
     * allows, and the figure Chapter VI-A is then applied to.
     *
     * Distinct from `grossIncome` above, which is what the reader EARNED and is
     * the denominator of the effective rate. This one is what the Act has left
     * to work with, and the Income Computation panel needs it by name: without
     * it the panel's rows run from the heads straight to `slabIncome`, and the
     * deduction total appears to come off a figure that is nowhere on screen -
     * dd-009/do-1, a figure the reader cannot trace back.
     */
    grossTotalIncome: number;
    heads: HeadDetail;
    exemptions: number;
    deductions: number;
    /** Every Chapter VI-A section claimed, with what each was actually worth. */
    chapterVIADetail: ChapterVIADetail;
    standardDeduction: number;
    /** s.16(iii), off salary itself. Zero under the new regime. */
    professionalTax: number;
    /** Declared, not taxed. Carried through so the panel can show it as a row. */
    exemptIncome: number;
    /** Total income - the slab part plus the special-rate part. */
    taxableIncome: number;
    /** The part of total income that goes through the slabs. */
    slabIncome: number;
    capitalGains: CapitalGainsDetail;
    losses: LossDetail;

    slabs: SlabDetail[];
    /** Tax from the slabs alone. */
    slabTax: number;
    /** Tax on capital gains at their own flat rates. */
    specialRateTax: number;
    /** slabTax + specialRateTax. */
    baseTax: number;
    rebate87A: number;
    surcharge: number;
    marginalRelief: number;
    cess: number;
    totalTax: number;

    effectiveRate: string;
}

export interface TaxComparisonResult {
    newRegime: TaxRegimeResult;
    oldRegime: TaxRegimeResult;
    savingsAmount: number;
    isNewBetter: boolean;
    isOldBetter: boolean;
}

/** Statutory rounding of taxable income and tax payable - s.288A and s.288B. */
function round10(val: number): number {
    return Math.round(val / 10) * 10;
}

/** The Rs 2 lakh ceiling, which appears twice in house property for two reasons. */
export const SOP_INTEREST_CAP = 200000;
export const HP_LOSS_SETOFF_CAP = 200000;

/** Standard deduction on salary, s.16(ia). */
export const STD_DEDUCTION_NEW = 75000;
export const STD_DEDUCTION_OLD = 50000;

function calculateHRAExemption(input: TaxInput): number {
    if (input.rentPaid <= 0 || input.hraReceived <= 0 || input.basicSalary <= 0) return 0;
    const rule1 = input.hraReceived;
    const rule2 = input.isMetro ? 0.5 * input.basicSalary : 0.4 * input.basicSalary;
    const rule3 = Math.max(0, input.rentPaid - 0.1 * input.basicSalary);
    return Math.min(rule1, rule2, rule3);
}

/**
 * Income from house property, which is negative far more often than readers
 * expect - a self-occupied home produces nothing but a deduction.
 *
 * The regime matters here, and it is the single largest reason a homeowner with
 * a big loan is still better off under the old regime. s.115BAC withdraws the
 * s.24(b) deduction for a self-occupied property entirely: not capped lower,
 * withdrawn. On a let-out property the interest survives under both regimes,
 * because it is being set against rent that is itself taxable.
 */
export function computeHousePropertyIncome(hp: HousePropertyInput, regime: Regime): number {
    if (hp.kind === 'none') return 0;

    if (hp.kind === 'selfOccupied') {
        // Annual value of a self-occupied house is nil, so the head can only
        // ever be zero or a loss.
        if (regime === 'new') return 0;
        const loss = Math.min(Math.max(0, hp.interest), SOP_INTEREST_CAP);
        // `-loss` on a loss of zero is NEGATIVE ZERO, and -0 >= 0 is true, so
        // it slipped through every sign check and reached Intl, which printed
        // it honestly as "-Rs 0" on a page with no home loan at all. Found by
        // reading the screen; no test would have asked.
        return loss === 0 ? 0 : -loss;
    }

    // Let out. Gross annual value, less municipal taxes actually paid, gives the
    // net annual value; then 30% of NAV as the standard deduction under s.24(a),
    // then interest under s.24(b), which is NOT capped for a let-out property.
    const nav = Math.max(0, hp.annualRent - Math.max(0, hp.municipalTaxes));
    const standard = nav * 0.30;
    return nav - standard - Math.max(0, hp.interest);
}

/** The surcharge tier for a total income, and the tier below it. */
function surchargeTier(
    totalIncome: number,
    isNewRegime: boolean
): { threshold: number; rate: number; previousRate: number } {
    if (totalIncome > 50000000)
        return { threshold: 50000000, rate: isNewRegime ? 0.25 : 0.37, previousRate: 0.25 };
    if (totalIncome > 20000000) return { threshold: 20000000, rate: 0.25, previousRate: 0.15 };
    if (totalIncome > 10000000) return { threshold: 10000000, rate: 0.15, previousRate: 0.1 };
    if (totalIncome > 5000000) return { threshold: 5000000, rate: 0.1, previousRate: 0 };
    return { threshold: 0, rate: 0, previousRate: 0 };
}

/**
 * Surcharge, with capital gains capped at 15%, and marginal relief.
 *
 * The cap is the reason this takes the two taxes separately rather than one
 * total: surcharge on income under s.111A, s.112A and s.112 never exceeds 15%
 * however high the total income goes, so at the 25% and 37% tiers the two parts
 * of the same bill carry different surcharge rates.
 *
 * MARGINAL RELIEF WITH MIXED INCOME IS AN APPROXIMATION AND IS LABELLED ONE.
 * Relief compares the bill against the bill at the threshold plus the income
 * above it. With slab and special-rate income mixed, "the bill at the
 * threshold" depends on which income you imagine reducing. This reduces the
 * SLAB income and holds the gains constant, which is the common reading, but it
 * is an inference rather than a citation. It only bites within a few lakh of
 * each threshold. On the gate as needing verification - sol-042 is what
 * happens when an untested expectation is written down as a finding.
 */
function computeSurchargeAndRelief(
    totalIncome: number,
    slabIncome: number,
    slabTax: number,
    specialTax: number,
    isNewRegime: boolean,
    ageBracket: AgeBracket
): { surcharge: number; relief: number } {
    const { threshold, rate, previousRate } = surchargeTier(totalIncome, isNewRegime);
    if (rate === 0) return { surcharge: 0, relief: 0 };

    const cgRate = Math.min(rate, CG_SURCHARGE_CAP);
    const rawSurcharge = slabTax * rate + specialTax * cgRate;
    const baseTax = slabTax + specialTax;
    const taxWithSurcharge = baseTax + rawSurcharge;

    // The bill had total income been exactly the threshold: take the excess out
    // of the slab income, leave the gains where they are.
    const excess = totalIncome - threshold;
    const slabAtThreshold = Math.max(0, slabIncome - excess);
    const slabTaxAtThreshold = isNewRegime
        ? computeNewRegimeBaseTax(slabAtThreshold).baseTax
        : computeOldRegimeBaseTax(slabAtThreshold, ageBracket).baseTax;

    const prevCgRate = Math.min(previousRate, CG_SURCHARGE_CAP);
    const taxAtThreshold =
        slabTaxAtThreshold +
        specialTax +
        slabTaxAtThreshold * previousRate +
        specialTax * prevCgRate;

    const maxTaxAllowed = taxAtThreshold + excess;

    if (taxWithSurcharge > maxTaxAllowed) {
        return { surcharge: rawSurcharge, relief: taxWithSurcharge - maxTaxAllowed };
    }

    return { surcharge: rawSurcharge, relief: 0 };
}

const NEW_SLAB_WIDTHS = [400000, 400000, 400000, 400000, 400000, 400000, Infinity];
const NEW_SLAB_RATES = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3];
const NEW_SLAB_LABELS = [
    '0 - 4L',
    '4L - 8L',
    '8L - 12L',
    '12L - 16L',
    '16L - 20L',
    '20L - 24L',
    '> 24L',
];

function computeNewRegimeBaseTax(income: number): { baseTax: number; slabs: SlabDetail[] } {
    // This used to compute the tax twice - once through a chain of if/else
    // branches whose result was then discarded, and once by walking the slabs.
    // Only the walk was ever returned. The dead branch is gone; the walk is the
    // definition, and tax.test.ts asserts the slabs sum to the base tax.
    const slabs: SlabDetail[] = [];
    let totalTax = 0;
    let rem = income;

    for (let i = 0; i < NEW_SLAB_WIDTHS.length; i++) {
        if (rem <= 0) break;
        const taxableInSlab = Math.min(rem, NEW_SLAB_WIDTHS[i]);
        const taxInSlab = taxableInSlab * NEW_SLAB_RATES[i];
        totalTax += taxInSlab;
        slabs.push({
            range: NEW_SLAB_LABELS[i],
            rate: `${NEW_SLAB_RATES[i] * 100}%`,
            tax: taxInSlab,
        });
        rem -= taxableInSlab;
    }

    return { baseTax: totalTax, slabs };
}

function computeOldRegimeBaseTax(
    income: number,
    age: AgeBracket
): { baseTax: number; slabs: SlabDetail[] } {
    let exemption = 250000;
    if (age === '60_80') exemption = 300000;
    if (age === 'above80') exemption = 500000;

    const slabs: SlabDetail[] = [];
    let totalTax = 0;
    let rem = income;

    const slab1 = Math.min(rem, exemption);
    slabs.push({ range: `0 - ${(exemption / 100000).toFixed(1)}L`, rate: '0%', tax: 0 });
    rem -= slab1;

    if (rem > 0 && exemption < 500000) {
        const taxable = Math.min(rem, 500000 - exemption);
        const t = taxable * 0.05;
        totalTax += t;
        slabs.push({ range: `${(exemption / 100000).toFixed(1)}L - 5L`, rate: '5%', tax: t });
        rem -= taxable;
    }

    if (rem > 0) {
        const taxable = Math.min(rem, 500000);
        const t = taxable * 0.2;
        totalTax += t;
        slabs.push({ range: '5L - 10L', rate: '20%', tax: t });
        rem -= taxable;
    }

    if (rem > 0) {
        const t = rem * 0.3;
        totalTax += t;
        slabs.push({ range: '> 10L', rate: '30%', tax: t });
    }

    return { baseTax: totalTax, slabs };
}

/**
 * Aggregate the heads and apply the inter-head set-off rules.
 *
 * The only set-off that can happen here is a house property loss against the
 * other heads, and the two regimes treat it completely differently:
 *
 *   old: allowed, but capped at Rs 2 lakh a year (s.71(3A)).
 *   new: NOT allowed against other heads at all, under s.115BAC.
 *
 * Either way the unused part is carried forward, and both are reported so the
 * screen can say what happened rather than showing a number that quietly
 * shrank. A business loss set-off is not modelled here - it is the loss item on
 * the gate, and asserting its interaction now is exactly the sol-042 mistake.
 */
function aggregateHeads(
    input: TaxInput,
    regime: Regime,
    netGains: CapitalGainsInput
): {
    heads: HeadDetail;
    gti: number;
    grossIncome: number;
    /** Business loss with nowhere left to go among the slab heads. */
    businessLossRemaining: number;
    businessUse: LossUse;
    housePropertyUse: LossUse;
} {
    const stdDeduction =
        input.grossSalary > 0
            ? Math.min(input.grossSalary, regime === 'new' ? STD_DEDUCTION_NEW : STD_DEDUCTION_OLD)
            : 0;
    const hra = regime === 'old' ? calculateHRAExemption(input) : 0;
    // s.16(iii), and it goes here rather than with Chapter VI-A because it is a
    // deduction FROM SALARY, taken before gross total income is struck. Old
    // regime only - s.115BAC withdraws the whole of s.16 except s.16(ia).
    const ptax = regime === 'old' ? Math.max(0, input.professionalTax) : 0;
    // Floored at zero because all three of these are reliefs against SALARY.
    // They cannot shelter interest or rent, which is what letting them run
    // negative into the other heads would have done.
    const salary = Math.max(0, input.grossSalary - stdDeduction - hra - ptax);

    const businessDetail = businessProfitFor(input.business);
    const otherSources = input.otherIncome;
    const hpIncome = computeHousePropertyIncome(input.houseProperty, regime);
    // Short-term gains that are not s.111A are ordinary income, so they belong
    // in the slab pot with everything else rather than in the special-rate one.
    const slabTaxedGains = Math.max(0, netGains.stcgSlab);

    // --- INTRA-HEAD (s.70). A brought-forward loss may only ever meet income
    // of its own kind, so these happen before anything crosses a head. ---
    const bfHp = Math.max(0, input.losses.broughtForwardHouseProperty);
    const bfHpUsed = hpIncome > 0 ? Math.min(bfHp, hpIncome) : 0;
    const hpAfterBf = hpIncome - bfHpUsed;

    const bfBiz = Math.max(0, input.losses.broughtForwardBusiness);
    const bizRaw = businessDetail.taxedProfit;
    const bfBizUsed = bizRaw > 0 ? Math.min(bfBiz, bizRaw) : 0;
    const bizAfterBf = bizRaw - bfBizUsed;

    const bizPositive = Math.max(0, bizAfterBf);
    const bizLoss = Math.max(0, -bizAfterBf);
    const hpPositive = Math.max(0, hpAfterBf);
    const hpLoss = Math.max(0, -hpAfterBf);

    // --- INTER-HEAD (s.71) ---

    // A business loss may go against any head EXCEPT salary. That bar is the
    // whole reason this is computed separately from the house property one,
    // which has no such restriction.
    let nonSalaryIncome = hpPositive + otherSources + slabTaxedGains;
    const bizLossUsedHere = Math.min(bizLoss, nonSalaryIncome);
    nonSalaryIncome -= bizLossUsedHere;
    const businessLossRemaining = bizLoss - bizLossUsedHere;

    // A house property loss may go against ANY head including salary, but only
    // up to Rs 2 lakh a year (s.71(3A)) - and under s.115BAC, not at all.
    const cap = regime === 'new' ? 0 : HP_LOSS_SETOFF_CAP;
    const availableForHp = salary + bizPositive + nonSalaryIncome;
    const hpSetOff = Math.max(0, Math.min(hpLoss, cap, availableForHp));

    const gti = salary + bizPositive + nonSalaryIncome - hpSetOff;

    return {
        heads: {
            salary,
            housePropertyIncome: hpIncome,
            housePropertySetOff: hpSetOff,
            housePropertyCarriedForward: hpLoss - hpSetOff + (bfHp - bfHpUsed),
            business: bizPositive,
            businessDetail,
            businessLossNotSetOff: businessLossRemaining,
            otherSources,
        },
        gti: Math.max(0, gti),
        // What the reader earned, from the same components the aggregation
        // used - so the effective rate's denominator can never drift from the
        // income that was actually taxed. Every gain counts here, including the
        // ones taxed outside the slabs: they are income the reader received.
        grossIncome:
            input.grossSalary +
            hpIncome +
            Math.max(0, bizRaw) +
            otherSources +
            slabTaxedGains +
            Math.max(0, netGains.stcg111A) +
            Math.max(0, netGains.ltcg112A) +
            Math.max(0, netGains.ltcg112),
        businessLossRemaining,
        businessUse: {
            available: bfBiz + bizLoss,
            used: bfBizUsed + bizLossUsedHere,
            carriedForward: bfBiz - bfBizUsed + businessLossRemaining,
        },
        housePropertyUse: {
            available: bfHp + hpLoss,
            used: bfHpUsed + hpSetOff,
            carriedForward: bfHp - bfHpUsed + (hpLoss - hpSetOff),
        },
    };
}

/**
 * Set capital losses against capital gains - s.70 for this year's, s.74 for
 * the ones brought forward.
 *
 * TWO ORDERING RULES, both chosen to give the reader the smaller bill, because
 * the Act lets the assessee choose and any other order hands them a charge the
 * law does not require:
 *
 *   A SHORT-TERM loss may be set against either kind of gain, so it goes to the
 *   dearest first: 20% s.111A gains before 12.5% long-term ones.
 *
 *   A LONG-TERM loss may only be set against long-term gains, and it goes to
 *   s.112 BEFORE s.112A - because s.112A gains carry their own Rs 1.25 lakh
 *   exemption, and spending a loss on income that was going to be exempt anyway
 *   wastes it.
 *
 * SIMPLIFICATION, STATED. A short-term loss is set against the flat-rate 20%
 * gains before slab-rate short-term gains. For a reader in the 30% bracket the
 * slab gains are actually the dearer ones, so this can leave a little tax on
 * the table. Doing better needs the marginal rate, which is not known until
 * after the set-off that determines it - a circularity worth solving only if it
 * turns out to matter. The direction is stated rather than assumed: this
 * OVERSTATES the bill for a 30%-bracket reader with both kinds of short-term
 * gain, never understates it.
 */
function applyCapitalLosses(
    cg: CapitalGainsInput,
    losses: LossesInput
): { gains: CapitalGainsInput; shortTerm: LossUse; longTerm: LossUse } {
    const buckets = {
        stcg111A: Math.max(0, cg.stcg111A),
        stcgSlab: Math.max(0, cg.stcgSlab),
        ltcg112: Math.max(0, cg.ltcg112),
        ltcg112A: Math.max(0, cg.ltcg112A),
    };

    const spend = (pool: number, order: (keyof typeof buckets)[]): number => {
        for (const k of order) {
            if (pool <= 0) break;
            const used = Math.min(pool, buckets[k]);
            buckets[k] -= used;
            pool -= used;
        }
        return pool;
    };

    const stAvailable =
        Math.max(0, losses.shortTermLoss) + Math.max(0, losses.broughtForwardShortTerm);
    const ltAvailable =
        Math.max(0, losses.longTermLoss) + Math.max(0, losses.broughtForwardLongTerm);

    // Long-term first: it is the pickier of the two, so letting the flexible
    // short-term loss go first could strand it against gains it cannot touch.
    const ltLeft = spend(ltAvailable, ['ltcg112', 'ltcg112A']);
    const stLeft = spend(stAvailable, ['stcg111A', 'stcgSlab', 'ltcg112', 'ltcg112A']);

    return {
        gains: { ...buckets },
        shortTerm: {
            available: stAvailable,
            used: stAvailable - stLeft,
            carriedForward: stLeft,
        },
        longTerm: {
            available: ltAvailable,
            used: ltAvailable - ltLeft,
            carriedForward: ltLeft,
        },
    };
}

/**
 * Both presumptive bases, computed whether or not the reader elected them.
 *
 * The deemed profit is a FLOOR, not a fixed answer: a reader whose books show
 * more may declare more, and declaring LESS than the deemed figure is what
 * costs them the scheme and triggers audit. The page shows both numbers so the
 * election is visible rather than assumed.
 */
export function computePresumptive(b: BusinessInput): {
    ad44: PresumptiveDetail;
    ada44: PresumptiveDetail;
} {
    const digital = Math.min(100, Math.max(0, b.digitalSharePct));
    const cashShare = 100 - digital;
    const mostlyDigital = cashShare <= CASH_SHARE_FOR_RAISED_LIMIT;

    // s.44AD - 6% on what came through a bank, 8% on the rest.
    const turnover = Math.max(0, b.turnover);
    const ad44Limit = mostlyDigital ? LIMIT_44AD_MOSTLY_DIGITAL : LIMIT_44AD;
    const ad44Rate = (digital / 100) * RATE_44AD_DIGITAL + (cashShare / 100) * RATE_44AD_CASH;
    const ad44Over = turnover > ad44Limit;

    // s.44ADA - half of gross receipts, for the s.44AA(1) professions.
    const receipts = Math.max(0, b.professionalReceipts);
    const ada44Limit = mostlyDigital ? LIMIT_44ADA_MOSTLY_DIGITAL : LIMIT_44ADA;
    const ada44Over = receipts > ada44Limit;

    const inCrore = (n: number) =>
        n >= 10000000 ? `${n / 10000000} crore` : `${n / 100000} lakh`;

    // A deemed profit is a rupee amount, so it is rounded to one here rather
    // than carried as a binary residue. A 50/50 split gives a blended rate of
    // 0.07000000000000001, and Rs 7,00,000.0000000001 of "profit" would be
    // shown on the comparison card and fed into the slabs. A 1e-9 residue
    // counting as a real quantity is how sol-040's phantom missed payment
    // happened; the fix belongs at the source, not in the formatter.
    const rupees = (n: number) => Math.round(n);

    return {
        ad44: {
            available: turnover > 0 && !ad44Over,
            limit: ad44Limit,
            receipts: turnover,
            effectiveRate: ad44Rate,
            deemedProfit: ad44Over ? 0 : rupees(turnover * ad44Rate),
            unavailableReason: ad44Over
                ? `Turnover is above the ${inCrore(ad44Limit)} ceiling for this scheme.`
                : turnover > 0
                  ? ''
                  : 'No business turnover entered.',
        },
        ada44: {
            available: receipts > 0 && !ada44Over,
            limit: ada44Limit,
            receipts,
            effectiveRate: RATE_44ADA,
            deemedProfit: ada44Over ? 0 : rupees(receipts * RATE_44ADA),
            unavailableReason: ada44Over
                ? `Gross receipts are above the ${inCrore(ada44Limit)} ceiling for this scheme.`
                : receipts > 0
                  ? ''
                  : 'No professional receipts entered.',
        },
    };
}

/** The profit that actually goes into the computation, on the elected basis. */
function businessProfitFor(b: BusinessInput): BusinessDetail {
    const { ad44, ada44 } = computePresumptive(b);
    const booksProfit = b.netProfit;

    // An election the reader is not eligible for falls back to the books
    // rather than silently deeming zero profit on income they really have.
    let basis = b.basis;
    if (basis === '44AD' && !ad44.available) basis = 'books';
    if (basis === '44ADA' && !ada44.available) basis = 'books';

    const taxedProfit =
        basis === '44AD' ? ad44.deemedProfit : basis === '44ADA' ? ada44.deemedProfit : booksProfit;

    return { taxedProfit, basis, booksProfit, ad44, ada44 };
}

/** The slab at which tax starts - and the allowance gains can borrow from. */
function basicExemptionLimit(regime: Regime, age: AgeBracket): number {
    if (regime === 'new') return 400000;
    if (age === '60_80') return 300000;
    if (age === 'above80') return 500000;
    return 250000;
}

/**
 * Tax the three special-rate buckets, after letting them soak up whatever is
 * left of the basic exemption limit.
 *
 * A resident individual whose ordinary income falls short of the basic
 * exemption may set the shortfall against capital gains. This matters most to
 * exactly the people least likely to know it - a retiree with almost no salary
 * and a year of realised gains.
 *
 * The shortfall is applied to the DEAREST bucket first: 20% STCG before 12.5%
 * LTCG. The Act lets the assessee choose, and choosing anything else would hand
 * the reader a larger bill than the law requires.
 */
function taxCapitalGains(
    cg: CapitalGainsInput,
    unusedBasicExemption: number
): CapitalGainsDetail {
    let remaining = Math.max(0, unusedBasicExemption);

    const absorb = (amount: number): number => {
        const used = Math.min(amount, remaining);
        remaining -= used;
        return used;
    };

    const stcgGain = Math.max(0, cg.stcg111A);
    const stcgAbsorbed = absorb(stcgGain);
    const stcgTaxed = stcgGain - stcgAbsorbed;

    // s.112A's own Rs 1.25 lakh comes off BEFORE the basic exemption is
    // borrowed against, so the allowance is not spent sheltering income that
    // was already exempt.
    const ltcgAGain = Math.max(0, cg.ltcg112A);
    const ownExemption = Math.min(ltcgAGain, LTCG_112A_EXEMPTION);
    const ltcgAAfterOwn = ltcgAGain - ownExemption;
    const ltcgAAbsorbed = absorb(ltcgAAfterOwn);
    const ltcgATaxed = ltcgAAfterOwn - ltcgAAbsorbed;

    const ltcg112Gain = Math.max(0, cg.ltcg112);
    const ltcg112Absorbed = absorb(ltcg112Gain);
    const ltcg112Taxed = ltcg112Gain - ltcg112Absorbed;

    const stcg111A: GainDetail = {
        gain: stcgGain,
        ownExemption: 0,
        basicExemptionUsed: stcgAbsorbed,
        taxed: stcgTaxed,
        rate: STCG_111A_RATE,
        tax: stcgTaxed * STCG_111A_RATE,
    };
    const ltcg112A: GainDetail = {
        gain: ltcgAGain,
        ownExemption,
        basicExemptionUsed: ltcgAAbsorbed,
        taxed: ltcgATaxed,
        rate: LTCG_RATE,
        tax: ltcgATaxed * LTCG_RATE,
    };
    const ltcg112Detail: GainDetail = {
        gain: ltcg112Gain,
        ownExemption: 0,
        basicExemptionUsed: ltcg112Absorbed,
        taxed: ltcg112Taxed,
        rate: LTCG_RATE,
        tax: ltcg112Taxed * LTCG_RATE,
    };

    return {
        slabTaxed: Math.max(0, cg.stcgSlab),
        stcg111A,
        ltcg112A,
        ltcg112: ltcg112Detail,
        specialRateIncome: stcgGain + ltcgAGain + ltcg112Gain,
        specialRateTax: stcg111A.tax + ltcg112A.tax + ltcg112Detail.tax,
        basicExemptionAbsorbed: stcgAbsorbed + ltcgAAbsorbed + ltcg112Absorbed,
    };
}

/**
 * Chapter VI-A, section by section, with a reason wherever a claim was cut.
 *
 * The order is the rules table's, so two readers claiming the same sections see
 * them in the same order however they typed them in.
 *
 * `gti` is gross total income, and s.80A(2) caps the whole chapter at it:
 * Chapter VI-A can reduce income to nil but never below, so it cannot create a
 * loss to carry anywhere. That clamp is reported separately rather than spread
 * back across the lines, because "your 80C was cut" is a different sentence
 * from "you did not earn enough for all of this to be worth claiming".
 */
function computeChapterVIA(input: TaxInput, regime: Regime, gti: number): ChapterVIADetail {
    const lines: ChapterVIALine[] = [];

    for (const section of Object.keys(CHAPTER_VIA_RULES) as ChapterVIASection[]) {
        const claimed = Math.max(0, input.chapterVIA[section] ?? 0);
        // A section the reader never opened is not a line. A section they
        // opened and left at zero is, so the panel can show it standing at
        // nothing rather than appearing to have been ignored.
        if (input.chapterVIA[section] === undefined) continue;

        const rule = CHAPTER_VIA_RULES[section];

        if (!rule.regimes.includes(regime)) {
            lines.push({
                section,
                claimed,
                allowed: 0,
                cap: 0,
                reason:
                    regime === 'new'
                        ? 's.115BAC withdraws this deduction under the new regime.'
                        : 'Not available under the old regime.',
            });
            continue;
        }

        const barred = rule.barredFor?.(input) ?? '';
        if (barred) {
            lines.push({ section, claimed, allowed: 0, cap: 0, reason: barred });
            continue;
        }

        const cap = rule.capFor ? rule.capFor(input, regime, gti) : rule.cap;
        const allowed = cap === null ? claimed : Math.min(cap, claimed);
        lines.push({
            section,
            claimed,
            allowed,
            cap,
            reason: allowed < claimed ? 'Capped by the section’s own ceiling.' : '',
        });
    }

    // s.80CCE, and any other ceiling shared BETWEEN sections rather than set on
    // each. Applied after the individual caps, because a section is first held
    // to its own limit and only then to the one it shares. Without this a reader
    // claiming the maximum under 80C, 80CCC and 80CCD(1) would be handed Rs 4.5
    // lakh where the Act allows Rs 1.5 lakh - and the bill would be wrong in the
    // direction that flatters us.
    for (const group of CHAPTER_VIA_GROUPS) {
        let left = group.cap;
        for (const line of lines) {
            if (!group.sections.includes(line.section)) continue;
            const permitted = Math.min(line.allowed, Math.max(0, left));
            left -= permitted;
            if (permitted < line.allowed) {
                line.allowed = permitted;
                // The section's own ceiling may have cut it first. Whichever
                // reason the reader is shown has to be the one that actually
                // bound, so the shared cap overwrites rather than appends.
                line.reason = group.reason;
                line.cap = group.cap;
            }
        }
    }

    // The break-even solver's lever. It is not a section and never appears as a
    // line - it stands for ANY further relief the reader might find, which is
    // why it is uncapped and why it must not be mistaken for one of the above.
    const whatIf = regime === 'old' ? Math.max(0, input.whatIfExtraDeduction ?? 0) : 0;

    const beforeGtiClamp = lines.reduce((sum, l) => sum + l.allowed, 0) + whatIf;
    const total = Math.min(beforeGtiClamp, Math.max(0, gti));

    return {
        lines,
        beforeGtiClamp,
        clampedByGti: beforeGtiClamp - total,
        total,
    };
}

function computeRegime(input: TaxInput, regime: Regime): TaxRegimeResult {
    const isNew = regime === 'new';

    // Capital losses meet capital gains first - s.70 and s.74 - so every later
    // step sees the gains that actually survived.
    const netted = applyCapitalLosses(input.capitalGains, input.losses);
    const agg = aggregateHeads(input, regime, netted.gains);
    const { heads, gti, grossIncome } = agg;

    // s.71 lets a business loss reach capital gains too, so whatever the slab
    // heads could not absorb comes here rather than being carried forward
    // early. Dearest gain first, for the same reason as everywhere else.
    const gainsAfterBusinessLoss = { ...netted.gains };
    let bizLeft = agg.businessLossRemaining;
    for (const k of ['stcg111A', 'ltcg112', 'ltcg112A'] as const) {
        if (bizLeft <= 0) break;
        const used = Math.min(bizLeft, gainsAfterBusinessLoss[k]);
        gainsAfterBusinessLoss[k] -= used;
        bizLeft -= used;
    }
    const businessUse: LossUse = {
        available: agg.businessUse.available,
        used: agg.businessUse.used + (agg.businessLossRemaining - bizLeft),
        carriedForward: agg.businessUse.carriedForward - (agg.businessLossRemaining - bizLeft),
    };

    const stdDeduction =
        input.grossSalary > 0
            ? Math.min(input.grossSalary, isNew ? STD_DEDUCTION_NEW : STD_DEDUCTION_OLD)
            : 0;
    const hra = isNew ? 0 : calculateHRAExemption(input);
    const ptax = isNew ? 0 : Math.max(0, input.professionalTax);

    // Chapter VI-A. All but s.80CCD(2) is withdrawn by s.115BAC, and which
    // sections those are is the rules table's business rather than an `isNew`
    // ternary here.
    const chapterVIADetail = computeChapterVIA(input, regime, gti);
    const chapterVIA = chapterVIADetail.total;

    // Chapter VI-A comes off the SLAB income only. s.112A(6) and s.111A(2) bar
    // it against gains taxed at special rates, so an 80C investment cannot
    // shelter an equity gain however much of it is unused.
    const slabIncome = round10(Math.max(0, gti - chapterVIA));

    const cg = taxCapitalGains(
        gainsAfterBusinessLoss,
        basicExemptionLimit(regime, input.ageBracket) - slabIncome
    );

    const taxableIncome = slabIncome + cg.specialRateIncome;

    const base = isNew
        ? computeNewRegimeBaseTax(slabIncome)
        : computeOldRegimeBaseTax(slabIncome, input.ageBracket);

    let slabPayable = base.baseTax;
    let rebate87A = 0;
    let relief87A = 0;

    // THE 87A INTERACTION - verified against two sources rather than assumed,
    // because it is the rule on this page most easily asserted backwards.
    //
    // Finance Act 2025 put it beyond doubt for AY 2026-27: under the new regime
    // the rebate is available ONLY against tax on slab income. It cannot touch
    // tax on s.111A or s.112A gains, and there is no spill-over of an unused
    // rebate onto them.
    //
    // And the threshold is tested EXCLUDING special-rate income - the opposite
    // of the intuitive "total income" reading. Rs 11 lakh of salary beside
    // Rs 2 lakh of STCG still gets the rebate on the salary. Reading it the
    // other way would deny the rebate to a great many ordinary filers.
    if (isNew) {
        if (slabIncome <= 1200000) {
            rebate87A = slabPayable;
            slabPayable = 0;
        } else {
            const excess = slabIncome - 1200000;
            if (slabPayable > excess) {
                relief87A = slabPayable - excess;
                slabPayable = excess;
            }
        }
    } else if (slabIncome <= 500000) {
        // Old regime: capped at Rs 12,500, no marginal relief by law, and
        // likewise only against slab tax - s.112A(6) is explicit for LTCG.
        // Whether it may be set against old-regime s.111A STCG is an inference
        // from the ABSENCE of a bar rather than a citation, so it is not
        // claimed here. On the gate.
        rebate87A = Math.min(slabPayable, 12500);
        slabPayable -= rebate87A;
    }

    const sur = computeSurchargeAndRelief(
        taxableIncome,
        slabIncome,
        slabPayable,
        cg.specialRateTax,
        isNew,
        input.ageBracket
    );
    const withSurcharge = slabPayable + cg.specialRateTax + sur.surcharge - sur.relief;
    const cess = withSurcharge * 0.04;
    const totalTax = round10(withSurcharge + cess);

    return {
        grossIncome,
        grossTotalIncome: gti,
        heads,
        exemptions: hra,
        deductions: chapterVIA,
        chapterVIADetail,
        standardDeduction: stdDeduction,
        professionalTax: ptax,
        exemptIncome: Math.max(0, input.exemptIncome),
        taxableIncome,
        slabIncome,
        capitalGains: cg,
        losses: {
            shortTerm: netted.shortTerm,
            longTerm: netted.longTerm,
            business: businessUse,
            houseProperty: agg.housePropertyUse,
            // Surfaced so the screen can explain a large loss that moved
            // nothing: s.71 bars a capital loss from every head but its own.
            capitalLossBarredFromOtherHeads:
                netted.shortTerm.carriedForward > 0 || netted.longTerm.carriedForward > 0,
        },
        slabs: base.slabs,
        slabTax: base.baseTax,
        specialRateTax: cg.specialRateTax,
        // Pre-rebate. The rebate and the reliefs are separate line items, so
        // adding them back here would count them twice and the on-screen
        // breakdown would stop reconciling to totalTax.
        baseTax: base.baseTax + cg.specialRateTax,
        rebate87A,
        surcharge: sur.surcharge,
        marginalRelief: relief87A + sur.relief,
        cess,
        totalTax,
        effectiveRate: grossIncome > 0 ? ((totalTax / grossIncome) * 100).toFixed(2) : '0.00',
    };
}

export function calculateIndiaTaxEngine(input: TaxInput): TaxComparisonResult {
    const newRegime = computeRegime(input, 'new');
    const oldRegime = computeRegime(input, 'old');

    return {
        newRegime,
        oldRegime,
        savingsAmount: Math.abs(newRegime.totalTax - oldRegime.totalTax),
        isNewBetter: newRegime.totalTax < oldRegime.totalTax,
        isOldBetter: oldRegime.totalTax < newRegime.totalTax,
    };
}

/** Nothing under any head. The starting point for building an input in tests. */
export const EMPTY_TAX_INPUT: TaxInput = {
    grossSalary: 0,
    basicSalary: 0,
    hraReceived: 0,
    rentPaid: 0,
    isMetro: false,
    houseProperty: { kind: 'none', annualRent: 0, municipalTaxes: 0, interest: 0 },
    business: {
        netProfit: 0,
        turnover: 0,
        professionalReceipts: 0,
        digitalSharePct: 100,
        basis: 'books',
    },
    capitalGains: { stcg111A: 0, ltcg112A: 0, ltcg112: 0, stcgSlab: 0 },
    losses: {
        shortTermLoss: 0,
        longTermLoss: 0,
        broughtForwardBusiness: 0,
        broughtForwardHouseProperty: 0,
        broughtForwardShortTerm: 0,
        broughtForwardLongTerm: 0,
    },
    otherIncome: 0,
    exemptIncome: 0,
    ageBracket: 'below60',
    professionalTax: 0,
    chapterVIA: {},
};
