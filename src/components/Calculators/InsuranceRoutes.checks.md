# Design checks — InsuranceRoutes

**Written before the component.** The working, below the verdict: what the
policy itself does, what each of the two do-it-yourself routes does, and how
fragile the whole thing is to the one assumption that is not a fact.

**Question:** *Where did that verdict come from, and what would change it?*

## What it gathers, and why it is one component

The old page scattered this across five surfaces — an "Engine A" card, two
"Engine B / C" cards, a bottom line, a frictions X-ray and a sensitivity table —
each with its own heading style, and between them **four different quantities
wearing the phrase "in today's prices"** (F-12, dd-019). Two bold figures 500px
apart shared a label while counting different things, so the reader's first
thought was that one of them was a typo.

Bringing them into one component is what makes the F-12 fix checkable: every
figure on this surface names what it counts on the same line as the amount, and
the frame is a column header shared by a table rather than a caption floating
beside a stat block. That is T8's adjacent-columns pattern, which dd-019 says
explicitly does pass.

## The three costs that were missing or wrong

Recorded here because they are design decisions, not implementation details.

1. **The growth route paid no fund fee.** Government bonds bought direct cost
   nothing; an index fund does not. Charging one route a cost the other escapes
   is dd-021/do-5's exact test, and the route being flattered was the one the
   headline speaks for. It now carries `fundCosts.ts`'s expense ratio, defaulting
   to the index-direct plan for the same reason the SIP page does.
2. **The policy's payouts were assumed tax-free whatever the policy looked
   like.** s.10(10D) exempts them only where the annual premium stays within 10%
   of the sum assured. A policy sold as an investment with a token life cover
   fails that test, and those are precisely the policies this tool exists to
   examine. Assuming exemption was a thesis in the defaults pointing the other
   way from the fund fee.
3. **An escalating income was not modelled at all.** A policy whose income rises
   was being priced as though it were level, which understates its return.

