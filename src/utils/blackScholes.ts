/**
 * Black-Scholes Options Pricing & Greeks Engine
 * Includes Abramowitz & Stegun Cumulative Normal Distribution approximation
 * and Standard Normal Probability Density Function.
 * Includes Merton Extension for Continuous Dividend Yield.
 */

/**
 * Standard Normal Probability Density Function pdf(x)
 * @param {number} x
 * @returns {number}
 */
export function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Abramowitz & Stegun approximation for Cumulative Normal Distribution N(x)
 * Maximum error: 7.5e-8
 * @param {number} x
 * @returns {number}
 */
export function cdf(x: number): number {
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

export interface BlackScholesResult {
  callPrice: number;
  putPrice: number;
  deltaCall: number;
  deltaPut: number;
  gamma: number;
  thetaCall: number;
  thetaPut: number;
  thetaCallDaily: number;
  thetaPutDaily: number;
  vega: number;
  vegaPerPercent: number;
  rhoCall: number;
  rhoPut: number;
  rhoCallPerPercent: number;
  rhoPutPerPercent: number;
  d1: number;
  d2: number;
}

/**
 * Calculate Black-Scholes Option Prices and Greeks (Merton Model)
 * 
 * @param {number} S Spot Price of Underlying Asset (e.g., ₹100 or ₹18000)
 * @param {number} K Strike Price (e.g., ₹100)
 * @param {number} T Time to Expiration in Years (e.g., 0.25 for 3 months, 1.0 for 1 year)
 * @param {number} r Risk-Free Interest Rate (as decimal e.g. 0.07 or percentage 7)
 * @param {number} v Implied Volatility (as decimal e.g. 0.20 or percentage 20)
 * @param {number} q Continuous Dividend Yield (as decimal e.g. 0.012 or percentage 1.2)
 * @returns {BlackScholesResult} Option Prices & Greeks
 */
export function calculateBlackScholes(
  S: number | string, 
  K: number | string, 
  T: number | string, 
  r: number | string, 
  v: number | string,
  q: number | string = 0
): BlackScholesResult {
  const spot = Number(S);
  const strike = Number(K);
  let time = Number(T);
  let rate = Number(r);
  let vol = Number(v);
  let divYield = Number(q);

  // Normalize percentage inputs if passed as whole numbers > 1 (crude heuristic, but keeps backward compat)
  if (rate > 1) rate = rate / 100;
  if (vol > 1) vol = vol / 100;
  if (divYield > 1) divYield = divYield / 100;

  // Handle Edge Cases: Expiration (T <= 0) or Zero Volatility (v <= 0)
  if (time <= 0 || vol <= 0) {
    const callIntrinsic = Math.max(0, spot - strike);
    const putIntrinsic = Math.max(0, strike - spot);
    const discount = Math.exp(-rate * Math.max(0, time));
    const qDiscount = Math.exp(-divYield * Math.max(0, time));

    return {
      callPrice: Number((callIntrinsic * qDiscount).toFixed(4)),
      putPrice: Number((putIntrinsic * discount).toFixed(4)),
      deltaCall: spot > strike ? 1 * qDiscount : (spot === strike ? 0.5 * qDiscount : 0),
      deltaPut: spot < strike ? -1 * qDiscount : (spot === strike ? -0.5 * qDiscount : 0),
      gamma: 0,
      thetaCall: 0,
      thetaPut: 0,
      thetaCallDaily: 0,
      thetaPutDaily: 0,
      vega: 0,
      vegaPerPercent: 0,
      rhoCall: 0,
      rhoPut: 0,
      rhoCallPerPercent: 0,
      rhoPutPerPercent: 0,
      d1: 0,
      d2: 0,
    };
  }

  const sqrtT = Math.sqrt(time);
  const d1 = (Math.log(spot / strike) + (rate - divYield + 0.5 * vol * vol) * time) / (vol * sqrtT);
  const d2 = d1 - vol * sqrtT;

  const pdfD1 = pdf(d1);
  const cdfD1 = cdf(d1);
  const cdfD2 = cdf(d2);
  const cdfNegD1 = cdf(-d1);
  const cdfNegD2 = cdf(-d2);

  const discount = Math.exp(-rate * time);
  const qDiscount = Math.exp(-divYield * time);

  // Option Prices
  const callPrice = spot * qDiscount * cdfD1 - strike * discount * cdfD2;
  const putPrice = strike * discount * cdfNegD2 - spot * qDiscount * cdfNegD1;

  // The Greeks
  const deltaCall = qDiscount * cdfD1;
  const deltaPut = qDiscount * (cdfD1 - 1); // equivalent to -qDiscount * cdf(-d1)

  const gamma = (qDiscount * pdfD1) / (spot * vol * sqrtT);

  // Vega (Price change per 1.0 change in Volatility and per 1% change in Volatility)
  const vega = spot * qDiscount * pdfD1 * sqrtT;
  const vegaPerPercent = vega / 100;

  // Theta (Annual & Daily)
  const thetaTerm1 = -(spot * qDiscount * pdfD1 * vol) / (2 * sqrtT);
  const thetaCallAnnual = thetaTerm1 - rate * strike * discount * cdfD2 + divYield * spot * qDiscount * cdfD1;
  const thetaPutAnnual = thetaTerm1 + rate * strike * discount * cdfNegD2 - divYield * spot * qDiscount * cdfNegD1;

  const thetaCallDaily = thetaCallAnnual / 365;
  const thetaPutDaily = thetaPutAnnual / 365;
  
  // Rho (Price change per 1.0 change in Interest Rate)
  const rhoCall = strike * time * discount * cdfD2;
  const rhoPut = -strike * time * discount * cdfNegD2;
  const rhoCallPerPercent = rhoCall / 100;
  const rhoPutPerPercent = rhoPut / 100;

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
    rhoCall: Number(rhoCall.toFixed(4)),
    rhoPut: Number(rhoPut.toFixed(4)),
    rhoCallPerPercent: Number(rhoCallPerPercent.toFixed(4)),
    rhoPutPerPercent: Number(rhoPutPerPercent.toFixed(4)),
    d1: Number(d1.toFixed(4)),
    d2: Number(d2.toFixed(4)),
  };
}

