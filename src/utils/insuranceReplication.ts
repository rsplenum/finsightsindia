import { calculateXIRR } from './xirr';

/**
 * The insurance replication engine.
 *
 * This was 135 lines inside a <script> tag on a 35KB page, reading the DOM for
 * its inputs and formatting strings for its outputs. Nothing could assert what
 * it computed, so every claim about the page - the verdict labels, the sign of
 * the surplus, the sensitivity table - had to be settled by reading the screen.
 * That is exactly how T2 shipped a rung whose verdict line its own figures did
 * not support.
 *
 * So: no DOM, no formatting, no `new Date()` reached for internally. Inputs in,
 * numbers out. `insuranceInputs.ts` is the only thing that knows a form exists.
 *
 * Two properties are structural rather than incidental, and both were faults in
 * the original:
 *
 *  - ONE WALK, NOT THREE (sol-038). The safe route, the growth route and every
 *    row of the sensitivity table are the same year-by-year walk at different
 *    rates. The original wrote it twice - once inline for the two headline
 *    routes and once again inside a nested `getEquitySurplus` for the table -
 *    which is the shape that printed 6.7% and 6.9% for one quantity on the SIP
 *    page. `replicate()` is that walk, and it is written once.
 *
 *  - THE ASSUMPTIONS ARE PARAMETERS (sol-028). 7.1%, 12%, 12.5% LTCG and the
 *    ₹1.25 L exemption were literals in the middle of the arithmetic. They are
 *    required inputs now, so that a test can move them and a reader can be told
 *    what they are.
 */

/** The equity CAGRs the sensitivity table walks. The reader's own rate joins them. */
export const SENSITIVITY_RATES = [8, 10, 12, 14] as const;

/**
 * LTCG on equity: 12.5% above ₹1.25 lakh of gains, post-July-2024.
 *
 * The exemption is ANNUAL, and this route sells units every year to fund the
 * payouts, so it is used every year. The page used to apply it once, to the
 * terminal gain, which overstated the tax across twenty years of withdrawals.
 */
export const LTCG_RATE_PCT = 12.5;
export const LTCG_EXEMPTION = 125000;

/**
 * GST on a traditional policy's premium: 4.5% in year one, 2.25% thereafter.
 * Not an assumption we chose - it is the rate on the first-year and renewal
 * premium of a life policy.
 */
export const GST_YEAR_ONE = 0.045;
export const GST_RENEWAL = 0.0225;

/**
 * First-year distributor commission, as a share of the premium. A market
 * estimate, not a disclosure: traditional plans are permitted up to 35% in year
 * one and 20% is the commonly quoted figure. The page says "estimated" for this
 * reason.
 */
export const COMMISSION_YEAR_ONE = 0.20;

/**
 * s.10(10D)'s first proviso, for a policy issued on or after 1 April 2012: the
 * proceeds are exempt only where the premium payable for any year stays within
 * 10% of the actual capital sum assured. Above that the exemption is lost.
 *
 * THE PAGE ASSUMED EXEMPTION UNCONDITIONALLY, which is a thesis in the defaults
 * (dd-021/do-5) pointing at the policy: a plan sold as an investment with a
 * token life cover fails this test, and those are exactly the plans this tool
 * exists to examine. Charging the do-it-yourself routes tax while handing the
 * policy a blanket exemption is the same fault sol-060 fixed on the bond route,
 * facing the other way.
 */
export const S10_10D_PREMIUM_SHARE_OF_COVER = 0.10;

/**
 * The ₹5 lakh rule, STATED AND NOT APPLIED.
 *
 * For a policy issued on or after 1 April 2023, the exemption also goes where
 * aggregate annual premiums across all such policies exceed ₹5 lakh. Applying
 * it needs the issue year, which is a seventh question the brief does not ask
 * for, and guessing it would put our assumption inside the reader's comparison.
 * So the screen says the rule exists where the premium is large enough for it
 * to matter, without asserting that it bites. On the gate for Rahul.
 */
export const S10_10D_AGGREGATE_PREMIUM_LIMIT = 500000;

