# Design checks — RungSipGrowth (rung 4)

**Question:** *What if growth is slower than you hope?*

**Retrofitted to the dd-016 format on 16 Aug**, when the fund fee was added to
the chain. The original free-text answers are kept below — they were written
before the component and are the record of that.

**Why it changed.** Rung 3 taught the two-rates model as though growth and
inflation were the only forces acting on the pot. Once sol-033 made the fund's
fee real, the rung was quoting a real rate its own simulation no longer used:
7.08% on screen while the engine ran 5.22%. A headline figure and the maths
underneath it disagreeing on one screen is dd-009, and across two rungs it is
dd-013 — rung 2 said the fund takes ₹10.5 lakh while rung 3 implied it took
nothing.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing removed. Two rows added, and the fee control itself stays in the expert rung where the other assumptions live. |
| dd-001/dont-2 | PASS | Layer three. The three entry fields still drive it; this rung asks for nothing again. |
| dd-002/dont-1 | PASS | Still one question and one control. The table grew because the chain grew, not because there was more to say. |
| dd-002/dont-2 | PASS | One new concept — that the fee is an annual drag on growth — and it was already taught one rung earlier as a rupee figure. No new control. |
| dd-003/dont-1 | PASS | The takeaway is now sharper than a number: of the three forces on this screen, exactly one is a choice, and it is the one people spend least time on. |
| dd-003/dont-2 | PASS | Precomputing the curve is infrastructure. The achievement is that a reader leaves able to judge a fund quote. |
| dd-004/dont-1 | PASS | Every rate is "a year", every rupee figure is "in today's money" and says so on the row. No frame lives in a caption. |
| dd-004/dont-2 | PASS | Neither word appears. "Genuinely better off by" carries the real rate in the reader's own words. |
| dd-005/dont-1 | PASS | This IS the spine: what the pot really grows at. The fee is introduced as a push on it rather than as another thing to worry about. |
| dd-006/dont-1 | PASS | Prose is invariant to the slider. Only the fixed slots move. |
| dd-006/dont-2 | PASS | No mode anywhere. The whole chain is visible at once, which is the point of showing four rows instead of one. |
| dd-007/dont-1 | PASS | Two sizes only: the finishing figure, and everything else. The three cost rows are deliberately identical in weight because they are the same kind of thing. |
| dd-007/dont-2 | PASS | The one rule added is a border above "genuinely better off by", asserting that it is a total of the rows above it — which it is. Red is used only for money leaving. |
| dd-008/dont-1 | PASS | Dragging changes digits in fixed slots and nothing else. Every sentence is true at every position. |
| dd-008/dont-2 | PASS | The boundary sentence names where the plan breaks and now states the fee it is quoted before, so it covers the whole track at one reading. Both marks sit on the track itself. |
| dd-009/dont-1 | PASS | **The fix this retrofit is for.** The real rate now derives from figures all present on screen, and the caption says they compound rather than subtract — because 13.4 − 1.75 − 6 gives 5.65 and the true answer is 5.22, and a reader who tries the arithmetic must not be left thinking we are wrong. |
| dd-009/dont-2 | PASS | Two rows were added rather than a rate quietly changing. The shorter version was the one that raised the unanswerable question. |
| dd-010/dont-1 | PASS | The finishing figure is present but the row that carries the lesson is the rate the reader lives with for twenty years. |
| dd-012/dont-1 | PASS | Odds of reaching the goal is the exposure a saver actually has to weak growth; no all-futures average of ending wealth is headlined. |
| dd-012/dont-2 | PASS | No differences of averages anywhere on the rung. |
| dd-012/dont-3 | RISK | Seven rows is the most this ladder has asked anyone to read at once. Held to because each row is one short clause and the chain only reads as a chain if no link is missing — but this is the rung to watch in review, and the first thing to cut if it feels long. |
| dd-013/dont-1 | PASS | The curve comes from the one engine, one input set, one seed, on the shared worker. The fee reaching this rung is exactly the fix. |
| dd-013/dont-2 | PASS | The fee appears here as a rate and in rung 2 as rupees, from the same `expenseRatio` on the same run — one quantity, one value, two units, each labelled. |
| dd-017/dont-1 | N/A | No input is taken here; the slider is an assumption about the market, not a commitment of the reader's money. |
| dd-017/dont-2 | PASS | The slider asks what the market does - the reader's framing - rather than a drift the engine would have preferred. |
| dd-017/dont-3 | N/A | Not the entry. |
| dd-017/dont-4 | N/A | No step-up control on this rung. |
| dd-017/dont-5 | PASS | Every figure is a rate a year or a rupee in today's money, and each row says which. |
| dd-019/dont-1 | PASS | Each row states its quantity in words on the same line as its figure ("You were aiming for", "So you are genuinely better off by"), with the frame set directly beneath the noun inside the same label rather than beside the number. |
| dd-019/dont-2 | PASS | "in today's money" appears once, on the target. No second quantity on this rung wears it. |
| dd-019/dont-3 | PASS | Every figure is named by its row label, so the frame is never the only thing identifying it. |
| dd-019/dont-4 | N/A | No equivalence heading. The rung already warns that the three figures compound rather than subtract, which is the opposite failure and is handled. |

## The original answers, kept

| entry | check | answer |
|---|---|---|
| dd-008 | drag end to end — does any sentence change? | No. Prose states principles true at every position; values live in fixed slots; the single dynamic sentence names the BOUNDARY, which covers the whole track at once and only moves when some other input does. |
| dd-002 | one question, ≤2 new concepts? | One question, one control. No new concept — it moves a rate rung 1 already taught. |
| dd-005 | pushes on the spine? | Directly. It moves the first of the two rates and shows the goal respond. |
| dd-003 | what do they leave with? | That the growth rate is the one term in this plan they do not control, so a plan that only works at the top of the track is a hope. The two they DO control were the levers on the Answer. |
| dd-012 | judged where it acts? | The row that moves is the odds of reaching the goal, not an average ending balance — a saver's exposure to disappointing growth is the chance of falling short, and an average conceals it. |

## Deliberate choices

- **The slider stays gross.** It is labelled "what the market does, before any
  costs", because the whole argument of the rung is that this is the number the
  reader cannot influence. Netting the fee into it would hide the one number
  they can.
- **The track is marked at the breakeven**, so the threshold is learned by
  crossing a line rather than by reading a number. Copied from the planner's
  rung 3, which survived review.
- **Precomputed curve.** Simulating per slider position gives either a stutter
  under the hand or a lag that reads as the tool being unsure.
- **The reader's own assumption is marked too.** It arrived from a named period
  rather than a default (sol-028), and showing where that sits on the range is
  the honest reminder that it was a choice.
- **The second paragraph is the new one, and it is the point of the retrofit.**
  Growth is the force you cannot control; the fee is the force you decide
  outright and the only one charged with certainty. Putting the two sentences
  next to each other is the whole lesson, and it only became available once the
  fee was on the screen.
