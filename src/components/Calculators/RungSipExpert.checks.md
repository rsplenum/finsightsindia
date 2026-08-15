# Design checks — RungSipExpert (the last rung)

**Written before the component.**

**Question:** *What if your numbers are different from ours?*

| entry | check | answer |
|---|---|---|
| dd-002 | is this layering, or a relocated wall? | Layering. The old page was a single dense screen with a mode switch on top of it; this splits it into three doors named by the question each answers — change the assumptions, see it year by year, check the workings. Revealing volume on one click is what dd-002 was written against, and the planner's version of this rung is that entry's origin case. |
| dd-001 | is anything removed? | Nothing. Every input, the allocation matrix, the milestone timeline, the chart, the hedging ledger, the CSV and PDF exports all survive. dd-001 is satisfied by reachability, not by putting everything on screen at once. |
| dd-013 | can two surfaces disagree? | No. The panel computes nothing. It reads the same broadcast result as every rung above it, from the same single DOM reader. This is the fault the planner was caught with and the reason `sipInputs.ts` exists. |
| dd-008 | does a control leave the reader with nothing to see? | No. The live answer sits above the doors and moves with every change, whichever door is open. Rahul's correction on the planner's version of this rung: "once the user changes the assumptions they dont see the result as the result is hidden in see it year by year." |
| dd-000 | applied before designing? | This file was. The planner's equivalent was written after, and it is recorded there as debt. |

**Deliberate choices**

- **The controls door opens by default.** The rung's question IS "change the
  assumptions", so the controls are the thing rather than a door to the thing.
- **The mode switch is gone.** `FORWARD: STOCHASTIC` / `REVERSE: GOAL-SEEK` was
  a choice between two vocabularies for the same question; goal-seek is now a
  remedy card on the Answer, in the reader's words.
- **The named periods live here, in the controls door**, next to the growth and
  roughness fields they set — the same arrangement as the planner, because a
  regime is a pair and choosing one must visibly set both (sol-028).
