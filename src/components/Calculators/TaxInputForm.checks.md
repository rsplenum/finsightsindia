# Design checks — TaxInputForm

**Written before the component.**

**Question:** *What do I have to tell you about my year?*

The left column of Rahul's sheet 2: Category, Name, Age, then Income built
additively and Deductions built additively. Its whole job is to collect facts.
It states no answer — the two panels beside it do that, and `TaxAnswer` above
them leads with the monthly bite (sol-019, rung 1).

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Nothing the current page can do is lost. All four of today's chips — house property, business, capital gains, losses — survive; their fields become catalogue entries or keep their own sub-panel. The long tail MOVES into a dropdown, and the dropdown is exhaustive within the eligible set. |
| dd-001/dont-2 | PASS | The entry is Category, Age and Salary. Everything else the reader ADDS. Three inputs is where the screen starts, not what it offers — the catalogue holds 19 income sources and 16 deductions and every one of them is reachable. |
| dd-002/dont-1 | PASS | Choosing from a dropdown reveals ONE labelled money field, not a section. The volume revealed per step is one control by construction. |
| dd-002/dont-2 | PASS | One control per addition. The only step that adds two is electing a presumptive basis, which brings its own selector — and that selector is the lesson (see dd-006/dont-2). |
| dd-003/dont-1 | N/A | This column states no takeaway at all. It collects facts; the panels beside it draw the conclusion. |
| dd-003/dont-2 | PASS | The screen never advertises how many sources it supports. The category question exists to make the list SMALLER, and the count is never shown to the reader as an achievement. |
| dd-004/dont-1 | N/A | Nothing here is projected forward. Every figure is this assessment year's, which is today's money by construction — the same reasoning already recorded as `dd-004/dont-2 PASS` in `TaxAnswer.checks.md`. |
| dd-004/dont-2 | N/A | Same reason: there is no second number system on this screen to name. |
| dd-005/dont-1 | RISK | This is the sharpest tension on the screen and it is Rahul's own: "the mechanics underneath will be complex & would clash but the UI to be simple & easy & intuitive." An exhaustive dropdown of 19 sources IS a list of things to worry about if it is presented as one. Three mitigations, and they are the design rather than decoration: (1) the category question removes what cannot apply BEFORE the reader ever sees the list; (2) only the common options are permanently visible, so the surface stays short; (3) the dropdown is grouped by the head it falls under and every entry carries one line the reader can act on. Recorded as RISK, not PASS, because it is a judgement to be checked on the built page rather than a property the markup guarantees. |
| dd-006/dont-1 | PASS | Changing category does not redraw a nearly identical form. It changes what the dropdown OFFERS; every field already on screen stays exactly where it was. |
| dd-006/dont-2 | PASS | The two regimes stay adjacent columns in the Tax Computation panel and never become a switch, and both presumptive bases are costed and shown at once — in both cases the difference IS the lesson. |
| dd-007/dont-1 | PASS | Two type sizes in this column: the field label and the value. Section headings share one style with each other and with the panels. |
| dd-007/dont-2 | PASS | Income and Deductions are siblings on the sheet and are drawn as siblings. Nothing is nested to look important. |
| dd-008/dont-1 | N/A | No sentence in this column changes as a control moves; the live prose lives in the panels. |
| dd-008/dont-2 | N/A | Nothing here describes the reader's current position. |
| dd-009/dont-1 | PASS | Where a claim is cut, the Income Computation panel prints claimed AND allowed with the reason on the same row (sol-056's per-section lines). A reader whose ₹4 lakh of 80C became ₹1.5 lakh is told so where it happened, not later. |
| dd-009/dont-2 | PASS | Every option keeps its one-line hint when it moves into the dropdown. Moving a capability out of sight is allowed; moving its explanation out of existence is not. |
| dd-010/dont-1 | N/A | This column headlines nothing. `TaxAnswer` is rung 1 and leads with the monthly bite. |
| dd-012/dont-1 | N/A | Nothing here is averaged. The tax engine is deterministic — there are no situations to average over. |
| dd-012/dont-2 | N/A | Same reason: no averages exist on this screen. |
| dd-012/dont-3 | RISK | The same risk as dd-005/dont-1, stated as its consequence: a correct form the reader cannot navigate has failed. To be checked on the built page at 1280×900 and on mobile, not asserted here. |
| dd-013/dont-1 | PASS | `readTaxInputs()` stays the one and only DOM reader (sol-026). This component adds fields whose ids the READER derives from the engine's own tables — `chapterVIAFieldId('80TTB')` — so a new field cannot exist that the reader does not know about. |
| dd-013/dont-2 | PASS | This is exactly why sol-059 deleted the duplicate home loan interest entry: it appeared as both an income source and a deduction, both writing `houseProperty.interest`, so one quantity could have stood on the page twice with two values. |
| dd-017/dont-1 | N/A | A tax return is one year. There is no multi-year input here to decay. |
| dd-017/dont-2 | PASS | The one place this genuinely bites is the business head, where three entries want three different units: 44AD takes TURNOVER, 44ADA takes GROSS RECEIPTS, and the books basis takes PROFIT. Asking for the engine's convenient unit without saying so would have a reader enter turnover where profit was wanted and be taxed on their revenue. Every hint states its unit outright — "Enter the receipts, not the profit." |
| dd-017/dont-3 | N/A | No mode question at the entry. |
| dd-017/dont-4 | N/A | No step-up on this screen. |
| dd-017/dont-5 | N/A | No goal and no contribution here. |
| dd-019/dont-1 | PASS | Every money field carries its own label on its own line, and every panel row is quantity-then-amount. No figure gets its noun from one block and its frame from another. |
| dd-019/dont-2 | PASS | One frame on this screen — this assessment year's rupees — and every row names its own quantity, so the frame is never doing the work of telling two figures apart. |
| dd-019/dont-3 | PASS | The disambiguation is the row's noun, not the frame. Two figures that share a frame are told apart by what they count. |
| dd-019/dont-4 | N/A | No heading here claims an equivalence. |
| dd-020/dont-1 | PASS | Enforced by test, not by care: `taxCatalogue.test.ts` fails on an exclusion with no statute, on an entry excluded from every category, and on any category that loses a whole head or falls below three quarters of all sources. A salaried filer is offered futures and options — dd-020's own worked example. |
| dd-020/dont-2 | RISK | **Name buys no simplification.** Age earns its place at the 60/80 thresholds and Category earns its place by removing the presumptive schemes; Name removes nothing and computes nothing. It is on Rahul's sheet, so it is built — optional, and labelled as being for the report rather than for the answer. Flagged to Rahul rather than silently dropped or silently included; it is already listed as an open reading in the sketch transcription. |
| dd-020/dont-3 | PASS | Two mechanisms, because this is the rule most easily broken by accident. Structurally: `tax.ts` cannot import `taxCatalogue.ts` and a test asserts it. Behaviourally: **switching category never removes a value the reader has already entered** — a field that becomes ineligible stays on screen carrying the statute that now excludes it, for the reader to remove or not. Deleting it would change the computed answer, which is precisely what this rule forbids. |
| dd-021/dont-1 | PASS | The regime comparison is a verdict, and sol-043 already made every emphasis on the page flow from one `verdictFor()` — card ring, weight, colour, column headers and tag. The screen is as willing to print "old regime" as "new". |
| dd-021/dont-2 | RISK | Same instance as dd-020/dont-2: Name cannot change the verdict. Recorded twice on purpose, because the two rules catch it for different reasons — dd-020 says it buys no simplification, dd-021 says it cannot move the answer. |
| dd-021/dont-3 | PASS | `TaxAnswer` states the cheaper regime outright, in a sentence, above this form. The reader is not handed two columns and left to subtract. |

## Deliberate choices

- **A field that becomes ineligible is KEPT, not deleted.** If a reader adds
  "Business profit" and then switches Category to Salaried, the field stays,
  carrying the statute that now excludes it. Deleting it would silently change
  the tax — dd-020/dont-3 — and the reader would watch their bill move for a
  reason the screen never gave. The category decides what the form OFFERS;
  it has no opinion about what the reader has already told us.

- **Entries that share a target SUM.** F&O profit, intraday profit and a shop's
  profit all land in `business.netProfit`, because that is what a head does. The
  alternative — last writer wins — would drop rupees in silence.

- **Home loan interest is a deduction, not an income source.** It is one thing in
  the Act and two things in a reader's head. Rahul's sheet puts it under
  Deductions and so does this form; the engine's house-property head is where it
  lands. sol-059.

- **Name is built because Rahul drew it**, marked optional and labelled for the
  report. Flagged above under dd-020/dont-2 rather than resolved unilaterally.
