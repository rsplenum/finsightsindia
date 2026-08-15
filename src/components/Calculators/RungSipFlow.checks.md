# Design checks — RungSipFlow (rung 2)

**Written before the component.**

**Question:** *So what did I put in, and what did the market actually add?*

| entry | check | answer |
|---|---|---|
| dd-004 | frames visible and permanent? | Both moneys appear, each labelled in a fixed column, and the difference between them is the point of the rung rather than a parenthetical. The planner's money-flow rung is the entry dd-004 was written about; this one is built from the corrected version. |
| dd-006 | is the reader made to diff two states? | No toggle. Today's money and future rupees sit side by side in two columns, so the comparison is SEEN rather than remembered. |
| dd-007 | does every visual difference mean something? | Three rows of equal weight for the three quantities that are equally real — what you gave up, what the market added, what you keep. The total is heavier because it is a total. Nothing else varies. |
| dd-009 | is any needed explanation cut? | No. Two things that would otherwise be a silent surprise are stated outright: that the nominal total invested overstates the real sacrifice, and that the tax figure only becomes real on the day the units are sold. |
| dd-010 | lived quantity or accountant's? | The multiple — what each rupee really given up came back as — is the one a saver carries away. The rupee totals are there because they are what the reader arrived expecting to see. |

**Deliberate choices**

- **Growth is a residual**, so the three figures always tie on screen: what you
  put in, plus what the market added, is what you have. A screen whose own
  arithmetic does not close is the fault sol-023 was opened for. There is a test
  asserting it.
- **Tax appears here rather than in the Answer.** It is a real subtraction but
  it is not the saver's first question, and it is only owed on the day they
  sell. Putting it in the headline would price a decision they have not made.
