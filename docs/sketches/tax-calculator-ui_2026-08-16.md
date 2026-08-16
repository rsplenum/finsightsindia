# Tax calculator — UI design · Rahul's sketches, 16 Aug 2026

Two sketches, handed over on 16 Aug. This is the transcription, written before
anything is built from it, per `README.md`. **The images themselves are not in
the repo** — they were pasted into a conversation, and a pasted image cannot be
written to disk from there. Drop the two JPGs into this folder when convenient;
this file is the reading, not a replacement for the source.

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

`Self-employed` is new on this sheet; sheet 1 listed Business / Professional /
Salaried / Services. **Confirm whether "Services" survives as a fifth category
or was replaced by "Self-employed".**

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

1. **Does "Services" survive, or did "Self-employed" replace it?** The two
   sheets disagree.
2. **Name and Age — what are they for?** Age has a real computational job
   (60/80 thresholds under the old regime). Name has none, so presumably it is
   for the report or the PDF. Worth confirming it is not meant to do more.
3. **Is the two-panel split live-updating side by side with the inputs**, or
   does it sit below on narrow screens? The sketch is a desktop layout and the
   answer decides the mobile behaviour.