export interface PolicyInputs {
  /** Gross annual premium, in rupees. */
  premium: number;
  /** Premium payment term, in years. */
  ppt: number;
  /** The policy year the income starts. */
  payoutStartYear: number;
  /** How many years the income runs for. */
  payoutYears: number;
  /** The annual guaranteed income, in the FIRST payout year. */
  payoutAmount: number;
  /**
   * How much the income rises each year, as a percentage OF THE STARTING
   * INCOME — simple escalation, not compound.
   *
   * The brief asks for "how much they are, and whether they grow" and the
   * engine had no way to express the second half, so a policy paying a rising
   * income was priced as though it paid a level one, which understates its
   * return. Simple rather than compound because that is how Indian guaranteed
   * income plans word it, and because dd-017/dont-3 says to state the
   * interpretation rather than ask the reader to pick a mode: the label on the
   * field says "of the starting income", which is checkable against the policy
   * document.
   */
  payoutGrowthPct: number;
  /** The terminal lump sum, paid in the last payout year. */
  maturityBenefit: number;
  /**
   * The policy's life cover — the actual capital sum assured.
   *
   * The engine used to see only what the replacement term cover COSTS, never
   * how much cover the policy carries, so it could not apply s.10(10D)'s 10%
   * test. It is a genuine engine input rather than a display value: it decides
   * whether the policy's income is taxed at all.
   */
  sumAssured: number;
  /** Expected inflation, in percent. */
  inflationRate: number;
  /** The safe DIY route's return, in percent. */
  safeRate: number;
  /** The growth DIY route's return, in percent, BEFORE the fund's own fee. */
  equityRate: number;
  /**
   * What the fund charges, per year, as a percentage of the balance.
   *
   * THE GROWTH ROUTE PAID NOTHING TO OWN ITS FUND. Government bonds bought
   * direct really do cost nothing, so the safe route's zero is a fact; an index
   * fund's is not, and the route being spared the cost was the one this page's
   * headline speaks for. dd-021/do-5's test, firing on the page's own defaults
   * — and sol-028's fault for the third time, after the SWP planner and the SIP
   * engine: growth is uncertain, the crash is uncertain, the expense ratio is
   * the one cost charged every year whatever happens, and it was the only one
   * missing.
   *
   * Deducted from the growth rate rather than charged as a separate withdrawal,
   * which is how a fund actually works: the NAV is published net of it.
   */
  equityFeePct: number;
  /** Annual cost of the pure term cover being bought instead. Zero when not unbundling. */
  termCost: number;
  /** Annual cost of the accident rider. Zero when not unbundling. */
  accidentCost: number;
  /** LTCG rate on the growth route, in percent. */
  ltcgRatePct: number;
  /**
   * The reader's income tax slab, in percent — 10, 20 or 30.
   *
   * The safe route earns INTEREST, and interest is taxed at slab as it accrues.
   * Rahul ruled on 17 Aug that this is asked rather than assumed: "ask them to
   * choose a slab. 10, 20, 30." Assuming one would have put our number inside
   * the reader's own comparison, and leaving the route untaxed — which is what
   * this page did until sol-060 — flattered the side the page already argues
   * for. dd-021: charge both routes the same taxes, or the thesis is in the
   * defaults.
   */
  slabRatePct: number;
  /** LTCG exemption, in rupees. Applied once to the terminal gain - see above. */
  ltcgExemption: number;
  /**
   * Year zero for the XIRR's calendar. Passed in rather than taken from the
   * clock so that the same policy yields the same number twice; the reader's
   * page passes today.
   */
  startDate: Date;
}

export interface LedgerRow {
  year: number;
  /** Premium leaving the account this year, at the start of it. */
  premiumOut: number;
  /** What the policy STATES it pays this year, before any tax. Includes maturity in the last payout year. */
  payoutIn: number;
  /**
   * Tax the reader owes on this year's payout. Zero wherever s.10(10D) exempts
   * the policy, which is the ordinary case.
   */
  payoutTax: number;
  /**
   * WHAT THE READER ACTUALLY KEEPS. This is the figure the replica has to fund.
   *
   * The whole comparison rests on both routes paying the identical income, so
   * once the policy's own payout can be taxed the replica must match what lands
   * in the reader's hand rather than what the brochure promises. Funding the
   * gross figure out of a taxed portfolio while the policy quietly delivered
   * less would have made the replica do strictly more work for the same verdict.
   */
  payoutNet: number;
  /** payoutNet − premiumOut, in the money of the day. */
  net: number;
  /** payoutIn in today's money. */
  realValue: number;
  /** payoutNet in today's money — what break-even is measured on. */
  realNet: number;
  /** premiumOut in today's money. */
  realPremium: number;
}

