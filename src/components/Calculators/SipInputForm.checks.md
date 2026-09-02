# Design checks — SipInputForm

**Written before the component.**

**Question:** *What inputs do you need from me, and what levers can I move to adjust my savings trajectory?*

The progressive input form for the reimagined SIP calculator.
Presents the 3 core inputs immediately (Monthly SIP, Horizon Years, Target Wealth in Today's Money),
with cleanly organized progressive disclosure expanders for Seed Capital, Yearly Step-Up / Career Progression,
Contribution Mode (Real purchasing power vs Salary share vs Fixed cash), Market Regimes (historical periods + custom CAGR/volatility),
Fund Costs / TER, Custom Asset Allocation (Equity, Debt, Gold), and Downside Put Floor Protection.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Retains all financial parameters including market regime presets, volatility drag, asset allocation, fund expense ratios, tax drag, and Black-Scholes hedging parameters. |
| dd-001/dont-2 | PASS | Core 3 inputs are the immediate surface; all advanced parameters are available right below in dedicated collapsible sections. |
| dd-002/dont-1 | PASS | Progressive layering organizes secondary parameters into logical clusters (Lump Sum, Step-Up & Mode, Market Regimes, Asset Split, Downside Protection). |
| dd-002/dont-2 | PASS | The reader encounters the 3 primary inputs first, then explores assumptions at their own pace. |
| dd-003/dont-1 | PASS | Form fields feature real-time formatting labels (e.g. ₹25,000 / month, 15 Years, ₹1.00 Crore) for immediate clarity. |
| dd-003/dont-2 | PASS | Clean inputs focused on user-specified life goals and financial parameters. |
| dd-004/dont-1 | PASS | Clearly labels monthly contribution as today's value with inflation protection explained. |
| dd-004/dont-2 | PASS | Clarifies that the monthly contribution automatically escalates with inflation to preserve real purchasing power. |
| dd-005/dont-1 | PASS | Provides curated historical market regime buttons (10-yr, 20-yr, 30-yr actual Nifty 50 records) rather than leaving the user to guess statistical parameters. |
| dd-006/dont-1 | PASS | Field updates trigger debounced recomputations smoothly without layout jumping. |
| dd-006/dont-2 | PASS | Regime buttons visibly highlight current selection and update return & volatility fields in tandem. |
| dd-007/dont-1 | PASS | Standardized form styling matching the design system with consistent label and input hierarchies. |
| dd-007/dont-2 | PASS | Visual structure cleanly differentiates primary inputs from optional advanced assumptions. |
| dd-008/dont-1 | PASS | Fixed badge placements for live Indian rupee number formatting. |
| dd-008/dont-2 | PASS | Intuitive labels and concise helper text. |
| dd-009/dont-1 | PASS | Sensible defaults (12% return, 15% volatility, 6% inflation, 12.5% tax) based on standard Indian market parameters. |
| dd-009/dont-2 | PASS | Explains why each assumption matters (e.g. how volatility drag impacts terminal wealth). |
| dd-010/dont-1 | PASS | Inputs serve to compute plan viability and reach year rather than arbitrary bookkeeping figures. |
| dd-012/dont-1 | PASS | Simulation count set to 10,000 runs for high statistical accuracy. |
| dd-012/dont-2 | PASS | Input form does not display verdict lines. |
| dd-012/dont-3 | PASS | Cleanly segmented sections prevent cognitive overload. |
| dd-013/dont-1 | PASS | Reads and updates the canonical input store (`readSipInputs` / `syncAdvancedFromEntry`). |
| dd-013/dont-2 | PASS | Input fields use standard single-source IDs synced across views. |
| dd-017/dont-1 | PASS | Horizon is explicitly entered in years with real annual escalation logic. |
| dd-017/dont-2 | PASS | Monthly contribution entered in monthly rupee amounts. |
| dd-017/dont-3 | PASS | Clear explanation that inflation escalation keeps purchasing power constant. |
| dd-017/dont-4 | PASS | Step-up defaults to 0% (which matches inflation-indexed growth), with step-up adding further lifestyle/career progression. |
| dd-017/dont-5 | PASS | Distinguishes current starting capital from future monthly contributions. |
| dd-019/dont-1 | PASS | Input badges format amounts directly beneath each field. |
| dd-019/dont-2 | PASS | Each field has a distinct, explicit label and currency prefix. |
| dd-019/dont-3 | PASS | Clear visual borders and focus states. |
| dd-019/dont-4 | PASS | No ambiguous comparison terminology. |
| dd-020/dont-1 | PASS | Advanced settings are accessible with one click on the accordion headers. |
| dd-020/dont-2 | PASS | Every input parameter is an active variable in the Monte Carlo engine. |
| dd-020/dont-3 | PASS | Form inputs feed directly into the simulation without artificial clipping. |
| dd-021/dont-1 | PASS | Unbiased input controls allowing testing of both conservative and aggressive accumulation scenarios. |
| dd-021/dont-2 | PASS | All fields contribute to the accumulation simulation and terminal wealth calculations. |
| dd-021/dont-3 | PASS | Provides input controls, leaving verdict presentation to the answer and dashboard components. |
| dd-022/dont-1 | PASS | Compact primary group with progressive disclosure for deep settings. |
| dd-022/dont-2 | PASS | Core 3 inputs visible by default; advanced tabs collapsed until requested. |
| dd-022/dont-3 | PASS | Users can customize parameters incrementally as the form grows under their hand. |
| dd-022/dont-4 | PASS | Add-control sections expand downward smoothly. |
| dd-023/dont-1 | PASS | 100% mobile-friendly with full-width inputs, appropriate touch padding, and numeric input modes. |
| dd-023/dont-2 | PASS | All controls accessible to touch without hover requirements. |
| dd-023/dont-3 | PASS | Clean single-column layout on mobile devices. |
| dd-024/dont-1 | PASS | Form is revealed after welcome interaction with clear purpose. |
| dd-024/dont-2 | PASS | Initial state shows clear essential fields before expanding into advanced levers. |
| dd-024/dont-3 | PASS | The layout dynamically coordinates with the visual dashboard and answer layers. |


## Deliberate choices

- 4-card fractional grid layout providing clean separation between contribution, wealth goal, horizon, and real step-up raise.
- Collapsible market assumptions preserving zero cognitive load on entry while offering full control over empirical Nifty 50 regimes, asset allocation, and Black-Scholes put floor protection.
- Real rupee interpretation stated clearly up front: all contributions and goals measured in today's tangible money.
