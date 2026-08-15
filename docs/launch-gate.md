# FinSight — Launch Gate

**Not live. No domain.** 166 tests green · 34 commits on `fix/learning-loop-integrity-and-calculator-correctness`

This is a list, not a document. Explanations live in commit messages, `design-doctrine.json` and `engineering-solutions.json`. This says what is done and what is next.

Session archive: [`docs/session-2026-08-15.md`](session-2026-08-15.md).

---

## Done today · 15 Aug

✅ **sol-018** hedging floor — annual, on the index. Goal seek said insurance *cut* the SIP needed, 19,646 → 7,744; now 20,561
✅ **sol-023** SIP ledger fed from the engine, not invented beside it · column widths
✅ **sol-026** the page ran **two engines on two input sets** and showed both. One input set, one simulation, one seed. The rungs had been deaf to CAGR, inflation, volatility, tax and both toggles
✅ **sol-027** one engine, not two — `returnsByYear` retired the duplicate `swpDeterministic`
✅ **sol-028** volatility default was the calmest decade in 35 years. Named periods now, computed from real data. **Survival on the shipped plan: 9534 → 7025**
✅ **rung 5** built, rejected, rebuilt to dd-012 — leads with ruined retirements, premium priced not chosen
✅ **rung 6** — one `<details>` over ~590 lines became the ladder's last step, split by question. dd-002's origin case, finally closed
✅ **sol-023 second instance** on the planner ledger · **sol-029** premium had two sources after I priced it in rung 5
✅ **dd-012, dd-013** recorded · 166 tests (was 125) · 4 new detectors

## Next — in order

- [x] ~~**T2 last item** — the door is gone; the expert panel is rung 6, three doors named by question~~
- [ ] **T3** — apply the ladder to the SIP engine, which now shares T2's engine and presets
- [ ] **T1 homepage** — six items, untouched since the audit
- [ ] Delete `swpDeterministic.ts` — no production caller; 11 tests still use it as a harness *(needs `growth`/`netMonthly` on the MC engine first)*
- [ ] Rung 5 term selector, 3/6/9/12 months — *needs term-invariant return generation; today it drifts the unhedged baseline 39→42, an artefact*

## Waiting on Rahul

- [ ] **The floor depth is three different numbers** — SIP engine −8%, planner −10%, copy says −10% or −15%
- [ ] **CLAUDE.md's dev-server instruction is wrong for this harness** — says `astro dev --background`; must use the preview tools. sol-025
- [ ] **Does the SIP engine get the same regime presets?** It still assumes 12% / 15% vol internally — the same defect sol-028 just fixed on the planner

## Blocked / deferred — with the reason

- [ ] **Insurance `runReplicationAnalysis()` is untestable** → T5 starts with extracting it from the 35KB page.
- [ ] **Rule retirements in the content factory** → needs logging coverage above 30% (now 5.9%). The operator self-blocks until then.
- [ ] **Three silent reversals: M2, M4, M9** → needs Rahul's judgement. `ceiling.py relax` lists them.
- [ ] **Regression set is only 4 cases** → grow it before leaning harder. Two were passing for the wrong reason until 15 Aug.
- [ ] **13 articles fail the R2 screen, 26 fail R7** → sol-021, worklist committed. Rahul's publishing gate 2.
- [ ] **Property-based testing (`fast-check`)** → sol-022, the real answer to "correct across all inputs". Needs boundary behaviour defined first.
- [ ] **19 loose python scripts at repo root** → never triaged; some may be live tooling.
- [ ] **Proposed rung: "what if life happens?"** — a lump-sum shock (marriage, an operation no insurance covers). Liquidity risk, not market risk. Rahul's idea; not yet scoped.

---

## T1 — Homepage · 1/6

- [x] Audit; identify what to keep
- [ ] Promote the five intent chips to be the page
- [ ] Rewrite the subhead in sol-008's register
- [ ] Remove "THE DECISION PARADIGM SHIFT" and "Explore Decision Hubs"
- [ ] Demote the five hubs to a second screen
- [ ] Cut page weight so the first real choice is above the fold

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

## T3 — SIP engine · 2/6

- [x] Engine testable and seeded; 16 characterization tests `8c61dbf`
- [x] Hedging ledger fed from the engine, not recomputed beside it — sol-023
- [ ] Reverse goal-seek becomes the default mode
- [ ] Three-input entry, ladder for the rest
- [ ] Surface total cost drag — fund fees, exit load, tax
- [ ] Share the assumption panel with T2

## T4 — Goal engine (accumulate → draw down) · 1/6

- [ ] Spike: can SIP and SWP share one core?
- [ ] Goal presets — retirement, education, marriage, house, car, holiday
- [ ] One continuous timeline
- [x] **sol-018 fixed early** — hedge index tracked separately, floor applied at expiry; both SIP engines now share one path
- [ ] Explain the hedging mechanic plainly
- [ ] Make the tradeoff explicit: cut lifestyle, or pay to protect it

## T5 — Insurance analyser · 1/5

- [x] Audit; identify contradictory verdict labels
- [ ] Extract `runReplicationAnalysis()` so it can be tested
- [ ] Fix surplus/deficit labelling — sign, word and badge must agree
- [ ] Lead with the unbundling verdict
- [ ] Apply the T8 side-by-side money pattern

## T6 — Income tax calculator (incl. your T10) · 3/8

- [x] Double-counted base tax fixed `0dd3950`
- [x] Test coverage restored — 3 failing → 49 passing `0dd3950`
- [x] Doubled rupee fixed across 8 call sites, 7 files `f91a873`
- [ ] Multiple income heads: salary, house property, business, capital gains, other
- [ ] STCG/LTCG separated, with the 87A interaction
- [ ] Presumptive taxation: 44AD and 44ADA
- [ ] Loss set-off and carry-forward
- [ ] Progressive disclosure — salaried users never see business fields

## T7 — Dejargonise · 3/5

- [x] Audit the live pages
- [x] Build-time ratchet: debt cannot grow, must shrink `175ab75`
- [x] Define "reader-facing" — meta pages out, FAQ in `4b0454f`
- [ ] Clear the homepage's six occurrences *(with T1)*
- [ ] Clear the remaining eight across swp-planner, sip-engine, about, faq, terms

## T8 — Real vs nominal · 3/5

- [x] dd-004 recorded: never use a concept the reader has not been given
- [x] Teach it inside the two-rates rung, in plain words `b128478`
- [x] Side-by-side columns, not a toggle (dd-006) `1c26a7b`
- [ ] Apply the pattern to SIP and insurance
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
- [ ] Promote sol-019 to active once T2 proves it, then apply to T3/T5/T6

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
- [x] SIP engine: 16 characterization tests `8c61dbf`
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
