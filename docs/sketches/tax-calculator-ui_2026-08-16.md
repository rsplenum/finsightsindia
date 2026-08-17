# Tax calculator — UI design · Rahul's sketches, 16 Aug 2026

Two sketches, handed over on 16 Aug. This is the transcription, written before
anything is built from it, per `README.md`.

**Source: [`tax calculator idea UI design.jpeg`](tax%20calculator%20idea%20UI%20design.jpeg)** — sheet 2, placed in this
folder by Rahul on 16 Aug and checked against this transcription. **Sheet 1 is
still only a reading**; its photo has not been dropped here, so where the two
sheets differ, sheet 2 is the one that can be verified.

Anything marked **[?]** is handwriting I could not resolve with confidence and
should be confirmed before it drives code.

---

## Sheet 2 — "TAX CALCULATOR · UI Design · Income Computation"

The later and more complete of the two. It supersedes sheet 1 where they differ.

### Left column — the inputs

```
Category = [ Business / Professional / Salaried / Self-employed / etc. ]
Name     = ______
Age      = ______

(1)  Income sources  =  Salary        ______
                     +  Dropdown 1    ______
                     +  =             ______
                     +  =             ______
                        etc.

(3)  Deductions      =  Std. Deduction ______
                     +  Dropdown 2     ______
                     +  =              ______
                     +  =              ______
                        etc.

(2)  Capital Gain
     Futures & options
     etc.
     — only those that can't be clubbed in dropdown-1
```

**The illegible verb was read back by Rahul on 17 Aug: "clubbed", and the
sentence is NEGATIVE.** That reverses the reading below, so the original is left
struck through rather than quietly corrected.

**Checked against the photo, and it settles the category question.** Sheet 2
reads `Business / Professional / Salaried / Self-employed / etc.` — and the
`etc.` is written on the sheet, so **the list is deliberately open, not a closed
set of four**. Sheet 1's "Services" is superseded rather than dropped: build the
categories as data, not as four hard-coded branches, because Rahul has said in
the drawing itself that more are coming.

~~Block (2) is not a third input block. It is an annotation on Dropdown 1, naming
what that dropdown contains — capital gains, futures and options, and the rest
of the income heads.~~

**Wrong, and wrong in the direction that would have cost the most.** With the
verb resolved — *"only those that can't be **clubbed** in dropdown-1"* — block (2)
is the opposite of an annotation on Dropdown 1. **It is a separate input block,
and it exists precisely because these items cannot be clubbed.**

"Clubbed" is the word that matters, and it names a real mechanic. Dropdown 1's
sources ADD UP: salary, pension and arrears are one figure to the slabs, and
five different kinds of business income are one profit. Capital gains cannot
join them — each bucket carries its own rate (20% under s.111A, 12.5% under
s.112A with its own exemption, slab rate for short-term gains on other assets),
so summing them would destroy the only thing the arithmetic cares about. F&O is
business income but carries loss rules the other business sources do not share.

So the layout has THREE input blocks, not two: Income sources (clubbable),
Deductions, and a separate block for what must be kept apart. This agrees with
how `tax.ts` is already built — four capital-gains buckets by rate, not one
figure — and it agrees with the rule sol-059 arrived at independently, that
catalogue entries sharing a `target` sum into it. Rahul's note is the same
observation from the reader's side: some things club, some cannot, and the form
must not pretend otherwise.

### Right column — the outputs, and there are TWO of them

```
+-------------------------+        +-------------------------+
|   Income Computation    |        |    Tax Computation      |
|   ....  ....  ____      |        |    ....  ....  ____     |
|   ....  ....  ____      |        |    ....  ....  ____     |
+-------------------------+        +-------------------------+
```

This is the most significant addition over sheet 1, which had only a single
"Tax computation" panel. The sheet's own title carries it too: *UI Design —
**Income Computation***. The income build-up gets its own panel, separate from
the tax working, so the reader can follow gross income through to taxable
income before any tax is applied to it.

### The note at the bottom, which is the actual brief

> "The dropdowns will have exhaustive sources of money & deductions category
> wise. The mechanics underneath will be complex & would clash [?] but the UI
> to be simple & easy & intuitive."

Two requirements, and they pull against each other on purpose:

1. **Exhaustive, category-wise.** Not a curated shortlist. Within what a
   category is eligible for, the dropdown lists everything.
2. **The UI stays simple, easy and intuitive** while the mechanics underneath
   stay complex.

That is `dd-001` stated again in Rahul's own words, applied to this screen —
the complexity is not reduced, it is absorbed into the packaging. It has been
recorded against dd-001 as a reinforcing instance rather than as a new entry,
because duplicating a rule weakens both copies.

Together with `dd-020` the input contract is now fully specified:

| Question | Answer |
|---|---|
| What does Category remove? | Only what is **inapplicable**, never what is merely unlikely (dd-020) |
| How full is the dropdown? | **Exhaustive** within the eligible set |
| What stays on screen? | "only the most common options should be permanently visible" |
| Where does the complexity go? | Underneath. The UI stays simple, easy, intuitive (dd-001) |

---

## Sheet 1 — the earlier version

Same skeleton, one output panel, categories listed as Business / Professional /
Salaried / Services. Superseded by sheet 2, recorded here so the progression is
legible: the split into Income Computation and Tax Computation is the thing
that changed, and it changed deliberately.

---

## Open, before this is built

1. ~~Does "Services" survive?~~ **Settled by the photo:** the sheet ends the
   list with `etc.`, so the categories are open-ended. Model them as data.
   ~~One word in block (2)'s note is unresolved.~~ **Settled by Rahul, 17 Aug:
   "clubbed", and negatively — *"only those that can't be clubbed in
   dropdown-1"*.** This was the item recorded as "does not block the build", and
   that judgement was wrong: the agent's reading had block (2) as an annotation
   ON Dropdown 1, when it is a SEPARATE BLOCK for what Dropdown 1 cannot hold.
   Building from the wrong reading would have summed four capital-gains buckets
   into one figure and destroyed the rates. **A [?] that changes a layout is not
   a footnote** — the README's rule (transcribe and read back before building)
   earned its place here.
2. ~~**Name and Age — what are they for?**~~ **Settled by Rahul, 17 Aug: "name
   is not necessary".** Age keeps its computational job at the 60/80 thresholds.
   Name is dropped from the form. It had been filed as a RISK in
   `TaxInputForm.checks.md` against dd-020/dont-2 and dd-021/dont-2 and
   escalated rather than decided; recorded as a reinforcing instance on dd-020.
3. **Is the two-panel split live-updating side by side with the inputs**, or
   does it sit below on narrow screens? The sketch is a desktop layout and the
   answer decides the mobile behaviour.
