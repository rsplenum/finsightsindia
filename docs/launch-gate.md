# FinSight — Launch Gate

**Not live. No domain.** 376 tests green · 58 commits on `fix/learning-loop-integrity-and-calculator-correctness`

This is a list, not a document. Explanations live in commit messages, `design-doctrine.json` and `engineering-solutions.json`. This says what is done and what is next.

Session archive: [`docs/session-2026-08-15.md`](session-2026-08-15.md).

---

## Done · 16 Aug (later session)

**T7 closed 5/5** — the jargon ratchet's baseline is 8 → 2, and both survivors
are the content workstream's. **T8 closed 5/5** — the planner's two 30-year
tables and the FAQ's purchasing-power card now carry their money's frame.
**sol-044 · sol-045 · sol-046** — three correctness defects on the two engine
pages, all live on default inputs, none caught by 376 green tests. Order of
discovery matters here: sol-044 was found by reading the live page, sol-045 by
verifying sol-044's fix, and sol-046 by pointing sol-044's new detector at a
second page nobody had complained about. The worst of the three was the last:
`19.20% a year, after inflation` where the truth is `4.09%`.

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
- [ ] **Two banned terms remain in article copy** — "decision intelligence" on `/tax-code/the-price-you-didnt-receive` and "paradigm shift" on `/tax-code/the-section-270a-200-penalty-trap`. Both are the content workstream's files and one is mid-rewrite, so they were left alone rather than edited across a workstream boundary. They are the whole of the jargon baseline now
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
