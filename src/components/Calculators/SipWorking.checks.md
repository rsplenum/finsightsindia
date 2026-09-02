# Design checks — SipWorking

**Written before the component.**

**Question:** *How will my savings actually accumulate, compound, and be protected over my investment horizon across 10,000 market paths?*

The comprehensive analytical and visual working for the reimagined SIP calculator (dd-022 / dd-023 / dd-024).
Contains:
1. Terminal Real Wealth & Key Stats (Total Invested, Real Wealth, Nominal Equivalent, Odds, Sacrifice vs Created Wealth).
2. The 10,000-Path Monte Carlo Trajectory Chart (Likelihood bands P90/P50/P10 and Target Line) with responsive ResizeObserver.
3. Milestones Timeline (Years when crossing key wealth thresholds in today's money).
4. Multi-Tab Diagnostics:
   - Tab 1: Trajectory Cone & Milestone Projection
   - Tab 2: Wealth Compounding & Real Purchasing Power Breakdown
   - Tab 3: Downside Protection & Rolling Put Ledger
   - Tab 4: Asset Allocation & Fee Drag Analysis
5. PDF Report & CSV Export.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Retains full Monte Carlo percentiles, multi-tab diagnostics, hedging ledger, and export capabilities. |
| dd-001/dont-2 | PASS | Delivers the complete reality of savings accumulation rather than a single deterministic curve. |
| dd-002/dont-1 | PASS | Uses clean tabbed navigation (Trajectory, Purchasing Power, Hedging, Allocation) to prevent vertical bloat while maintaining instant accessibility. |
| dd-002/dont-2 | PASS | Clear separation between visual trajectory and detailed diagnostic ledgers. |
| dd-003/dont-1 | PASS | Delivers rich contextual takeaways, reach year, odds out of 100, and inflation-deflated purchasing power insights. |
| dd-003/dont-2 | PASS | Accurately reflects sequence-of-returns volatility and market drawdown vulnerability. |
| dd-004/dont-1 | PASS | Features the prominent After-Tax toggle with live explanatory framing banner (`#taxToggleBtn`). |
| dd-004/dont-2 | PASS | Plain English explanation: "in today's money" vs nominal future numbers. |
| dd-005/dont-1 | PASS | Combines trajectory metrics, visual curves, and milestones into a cohesive, structured narrative. |
| dd-006/dont-1 | PASS | Tab switching toggles views cleanly without page reload or layout shift. |
| dd-006/dont-2 | PASS | Percentile curves (10th/50th/90th) shown alongside target milestone lines. |
| dd-007/dont-1 | PASS | Strict adherence to typography guidelines with tabular numbers for financial figures. |
| dd-007/dont-2 | PASS | Logical visual hierarchy: High-level outcome multipliers -> Trajectory chart -> Detailed diagnostic panels. |
| dd-008/dont-1 | PASS | Explanatory banner updates dynamically when the tax toggle changes. |
| dd-008/dont-2 | PASS | Communicates real accumulation trajectory over time. |
| dd-009/dont-1 | PASS | All figures in the schedule and ledgers explicitly match simulation outputs. |
| dd-009/dont-2 | PASS | Full mathematical transparency with breakdown of contributions, inflation drag, tax, and end-of-horizon wealth. |
| dd-010/dont-1 | PASS | Highlights reach year and real purchasing power alongside terminal balance. |
| dd-012/dont-1 | PASS | Averages and percentiles are calculated across all 10,000 empirical paths. |
| dd-012/dont-2 | PASS | Shows distribution percentiles (p10, p50, p90) rather than misleading single-point averages. |
| dd-012/dont-3 | PASS | Clear column headers and tooltips explain each ledger component. |
| dd-013/dont-1 | PASS | Listens to the single broadcast event (`sip:result`, `sip:curve`, `sip:protection`) from the central simulation worker. |
| dd-013/dont-2 | PASS | All lifetime totals match between summary cards and diagnostic summaries. |
| dd-017/dont-1 | PASS | Explicit yearly milestones reflect annual inflation escalation and step-up adjustments. |
| dd-017/dont-2 | PASS | Stated in standard rupee units (crores/lakhs). |
| dd-017/dont-3 | PASS | Real purchasing power framing gives the reader direct understanding of time-value. |
| dd-017/dont-4 | PASS | Step-up increases real purchasing power over time. |
| dd-017/dont-5 | PASS | Starting capital and future contributions are clearly separated. |
| dd-019/dont-1 | PASS | Number formatting maintains currency symbols and units in consistent cells. |
| dd-019/dont-2 | PASS | Headers explicitly state units and money frames. |
| dd-019/dont-3 | PASS | Active currency frame displayed clearly. |
| dd-019/dont-4 | PASS | Clear distinction between nominal rupees and deflated real purchasing power. |
| dd-020/dont-1 | PASS | Full diagnostics viewable in responsive containers. |
| dd-020/dont-2 | PASS | Every element provides distinct financial information. |
| dd-020/dont-3 | PASS | Complete unmodified outputs from engine. |
| dd-021/dont-1 | PASS | Charts faithfully show the 10th percentile worst-case path where plans fall short. |
| dd-021/dont-2 | PASS | Ledgers show taxes, option drag fees, and floor absorption accurately. |
| dd-021/dont-3 | PASS | Highlights shortfall probability honestly with no sugarcoating. |
| dd-022/dont-1 | PASS | Organized in tabs so users can switch between visual summary and granular diagnostics. |
| dd-022/dont-2 | PASS | High-level metrics visible; deep tabs explored on demand. |
| dd-022/dont-3 | PASS | Users can explore diagnostics via intuitive tabs without being overwhelmed by a single monolithic page. |
| dd-022/dont-4 | PASS | Controls positioned within intuitive reach. |
| dd-023/dont-1 | PASS | Fully responsive canvas using ResizeObserver with zero horizontal overflow at 375px. |
| dd-023/dont-2 | PASS | All chart details and diagnostic items accessible via tap targets. |
| dd-023/dont-3 | PASS | Stacks vertically on mobile and adapts to split-column on wide screens. |
| dd-024/dont-1 | PASS | Working panel renders smoothly as simulation broadcasts results. |
| dd-024/dont-2 | PASS | Clear state management between initial compute and subsequent recalculations. |
| dd-024/dont-3 | PASS | Coordinated layout updates across all tabs. |


## Deliberate choices

- Multi-tab architecture (Trajectory, Real Purchasing Power, Hedging Ledger, Asset Allocation) prevents overwhelming vertical scroll while preserving 100% deep diagnostic fidelity.
- 10,000-path Monte Carlo percentile curves plotted with dashed goal line directly on canvas with ResizeObserver protection for flawless mobile responsiveness.
- Live After-Tax toggle immediately updates stats and multi-year trajectory in today's tangible money.
