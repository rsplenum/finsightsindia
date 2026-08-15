# Design checks — RungSequence (rung 4)

> **Written after the first version failed review, and before the rebuild.** The first
> version skipped these checks entirely and was rejected on six counts. That is the
> clean evidence that running them is not ceremony — rung 3 ran them and survived.

**Question:** *What if the bad years come first?*

| entry | check | answer |
|---|---|---|
| dd-002 | one question, ≤2 new concepts? | One question. Two controls — when it starts, how long it lasts — both parts of the same question. |
| dd-003 | what do they leave with? | That while drawing an income, *when* a fall happens matters more than *whether* it does. |
| dd-004 | which money? | Terminal figure labelled "in today's prices". The cushion is in years of spending, which needs no currency frame at all. |
| dd-008 | drag end to end: sentence churn? | No. The boundary sentence changes only when the *duration* changes, never while dragging the start year. |
| dd-009 | any unexplained figure? | **This is the entry's origin.** A bad year is now defined and anchored to 2008 before it is used, and the average return explains itself in the same row it appears in. |
| dd-010 | lived experience or summary? | **This is the entry's origin.** The headline is the year the pot looked thinnest, measured in years of spending. The terminal balance is demoted to context and labelled the hindsight view. Income is reported separately, because it never falls — and the gap between "the balance frightened me" and "my income held" is the reader's real question. |

**Deliberate choices**
- Downturns last one, two or three years, because a single bad year never breaks a sound plan and therefore cannot teach what does. Two years starting in year 1 empties the shipped default in year 26.
- Deterministic, not Monte Carlo: randomness would blur the very effect being isolated. The multiset of returns is fixed and only its order changes, so the average is identical **by construction**.
