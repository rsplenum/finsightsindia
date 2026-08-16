# Design checks — RungSipSequence (rung 5)

**Written before the component.**

**Question:** *Does it matter *when* the bad years come?*

The mirror of the planner's rung 4, and the reason this screen is worth a step:
for a retiree a crash EARLY is the ruinous one; for a saver it is a crash LATE.
The intuition almost everyone arrives with — "a crash is bad" — is not wrong so
much as undated, and the date decides whether it costs two months or five years.

**One control:** how long the bad run lasts — one year, two, or three.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing is removed. The whole scenario table sits below the chart, every start year, and the expert rung still holds the full engine. |
| dd-001/dont-2 | PASS | This rung is layer three, not the entry. The three entry inputs still drive it — it reads them, it does not ask again. |
| dd-002/dont-1 | PASS | One question, one control, one consequence. The screen is not sized to what is left to say. |
| dd-002/dont-2 | PASS | One new concept — when the bad years fall — and one control. The crash depth is fixed, not a second knob. |
| dd-003/dont-1 | PASS | The idea carried away is that a crash has a date, and that a saver's dangerous date is the opposite of a retiree's. Usable on any product we never built. |
| dd-003/dont-2 | PASS | The deterministic engine path is infrastructure; the achievement is the inversion being felt rather than asserted. |
| dd-004/dont-1 | PASS | Every figure is in today's money and labelled as such in the column head, not in a caption. Nothing on this screen is in future rupees. |
| dd-004/dont-2 | PASS | Neither word appears. The frame is "in today's money", which rungs 1 and 2 already taught. |
| dd-005/dont-1 | PASS | The rung is a single push on the spine's first rate — the same average growth, arriving in a different order. |
| dd-006/dont-1 | PASS | The prose never changes with the control. Only the bars and the two fixed slots move. |
| dd-006/dont-2 | PASS | The whole profile is on screen at once as bars — early and late are adjacent, not two states of a toggle. That difference IS the lesson, so it is never hidden. |
| dd-007/dont-1 | PASS | Two type sizes only: the two fixed-slot figures, and everything else. |
| dd-007/dont-2 | PASS | Bar length encodes one thing — years of saving lost. The single accent colour marks the worst year and nothing else. |
| dd-008/dont-1 | PASS | Prose states the principle; the duration control changes bars and two numbers in fixed slots, never a sentence. |
| dd-008/dont-2 | PASS | The boundary sentence names the two ends of the range — cost at the start against cost at the end — which covers every position at once. |
| dd-009/dont-1 | PASS | The average return of each profile is stated beside the 12% assumption, with the reason: same years, moved. That was rung 4's original review failure on the planner. |
| dd-009/dont-2 | PASS | "Bad year" is defined on screen as −30% and how often that has happened, before any bar is read. |
| dd-010/dont-1 | PASS | The headline is years of saving lost — a thing lived through. Ending wealth sits beside it as context, which is where dd-010 puts it. |
| dd-012/dont-1 | PASS | No average over scenarios anywhere. Every bar is one concrete placement of the same crash. |
| dd-012/dont-2 | PASS | The verdict is "five years of saving, gone" — one instance a reader can picture, not a difference of two summary statistics. |
| dd-012/dont-3 | RISK | The smooth-world baseline is a third frame after the Answer's rough-world median. Mitigated by stating it in the first line of the rung, in the reader's words; watch for it in review. |
| dd-013/dont-1 | PASS | Same engine, same `sipInputs`, same seed. The fixed-return path was added inside `sipWorker` precisely so this rung would not grow its own walk. |
| dd-013/dont-2 | RISK | Ending wealth appears here and on the Answer with different values, because this rung's world has no volatility. Answered by naming the smooth world explicitly and never quoting a probability here. |
| dd-017/dont-1 | N/A | No input is taken here. |
| dd-017/dont-2 | PASS | The control is how long the bad run lasts, in years - the reader's unit. The engine would have preferred a start index. |
| dd-017/dont-3 | N/A | Not the entry. |
| dd-017/dont-4 | N/A | No step-up control on this rung. |
| dd-017/dont-5 | PASS | Every rupee figure is in today's money and the column head says so; the setback is in years of the reader's own saving. |
| dd-019/dont-1 | PASS | The two headline figures are timespans, not money, and each sits on a row naming its case in words ("If it comes at the very start"). The money appears beneath inside a full sentence - "you finish with X instead of Y" - where quantity and amount cannot come apart. |
| dd-019/dont-2 | N/A | No frame phrase is used more than once here; the rung prints no repeated "in today's money" label. |
| dd-019/dont-3 | RISK | The trio is incomplete rather than split. Both money figures in the end-labels are real values (endReal, smoothEndReal) but carry no frame word at all, so the reader is not told whose money they are in. Small, and it belongs to the same repair pass as the insurance figures. |
| dd-019/dont-4 | N/A | No equivalence heading on this rung. |
| dd-020/dont-1 | N/A | This rung presents computed results and carries no option list that any category filters, so there is nothing here that eligibility could remove. |
| dd-020/dont-2 | N/A | The rung asks no qualifying question of its own; the SIP page's inputs live in the entry and the expert rung. |
| dd-020/dont-3 | N/A | No category filter reaches this rung, so none can move a figure it prints. |
| dd-021/dont-1 | PASS | It reports that the same crash costs 2 months at the start and 4.8 years at the end - an unflattering fact about the plan, printed rather than softened. |
| dd-021/dont-2 | PASS | The control is how long the bad run lasts, and it moves both the best and worst timing outcomes. |
| dd-021/dont-3 | PASS | Each row states what the reader finishes with under that timing, in a sentence, instead of leaving the two figures to be differenced. |

## Deliberate choices

- **No slider over the crash year.** The obvious control would have been "when
  does it happen", but that hides seventeen of eighteen answers behind a thumb
  and makes the reader assemble the shape from memory — dd-006 exactly. The
  shape *is* the lesson, so the whole profile is drawn at once and the control
  is given to the thing that genuinely has alternatives: how long the run lasts.

- **The setback metric, after the obvious one failed.** The first attempt was
  the delay to the goal — "you arrive four years late". It collapsed to *never*
  on the page's own shipped inputs, which do not reach the goal even without a
  crash. A headline that goes blank on the default is not a headline. "Thrown
  back to where you stood in year 13" is always defined, and it is the direct
  mirror of the planner's cushion-in-years.

- **Deterministic, and said so.** A Monte Carlo would blur the one effect being
  isolated. The cost is a third frame on the page, which is the RISK recorded
  above and is paid for with a plain first line rather than a footnote.

- **Three bad years is the default duration.** One bad year is not the
  frightening case; 2000–2002 and 2008–09 are. The control opens on the case
  worth learning and lets the reader dial it down, not up.
