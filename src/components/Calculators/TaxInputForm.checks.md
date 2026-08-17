# Design checks — TaxInputForm

**Written before the component.** Rewritten 18 Aug, before the rebuild, when
Rahul overturned the reading this file was first written against.

**Question:** *What do I have to tell you about my year?*

**THE FORM OPENS AT ONE CONTROL.** Category, and nothing else on the screen.
Answer it and one field appears — the primary field for that category — with an
add control below it. Every other field in the form arrives because the reader
asked for it, lands where the add control was, and pushes the add control down.

That is dd-022, recorded 18 Aug from Rahul's own words, and it is a correction
to the first version of this file. That version read "only the most common
options should be permanently visible" as *a set of fields*, and shipped a form
with ten boxes standing at zero before the reader had typed anything. The number
is one. A box at zero is not free: it is a question the reader has to read,
understand and decide does not apply to them.

The screen states no answer. The two panels beside it do that, and `TaxAnswer`
above them leads with the monthly bite (sol-019, rung 1).

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing the page could do is lost. All 69 catalogue entries stay reachable; what changed is that they are reached through an add control rather than found on screen. The surface shrank and the offering did not, which is the distinction the whole architecture rests on. |
| dd-001/dont-2 | PASS | The entry is ONE question and one field, and that is the entry, not the offering. 41 income sources and 28 deductions are one tap away, grouped by the head they fall under. |
| dd-002/dont-1 | PASS | Volume revealed per step is exactly one labelled field. Answering the category reveals one field and one control; adding a source reveals one field. There is no step in this form that reveals a section. |
| dd-002/dont-2 | PASS | One control per step, by construction. The only step that brings a second is electing a presumptive basis, which brings its own selector — and that selector is the lesson (dd-006/dont-2). |
| dd-003/dont-1 | N/A | This column states no takeaway at all. It collects facts; the panels beside it draw the conclusion. |
| dd-003/dont-2 | PASS | The screen never says how many sources it supports. The category question exists to make the list smaller, and the count is never shown to the reader as an achievement. |
| dd-004/dont-1 | N/A | Nothing here is projected forward. Every figure is this assessment year's, which is today's money by construction. |
| dd-004/dont-2 | N/A | Same reason: there is no second number system on this screen to name. |
| dd-005/dont-1 | PASS | Was RISK, and dd-022 is what closed it. The tension Rahul named — "the mechanics underneath will be complex and would clash but the UI to be simple and easy and intuitive" — was mitigated by grouping and hints while ten fields still sat on screen, which is a list of worries however well it is grouped. A form that shows one field cannot read as a list of things to worry about, because there is no list. |
| dd-006/dont-1 | PASS | Changing category does not redraw a nearly identical form. It changes what the add control OFFERS; every field the reader has already answered stays exactly where it was. |
| dd-006/dont-2 | PASS | The two regimes stay adjacent columns in the panels and never become a switch, and both presumptive bases are costed and shown at once — in both cases the difference IS the lesson. |
| dd-007/dont-1 | PASS | Two type sizes in this column: the field label and the value. Block headings share one style with each other and with the panels. |
| dd-007/dont-2 | PASS | Income, what is kept apart, and deductions are siblings on Rahul's sheet and are drawn as siblings. Nothing is nested to look important. |
| dd-008/dont-1 | N/A | No sentence in this column changes as a control moves; the live prose lives in the panels. |
| dd-008/dont-2 | N/A | Nothing here describes the reader's current position. |
| dd-009/dont-1 | PASS | Where a claim is cut, the Income Computation panel prints claimed AND allowed with the reason on the same row (sol-056's per-section lines). A reader whose four lakh of 80C became one and a half is told so where it happened. |
| dd-009/dont-2 | PASS | Every option keeps its one-line hint, and the hint travels with it into the add control's list. Moving a capability out of sight is allowed; moving its explanation out of existence is not. |
| dd-010/dont-1 | N/A | This column headlines nothing. `TaxAnswer` is rung 1 and leads with the monthly bite. |
| dd-012/dont-1 | N/A | Nothing here is averaged. The tax engine is deterministic. |
| dd-012/dont-2 | N/A | Same reason: no averages exist on this screen. |
| dd-012/dont-3 | PASS | Was RISK, on the same instance dd-005/dont-1 was. A reader cannot be lost in a form that is one question long and grows only where they are looking. The remaining judgement is about the panels, and it is filed there rather than duplicated here. |
| dd-013/dont-1 | PASS | `readTaxInputs()` stays the one and only DOM reader (sol-026). Field ids are derived from the catalogue by the reader itself, so a field cannot exist that the reader does not know about. |
| dd-013/dont-2 | PASS | This is why sol-059 deleted the duplicate home loan interest entry: it appeared as both an income source and a deduction, both writing `houseProperty.interest`, so one quantity could have stood on the page twice with two values. |
| dd-017/dont-1 | N/A | A tax return is one year. There is no multi-year input here to decay. |
| dd-017/dont-2 | PASS | The business head is where this bites: 44AD takes TURNOVER, 44ADA takes GROSS RECEIPTS, the books basis takes PROFIT. Every hint states its unit outright — "Enter the receipts, not the profit" — because asking for the engine's convenient unit would have a reader taxed on their revenue. |
| dd-017/dont-3 | N/A | No mode question at the entry. |
| dd-017/dont-4 | N/A | No step-up on this screen. |
| dd-017/dont-5 | N/A | No goal and no contribution here. |
| dd-019/dont-1 | PASS | Every money field carries its own label on its own line, and every panel row is quantity-then-amount. No figure gets its noun from one block and its frame from another. |
| dd-019/dont-2 | PASS | One frame on this screen — this assessment year's rupees — and every row names its own quantity, so the frame is never doing the work of telling two figures apart. |
| dd-019/dont-3 | PASS | The disambiguation is the field's own label, not the frame. Two figures that share a frame are told apart by what they count. |
| dd-019/dont-4 | N/A | No heading here claims an equivalence. |
| dd-020/dont-1 | PASS | Enforced by test, not by care: `taxCatalogue.test.ts` fails on an exclusion with no statute, on an entry excluded from every category, and on any category that loses a whole head or falls below three quarters of all sources. A salaried filer is offered futures and options — dd-020's own worked example. |
| dd-020/dont-2 | PASS | Category and Age are the only two questions the form asks of its own accord, and both do work: Category removes what the statute forbids, Age moves the exemption at 60 and 80. Name was dropped on 17 Aug because it removed nothing and computed nothing. |
| dd-020/dont-3 | PASS | Two mechanisms, because this is the rule most easily broken by accident. Structurally: `tax.ts` cannot import `taxCatalogue.ts` and a test asserts it. Behaviourally: switching category never removes a value the reader has entered — an answered field stays on screen carrying the statute that now excludes it. |
| dd-021/dont-1 | PASS | The regime comparison is a verdict, and sol-043 made every emphasis on the page flow from one `verdictFor()`. The screen is as willing to print "old regime" as "new". |
| dd-021/dont-2 | PASS | Every question the form asks can change the verdict. This got stronger under dd-022, not weaker: a field the reader never adds cannot ask them anything at all. |
| dd-021/dont-3 | PASS | `TaxAnswer` states the cheaper regime outright, in a sentence, above this form. The reader is not handed two columns and left to subtract. |
| dd-022/dont-1 | PASS | The entry state is one control and zero fields. After the category is answered it is one field — the primary one for that category — and nothing else appears until the reader asks for it. |
| dd-022/dont-2 | PASS | This file's own previous version is the instance the rule was written from, so the answer is a correction rather than a claim: the number is one, and it is the field the category implies. `common` is gone from the catalogue and `primaryFor` has replaced it, so the old reading cannot be re-derived from the data. |
| dd-022/dont-3 | PASS | The reader builds it. Fields are appended in the order they are ADDED rather than in catalogue order, so the form reads as a record of the conversation they just had with it. |
| dd-022/dont-4 | PASS | The add control is the last child of its block, and a newly added field is appended before it — so the control lands under whatever was just added, which is where the reader is already looking. |
| dd-023/dont-1 | PASS | The single column is the design here, not the fallback. One question, then one field, then one control is the same shape at 375 and at 1280; what the wide screen buys is the panels sitting beside the form instead of below it, which is the layout becoming more than itself rather than the phone getting less. |
| dd-023/dont-2 | PASS | No hover anywhere. Every hint is visible prose under its field, the statute on an excluded field is a visible line, and the add control is a native select — which is the one control a phone renders as a full-screen picker for free. |
| dd-023/dont-3 | PASS | Nothing in this column is a side-by-side comparison. The one place two things sit next to each other is the presumptive election, and it is a stack of three labelled rows rather than columns. |
| dd-024/dont-1 | PASS | The form is no longer what the reader lands on. `TaxIntro` says what the page does and asks the category; the form appears when that is answered, so the screen at rest is a welcome rather than a lone select in an empty grid. |
| dd-024/dont-2 | PASS | The category question moved OUT of this component and into the welcome for exactly this reason. dd-022 governs what the form asks; it never licensed the page to say nothing about what the reader had arrived at. |
| dd-024/dont-3 | PASS | Answering the category collapses the welcome and resolves the page into this form and the working beside it. The choice is then restated compactly at the top of the form so it can be changed without going back to a screen that no longer exists. |

## Deliberate choices

- **One field, chosen by category — and it is data.** `primaryFor` on the
  catalogue entry, not a branch in the component, because the sheet ends its
  category list with `etc.` in Rahul's own hand. Salaried opens on Salary,
  Business and Professional on profit from your books, Self-employed on
  freelance or contract income. **`businessBooks` loses the word "Business"
  from its label** — a practising doctor reading "Business profit" as the one
  question on their screen would hesitate, and the same field serves all three.

- **`common` is deleted rather than reinterpreted.** It encoded the reading
  dd-022 overturned. Leaving it in the catalogue with a new meaning would let
  the old meaning be re-derived by the next person to read it, which is dd-012's
  failure exactly.

- **Deductions and the kept-apart block open with no field at all.** There is no
  primary deduction: the standard deduction is applied by the engine without
  being asked and is stated as a fact rather than as a box. And nobody has a
  capital gain by default. "Same for deductions" means the same MECHANIC, and
  the mechanic is that a field exists because the reader asked for it.

- **A field that becomes ineligible is KEPT, not deleted.** If a reader adds
  "Profit from your books" and then switches Category to Salaried, the field
  stays, carrying the statute that now excludes it. Deleting it would silently
  change the tax — dd-020/dont-3 — and the reader would watch their bill move
  for a reason the screen never gave. The category decides what the form OFFERS;
  it has no opinion about what the reader has already told us. An UNANSWERED
  field that stops being offered goes quietly, because it moves no money.

- **Entries that share a target SUM.** F&O profit, intraday profit and a shop's
  profit all land in `business.netProfit`, because that is what a head does. The
  alternative — last writer wins — would drop rupees in silence.

- **Home loan interest is a deduction, not an income source.** It is one thing
  in the Act and two things in a reader's head. Rahul's sheet puts it under
  Deductions and so does this form; the engine's house-property head is where it
  lands. sol-059.

- **THREE input blocks, not two** — settled 17 Aug when Rahul read back the one
  illegible word on his sheet: *"only those that can't be **clubbed** in
  dropdown-1"*. Dropdown 1's sources ADD UP. Capital gains cannot join them —
  each bucket carries its own rate — and the catalogue says so entry by entry in
  a reason string rather than a boolean.
