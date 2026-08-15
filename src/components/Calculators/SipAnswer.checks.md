# Design checks — SipAnswer (layer 1 of the SIP ladder)

**Written before the component.** T3's scope, settled 15 Aug: this page inherits
T2 whole. So the checks that governed `RetirementAnswer` govern this, and the
only interesting question is where accumulation genuinely differs from drawdown.

**Question:** *If I put this much away every month, do I get what I am after?*

| entry | check | answer |
|---|---|---|
| dd-001 | is anything removed? | No. Every control the old page had survives, one layer down, in rung 5. Three inputs is the ENTRY, not the extent. |
| dd-002 | one question, ≤2 new concepts? | One: do you get there. The concepts are a goal in today's money and odds out of 100 — and the second is only used once the first is on screen. |
| dd-003 | what do they leave with? | That a savings plan is three things they can move — the amount, the years, and the size of the wish — and that moving any one of them is a real option with a price. |
| dd-004 | does every figure carry its frame? | Yes, and it drove an engine change. The goal is stated in today's money; ending wealth is stated in today's money; the reach year is computed on the same after-tax curve rather than on a before-tax one, so no two numbers on the screen are in different money. |
| dd-006 | is the reader made to diff two states? | No. There is no nominal/real toggle. One frame throughout, and the other money appears as its own labelled row in rung 2. |
| dd-010 | is this the lived quantity or the accountant's? | The reach year is the lived one — the year the goal stops being hypothetical. A terminal balance is the answer to an accountant's question. Both are shown; the reach year leads. |
| dd-012 | judged where it acts? | Yes, and it changed a constant. The planner calls a plan healthy at 85% survival because the failure there is ruin. Missing a savings goal is not ruin, so the bar here is that the TYPICAL path gets there — and the copy always states how often it still falls short, so 50/50 is never dressed up as safety. |

**Deliberate choices**

- **The goal-seek is a lever, not a mode.** The old page had a `REVERSE:
  GOAL-SEEK` toggle — the saver's first question, asked in the engine's
  vocabulary, on the far side of a switch. It is now the first remedy card:
  "invest ₹X more a month". Same computation, asked in the reader's words.
- **The three entry fields are a projection of the advanced form**, never a
  second copy. sol-026 happened because two surfaces each read their own inputs.
- **The odds are the engine's, not the page's.** A probability cannot be
  recovered from three percentiles, which is why the old page — whose only
  window on the simulation was p10/p50/p90 — never asked whether the plan
  worked. `runSimulation` now answers it while it still holds every path.

**Settled by Rahul, 16 Aug**

- The bar for "this plan works" is **50%** — the typical path — against the
  planner's 85%. Put to him with all four candidate bars costed first, so the
  choice was a real one rather than a defence of my own default:

  | bar | the lever card says | or |
  |---|---|---|
  | **50%** | ₹18,000 more → ₹43,000/mo | wait 32 years |
  | 65% | ₹30,000 more | wait 39 years |
  | 75% | ₹39,500 more | wait 49 years |
  | 85% | ₹58,000 more → ₹83,000/mo | over 50 years |

  Every row is a true statement about the same simulation. What changes is how
  sure the tool insists on being before it calls a plan fixed, and at the
  planner's bar this page would tell a saver of ₹25,000 a month that a crore
  needs ₹83,000 — correct, and useless to nearly everyone it is for.

  The known weakness of 50% is that a coin flip can read as a promise. It is
  answered in the copy rather than in the constant: every card states "50 still
  fall short" beside the number. If that ever gets quietly dropped, this
  decision has been reversed without anyone deciding to.
