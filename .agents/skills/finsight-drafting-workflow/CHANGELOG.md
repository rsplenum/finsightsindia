## v5.0 — 2026-08-15

Merged `_proposals/ceiling-and-variants/` after a clean H3 regression run
(4/4 on both the live rubric and the proposal, gemini-3.1-pro-preview).

- **Split the evaluator's two jobs.** `content_evaluator` now guards the Floor
  only and is explicitly told not to rank, compare or praise. Layer B renamed
  **The Mandate Minimum**, with a line stating that 5/5 means the draft failed
  to violate anything we thought to ask for — not that it is good.
- **Added `content_ranker`** (Part B, agent 4). Owns the ceiling and may only
  compare two drafts, never score one in isolation. Required to name the
  deciding dimension in its own words even when no rule covers it, and to
  report a `RULE_GAP` when none does.
- **Twin variants.** Step 3 now drafts the same dossier twice under different
  Forms (primary + contrast, both nominated by the strategist), with an honest
  escape hatch when the topic admits only one sane structure. Step 4b ranks
  them and records the outcome via `ceiling.py::log_preference`.
- **Step 9 now calls `audit_due()`** rather than `should_run_pattern_audit()`.
  The latter fires only on an exact multiple and increments as a side effect,
  so a missed tick cost another ten articles — which is what happened when the
  counter file did not exist and five trigger points passed unnoticed.
- **Part H, asset safety.** Never overwrite an untracked file at a target path
  without asking. Evidence: failure_log `a92b8d4f` (a human-approved hero
  illustration destroyed via a hardcoded filename) and `sol-014` (articles
  silently dropped from the live site).
- **Pattern auditor corrected.** It was being told to reason about
  "R1–R6, M1–M12, S1–S7", a rubric that stopped existing at commit 59c3970.
  Now R1–R7, M1–M5, S1–S5, and it must work from
  `learning_loop.py::actionable_patterns()` rather than counting raw rule ids.
  Evidence: raw counting peaked at 2 against its own threshold of 3, so it
  would have reported "no patterns found"; resolved, the same 18 entries yield
  M3 ×5 and M2 ×3.

## v4.1 — 2026-08-11
- Integrated `finsight-strategist` as Step 0 (Strategist Dispatch) of the fast loop.
- Added `content_strategist` subagent to Part B to force angle generation against competitive gaps.
- Wired `content_pattern_auditor` proposal outcomes to `content_graph.py::log_proposal_outcome()`.

## v4.0 — 2026-08-10
- Integrated `finsight-learning-loop` to provide cross-run memory.
- Added `log_failure` triggers to Gate 1 FAIL, Gate 2 FAIL, and Manual Intervention states.
- Added post-publish `Learning Loop Check` (Step 9).
- Added `content_pattern_auditor` as the 5th subagent.

## v1 - 2026-08-11
- Tightened R2 (Recency): now explicitly requires that any formal citation
  of an Income-tax Act section confirm and name the Income-tax Act, 2025
  equivalent, not just the 1961 section. Evidence: c4f6ba15 (backfilled,
  Schedule FA / Section 139(1) miss), 48e48cfb (P2P Lending Bad-Debt piece,
  Section 56/57/36 cited with no 2025 Act check).
- Added R7 (Primary Source Floor): a dossier making a formal statutory
  claim must ground at least one such claim in a primary source beyond a
  bare section number - case law, a circular, or a named regulatory
  document. Evidence: 48e48cfb (P2P piece cited zero primary sources
  despite ChatGPT's comparison piece finding several in the same
  research pass, e.g. CIT v. Byramjee Jeejeebhoy).
- Added M13 (Statutory Currency Preserved): the draft must retain, in
  reader-friendly language, any 2025 Act equivalent the dossier
  identified under R2 - prevents the simplification pass from silently
  dropping exactly the fact that mattered.
- Regression set: added 2 new cases (p2p_stale_act_no_primary_source_should_fail,
  p2p_current_act_with_case_law_should_pass). First draft of the R2 check
  caused a real regression on bma_causal_arc_should_pass (false-matched a
  Black Money Act section number as an Income-tax Act citation) - caught
  by the gate, corrected to require a formal citation pattern, re-tested
  clean on all 4 cases.
- Proposal prop_r2_tighten_r7_m13_add: approved.
