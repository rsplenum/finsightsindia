import { describe, it, expect } from 'vitest';
import { runDeterministicSWP, type SWPInputs } from '../utils/swpDeterministic';

// The bug these guard against: the portfolio was debited `withdrawal + tax`
// while the UI reported net income as `withdrawal - tax`. No consistent model
// produces that pair - the LTCG was charged once against the corpus and again
// against the reported paycheck. On the default scenario it moved depletion
// from year 27 to year 24 and made every survival score on the site pessimistic.
//
// The settled model, matching the input tooltip ("This is your GROSS target.
// Your actual net-in-hand income will be slightly lower"): the withdrawal is
// the gross paycheck, tax comes out of it, the corpus is debited the
// withdrawal only.

const base: SWPInputs = {
  initialCorpus: 10000000,
  monthlyWithdrawal: 40000,
  annualStepUp: 5,
  expectedReturn: 12,
  expectedInflation: 6,
  ltcgTax: 12.5,
  horizonYears: 30,
};

describe('SWP deterministic engine - money must be conserved', () => {
  it('debits the corpus exactly the gross withdrawal, never withdrawal + tax', () => {
    const r = runDeterministicSWP({ ...base, horizonYears: 1 });
    const grown = base.initialCorpus * (1 + base.expectedReturn / 100);
    // year 1: balance = grown - gross withdrawal. Tax is inside the withdrawal.
    expect(r.balances[1]).toBeCloseTo(grown - r.withdrawals[1], 2);
  });

  it('every year: closing balance = opening + growth - gross withdrawal', () => {
    const r = runDeterministicSWP(base);
    for (let y = 1; y < r.balances.length; y++) {
      if (r.balances[y] <= 0 || r.withdrawals[y] <= 0) continue;
      const expected = r.balances[y - 1] + r.growth[y] - r.withdrawals[y];
      expect(Math.abs(r.balances[y] - expected)).toBeLessThan(1);
    }
  });

  it('net paycheck is the gross withdrawal less tax, and tax never exceeds it', () => {
    const r = runDeterministicSWP(base);
    for (let y = 1; y < r.withdrawals.length; y++) {
      if (r.withdrawals[y] <= 0) continue;
      expect(r.taxes[y]).toBeLessThan(r.withdrawals[y]);
      expect(r.netMonthly[y] * 12).toBeCloseTo(r.withdrawals[y] - r.taxes[y], 2);
    }
  });

  it('tax is only ever charged on the gain portion, never on principal', () => {
    // A corpus with zero growth has no capital gain, so no LTCG can arise.
    const r = runDeterministicSWP({ ...base, expectedReturn: 0, horizonYears: 5 });
    for (const t of r.taxes) expect(t).toBe(0);
  });
});

describe('SWP deterministic engine - behaviour', () => {
  it('a corpus growing faster than it is drawn down survives the horizon', () => {
    const r = runDeterministicSWP({
      ...base,
      monthlyWithdrawal: 20000,
      expectedReturn: 12,
      annualStepUp: 0,
    });
    expect(r.balances[r.balances.length - 1]).toBeGreaterThan(0);
  });

  it('an over-drawn corpus depletes and then stays at zero', () => {
    const r = runDeterministicSWP({ ...base, monthlyWithdrawal: 200000 });
    const last = r.balances[r.balances.length - 1];
    expect(last).toBe(0);
    // once depleted it must not go negative or recover
    expect(Math.min(...r.balances)).toBe(0);
  });

  it('the paycheck escalates by inflation compounded with the lifestyle step-up', () => {
    const r = runDeterministicSWP(base);
    const escalation = (1 + 6 / 100) * (1 + 5 / 100);
    expect(r.withdrawals[2] / r.withdrawals[1]).toBeCloseTo(escalation, 4);
  });

  it('hedging drag reduces the return actually earned', () => {
    const plain = runDeterministicSWP({ ...base, horizonYears: 1 });
    const hedged = runDeterministicSWP({
      ...base,
      horizonYears: 1,
      bsEnabled: true,
      hedgingDragCost: 2,
    });
    expect(hedged.growth[1]).toBeLessThan(plain.growth[1]);
  });
});
