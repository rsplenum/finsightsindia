# Design checks — SwpAnswer

**Written before the component.**

**Question:** *Will my money survive my retirement, and what should I do if it won't?*

The headline answer and actionable remedies banner for the SWP planner.
Displays the Monte Carlo survival probability across 10,000 simulations, the expected duration,
and when risk is detected, 3 precise, clickable remedies from `swpAdvice.ts` to make the plan secure.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Preserves full advice algorithms and Monte Carlo fidelity without loss of depth. |
| dd-001/dont-2 | PASS | The answer synthesizes the full 10,000-path simulation, not a shallow simplified average. |
| dd-002/dont-1 | PASS | Delivers the core verdict directly, with progressive expanders for detailed breakdowns. |
| dd-002/dont-2 | PASS | Clear focal point: survival rate badge, explanatory sentence, and 3 remedy levers if at risk. |
| dd-003/dont-1 | PASS | The answer gives qualitative safety classification and actionable guidance, not just a bare percentage. |
| dd-003/dont-2 | PASS | Communicates realistic probabilities grounded in empirical market sequences. |
| dd-004/dont-1 | PASS | Reconciles today's purchasing power with future rupee withdrawals clearly in the verdict explanation. |
| dd-004/dont-2 | PASS | Uses plain language ("in today's purchasing power") rather than confusing financial jargon. |
| dd-005/dont-1 | PASS | Reduces risk to 3 concrete actionable levers (add corpus, adjust monthly spend, modify step-up). |
| dd-006/dont-1 | PASS | State changes update the active badges and values smoothly. |
| dd-006/dont-2 | PASS | Explicitly shows both the current scenario and what the remedies would accomplish. |
| dd-007/dont-1 | PASS | Typographic scale clearly separates headline survival status from supporting detail. |
| dd-007/dont-2 | PASS | Visual hierarchy mirrors importance: safety status first, remedies second, assumptions third. |
| dd-008/dont-1 | PASS | Fixed structured slots for numbers rather than unpredictable paragraph rewrites. |
| dd-008/dont-2 | PASS | Directly states the plan outcome rather than describing UI state. |
| dd-009/dont-1 | PASS | Clearly documents baseline assumptions (12% CAGR, 6% inflation, 12.5% LTCG) right below the verdict. |
| dd-009/dont-2 | PASS | Provides complete contextual explanation for the survival outcome. |
| dd-010/dont-1 | PASS | Headlines whether the plan survives the full horizon rather than an arbitrary terminal rupee balance. |
| dd-012/dont-1 | PASS | Probabilities are calculated strictly over the full 10,000 simulated paths for the user's horizon. |
| dd-012/dont-2 | PASS | Verdict line is the survival rate percentage, not a difference of disparate averages. |
| dd-012/dont-3 | PASS | Clear color-coded badges and plain English descriptions eliminate ambiguity. |
| dd-013/dont-1 | PASS | Uses the exact same worker output and `swpAdvice` compute pipeline as all other page components. |
| dd-013/dont-2 | PASS | All figures are broadcast from the single source of truth (`swp:result` event). |
| dd-017/dont-1 | PASS | Accounts for full annual compounding, inflation escalation, and step-up across all years. |
| dd-017/dont-2 | PASS | States monthly income in the units the user budgets in (monthly cash). |
| dd-017/dont-3 | PASS | Transparently applies annual inflation adjustment without hidden mode switches. |
| dd-017/dont-4 | PASS | Default step-up maintains constant real purchasing power with inflation. |
| dd-017/dont-5 | PASS | Distinguishes starting corpus from total lifetime payout clearly. |
| dd-019/dont-1 | PASS | Metric badges combine number, label, and frame cleanly without fragmenting across distant elements. |
| dd-019/dont-2 | PASS | Frames are clearly attributed to their specific metrics. |
| dd-019/dont-3 | PASS | Explicit labelling for time horizons and real values. |
| dd-019/dont-4 | PASS | No deceptive equivalence statements. |
| dd-020/dont-1 | PASS | All remedy levers are shown simultaneously when a plan is under-funded. |
| dd-020/dont-2 | PASS | Every remedy directly moves the plan across the 95% survival threshold. |
| dd-020/dont-3 | PASS | Advice calculations are deterministic and mathematically rigorous. |
| dd-021/dont-1 | PASS | Objectively identifies failure scenarios without sugarcoating market risks. |
| dd-021/dont-2 | PASS | Every input directly drives the Monte Carlo simulation result. |
| dd-021/dont-3 | PASS | Explicitly declares whether the plan is secure, moderate risk, or high risk. |
| dd-022/dont-1 | PASS | Remedy panel only displays when the plan is actually at risk (<95% survival). |
| dd-022/dont-2 | PASS | 3 discrete remedies with clear single-action buttons. |
| dd-022/dont-3 | PASS | User can apply any remedy with 1 tap to dynamically re-test their plan. |
| dd-022/dont-4 | PASS | Remedy cards sit immediately below the verdict. |
| dd-023/dont-1 | PASS | Optimized for mobile screens with high-contrast pill badges and responsive cards. |
| dd-023/dont-2 | PASS | Tap-friendly remedy cards with 44px min target size and visible feedback. |
| dd-023/dont-3 | PASS | Clean stacked layout on mobile, 3-column remedy grid on desktop. |
| dd-024/dont-1 | PASS | Rich card with clear visual weight and reassuring styling. |
| dd-024/dont-2 | PASS | Appears dynamically once the user enters their starting data. |
| dd-024/dont-3 | PASS | Adapts its state dynamically based on simulation outcome. |

## Deliberate choices

- Three-tier survival status indicator (Highly Secure >=90%, Moderate Risk 70-89%, High Risk <70%).
- Real-time remedies from `swpAdvice.ts` allowing 1-click optimization of savings corpus, monthly withdrawal, or step-up.
- Quick link to modify underlying return and inflation assumptions directly from the answer card.
