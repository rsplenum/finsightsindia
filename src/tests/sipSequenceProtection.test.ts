import { describe, it, expect } from 'vitest';
import {
  sequenceRisk, protectionCurve, simulate, outlookFrom, growthCurve,
  contributionPlan, instalmentInYear, realRateChain, type SipInputs,
} from '../utils/sipAdvice';
import {
  DEFAULT_FUND_COST, FUND_COST_PLANS, ACTIVE_FUND_CAVEAT,
} from '../utils/fundCosts';

// The two claims rungs 4 and 5 make in prose, asserted in code.
//
// Written because the planner learned the hard way that a screen's headline and
// its engine can drift apart: rung 5 there shipped a verdict line that its own
// figures did not support, and only a review caught it. A sentence a component
// prints is a claim about the world, and a claim about the world belongs in the
// suite.

const base: SipInputs = {
  seedCapital: 0,
  monthlySip: 25000,
  targetRealWealth: 10000000,
  // dd-017: the monthly figure is in today's money and holds its value. A real
  // step-up of zero is a complete plan, not an absent one.
  contributionMode: 'real' as const,
  realStepUp: 0,
  monthlyIncome: 0,
  savingsRatePct: 20,
  horizonYears: 20,
  expectedInflation: 6,
  expectedReturn: 12,
  annualVolatility: 15,
  ltcgTax: 12.5,
  isPostTax: true,
  eqPct: 0.7,
  debtPct: 0.2,
  goldPct: 0.1,
  bsEnabled: false,
  hedgingDragCost: 1.85,
  hedgingFloorLimit: -10,
  // The shipped default: an active fund bought through a distributor. These
  // two rungs describe the world the reader is actually shown, so they are
  // asserted in it.
  expenseRatio: DEFAULT_FUND_COST.expenseRatio,
};

describe('rung 4 - the same bad years, moved', () => {
  const risk = sequenceRisk(base, -30);

  it('offers a profile per duration, each covering every placement', () => {
    expect(risk.profiles.map((p) => p.durationYears)).toEqual([1, 2, 3]);
    for (const p of risk.profiles) {
      expect(p.points.length).toBe(base.horizonYears - p.durationYears + 1);
      expect(p.points[0].startYear).toBe(1);
    }
  });

  it('holds the average return identical across every placement, by construction', () => {
    // This is what makes the screen a proof rather than an anecdote. If it ever
    // stops being exactly true, the rung's own caption becomes a lie.
    for (const p of risk.profiles) {
      const expected = ((20 - p.durationYears) * 12 + p.durationYears * -30) / 20;
      expect(p.averageReturn).toBeCloseTo(expected, 10);
    }
    expect(risk.profiles.map((p) => Number(p.averageReturn.toFixed(2))))
      .toEqual([9.9, 7.8, 5.7]);
  });

  it('THE MIRROR: a late crash costs a saver far more than an early one', () => {
    // The entire reason this rung exists, and the inversion of the planner's
    // rung 4. If this ever fails, the screen's prose is wrong, not the test.
    for (const p of risk.profiles) {
      const first = p.points[0];
      const last = p.points[p.points.length - 1];
      expect(last.setbackYears).toBeGreaterThan(first.setbackYears);
      expect(last.endReal).toBeLessThan(first.endReal);
      expect(p.worst.startYear).toBe(last.startYear);
      expect(p.best.startYear).toBe(first.startYear);
    }
  });

  it('the damage rises monotonically with how late the fall lands', () => {
    for (const p of risk.profiles) {
      for (let i = 1; i < p.points.length; i++) {
        expect(p.points[i].setbackYears).toBeGreaterThan(p.points[i - 1].setbackYears);
        expect(p.points[i].endReal).toBeLessThan(p.points[i - 1].endReal);
      }
    }
  });

  it('the headline is defined for every placement, including on a failing plan', () => {
    // The metric this replaced - delay to the goal - went null on exactly these
    // inputs, which do not reach the goal even in a smooth world. A headline
    // that goes blank on the page's own defaults is not a headline.
    expect(simulate(base, { numSims: 200 }).final.reachedTarget).toBeLessThan(0.5);
    for (const p of risk.profiles) {
      for (const q of p.points) {
        expect(Number.isFinite(q.setbackYears)).toBe(true);
        expect(q.setbackYears).toBeGreaterThan(0);
        expect(q.setbackYears).toBeLessThanOrEqual(q.endYear);
      }
    }
  });

  it('a longer bad run does more damage from the same starting year', () => {
    const [one, two, three] = risk.profiles;
    for (let y = 0; y < three.points.length; y++) {
      expect(two.points[y].setbackYears).toBeGreaterThan(one.points[y].setbackYears);
      expect(three.points[y].setbackYears).toBeGreaterThan(two.points[y].setbackYears);
    }
  });

  it('the smooth world is the best case - no placement beats it', () => {
    for (const p of risk.profiles) {
      for (const q of p.points) {
        expect(q.endReal).toBeLessThan(risk.smoothEndReal);
        expect(q.vsSmooth).toBeLessThan(1);
      }
    }
  });
});

