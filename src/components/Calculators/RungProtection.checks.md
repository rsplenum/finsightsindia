# Design checks — RungProtection (rung 5)

> **Second version. The first failed review, and the checks below were the ones
> it had already cited by name.** dd-009 and dd-010 were listed in the previous
> copy of this file with answers written against them, and violated anyway. That
> is the failure dd-000 names: answering the checks on paper without applying
> them is the same as never recording them. This rewrite exists because the
> first one was ceremony.

**Question:** *What does it cost to protect against that?*

**What was wrong with version one**

Rahul: *"the insurance is not there to increase the probability of corpus lasting
full 30 years, it is there to prevent it from not lasting 30 years in futures
where the bad years appear"* — and on the verdict line, *"The 'So protection is
worth -4 in 100' makes no sense to a lay person. this is the worst example of not
learning from our own failures."*

Version one headlined survival averaged over all 10,000 futures and printed a
difference of two averages. It judged insurance by the one measure it does not
exist to move, and put a quantity nobody can picture in the verdict slot.

| entry | check | answer |
|---|---|---|
| dd-001 | did complexity move, or disappear? | Moved. The full hedging controls stay in the expert panel. This rung fixes the reader's own floor and premium and varies only what nobody chooses. |
| dd-002 | one question, ≤2 new concepts? | One question, one control. Two concepts: what triggers a payout (a *year* ending more than 10% down) and what it charges (a fee every year, always). Both named before use. |
| dd-003 | what do they leave with? | That insurance has a **fixed price and a variable payout**, so buying it is a bet the world will be rougher than the price assumes. That transfers to every insurance decision they will make. |
| dd-004 | which money? | The bill is in rupees and explicitly labelled today's money. Everything else is counts and years — frame-free by construction. |
| dd-005 | the one comparison? | **What you pay every year, against how often the floor actually catches you.** |
| dd-006 | is a difference hidden behind a mode? | No. Unprotected and protected are adjacent in every row. |
| dd-007 | what does each visual difference assert? | **This entry's fix.** The bill was the smallest, greyest text on the screen while being the most consequential number on it. It is now the largest thing in its own block. Size asserts importance, so the biggest cost is the biggest type. |
| dd-008 | drag end to end: does any sentence change? | No. The boundary sentence names where the floor starts paying its way; the principle holds at every position. Verified by walking all 25 slider stops and diffing every leaf node. |
| dd-009 | any unexplained figure? | **Repeat violation, now fixed.** Every figure is traceable: the fee in ₹ and %, the lifetime total derived from it, the count of futures rescued or lost stated as counts of futures. No difference-of-averages anywhere. |
| dd-010 | lived experience or summary? | **Repeat violation, now fixed.** The headline is what happened in the bad futures — how many ran out, and in which year the money went in the worst one in ten. Not an average over all futures, which is what a survival probability is. |
| dd-012 | is the thing shown in the situation it exists for? | **This entry's origin.** The rung leads with the futures where the plan broke, because that is the only place a floor can do anything. The all-futures average is not shown at all. |

**Deliberate choices**

- **The rung opens on rung 4's finding.** Rung 4 showed that a bad run early
  hollows out a plan. Rung 5 is the reply: here is the bill for blunting it.
  Protection has no meaning until the reader holds the risk it answers.
- **The bill comes before the benefit.** A reader deciding whether to buy
  something should meet the price first. Putting the payoff first and the cost
  in a footnote is a sales structure, not an explanation.
- **What the floor does NOT do gets its own block.** Rahul: *"where bad years are
  consecutive then for every year i loose maximum 10% ... this makes the 10%
  floor a hard sell."* He is right, it is a hard sell, and the limit is real: an
  annual floor resets, so three bad years cost about 27% and the premium is paid
  in all three. A limit the reader discovers later is a limit we concealed.
- **"Futures where the money ran out" replaces "futures in 100 where it lasts".**
  Same arithmetic, opposite framing, and only one of them is the situation the
  product exists for. A count of ruined retirements is picturable; a survival
  percentage is a statistic.
- **The verdict may be negative and is stated plainly.** At the shipped 15%
  roughness this protection loses on both counts, and the screen says so.
  Rahul settled the premium at 1.85% knowing that.
