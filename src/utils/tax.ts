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

/** Head 3 - profits and gains of business or profession. Presumptive is next. */
export interface BusinessInput {
    /** Net profit as per books. May be negative. */
    netProfit: number;
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

    ageBracket: AgeBracket;

    // --- Chapter VI-A deductions (old regime only) ---
    sec80c: number;
    sec80d: number;
    sec80ccd1b: number;
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
    heads: HeadDetail;
    exemptions: number;
    deductions: number;
    standardDeduction: number;
    /** Total income - the slab part plus the special-rate part. */
    taxableIncome: number;
    /** The part of total income that goes through the slabs. */
    slabIncome: number;
    capitalGains: CapitalGainsDetail;

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
    regime: Regime
): { heads: HeadDetail; gti: number; grossIncome: number } {
    const stdDeduction =
        input.grossSalary > 0
            ? Math.min(input.grossSalary, regime === 'new' ? STD_DEDUCTION_NEW : STD_DEDUCTION_OLD)
            : 0;
    const hra = regime === 'old' ? calculateHRAExemption(input) : 0;
    // Floored at zero because both of these are reliefs against SALARY. They
    // cannot shelter interest or rent, which is what letting them run negative
    // into the other heads would have done.
    const salary = Math.max(0, input.grossSalary - stdDeduction - hra);

    const business = Math.max(0, input.business.netProfit);
    const businessLossNotSetOff = Math.max(0, -input.business.netProfit);
    const otherSources = input.otherIncome;
    const hpIncome = computeHousePropertyIncome(input.houseProperty, regime);

    // Short-term gains that are not s.111A are ordinary income, so they belong
    // in the slab pot with everything else rather than in the special-rate one.
    const slabTaxedGains = Math.max(0, input.capitalGains.stcgSlab);

    const otherHeads = salary + business + otherSources + slabTaxedGains;

    let setOff = 0;
    let carriedForward = 0;
    let gti: number;

    if (hpIncome < 0) {
        const loss = -hpIncome;
        const cap = regime === 'new' ? 0 : HP_LOSS_SETOFF_CAP;
        // The set-off cannot exceed the cap, and cannot exceed the income there
        // is to absorb it either.
        setOff = Math.max(0, Math.min(loss, cap, otherHeads));
        carriedForward = loss - setOff;
        gti = otherHeads - setOff;
    } else {
        gti = otherHeads + hpIncome;
    }

    return {
        heads: {
            salary,
            housePropertyIncome: hpIncome,
            housePropertySetOff: setOff,
            housePropertyCarriedForward: carriedForward,
            business,
            businessLossNotSetOff,
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
            business +
            otherSources +
            slabTaxedGains +
            Math.max(0, input.capitalGains.stcg111A) +
            Math.max(0, input.capitalGains.ltcg112A) +
            Math.max(0, input.capitalGains.ltcg112),
    };
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

function computeRegime(input: TaxInput, regime: Regime): TaxRegimeResult {
    const isNew = regime === 'new';
    const { heads, gti, grossIncome } = aggregateHeads(input, regime);

    const stdDeduction =
        input.grossSalary > 0
            ? Math.min(input.grossSalary, isNew ? STD_DEDUCTION_NEW : STD_DEDUCTION_OLD)
            : 0;
    const hra = isNew ? 0 : calculateHRAExemption(input);

    // Chapter VI-A. None of it survives under the new regime.
    const chapterVIA = isNew
        ? 0
        : Math.min(150000, Math.max(0, input.sec80c)) +
          Math.min(100000, Math.max(0, input.sec80d)) +
          Math.min(50000, Math.max(0, input.sec80ccd1b));

    // Chapter VI-A comes off the SLAB income only. s.112A(6) and s.111A(2) bar
    // it against gains taxed at special rates, so an 80C investment cannot
    // shelter an equity gain however much of it is unused.
    const slabIncome = round10(Math.max(0, gti - chapterVIA));

    const cg = taxCapitalGains(
        input.capitalGains,
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
        heads,
        exemptions: hra,
        deductions: chapterVIA,
        standardDeduction: stdDeduction,
        taxableIncome,
        slabIncome,
        capitalGains: cg,
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
    business: { netProfit: 0 },
    capitalGains: { stcg111A: 0, ltcg112A: 0, ltcg112: 0, stcgSlab: 0 },
    otherIncome: 0,
    ageBracket: 'below60',
    sec80c: 0,
    sec80d: 0,
    sec80ccd1b: 0,
};