describe('rung 4 - the fixed-sequence engine path', () => {
  it('is deterministic: the same sequence twice gives the same answer', () => {
    const a = sequenceRisk(base, -30, [2]);
    const b = sequenceRisk(base, -30, [2]);
    expect(a.profiles[0].points.map((p) => p.endReal))
      .toEqual(b.profiles[0].points.map((p) => p.endReal));
  });

  it('a flat sequence at the expected rate reproduces the smooth world', () => {
    // The fixed path and the ordinary path must agree where they overlap, or
    // this rung is a second engine wearing the first one's name (dd-013).
    const flat = simulate(base, {
      numSims: 1,
      equityVolatility: 0,
      equityReturnsByYear: Array.from({ length: 20 }, () => 0.12),
    });
    const risk = sequenceRisk(base, 12, [1]);
    expect(flat.final.realNet.p50).toBeCloseTo(risk.smoothEndReal, 0);
    // Crashing at 12% is not a crash, so nothing is lost anywhere.
    for (const q of risk.profiles[0].points) {
      expect(q.setbackYears).toBeCloseTo(0, 6);
    }
  });
});

describe('rung 5 - what protection costs', () => {
  const curve = protectionCurve(base, 10, 30, 5, 300);

  it('prices the premium once and never moves it along the track', () => {
    // The planner learned this the expensive way: re-pricing at every position
    // made cost rise in step with benefit and the screen stopped saying
    // anything at all. A fixed price against an uncertain payout IS the subject.
    const premiums = new Set(curve.points.map((p) => p.premium));
    expect(premiums.size).toBe(1);
    expect(curve.premium).toBeGreaterThan(0);
  });

  it('quotes above fair value, and says by how much', () => {
    expect(curve.premium).toBeGreaterThan(curve.fairValueAtReaderRoughness);
    expect(curve.markupAtReaderRoughness).toBeGreaterThan(1);
  });

  it('the floor binds more often as the market gets rougher', () => {
    for (let i = 1; i < curve.points.length; i++) {
      expect(curve.points[i].bindFrequency)
        .toBeGreaterThan(curve.points[i - 1].bindFrequency);
      expect(curve.points[i].payout).toBeGreaterThan(curve.points[i - 1].payout);
    }
  });

  it('THE VERDICT: on the shipped assumption this contract does not pay', () => {
    // The screen says so in plain words. If this ever flips, the copy is wrong.
    const at = curve.points.find((p) => p.roughness === 15)!;
    expect(at.p10Protected).toBeLessThan(at.p10Unprotected);
    expect(at.p50Protected).toBeLessThan(at.p50Unprotected);
    expect(at.net).toBeLessThan(0);
  });

  it('but it does earn its price once the market is rough enough', () => {
    expect(curve.breakeven).not.toBeNull();
    expect(curve.breakeven!).toBeGreaterThan(base.annualVolatility);
    for (const p of curve.points.filter((q) => q.roughness >= curve.breakeven!)) {
      expect(p.p10Protected).toBeGreaterThanOrEqual(p.p10Unprotected);
    }
  });

  it('states what an annual floor does NOT cover', () => {
    // dd-012: a protection's limits are stated as plainly as its benefits. An
    // annual floor resets, so three floored years are not one floored year.
    expect(curve.consecutiveThreeYearLoss).toBeCloseTo(-27.1, 1);
    expect(curve.consecutiveThreeYearLoss).toBeLessThan(curve.floor);
  });

  it('both columns come from one engine on identical paths', () => {
    // Anything else and the gap between the columns is partly noise rather than
    // entirely the floor (dd-013).
    const a = protectionCurve(base, 15, 15, 1, 200);
    const b = protectionCurve(base, 15, 15, 1, 200);
    expect(a.points[0]).toEqual(b.points[0]);
  });

  it('the reader\'s own assumption lands exactly on a computed point', () => {
    // Step 1 for the same reason the planner uses it: at a coarser step the
    // slider thumb snaps to one roughness while the readout shows another, and
    // the control and the number disagree on screen.
    const full = protectionCurve(base, 8, 32, 1, 100);
    expect(full.points.some((p) => p.roughness === full.readerRoughness)).toBe(true);
  });
});

