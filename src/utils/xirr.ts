/**
 * Universal Extended Internal Rate of Return (XIRR) Engine
 * Uses the Newton-Raphson numerical method to compute annualized yield
 * for irregular cash flows with exact calendar dates.
 */

export interface CashFlow {
  amount: number | string;
  date: Date | string | number;
}

/**
 * Calculate XIRR for an array of irregular cash flows using Newton-Raphson iteration.
 *
 * @param {CashFlow[]} cashFlows Array of cash flows [{ amount: -100000, date: '2024-01-01' }, ...]
 * @param {number} [guess=0.1] Initial rate guess (default: 0.10 for 10%)
 * @param {number} [maxIterations=100] Maximum Newton-Raphson iterations
 * @param {number} [tolerance=1e-7] Convergence threshold
 * @returns {number|null} Annualized percentage yield (e.g., 10.54) or null if convergence fails
 */
export function calculateXIRR(cashFlows: CashFlow[], guess: number = 0.1, maxIterations: number = 100, tolerance: number = 1e-7): number | null {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2) {
    return null;
  }

  // Parse and sort cash flows chronologically
  const sorted = cashFlows
    .map(cf => ({
      amount: Number(cf.amount),
      date: new Date(cf.date)
    }))
    .filter(cf => !isNaN(cf.amount) && !isNaN(cf.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sorted.length < 2) {
    return null;
  }

  // Validation: Must contain at least one positive and one negative cash flow
  let hasPositive = false;
  let hasNegative = false;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].amount > 0) hasPositive = true;
    if (sorted[i].amount < 0) hasNegative = true;
  }

  if (!hasPositive || !hasNegative) {
    return null;
  }

  const startDate = sorted[0].date.getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Pre-calculate fractional year offsets t_i = (d_i - d_0) / 365
  const times = sorted.map(cf => (cf.date.getTime() - startDate) / (365 * MS_PER_DAY));

  let rate = guess;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Prevent invalid base (-1.0 or lower)
    if (rate <= -0.9999) {
      rate = -0.9999;
    }

    let fValue = 0;
    let fDerivative = 0;

    for (let i = 0; i < sorted.length; i++) {
      const t = times[i];
      const amount = sorted[i].amount;
      const base = 1 + rate;

      if (base <= 0) {
        continue;
      }

      const discountFactor = Math.pow(base, t);
      fValue += amount / discountFactor;

      if (base !== 0) {
        fDerivative -= (t * amount) / Math.pow(base, t + 1);
      }
    }

    // Check for convergence
    if (Math.abs(fValue) < tolerance) {
      const xirrPercentage = rate * 100;
      return Number(xirrPercentage.toFixed(2));
    }

    // Handle zero or near-zero derivative to prevent division by zero
    if (Math.abs(fDerivative) < 1e-12) {
      return null;
    }

    const nextRate = rate - fValue / fDerivative;

    // Check step convergence
    if (Math.abs(nextRate - rate) < tolerance) {
      const xirrPercentage = nextRate * 100;
      return Number(xirrPercentage.toFixed(2));
    }

    rate = nextRate;
  }

  return null;
}