/**
 * Is the policy's income exempt, and if not, how much of each payout is income?
 *
 * TWO THINGS ARE KEPT APART HERE ON PURPOSE, because the gate already records
 * what happens when an inferred rule is stated as a cited one (sol-042).
 *
 * THE TRIGGER IS STATUTE. s.10(10D)'s proviso withdraws the exemption where the
 * premium payable for any year exceeds 10% of the actual capital sum assured,
 * for a policy issued on or after 1 April 2012. That is the law and the engine
 * applies it as written.
 *
 * THE QUANTUM IS OUR MODEL, and it is labelled as one wherever it reaches the
 * screen. When the exemption goes, what is taxed is the income embedded in the
 * proceeds rather than the proceeds themselves — the shape s.194DA uses for its
 * withholding. The engine spreads the premiums paid across the payouts in
 * proportion, so each payout is taxed at slab on the same fraction. Nothing in
 * the Act prescribes that allocation; it is the one that conserves the total
 * (every rupee of premium is relieved exactly once) and it does not depend on
 * which year the reader is standing in.
 */
export function payoutTaxationOf(inputs: PolicyInputs): {
  exempt: boolean;
  /** Why the exemption was lost, in the reader's words. Null when it was not. */
  reason: string | null;
  /** The share of every payout that is taxable income. Zero when exempt. */
  taxableFraction: number;
} {
  const cover = inputs.sumAssured;
  // No cover at all cannot be tested against a share of itself. A policy with
  // no life cover is not a life policy, and the exemption it claims is one it
  // was never entitled to — but the reader may simply not have answered yet, so
  // the neutral reading is taken and the screen asks rather than assuming.
  if (cover <= 0) return { exempt: true, reason: null, taxableFraction: 0 };

  if (inputs.premium <= cover * S10_10D_PREMIUM_SHARE_OF_COVER) {
    return { exempt: true, reason: null, taxableFraction: 0 };
  }

  const { payoutEndYear } = horizonOf(inputs);
  let gross = 0;
  for (let yr = inputs.payoutStartYear; yr <= payoutEndYear; yr++) {
    gross += payoutInYear(inputs, yr);
  }
  gross += inputs.maturityBenefit;

  const premiumsPaid = inputs.premium * inputs.ppt;
  // A policy that pays back less than it took has no income in it to tax.
  const taxableFraction = gross > 0 ? Math.max(0, 1 - premiumsPaid / gross) : 0;

  return {
    exempt: false,
    reason:
      `Your premium is more than a tenth of the life cover, so s.10(10D) does not exempt ` +
      `what this policy pays back. A plan whose cover is small beside its premium is being ` +
      `sold to you as an investment, and the law taxes it as one.`,
    taxableFraction,
  };
}

/**
 * The income the policy states for a given policy year, escalation included.
 *
 * SIMPLE, not compound: year one pays the base, and every year after adds the
 * same fixed step. See `payoutGrowthPct` for why that reading was chosen and
 * stated rather than put to the reader as a question.
 */
export function payoutInYear(inputs: PolicyInputs, year: number): number {
  const { payoutEndYear } = horizonOf(inputs);
  if (year < inputs.payoutStartYear || year > payoutEndYear) return 0;
  const elapsed = year - inputs.payoutStartYear;
  return inputs.payoutAmount * (1 + (inputs.payoutGrowthPct / 100) * elapsed);
}

/**
 * What a route did, once it has been walked.
 *
 * A route either funds every rupee the policy promised and has something left,
 * or it runs out - and running out has a year and an amount, not a negative
 * balance. See `replicate()` for why that distinction is the whole point.
 */
export interface RouteResult {
  /** What is left after funding every payout the policy promised. Never negative. */
  finalBalance: number;
  /**
   * The same surplus in today's money.
   *
   * T8/dd-004: a figure thirty years out is not the figure the reader thinks it
   * is, and the reconciliation belongs beside it rather than in a footnote. It
   * is computed here, once, so that no surface can discount it its own way.
   */
  finalBalanceReal: number;
  /** Total put in, across the premium-paying years. */
  capitalInvested: number;
  /** Total spent on the term and accident cover that replaces the policy's protection. */
  riskCostPaid: number;
  /** Tax this route paid. Capital gains on the growth route; slab-rate tax on interest, every year, on the safe one. */
  taxDrag: number;
  /** The year the money first ran out mid-payment, or null if it never did. */
  exhaustedInYear: number | null;
  /** Promised income the route could not pay, in the rupees of the years it was owed. */
  unfundedPayout: number;
  /** The same shortfall in today's money. */
  unfundedPayoutReal: number;
}

/**
 * The one statement of how a route did.
 *
 * It exists so that the badge, the heading, the colour and the sentence cannot
 * disagree with each other - which they did. The page printed -Rs 11.08 lakh in
 * emerald green under the word 'Surplus' beside a badge reading POLICY WINS,
 * and the bottom line called a negative number 'SURPLUS WEALTH'. Four
 * independent decisions about one fact. There is now one decision, made here,
 * and every surface renders it.
 */
