# FinSight — Launch Gate

**Not live. No domain.** 524 tests green · 69 commits on `fix/learning-loop-integrity-and-calculator-correctness`

This is a list, not a document. Explanations live in commit messages, `design-doctrine.json` and `engineering-solutions.json`. This says what is done and what is next.

Session archive: [`docs/session-2026-08-15.md`](session-2026-08-15.md).

---

## Done · 16 Aug

Two sessions, archived: T7 and T8 closed · sol-033 … sol-047 · sol-050 · sol-051 ·
dd-016, dd-017 · T3 rungs 5 and 6 · T5 complete. The three that still get quoted:
**sol-046** printed `19.20% a year, after inflation` where the truth was 4.09%,
**sol-047** had the two engines falling back on different worlds, and **sol-041**
read a typed zero as an empty box. Detail in
[`docs/session-2026-08-16.md`](session-2026-08-16.md), the solutions file and the
commit messages.

## Done · 15 Aug

Fifteen items, archived: sol-018 · sol-023 · sol-026 … sol-032 · T1 homepage ·
planner rungs 5 and 6 · dd-012, dd-013 · T3 started. Detail in
[`docs/session-2026-08-15.md`](session-2026-08-15.md), the solutions file and
the commit messages — which is where it belongs once it is no longer *next*.

## Done · 17 Aug

**The tax revamp's foundations**, archived: sol-056 … sol-060, and Rahul's two
rulings of that day — *"name is not necessary"* and the illegible verb resolved
as **"clubbed", negatively**, which is why the layout has three input blocks and
not two. **sol-058** is the one still worth re-reading: `typeFloor.test.ts` was
RED at HEAD and green only in a working tree carrying somebody else's uncommitted
migration, which is why this project verifies the INDEX and not the desk. Detail
in [`docs/session-2026-08-17.md`](session-2026-08-17.md).

## Done today · 18 Aug

**THE INSURANCE ANALYSER OVERHAUL — sol-066, sol-067, sol-068. THE LAST CHASSIS
ITEM IS DONE.** Five components on the tax revamp's pattern. The page opens on
**one control** (measured on the built page, not asserted), the form asks **one
question at a time**, and the hero that said *"unmask the true annualized yield
(XIRR)"* is deleted — it announced a verdict before asking anything. Nothing is
pre-filled: the old form defaulted all six boxes, so a reader who had typed
nothing was shown a confident verdict about a policy nobody owns. The brief's
third output, **how to actually do the DIY route**, existed nowhere and now does.

**dd-021 — three more figures of zero, typed in by omission (sol-067).** The
growth route **paid no fund fee** where the bond route's zero is a genuine fact
— sol-028's fault a third time, and worth **₹5.0 lakh** on the page's own worked
example. The policy's payouts were **assumed tax-free whatever the cover**, when
s.10(10D) exempts them only within 10% of the sum assured. And an **escalating
income was not modelled at all**, though the brief asks for it. Two of those
favour the policy and one favours the replica, which is the evidence they were
not a balancing act. **Fed a good policy the screen now prints "Keep the policy"
without hedging** — the brief's own test.

**THE BRIEF'S HEADLINE CLAIM WAS STALE.** Both it and this file said accident
cover was "a new input the engine does not price". It has been priced since
sol-039 on 16 Aug. Taken on trust, the session would have built a second
accident input beside the working one and called dd-021 satisfied. *A recorded
diagnosis is evidence, not a finding.*

**sol-068 — D-3 was answered on 16 Aug and never implemented.** `formatShortRupee`,
which every calculator passes through, still printed "₹ 55.86 Lakh" and "₹1.28
Cr". Found by reading a new screen, not by a test; `rupeeConvention.test.ts` now
holds it. Writing the detector immediately found the SIP engine's chart tooltip
holding a **verbatim copy** of the shared formatter — one figure, two renderings,
on one page.

**Three defects the 479-test suite could not see**, all found by walking the
built page: an optional field survived a change of policy shape, so an endowment
holder was asked whether their income escalates — a box that moves nothing; the
rider question could arrive before the life cover question; and the verdict said
*"the same income, in the same years"* to the holder of a policy that pays once.
**And three option labels were wider than their boxes at 375px** — a native
select clips rather than wraps, which a desktop design checked afterwards would
never have found.

**dd-024 · sol-064 · sol-065 — Rahul's four points, all four built.** *"we only
need to expose the user to complexity that serves them not which they are not
concerned with."*

**The catalogue was RESEARCHED rather than recalled (sol-064).** It held 19
income sources and 16 deductions, assembled from what the builder knew; Rahul
named six omissions in one line without looking anything up. **41 sources and 28
deductions now**, and **three of the additions could not simply be listed**:
**s.80CCE** caps 80C, 80CCC and 80CCD(1) at ₹1.5 lakh *between* them, so adding
them naively would have handed a reader ₹4.5 lakh of deductions that do not
exist and understated their tax; **s.80CCD(1)**'s ceiling is a share of salary
for an employee and of gross total income for everyone else, so `capFor` had to
be given `gti`; and **exempt income had nowhere to go at all** — it is now
`TaxInput.exemptIncome`, the one field on the form allowed to move no bill,
with its own row saying so and three tests holding it there. **A reference table
we consulted was wrong** about 80CCD(2) surviving the new regime; a second source
settled it, and the survivor list went 1 → 3 (80CCD(2), 80CCH(2), 80JJAA) — an
assertion that had been true of the engine and false of the Act.

**dd-024 — a screen has a beginning, and it moves (sol-065).** dd-022 was applied
correctly and the page still opened on *"one narrow toggle and a lot of blank
space"*. A lone control in a field of white is not minimal, it is unfinished.
`TaxIntro` now welcomes the reader, and **the category question moved out of the
form into the welcome**, because answering it is what resolves the page. Register
from `antigravity.google` at Rahul's direction — **the register, not the
ornament**; nothing bounces. The page's `Hero` is deleted: it said the same thing
one section higher. **Two faults surfaced that 479 green tests could not see** —
the shared card's `.reveal` starts at opacity 0 and is lit by an
IntersectionObserver, so an element hidden at load came back **invisible**; and
`transitionend` **does not fire in a backgrounded tab**, so the welcome never
left. Both found by reading the built page.

