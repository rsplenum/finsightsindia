# FinSight — Launch Gate

**Not live. No domain.** 308 tests green · 38 commits on `fix/learning-loop-integrity-and-calculator-correctness`

This is a list, not a document. Explanations live in commit messages, `design-doctrine.json` and `engineering-solutions.json`. This says what is done and what is next.

Session archive: [`docs/session-2026-08-15.md`](session-2026-08-15.md).

---

## Done today · 16 Aug

**dd-016** the doctrine as do's and don'ts, generated + gated · **dd-017** the
contribution is asked for in today's money, three modes · **sol-033** neither
engine charged a fund fee · **sol-034** step-up meant opposite things on the two
pages · **sol-035** a rung printed NaN · **sol-036** the fee and the return
series are a pair · **sol-037** rung 3 counted no tax · **sol-038** two rungs,
one formula, two copies · **sol-039** the insurance engine leaves the page and
becomes testable · **sol-040** an exhausted portfolio stops growing a debt, and
four surfaces stop disagreeing about one number · **sol-041** zero was read as
empty · **sol-042** the DIY route was undertaxed, not overtaxed · **T3 rungs 5
and 6** built · **T5 complete**.

Numbers that moved: the shipped answer ₹43.7 L → ₹89.1 L, the contribution
needed for a crore ₹56,500 → ~₹35,500, and the insurance page's safe route from
"−₹11.08 L surplus" to "runs out in year 30, ₹11.08 L of income unpaid".
204 → 308 tests.

Detail in `engineering-solutions.json`, `design-doctrine.json` and the commit
messages. **Rung numbering: the Answer is rung 1.**

## Done · 15 Aug

Fifteen items, archived: sol-018 · sol-023 · sol-026 … sol-032 · T1 homepage ·
planner rungs 5 and 6 · dd-012, dd-013 · T3 started. Detail in
[`docs/session-2026-08-15.md`](session-2026-08-15.md), the solutions file and
the commit messages — which is where it belongs once it is no longer *next*.

## Next — in order

- [x] ~~**T2 last item** — the door is gone; the expert panel is rung 6, three doors named by question~~
- [x] ~~**T3 rungs 4 and 5** — order-of-returns and what protection costs~~ **Both shipped 16 Aug.** The mirror holds: 2 months at the start, 4.8 years at the end
- [ ] **sol-033 second instance: the planner still assumes a free fund** — `swpWorker` has no expense ratio. Needs the same required-parameter treatment, a control, a row on its money-flow rung, and three test bases updated. Deferred rather than rushed at the end of a long session; until it lands the two pages assume different worlds
- [ ] **A typed boundary between the compute host and the rungs** — sol-035's real cause. Rungs receive `any` across a CustomEvent, so a renamed field fails silently at runtime. Every rung is exposed to this, not just the one that broke
- [ ] **Rung 2 should own the contribution-mode chooser** — it is the rung about inflation eating money, so it is the right home. Today the entry's "change how your contribution grows" link points at the expert rung, where the control actually is; a compact chooser in rung 1 is the proper end state
- [ ] **The same grid defect is latent in rung 6** — `protectionCurve` steps roughness by 1 from 8, so a shipped 28.4% assumption uses the 28% point. Hidden today only because the rung prints roughness to zero decimals. Anchor it the same way rung 4 now is
- [x] ~~**T5 — insurance analyser. THE NEXT SESSION.** Starts with extracting `runReplicationAnalysis()`~~ **Extracted 16 Aug, sol-039.** The rest of T5 is unblocked and cheap; four defects it uncovered are listed below
- [x] ~~**The DIY walk compounds an exhausted portfolio into a debt**~~ **Fixed, sol-040.** The walk pays what it has and reports the year it ran out
- [x] ~~**A typed maturity benefit of 0 becomes ₹10 lakh**~~ **Fixed, sol-041**
- [x] ~~**The LTCG exemption is applied once to the terminal gain, not annually**~~ **Fixed, sol-042** — and the note above it was wrong: it said this *overstated* the tax. It did not. Ignoring the gain realised in twenty years of withdrawals understated it by more than one missing exemption overstated it, so the page had been **undertaxing the route it argues for**. Tax ₹6.42 L → ₹8.38 L, surplus ₹54.48 L → ₹52.52 L
- [ ] **T1 homepage** — six items, untouched since the audit
- [ ] Delete `swpDeterministic.ts` — no production caller; 11 tests still use it as a harness *(needs `growth`/`netMonthly` on the MC engine first)*
- [ ] Rung 6 term selector, 3/6/9/12 months — *needs term-invariant return generation; today it drifts the unhedged baseline 39→42, an artefact*