export type RouteVerdict =
  | { kind: 'surplus'; tone: 'good'; amount: number; amountReal: number }
  | { kind: 'exact'; tone: 'good' }
  | { kind: 'shortfall'; tone: 'bad'; exhaustedInYear: number; unfunded: number; unfundedReal: number };

export interface SensitivityRow {
  rate: number;
  /** What was left over. Zero when the route ran out - read `verdict` for that case. */
  surplus: number;
  verdict: RouteVerdict;
  /** True for the rate the headline growth route actually used. */
  isBaseline: boolean;
}

export interface ReplicationResult {
  inputs: PolicyInputs;
  /** The last year money moves: the later of the premium term and the final payout year. */
  totalYears: number;
  payoutEndYear: number;
  /** Term + accident, per year. */
  riskCostPerYear: number;
  /** Term + accident, over the whole premium-paying term. */
  riskCostPaid: number;
  /**
   * The same total in today's money.
   *
   * Computed here rather than on the page because it is a figure, and a figure
   * a view works out for itself is a second engine waiting to disagree with the
   * first (dd-013/dont-1). Discounted on the premium's own timing - the cover is
   * bought at the START of each year, like the premium it comes out of.
   */
  riskCostPaidReal: number;
  /** What is left of the premium to invest, once the cover is bought. */
  investableCapital: number;
  /**
   * WHAT THE FUND'S FEE ACTUALLY COST, in rupees, over the whole life of the
   * plan - the fee itself plus every rupee of growth it would have earned.
   *
   * Measured as the difference between the same walk with and without it, which
   * is the only figure a reader can act on: a fee quoted as 0.2% sounds like
   * nothing and is not. It is a second walk rather than a running total on
   * purpose, because the compounding is most of the answer.
   */
  growthFeeCost: number;
  policy: {
    /**
     * The policy's own annualised yield AFTER the reader's own tax, in percent.
     * Zero when XIRR cannot converge. This is the comparable number: both
     * do-it-yourself routes are reported after tax too.
     */
    xirrPct: number;
    /**
     * The same yield before that tax. Equal to `xirrPct` in the ordinary case,
     * where s.10(10D) exempts the policy - and the gap between them, where it
     * does not, is what the exemption was worth.
     */
    xirrPreTaxPct: number;
    /** True where s.10(10D) exempts what this policy pays back. Usually so. */
    taxFree: boolean;
    /** Why the exemption was lost, in the reader's words. Null where it was not. */
    taxableReason: string | null;
    /** Tax the policy's own payouts attract, across their whole life. */
    taxOnPayouts: number;
    /** Every rupee the policy pays out, added up as if a rupee in year 30 were a rupee today. */
    totalNominalPayout: number;
    /** What the reader keeps of that, after the policy's own tax. */
    totalNetPayout: number;
    /** The same payouts in today's money. */
    totalRealPayout: number;
    /**
     * The year cumulative real payouts overtake cumulative real premiums, or
     * null if they never do within the policy's life.
     */
    breakEvenYear: number | null;
    /**
     * What the FINAL premium instalment really costs, in today's prices.
     *
     * dd-017: the premium is a ten- or twelve-year input and the policy fixes
     * it in flat nominal rupees, so it quietly gets cheaper every year - which
     * flatters the policy, and which the page never said out loud. A ₹1 lakh
     * premium in year 10 is ₹59,190 of today's money.
     */
    lastPremiumReal: number;
  };
  safe: RouteResult;
  growth: RouteResult;
  ledger: LedgerRow[];
  sensitivity: SensitivityRow[];
  frictions: {
    /** GST paid across the premium term. */
    gstPaid: number;
    /** Estimated first-year commission. */
    estCommission: number;
  };
}

/**
 * A shortfall smaller than this is not a missed payment.
 *
 * The gross-up is exact in algebra and not in floating point, so `delivered`
 * lands a fraction of a paisa either side of the promised payout. Without a
 * tolerance, a residue of 1e-9 counted as a missed instalment and stamped a
 * year on it: the engine reported a policy running out in year 12 when it
 * really ran out in year 15, and the reported year jumped around with the
 * return rate while the total unpaid stayed perfectly monotone - which is what
 * gave it away. One rupee, because rupees are the resolution the page prints.
 */
const MISSED_PAYMENT_TOLERANCE = 1;

/** The last year in which money moves either way. */
export function horizonOf(inputs: PolicyInputs): { payoutEndYear: number; totalYears: number } {
  const payoutEndYear = inputs.payoutStartYear + inputs.payoutYears - 1;
  return { payoutEndYear, totalYears: Math.max(inputs.ppt, payoutEndYear) };
}