**dd-022 · dd-023 · sol-063 — the form opened on ten questions, and Rahul
corrected the reading that put them there.** *"after the category is selected,
only one major field (that is the primary field for that category appears) and
a add sign below ... all the complexity is underneath, the user faces zero
cognitive load and maximum satisfaction and simplicity."* **The number is one.**
"Only the most common options should be permanently visible" (16 Aug) had been
encoded as a `common` boolean on ten catalogue entries; **a box standing at zero
is not free**, it is a question the reader must read and dismiss. `common` is
**deleted rather than reinterpreted** — a flag left in place with a new meaning
lets the old one be re-derived, which is dd-012's failure — and `primaryFor`
replaces it. **The add control travels**: it is the last child of its block and
an added field lands before it, which also puts fields in the order the reader
added them rather than in ours. The page at rest is now **one control**; the
answer and both panels do not exist until there is income to answer about.
**dd-023 — mobile first, and it is not a breakpoint.** The previous build was
designed at 1280 and *passed* its 375 audit, which is exactly what the entry
exists to name.

**Answering the two new entries' seven don'ts across all ten checks files
produced a finding nobody had filed** — see *Next* below.

**sol-061 — the tax form is built from the catalogue, and the reader sums by
target.** The form asked eleven questions where the catalogue held thirty-five.
`readTaxInputs()` now walks the catalogue and adds every active field's rupees
to the `target` it names, because several entries share one engine field **on
purpose** — that is what a head does. And **presence stops meaning anything**:
every eligible field is rendered by the server and hidden until it is added, so
`readChapterVIA()` moved from field presence to `data-active`. **The layout has
three input blocks**, and `unclubbable` is a **reason string, not a boolean**,
on the same discipline as `Exclusion.statute`. That rule decided the hard case
rather than taste: a source sharing a `target` is clubbed by construction, so
**F&O stays in block 1** though Rahul's sheet lists it in block 2 — it shares
`business.netProfit` with four other sources and the heading would be a promise
the arithmetic does not keep. **On the list below, for Rahul.** A field that
becomes ineligible when the category changes is **kept**, carrying the statute
that now excludes it. **One defect the tests could not see**: the kind of house
property was derived from whether the rent FIELD was active, and rent is
permanently visible — so every reader with a home loan was being treated as a
landlord, whose interest is uncapped where a home you live in is capped at ₹2
lakh. Presence had been smuggled back in under another name.

**sol-062 — two output panels, and three figures that did not follow from their
rows.** Income Computation separate from Tax Computation, as sheet 2 asks. All
three faults were **green in 468 tests and visible in one glance**: the gains
block printed `taxed` under a subtotal of `specialRateIncome` (₹1,75,000 under
₹3,00,000); **gross total income was nowhere** in `TaxRegimeResult`, so the
deduction rows came off a figure not on screen, and it is now a named field;
and an elected presumptive basis **displaces** the books, which the panel showed
without saying. The Chapter VI-A lines sol-056 built are now read — grouped by
reason, so s.115BAC is explained once with the sections named rather than three
times. Measured on the built page at 1280×900: **0 horizontal overflow, 0
clipped elements, 0 type below 12px**; at 375px they stack in reading order.
`TaxIncomeComputation.checks.md` and `TaxComputation.checks.md` were written
first, 37 rules each. **468 tests.**

## Next — in order

- [ ] **EVERY REMAINING CALCULATOR SCREEN IS DESKTOP-FIRST** *(the insurance surfaces came off this list 18 Aug — rebuilt narrow-first and measured there: 0 overflow, 0 sub-12px type, 0 clipped select labels at 375)*. **Each one says so in its own checks file.** Found by adding dd-023 and making all ten strict checks files answer it: seven `dd-023/dont-1` RISKs, honestly filed rather than back-dated to a pass. Two more are `dd-023/dont-3` — `RungSipFlow` is a table of money columns and T8 puts both moneys in it side by side *on purpose*, and the two tax panels put both regimes in one table. **They fit at 375 without overflow, and fitting is not reading.** Owed: a judgement pass on a phone, screen by screen, before launch. The tax form and the two panels are the first to have been designed narrow-first; nothing else has
- [ ] **The primary field for Professional and Self-employed is our judgement, not Rahul's.** dd-022 says one field, and which one is data (`primaryFor`). Salaried opens on Salary and Business on profit from your books, both obvious. **Professional also opens on profit from your books** — and the label lost the word "Business" so a doctor is not asked about one — while **Self-employed opens on freelance or contract income**. Both are one line of data to change. Flagged because under dd-022 this is the *only* question those two categories see

