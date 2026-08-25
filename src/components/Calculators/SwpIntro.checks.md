# Design checks — SwpIntro

**Written before the component.**

**Question:** *What is this, and why is the first question worth answering?*

The page's welcome and entry point for the reimagined SWP (Retirement Cashflow Planner).
dd-024 / dd-022: meet the reader, say clearly what the planner will do (the three core promises),
and hand them the first single question (their retirement savings corpus) to start.
Once the user begins, this welcome gracefully collapses and reveals the responsive workbench.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | No capabilities removed. The Monte Carlo simulation, hedging, schedule, and cashflow charts remain fully accessible in the interactive workbench. |
| dd-001/dont-2 | PASS | The single entry question is the way in, not the entirety of the tool. |
| dd-002/dont-1 | PASS | Exactly one single step at rest: introducing the purpose and asking the initial savings amount. |
| dd-002/dont-2 | PASS | Only one primary control on screen at rest. |
| dd-003/dont-1 | PASS | The welcome offers clear conceptual takeaways and 3 core promises, not bare unanchored numbers. |
| dd-003/dont-2 | RISK | Risk of boasting mitigated by stating exactly what the reader will receive (survival probability across 10,000 futures, real purchasing power, and downside protection). |
| dd-004/dont-1 | N/A | No conflicting number systems presented at rest. |
| dd-004/dont-2 | N/A | No nominal/real ambiguity in the introductory copy. |
| dd-005/dont-1 | PASS | Introduces 3 clean promises rather than an overwhelming list of anxieties. |
| dd-006/dont-1 | PASS | The intro collapses once upon first interaction, revealing the workbench cleanly. |
| dd-006/dont-2 | N/A | No partial comparison at rest. |
| dd-007/dont-1 | PASS | Clear typographic scale: headline, standfirst, 3 cards, and entry question. |
| dd-007/dont-2 | PASS | Hierarchy matches the genuine logic of the tool. |
| dd-008/dont-1 | N/A | Sentences are static and clear; interaction activates the workbench. |
| dd-008/dont-2 | PASS | Explains the value proposition rather than describing UI position. |
| dd-009/dont-1 | N/A | No numbers presented yet that could diverge from assumptions. |
| dd-009/dont-2 | PASS | Provides essential context and orientation rather than deleting explanation. |
| dd-010/dont-1 | PASS | Headlines the user's primary life question rather than a terminal ledger balance. |
| dd-012/dont-1 | N/A | No averages computed in the intro component. |
| dd-012/dont-2 | N/A | No difference of averages used as headline. |
| dd-012/dont-3 | PASS | Clarifies what the calculator does so the user is never disoriented. |
| dd-013/dont-1 | PASS | Uses the shared inputs schema and dispatches to the single compute engine. |
| dd-013/dont-2 | PASS | Displays no conflicting quantities. |
| dd-017/dont-1 | N/A | Multi-year simulation parameters handled in the active workbench. |
| dd-017/dont-2 | PASS | Asks for initial savings in standard Indian currency amounts. |
| dd-017/dont-3 | PASS | Direct entry question without complicated upfront modes. |
| dd-017/dont-4 | N/A | Step-up explained in the active form. |
| dd-017/dont-5 | N/A | Goal framing handled consistently in the workbench. |
| dd-019/dont-1 | N/A | No fragmented stat blocks. |
| dd-019/dont-2 | N/A | No ambiguous frames. |
| dd-019/dont-3 | N/A | Clear introductory text. |
| dd-019/dont-4 | N/A | No misleading equivalence claims. |
| dd-020/dont-1 | PASS | All levers and advanced options remain accessible in the workbench. |
| dd-020/dont-2 | PASS | The opening question directly seeds the simulation engine. |
| dd-020/dont-3 | PASS | No filters that distort computed results. |
| dd-021/dont-1 | PASS | Objective analysis based on 10,000 empirical Monte Carlo paths. |
| dd-021/dont-2 | PASS | Every parameter in the planner genuinely affects survival and cash flow. |
| dd-021/dont-3 | PASS | Clear survival verdict delivered once calculated. |
| dd-022/dont-1 | PASS | Starts with one question at rest; no intimidating wall of empty fields. |
| dd-022/dont-2 | PASS | Single starting input with sensible milestone pills. |
| dd-022/dont-3 | PASS | User progresses naturally from initial corpus to deeper levers. |
| dd-022/dont-4 | N/A | Progressive disclosure expands downward. |
| dd-023/dont-1 | PASS | Designed 375px mobile-first with clean vertical hierarchy. |
| dd-023/dont-2 | PASS | All touch targets at least 44px, no hidden hover dependencies. |
| dd-023/dont-3 | PASS | Stacks gracefully on mobile, bento layout on desktop. |
| dd-024/dont-1 | PASS | Generous, thoughtful welcome rather than an empty, sterile page. |
| dd-024/dont-2 | PASS | Explicitly explains the 3 core benefits before asking for data. |
| dd-024/dont-3 | PASS | Smoothly transitions from welcome state to interactive workbench upon input. |

## Deliberate choices

- Three distinct promises: 10,000-future survival probability, real purchasing power in today's rupees, and early bear-market downside protection.
- Quick starting milestone chips (₹75 L, ₹1.5 Cr, ₹3 Cr, ₹5 Cr) to provide 1-tap engagement for mobile users.
- Automatic collapse into the live workbench upon user interaction or value selection.
