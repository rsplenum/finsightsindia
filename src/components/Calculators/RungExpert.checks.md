# Design checks — RungExpert (rung 6, the last one)

> Written before the component, per dd-000.

**Question:** *What if your numbers are different from ours?*

**What was wrong**

One `<details>` labelled "Show the workings and change the assumptions" wrapped
about 590 lines: a twelve-field form, the survival panel, the lifetime cash-flow
panel, a chart, a milestone strip, volatility diagnostics, the hedging panel and
a year-by-year ledger. One click revealed all of it.

That is dd-002's origin case, still standing at the bottom of the very page the
entry was written about: *"at one moment we are teaching the user the A,B,C and
the very next moment they are exposed to the shakesperian or aristotalian level
dense prose to parse."* The ladder above it was rebuilt; the cliff underneath
was left in place with a politer sign on it.

| entry | check | answer |
|---|---|---|
| dd-001 | did complexity move, or disappear? | Moved, and nothing is removed. Every control, table and diagnostic that existed still exists and is still reachable — it now arrives in three named steps instead of one avalanche. |
| dd-002 | one question, ≤2 new concepts per step? | The rung asks one question. Inside it, three doors, each named by the question it answers: change the assumptions · see it year by year · check the workings. Opening one does not open the others. |
| dd-003 | what do they leave with? | That the answer above was computed from assumptions somebody chose, and that they can choose differently. A reader who never opens it has still been told that. |
| dd-004 | which money? | Unchanged inside; the panel's own labels already carry PV/nominal. The rung adds no new figures. |
| dd-007 | what does each visual difference assert? | It is a rung, so it looks like the other five: same card, same "Next question" eyebrow, same heading weight. Looking different would assert that it is a different kind of thing, and it is not — it is the last step of the same ladder. |
| dd-009 | any unexplained figure? | **This is why the ledger was fixed first.** Four of six columns in the hedging table were computed beside the engine and would have been reframed rather than corrected. A better frame around invented numbers is worse than the door was. |
| dd-012 | shown in the situation it exists for? | The rung exists for the reader who does not accept our assumptions, so it opens on the controls, not on the output. |

**Deliberate choices**

- **It is a rung, not a door.** The ladder's other five each answer a question
  the reader is actually having next. After "what does protection cost?" the
  honest next question is "but these are your numbers, not mine". Naming it that
  way turns a mystery door into a step.
- **Three doors inside, not one.** Splitting by the question each section
  answers is the only kind of layering dd-002 accepts; splitting by volume just
  moves the wall. The controls come first because they are what the question
  asks for.
- **Closed by default, and that is not hiding.** dd-001 is satisfied by
  reachability, not by everything being visible at once. A reader who wants it
  finds it named.
- **The ledger was corrected before being wrapped.** sol-023's second instance
  lived in here. Framing it more nicely would have been the worse outcome.