- [ ] **Interface + content audit, 16 Aug — 20 findings, F-01…F-20.** Report: [`ux-audit-2026-08-16.html`](ux-audit-2026-08-16.html). Plan: [`repair-sequence-2026-08-16.html`](repair-sequence-2026-08-16.html) — 16 items, sol-048…sol-060, six phases. **All six decisions answered 16 Aug** — see *Waiting on Rahul* below; D-6 was answered against the plan's recommendation, so the "narrow to insurance" thread in both documents is dead and every calculator ships. Headline blockers: all four trust pages still branded "SWP Intelligence Engine" (0 occurrences of "FinSight India"), `text-gold-600` fails WCAG AA at 2.88:1, 317 pieces of type below 12px, zero external citations across 54 articles, the tax page renders the regime comparison twice. **sol-050 and sol-051 are done** (16 Aug); the other 14 items still wait on D-1…D-6
- [ ] **THE CRITICAL PATH is now the chassis, not the launch date (D-1 reversed).** In order: the Phase 2 token sweep (contrast, type floor, emphasis budget — the three rules D-2 sent to lint), the insurance analyser overhaul, the tax calculator revamp from Rahul's sketch. Launch follows all three. Rahul, 16 Aug: *"the low hanging fruit first then the tough job"*. **THE PHASE 2 TOKEN SWEEP IS COMPLETE, 17 Aug** — contrast (F-02), type floor (F-01) and emphasis (F-03). **THE TAX CALCULATOR REVAMP IS COMPLETE, 17 Aug — sol-061, sol-062.** **AND THE INSURANCE ANALYSER OVERHAUL IS COMPLETE, 18 Aug — sol-066, sol-067. ALL THREE CHASSIS ITEMS ARE DONE.** What stands between here and launch is now the dd-023 judgement pass on a real phone and the trust-page rebrand, both below — neither is an engine or a chassis question
- [x] ~~**F-01 — the sub-12px type floor**~~ **DONE 17 Aug on the five calculator pages, sol-054.** 95 instances converted on the convention the type-floor workstream had already set in the rungs: `text-[11px]`→`text-sm` (14px), `text-[10px]`→`text-xs` (12px). Verified in the browser at 1280×900: **zero horizontal overflow, zero clipped elements** on all five, and F-02 re-measured afterwards still reports 0 failing nodes (reflow can expose nodes the probe never laid out; the AA threshold itself cannot tighten, since below 18.66px it is 4.5:1 at any size). `typeFloor.test.ts` is a **ratchet, not a ban** — a flat rule would be red on 317 pieces of untouched content-workstream type, and a permanently red test is a disabled test. Whole-tree backlog **163 → 68**
- [x] ~~**F-03 — the emphasis ceiling**~~ **DONE 17 Aug on the rungs, `SectionTitle` and the two engine pages, sol-055.** swp-planner **50 → 16** all-caps elements, sip-engine **26 → 19**, and on both the count of all-caps runs **longer than three words is now zero**. The worst were not labels but whole clauses — «A LOSS COSTS MORE THAN THE SAME-SIZED GAIN GIVES BACK», «TAX, AND HOW LONG IT MUST LAST». **Two things made this structural rather than cosmetic**: almost every shouted string is *sentence case in the markup* and uppercased by CSS, so reading the files finds nothing wrong; and the rungs used **one eyebrow style for two jobs** — the card's own label and sub-headings inside that same card — so the budget could not be respected however carefully anyone wrote copy. Table headers lost their caps too: in a table of numbers a shouted header competes with the figures, which are what the reader came for. Contrast re-measured after (tones moved): still 0 failing nodes. `emphasisBudget.test.ts` holds it
- [ ] **F-03 remainder — ~~three~~ two pages ratcheted, not swept.** ~~`tax-calculator` (23)~~ **now 0 — its rewrite landed, sol-061/sol-062, and the ceiling went with it exactly as this line said it should.** `insurance-analyzer` (24), `black-scholes` (12), `faq` (19), `index` (10) keep their current counts as ceilings that may only fall. Drop each to zero as its rewrite lands
- [ ] **WAITING ON RAHUL — the 21 nine-pixel labels.** *(Was recorded as 17 here and as 20 in the test; the committed tree holds **21**. All three were honestly measured and none of the same thing — see sol-058.)* Held deliberately, not missed. `CAUTIOUS`/`BALANCED`/`BOLD` on SIP, the five Greeks on the options page, the regime tags, two on insurance. Going 9px→12px reflows the badges they sit in, so it is a layout decision rather than a find-and-replace. The test caps the count so the deferral cannot quietly grow. **Also held: the 11px `INDIA` in the header wordmark** — a brand lockup, not body text; changing it alters the logo. Remaining after those: `faq.astro` (14) and the content workstream's fcnr illustrations (~30)
- [x] ~~**F-02 — the contrast sweep**~~ **CLOSED 17 Aug, sol-052 + sol-053.** All five calculator pages plus the homepage and four trust pages measure **0 failing nodes in both themes**, against the built output at 1280×900 with every rung expanded. swp-planner alone was **21 groups / 50 nodes** once measured properly — more than the 16/36 recorded on 16 Aug, which had been counted with the ladder collapsed. Four distinct faults, not one repeated: **Tailwind stock colours with no token behind them** (`emerald-600` = #009966 at 3.43:1, `amber-600` = #E17100 at 2.95:1, `rose-600` = #EC003F, not even our rose's hue); **inverted light/dark pairs** — `text-navy-400 dark:text-navy-500` puts the lighter tone on the light ground, so it fails in *both* themes at once (2.56 light, 3.70 dark), and 38 places had it backwards against 266 correct; **raw hex in CSS** no class-level codemod can see; and an **alpha modifier** (`text-amber-700/70`) spending exactly the headroom its token was darkened to provide. Fixed with three text-on-light tokens on the `gold-700` pattern — `emerald-700 #047857`, `amber-700 #A15C07`, `rose-700 #B91C1C` — each chosen for headroom on the **tinted** ground it sits on, not on white. **The wordmark needed no WCAG 1.4.3 exemption after all**: its ground is `#0F172A`, not the mid-tone assumed, and the gold pair was simply inverted there like the navy ones — `gold-500` measures 8.49:1. **A fourth wrong measurement was found and recorded (sol-053)**: toggling the theme and reading immediately samples the `transition-colors` cross-fade and reported dark at 99 groups / 399 nodes when the truth was 1 — the tell was mid-grey grounds like `#6C727E` that exist nowhere in a navy-and-gold palette. Also: the server on :4321 is `astro preview`, serving **built** `dist/`, so source edits need a rebuild before they can be measured
- [ ] **F-02 remainder — the meta pages, never measured.** `solutions`, `standards`, `research-ledger`, `creator-log`, `reels`, `shelved-ideas`, `tax-code`, `example-svg` are still on the stock slate palette and were deliberately left out of this sweep rather than mass-edited unmeasured. `paletteContrast.test.ts` scopes itself to what was measured and says so; widen its `MEASURED_PAGES` as each is done. Two `Calculators/` widgets that appear only inside articles (`FOAuditTrigger`, `MSMEDInterestCalculator`) are excluded for the same reason. Two inverted navy pairs remain in `components/illustrations/` — the content workstream's files, left alone on purpose
- [x] ~~**Insurance analyser — the brief exists now**~~ **BUILT 18 Aug — sol-066, sol-067.** Both of the brief's questions are answered and its third output, how to do the DIY route, exists for the first time. **The brief's accident-cover claim was stale** and the real faults were three others; the brief now carries the correction rather than being quietly edited. The tool prints either verdict without hedging, verified
- [ ] **The rupee convention's remainder — two pages, ratcheted (sol-068).** `sip-engine`'s chart **Y-axis** still reads "₹1.2Cr" and "₹5L": an axis tick has a width constraint a card does not, so spelling the word out is a layout decision at 375px and this session did not rewrite that page. `tax-calculator`'s `inWords()` gives two decimals at lakh where D-3's own example gives one. Neither is a wrong number; both are a second definition of one rendering. `rupeeConvention.test.ts` caps the count at 2
- [ ] **`policyXirrPct` returns 0 both for a genuine 0% and for a failure to converge.** Latent, and the engine's own doc says so. A ₹1 lakh premium for 10 years returning ₹10 lakh at year 20 really is 0.00% a year, so the page is right today — but a reader cannot tell that from "we could not work this out". Fixing it means returning null and giving every surface a way to say so; deferred rather than half-done
- [ ] **`typeFloor`'s held-9px count can be tightened.** The insurance rewrite removed the 2 on that page. The test reads HEAD, so the number only falls once this commit lands — re-measure and tighten `HELD_9PX` next session rather than guessing it now
- [ ] **Rebrand the four trust pages** — still "SWP Intelligence Engine" with a `swpplanner.com` support address; 0 occurrences of "FinSight India". No longer gating the launch date, but still the cheapest defect on the list and still wrong on every page a stranger checks for legitimacy. Needs a free sol- id (see below). D-5's author bio lands in the same pass, shown to Rahul before it goes live
- [ ] **Sketches now have a home: [`docs/sketches/`](sketches/).** Rahul asked how to hand over a drawing without interrupting the flow — drop the image in that folder, named `what-it-is_YYYY-MM-DD.jpg`, and carry on. A session reads the folder and picks up what it has not seen. The rule attached to it: **a sketch is transcribed and read back before anything is built from it**, because handwriting is ambiguous and the tax sketch had two ambiguities that each changed the build
- [x] ~~**TAX REVAMP — WHERE IT STANDS, AND THE ONE THING THE NEXT SESSION MUST BUILD FIRST.**~~ **BUILT 17 Aug — sol-061 and sol-062.** The form, both panels and the page. The blocking design this line worked out was implemented as written and not re-derived. One thing it did NOT anticipate and that is now on *Waiting on Rahul*: F&O cannot go in block 2 while it shares an engine field with four other sources. Original text kept below for the reasoning. Done: the engine can price the whole catalogue (sol-056), the catalogue is verified, targeted and tested (sol-059), and the form's design is answered rule by rule in [`TaxInputForm.checks.md`](../src/components/Calculators/TaxInputForm.checks.md). **Not started: the component, the two panels, the page.** Stopped at a clean boundary rather than half-rewriting the input reader — CLAUDE.md's No Haste doctrine, and a half-migrated `taxInputs.ts` is the worst possible thing to hand over. **The blocking design decision, already worked out — do not re-derive it:** several catalogue entries share one engine field (salary + pension + arrears → `grossSalary`; savings + FD + dividends + family pension → `otherIncome`; books + F&O + intraday + freelance + gig → `business.netProfit`), so `readTaxInputs()` must **sum every active field by `target`** rather than read one id per field. It therefore imports `taxCatalogue.ts` — which is allowed and correct; only `tax.ts` is barred from importing it, and a test enforces that. Give each entry a field id derived from its catalogue id, render every eligible field server-side and mark the added ones `data-active="true"`; `readChapterVIA()` already keys off field PRESENCE and must move to that attribute, because a section merely present must not read as claimed. Two further checks files are owed before their components: `TaxIncomeComputation` and `TaxComputation`
- [x] ~~**Tax calculator revamp — Rahul's sketch, 16 Aug.**~~ **SHIPPED 17 Aug.** Three input blocks, two output panels, categories as data, dropdowns exhaustive within the eligible set. The third of the three items on the critical path is done; **the insurance analyser overhaul is now the only one left before launch**. Two of the three readings this line left open are settled — Services is superseded by `etc.` and the panels stack below the inputs on narrow screens, in reading order. Original text kept below. One adaptive form: Category (Salaried / Business / Professional / Services) · Name · Age, then **Income** built additively (Salary always present, a dropdown ADDS any other source) and **Deductions** the same way (standard deduction always present, a dropdown adds the rest), then one Tax computation panel. Dropdown 1 = income heads, dropdown 2 = capital gains, F&O, freelancing, gig economy. **Both readings settled 16 Aug.** (a) Category filters by **eligibility, not likelihood** — a salaried filer is not offered 44AD/44ADA or the deductions that hang off them, but *is* offered futures and options, which is lawful and not rare. Recorded as **dd-020**. (b) **"only the most common options should be permanently visible"** — the common heads stay on screen, the long tail moves into the dropdown, so the discoverability worry is answered by what stays visible rather than by keeping every chip. **Second sheet received 16 Aug and it changes the layout** — transcribed at [`sketches/tax-calculator-ui_2026-08-16.md`](sketches/tax-calculator-ui_2026-08-16.md). Inputs on the left, and **two** output panels on the right, not one: *Income Computation* separate from *Tax Computation*, so the reader follows gross income through to taxable income before any tax touches it. Rahul's brief: *"The dropdowns will have exhaustive sources of money & deductions category wise. The mechanics underneath will be complex & would clash but the UI to be simple & easy & intuitive."* Recorded against **dd-001** as a reinforcing instance, with one new `do` extracted — exhaustive within the eligible set. With dd-020 the input contract is now complete: dd-020 says what a category may remove, dd-001 says how full what remains must be. **Three readings still open** (Services vs Self-employed; what Name is for; whether the two panels sit beside the inputs on mobile) — listed in the transcription, none blocking the chassis work ahead of it
- [x] ~~**The plan's `sol-048` id is already taken**~~ **Caught before writing, as the line asked.** The ledger's sol-048 is the content workstream's markdown hero-image entry. F-02 took **sol-052** and **sol-053**; the tax revamp took **sol-061** and **sol-062**. **Free now: sol-049 and sol-063 onward.** The rebrand item still needs to claim one before it is written up
- [x] ~~**T2 last item** — the door is gone; the expert panel is rung 6, three doors named by question~~
- [x] ~~**T3 rungs 4 and 5** — order-of-returns and what protection costs~~ **Both shipped 16 Aug.** The mirror holds: 2 months at the start, 4.8 years at the end
- [ ] **sol-033 second instance: the planner still assumes a free fund** — `swpWorker` has no expense ratio. Needs the same required-parameter treatment, a control, a row on its money-flow rung, and three test bases updated. Deferred rather than rushed at the end of a long session; until it lands the two pages assume different worlds
- [ ] **A typed boundary between the compute host and the rungs — NOW THE HIGHEST-VALUE ITEM ON THIS LIST.** sol-035's real cause; sol-044 and sol-046 are its second and third instances, both found 16 Aug, both live on default inputs. Rungs receive `any` across a CustomEvent, so a renamed field is `undefined` at runtime and the build stays green. `inputContract.test.ts` now detects the class on both engine pages, but a detector is a smoke alarm, not a wall. `astro check` would catch it at build time and needs `npm i -D @astrojs/check typescript` — deliberately NOT installed in this session, because it would surface an unknown backlog of pre-existing type errors and that is a session's work, not a footnote to another one. **The cost of leaving it: sol-046 printed a confident 19.20% where the truth was 4.09%, on the one figure that says whether the plan was worth it, and no human found it**
- [ ] **Rung 2 should own the contribution-mode chooser** — it is the rung about inflation eating money, so it is the right home. Today the entry's "change how your contribution grows" link points at the expert rung, where the control actually is; a compact chooser in rung 1 is the proper end state
- [ ] **The same grid defect is latent in rung 6** — `protectionCurve` steps roughness by 1 from 8, so a shipped 28.4% assumption uses the 28% point. Hidden today only because the rung prints roughness to zero decimals. Anchor it the same way rung 4 now is
- [x] ~~**T5 — insurance analyser. THE NEXT SESSION.** Starts with extracting `runReplicationAnalysis()`~~ **Extracted 16 Aug, sol-039.** The rest of T5 is unblocked and cheap; four defects it uncovered are listed below
- [x] ~~**The DIY walk compounds an exhausted portfolio into a debt**~~ **Fixed, sol-040.** The walk pays what it has and reports the year it ran out
- [x] ~~**A typed maturity benefit of 0 becomes ₹10 lakh**~~ **Fixed, sol-041**
- [x] ~~**The LTCG exemption is applied once to the terminal gain, not annually**~~ **Fixed, sol-042** — and the note above it was wrong: it said this *overstated* the tax. It did not. Ignoring the gain realised in twenty years of withdrawals understated it by more than one missing exemption overstated it, so the page had been **undertaxing the route it argues for**. Tax ₹6.42 L → ₹8.38 L, surplus ₹54.48 L → ₹52.52 L
- [x] ~~**T1 homepage**~~ — this line was stale: T1 is 6/6 and was archived on 15 Aug. Only T7's six jargon occurrences on the homepage remain, and they are listed under T7
- [ ] Delete `swpDeterministic.ts` — no production caller; 11 tests still use it as a harness *(needs `growth`/`netMonthly` on the MC engine first)*
- [ ] Rung 6 term selector, 3/6/9/12 months — *needs term-invariant return generation; today it drifts the unhedged baseline 39→42, an artefact*

## Waiting on Rahul

- [x] ~~**D-1 · Ship now, or close the blockers first?**~~ **Answered 16 Aug, then REVERSED the same day. The later answer governs: we do not ship until the UI is fixed.** Rahul: *"we are not shipping untill we have fixed the UI, we have the engines firing but not the chassis we need both to launch."* The first answer — ship in week 1 once the trust pages are rebranded — is superseded and must not be acted on. **The indexing-age argument was accepted and then outweighed**: a correct engine behind a broken chassis is not a launchable product, and shipping it spends first impressions to buy indexing days. Consequence: the audit's Phase 2 token sweep, the insurance overhaul and the tax revamp all move **before** launch, not after
- [x] ~~**D-2 · Do four visual rules become doctrine?**~~ **Answered 16 Aug: the fourth becomes doctrine, the other three are lint rules without ceremony.** Recorded as **dd-019 — a number is a quantity, an amount and a frame**. Rahul ratified the audit's wording rather than originating it, so the entry carries his actual ruling as `verbatim` and states the provenance in its own field; no quote was invented. Adding it obliged seven checks files to answer its four don'ts, which surfaced **three RISKs nobody had filed**: the insurance answer's colliding frame (F-12), a pronoun-labelled row on `RungSipRates`, and two unframed money figures on `RungSipSequence`
- [x] ~~**D-3 · Which rupee convention wins?**~~ **Answered 16 Aug: the word, not the abbreviation. No space after the symbol. One decimal above a lakh** — ₹1.28 crore, ₹89.1 lakh, ₹59,190. "Cr" is a trading-desk abbreviation that pulls the page back towards the terminal aesthetic we are leaving. **Unblocks sol-055**; ten `formatRupee()` definitions collapse to one
- [x] ~~**D-4 · Publish 54 articles, or hold the thin ones?**~~ **Answered 16 Aug: hold everything failing R2 until it is rewritten.** Thirty strong articles is a better application and a better site than 54 uneven ones, and the held ones lose nothing because they are not indexed yet
- [x] ~~**D-5 · Who is the author?**~~ **Answered 16 Aug: a named person, and disclose the pipeline plainly.** **Rahul Sharma** — B.Tech (Electrical Engineering); banker in finance and credit; currently a Credit Officer at a major Indian bank. Disclosure to read as "drafted with AI assistance, verified against primary sources by a named human, corrections logged publicly". With a solutions ledger already published that reads as integrity rather than apology. *Bio copy to be drafted and shown to Rahul before it goes live*
- [x] ~~**D-6 · Five calculators broad, or the insurance analyser deep?**~~ **Answered 16 Aug: GO PUBLIC WITH ALL TOOLS. The recommendation to narrow was rejected.** Rahul: "I can't say I agree with you here that we should only concentrate on insurance calculator and ignore others... but we have to go public with all tools." The insurance analyser still **needs a major overhaul — "it is no way near as intuitive as i want it to be"** — but as work to be done, not as a reason to hold the other four back. Recorded because it reverses an agent's recommendation, which is exactly the kind of decision that must not live only in chat
- [x] ~~**What counts as "this plan works" when saving?**~~ **Answered 16 Aug: 50%, the typical path.** Not the planner's 85% — that bar is for ruin, and it would tell a saver of ₹25,000/mo that a crore needs ₹83,000/mo. The honesty is carried in the copy instead: every card states "50 still fall short" beside the promise
- [ ] **THE INSURANCE FORM IS A SPINE, NOT A CATALOGUE — a reading of dd-022.** dd-022/do-2 says every field after the primary one arrives because the reader asked for it by name. That is right on the tax form, where each field is an optional fact about a life. **A policy is not like that**: premium, term, payout, payout year and sum assured are not optional, they are what a policy IS, and an add dropdown offering "Premium payment term" as a thing you may *add* would misrepresent the arithmetic. So each question appears as the one before it is answered — one unanswered question on screen at any moment — and the add control keeps only what is genuinely optional. Say the word and it becomes the literal reading: one premium field, everything else behind a picker
- [ ] **THE UNBUNDLE TOGGLE IS GONE, and removing a control is your call.** Switched off it invested the whole premium and bought no cover, and the page printed "this is not a like-for-like comparison" when it did — a mode whose output the screen had to disclaim. What readers actually wanted from it, what the protection costs, is now a permanent named row in both moneys. It comes back as adjacency rather than a mode if you want it
- [ ] **MAY THE DIY PANEL EVER NAME A PRODUCT?** Your note was that showing how to do it yourself *"opens oppoutunity to promote genuinely beneficial and advantageous products"*. Built deliberately WITHOUT any product named or linked: a recommendation inside a tool whose whole claim is neutrality is your decision and your disclosure, not an agent's. What exists is what to buy, what it should cost and what to look for
- [ ] **The ₹5 lakh premium rule is stated, not applied.** For a policy issued on or after 1 Apr 2023, s.10(10D) also withdraws the exemption where premiums across all such policies pass ₹5 lakh a year. Applying it needs the issue year — a seventh question the brief does not ask for. The screen says the rule exists where the premium is big enough for it to bite, without asserting that it does. **Also inferred rather than cited: the QUANTUM.** The Act does not prescribe how to spread premiums across payouts; the engine allocates in proportion and the screen says so in those words. Belongs on the "two tax rules are INFERRED" list below, which is now three
- [ ] **F&O IS IN BLOCK 1, AND YOUR SHEET PUTS IT IN BLOCK 2.** Not a slip — the rule you gave decided it. Block 2 says "these cannot be added to the figures above", and F&O shares one engine field with a shop's profit, intraday, freelance and gig income, so the form sums them and the engine sees **one business profit**. Putting it under that heading would promise a separation the arithmetic does not make. **The separation you have in mind is real in the Act** — F&O is non-speculative where intraday is speculative, and their losses do not meet the same income — but the engine does not model it yet. So: do we build the segregation (an engine change, and the loss rules with it), or does F&O stay where the arithmetic puts it? Recorded rather than decided either way, because building it silently would have been defensible in both directions
- [ ] **The presets state a CAGR; both engines consume it as an arithmetic average** — so the median path lands a few points below the number on the button. True on the planner too, since 15 Aug. Fixing it moves T2's shipped figures, so it is not a silent change
- [ ] **T3 rung 5 says our own hedging product does not pay** — at the shipped 28.4% roughness the floor loses money in the bad futures *and* the typical ones; it only earns its price above ~30%. The rung states this plainly. Do we keep offering the toggle, re-price it, or change the default floor? A product decision, not an engineering one
- [ ] **The fund-fee default is the DEAREST plan — 1.75%, through a distributor** — chosen because most retail money is in regular plans and because sol-028's flattering default is exactly how the last one survived unexamined. It moves the shipped answer from ₹57.8 lakh to ₹47.4 lakh. Costed at all three plans before choosing, not defended after. Your call
- [x] ~~**The safe DIY route is charged no tax at all**~~ **ANSWERED 17 Aug — "ask them to choose a slab. 10, 20, 30". Built the same day, sol-060.** Rahul picked the only option that neither guesses nor gives up. **A second fault surfaced in the building**: interest is not a capital gain — it is taxed *as it accrues*, so the tax leaves the balance every year and the money it would have compounded on is gone. The engine's third parameter was a boolean that could say "taxed like equity" or "not taxed" and had no way to say "taxed like interest", so the right rate on the wrong mechanic would still have understated the drag. It is now a three-mode union. **The shipped figures moved a long way, and they moved TOWARD THE POLICY**: at the default 20% slab the safe route runs out in year 25 rather than 30, with **₹17.18 lakh** unpaid instead of ₹11.08 lakh; at 30% it is year 23 and ₹19.06 lakh. Verified on the built page. The tool had been biased against the product it was assessing — precisely what dd-021 exists to prevent. **Default is 20%, the middle of the three, because 10 flatters DIY and 30 flatters the policy and only the middle is not an argument**
- [ ] **Debt 7.1% and gold 8.5% are still typed in** — same fault as sol-028, no series in the repo to derive them from. The page says so in plain words rather than hiding it
- [x] ~~**The floor depth is three different numbers**~~ **Two now.** Both engines take it as a parameter and both pages ship −10%; only the copy's "−10% or −15%" is still loose
- [ ] **CLAUDE.md's dev-server instruction is wrong for this harness** — says `astro dev --background`; must use the preview tools. sol-025
- [x] ~~**Does `gate:sync`'s "republish the artifact" line matter before launch?**~~ **Answered 16 Aug: no — `docs/launch-gate.html` does not exist.** It is a leftover from when the gate *was* hand-patched HTML, before dd-011/dont-2 turned it into a list. The line has been telling every session to republish nothing. Removed
- [x] ~~**Does the SIP engine get the same regime presets?**~~ **Answered 15 Aug: yes.** T3 inherits the shared engine, `plannerInputs`, the regime presets and the rung pattern

## Blocked / deferred — with the reason

- [x] ~~**Insurance `runReplicationAnalysis()` is untestable**~~ **Done 16 Aug, sol-039.**
- [ ] **Rule retirements in the content factory** → needs logging coverage above 30% (now 5.9%). The operator self-blocks until then.
- [ ] **Three silent reversals: M2, M4, M9** → needs Rahul's judgement. `ceiling.py relax` lists them.
- [ ] **Regression set is only 4 cases** → grow it before leaning harder. Two were passing for the wrong reason until 15 Aug.
- [ ] **13 articles fail the R2 screen, 26 fail R7** → sol-021, worklist committed. Rahul's publishing gate 2.
- [ ] **Property-based testing (`fast-check`)** → sol-022, the real answer to "correct across all inputs". Needs boundary behaviour defined first.
- [ ] **19 loose python scripts at repo root** → never triaged; some may be live tooling.
- [ ] **Two banned terms remain in article copy** — "decision intelligence" on `/tax-code/the-price-you-didnt-receive` and "paradigm shift" on `/tax-code/the-section-270a-200-penalty-trap`. Both are the content workstream's files and one is mid-rewrite, so they were left alone rather than edited across a workstream boundary. They are the whole of the jargon baseline now
- [ ] **21 unreferenced ids remain in components** — sol-051's wall covers `src/pages` only, which is now at zero. Most of the rest are section anchors (`rungFlow`, `taxAnswer`, `sipAnswerLayer`) that read as deliberate landmarks for T9's deep-linking rather than debris, so sorting them is a navigation decision, not a deletion. Widen the test to components when T9 settles what the anchors are for
- [ ] **12 checks files predate dd-016** — they cite entries but answer no rules by id. Ratcheted so the count can only fall; retrofit them as each component is next touched, not in one sweep.
- [ ] **T4 goal engine — condition met, and Rahul has now ruled on the order: T7/T8 first, then the spike.** The deferral was never about a blocker; the spike ("can SIP and SWP share one core?") is worth more with more pages on the pattern, and T5 then T6 supplied the third and fourth. Asked again 16 Aug and the answer was to close the two tracks that are each one item from done before opening an architectural question. Unblocked, not started
- [ ] **A PWA service worker can serve a stale page** — `@vite-pwa/astro` kept a fixed rung out of Rahul's browser through a normal reload on 16 Aug. Harmless while nothing is live; a launch blocker once it is, because a reader can be pinned to an old build
- [ ] **Cross-surface agreement is checked pair by pair, by hand** — sol-038's tests are bespoke, one pair at a time, which is the same weakness the duplicated formulas had. A generalised check would fail the suite when any two surfaces disagree about one quantity
- [ ] **Proposed rung: "what if life happens?"** — a lump-sum shock (marriage, an operation no insurance covers). Liquidity risk, not market risk. Rahul's idea; not yet scoped.
- [ ] **Two tax rules are INFERRED, not cited — do not state them as fact.** Recorded this way on purpose: sol-042 happened because a confident note was backwards in both direction and magnitude and nobody could check it. (a) Whether old-regime 87A may be set against s.111A STCG — s.112A(6) explicitly bars it for LTCG, and the absence of an equivalent bar for STCG is an inference from silence. The engine does not claim it. (b) Marginal relief at the surcharge thresholds when slab and special-rate income are MIXED — "the bill at the threshold" depends on which income you imagine reducing; the engine reduces the slab part and holds gains constant, labelled in the code as an approximation. Bites only within a few lakh of each threshold
- [x] ~~**sol-043: the tax page renders the LOSING regime as the recommended one**~~ **Fixed in the answer layer, as the deferral said.** One `verdictFor()` drives card ring, font weight, colour, both column headers and the tag; the DEFAULT/OPTIONAL captions are gone. **Its severity was understated at filing** — recorded against a contrived maxed-deduction case, it fires on a salaried reader with an ordinary ₹2L home loan. A defect's first reproduction is the one you happened to find, not the smallest that triggers it

---

## T1 — Homepage · 6/6

- [x] Audit; identify what to keep
- [x] Promote the five intent chips to be the page
- [x] Rewrite the subhead in sol-008's register
- [x] Remove "THE DECISION PARADIGM SHIFT" and "Explore Decision Hubs"
- [x] Replace the five hubs with direct calculator cards; research remains below them
- [x] Cut page weight so the first real choice is above the fold

## T2 — SWP planner (the pilot) · 9/10

- [x] LTCG double-charge fixed in both engines `0dd3950`
- [x] Zero-valued inputs fixed — survival was reported 22% instead of 78% `3c4bab0`
- [x] Layer 1: three inputs, answer as a sentence `28be628`
- [x] Solve-for-the-fix: three levers, one tap to apply `4b0454f`
- [x] Rungs 1–2: the two rates, then where the money goes `1c26a7b`
- [x] Rung 3: growth slider, boundary on the track, no sentence churn `d5da508`
- [x] Rung 4: bad years first — rebuilt after review `c193203`
- [x] Rung 5: what protection costs — the premium is fixed, the payout is not
- [x] Rung 6: the expert panel, as the last rung rather than a door
- [ ] Proposed rung: what if life happens?

## T3 — SIP engine · 9/9 ✅

Scope, settled 15 Aug: the SIP page inherits T2 whole — shared engine, `plannerInputs`, regime presets, rung pattern. Start cold from this file, dd-012/dd-013 and sol-026 … sol-031.

- [x] Engine testable and seeded; 16 characterization tests `8c61dbf`
- [x] Hedging ledger fed from the engine, not recomputed beside it — sol-023
- [x] **sol-028 fixed here** — growth, roughness and the floor are required engine parameters; the named periods reach the maths — sol-030
- [x] Reverse goal-seek becomes the default — as the first *lever* on the Answer, not a mode switch. `FORWARD: STOCHASTIC` / `REVERSE: GOAL-SEEK` is gone
- [x] Three-input entry, ladder for the rest — `SipAnswer` + rungs 1–3 + the old page as the last rung
- [x] One input reader, one worker, one simulation — `sipInputs.ts`, `sipAdviceWorker.ts` (sol-026 pre-empted rather than repeated)
- [x] Assumption panel shared with T2 — same presets, same pricing, both pages quote 5.73% for the same contract
- [x] Rung 4: order-of-returns, mirrored — the whole profile is drawn at once rather than hidden behind a crash-year slider (dd-006); the control is how long the run lasts
- [x] Rung 5: what protection costs, on the dd-012 pattern — worst 1-in-10 in rupees, never a difference of averages
- [x] Surface total cost drag — **sol-033**. The fund's fee is a row in the flow rung and a named-plan control in the expert rung. Exit load is deliberately not modelled and the page says so: on a plan this long you sell units bought years earlier, so it rounds to nothing

## T4 — Goal engine (accumulate → draw down) · 1/6

- [ ] Spike: can SIP and SWP share one core?
- [ ] Goal presets — retirement, education, marriage, house, car, holiday
- [ ] One continuous timeline
- [x] **sol-018 fixed early** — hedge index tracked separately, floor applied at expiry; both SIP engines now share one path
- [ ] Explain the hedging mechanic plainly
- [ ] Make the tradeoff explicit: cut lifestyle, or pay to protect it

## T5 — Insurance analyser · 5/5 ✅

- [x] Audit; identify contradictory verdict labels
- [x] **Extract `runReplicationAnalysis()` so it can be tested** — `insuranceReplication.ts` (engine, no DOM, no clock) + `insuranceInputs.ts` (the one reader). One walk for both routes and every sensitivity row. sol-039, parity-checked against the original over six input sets before deleting it
- [x] **Fix surplus/deficit labelling** — it was not a wording task. The figure being labelled was an artefact of a portfolio allowed to owe money; **sol-040** floors the walk at zero and reports the year it ran out. One `verdictFor()` now drives the heading, figure, colour, badge and sentence on every surface
- [x] **Lead with the unbundling verdict** — `InsuranceAnswer`, layer 1: *buy the policy, or buy the cover on its own and invest the difference?* The income is identical by construction and the screen says so, which is what makes the surplus a legitimate headline rather than an accountant's summary
- [x] **Apply the T8 side-by-side money pattern** — every figure carries its frame permanently: total paid out, surplus, and the shortfall all appear in the rupees of the day beside today's prices. No toggle (dd-006), no footnote (dd-004)
- [x] **sol-041** — a typed maturity of 0 no longer becomes ₹10 lakh, and `formatShortRupee` stopped printing paise
- [x] **The whole form now answers as you type** — `setupFormattingField` takes an opt-in `live` flag, debounced. Opt-in on purpose: its other 13 callers sit on pages where one recompute is a 10,000-path simulation. sol-042

## T6 — Income tax calculator (incl. your T10) · 9/9 ✅

- [x] Double-counted base tax fixed `0dd3950`
- [x] Test coverage restored — 3 failing → 49 passing `0dd3950`
- [x] Doubled rupee fixed across 8 call sites, 7 files `f91a873`
- [x] **One input reader — `taxInputs.ts`** `f598870`. Added to this list, not previously on it: the page read eleven fields inline, the sol-026/sol-039 shape, latent only because there is one surface. Every remaining item adds one. No live sol-041 bug here — all fallbacks were 0, so zero and empty genuinely coincided — but the distinction is built in, and it is the rule for every money field rather than opt-in
- [x] **Multiple income heads** `8c3ed1a` — `tax.ts` is structured by s.14. Found on the way: the home loan field was a *house property* item (s.24(b)) being deducted like a Chapter VI-A one. Same rupees for the simple case, which is why it never showed; it would have double-counted the moment the head existed. Self-occupied interest is old-regime only — s.115BAC withdraws it entirely, which is the biggest single reason a homeowner stays on the old regime. Losses that the caps disallow are *reported*, not swallowed
- [x] **STCG/LTCG separated, with the 87A interaction** — four buckets by rate, ₹1.25L exemption, unused basic exemption absorbed dearest-first, Chapter VI-A barred against gains, surcharge on gains capped at 15%. **The 87A rule was researched, not assumed**: under the new regime the rebate never touches special-rate tax, and the ₹12L threshold is tested EXCLUDING special-rate income — so ₹11L salary + ₹2L STCG keeps its rebate. Reading it the intuitive way would deny the rebate to a great many filers. Two sources, worked example, cited in the code
- [x] **Presumptive taxation: 44AD and 44ADA** `f6171c3` — 6% on banked turnover / 8% on cash, blended; ceilings 2cr→3cr and 50L→75L when cash is ≤5%. **Both bases are always costed** so the page can show the election adjacently rather than behind a dropdown — dd-006/dont-2, since the actual-vs-deemed difference *is* the lesson. An ineligible election falls back to the books rather than deeming zero profit
- [x] **Loss set-off and carry-forward** — the three rules kept apart: intra-head (s.70), inter-head (s.71), carry-forward (s.72/74/71B). A capital loss can never touch salary and the engine says so explicitly; a business loss can reach rent, interest *and* capital gains but never salary; brought-forward losses meet their own kind only. Set-off order is dearest-first, and LTCL goes to s.112 before s.112A so the ₹1.25L exemption isn't wasted. Conservation asserted: available = used + carried, on every loss
- [x] **Progressive disclosure — salaried users never see business fields.** Four chips, closed by default, native `<details>`. **Design settled first, in `TaxAnswer.checks.md`** — entry is one field (gross salary); the heads are additive chips, each ≤2 fields, house property and capital gains split rather than crammed; a chip is not a mode because it adds data rather than hiding half a difference; the regime stays two adjacent columns and never a switch; presumptive is shown adjacently because there the difference *is* the lesson. Answer headlines the monthly bite (dd-010) and the break-even deduction total (dd-008)

## T7 — Dejargonise · 5/5 ✅

- [x] Audit the live pages
- [x] Build-time ratchet: debt cannot grow, must shrink `175ab75`
- [x] Define "reader-facing" — meta pages out, FAQ in `4b0454f`
- [x] sip-engine cleared — "stochastic" is off the baseline; the ratchet tightened
- [x] ~~Clear the homepage's six occurrences~~ **This line was stale: the homepage is clean.** A fresh scan of `dist/` finds 8 occurrences in total and none on `/`. They went with T1's rewrite and nobody moved the line
- [x] ~~Clear the six on swp-planner (3), about, faq, terms~~ **Done 16 Aug.** The ratchet's baseline is down from 8 to 2, and both survivors are the content workstream's article copy, listed under blocked/deferred. The planner's "STOCHASTIC REALITY" rung is now "WHAT A BUMPY MARKET COSTS" and explains the −20%/+25% asymmetry instead of naming Brownian motion; a dead `href="#"` link went with it

## T8 — Real vs nominal · 5/5 ✅

- [x] dd-004 recorded: never use a concept the reader has not been given
- [x] Teach it inside the two-rates rung, in plain words `b128478`
- [x] Side-by-side columns, not a toggle (dd-006) `1c26a7b`
- [x] Applied to SIP — both columns in the flow rung, and both of them close (sol-031)
- [x] **Applied to insurance** — total paid out, the surplus and the shortfall each carry both moneys, adjacently and permanently. sol-040
- [x] ~~Label every **forward-projected** currency figure on the pages we own~~ **Done 16 Aug.** Scope settled by Rahul: read literally, "site-wide" is 73 pages carrying ₹, nearly all the content workstream's articles. dd-004's own scope line is *any figure projected forward*, and a statutory figure for this assessment year is today's money by construction — the same reasoning already recorded as `dd-004/dont-2 PASS` in `TaxAnswer.checks.md`. What was actually unlabelled: the planner's two 30-year tables. The schedule's money follows the deflator toggle, so its frame is a live value in a fixed slot (dd-008/do-1) rather than a fixed caption; the hedging ledger is engine-fed and always future rupees, so its frame is fixed. The SIP ledger already carried an accurate frame and was checked rather than assumed. The FAQ's Q01 was reconciling ₹5 Cr against ₹1.16 Cr using the words *nominal* and *Present Value* — `dd-004/dont-2` — and never stated the 25-year horizon that produces ₹1.16 Cr, so the figure was not traceable from the screen (`dd-009/do-1`). Both fixed

## T9 — Link the writing to the maths · 0/5

- [ ] Map the risk/return spectrum as the navigational spine
- [ ] Every calculator figure deep-links to the article explaining it
- [ ] Every article ends in the calculator that makes its point concrete
- [ ] Shared cost model: tax, inflation, expense ratio, hedging drag, exit load
- [ ] Surface the self-sabotage check — low risk appetite, high return expectation

## T11 — Lay person is the default user · 4/4 ✅

- [x] sol-019 written: three layers, entry contract, answer as a sentence `175ab75`
- [x] dd-000 … dd-011 recorded, verbatim, with tests `fa88e96`
- [x] Enforced: every calculator needs a `.checks.md`, tested `7bbfe6f`
- [x] **sol-019 proved twice** — T2 shipped it, T3 inherited it, and the five new checks files were written *before* their components for the first time
- [x] **T5 and T6 both done** — the tax calculator now leads with an answer as a sentence (the monthly bite, not the annual bill) and `TaxAnswer.checks.md` was written before the component. Five calculators, one pattern

## T12 — Agentic workflow · 6/8

- [x] Rule identity restored across rubric eras `dccdc96`
- [x] Verdict log, so calibration can run `dccdc96`
- [x] Relaxation operator — the loop's missing second move `dccdc96`
- [x] Six memory stores joined into one view `dccdc96`
- [x] H3 gate run — found the gate itself was broken, fixed `60366c0`
- [x] Ceiling proposal merged into the live rubric (v5.0 / v2.1) `9d18920`
- [ ] Raise logging coverage from 5.9% — relaxation blocked below 30%
- [ ] Resolve the three silent reversals: M2, M4, M9

## P0 — The net · done

- [x] Both workers extracted and seeded `3c4bab0`
- [x] Two SWP engines asserted to agree at zero volatility `3c4bab0`
- [x] SIP engine: 16 characterization tests `8c61dbf`, now 38 — the world it assumes is stated in them
- [x] SIP derivation layer covered: 21 tests, including the one that caught sol-031
- [x] Build output smoke test; integrity baseline restored `c0fb12a`
- [x] Conservation-of-money and reconciliation invariants `df5f3bc`

---

## How this is kept

| What arrives | Where | When |
|---|---|---|
| Feedback about spirit | `design-doctrine.json` — verbatim + test | **before** acting |
| A fault and its fix | `engineering-solutions.json` | when fixed or deferred |
| A decision + reasoning | the commit message | at commit |
| Plan changes, deferrals | **this file** | every checkpoint |

Editing this file is one line. `npm run gate:sync` stamps it; `launchGateFreshness.test.ts` fails and names the commits if it falls behind.