/**
 * The policy's own cash flows, year by year, in both moneys.
 *
 * The timing convention is the one the original used and it matters to every
 * figure downstream: the premium leaves at the START of policy year `yr` (so it
 * is discounted `yr - 1` years) and the payout arrives at the END of it (so it
 * is discounted `yr` years).
 */
export function buildLedger(inputs: PolicyInputs): LedgerRow[] {
  const { payoutEndYear, totalYears } = horizonOf(inputs);
  const infl = inputs.inflationRate / 100;
  const { taxableFraction } = payoutTaxationOf(inputs);
  const slab = inputs.slabRatePct / 100;
  const rows: LedgerRow[] = [];

  for (let yr = 1; yr <= totalYears; yr++) {
    const premiumOut = yr <= inputs.ppt ? inputs.premium : 0;
    let payoutIn = payoutInYear(inputs, yr);
    if (yr === payoutEndYear) payoutIn += inputs.maturityBenefit;

    // Zero in the ordinary case: most of these policies are exempt, and the
    // screen says so rather than leaving a silent nil where a tax might be.
    const payoutTax = payoutIn * taxableFraction * slab;
    const payoutNet = payoutIn - payoutTax;

    rows.push({
      year: yr,
      premiumOut,
      payoutIn,
      payoutTax,
      payoutNet,
      net: payoutNet - premiumOut,
      realValue: payoutIn / Math.pow(1 + infl, yr),
      realNet: payoutNet / Math.pow(1 + infl, yr),
      realPremium: premiumOut / Math.pow(1 + infl, yr - 1),
    });
  }

  return rows;
}

/**
 * The DIY walk, once, for any rate.
 *
 * Each year: this year's investable premium goes in at the start, the whole
 * balance compounds, and the payout the policy would have made is taken out at
 * the end.
 *
 * THE PORTFOLIO CANNOT GO BELOW ZERO. It used to. The balance was allowed to go
 * negative and then kept compounding, so an exhausted portfolio grew a DEBT at
 * the equity rate, and the sensitivity table - whose entire purpose is 'what if
 * returns are lower than you hope' - reported the deficit as WORST around 11%
 * and better at both 8% and 14%. A higher return, shown as a worse outcome. No
 * investor experiences that: a portfolio that cannot meet a withdrawal is
 * empty, it does not borrow at 12% and carry on.
 *
 * So a route that cannot pay reports the two things a person would actually
 * live through (dd-010): the YEAR the money ran out, and how much of the
 * promised income never arrived. That is also the only version of 'deficit'
 * that can be labelled honestly, which is why this had to be fixed before the
 * labels could be.
 *
 * `taxation` is what separates the two routes on this page, and until sol-060
 * it separated them dishonestly: the growth route paid capital gains tax and
 * the safe route paid nothing at all, which is not what a real bond investor
 * experiences and flattered the very route the page uses to argue the policy is
 * beatable WITHOUT risk.
 */
/**
 * How a route is taxed. THREE MODES, because there are three real mechanics and
 * the boolean this replaced could only express two of them.
 *
 * `capitalGains` — equity. Tax falls on a REALISED gain, at 12.5%, with a fresh
 *   ₹1.25 lakh exemption each year, and nothing is owed on a balance that has
 *   not been sold.
 *
 * `slabOnAccrual` — bonds, FDs, debt. Tax falls on the interest AS IT IS
 *   EARNED, at the reader's slab rate, whether or not a rupee is withdrawn.
 *   That is not a variation of capital gains tax, it is a different event: it
 *   compounds against the investor every year rather than waiting for a sale,
 *   which is exactly why a bond route cannot be modelled by pointing the equity
 *   path at a different rate.
 *
 * `none` — kept only so the difference a tax makes can be measured in tests.
 *   No route on the page uses it, and sol-060 is the reason: the safe route ran
 *   untaxed and flattered the DIY side the page already argues for.
 */
export type Taxation =
  | { kind: 'none' }
  | { kind: 'capitalGains'; ratePct: number; annualExemption: number }
  | { kind: 'slabOnAccrual'; ratePct: number };

