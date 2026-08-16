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
 * Applied once, to the terminal gain. That is what the page has always done and
 * it is not what the law does - the exemption is annual, and a real investor
 * selling to fund twenty years of payouts would use it twenty times. It
 * therefore OVERSTATES the tax on the DIY route, which is the conservative
 * direction for a page arguing that DIY wins, but it is still wrong. Left as
 * shipped by the extraction, on purpose: this is the refactor, not the fix.
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
  /** Capital gains tax deducted at the end. Zero on the safe route, which this page does not tax. */
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
 * `taxGains` is what separates the two routes on this page. The growth route
 * pays capital gains tax on the terminal balance; the safe route pays none,
 * which is not what a real bond investor experiences and is noted as a defect
 * rather than defended.
 */
export function replicate(
  inputs: PolicyInputs,
  annualRatePct: number,
  taxGains: boolean
): RouteResult {
  const ledger = buildLedger(inputs);
  const investableCapital = investableCapitalOf(inputs);
  const riskCostPerYear = inputs.termCost + inputs.accidentCost;
  const infl = inputs.inflationRate / 100;

  let balance = 0;
  let capitalInvested = 0;
  let exhaustedInYear: number | null = null;
  let unfundedPayout = 0;
  let unfundedPayoutReal = 0;

  for (const row of ledger) {
    const investedThisYear = row.year <= inputs.ppt ? investableCapital : 0;
    capitalInvested += investedThisYear;

    balance += investedThisYear;
    balance *= 1 + annualRatePct / 100;

    // Pay what there is. A later premium can refill the pot and the payments
    // resume, which is why this tracks a total rather than stopping the walk.
    const paid = Math.min(balance, row.payoutIn);
    const missed = row.payoutIn - paid;
    balance -= paid;

    if (missed > 0) {
      if (exhaustedInYear === null) exhaustedInYear = row.year;
      unfundedPayout += missed;
      unfundedPayoutReal += missed / Math.pow(1 + infl, row.year);
    }
  }

  let taxDrag = 0;
  if (taxGains && balance > 0) {
    const taxableGain = Math.max(0, balance - capitalInvested - inputs.ltcgExemption);
    taxDrag = taxableGain * (inputs.ltcgRatePct / 100);
    balance -= taxDrag;
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

  const safe = replicate(inputs, inputs.safeRate, false);
  const growth = replicate(inputs, inputs.equityRate, true);

  // The reader's own rate always has a row, even if it is not one of ours. The
  // table's "(Your Input)" marker used to be a hardcoded `rate === 12` in the
  // view, which would have silently pointed at the wrong row the moment the
  // equity assumption moved - dd-013's second value for one quantity, waiting
  // to happen.
  const rates = Array.from(new Set<number>([...SENSITIVITY_RATES, inputs.equityRate])).sort(
    (a, b) => a - b
  );

  const sensitivity: SensitivityRow[] = rates.map((rate) => {
    const route = replicate(inputs, rate, true);
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
