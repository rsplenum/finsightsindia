# Design checks — RungSipProtection (rung 6)

**Written before the component.**

**Question:** *Can I buy protection from that — and is it worth it?*

Rung 4 ends on a saver's worst case: bad years arriving late, when the pot is
biggest. This rung answers the question that follows immediately, and answers it
honestly, which on the shipped assumptions means answering *no*.

**One control:** how rough the market turns out to be — the one thing on this
screen neither we nor the reader chooses.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | The premium, the fair value, the markup, the binding frequency and the full track are all present. Nothing is withheld to make the verdict cleaner. |
| dd-001/dont-2 | PASS | Layer three again. The hedging toggle and floor depth remain in the expert rung for anyone who wants to drive them. |
| dd-002/dont-1 | PASS | One question, one control, one consequence, then the hand-off to the expert rung. |
| dd-002/dont-2 | PASS | One new concept — a floor you pay for whether or not it pays out — and one control. |
| dd-003/dont-1 | PASS | The idea carried away: insurance is priced on the roughness assumed when you buy, so it only pays if the world turns out rougher than the price implied. That is transferable to every insurance decision. |
| dd-003/dont-2 | PASS | Black-Scholes pricing is the floor, not the point. The point is that the reader can now judge a quote instead of accepting one. |
| dd-004/dont-1 | PASS | Every rupee figure is ending wealth in today's money, stated in the column head. The premium is a percentage a year and labelled as one. |
| dd-004/dont-2 | PASS | Neither word appears anywhere on the rung. |
| dd-005/dont-1 | PASS | The whole subject reduced to one comparison: a certain price against an uncertain payout. Every other figure is a push on one side of it. |
| dd-006/dont-1 | PASS | Prose is invariant to the control. Only figures in fixed slots move. |
| dd-006/dont-2 | PASS | Protected and unprotected sit adjacent in two columns, never behind a toggle. The gap between them is the entire lesson, so it can never be a mode. |
| dd-007/dont-1 | PASS | One size for the two verdict figures, one for everything else. No cascade. |
| dd-007/dont-2 | PASS | Colour asserts exactly one thing: whether protection left the reader better or worse off. It is applied to nothing else. |
| dd-008/dont-1 | PASS | The roughness control moves numbers in fixed slots and a marker on the track. No sentence is rewritten. |
| dd-008/dont-2 | PASS | The dynamic sentence names the boundary — the roughness from which protection starts earning its price — which is true for the whole track and only moves when another input does. The reader's own assumption is marked on the track. |
| dd-009/dont-1 | PASS | The premium is quoted beside its fair value and the resulting multiple, in the same breath, so 1.85% against 0.88% is explained where it appears rather than left as a discrepancy. |
| dd-009/dont-2 | PASS | What the floor does NOT cover is stated on screen: it resets annually, so three floored years compound to −27%, not −10%; and contributions arriving mid-term bought no protection that term. |
| dd-010/dont-1 | PASS | The headline is what you are left with in the worst one-in-ten futures — money in a bad future, not a mean over all of them. |
| dd-012/dont-1 | PASS | The verdict is taken in the situation a floor exists for: the worst decile. The all-futures average payout is shown as supporting arithmetic and never as the verdict. |
| dd-012/dont-2 | PASS | Two figures side by side, both pickable up as rupees. No difference of averages appears anywhere, which is the exact defect that sank the planner's first rung 5. |
| dd-012/dont-3 | PASS | Three candidate measures disagreed; one was chosen and the other two kept off the screen rather than shipped as a contradiction. |
| dd-013/dont-1 | PASS | Both columns come from the same engine, the same inputs and the same seed, so every difference between them is the floor and nothing else. |
| dd-013/dont-2 | PASS | The unprotected column at the reader's own roughness is the same quantity the Answer reports, from the same engine and inputs. |
| dd-017/dont-1 | N/A | No input is taken here. |
| dd-017/dont-2 | PASS | The control is how rough the market turns out to be, as the spread of annual returns rather than as a sigma. |
| dd-017/dont-3 | N/A | Not the entry. |
| dd-017/dont-4 | N/A | No step-up control on this rung. |
| dd-017/dont-5 | PASS | Both columns are ending wealth in today's money, labelled on the row; the premium is a rate a year and labelled as one. |
| dd-019/dont-1 | PASS | A three-column grid where the row block names the quantity and its frame together ("In the worst 1 in 10 futures / you finish with, in today's money") and the two figures sit on that row under permanent Unprotected and Protected headers. |
| dd-019/dont-2 | PASS | The phrase repeats across two rows, but each row names a different and explicit quantity - the worst 1-in-10 future against the typical one. That is the naming this rule requires, not the collision it forbids. |
| dd-019/dont-3 | PASS | What distinguishes the figures is the row's noun and the column's header, not the frame. |
| dd-019/dont-4 | N/A | No heading here asserts that two amounts are the same. |
| dd-020/dont-1 | N/A | This rung presents computed results and carries no option list that any category filters, so there is nothing here that eligibility could remove. |
| dd-020/dont-2 | N/A | The rung asks no qualifying question of its own; the SIP page's inputs live in the entry and the expert rung. |
| dd-020/dont-3 | N/A | No category filter reaches this rung, so none can move a figure it prints. |
| dd-021/dont-1 | PASS | The strongest evidence on the site that the design is not arguing a thesis: this rung reports that our own hedging costs more than it returns at the shipped roughness, and says so plainly instead of burying it. A tool willing to print that is willing to print a good policy. |
| dd-021/dont-2 | PASS | The floor and the roughness are the inputs, and both move the protected and unprotected outcomes. |
| dd-021/dont-3 | PASS | Worst 1-in-10 and typical futures are set side by side with the verdict stated, never as a difference of averages (dd-012). |
| dd-022/dont-1 | PASS | Its one control is the subject of the rung, and the reader opened the rung to ask about it. Nothing here is a box they have to read and dismiss. |
| dd-022/dont-2 | N/A |  |
| dd-022/dont-3 | N/A |  |
| dd-022/dont-4 | N/A |  |
| dd-023/dont-1 | RISK | Honest answer: this was designed at 1280 and checked at 375 afterwards, which is the exact practice dd-023 was written to name. It has not been re-examined as a phone screen. Recorded rather than claimed as compliant, and on the launch gate as a sweep of its own. |
| dd-023/dont-2 | PASS | Every figure is rendered in place. The explanatory line under a control is visible prose rather than a hover tooltip, so nothing the reader needs is behind a pointer. |
| dd-023/dont-3 | N/A |  |
| dd-024/dont-1 | PASS | A rung is never what the reader lands on. It sits inside a ladder under an Answer that has already told them what the page is, so the introduction this rule asks for is made once, above, rather than repeated on every step. |
| dd-024/dont-2 | N/A |  |
| dd-024/dont-3 | RISK | The ladder reveals rungs but the layout around them does not reorganise, so the page looks the same after the reader has told it everything as before they told it anything. Not wrong on this component, and not yet right on the page it belongs to. Filed against the calculator sweep already on the gate. |

## Deliberate choices

- **The honest answer here is no, and it is not softened.** At the roughness the
  page ships with, this contract leaves the reader worse off in the bad futures
  *and* in the typical ones. The screen says so. Selling a floor that does not
  pay would be the reduction dd-001 forbids, pointed at the reader's wallet.

- **A saver is a net buyer of units.** That is the mirror of rung 4 and the
  deepest thing on the screen: a floor pays you for exactly the low prices that,
  for the next twenty years, are working in your favour. Protection while you
  are still buying is not the same trade as protection while you are selling.

- **The premium is priced, never chosen.** It is quoted once at the reader's own
  roughness and held fixed across the whole track. Re-pricing at every position
  was tried on the planner and destroyed the screen — cost rose in step with
  benefit and the comparison stopped saying anything.

- **Three measures computed, one shipped.** The average payout, the count of
  savers left short, and the worst decile disagree with each other and all three
  are correct. The worst decile is the one the reader can picture a single
  instance of, so it carries the verdict and the other two stay in the data
  layer where they belong.
