import {
    calculateIndiaTaxEngine,
    type TaxComparisonResult,
    type TaxInput,
    type TaxRegimeResult,
} from './tax';

/**
 * The tax calculator's derivation layer - everything the screens say ABOUT the
 * engine's answer, computed once.
 *
 * sol-038: the SIP page printed a real rate of 6.9% on one rung and 6.7% on
 * another for the identical quantity, because two surfaces each did their own
 * arithmetic on the same engine output. sol-043 is the same fault in its
 * presentational form - a verdict computed once and then re-decided five times
 * by hand in the markup, until the badge said one thing and the colours said
 * another. Anything on this page that asserts a preference renders from
 * `verdictFor()`, and nothing decides for itself.
 */

export type Winner = 'new' | 'old' | 'tie';

export interface TaxVerdict {
    winner: Winner;
    /** The regime the reader should choose, and the one they should not. */
    better: TaxRegimeResult;
    worse: TaxRegimeResult;
    /** What choosing the better one saves, in rupees a year. Zero on a tie. */
    saves: number;
    /** The same, per month - the figure a salaried reader actually lives. */
    savesMonthly: number;
    /** Plain label for the winning regime, for a badge or a heading. */
    label: string;
}

/**
 * One decision about which regime wins, for every surface to render from.
 *
 * The engine already reports `isNewBetter` / `isOldBetter`. What was missing is
 * that nothing else on the page used them: the emerald colour, the font weight,
 * the DEFAULT / OPTIONAL captions and the emerald column header were all static
 * classes written when the new regime was assumed to be the answer. At maxed
 * deductions, or on an ordinary Rs 2 lakh home loan, the badge said "OLD REGIME
 * SAVES ..." while the losing bill remained the boldest, greenest number on the
 * screen. dd-007/dont-2 and dd-012/dont-3. sol-043.
 */
export function verdictFor(result: TaxComparisonResult): TaxVerdict {
    const { newRegime, oldRegime } = result;
    const winner: Winner = result.isNewBetter ? 'new' : result.isOldBetter ? 'old' : 'tie';
    const better = winner === 'old' ? oldRegime : newRegime;
    const worse = winner === 'old' ? newRegime : oldRegime;
    const saves = Math.abs(newRegime.totalTax - oldRegime.totalTax);

    return {
        winner,
        better,
        worse,
        saves,
        savesMonthly: Math.round(saves / 12),
        label:
            winner === 'new' ? 'New regime' : winner === 'old' ? 'Old regime' : 'Either regime',
    };
}

/** Is this regime the one the reader should pick? Drives every emphasis. */
export function isWinning(verdict: TaxVerdict, regime: Winner): boolean {
    return verdict.winner === regime;
}

export interface BreakEven {
    /**
     * Whether a crossing exists at all. It does not when the old regime already
     * wins, and it does not when no amount of deduction can catch the new one -
     * which happens once the old regime's tax has already hit zero.
     */
    exists: boolean;
    /** Deductions the reader is already claiming, on the old regime. */
    claimed: number;
    /** The total at which the two bills meet. */
    required: number;
    /** How much more is needed. Zero when the old regime already wins. */
    shortfall: number;
}

/**
 * The number the whole page is really for.
 *
 * The two regimes differ in exactly one way the reader controls: the old one
 * pays them back for deductions and the new one does not. So there is a single
 * amount at which the bills meet, and "the old regime only wins if you can find
 * Rs 4.33 lakh to claim" is a decision the reader can act on, where "Rs 97,500"
 * is only a grade (dd-003/do-1, dd-008/do-3).
 *
 * Solved by BISECTION THROUGH THE REAL ENGINE rather than by inverting the slab
 * arithmetic separately. It is slower and it is the only way the break-even can
 * be guaranteed to agree with the two columns printed above it - dd-013/dont-2,
 * and the reason `whatIfExtraDeduction` exists on the input.
 *
 * The new regime's bill does not move with old-regime deductions and the old
 * regime's is non-increasing in them, so where a crossing exists it is unique.
 */
export function breakEvenDeductions(input: TaxInput): BreakEven {
    const at = (extra: number): TaxComparisonResult =>
        calculateIndiaTaxEngine({ ...input, whatIfExtraDeduction: extra });

    const baseline = at(0);
    const target = baseline.newRegime.totalTax;
    const claimed =
        baseline.oldRegime.deductions +
        baseline.oldRegime.exemptions +
        baseline.oldRegime.heads.housePropertySetOff;

    // Already there.
    if (baseline.oldRegime.totalTax <= target) {
        return { exists: true, claimed, required: claimed, shortfall: 0 };
    }

    // Can any amount of relief catch it? Wiping out the entire slab income is
    // the most any deduction can do; if the old regime is still dearer at that
    // point, no crossing exists.
    const ceiling = baseline.oldRegime.slabIncome;
    if (at(ceiling).oldRegime.totalTax > target) {
        return { exists: false, claimed, required: 0, shortfall: 0 };
    }

    let lo = 0;
    let hi = ceiling;
    // 40 halvings takes any realistic income below one rupee of resolution.
    for (let i = 0; i < 40 && hi - lo > 1; i++) {
        const mid = (lo + hi) / 2;
        if (at(mid).oldRegime.totalTax > target) lo = mid;
        else hi = mid;
    }

    const extra = Math.ceil(hi);
    return { exists: true, claimed, required: claimed + extra, shortfall: extra };
}

/**
 * The monthly bite - what a salaried person actually lives through, rather than
 * the annual total, which is an accountant's summary of it (dd-010/do-1).
 *
 * Stated as the annual bill divided by twelve, and the screen says so in the
 * same breath, because a real TDS schedule is not level across the year and a
 * figure that looks like a payslip line had better admit it is an average
 * (dd-009/dont-1).
 */
export function monthlyBite(regime: TaxRegimeResult): number {
    return Math.round(regime.totalTax / 12);
}

/** Everything layer 1 renders, derived once from one engine result. */
export interface TaxAnswerModel {
    result: TaxComparisonResult;
    verdict: TaxVerdict;
    breakEven: BreakEven;
    monthly: number;
    /** Take-home after tax, monthly - the other half of the lived quantity. */
    takeHomeMonthly: number;
}

export function buildTaxAnswer(input: TaxInput): TaxAnswerModel {
    const result = calculateIndiaTaxEngine(input);
    const verdict = verdictFor(result);
    return {
        result,
        verdict,
        breakEven: breakEvenDeductions(input),
        monthly: monthlyBite(verdict.better),
        takeHomeMonthly: Math.round(
            Math.max(0, verdict.better.grossIncome - verdict.better.totalTax) / 12
        ),
    };
}