describe('sol-033 - the fund charges something, and the column still closes', () => {
  const run = (expenseRatio: number) => {
    const inputs = { ...base, expenseRatio };
    const r = simulate(inputs, { numSims: 2000 });
    return { inputs, flow: outlookFrom(r, inputs).flow, outlook: outlookFrom(r, inputs) };
  };

  it('the flow rung reconciles to the rupee, in both moneys', () => {
    // sol-031 was four rows of a column made of three medians and a mean, which
    // did not add up. The fee is a fifth row and must not repeat that: it is the
    // MEDIAN PATH's fee, not the median fee, so it belongs to the same future
    // as everything beside it.
    for (const er of [0, 0.2, 0.8, 1.75]) {
      const { flow } = run(er);
      const real = flow.investedReal + flow.growthReal - flow.feeReal - flow.taxReal;
      expect(Math.abs(real - flow.endReal), `real column at ${er}%`).toBeLessThan(2);

      const nom = flow.investedNominal + flow.growthNominal - flow.feeNominal - flow.taxNominal;
      expect(Math.abs(nom - flow.endNominal), `nominal column at ${er}%`).toBeLessThan(2);
    }
  });

  it('a dearer fund leaves the saver with less, every time', () => {
    const free = run(0);
    const index = run(0.2);
    const distributor = run(1.75);

    expect(index.flow.endReal).toBeLessThan(free.flow.endReal);
    expect(distributor.flow.endReal).toBeLessThan(index.flow.endReal);
    expect(distributor.flow.feeReal).toBeGreaterThan(index.flow.feeReal);
    expect(free.flow.feeReal).toBe(0);
  });

  it('THE LESSON: the distributor costs more than the fee looks like', () => {
    // 1.75% a year sounds like a rounding error and is not. Over this horizon
    // the gap between a direct index fund and a regular plan is a fifth of
    // everything the plan produces, and that is the point of showing it at all.
    const index = run(0.2);
    const distributor = run(1.75);
    const lost = index.flow.endReal - distributor.flow.endReal;
    // 14.9% under dd-017, and it fell from 15.0% for a reason worth keeping:
    // once the instalment holds its purchasing power, more of the money arrives
    // late and is therefore exposed to the fee for fewer years. The fee's bite
    // shrinks slightly as a share while growing substantially in rupees.
    expect(lost / index.flow.endReal).toBeGreaterThan(0.14);
    // And it is a large multiple of one year's headline percentage difference,
    // which is exactly the intuition the row is there to correct.
    expect(lost).toBeGreaterThan(distributor.flow.investedReal * 0.2);
  });

  it('the fee is charged on every path, not only when hedging is on', () => {
    // The hedging ledger is collected only when the hedge is on, because it is
    // zero otherwise. This cost is never zero, and collecting it conditionally
    // is how it would go missing again.
    const hedged = { ...base, expenseRatio: 1.75, bsEnabled: true };
    const bare = { ...base, expenseRatio: 1.75, bsEnabled: false };
    for (const inputs of [hedged, bare]) {
      const f = outlookFrom(simulate(inputs, { numSims: 500 }), inputs).flow;
      expect(f.feeReal).toBeGreaterThan(0);
    }
  });
});

