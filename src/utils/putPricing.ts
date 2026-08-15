import { calculateBlackScholes } from './blackScholes';

/**
 * What a protective floor actually costs.
 *
 * Rahul settled the premium at 1.85% and then asked for sliders on the floor
 * depth and the roll term. Those two instructions are in tension, and the
 * resolution is that 1.85% was never a constant - it is the price of ONE
 * combination. A free premium slider would let a reader build a -5% floor at
 * 0.5% and model a contract nobody would write, which is the same class of
 * fault as a screen inventing its own numbers (sol-023): a figure that looks
 * authoritative and corresponds to nothing.
 *
 * So the premium is an OUTPUT here, priced from the three things the reader
 * actually chooses or assumes.
 *
 * THE ONE PIECE OF FINANCE THAT MATTERS. A put is not priced at the volatility
 * the market goes on to realise; it is priced at IMPLIED volatility, which sits
 * persistently above it. That gap is the seller's margin and is why insurance
 * loses money on average - you pay the implied price and collect the realised
 * payoff. Modelling it as a flat markup would have been arbitrary; modelling it
 * as a volatility spread is what actually happens, and it falls out of the
 * calibration below at a value the market itself would recognise.
 */

/** Indian risk-free rate, used for discounting the strike. */
const RISK_FREE = 0.065;

/**
 * Implied volatility sits this many points above realised. Solved so that a
 * -10% floor rolled every 12 months at 15% roughness prices at exactly Rahul's
 * 1.85%, and the answer - 4.37 points - lands inside the 3 to 5 point range
 * measured on index puts. His number was not arbitrary; it corresponds to a
 * real market price, which is the reason it can be kept while everything
 * around it moves.
 */
export const VOL_RISK_PREMIUM_POINTS = 4.373;

export interface PutQuote {
  /** Cost of one contract, as a % of the notional it covers. */
  perTerm: number;
  /** Cost of holding the floor continuously for a year, as a % of savings. */
  annual: number;
  /** The same, in rupees a year, on the corpus supplied. */
  annualRupees: number;
  /** Black-Scholes value at the volatility the market actually realises. */
  fairValue: number;
  /** How many times the fair value the reader is charged. */
  markup: number;
  /** Rolls per year at this term. */
  rollsPerYear: number;
}

/**
 * Price a rolling protective floor.
 *
 * @param floorPct    depth of the floor, negative, e.g. -10
 * @param roughnessPct realised annual volatility, e.g. 15
 * @param termMonths  how often the put is re-struck: 3, 6, 9 or 12
 * @param corpus      savings the floor is written on, for the rupee figure
 */
export function pricePut(
  floorPct: number,
  roughnessPct: number,
  termMonths: number,
  corpus = 0
): PutQuote {
  const T = Math.max(1, termMonths) / 12;
  const strike = 100 * (1 + floorPct / 100);
  const rollsPerYear = 12 / Math.max(1, termMonths);

  const atImplied = calculateBlackScholes(
    100, strike, T, RISK_FREE, (roughnessPct + VOL_RISK_PREMIUM_POINTS) / 100
  ).putPrice;
  const atRealised = calculateBlackScholes(
    100, strike, T, RISK_FREE, roughnessPct / 100
  ).putPrice;

  const perTerm = Math.max(0, atImplied);
  const annual = perTerm * rollsPerYear;

  return {
    perTerm,
    annual,
    annualRupees: corpus * (annual / 100),
    fairValue: Math.max(0, atRealised) * rollsPerYear,
    markup: atRealised > 1e-9 ? atImplied / atRealised : Infinity,
    rollsPerYear,
  };
}
