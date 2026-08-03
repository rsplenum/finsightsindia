import { describe, it, expect } from 'vitest';
import { calculateIndiaTaxEngine } from '../utils/tax';

describe('India Tax Engine', () => {
  it('should calculate 0 tax for new regime if income <= 12L (including standard deduction)', () => {
    const result = calculateIndiaTaxEngine(1275000, 0);
    // 1275000 - 75000 = 1200000 taxable. 12L has rebate
    expect(result.newTax).toBe(0);
  });

  it('should calculate old tax correctly for 10L income', () => {
    // 1000000 - 50000 = 950000 taxable.
    // 2.5L * 5% + 4.5L * 20% = 12500 + 90000 = 102500
    // + 4% cess = 102500 * 1.04 = 106600
    const result = calculateIndiaTaxEngine(1000000, 0);
    expect(result.oldTax).toBe(106600);
  });

  it('should calculate correct tax rates', () => {
    const result = calculateIndiaTaxEngine(1500000, 150000); // Gross 15L, Deductions 1.5L
    // new taxable: 15L - 75k = 14.25L. Tax: 4L*5% + 4L*10% + 2.25L*15% = 20k + 40k + 33.75k = 93750. Cess: 93750*1.04 = 97500.
    // old taxable: 15L - 50k - 1.5L = 13L. Tax: 2.5L*5% + 5L*20% + 3L*30% = 12.5k + 100k + 90k = 202500. Cess: 202500*1.04 = 210600.
    expect(result.newTax).toBe(97500);
    expect(result.oldTax).toBe(210600);
    expect(result.isNewBetter).toBe(true);
  });
});
