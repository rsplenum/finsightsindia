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
    taxableIncome: number;

    slabs: SlabDetail[];
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

function computeSurchargeAndRelief(
    taxableIncome: number,
    baseTax: number,
    isNewRegime: boolean
): { surcharge: number; relief: number } {
    let threshold = 0;
    let surchargeRate = 0;

    if (taxableIncome > 50000000) {
        threshold = 50000000;
        surchargeRate = isNewRegime ? 0.25 : 0.37;
    } else if (taxableIncome > 20000000) {
        threshold = 20000000;
        surchargeRate = 0.25;
    } else if (taxableIncome > 10000000) {
        threshold = 10000000;
        surchargeRate = 0.15;
    } else if (taxableIncome > 5000000) {
        threshold = 5000000;
        surchargeRate = 0.10;
    }

    if (surchargeRate === 0) return { surcharge: 0, relief: 0 };

    const rawSurcharge = baseTax * surchargeRate;
    const taxWithSurcharge = baseTax + rawSurcharge;

    // Marginal relief: crossing a surcharge threshold must never cost more than
    // the income that took you over it.
    let taxAtThreshold = 0;
    if (isNewRegime) {
        taxAtThreshold = computeNewRegimeBaseTax(threshold).baseTax;
    } else {
        // Every surcharge threshold is far above the 30% slab, so the base tax
        // at the threshold is just this year's tax less 30% of the excess.
        taxAtThreshold = baseTax - (taxableIncome - threshold) * 0.30;
    }

    let surchargeAtThreshold = 0;
    if (threshold === 50000000) surchargeAtThreshold = taxAtThreshold * 0.25;
    else if (threshold === 20000000) surchargeAtThreshold = taxAtThreshold * 0.15;
    else if (threshold === 10000000) surchargeAtThreshold = taxAtThreshold * 0.10;

    const maxTaxAllowed = taxAtThreshold + surchargeAtThreshold + (taxableIncome - threshold);

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

    const otherHeads = salary + business + otherSources;

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
        // income that was actually taxed.
        grossIncome: input.grossSalary + hpIncome + business + otherSources,
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

    const taxableIncome = round10(Math.max(0, gti - chapterVIA));

    const base = isNew
        ? computeNewRegimeBaseTax(taxableIncome)
        : computeOldRegimeBaseTax(taxableIncome, input.ageBracket);

    let payable = base.baseTax;
    let rebate87A = 0;
    let relief87A = 0;

    if (isNew) {
        if (taxableIncome <= 1200000) {
            rebate87A = payable;
            payable = 0;
        } else {
            // Marginal relief: the tax cannot exceed the income above Rs 12 lakh.
            const excess = taxableIncome - 1200000;
            if (payable > excess) {
                relief87A = payable - excess;
                payable = excess;
            }
        }
    } else if (taxableIncome <= 500000) {
        // Old regime s.87A: capped at Rs 12,500, and no marginal relief by law.
        rebate87A = Math.min(payable, 12500);
        payable -= rebate87A;
    }

    const sur = computeSurchargeAndRelief(taxableIncome, payable, isNew);
    const withSurcharge = payable + sur.surcharge - sur.relief;
    const cess = withSurcharge * 0.04;
    const totalTax = round10(withSurcharge + cess);

    return {
        grossIncome,
        heads,
        exemptions: hra,
        deductions: chapterVIA,
        standardDeduction: stdDeduction,
        taxableIncome,
        slabs: base.slabs,
        // Pre-rebate slab tax. The rebate and the reliefs are separate line
        // items, so adding them back here would count them twice and the
        // on-screen breakdown would stop reconciling to totalTax.
        baseTax: base.baseTax,
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
    otherIncome: 0,
    ageBracket: 'below60',
    sec80c: 0,
    sec80d: 0,
    sec80ccd1b: 0,
};