export function replicate(
  inputs: PolicyInputs,
  annualRatePct: number,
  taxation: Taxation
): RouteResult {
  const taxGains = taxation.kind === 'capitalGains';
  const ledger = buildLedger(inputs);
  const investableCapital = investableCapitalOf(inputs);
  const riskCostPerYear = inputs.termCost + inputs.accidentCost;
  const infl = inputs.inflationRate / 100;

  let balance = 0;
  /**
   * What has been paid in and not yet sold. Tracked separately from
   * `capitalInvested` because every withdrawal consumes some of it: the SWP
   * engine's convention (swpWorker), where the gain in a sale is proportional
   * to the unrealised gain in the fund at the time of it.
   */
  let costBasis = 0;
  let capitalInvested = 0;
  let exhaustedInYear: number | null = null;
  let unfundedPayout = 0;
  let unfundedPayoutReal = 0;
  let taxDrag = 0;

  const rate = taxation.kind === 'capitalGains' ? taxation.ratePct / 100 : 0;

  for (const row of ledger) {
    const investedThisYear = row.year <= inputs.ppt ? investableCapital : 0;
    capitalInvested += investedThisYear;
    costBasis += investedThisYear;

    balance += investedThisYear;

    const growthThisYear = balance * (annualRatePct / 100);
    balance += growthThisYear;

    // sol-060. Interest is taxed WHEN IT IS EARNED, not when it is taken out,
    // so the tax comes off the balance every year and the money it would have
    // compounded on is gone for good. That annual leak is the whole difference
    // between a bond route and an equity one, and it is why this could not be
    // done by charging the equity path a different rate.
    if (taxation.kind === 'slabOnAccrual' && growthThisYear > 0) {
      const tax = growthThisYear * (taxation.ratePct / 100);
      balance -= tax;
      taxDrag += tax;
      // No capital gain is left behind: the reader has already paid on this
      // growth, so a later withdrawal sells nothing but taxed money.
      costBasis += growthThisYear - tax;
    }

    // A fresh exemption every year. That is the whole of the fix: the page used
    // to apply one ₹1.25 lakh exemption to a single terminal gain, while a real
    // investor funding twenty years of income out of a fund uses it twenty
    // times.
    let exemptionLeft = taxGains ? inputs.ltcgExemption : Infinity;

    if (row.payoutNet > 0 && balance > 0) {
      const gainRatio = Math.max(0, balance - costBasis) / balance;

      // THE WITHDRAWAL IS GROSSED UP, not netted down.
      //
      // The SWP engine takes the tax OUT of the paycheck, because there the
      // paycheck is what the retiree chose to draw. Here the payout is a
      // PROMISE - the whole page rests on both routes paying the identical
      // income - so the fund must sell enough to hand over the promised figure
      // AFTER tax. Netting down would quietly pay the reader less than the
      // policy did and still call the two comparable.
      const want = grossUpForTax(row.payoutNet, gainRatio, rate, exemptionLeft);
      const sold = Math.min(want, balance);

      const realisedGain = sold * gainRatio;
      const taxable = Math.max(0, realisedGain - exemptionLeft);
      const tax = taxable * rate;
      exemptionLeft = Math.max(0, exemptionLeft - realisedGain);

      const delivered = sold - tax;
      const paid = Math.min(delivered, row.payoutNet);
      const missed = row.payoutNet - paid;

      taxDrag += tax;
      balance -= sold;
      costBasis = Math.max(0, costBasis - sold * (1 - gainRatio));

      if (missed > MISSED_PAYMENT_TOLERANCE) {
        if (exhaustedInYear === null) exhaustedInYear = row.year;
        unfundedPayout += missed;
        unfundedPayoutReal += missed / Math.pow(1 + infl, row.year);
      }
    } else if (row.payoutNet > 0) {
      // Nothing left to sell.
      if (exhaustedInYear === null) exhaustedInYear = row.year;
      unfundedPayout += row.payoutNet;
      unfundedPayoutReal += row.payoutNet / Math.pow(1 + infl, row.year);
    }

    // The last year: whatever is left is sold, because the comparison is
    // against a maturity benefit the policy hands over in cash. Comparing a
    // pre-tax fund balance with a post-tax policy payout would flatter DIY.
    // Any exemption the year's withdrawals did not use is still available.
    if (taxGains && row.year === ledger[ledger.length - 1].year && balance > 0) {
      const terminalGain = Math.max(0, balance - costBasis);
      const taxable = Math.max(0, terminalGain - exemptionLeft);
      const tax = taxable * rate;
      taxDrag += tax;
      balance -= tax;
      costBasis = Math.max(0, balance);
    }
  }

  const { totalYears } = horizonOf(inputs);

  return {
    finalBalance: balance,
    finalBalanceReal: balance / Math.pow(1 + infl, totalYears),
    capitalInvested,
    riskCostPaid: riskCostPerYear * inputs.ppt,
    taxDrag,
    exhaustedInYear,
    unfundedPayout,
    unfundedPayoutReal,
  };
}