## Waiting on Rahul

- [x] ~~**What counts as "this plan works" when saving?**~~ **Answered 16 Aug: 50%, the typical path.** Not the planner's 85% — that bar is for ruin, and it would tell a saver of ₹25,000/mo that a crore needs ₹83,000/mo. The honesty is carried in the copy instead: every card states "50 still fall short" beside the promise
- [ ] **The presets state a CAGR; both engines consume it as an arithmetic average** — so the median path lands a few points below the number on the button. True on the planner too, since 15 Aug. Fixing it moves T2's shipped figures, so it is not a silent change
- [ ] **T3 rung 5 says our own hedging product does not pay** — at the shipped 28.4% roughness the floor loses money in the bad futures *and* the typical ones; it only earns its price above ~30%. The rung states this plainly. Do we keep offering the toggle, re-price it, or change the default floor? A product decision, not an engineering one
- [ ] **The fund-fee default is the DEAREST plan — 1.75%, through a distributor** — chosen because most retail money is in regular plans and because sol-028's flattering default is exactly how the last one survived unexamined. It moves the shipped answer from ₹57.8 lakh to ₹47.4 lakh. Costed at all three plans before choosing, not defended after. Your call
- [ ] **The safe DIY route is charged no tax at all** — the growth route pays 12.5% LTCG; the bond route pays nothing. Interest is taxed at slab, and we have no income input to apply one with. It flatters the very route the page uses to argue the policy is beatable *without risk*, so it is not a neutral omission. Options: assume a slab, ask for one, or say plainly that the bond figure is pre-tax. Your call. sol-039
- [ ] **Debt 7.1% and gold 8.5% are still typed in** — same fault as sol-028, no series in the repo to derive them from. The page says so in plain words rather than hiding it
- [x] ~~**The floor depth is three different numbers**~~ **Two now.** Both engines take it as a parameter and both pages ship −10%; only the copy's "−10% or −15%" is still loose
- [ ] **CLAUDE.md's dev-server instruction is wrong for this harness** — says `astro dev --background`; must use the preview tools. sol-025
- [x] ~~**Does the SIP engine get the same regime presets?**~~ **Answered 15 Aug: yes.** T3 inherits the shared engine, `plannerInputs`, the regime presets and the rung pattern

## Blocked / deferred — with the reason

- [x] ~~**Insurance `runReplicationAnalysis()` is untestable**~~ **Done 16 Aug, sol-039.**
- [ ] **Rule retirements in the content factory** → needs logging coverage above 30% (now 5.9%). The operator self-blocks until then.
- [ ] **Three silent reversals: M2, M4, M9** → needs Rahul's judgement. `ceiling.py relax` lists them.
- [ ] **Regression set is only 4 cases** → grow it before leaning harder. Two were passing for the wrong reason until 15 Aug.
- [ ] **13 articles fail the R2 screen, 26 fail R7** → sol-021, worklist committed. Rahul's publishing gate 2.
- [ ] **Property-based testing (`fast-check`)** → sol-022, the real answer to "correct across all inputs". Needs boundary behaviour defined first.
- [ ] **19 loose python scripts at repo root** → never triaged; some may be live tooling.
- [ ] **12 checks files predate dd-016** — they cite entries but answer no rules by id. Ratcheted so the count can only fall; retrofit them as each component is next touched, not in one sweep.
- [ ] **T4 goal engine — deliberately deferred, 16 Aug.** Rahul's call: T5 first. T4 asks whether SIP and SWP can share one core, and that spike is worth more once T5 has shown whether a third page can be brought onto the same engine at all
- [ ] **A PWA service worker can serve a stale page** — `@vite-pwa/astro` kept a fixed rung out of Rahul's browser through a normal reload on 16 Aug. Harmless while nothing is live; a launch blocker once it is, because a reader can be pinned to an old build
- [ ] **Cross-surface agreement is checked pair by pair, by hand** — sol-038's tests are bespoke, one pair at a time, which is the same weakness the duplicated formulas had. A generalised check would fail the suite when any two surfaces disagree about one quantity
- [ ] **Proposed rung: "what if life happens?"** — a lump-sum shock (marriage, an operation no insurance covers). Liquidity risk, not market risk. Rahul's idea; not yet scoped.
- [ ] **sol-043: the tax page renders the LOSING regime as the recommended one** — at maxed deductions the badge reads "OLD REGIME SAVES ₹53,300" while the new regime's higher ₹97,500 is the greenest, boldest number on the page. Found live, not by the suite; the engine is right, the view is not. sol-040's shape exactly. Deferred *into* T6's answer layer, a few steps away in this session, because the fix is one `verdictFor()` driving every surface and patching the markup now builds that twice. **If the answer layer slips, fix this on its own** — it is only a deferral because nothing is live

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