Two of these favour the policy and one favours the do-it-yourself route. That is
not a balancing act — each was fixed because it was wrong — but it is the
evidence for dd-021 that the corrections were not all pointing one way.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Every figure the five old surfaces carried survives: the yield, both routes' outcomes, the cover cost, the tax drag, the GST, the commission estimate, the break-even year and the whole sensitivity table. Three costs are added. Nothing is dropped. |
| dd-001/dont-2 | PASS | This is the deep layer, and it is where the complexity moved rather than where it disappeared. |
| dd-002/dont-1 | PASS | It is one step answering one question — where the verdict came from — and it is reached only after the verdict has been given. |
| dd-002/dont-2 | RISK | This surface carries more than two concepts: the policy's own cashflow, two replica routes, three frictions and a sensitivity table. It is a deliberate exception — this is the layer a reader opens *because* they want the whole working, and dd-002's limit governs a disclosure step, not the depth behind it. Mitigated by grouping under four plain headings, each answerable on its own. |
| dd-003/dont-1 | PASS | The transferable idea is that a guaranteed return is a rate you can compare, and that the fee and the tax on the alternative are as certain as the guarantee is. A reader can carry that to any product. |
| dd-003/dont-2 | PASS | The sensitivity table is the opposite of a capability claim: it says out loud that the growth figure is an assumption and shows what happens when it is wrong. |
| dd-004/dont-1 | PASS | Both moneys are adjacent columns of one table with the frame in the column header — the pattern dd-019's own note names as passing. No parenthetical, no footnote. |
| dd-004/dont-2 | PASS | The column headers read "in the rupees of that year" and "in today's prices". |
| dd-005/dont-1 | PASS | Every item here is presented as a push on the one comparison, not as a worry in a list. The frictions section says what each one does to the yield rather than merely naming it. |
| dd-006/dont-1 | PASS | Nothing swaps. The route lines change kind only when a route genuinely changes outcome — funded versus ran out — which is a different answer. |
| dd-006/dont-2 | PASS | **The unbundle toggle is gone**, and with it the last mode on this page. Both routes and the policy are shown at once; the cover's cost is a permanent line rather than the thing a switch reveals. |
| dd-007/dont-1 | PASS | One heading size, one figure size, one supporting size. The two routes are identical in every visual respect because they are equals; only the verdict badge differs, and it differs because the outcomes differ. |
| dd-007/dont-2 | PASS | The old page gave the growth route a badge and the safe route none, which asserted a hierarchy that does not exist. Both carry one now. |
| dd-008/dont-1 | PASS | The prose states principles: interest is taxed as it accrues, a fund charges its fee whatever the market does, a lower return does not merely leave less over. All true at every input. |
| dd-008/dont-2 | PASS | The sensitivity table states the boundary — the return below which the income stops arriving — rather than describing the current assumption. |
| dd-009/dont-1 | PASS | **The rule that added the fee row.** A reader told the fund returns 12% and shown a balance built at 11.8% has been handed a figure that does not follow. The fee is its own line, in the same view, with the plan that produced it named. |
| dd-009/dont-2 | PASS | Nothing is shortened by deleting an explanation. The three-step explainer's content survives as the plain-words note above the routes. |
| dd-010/dont-1 | PASS | Where a route fails, the lived quantity leads: the year the income stops arriving and how much of it never came. A terminal balance is headlined only where the income was funded in full by construction, and the screen says that in those words. |
| dd-012/dont-1 | PASS | No averages. Every row is one deterministic walk at a stated rate. |
| dd-012/dont-2 | PASS | No verdict line here is a difference of two averages; each is a concrete rupee figure from one walk. |
| dd-012/dont-3 | PASS | The confusion this ends is the sensitivity table's old one, where a higher return was reported as a worse outcome because an exhausted portfolio was allowed to compound a debt (sol-040). Every row now reports the year it ran out and what went unpaid. |
| dd-013/dont-1 | PASS | One `analyseReplication` result feeds this surface, the answer and the plan. No second read of the form, no second walk. |
| dd-013/dont-2 | PASS | The surplus shown here is the same field the answer headlines, by identity. Asserted in a test. |
| dd-017/dont-1 | PASS | The premium's decay is stated here as well as on the answer: what the last instalment costs in today's prices, beside what the first one did. |
| dd-017/dont-2 | N/A | No inputs on this surface. |
| dd-017/dont-3 | N/A | |
| dd-017/dont-4 | PASS | A level income is shown for what it is: the note says what the last payment will buy compared with the first, so an escalation of zero is visible rather than silent. |
| dd-017/dont-5 | PASS | Every figure carries its frame, and the two moneys are adjacent rather than mixed. |
| dd-019/dont-1 | PASS | **F-12's fix.** Every figure names its quantity on the same line as the amount, or sits in a row whose header names it under a column header naming the frame. No noun in one block and frame in another. |
| dd-019/dont-2 | PASS | "In today's prices" appears once on this surface, as a column header shared by a table whose row headers name each quantity — the arrangement dd-019's note explicitly passes. It is no longer a caption repeated beside four unrelated figures. |
| dd-019/dont-3 | PASS | The frames were already correct and the screen was still ambiguous; the fix is structural — a table with named rows — rather than better wording. |
| dd-019/dont-4 | PASS | "The same money" is gone. It read as a claim of equivalence when it meant "this sum, re-expressed"; the column header now says what it is. |
| dd-020/dont-1 | PASS | Nothing is hidden for being unlikely. The sensitivity table shows rates either side of the assumption, including ones that lose. |
| dd-020/dont-2 | N/A | No question is asked here. |
| dd-020/dont-3 | PASS | The policy shape changes which rows exist — an endowment has no income line — and never what a figure means. |
| dd-021/dont-1 | PASS | **Three costs were corrected here and they do not all point the same way**: the fund fee and s.10(10D) both push the verdict, in opposite directions, and the escalating income favours the policy. The page can now print "keep this policy" from its own defaults, which is the test. |
| dd-021/dont-2 | PASS | Everything shown is derived from the six facts asked for and the assumptions block. Nothing is displayed that no input can move. |
| dd-021/dont-3 | PASS | Each route carries its own verdict badge from `verdictFor()`, and the section states which of the three ways of doing this came out ahead. The reader is never left to subtract. |
| dd-022/dont-1 | N/A | No fields on this surface. |
| dd-022/dont-2 | N/A | |
| dd-022/dont-3 | N/A | |
| dd-022/dont-4 | N/A | |
| dd-023/dont-1 | PASS | Designed at 375: the routes are stacked cards, the frictions are stacked rows, and the two money columns are the only side-by-side thing on the surface. Verified at 375 first. |
| dd-023/dont-2 | PASS | Everything is rendered in place. The chart's tooltip repeats a figure already in the ledger below it, so nothing a thumb cannot reach is needed. |
| dd-023/dont-3 | RISK | The sensitivity table has three columns and the two-money table has two. They fit at 375 without overflow, and fitting is not reading. Mitigated: each route's outcome is stated as a sentence above the table, so the comparison survives being narrow. This is the same RISK the tax panels carry and it belongs to the dd-023 sweep on the gate. |
| dd-024/dont-1 | PASS | This surface never stands alone. Before the spine is answered it shows what it is waiting for, in a sentence; it is never an empty frame. |
| dd-024/dont-2 | PASS | Each of the four sections opens with what it is about to show and why it matters. |
| dd-024/dont-3 | PASS | It reorganises with the policy: an endowment loses the income rows entirely, and a policy whose payouts are taxable gains a section saying so. |

## Deliberate choices

- **One component, not five cards.** F-12 was not a wording defect. It was four
  surfaces each labelling its own figure correctly with no one place responsible
  for whether they could be told apart.
- **The safe route's fee is zero and the screen says why**, rather than leaving
  a blank where the growth route has a number. A cost of zero that is not
  explained reads as a cost that was forgotten — which is exactly what the
  growth route's missing fee was.
- **The chart stays.** It is the one place the shape of the cashflow — years of
  paying, then years of receiving — is visible at a glance, which is the fact
  the whole comparison rests on.

## Open — for Rahul

- **The ₹5 lakh premium rule is stated, not applied.** For policies issued on or
  after 1 April 2023, s.10(10D) also withdraws the exemption where premiums
  across all such policies exceed ₹5 lakh a year. Applying it needs the issue
  year, which is a seventh question. The screen says the rule exists where the
  premium is large enough for it to bite, without asserting that it applies.
- **7.1% on bonds and 12% on equities are still typed in.** Same as the gate's
  standing item; no series in this repository to derive them from, and the
  screen says so in plain words rather than hiding it.
