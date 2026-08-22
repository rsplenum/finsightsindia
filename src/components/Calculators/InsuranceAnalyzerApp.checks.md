# Design checks — InsuranceAnalyzerApp

**Written before the component.**

**Question:** *How much of this policy's promised return is actually investment growth?*

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | We preserve the ability to check exact numbers for all shapes. |
| dd-001/dont-2 | PASS | The prefilled entry is just a starting point for exploration. |
| dd-002/dont-1 | PASS | The workbench revealing replaces the welcome, it's not a scroll trap. |
| dd-002/dont-2 | PASS | We ask the user to pick an option or shape first, then show fields. |
| dd-003/dont-1 | PASS | We provide XIRR but also explain the breakdown of what the premium paid for. |
| dd-003/dont-2 | PASS | The tool actually unpacks the cost of insurance vs investment. |
| dd-004/dont-1 | PASS | Real and nominal returns are handled explicitly and clearly in the breakdown. |
| dd-004/dont-2 | PASS | The term "real" is supported by explanations where used. |
| dd-005/dont-1 | N/A | |
| dd-006/dont-1 | N/A | |
| dd-006/dont-2 | N/A | |
| dd-007/dont-1 | PASS | Section titles follow the established hierarchy. |
| dd-007/dont-2 | PASS | We don't artificially nest structures. |
| dd-008/dont-1 | PASS | The answer block stays stable while inputs change. |
| dd-008/dont-2 | PASS | The answer block doesn't narrate the user's progress. |
| dd-009/dont-1 | PASS | All assumptions (like term life cost) are visible. |
| dd-009/dont-2 | PASS | The detailed breakdown is always shown. |
| dd-010/dont-1 | PASS | The headline is the true return (XIRR), not an accountant's sum. |
| dd-012/dont-1 | PASS | We don't average returns; we calculate exact IRR. |
| dd-012/dont-2 | PASS | The verdict is a clear single number with context. |
| dd-012/dont-3 | PASS | The screen aims to be unambiguous about whether the policy is a good deal. |
| dd-013/dont-1 | PASS | Inputs are shared across the calculations. |
| dd-013/dont-2 | PASS | Quantities like premium are shown consistently. |
| dd-017/dont-1 | PASS | Multi-year premiums are handled properly. |
| dd-017/dont-2 | PASS | The fields ask for total years, not dates, which is simpler. |
| dd-017/dont-3 | PASS | We use explicit states for income/maturity shapes. |
| dd-017/dont-4 | N/A | |
| dd-017/dont-5 | N/A | |
| dd-019/dont-1 | PASS | We use unified phrasing for results. |
| dd-019/dont-2 | PASS | We don't reuse the same frame phrase ambiguously. |
| dd-019/dont-3 | PASS | The frame phrasing is distinct for different returns. |
| dd-019/dont-4 | PASS | We don't use "THE SAME MONEY". |
| dd-020/dont-1 | PASS | All policy shapes (income, maturity, both) are available. |
| dd-020/dont-2 | PASS | The shape question actively removes irrelevant fields. |
| dd-020/dont-3 | PASS | The filter only removes inapplicable UI. |
| dd-021/dont-1 | PASS | We calculate the real return without bias; if it's 8%, we show 8%. |
| dd-021/dont-2 | PASS | Every input (premium, payout) changes the final IRR. |
| dd-021/dont-3 | PASS | The tool states the verdict clearly on what the numbers mean. |
| dd-022/dont-1 | PASS | We hide maturity/income fields until the shape requires them. |
| dd-022/dont-2 | PASS | Shape selection dictates exactly what is shown. |
| dd-022/dont-3 | PASS | Form builds based on the policy shape. |
| dd-022/dont-4 | N/A | |
| dd-023/dont-1 | PASS | Layout stacks naturally on mobile. |
| dd-023/dont-2 | PASS | All data is available without hover on mobile. |
| dd-023/dont-3 | PASS | The sidebar/form layout works stacked vertically. |
| dd-024/dont-1 | PASS | The intro provides necessary context and isn't just a bare form. |
| dd-024/dont-2 | PASS | The intro sets up what the tool is doing. |
| dd-024/dont-3 | PASS | The page reorganizes (intro hides, workbench shows) when the user acts. |

## Deliberate choices

- We hide the intro state upon first interaction to dedicate the screen to the form and answers.
