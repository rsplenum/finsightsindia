# Design checks — TaxComputation

**Written before the component.**

**Question:** *How does my taxable income turn into a bill?*

The second output panel on Rahul's sheet 2. It starts where
`TaxIncomeComputation` stops — at total income, already split into the part the
slabs work on and the part taxed at its own rates — and carries it down through
the rebate, the surcharge and the cess to the figure the reader owes.

It states the working, not the verdict. `TaxAnswer` is rung 1 and says which
regime is cheaper in a sentence; this panel shows why that is true.

## Doctrine rules — answered

PASS and RISK need a reason. N/A may stand alone.

| rule | verdict | why |
|---|---|---|
| dd-001/dont-1 | PASS | Every tax row of today's breakdown table survives — slab tax, tax on gains at their own rates, the rebate, surcharge, marginal relief, cess and the total. The panel adds the slab-by-slab working, which the engine has always returned and the page has never shown. |
| dd-001/dont-2 | N/A | The panel takes no input. |
| dd-002/dont-1 | PASS | The rows that carry nothing are absent, so a reader with no gains and no surcharge sees four rows rather than nine. The slab working is one disclosure, closed by default, and it is the only thing on the panel that unfolds. |
| dd-002/dont-2 | PASS | One disclosure and nothing else. Opening it reveals a table of the statutory slabs, which is one concept, not two. |
| dd-003/dont-1 | PASS | The takeaway is the sequence — what the slabs charged, what the rebate gave back, what the cess added — rather than the total at the bottom, which the reader already met as a sentence in rung 1. |
| dd-003/dont-2 | PASS | Nothing here advertises what the engine can do. It shows only what this reader's figures actually produced. |
| dd-004/dont-1 | N/A | Nothing is projected forward, so there is no second number system to reconcile. |
| dd-004/dont-2 | N/A | Same reason: one money, this assessment year's. |
| dd-005/dont-1 | PASS | Rows appear because a charge or a relief actually applied. A reader with no surcharge is never shown a surcharge row standing at zero, so the panel cannot read as a catalogue of charges that might have hit them. |
| dd-006/dont-1 | PASS | Two adjacent regime columns of one table, sharing every row label. Nothing is swapped for a near-identical version of itself. |
| dd-006/dont-2 | PASS | The regime difference is the lesson of the whole page, so both columns are always present and neither sits behind a control. The rebate row is where this earns its place: the two regimes give it at different thresholds and the columns say so side by side. |
| dd-007/dont-1 | PASS | Two sizes. The rows share one, and the total line is the same size at a heavier weight above a rule, which is what a total means. |
| dd-007/dont-2 | PASS | The only hierarchy is the order of the computation itself, which is the statute's order and not a visual one we invented. |
| dd-008/dont-1 | PASS | Row labels are fixed and only the figures move. Where a row needs a sentence — marginal relief, which is the least familiar line on the panel — the sentence states what marginal relief IS, which stays true at every input. |
| dd-008/dont-2 | PASS | It reports what the arithmetic did, never where the reader stands relative to anyone else or to a threshold they have not crossed. |
| dd-009/dont-1 | PASS | Every figure follows from the rows above it, and the two that historically did not now do: tax on gains at their own rates has its own row rather than hiding inside base tax, and the rebate is subtracted where the reader can see it rather than being netted into the slab figure. |
| dd-009/dont-2 | PASS | The panel is shortened by dropping rows that carry no figure, never by dropping the explanation of a row it does show. |
| dd-010/dont-1 | N/A | This panel headlines nothing. Rung 1 leads with the monthly bite. |
| dd-012/dont-1 | N/A | Nothing is averaged. The engine is deterministic. |
| dd-012/dont-2 | N/A | Same reason: there are no averages on this panel. |
| dd-012/dont-3 | RISK | Surcharge, marginal relief and cess are three concepts most filers have never had to hold at once, and a correct table of them can still leave a reader none the wiser. Mitigated by showing a row only when it bit, and by giving marginal relief a plain sentence rather than a figure alone. Filed as RISK because whether it lands is a judgement about the built page, not something the markup can promise. |
| dd-013/dont-1 | PASS | No inputs, no worker, no arithmetic of its own. It is filled from the same single engine result as `TaxAnswer` and `TaxIncomeComputation`. |
| dd-013/dont-2 | PASS | Each quantity appears once across the two panels. This one starts at tax and never restates an income figure, so total income cannot stand on the page twice with two values. |
| dd-017/dont-1 | N/A | One assessment year. Nothing here decays. |
| dd-017/dont-2 | PASS | Rupees on every row. The slab percentages appear only inside the slab working, where the rate is the thing being explained rather than a substitute for the amount. |
| dd-017/dont-3 | N/A | No mode question at the entry to this panel. |
| dd-017/dont-4 | N/A | No step-up on this panel. |
| dd-017/dont-5 | N/A | No goal and no contribution here. |
| dd-019/dont-1 | PASS | One label, one amount, one line, per regime column. A relief is drawn as a negative amount on its own row rather than as a note attached to the row it reduces. |
| dd-019/dont-2 | PASS | One frame, this assessment year's rupees, and every row names its own quantity. |
| dd-019/dont-3 | PASS | Rows are told apart by what they count and columns by which regime they belong to. The frame does no disambiguating work at all. |
| dd-019/dont-4 | N/A | No heading here claims that two figures are the same money re-expressed. |
| dd-020/dont-1 | N/A | The panel offers nothing, so it can hide nothing. |
| dd-020/dont-2 | N/A | It asks no questions. |
| dd-020/dont-3 | PASS | It renders from the engine result alone and has no notion of a category, so switching category cannot move a figure on it. |
| dd-021/dont-1 | PASS | Both columns are drawn identically and the panel argues for neither regime. The winner's emphasis comes from the page's one `verdictFor()`, which is what sol-043 exists to guarantee. |
| dd-021/dont-2 | N/A | The panel asks for nothing. |
| dd-021/dont-3 | PASS | The reader is not left to compare two columns and infer a winner. Rung 1 says which regime is cheaper in a sentence, and this panel is the working behind that sentence. |
| dd-022/dont-1 | N/A |  |
| dd-022/dont-2 | N/A |  |
| dd-022/dont-3 | N/A |  |
| dd-022/dont-4 | N/A |  |
| dd-023/dont-1 | RISK | Same as its sibling panel: designed as the right-hand column of a 1280 layout. Being reworked in the pass that rebuilds the form, and recorded here as a fault of order rather than of output. |
| dd-023/dont-2 | PASS | Every figure is rendered in place. The explanatory line under a control is visible prose rather than a hover tooltip, so nothing the reader needs is behind a pointer. |
| dd-023/dont-3 | RISK | Both regimes sit in one table beside each other, and the slab working sits as two ladders side by side that become two stacked ladders on a phone - which is further apart than a comparison wants to be. Owed a judgement at 375. |
| dd-024/dont-1 | PASS | Same as its sibling panel: it appears only once there is something to compute, so it is never a lone element on an empty page. |
| dd-024/dont-2 | N/A |  |
| dd-024/dont-3 | PASS | It appears with the working rather than sitting in the layout waiting to be filled, which is the reorganisation this rule asks for. |

## Deliberate choices

- **The rebate is a row, not a subtraction someone did off-screen.** It used to
  be netted into the base-tax figure, which made the column stop reconciling.
  Under the new regime it is the single largest thing that happens to a middle
  income filer's bill and it deserves to be visible.

- **Marginal relief carries a sentence.** It is the one line on the panel whose
  name explains nothing. The sentence states the principle — that crossing a
  surcharge threshold must never cost more than the income that crossed it —
  which is true at every input, so it is a fixed sentence rather than a
  rewritten one.

- **The slab working is a disclosure, closed.** The engine has always returned
  it and the page has never shown it. It is the answer to the reader who asks
  which slab their last rupee fell in, and it is genuinely optional to everyone
  else, which is exactly what a disclosure is for.

- **A row that did not bite is absent, not zero.** A surcharge row at nil tells
  the reader that surcharge is a thing that might happen to them and nothing
  else. The two rows that are always present are the slab tax and the total,
  because those are the computation.
