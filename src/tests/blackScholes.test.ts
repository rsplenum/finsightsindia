import { describe, it, expect } from 'vitest';
import { calculateBlackScholes, pdf, cdf } from '../utils/blackScholes';

describe('Black-Scholes Options Pricing & Greeks Engine', () => {
  it('should calculate standard normal pdf', () => {
    expect(pdf(0)).toBeCloseTo(0.39894, 4);
  });

  it('should calculate standard normal cdf', () => {
    expect(cdf(0)).toBeCloseTo(0.5, 4);
  });

  it('should calculate option prices correctly', () => {
    const result = calculateBlackScholes(100, 100, 1, 0.05, 0.2);
    expect(result.callPrice).toBeCloseTo(10.4506, 3);
    expect(result.putPrice).toBeCloseTo(5.5735, 3);
  });

  it('should handle zero volatility or time correctly', () => {
    const result = calculateBlackScholes(100, 100, 0, 0.05, 0.2);
    expect(result.callPrice).toBeCloseTo(0, 4);
    expect(result.putPrice).toBeCloseTo(0, 4);
  });
});
