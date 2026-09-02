# Design checks — SipIntro

**Written before the component.**

**Question:** *Will my savings get me to where I want to be, and what is this tool doing for me?*

The page's welcome and entry point for the reimagined SIP Wealth & Savings Planner (dd-024 / dd-022 / dd-023).
Meets the reader with an elegant antigravity-style aesthetic, states the 3 core promises (10,000 market paths, real purchasing power, actionable 1-tap remedies), and asks the single starting question (monthly savings amount or goal milestone).
Once the user starts, this welcome smoothly collapses and reveals the responsive SIP workbench.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | No capabilities removed. The Monte Carlo simulation, multi-asset allocation, fund fees, hedging, and trajectory charts remain fully accessible in the interactive workbench. |
| dd-001/dont-2 | PASS | The single entry question is the starting point, not the entirety of the tool. |
| dd-002/dont-1 | PASS | Exactly one single step at rest: introducing the purpose and asking the initial monthly savings amount. |
| dd-002/dont-2 | PASS | Only one primary control on screen at rest. |
| dd-003/dont-1 | PASS | The welcome offers clear conceptual takeaways and 3 core promises, not bare unanchored numbers. |
| dd-003/dont-2 | PASS | States exactly what the reader will receive: stress-testing across 10,000 empirical market paths, real purchasing power, and actionable remedies. |
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
| dd-017/dont-2 | PASS | Asks for monthly savings in standard Indian currency amounts. |
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
| dd-021/dont-2 | PASS | Every parameter in the planner genuinely affects terminal wealth and probability of success. |
| dd-021/dont-3 | PASS | Clear verdict delivered once calculated. |
| dd-022/dont-1 | PASS | Starts with one question at rest; no intimidating wall of empty fields. |
| dd-022/dont-2 | PASS | Single starting input with sensible milestone pills. |
| dd-022/dont-3 | PASS | User progresses naturally from initial contribution to deeper levers. |
| dd-022/dont-4 | N/A | Progressive disclosure expands downward. |
| dd-023/dont-1 | PASS | Designed 375px mobile-first with clean vertical hierarchy. |
| dd-023/dont-2 | PASS | All controls thumb-friendly (min 44px) with no hover dependencies. |
| dd-023/dont-3 | PASS | Single column layout reads naturally on mobile. |
| dd-024/dont-1 | PASS | The intro meets the reader with rich context and aesthetic elegance before asking anything. |
| dd-024/dont-2 | PASS | Explains exactly what the tool does and why it is superior to deterministic calculators. |
| dd-024/dont-3 | PASS | Dynamic transition: welcome collapses upon start, smoothly handing off to the workbench. |


## Deliberate choices

- The single entry point focuses on the reader's monthly commitment, the primary question they arrive with.
- The 3 core promises explain empirical distribution, real purchasing power, and step-up levers immediately.
- Milestone chips (₹10k, ₹25k, ₹50k, ₹1 Lakh) offer rapid 1-tap entry without typing.
