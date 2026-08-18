# Insurance analyser — the brief

Rahul, 16 Aug 2026, given when asked what specifically felt unintuitive about
the current page. He answered with what the tool is *for*, which was the more
useful answer. The verbatim is recorded in `design-doctrine.json` as **dd-021**;
this file is the buildable form of it.

## The two questions the tool exists to answer

**1. What is this policy's rate of return?**
Collapse the whole cashflow — premiums out, cash back later, maturity amount —
into one number, so it can be set against anything else.

**2. What would the same thing cost if you assembled it yourself?**
A hybrid policy bundles: cash return later, life cover meanwhile, accident
cover, guaranteed return of principal, and a maturity amount. Unbundle it — buy
term cover for the same sum, accident/health cover for the same sum, invest the
remainder in a similar risk-return instrument — and price that. The difference,
**in either direction**, is the policy's comparative advantage.

## The inputs — and this is the whole list

> "The UI should ask minimum number of questions"

| Input | Why the verdict needs it |
|---|---|
| Annual premium | The outgoing cashflow |
| Number of outgoing payments | How long you pay |
| When incoming payments start | Where the returns sit on the timeline |
| How much they are, and whether they grow | The incoming cashflow |
| Life cover | The term-insurance leg of the replica |
| Accident / health cover | The accident leg of the replica |

**Accident/health cover is new.** ~~The current engine prices a life leg only.~~
**CORRECTED 18 Aug — this was already false when it was written.** `sol-039`
extracted the engine on 16 August, the same day as this brief, and it carries
`accidentCost` inside `investableCapitalOf`; the field was on the form. Taking
this line on trust would have meant building a second accident input beside the
one that already worked and calling dd-021 satisfied.

**What the engine genuinely could not express was the other half of row 4 —
*"and whether they grow"*.** A policy paying a rising income was priced as
though it paid a level one, which understates its return. Fixed as
`payoutGrowthPct` in sol-067, along with two asymmetries nobody had filed: the
growth route paid no fund fee where the bond route's zero is a genuine fact, and
the policy's payouts were assumed exempt under s.10(10D) whatever its cover.

*The lesson is kept here rather than tidied away: a recorded diagnosis is
evidence, not a finding. It was true when written and the tree moved under it.*

Anything not on this list has to justify itself against dd-021/dont-2: an input
that cannot change the verdict should not be asked for.

## The output, in order

1. **The verdict, plainly.** The policy wins, or the DIY route wins.
2. **The rate of return**, as the comparable number — in the reader's words, not
   "TRUE YIELD (XIRR)", which F-13 already flagged as the analyst's vocabulary.
3. **How to actually do the DIY route.** Not an afterthought: *"then displays
   how to do DIY generally, that opens oppoutunity to promote genuinely
   beneficial and advantageous products."* A verdict the reader cannot act on is
   half delivered.

## What has to change about the current page

The gate and the audit already record the symptoms; dd-021 names the cause.

*All four are closed as of 18 Aug — sol-066, sol-067. Kept for the reasoning.*

- ~~**The safe DIY route is charged no tax at all**~~ **Done 17 Aug, sol-060** —
  Rahul chose to be asked for a slab. Three more of the same fault were found on
  18 Aug and are in sol-067.
- ~~**The page leads with unbundling as an argument**~~ **Done, sol-066.** The
  hero that said *unmask* is deleted; the welcome states the question and
  promises both answers. Verified: fed a good policy the screen prints **Keep
  the policy** without hedging.
- ~~**F-12**~~ **Done, sol-066.** The frame is a column header over a table whose
  rows name their quantity, so the phrase appears once per table instead of four
  times beside four unrelated figures.
- ~~**The input set**~~ **Done, sol-066/sol-067** — see the correction above.

## The tone, which is the hard part

> "the challange is to make it so simple and intuitive that everyone can
> understand the comparison. people are always worried that they might have been
> taken for a ride and there is so much misselling of insurance products
> especially hybrid insurance products, if some of them are genuinely superior.
> the math will reveal that."

The reader arrives suspicious and slightly ashamed, and often about a decision
already made and hard to undo. What they want is not an argument. It is a
verdict they can trust *because it could have gone the other way*.

That is the whole reason the tool must be as willing to say "this policy is
good" as "you were sold something poor". A calculator that can only produce one
answer is advocacy, and a reader who senses that will discount the answer they
most needed to believe.

## The test

Feed it a genuinely good policy. Does the screen say so, plainly, without
hedging? Then check the costs on both routes: if either is charged a tax or a
fee the other is spared, the thesis is already in the defaults.
