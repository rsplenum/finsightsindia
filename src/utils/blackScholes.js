/**
 * Black-Scholes Options Pricing & Greeks Engine
 * Includes Abramowitz & Stegun Cumulative Normal Distribution approximation
 * and Standard Normal Probability Density Function.
 */

/**
 * Standard Normal Probability Density Function pdf(x)
 * @param {number} x
 * @returns {number}
 */
export function pdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Abramowitz & Stegun approximation for Cumulative Normal Distribution N(x)
 * Maximum error: 7.5e-8
 * @param {number} x
 * @returns {number}
 */
export function cdf(x) {
  if (x < 0) {
    return 1 - cdf(-x);
  }

  const p = 0.2316419;
  const a1 = 0.319381530;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;

  const t = 1 / (1 + p * x);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return 1 - pdf(x) * poly;
}

/**
 * Standard alias for Cumulative Normal Distribution
 */
export const N = cdf;

/**
 * Calculate Black-Scholes Option Prices and Greeks
 * 
 * @param {number} S Spot Price of Underlying Asset (e.g., ₹100 or ₹18000)
 * @param {number} K Strike Price (e.g., ₹100)
 * @param {number} T Time to Expiration in Years (e.g., 0.25 for 3 months, 1.0 for 1 year)
 * @param {number} r Risk-Free Interest Rate (as decimal e.g. 0.07 or percentage 7)
 * @param {number} v Implied Volatility (as decimal e.g. 0.20 or percentage 20)
 * @returns {Object} Option Prices & Greeks
 */
export function calculateBlackScholes(S, K, T, r, v) {
  const spot = Number(S);
  const strike = Number(K);
  let time = Number(T);
  let rate = Number(r);
  let vol = Number(v);

  // Normalize percentage inputs if passed as whole numbers
  if (rate > 1) rate = rate / 100;
  if (vol > 1) vol = vol / 100;

  // Handle Edge Cases: Expiration (T <= 0) or Zero Volatility (v <= 0)
  if (time <= 0 || vol <= 0) {
    const callIntrinsic = Math.max(0, spot - strike);
    const putIntrinsic = Math.max(0, strike - spot);
    const discount = Math.exp(-rate * Math.max(0, time));

    return {
      callPrice: Number(callIntrinsic.toFixed(4)),
      putPrice: Number((putIntrinsic * discount).toFixed(4)),
      deltaCall: spot > strike ? 1 : (spot === strike ? 0.5 : 0),
      deltaPut: spot < strike ? -1 : (spot === strike ? -0.5 : 0),
      gamma: 0,
      thetaCall: 0,
      thetaPut: 0,
      thetaCallDaily: 0,
      thetaPutDaily: 0,
      vega: 0,
      vegaPerPercent: 0,
      d1: 0,
      d2: 0,
    };
  }

  const sqrtT = Math.sqrt(time);
  const d1 = (Math.log(spot / strike) + (rate + 0.5 * vol * vol) * time) / (vol * sqrtT);
  const d2 = d1 - vol * sqrtT;

  const pdfD1 = pdf(d1);
  const cdfD1 = cdf(d1);
  const cdfD2 = cdf(d2);
  const cdfNegD1 = cdf(-d1);
  const cdfNegD2 = cdf(-d2);

  const discount = Math.exp(-rate * time);

  // Option Prices
  const callPrice = spot * cdfD1 - strike * discount * cdfD2;
  const putPrice = strike * discount * cdfNegD2 - spot * cdfNegD1;

  // The Greeks
  const deltaCall = cdfD1;
  const deltaPut = cdfD1 - 1; // or -cdf(-d1)

  const gamma = pdfD1 / (spot * vol * sqrtT);

  // Vega (Price change per 1.0 change in Volatility and per 1% change in Volatility)
  const vega = spot * pdfD1 * sqrtT;
  const vegaPerPercent = vega / 100;

  // Theta (Annual & Daily)
  const thetaTerm1 = -(spot * pdfD1 * vol) / (2 * sqrtT);
  const thetaCallAnnual = thetaTerm1 - rate * strike * discount * cdfD2;
  const thetaPutAnnual = thetaTerm1 + rate * strike * discount * cdfNegD2;

  const thetaCallDaily = thetaCallAnnual / 365;
  const thetaPutDaily = thetaPutAnnual / 365;

  return {
    callPrice: Number(callPrice.toFixed(4)),
    putPrice: Number(putPrice.toFixed(4)),
    deltaCall: Number(deltaCall.toFixed(4)),
    deltaPut: Number(deltaPut.toFixed(4)),
    gamma: Number(gamma.toFixed(6)),
    thetaCall: Number(thetaCallAnnual.toFixed(4)),
    thetaPut: Number(thetaPutAnnual.toFixed(4)),
    thetaCallDaily: Number(thetaCallDaily.toFixed(4)),
    thetaPutDaily: Number(thetaPutDaily.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    vegaPerPercent: Number(vegaPerPercent.toFixed(4)),
    d1: Number(d1.toFixed(4)),
    d2: Number(d2.toFixed(4)),
  };
}
