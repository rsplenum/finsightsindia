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
     — only those that can be adjusted [?] in dropdown-1
```

**Checked against the photo, and it settles the category question.** Sheet 2
reads `Business / Professional / Salaried / Self-employed / etc.` — and the
`etc.` is written on the sheet, so **the list is deliberately open, not a closed
set of four**. Sheet 1's "Services" is superseded rather than dropped: build the
categories as data, not as four hard-coded branches, because Rahul has said in
the drawing itself that more are coming.

Block (2) is not a third input block. It is an annotation on Dropdown 1, naming
what that dropdown contains — capital gains, futures and options, and the rest
of the income heads.

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
   Still unresolved on the same sheet: one word in block (2)'s note —
   *"only those that can be **[?]** in dropdown-1"*. Higher resolution did not
   crack it. The sense is clear enough (block 2 names what Dropdown 1 contains)
   that it does not block the build, but the exact verb is worth a glance from
   Rahul when he next passes this file.
2. **Name and Age — what are they for?** Age has a real computational job
   (60/80 thresholds under the old regime). Name has none, so presumably it is
   for the report or the PDF. Worth confirming it is not meant to do more.
3. **Is the two-panel split live-updating side by side with the inputs**, or
   does it sit below on narrow screens? The sketch is a desktop layout and the
   answer decides the mobile behaviour.
