# Design checks — SwpWorking

**Written before the component.**

**Question:** *How will my money actually grow, deplete, and be taxed over my entire lifetime?*

The comprehensive analytical and visual working for the reimagined SWP calculator.
Contains:
1. Lifetime Cashflow Summary (Corpus vs Total Net Payout, Lifetime multiplier, taxes, duration).
2. The 10,000-Path Lifecycle Chart (Likelihood bands & Sample Paths) and Cashflow Micro-chart.
3. Year-by-Year Schedule & Ledger with the "Show in Today's Rupees" (Inflation Deflator) toggle.
4. Black-Scholes Downside Hedging Analysis & Ledger.
5. Volatility Sensitivity Matrix & Diagnostics.
6. PDF Report Export.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Retains full Monte Carlo percentiles, sample paths, inflation deflator, hedging ledger, and diagnostics. |
| dd-001/dont-2 | PASS | Delivers the entire complex reality of retirement cashflow rather than a stripped-down summary. |
| dd-002/dont-1 | PASS | Uses clean tabbed navigation (Plan Summary vs Yearly Schedule) to prevent vertical bloat while maintaining instant accessibility. |
| dd-002/dont-2 | PASS | Clear separation between visual trajectory and detailed tabular ledgers. |
| dd-003/dont-1 | PASS | Delivers rich contextual takeaways, survival duration, and inflation-deflated purchasing power insights alongside raw numbers. |
| dd-003/dont-2 | PASS | Accurately reflects sequence-of-returns risk and market crash vulnerability. |
| dd-004/dont-1 | PASS | Features the prominent "Show in Today's Rupees" deflator toggle with live explanatory framing banner (`#scheduleMoneyFrame`). |
| dd-004/dont-2 | PASS | Plain English explanation: "At today's prices — what the money would buy if you spent it now" vs "Rupees of its own year". |
| dd-005/dont-1 | PASS | Combines cashflow metrics, visual curves, and schedule into a cohesive, structured narrative. |
| dd-006/dont-1 | PASS | Tab switching toggles views cleanly without page reload or layout shift. |
| dd-006/dont-2 | PASS | Chart view switch allows comparing percentile bands (10th/50th/90th) against individual random sample paths. |
| dd-007/dont-1 | PASS | Strict adherence to typography guidelines with tabular numbers for financial columns. |
| dd-007/dont-2 | PASS | Logical visual hierarchy: High-level payout multiplier -> Lifecycle chart -> Detailed yearly ledger. |
| dd-008/dont-1 | PASS | Explanatory banner updates dynamically when the deflator toggle changes. |
| dd-008/dont-2 | PASS | Communicates real cashflow trajectory over time. |
| dd-009/dont-1 | PASS | All figures in the schedule and ledgers explicitly match simulation outputs. |
| dd-009/dont-2 | PASS | Full mathematical transparency with breakdown of gross withdrawal, LTCG tax, net cash, and end-of-year corpus. |
| dd-010/dont-1 | PASS | Highlights total lifetime net payout to the retiree and survival duration before terminal balance. |
| dd-012/dont-1 | PASS | Averages are calculated across all 10,000 empirical paths. |
| dd-012/dont-2 | PASS | Shows distribution percentiles (p10, p50, p90) rather than misleading single-point averages. |
| dd-012/dont-3 | PASS | Clear column headers and tooltips explain each ledger component. |
| dd-013/dont-1 | PASS | Listens to the single broadcast event (`swp:result`) from the central simulation worker. |
| dd-013/dont-2 | PASS | All lifetime totals match between summary cards and schedule summaries. |
| dd-017/dont-1 | PASS | Explicit yearly rows reflect annual inflation escalation and step-up adjustments. |
| dd-017/dont-2 | PASS | Columns state both monthly and annual net withdrawal figures in rupees. |
| dd-017/dont-3 | PASS | Inflation deflator toggle gives the reader direct control over the time-value frame. |
| dd-017/dont-4 | PASS | Highlights the exact year growth falls below withdrawals if principal starts depleting. |
| dd-017/dont-5 | PASS | Starting corpus and total lifetime payout are presented side-by-side with lifetime multiplier. |
| dd-019/dont-1 | PASS | Number formatting maintains currency symbols and units in consistent cells. |
| dd-019/dont-2 | PASS | Headers explicitly state units (Net Monthly, Net Annual, Taxes, Balance). |
| dd-019/dont-3 | PASS | Active currency frame displayed clearly above the table. |
| dd-019/dont-4 | PASS | Clear distinction between nominal rupees and deflated real purchasing power. |
| dd-020/dont-1 | PASS | Full 30-40 year ledgers viewable in a scrollable, responsive container. |
| dd-020/dont-2 | PASS | Every column in the ledger provides distinct financial information. |
| dd-020/dont-3 | PASS | Complete unmodified ledger rows from engine output. |
| dd-021/dont-1 | PASS | Charts faithfully show the 10th percentile worst-case path where funds deplete early. |
| dd-021/dont-2 | PASS | Ledgers show taxes, option drag fees, and floor absorption accurately. |
| dd-021/dont-3 | PASS | Highlights depletion years with clear warning badges. |
| dd-022/dont-1 | PASS | Organized in tabs so users can switch between high-level visual summary and granular ledger. |
| dd-022/dont-2 | PASS | Primary summary view selected by default. |
| dd-022/dont-3 | PASS | Deep diagnostics and hedging ledgers available on demand. |
| dd-022/dont-4 | PASS | Logical action bar with view toggle and PDF download. |
| dd-023/dont-1 | PASS | Fully responsive tables with horizontal scroll and sticky header/first column styling. |
| dd-023/dont-2 | PASS | Tab controls and chart toggles have >=36px tap height on mobile. |
| dd-023/dont-3 | PASS | Responsive chart container resizing automatically on viewport changes. |
| dd-024/dont-1 | PASS | Polished editorial aesthetic with CardPremium, subtle glass backgrounds, and clean borders. |
| dd-024/dont-2 | PASS | Meaningful empty/waiting states while simulation is executing. |
| dd-024/dont-3 | PASS | Updates smoothly in real time as inputs change. |

## Deliberate choices

- Multi-tab organization: "Plan Summary & Projections" and "Yearly Schedule & Cashflow".
- Lifetime cashflow multiplier badge (e.g. `2.3x Lifetime Payout`).
- Full Chart.js canvas with 10,000-path Monte Carlo percentile curves and theme switching support.
- Inflation deflator toggle with live explanatory framing text.
- Full Black-Scholes put floor option hedging ledger and drag calculations.
- Lazy-loaded PDF report generation using `html2pdf.js`.