/**
 * How a route did, said once.
 *
 * Every surface asks this rather than inspecting the sign of a number for
 * itself. That is the entire mechanism behind 'sign, word and badge must
 * agree': there is nothing left to disagree about.
 */
export function verdictFor(route: RouteResult): RouteVerdict {
  if (route.unfundedPayout > 0) {
    return {
      kind: 'shortfall',
      tone: 'bad',
      exhaustedInYear: route.exhaustedInYear!,
      unfunded: route.unfundedPayout,
      unfundedReal: route.unfundedPayoutReal,
    };
  }
  // A rupee either way is not a surplus worth a headline. Rounded to whole
  // rupees, because that is the resolution the reader is shown.
  if (Math.round(route.finalBalance) <= 0) return { kind: 'exact', tone: 'good' };
  return {
    kind: 'surplus',
    tone: 'good',
    amount: route.finalBalance,
    amountReal: route.finalBalanceReal,
  };
}

/**
 * How much must be SOLD to hand over `want` rupees after capital gains tax.
 *
 * Selling W realises W×g of gain, of which everything above the remaining
 * exemption E is taxed at r. So the reader receives W − max(0, W·g − E)·r, and
 * we need that to equal `want`:
 *
 *   below the exemption:  W = want
 *   above it:             W = (want − E·r) / (1 − g·r)
 *
 * The first branch is tried first and kept if the sale really does stay inside
 * the exemption; otherwise the second is exact. `1 − g·r` cannot reach zero at
 * any real rate — g ≤ 1 and r is 0.125 — but it is guarded anyway, because a
 * hand-entered tax rate is a number a reader can type.
 */
export function grossUpForTax(
  want: number,
  gainRatio: number,
  rate: number,
  exemptionLeft: number
): number {
  if (want <= 0) return 0;
  if (rate <= 0 || gainRatio <= 0) return want;

  if (want * gainRatio <= exemptionLeft) return want;

  const denominator = 1 - gainRatio * rate;
  if (denominator <= 0) return Number.POSITIVE_INFINITY;

  return Math.max(want, (want - exemptionLeft * rate) / denominator);
}

/** What is left of the premium once the replacement cover is paid for. Never negative. */
export function investableCapitalOf(inputs: PolicyInputs): number {
  return Math.max(0, inputs.premium - (inputs.termCost + inputs.accidentCost));
}

/**
 * The year the policy's real payouts have finally repaid its real premiums.
 * Null means never, within the policy's own life.
 *
 * Measured on what the reader KEEPS (`realNet`), not on what the brochure
 * states. Where s.10(10D) does not exempt the policy, break-even computed on
 * the gross figure would arrive years before the reader was actually whole.
 */
export function realBreakEvenYear(ledger: LedgerRow[]): number | null {
  let cumulative = 0;
  for (const row of ledger) {
    cumulative += row.realNet - row.realPremium;
    if (cumulative > 0) return row.year;
  }
  return null;
}

/** GST across the premium term, and the estimated first-year commission. */
export function frictionsOf(inputs: PolicyInputs): { gstPaid: number; estCommission: number } {
  let gstPaid = 0;
  for (let yr = 1; yr <= inputs.ppt; yr++) {
    gstPaid += inputs.premium * (yr === 1 ? GST_YEAR_ONE : GST_RENEWAL);
  }
  return { gstPaid, estCommission: inputs.premium * COMMISSION_YEAR_ONE };
}

/**
 * The policy's own annualised yield, on exact calendar dates. Zero when XIRR
 * cannot converge.
 *
 * `which` decides whether the reader's own tax is inside the number. BOTH ARE
 * COMPUTED AND BOTH ARE SHOWN, because the difference between them is the
 * whole of what s.10(10D) is worth and hiding either would be dd-006/dont-2 -
 * the difference IS the lesson. The comparable one is the net figure: the two
 * do-it-yourself routes are reported after their tax, so a policy reported
 * before its own would be the only untaxed number on the screen.
 */
export function policyXirrPct(
  inputs: PolicyInputs,
  ledger: LedgerRow[],
  which: 'net' | 'gross' = 'net'
): number {
  const flows: { amount: number; date: Date }[] = [];

  for (const row of ledger) {
    if (row.premiumOut !== 0) {
      flows.push({ amount: -row.premiumOut, date: yearsFrom(inputs.startDate, row.year - 1) });
    }
    const received = which === 'net' ? row.payoutNet : row.payoutIn;
    if (received !== 0) {
      flows.push({ amount: received, date: yearsFrom(inputs.startDate, row.year) });
    }
  }

  const xirr = calculateXIRR(flows);
  return xirr !== null ? xirr : 0;
}

