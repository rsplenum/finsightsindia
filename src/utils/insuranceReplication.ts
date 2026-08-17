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

export interface PolicyInputs {
  /** Gross annual premium, in rupees. */
  premium: number;
  /** Premium payment term, in years. */
  ppt: number;
  /** The policy year the income starts. */
  payoutStartYear: number;
  /** How many years the income runs for. */
  payoutYears: number;
  /** The annual guaranteed income. */
  payoutAmount: number;
  /** The terminal lump sum, paid in the last payout year. */
  maturityBenefit: number;
  /** Expected inflation, in percent. */
  inflationRate: number;
  /** The safe DIY route's return, in percent. */
  safeRate: number;
  /** The growth DIY route's return, in percent. */
  equityRate: number;
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
  /** Payout arriving this year, at the end of it. Includes maturity in the last payout year. */
  payoutIn: number;
  /** payoutIn − premiumOut, in the money of the day. */
  net: number;
  /** payoutIn in today's money. */
  realValue: number;
  /** premiumOut in today's money. */
  realPremium: number;
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
  /** What is left of the premium to invest, once the cover is bought. */
  investableCapital: number;
  policy: {
    /** The policy's own annualised yield, in percent. Zero when XIRR cannot converge. */
    xirrPct: number;
    /** Every rupee the policy pays out, added up as if a rupee in year 30 were a rupee today. */
    totalNominalPayout: number;
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
  const rows: LedgerRow[] = [];

  for (let yr = 1; yr <= totalYears; yr++) {
    const premiumOut = yr <= inputs.ppt ? inputs.premium : 0;
    let payoutIn = yr >= inputs.payoutStartYear && yr <= payoutEndYear ? inputs.payoutAmount : 0;
    if (yr === payoutEndYear) payoutIn += inputs.maturityBenefit;

    rows.push({
      year: yr,
      premiumOut,
      payoutIn,
      net: payoutIn - premiumOut,
      realValue: payoutIn / Math.pow(1 + infl, yr),
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

    if (row.payoutIn > 0 && balance > 0) {
      const gainRatio = Math.max(0, balance - costBasis) / balance;

      // THE WITHDRAWAL IS GROSSED UP, not netted down.
      //
      // The SWP engine takes the tax OUT of the paycheck, because there the
      // paycheck is what the retiree chose to draw. Here the payout is a
      // PROMISE - the whole page rests on both routes paying the identical
      // income - so the fund must sell enough to hand over the promised figure
      // AFTER tax. Netting down would quietly pay the reader less than the
      // policy did and still call the two comparable.
      const want = grossUpForTax(row.payoutIn, gainRatio, rate, exemptionLeft);
      const sold = Math.min(want, balance);

      const realisedGain = sold * gainRatio;
      const taxable = Math.max(0, realisedGain - exemptionLeft);
      const tax = taxable * rate;
      exemptionLeft = Math.max(0, exemptionLeft - realisedGain);

      const delivered = sold - tax;
      const paid = Math.min(delivered, row.payoutIn);
      const missed = row.payoutIn - paid;

      taxDrag += tax;
      balance -= sold;
      costBasis = Math.max(0, costBasis - sold * (1 - gainRatio));

      if (missed > MISSED_PAYMENT_TOLERANCE) {
        if (exhaustedInYear === null) exhaustedInYear = row.year;
        unfundedPayout += missed;
        unfundedPayoutReal += missed / Math.pow(1 + infl, row.year);
      }
    } else if (row.payoutIn > 0) {
      // Nothing left to sell.
      if (exhaustedInYear === null) exhaustedInYear = row.year;
      unfundedPayout += row.payoutIn;
      unfundedPayoutReal += row.payoutIn / Math.pow(1 + infl, row.year);
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
 */
export function realBreakEvenYear(ledger: LedgerRow[]): number | null {
  let cumulative = 0;
  for (const row of ledger) {
    cumulative += row.realValue - row.realPremium;
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

/** The policy's own annualised yield, on exact calendar dates. Zero when XIRR cannot converge. */
export function policyXirrPct(inputs: PolicyInputs, ledger: LedgerRow[]): number {
  const flows: { amount: number; date: Date }[] = [];

  for (const row of ledger) {
    if (row.premiumOut !== 0) {
      flows.push({ amount: -row.premiumOut, date: yearsFrom(inputs.startDate, row.year - 1) });
    }
    if (row.payoutIn !== 0) {
      flows.push({ amount: row.payoutIn, date: yearsFrom(inputs.startDate, row.year) });
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
  const growth = replicate(inputs, inputs.equityRate, cg);

  // The reader's own rate always has a row, even if it is not one of ours. The
  // table's "(Your Input)" marker used to be a hardcoded `rate === 12` in the
  // view, which would have silently pointed at the wrong row the moment the
  // equity assumption moved - dd-013's second value for one quantity, waiting
  // to happen.
  const rates = Array.from(new Set<number>([...SENSITIVITY_RATES, inputs.equityRate])).sort(
    (a, b) => a - b
  );

  const sensitivity: SensitivityRow[] = rates.map((rate) => {
    const route = replicate(inputs, rate, cg);
    return {
      rate,
      surplus: route.finalBalance,
      verdict: verdictFor(route),
      isBaseline: rate === inputs.equityRate,
    };
  });

  return {
    inputs,
    totalYears,
    payoutEndYear,
    riskCostPerYear,
    riskCostPaid: riskCostPerYear * inputs.ppt,
    investableCapital: investableCapitalOf(inputs),
    policy: {
      xirrPct: policyXirrPct(inputs, ledger),
      totalNominalPayout: ledger.reduce((sum, r) => sum + r.payoutIn, 0),
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