describe('rung 3 - the growth chain agrees with the engine beneath it', () => {
  it('the stated real rate is after the fee, not before it', () => {
    // The defect this fixes: rung 3 quoted 7.08% real while the engine ran the
    // plan at 5.22%, because the rung's arithmetic predated sol-033. A headline
    // rate its own simulation does not use is dd-009; the same fee showing as
    // rupees in rung 2 and as nothing in rung 3 is dd-013.
    const withFee = growthCurve({ ...base, expenseRatio: 1.75 }, 12, 14, 0.5, 60);
    const free = growthCurve({ ...base, expenseRatio: 0 }, 12, 14, 0.5, 60);

    const a = withFee.points.find((p) => p.growth === 13.5)!;
    const b = free.points.find((p) => p.growth === 13.5)!;

    expect(a.real).toBeLessThan(b.real);
    expect(b.real - a.real).toBeGreaterThan(1.5);
    expect(free.expenseRatio).toBe(0);
    expect(withFee.expenseRatio).toBe(1.75);
  });

  it('with no fee the chain collapses to the old two-rate model', () => {
    // The retrofit must not have moved the answer for anyone who pays nothing.
    const c = growthCurve({ ...base, expenseRatio: 0 }, 12, 12, 1, 40);
    const p = c.points[0];
    expect(p.afterFee).toBeCloseTo(p.growth, 10);
    expect(p.real).toBeCloseTo(
      ((1 + p.growth / 100) / (1 + base.expectedInflation / 100) - 1) * 100, 10
    );
  });

  it('the three forces compound rather than subtract, and the gap is visible', () => {
    // The caption on the row exists because of this: a reader who subtracts
    // gets 5.65 and the true answer is 5.22. If these ever converge the caption
    // is misleading and should go.
    const c = growthCurve({ ...base, expenseRatio: 1.75 }, 13.5, 13.5, 1, 40);
    const p = c.points[0];
    const naive = p.growth - 1.75 - base.expectedInflation;
    expect(p.real).toBeLessThan(naive);
    expect(naive - p.real).toBeGreaterThan(0.25);
  });

  it('every rate on the chain is ordered as the rows are', () => {
    // growth > after the fee > after inflation too. If the rows ever print out
    // of order the screen is telling a story its numbers do not support.
    const c = growthCurve({ ...base, expenseRatio: 1.75 }, 6, 18, 1, 40);
    for (const p of c.points) {
      expect(p.afterFee).toBeLessThan(p.growth);
      expect(p.real).toBeLessThan(p.afterFee);
    }
  });
});

describe('rung 3 - the control and the number never disagree', () => {
  it('the reader\'s own growth lands exactly on a computed point', () => {
    // The defect: a grid of 4.0, 4.5 ... 13.5 with a shipped assumption of
    // 13.3% put the slider thumb at 13.5 while every readout said 13.3. The
    // planner recorded this lesson on its protection track; it had not reached
    // here until rung 3's new first row made it plainly visible.
    for (const growth of [13.3, 12, 15.9, 8.7, 4, 18]) {
      const c = growthCurve({ ...base, expectedReturn: growth }, 4, 18, 0.5, 30);
      const hit = c.points.find((p) => Math.abs(p.growth - growth) < 1e-9);
      expect(hit, `growth ${growth}% is not on the grid`).toBeDefined();

      // And it must be a whole number of steps from the track's own start, or
      // the browser will snap the thumb somewhere else regardless.
      const steps = (growth - c.min) / c.step;
      expect(Math.abs(steps - Math.round(steps)), `growth ${growth}%`).toBeLessThan(1e-6);
    }
  });

  it('the track still covers the range the rung promises', () => {
    const c = growthCurve({ ...base, expectedReturn: 13.3 }, 4, 18, 0.5, 30);
    expect(c.min).toBeLessThanOrEqual(4);
    expect(c.max).toBeGreaterThanOrEqual(18);
    // Anchoring shifts the grid; it must not quietly double the work.
    expect(c.points.length).toBeLessThanOrEqual(32);
  });
});