function yearsFrom(start: Date, years: number): Date {
  const d = new Date(start);
  d.setFullYear(start.getFullYear() + years);
  return d;
}

/** Everything the page reports, from one set of inputs. */
export function analyseReplication(inputs: PolicyInputs): ReplicationResult {
  const { payoutEndYear, totalYears } = horizonOf(inputs);
  const ledger = buildLedger(inputs);
  const taxation = payoutTaxationOf(inputs);
  const riskCostPerYear = inputs.termCost + inputs.accidentCost;

  // sol-060. The safe route used to be charged NO TAX AT ALL while the growth
  // route paid 12.5%, which flattered the DIY side the page already argues for
  // — dd-021's test, fired on this page's own defaults. Rahul's ruling, 17 Aug:
  // "ask them to choose a slab. 10, 20, 30."
  const cg: Taxation = {
    kind: 'capitalGains',
    ratePct: inputs.ltcgRatePct,
    annualExemption: inputs.ltcgExemption,
  };
  const safe = replicate(inputs, inputs.safeRate, {
    kind: 'slabOnAccrual',
    ratePct: inputs.slabRatePct,
  });

  // THE FEE COMES OFF THE RATE, HERE, ONCE. A fund publishes its NAV net of
  // what it charges, so an investor's achieved return IS the index less the
  // expense ratio - it is not a separate withdrawal and it is not optional.
  //
  // The safe route is given no fee, and that zero is a fact rather than an
  // omission: a government bond bought direct has no annual charge. The screen
  // says so, because a blank where the other route has a number reads as a cost
  // somebody forgot - which is exactly what this one was.
  const growthNetRate = inputs.equityRate - inputs.equityFeePct;
  const growth = replicate(inputs, growthNetRate, cg);

  // The reader's own rate always has a row, even if it is not one of ours. The
  // table's "(Your Input)" marker used to be a hardcoded `rate === 12` in the
  // view, which would have silently pointed at the wrong row the moment the
  // equity assumption moved - dd-013's second value for one quantity, waiting
  // to happen.
  const rates = Array.from(new Set<number>([...SENSITIVITY_RATES, inputs.equityRate])).sort(
    (a, b) => a - b
  );

  const sensitivity: SensitivityRow[] = rates.map((rate) => {
    // `rate` is the index's return and the row is labelled with it; the walk
    // takes the fee off, exactly as the headline route does. A table whose rows
    // were built at a different net rate from the headline would be dd-013's
    // one quantity with two values.
    const route = replicate(inputs, rate - inputs.equityFeePct, cg);
    return {
      rate,
      surplus: route.finalBalance,
      verdict: verdictFor(route),
      isBaseline: rate === inputs.equityRate,
    };
  });

  // What the fee cost, measured rather than accumulated - see `growthFeeCost`.
  const growthNoFee = replicate(inputs, inputs.equityRate, cg);
  const growthFeeCost =
    growthNoFee.finalBalance -
    growthNoFee.unfundedPayout -
    (growth.finalBalance - growth.unfundedPayout);

  const infl = inputs.inflationRate / 100;
  let riskCostPaidReal = 0;
  for (let yr = 1; yr <= inputs.ppt; yr++) {
    riskCostPaidReal += riskCostPerYear / Math.pow(1 + infl, yr - 1);
  }

  return {
    inputs,
    totalYears,
    payoutEndYear,
    riskCostPerYear,
    riskCostPaid: riskCostPerYear * inputs.ppt,
    riskCostPaidReal,
    investableCapital: investableCapitalOf(inputs),
    growthFeeCost: Math.max(0, growthFeeCost),
    policy: {
      xirrPct: policyXirrPct(inputs, ledger, 'net'),
      xirrPreTaxPct: policyXirrPct(inputs, ledger, 'gross'),
      taxFree: taxation.exempt,
      taxableReason: taxation.reason,
      taxOnPayouts: ledger.reduce((sum, r) => sum + r.payoutTax, 0),
      totalNominalPayout: ledger.reduce((sum, r) => sum + r.payoutIn, 0),
      totalNetPayout: ledger.reduce((sum, r) => sum + r.payoutNet, 0),
      totalRealPayout: ledger.reduce((sum, r) => sum + r.realValue, 0),
      breakEvenYear: realBreakEvenYear(ledger),
      lastPremiumReal: ledger[Math.min(inputs.ppt, ledger.length) - 1]?.realPremium ?? 0,
    },
    safe,
    growth,
    ledger,
    sensitivity,
    frictions: frictionsOf(inputs),
  };
}
