# Design checks — TaxAnswer

**Written before the component.** T11's last open item: apply sol-019's three
layers to T6. This is layer 1 for the income tax calculator — the page opens on
two columns of a computation and a badge, which answers *what* but never *so
what*.

**Question:** *How much tax will I pay, and which regime should I choose?*

## The one comparison (dd-005)

**Old regime versus new regime.** Every other thing on this page — HRA, 80C,
house property interest, presumptive profit, capital gains — is a push on one
side of that comparison. It is not a list of provisions; it is one question with
many pushes, and the screen has to say which way each push goes.

## The insight the component is built on

The two regimes differ in exactly one way that the reader controls: the old one
pays you back for deductions and the new one does not. So there is a **single
number at which they cross** — the total deductions at which both bills are
identical:

> **The new regime is a bet that you cannot claim enough deductions to beat it.
> The amount you would need is computable, and the reader should be shown it.**

That break-even is the boundary (dd-008/do-3), it is markable on the deductions
themselves (dd-008/do-4), and it is the transferable idea the reader keeps
(dd-003/do-1). "The old regime only wins if you can find ₹4.33 lakh of
deductions; you have claimed ₹3.90 lakh" is a decision. "₹97,500" is a grade.

It is well defined and stays so as the heads land: the new-regime bill does not
move with old-regime deductions at all, and the old-regime bill is non-increasing
in them, so where a crossing exists it is unique and can be solved by bisection
against the same engine both columns use.

## The headline is a monthly figure (dd-010)

Nobody experiences ₹97,500 once. They experience the TDS bite. The Answer leads
with **₹8,125 a month**, with the annual figure and the effective rate beside it
as context. The lived quantity, not the accountant's summary.

## The layers, and the disclosure — designed WITH the heads, not after them

The disclosure is not a UI nicety bolted onto a finished form. If the heads are
built first, the result is one flat form and a later attempt to hide parts of
it. The order of the layers is the order of the reader's questions (dd-002/do-1):

1. **Entry — one field.** Gross salary. The answer as a sentence, both regimes,
   the break-even.
2. **"But I also earn…"** — the income heads, as chips, closed by default. A
   salaried reader never opens one and therefore never sees a business field.
3. **"How was that worked out?"** — the slab breakdown, which already exists.
4. **"What if I claim more?"** — the deductions, with the break-even marked on
   them.
5. **"I have losses from earlier years."** — the deepest and last.

**Each chip obeys dd-002/dont-2 (about two new things per step), and the ones
that could not were split rather than crammed:**

| chip | opens with | deferred one layer in |
|---|---|---|
| A home, or a property you rent out | which is it, then loan interest — 1 choice + 1 field | rent and municipal taxes appear only for a let-out |
| Business or professional income | turnover, receipts | both presumptive bases shown adjacently, then the election |
| Capital gains | equity under a year, equity over a year — 2 fields | property, gold, debt, unlisted |
| Losses to set off | this year's short-term and long-term | brought-forward, four kinds |

**Revised while building, and recorded rather than diverged silently.** This file
originally split house property into two chips, "a home I live in" and "a
property I rent out". Built, that needs the two `<details>` to be mutually
exclusive — the engine models one property — and mutual exclusion between two
disclosure widgets is fragile and confusing when both can be open. One chip
whose first control is the binary choice is honest about the constraint and
still inside dd-002: one choice plus one field for a home, plus two more that
appear only for a let-out. Other sources kept its existing field in the main
form rather than gaining a chip of its own, since it was never a business field
and hiding it would have been disclosure for its own sake.

**A chip is not a mode, and this is the sharpest rule on the page.** dd-006 bans
hiding half of a difference behind a control *when the difference is the
lesson*. A mode swaps one view of the same data for another view of the same
data. A chip here **adds data**: opening *capital gains* hides nothing and
teaches nothing by being closed — it reflects income the reader does not have.
The regime comparison, which genuinely is the lesson, stays two adjacent columns
and never becomes a switch.

