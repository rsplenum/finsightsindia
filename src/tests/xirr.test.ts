import { describe, it, expect } from 'vitest';
import { calculateXIRR } from '../utils/xirr';

describe('Universal Extended Internal Rate of Return (XIRR) Engine', () => {
  it('should calculate XIRR correctly for simple cashflows', () => {
    const cashFlows = [
      { amount: -10000, date: '2023-01-01' },
      { amount: 11000, date: '2024-01-01' }
    ];
    // 1 year, 10% return
    expect(calculateXIRR(cashFlows)).toBeCloseTo(10.0, 1);
  });

  it('should return null for less than 2 cash flows', () => {
    expect(calculateXIRR([{ amount: -10000, date: '2023-01-01' }])).toBeNull();
  });

  it('should return null if there is no positive or negative cash flow', () => {
    expect(calculateXIRR([
      { amount: 10000, date: '2023-01-01' },
      { amount: 11000, date: '2024-01-01' }
    ])).toBeNull();
  });
});
