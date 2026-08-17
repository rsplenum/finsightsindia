# Design checks — TaxIncomeComputation

**Written before the component.**

**Question:** *What happened to my money before any tax touched it?*

The first of the two output panels on Rahul's sheet 2, and the reason the sheet
exists at all: the income build-up gets its own panel, so the reader follows
gross income through to taxable income **before** a rate is applied to anything.
It states no tax. `TaxComputation` starts where this one stops, and `TaxAnswer`
above both of them leads with the monthly bite (sol-019, rung 1).

Its shape mirrors the form's, deliberately: the slab pot first (what clubs),
then the gains taxed on their own terms (what cannot), because a reader who has
just filled in three blocks should recognise the arithmetic as the same three
blocks.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Every income row of today's breakdown table survives, and the panel ADDS what the page could never show: a line per Chapter VI-A section with claimed, allowed, the ceiling that applied and the reason a claim was cut. Nothing is dropped to make room for it. |
| dd-001/dont-2 | N/A | The panel takes no input at all. |
| dd-002/dont-1 | PASS | The volume shown tracks what the reader actually declared: a row exists only where a figure does. A salaried reader with a salary and 80C sees six rows, not thirty. |
| dd-002/dont-2 | N/A | There are no controls on this panel. |
| dd-003/dont-1 | PASS | The takeaway is the shape of the arithmetic rather than a figure, and every cut claim carries its reason in words on its own row. The page's takeaway as a sentence is `TaxAnswer`'s job, one rung above. |
| dd-003/dont-2 | PASS | It never says how many sections it can price. Thirteen sections exist and the reader sees only the ones they claimed. |
| dd-004/dont-1 | N/A | Nothing here is projected forward, so there is no second number system to reconcile. |
| dd-004/dont-2 | N/A | Same reason: one money, this assessment year's. |
| dd-005/dont-1 | PASS | A row appears because the reader declared something, never because they might have. The panel is a record of what they told us, so it cannot read as a list of reliefs they are missing. |
| dd-006/dont-1 | PASS | Both regimes are two adjacent columns of one table, never two texts swapped by a control. The rows are shared; only the figures differ. |
| dd-006/dont-2 | PASS | The difference between the regimes IS the lesson, and this panel is where it becomes legible: each Chapter VI-A line says in words that s.115BAC withdrew the section, so the reader sees WHY the columns diverge rather than only that they do. |
| dd-007/dont-1 | PASS | Two sizes only. Rows and subtotals share a size; a subtotal is marked by weight and a rule above it, which is what a subtotal means. |
| dd-007/dont-2 | PASS | The only hierarchy drawn is the statute's own: heads, then gross total income, then Chapter VI-A, then total income. Nothing is nested to look more important than it is. |
| dd-008/dont-1 | PASS | No standing sentence is rewritten as a figure moves. What changes is whether a row is present; a row that says a claim was capped by the section's ceiling is true whenever it is shown and absent when it is not. |
| dd-008/dont-2 | PASS | The panel reports what happened to figures the reader entered. It never narrates their position or tells them how they are doing. |
| dd-009/dont-1 | PASS | This is the panel's entire reason for existing. Every subtotal follows from the rows above it, losses set against income get their own reconciling row so the column always adds up, and a claim allowed at less than it was claimed says so on the same line rather than being absorbed into a total. |
| dd-009/dont-2 | PASS | Nothing is shortened by deleting an explanation. The engine's per-section reasons are carried through verbatim; they are the explanation. |
| dd-010/dont-1 | N/A | This panel headlines nothing. Rung 1 leads with the monthly bite. |
| dd-012/dont-1 | N/A | Nothing is averaged. The tax engine is deterministic. |
| dd-012/dont-2 | N/A | Same reason: there are no averages on this panel. |
| dd-012/dont-3 | RISK | A complete computation is exactly the artefact that can be arithmetically perfect and unreadable, and this one has more rows than anything else on the page. Three mitigations, and they are the design: rows appear only where there is a figure, the panel's order is the form's order so the reader is reading back their own answers, and each block ends in a named subtotal so the eye has somewhere to stop. Filed as RISK because it is a judgement to be checked on the built page at 1280x900 and on mobile, not a property the markup guarantees. |
| dd-013/dont-1 | PASS | The panel has no inputs, no worker and no arithmetic. It is filled by the page's one script from the one engine result that also fills `TaxAnswer` and `TaxComputation`. |
| dd-013/dont-2 | PASS | Each quantity appears once. `TaxComputation` deliberately starts at tax rather than restating taxable income, so the two panels cannot show one number twice with two values. |
| dd-017/dont-1 | N/A | A return covers one year. There is no multi-year input here to decay. |
| dd-017/dont-2 | PASS | Every row is rupees, which is the unit the reader thinks in. The statutory rates appear only as the name of a bucket beside the rupees they produced, never instead of them. |
| dd-017/dont-3 | N/A | No mode question, and no interpretation to state. |
| dd-017/dont-4 | N/A | No step-up on this panel. |
| dd-017/dont-5 | N/A | No goal and no contribution here. |
| dd-019/dont-1 | PASS | Every row is one label and one amount on one line, per regime column. No figure takes its noun from one place and its frame from another. |
| dd-019/dont-2 | PASS | There is one frame on the panel, this assessment year's rupees, and every row names its own quantity, so the frame never has to tell two figures apart. |
| dd-019/dont-3 | PASS | Two figures that share the frame are told apart by the row's noun and by the column head naming its regime, not by the frame. |
| dd-019/dont-4 | N/A | No heading here claims an equivalence between two expressions of one sum. |
| dd-020/dont-1 | N/A | The panel offers nothing, so it can hide nothing. |
| dd-020/dont-2 | N/A | It asks no questions. |
| dd-020/dont-3 | PASS | It renders from the engine result and never consults the category. A reader who switches category sees the same computation on the same facts, which is the rule stated as a property of this component rather than only of the engine. |
| dd-021/dont-1 | PASS | Both regime columns are drawn identically and the panel argues for neither. What emphasis exists is applied by the page's one `verdictFor()`, which is sol-043's whole point. |
| dd-021/dont-2 | N/A | The panel asks for nothing. |
| dd-021/dont-3 | PASS | The conclusion is not left to the reader: `TaxAnswer` states the cheaper regime in a sentence above this panel, and this panel exists to show the working behind it rather than to replace it. |
| dd-022/dont-1 | N/A |  |
| dd-022/dont-2 | N/A |  |
| dd-022/dont-3 | N/A |  |
| dd-022/dont-4 | N/A |  |
| dd-023/dont-1 | RISK | The panel was designed as the right-hand column of a 1280 layout and stacks below the form on a phone. That is the wrong order of design under dd-023, and it is being reworked in the same pass that rebuilds the form. Filed rather than back-dated to a pass. |
| dd-023/dont-2 | PASS | Every figure is rendered in place. The explanatory line under a control is visible prose rather than a hover tooltip, so nothing the reader needs is behind a pointer. |
| dd-023/dont-3 | RISK | Three columns of figures - the item and both regimes - is the artefact dd-023 names. It fits at 375 without overflow, but fitting is not reading, and this is the longest table on the site. The judgement is owed on a phone. |

## Deliberate choices

- **The panel's shape is the form's shape.** Slab income first, gains taxed on
  their own terms second, because that is the split Rahul drew on the input
  side and a reader should not have to learn a second taxonomy to read their
  own answers back.

- **A losses row is computed as the residual, and only shown when it exists.**
  The set-off rules can reduce gross total income by an amount that appears in
  no head. Without a reconciling row the column silently stops adding up, which
  is dd-009/dont-1 in its purest form.

- **Chapter VI-A prints claimed AND allowed, never only allowed.** sol-041's
  lesson at the level of a deduction: a reader whose four lakh of 80C became one
  and a half must be told where it went, on the row where it happened.

- **A section standing at zero is not printed.** The engine distinguishes a
  section never claimed from one claimed as nothing, and both are worth nothing.
  Printing every permanently visible deduction at zero would fill the panel with
  rows that say only that the reader left a box empty.