describe('dd-017 - the contribution is asked for in today\'s money', () => {
  const at = (over: Partial<SipInputs>) => ({ ...base, ...over } as SipInputs);

  it('a real step-up of zero holds the instalment\'s purchasing power', () => {
    // The default, and the whole point. The instalment rises in cash exactly
    // with prices, so what the saver gives up each month never changes.
    const p = contributionPlan(at({ contributionMode: 'real', realStepUp: 0 }));
    expect(p.nominalStep).toBeCloseTo(base.expectedInflation / 100, 12);
    expect(p.holdsPurchasingPower).toBe(true);

    const yr20 = instalmentInYear(at({ contributionMode: 'real' }), 20);
    const deflated = yr20 / Math.pow(1 + base.expectedInflation / 100, 19);
    expect(deflated).toBeCloseTo(base.monthlySip, 6);
  });

  it('a flat rupee instalment IS a negative real step, and says so', () => {
    // Not a trick of presentation: holding the cash figure still is a decision
    // to save less in real terms every year, and computing it this way is the
    // only honest way to put that on a screen.
    const p = contributionPlan(at({ contributionMode: 'fixed' }));
    expect(p.nominalStep).toBeCloseTo(0, 12);
    expect(p.realStep).toBeLessThan(0);
    expect(p.holdsPurchasingPower).toBe(false);

    const yr20 = instalmentInYear(at({ contributionMode: 'fixed' }), 20);
    expect(yr20).toBeCloseTo(base.monthlySip, 6);
    // Two thirds of its value gone, which is the figure the entry now states.
    const buys = yr20 / Math.pow(1 + base.expectedInflation / 100, 19);
    expect(buys / base.monthlySip).toBeLessThan(0.34);
  });

  it('a share of a salary is the same plan in another vocabulary', () => {
    // A share of income keeps pace with prices by itself, so salary mode and
    // real mode must agree exactly when the rupee amounts match. If these ever
    // diverge the page is telling two people different things about one plan.
    const salary = at({
      contributionMode: 'salary', monthlyIncome: 125000, savingsRatePct: 20,
    });
    const real = at({ contributionMode: 'real', monthlySip: 25000 });

    expect(contributionPlan(salary).monthly).toBe(contributionPlan(real).monthly);
    expect(contributionPlan(salary).nominalStep)
      .toBeCloseTo(contributionPlan(real).nominalStep, 12);

    const a = simulate(salary, { numSims: 300 });
    const b = simulate(real, { numSims: 300 });
    expect(a.final.realNet.p50).toBe(b.final.realNet.p50);
  });

  it('a career raise is REAL, on top of holding pace', () => {
    const p = contributionPlan(at({ contributionMode: 'real', realStepUp: 3 }));
    expect(p.nominalStep).toBeCloseTo(1.06 * 1.03 - 1, 12);
    // And it must beat merely holding pace, or the field means nothing.
    const flat = simulate(at({ realStepUp: 0 }), { numSims: 300 });
    const rising = simulate(at({ realStepUp: 3 }), { numSims: 300 });
    expect(rising.final.realNet.p50).toBeGreaterThan(flat.final.realNet.p50);
  });

  it('THE COST OF THE OLD DEFAULT: a flat instalment needs far more to start', () => {
    // The page used to take the contribution flat in cash, and this is what
    // that was worth. If this gap ever closes, dd-017 has been undone.
    const flat = simulate(at({ contributionMode: 'fixed' }), { numSims: 2000 });
    const held = simulate(at({ contributionMode: 'real' }), { numSims: 2000 });
    expect(held.final.realNet.p50).toBeGreaterThan(flat.final.realNet.p50 * 1.4);
  });

  it('both engines now mean the same thing by a step-up', () => {
    // swpWorker has always escalated the withdrawal by (1+i)(1+step); this one
    // stepped by (1+step) alone. One product, one field name, two opposite
    // meanings - the reader could not see it and neither could we.
    const p = contributionPlan(at({ contributionMode: 'real', realStepUp: 5 }));
    const plannerEscalation = (1 + base.expectedInflation / 100) * (1 + 0.05);
    expect(1 + p.nominalStep).toBeCloseTo(plannerEscalation, 12);
  });
});

describe('sol-035 - the rungs read the engine, never a field they hope exists', () => {
  it('every figure rung 1 prints is a finite number', () => {
    // The NaN Rahul found. The rung computed the last instalment from
    // `inputs.annualStepUp`, a field dd-017 removed, and printed the result.
    // TypeScript did not catch it because the rung receives `any` across a
    // CustomEvent boundary - which is the real lesson, and the reason the
    // derivation is now asked of sipAdvice instead of recomputed.
    for (const mode of ['real', 'salary', 'fixed'] as const) {
      const inputs = {
        ...base, contributionMode: mode,
        monthlyIncome: 125000, savingsRatePct: 20,
      };
      const plan = contributionPlan(inputs);
      const last = instalmentInYear(inputs, inputs.horizonYears);
      expect(Number.isFinite(plan.monthly), mode).toBe(true);
      expect(Number.isFinite(plan.nominalStep), mode).toBe(true);
      expect(Number.isFinite(last), mode).toBe(true);
      expect(last).toBeGreaterThan(0);
    }
  });

  it('the derivation survives a zero contribution without producing NaN', () => {
    const empty = { ...base, contributionMode: 'salary' as const, monthlyIncome: 0 };
    expect(contributionPlan(empty).monthly).toBe(0);
    expect(Number.isFinite(instalmentInYear(empty, 20))).toBe(true);
  });
});