/**
 * Solve for Implied Volatility using Newton-Raphson method
 * 
 * @param {string} optionType 'call' or 'put'
 * @param {number} targetPrice The market price of the option
 * @param {number} S Spot Price
 * @param {number} K Strike Price
 * @param {number} T Time to Expiration in Years
 * @param {number} r Risk-Free Interest Rate
 * @param {number} q Continuous Dividend Yield
 * @returns {number} Implied Volatility as a decimal (e.g. 0.25 for 25%), or null if it fails to converge
 */
export function impliedVolatility(
  optionType: 'call' | 'put',
  targetPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  q: number = 0
): number | null {
  const MAX_ITER = 100;
  const TOLERANCE = 1e-5;
  
  // Initial guess (Brenner and Subrahmanyam approximation)
  let vol = Math.sqrt((2 * Math.PI) / T) * (targetPrice / S);
  if (vol === 0 || isNaN(vol)) vol = 0.3; // fallback guess

  for (let i = 0; i < MAX_ITER; i++) {
    const bs = calculateBlackScholes(S, K, T, r, vol, q);
    const price = optionType === 'call' ? bs.callPrice : bs.putPrice;
    const diff = price - targetPrice;

    if (Math.abs(diff) < TOLERANCE) {
      return vol;
    }

    const vega = bs.vega; // vega is the same for calls and puts
    
    if (vega < 1e-8) {
      // Vega is too small, Newton-Raphson won't work well (gradient too flat).
      // Can fall back to bisection if needed, but for now just break.
      break;
    }

    vol = vol - diff / vega;
    
    // Clamp vol to reasonable bounds
    if (vol <= 0) vol = 1e-4;
    if (vol > 10) vol = 10; // 1000%
  }

  // If it didn't return during the loop, try a bisection fallback as a last resort
  let low = 1e-4;
  let high = 5.0; // 500%
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const bs = calculateBlackScholes(S, K, T, r, mid, q);
    const price = optionType === 'call' ? bs.callPrice : bs.putPrice;
    
    const diff = price - targetPrice;
    if (Math.abs(diff) < TOLERANCE) {
      return mid;
    }
    
    if (diff > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return null;
}
