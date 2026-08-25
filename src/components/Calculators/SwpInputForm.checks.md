# Design checks — SwpInputForm

**Written before the component.**

**Question:** *What inputs do you need from me, and what assumptions can I tweak?*

The progressive input form for the reimagined SWP calculator.
Presents the 3 core inputs immediately (Corpus, Monthly Paycheck, Horizon Years),
with cleanly organized progressive disclosure expanders for Inflation & Step-up,
Market Regimes (historical periods + custom CAGR/volatility), LTCG Tax, and Downside Put Floor Protection.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Retains all financial parameters including market regime presets, volatility drag, tax drag, and Black-Scholes hedging parameters. |
| dd-001/dont-2 | PASS | Core 3 inputs are the immediate surface; all advanced parameters are available right below in dedicated collapsible sections. |
| dd-002/dont-1 | PASS | Progressive layering organizes secondary parameters into logical clusters (Growth & Inflation, Taxes, Downside Protection). |
| dd-002/dont-2 | PASS | The reader encounters the 3 primary inputs first, then explores assumptions at their own pace. |
| dd-003/dont-1 | PASS | Form fields feature real-time formatting labels (e.g. ₹1.5 Crore, ₹40,000 / month) for immediate clarity. |
| dd-003/dont-2 | PASS | Clean input inputs focused on user-specified life parameters. |
| dd-004/dont-1 | PASS | Clearly labels monthly withdrawals as "Monthly Paycheck (Today's Value)" to prevent confusion. |
| dd-004/dont-2 | PASS | Clarifies that the monthly withdrawal automatically escalates with inflation to preserve standard of living. |
| dd-005/dont-1 | PASS | Provides curated historical market regime buttons (10-yr, 20-yr, 30-yr actual Nifty 50 records) rather than leaving the user to guess statistical parameters. |
| dd-006/dont-1 | PASS | Field updates trigger debounced recomputations smoothly without layout jumping. |
| dd-006/dont-2 | PASS | Regime buttons visibly highlight current selection and update return & volatility fields in tandem. |
| dd-007/dont-1 | PASS | Standardized form styling matching the design system with consistent label and input hierarchies. |
| dd-007/dont-2 | PASS | Visual structure cleanly differentiates primary inputs from optional advanced assumptions. |
| dd-008/dont-1 | PASS | Fixed badge placements for live Indian rupee number formatting. |
| dd-008/dont-2 | PASS | Intuitive labels and concise helper text. |
| dd-009/dont-1 | PASS | Sensible defaults (12% return, 15% volatility, 6% inflation, 12.5% tax) based on standard Indian market parameters. |
| dd-009/dont-2 | PASS | Explains why each assumption matters (e.g. how volatility drag impacts retirement longevity). |
| dd-010/dont-1 | PASS | Inputs serve to compute plan viability rather than arbitrary bookkeeping figures. |
| dd-012/dont-1 | PASS | Simulation count set to 10,000 runs for high statistical accuracy. |
| dd-012/dont-2 | PASS | Input form does not display verdict lines. |
| dd-012/dont-3 | PASS | Cleanly segmented sections prevent cognitive overload. |
| dd-013/dont-1 | PASS | Reads and updates the canonical input store (`readPlannerInputs` / `syncAdvancedFromEntry`). |
| dd-013/dont-2 | PASS | Input fields use standard single-source IDs synced across views. |
| dd-017/dont-1 | PASS | Horizon is explicitly entered in years with real annual escalation logic. |
| dd-017/dont-2 | PASS | Monthly withdrawals entered in monthly rupee amounts. |
| dd-017/dont-3 | PASS | Clear explanation that inflation escalation keeps purchasing power constant. |
| dd-017/dont-4 | PASS | Step-up defaults to 0% (which matches inflation-indexed growth), with step-up adding further lifestyle upgrades. |
| dd-017/dont-5 | PASS | Distinguishes current starting capital from future withdrawals. |
| dd-019/dont-1 | PASS | Input badges format amounts directly beneath each field. |
| dd-019/dont-2 | PASS | Each field has a distinct, explicit label and currency prefix. |
| dd-019/dont-3 | PASS | Clear visual borders and focus states. |
| dd-019/dont-4 | PASS | No ambiguous comparison terminology. |
| dd-020/dont-1 | PASS | Advanced settings are accessible with one click on the accordion headers. |
| dd-020/dont-2 | PASS | Every input parameter is an active variable in the Monte Carlo engine. |
| dd-020/dont-3 | PASS | Form inputs feed directly into the simulation without artificial clipping. |
| dd-021/dont-1 | PASS | Unbiased input controls allowing testing of both conservative and aggressive retirement scenarios. |
| dd-021/dont-2 | PASS | All fields contribute to the survival simulation and cash flow calculations. |
| dd-021/dont-3 | PASS | Provides input controls, leaving verdict presentation to the answer and dashboard components. |
| dd-022/dont-1 | PASS | Compact primary group with progressive disclosure for deep settings. |
| dd-022/dont-2 | PASS | Core 3 inputs visible by default; advanced tabs collapsed until requested. |
| dd-022/dont-3 | PASS | Users can customize parameters incrementally. |
| dd-022/dont-4 | PASS | Clear layout with action controls placed logically. |
| dd-023/dont-1 | PASS | 100% mobile-friendly with full-width inputs, appropriate touch padding, and numeric input modes. |
| dd-023/dont-2 | PASS | All inputs, toggles, and regime buttons are directly tappable on mobile screens. |
| dd-023/dont-3 | PASS | Responsive single-column layout on mobile, sticky left column on desktop screens. |
| dd-024/dont-1 | PASS | Beautifully styled input cards with subtle borders and clear typography. |
| dd-024/dont-2 | PASS | Meaningful placeholders and formatted rupee helper labels. |
| dd-024/dont-3 | PASS | Reorganizes smoothly as the user interacts with inputs and expands sections. |

## Deliberate choices

- Three core inputs at top: Initial Corpus, Monthly Withdrawal, and Horizon Years.
- Indian numbering system formatting on input (`₹1,50,00,000` -> `₹ 1.50 Crore`).
- Real Indian market regime presets (2014–2024 Moderate, 2004–2024 Long Bull, 1994–2024 Full 30-Year History).
- Collapsible accordions for Inflation & Step-up, Market Returns, Taxes, and Downside Protection.