describe('rung 3 - tax is deducted, and both frames are shown', () => {
  const curve = growthCurve(base, 10, 16, 2, 200);

  it('reports before AND after tax, whatever view the page is in', () => {
    // Rahul: "no taxes are deducted in rung 3". It was obeying the page's
    // BEFORE TAX / AFTER TAX button, so in the default view it deducted none.
    // dd-006: the gap between the two is the lesson, so it cannot be a mode.
    for (const isPostTax of [true, false]) {
      const c = growthCurve({ ...base, isPostTax }, 12, 12, 1, 200);
      const p = c.points[0];
      expect(p.endRealPreTax).toBeGreaterThan(0);
      expect(p.endRealPostTax).toBeGreaterThan(0);
      expect(p.endRealPostTax).toBeLessThan(p.endRealPreTax);
      expect(p.oddsAfterTax).toBeLessThanOrEqual(p.odds + 1e-9);
    }
  });

  it('the two frames come from the same run, so the tax reconciles', () => {
    for (const p of curve.points) {
      const tax = p.endRealPreTax - p.endRealPostTax;
      expect(tax).toBeGreaterThan(0);
      // Never more than the headline rate of the whole balance - a sanity
      // bound that would catch a double-charge like the planner's old one.
      expect(tax).toBeLessThan(p.endRealPreTax * (base.ltcgTax / 100));
    }
  });

  it('a gentler tax rate leaves more, and the rung sees it', () => {
    const high = growthCurve({ ...base, ltcgTax: 25 }, 12, 12, 1, 200).points[0];
    const low = growthCurve({ ...base, ltcgTax: 5 }, 12, 12, 1, 200).points[0];
    expect(low.endRealPostTax).toBeGreaterThan(high.endRealPostTax);
    expect(low.endRealPreTax).toBe(high.endRealPreTax);
  });
});

describe('sol-036 - the fee and the return series are a pair', () => {
  it('the page opens on the fund that matches its own growth assumption', () => {
    // The growth comes from REGIME_PRESETS, computed from the Nifty 50 itself.
    // Charging an active manager's fee on the index's own return models a fund
    // that takes the active fee and delivers the passive result.
    expect(DEFAULT_FUND_COST.id).toBe('index-direct');
    expect(DEFAULT_FUND_COST.expenseRatio).toBeLessThan(0.5);
  });

  it('the dearer plans remain reachable, and say what they assume', () => {
    // dd-001: the complexity moved, it did not disappear.
    expect(FUND_COST_PLANS.map((p) => p.id))
      .toContain('active-regular');
    expect(ACTIVE_FUND_CAVEAT).toMatch(/index/i);
  });
});