## T6 — Income tax calculator (incl. your T10) · 4/9

- [x] Double-counted base tax fixed `0dd3950`
- [x] Test coverage restored — 3 failing → 49 passing `0dd3950`
- [x] Doubled rupee fixed across 8 call sites, 7 files `f91a873`
- [x] **One input reader — `taxInputs.ts`** `f598870`. Added to this list, not previously on it: the page read eleven fields inline, the sol-026/sol-039 shape, latent only because there is one surface. Every remaining item adds one. No live sol-041 bug here — all fallbacks were 0, so zero and empty genuinely coincided — but the distinction is built in, and it is the rule for every money field rather than opt-in
- [ ] Multiple income heads: salary, house property, business, capital gains, other
- [ ] STCG/LTCG separated, with the 87A interaction
- [ ] Presumptive taxation: 44AD and 44ADA
- [ ] Loss set-off and carry-forward
- [ ] Progressive disclosure — salaried users never see business fields. **Design settled first, in `TaxAnswer.checks.md`** — entry is one field (gross salary); the heads are additive chips, each ≤2 fields, house property and capital gains split rather than crammed; a chip is not a mode because it adds data rather than hiding half a difference; the regime stays two adjacent columns and never a switch; presumptive is shown adjacently because there the difference *is* the lesson. Answer headlines the monthly bite (dd-010) and the break-even deduction total (dd-008)

## T7 — Dejargonise · 3/5

- [x] Audit the live pages
- [x] Build-time ratchet: debt cannot grow, must shrink `175ab75`
- [x] Define "reader-facing" — meta pages out, FAQ in `4b0454f`
- [x] sip-engine cleared — "stochastic" is off the baseline; the ratchet tightened
- [ ] Clear the homepage's six occurrences *(with T1)*
- [ ] Clear the remaining seven across swp-planner, about, faq, terms

## T8 — Real vs nominal · 4/5

- [x] dd-004 recorded: never use a concept the reader has not been given
- [x] Teach it inside the two-rates rung, in plain words `b128478`
- [x] Side-by-side columns, not a toggle (dd-006) `1c26a7b`
- [x] Applied to SIP — both columns in the flow rung, and both of them close (sol-031)
- [x] **Applied to insurance** — total paid out, the surplus and the shortfall each carry both moneys, adjacently and permanently. sol-040
- [ ] Label every currency figure site-wide

## T9 — Link the writing to the maths · 0/5

- [ ] Map the risk/return spectrum as the navigational spine
- [ ] Every calculator figure deep-links to the article explaining it
- [ ] Every article ends in the calculator that makes its point concrete
- [ ] Shared cost model: tax, inflation, expense ratio, hedging drag, exit load
- [ ] Surface the self-sabotage check — low risk appetite, high return expectation

## T11 — Lay person is the default user · 3/4

- [x] sol-019 written: three layers, entry contract, answer as a sentence `175ab75`
- [x] dd-000 … dd-011 recorded, verbatim, with tests `fa88e96`
- [x] Enforced: every calculator needs a `.checks.md`, tested `7bbfe6f`
- [x] **sol-019 proved twice** — T2 shipped it, T3 inherited it, and the five new checks files were written *before* their components for the first time
- [ ] **T5 done, T6 outstanding** — the analyser now leads with an answer as a sentence, and `InsuranceAnswer.checks.md` was written before the component. T6, the tax calculator, is untouched

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