**The one place a genuine alternative appears — presumptive taxation — is shown
adjacently rather than as a dropdown.** s.44AD/44ADA is an election the taxpayer
makes, so it passes dd-006/do-2. But the difference between actual profit and
deemed profit *is* the lesson for a small business, so dd-006/dont-2 says do not
put it behind a switch. Type the turnover once and see both answers side by
side. The presumptive item and the dd-006 rule resolve each other.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing is removed. Every field on today's form survives, reachable behind the chip for its own head; the Answer is added above them. The page gains layers rather than losing capability, and the heads being added are new capability, not a reduction. |
| dd-001/dont-2 | PASS | The entry is one field, not the offering. Behind it sit five income heads, presumptive taxation, four capital-gains buckets and eight-year loss carry-forward — more complexity than the page has today, moved deeper rather than deleted. |
| dd-002/dont-1 | PASS | Each step is measured by the question it answers, not its size. The table above assigns every chip one question and at most two fields; the two heads that could not fit — house property and capital gains — were split into two steps rather than crammed into one. |
| dd-002/dont-2 | PASS | Enumerated per chip in the table above. The largest single step is two fields and one concept. |
| dd-003/dont-1 | PASS | The takeaway is the break-even: the new regime is a bet on your deductions falling short of a computable number. A reader can apply that to next year's payslip without us. |
| dd-003/dont-2 | PASS | Correct slabs, surcharge, marginal relief and 87A are the price of admission. What is claimed here is only that the choice between the regimes is now stated as a decision with a boundary. |
| dd-004/dont-1 | N/A | |
| dd-004/dont-2 | PASS | A single assessment year, so there is no second money system to reconcile and the words are not needed. Recorded as PASS rather than N/A because one input does cross years — see dd-017/dont-1. |
| dd-005/dont-1 | PASS | One comparison named and on screen: old versus new. The heads are introduced as pushes on one side of it, each stating which way it pushes, rather than as a checklist of provisions to worry about. |
| dd-006/dont-1 | PASS | The sentence skeleton is fixed; only slotted values move. The verdict clause changes only when the winner genuinely changes, which is a different answer rather than a rewording of the same one. |
| dd-006/dont-2 | PASS | The regime difference — the lesson — is never behind a control: two adjacent columns, always both. The chips are additive disclosure of income the reader does or does not have, not two views of one difference. Presumptive, the one genuine alternative, is shown adjacently for exactly this reason. |
| dd-007/dont-1 | PASS | Three sizes, each asserting something: the monthly figure is largest because it is the answer; the two regime bills are equal to each other because they are the same quantity under two rules; the break-even line is smallest. |
| dd-007/dont-2 | PASS | This is sol-043, found live and fixed here. The losing bill used to render emerald at weight 900 against the winner's plain white 700, captioned DEFAULT and OPTIONAL. Every emphasis now comes from `applyVerdict()`: card ring, font weight, colour, both column headers and the tag. Verified live at four states including the two that were broken, and swept in `taxAnswer.test.ts`. |
| dd-008/dont-1 | PASS | Values live in fixed slots. The prose states the principle — the old regime pays you back for deductions, the new one does not — which is true at every value of every field. |
| dd-008/dont-2 | PASS | It states the boundary, not the position: the deduction total at which the regimes cross, marked on the deductions themselves. Not "you are currently claiming ₹3.9 lakh". |
| dd-009/dont-1 | PASS | The monthly figure states in the same breath that it is the annual bill over twelve and that a real TDS schedule is not level. And the one live instance this rule caught: the effective rate divides by total income, which a loss reduces, so a reader earning ₹15,00,000 was being told "income of ₹13,00,000". A reconciling clause now names the gap — "your ₹15,00,000 of income less ₹2,00,000 of losses" — and vanishes when there is nothing to explain. |
| dd-009/dont-2 | PASS | Nothing below is deleted to make room. The Answer adds the explanation the page lacked; the breakdown table survives intact as layer 3. |
| dd-010/dont-1 | PASS | The headline is the monthly bite, which is what a salaried person actually lives through. The annual total and the effective rate sit beside it as context rather than leading. |
| dd-012/dont-1 | N/A | |
| dd-012/dont-2 | PASS | The verdict line is a difference of two exact bills under two sets of rules, not of two averages, and the reader can picture it: rupees a month either way. |
| dd-012/dont-3 | PASS | The confusion this exists to end is measured and recorded as sol-043 — a badge reading OLD REGIME SAVES ₹53,300 beside the new regime's higher bill rendered as the greenest, boldest number on the page. One verdict now drives the badge, the weight, the colour, the column header and the sentence. |
| dd-013/dont-1 | PASS | No inputs of its own, no second reader, no second engine. It renders one `calculateIndiaTaxEngine` result from the single `readTaxInputs()` reader shipped in `f598870`, which is why that went in before any of this. |
| dd-013/dont-2 | PASS | To be asserted in a test, and against the rendered DOM as well as the engine: the Answer's bill IS the breakdown's total row and the badge's gap IS the difference between the two columns. Both were checked live during the reader extraction and hold; the test makes them stay held. |
| dd-017/dont-1 | PASS | The one input that crosses years is a loss carried forward. The law sets it off in flat rupees with no indexation, so a ₹5 lakh loss from seven years ago is set off as ₹5 lakh against income worth far less per rupee. The screen says so rather than letting it decay in silence — we cannot change the arithmetic, but we can refuse to hide it. |
| dd-017/dont-2 | PASS | Every field is asked in the unit the reader holds it in: annual salary as it appears on Form 16, rent as paid, turnover as billed. Nothing is asked as a rate or a share because the engine would prefer one. |
| dd-017/dont-3 | PASS | No mode question at the entry. The page does not ask "are you salaried or self-employed?" before it will say anything — it answers on salary alone and lets the reader add heads. The regime is stated as a comparison, never asked as a choice. |
| dd-017/dont-4 | N/A | |
| dd-017/dont-5 | N/A | |

## Deliberate choices

- **The verdict is computed, not phrased** — sol-040's mechanism, reused.
  Anything on the page asserting a preference renders from one verdict value.
  sol-043 is what the alternative looks like after two months of edits.
- **The entry is ONE field, not three.** sol-019 caps the entry at three; it
  does not require three. Gross salary alone produces a correct, useful answer
  for the large majority of readers, and every additional field would be one the
  reader has to decide is zero.
- **The break-even is the product, not the bill.** Two calculators already tell
  you your tax. The number worth carrying away is the one that says when the
  answer would flip.
- **Losses are last and deepest.** They are the only genuinely retrospective
  input on the page, and the only one where the reader needs a prior year's
  return in front of them.

## Verified on the live page

Not only in the suite — most of 16 Aug's defects were found by reading the
screen, and two more were found here the same way: sol-043's true severity (an
ordinary ₹2 lakh home loan, not a contrived maximum), and the unreconciled
"income of ₹13,00,000". A third was a plain UX fault — the loan interest field
stayed on screen under "Neither", so a reader could type a number that silently
did nothing. It is hidden with its property now.

## Open — for Rahul

- *(none yet — the 87A interaction with special-rate income is a statutory
  question to be researched and cited, not a judgement call, and is being
  treated as such rather than parked here.)*