describe('sol-037 second instance - rung 3\'s ledger always counts the tax', () => {
  it('lands twice, and both landings close, in both moneys', () => {
    // The defect Rahul pointed at: this rung printed "not counted yet" for tax
    // whenever the page's BEFORE TAX button sat in its shipped position. A
    // ledger with a conditional line is not a ledger.
    for (const isPostTax of [true, false]) {
      const inputs = { ...base, isPostTax };
      const f = outlookFrom(simulate(inputs, { numSims: 2000 }), inputs).flow;

      // put in + market added − the fund's cut = before tax
      const pre = f.investedReal + f.growthReal - f.feeReal;
      expect(Math.abs(pre - f.preTaxEndReal), `real, isPostTax=${isPostTax}`)
        .toBeLessThan(2);

      // before tax − tax = what you keep
      expect(Math.abs(f.preTaxEndReal - f.taxAlwaysReal - f.afterTaxEndReal))
        .toBeLessThan(2);

      // and the tax is never zero merely because a button is unpressed
      expect(f.taxAlwaysReal).toBeGreaterThan(0);
      expect(f.taxAlwaysNominal).toBeGreaterThan(0);
      expect(f.afterTaxEndReal).toBeLessThan(f.preTaxEndReal);
    }
  });

  it('contains whichever figure the Answer is quoting, in either view', () => {
    // Both landings are on screen, so this rung cannot contradict the headline
    // above it whichever tax view the page is in (dd-013).
    const gross = { ...base, isPostTax: false };
    const net = { ...base, isPostTax: true };
    const a = outlookFrom(simulate(gross, { numSims: 1500 }), gross);
    const b = outlookFrom(simulate(net, { numSims: 1500 }), net);

    expect(a.endReal.p50).toBe(a.flow.preTaxEndReal);
    expect(b.endReal.p50).toBe(b.flow.afterTaxEndReal);
    // The ledger's own two lines are identical in both views.
    expect(a.flow.preTaxEndReal).toBe(b.flow.preTaxEndReal);
    expect(a.flow.afterTaxEndReal).toBe(b.flow.afterTaxEndReal);
  });
});

describe('sol-038 - one derivation, not a copy per rung', () => {
  it('rung 2 and rung 4 report the SAME real rate', () => {
    // The defect Rahul caught: `real = (1+g)/(1+i) - 1` existed twice, once in
    // RungSipRates and once in growthCurve. The fee was added to one copy and
    // not the other, so the page printed 6.7% and 6.9% for one quantity.
    // Both rungs read realRateChain() now, so they cannot drift again.
    const chain = realRateChain(base);
    const curve = growthCurve(base, base.expectedReturn, base.expectedReturn, 1, 40);
    const anchor = curve.points.find((p) => p.growth === base.expectedReturn)!;

    expect(anchor.real).toBeCloseTo(chain.real, 12);
    expect(anchor.afterFee).toBeCloseTo(chain.afterFee, 12);
  });

  it('the chain deducts the fee, and reduces to the old ratio without one', () => {
    const withFee = realRateChain({ ...base, expenseRatio: 1.75 });
    const free = realRateChain({ ...base, expenseRatio: 0 });
    expect(withFee.real).toBeLessThan(free.real);
    expect(free.afterFee).toBeCloseTo(free.growth, 12);
    expect(free.real).toBeCloseTo(
      ((1 + free.growth / 100) / (1 + base.expectedInflation / 100) - 1) * 100, 12
    );
  });

  it('a new cost added to the chain reaches every surface at once', () => {
    // The point of the refactor. Raising the fee must move the rate every rung
    // shows, through one edit rather than one edit per rung.
    const cheap = realRateChain({ ...base, expenseRatio: 0.2 });
    const dear = realRateChain({ ...base, expenseRatio: 1.75 });
    const cheapCurve = growthCurve({ ...base, expenseRatio: 0.2 }, 12, 12, 1, 40).points[0];
    const dearCurve = growthCurve({ ...base, expenseRatio: 1.75 }, 12, 12, 1, 40).points[0];

    expect(dear.real).toBeLessThan(cheap.real);
    expect(dearCurve.real).toBeLessThan(cheapCurve.real);
    // and the two surfaces move by the same amount, because it is one formula
    expect(cheap.real - dear.real)
      .toBeCloseTo(cheapCurve.real - dearCurve.real, 10);
  });

  it('the sweep agrees with the full run at the reader\'s own growth', () => {
    // The second silo: rung 4's sweep drew 300 paths per point while the Answer
    // drew 10,000, so the same plan read Rs 90.0 lakh on one and Rs 89.1 lakh on
    // the other. The anchor point is the full run's own figures now.
    const full = simulate(base, { numSims: 2000 });
    const curve = growthCurve(base, 10, 16, 2, 120, full);
    const anchorPoint = curve.points.find((p) => p.growth === base.expectedReturn);

    expect(anchorPoint, 'the reader\'s growth must be on the grid').toBeDefined();
    expect(anchorPoint!.endRealPreTax).toBe(full.final.grossRealFinal);
    expect(anchorPoint!.endRealPostTax).toBe(full.final.afterTaxRealP50);
    expect(anchorPoint!.odds).toBe(full.final.reachedTarget);
  });
});
