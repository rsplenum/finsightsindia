---
name: finsight-learning-loop
description: Use this skill ALONGSIDE finsight-drafting-workflow to give the Content Factory cross-run memory. finsight-drafting-workflow is the fast loop (per-article QA, bounded retries, no memory between articles). This skill is the slow loop — a persistent failure log, a periodic pattern-mining agent, a regression gate, and a versioned changelog for the pipeline's own rules. This skill does not replace Part A/B of finsight-drafting-workflow; it extends them at four specific integration points marked below.
---

# The FinSight Learning Loop (Slow Loop)

## H0. Why this exists

The fast loop (`finsight-drafting-workflow`) is a QA gate: it catches problems *within* one article, up to 2 retries, then escalates. It has no memory — article #47 starts from the exact same rules as article #1, even if #1 through #46 all failed the same way.

This skill closes that gap. It does not make the Orchestrator smarter in the moment. It makes the Orchestrator's *rules* get smarter between articles, on a slower cadence, with a human approving every change.

**Division of labor — read this before implementing:**
- **Logging, counting, diffing pass/fail** → deterministic code (`learning_loop.py`). No model call. These need to be boring and 100% reliable, not creative.
- **Finding the pattern across many failures** → one subagent (`content_pattern_auditor`), because that step genuinely benefits from language understanding.
- **Approving a rule change** → always a human (Rahul). Never automated. This system proposes; it does not self-modify.

---

## H1. The Failure Log

**Storage:** `content_factory_memory/failure_log.jsonl` — one JSON object per line, append-only, never rewritten in place.

**Schema (one entry):**
```json
{
  "id": "a3f1c9d2",
  "timestamp": "2026-08-15T09:12:00Z",
  "article_slug": "schedule-fa-bma-penalty",
  "stage": "gate2_draft",
  "iteration": 1,
  "rule_id": "S3",
  "quote": "the notice lands like a ransom demand from the taxman",
  "fix_applied": "Rewrote to remove crime-thriller framing per Part F ban list.",
  "resolved_by": "drafter_rewrite",
  "human_note": null
}
```

**Write triggers — the Orchestrator MUST append an entry for every one of these, even ones that get fixed on the same run:**
1. Every Gate 1 FAIL (research audit).
2. Every Gate 2 FAIL, each iteration (so a fail-then-fix-on-retry still gets logged — the fact that it failed once is the signal, regardless of whether the retry succeeded).
3. Every use of the Manual Intervention State.

**The `human_note` field is the highest-value field in the entire system.** When you (Rahul) manually edit an MDX file during Manual Intervention, the Orchestrator must prompt you for one sentence on *why* — not just what changed. "Removed the vault metaphor, it undersold the FAST-DS turn" is worth more to future pattern-mining than the diff itself, because the diff shows *what* changed and the note shows *why*, and *why* is what generalizes to the next article. If a manual edit gets logged without a note, mark `human_note: "UNLOGGED — recommend backfilling"` rather than skipping the entry — a partial record beats a missing one.

---

## H2. The `content_pattern_auditor` Subagent

**Role:** Pattern Auditor. This is the fifth subagent, instantiated alongside the existing four.

**Trigger:** Automatically every 10 published articles (tracked by `learning_loop.py::should_run_pattern_audit`), or manually on Rahul's command.

**Input:** `learning_loop.py::actionable_patterns()` — NOT a raw count. Rule ids are scoped to a rubric era (see `rule_registry.json`) and the last refactor changed the meaning of every M and S id at once. A raw `Counter` over `rule_id` strings silently adds unrelated failures together: before resolution the historical log's top count was 2, below the auditor's own threshold of 3, so the auditor would have found nothing at all. After resolution the same 18 entries yield two real patterns (M3 ×5, M2 ×3). Counting is only meaningful once identity is stable.

**System Prompt:**
> "You are the Pattern Auditor for FinSight India's Content Factory. You do not write or edit articles. Your only job is to find recurring failure patterns in the failure log and propose precise, minimal changes to the Ban List, the Evaluator rubric (R1–R7, M1–M5, S1–S5), or the researcher/drafter system prompts.
>
> Rules:
> - **Work only from `learning_loop.py::actionable_patterns()`.** Never count raw `rule_id` strings yourself — ids are era-scoped and several changed meaning across the last refactor.
> - Entries under `do_not_act_on` name retired or reversed rules. Several record the drafter being penalised for behaviour that is now mandatory (e.g. the old M9 required a "Key Takeaways" section that Part A2 now bans). Never propose a rule from these. Flag them for human review instead.
> - A pattern requires at least 3 occurrences of the same *resolved* rule id, OR 2 occurrences whose `human_note` fields point at the same root cause. A single incident is noise, not a pattern — do not propose a rule change for one occurrence.
> - Every proposal must cite the specific failure_log entry `id`s that justify it. No evidence, no proposal.
> - Propose the smallest possible change. Prefer tightening the wording of an existing rule over inventing a new `rule_id`. Only propose a new `rule_id` if nothing existing covers the pattern.
> - **You may propose removals as well as additions.** Consult `ceiling.py::propose_relaxation()` first. If an existing rule already covers the pattern and simply isn't firing, the fix is enforcement, not another rule. A loop whose only move is "add a constraint" can only shrink what the factory is allowed to produce.
> - Consult `ceiling.py::unnamed_dimensions()` — dimensions that decided real head-to-head comparisons but have no rule covering them. This is the only input from which a genuinely new quality criterion can come, rather than a tighter version of an existing one.
> - You never edit SKILL.md directly. You produce proposals only. A human approves or rejects each one.
>
> Output format, one block per proposal:
> ```
> PROPOSAL
> target: (file + section, e.g. "Evaluator Layer B, new rule S8")
> evidence: (failure_log ids, comma-separated)
> current_text: (existing rule text, or "NONE" if new)
> proposed_text: (the new/edited rule text)
> rationale: (one sentence)
> ```"

**Worked example** — this is the kind of proposal this agent should surface, using your own stated editorial principle (laws as designed responses to real problems, not parables) as the gap it closes:
```
PROPOSAL
target: Evaluator Layer B, new rule S8
evidence: a3f1c9d2, 9c22e701, 4b8f10aa
current_text: NONE (S7 checks that an Origin Story exists, but not that it reasons causally)
proposed_text: S8 — Causal arc: does the Origin Story explain the law as a
  designed response to a specific prior problem (cause → law → effect),
  rather than stating the law's provisions as historical trivia or wrapping
  them in a fictional parable?
rationale: Three drafts passed S7 (an origin story existed) but were flagged
  in manual intervention for reading as descriptive rather than causal —
  the gap S7 doesn't catch.
```

---

## H3. The Regression Gate

**Storage:** `content_factory_memory/regression_set/` — a fixed folder of 5–8 frozen case files, each a dossier or draft with a known-correct evaluator verdict. **You need both PASS and FAIL cases.** FAIL cases matter as much as PASS cases — they're what catch the rubric quietly getting *looser* over time, which a set of only-PASS cases would never detect.

**Case file schema:**
```json
{
  "case_id": "bma_causal_arc_should_pass",
  "gate": "gate2_draft",
  "input": "... frozen draft excerpt or dossier ...",
  "expected_result": "PASS"
}
```

**Protocol — required before ANY `content_pattern_auditor` proposal is merged into a live SKILL.md:**
1. Apply the proposed change to a scratch copy of the target SKILL.md only — never edit the live file directly.
2. Re-run the evaluator against every case in the regression set using the scratch copy (`learning_loop.py::run_regression_set`).
3. Compare each result to that case's `expected_result`.
4. **Any mismatch, in either direction, is a STOP.** A previously-PASSing case now failing means the change is too strict. A previously-FAILing case now passing means the change loosened something it shouldn't have. Either way: report the specific case to Rahul, do not merge.
5. Only a clean run goes to Rahul for final approval — and only Rahul merges it into the live file, by hand.

---

## H4. Versioning & Changelog

Every SKILL.md in this repo keeps a `CHANGELOG.md` alongside it. Format:
```
## v7 — 2026-08-15
- Added rule S8 (causal-arc origin story). Evidence: a3f1c9d2, 9c22e701, 4b8f10aa.
- Tightened M10 wording on "sweating taxpayer imagery" after 2 near-misses
  that used synonyms not in the literal ban list (e.g. "anxious filer").
  Evidence: 7d41ff02, e819a3c1.
```
Every entry names the failure_log evidence that motivated it. Six months from now this is the only place that actually shows whether v7 is better than v6, rather than just different.

---

## H5. Evaluator Calibration

Every 20 published articles: the Orchestrator calls `learning_loop.py::sample_verdicts_for_calibration(5)` to draw a blinded, PASS/FAIL-stratified sample of past Gate 2 verdicts, and asks Rahul to re-grade them independently. Feed his answers to `grade_calibration_sample({verdict_id: "PASS"|"FAIL"})`, which scores the agreement and logs it via `log_calibration_check`.

If the trailing 3-check average (`calibration_trend`) drops below 80%, the Orchestrator must surface an explicit flag: *"Evaluator calibration may be drifting — recommend reviewing the Layer B rubric before the next pattern audit."* This is the one check with no automation on the judging side by design — it exists specifically to catch the evaluator marking its own homework badly, and only a human comparison can catch that.

**This check was unrunnable until `verdict_log.jsonl` existed (H6).** It asks for a mix of PASS and FAIL, and the failure log stores only FAILs — there were no PASSes to sample. A quality system that only remembers what went wrong cannot tell you whether its successes were real.

---

## H6. The Verdict Log

**Storage:** `content_factory_memory/verdict_log.jsonl` — append-only, one entry per gate decision.

The failure log answers "what went wrong". The verdict log answers "what was decided", which is a strictly larger question and the one calibration and drift detection both need. Call `log_verdict(...)` on **every** Gate 1 and Gate 2 outcome, PASS included.

Two things become visible only with this log:
- **Calibration** (H5) gets its PASS sample.
- **Rubric gaming.** A rising Layer B average alongside a falling human agreement rate is the signature of drafts learning to satisfy the checklist rather than the reader. Neither number is computable without this log, and the failure log cannot show it because passing drafts leave no trace there.

---

## H7. The Ceiling — preferences and relaxation (`ceiling.py`)

Everything above this point regulates the floor. Two mechanisms sit above it, deliberately in a separate module so the measurable side cannot absorb their budget:

**Pairwise preference (`log_preference`).** The drafter produces two variants under different Forms; `content_ranker` compares them; Rahul decides. Comparative judgment is the only kind that can detect quality on a dimension nobody named in advance, which is precisely what an absolute rubric cannot do. The `why` field is the counterpart of `human_note`: the failure log records why something was *wrong*, this records why something was *better*, and those two generalise in different directions. `unnamed_dimensions()` surfaces the deciding dimensions that no rule covers — the only genuine source of new criteria.

**Relaxation (`propose_relaxation`).** The slow loop previously had exactly one operator: add a constraint. Every pass made the permitted space smaller, monotonically, which is the arithmetic reason it could not surprise you — independent of how well written any individual rule was. This is the opposite move, held to the same evidential standard: a rule that has never fired across a well-covered window is either internalised or unenforced, and both are reasons to stop spending evaluator attention on it.

It refuses to run on thin evidence. Below 30% logging coverage a zero failure count means "never observed", not "never violated", and it emits a `blocked` proposal explaining why instead of recommending you delete rules that were added last week from real failures. Removing a rule is the operator most likely to do quiet damage, because the loss is invisible until something bad ships.

---

## H8. Rule identity across rubric versions (`rule_registry.py`)

A `rule_id` is scoped to a rubric era, not global. Commit 59c3970 renumbered the evaluator rubric in place and every M and S id changed meaning at once; nothing errored, and half the failure log silently stopped resolving.

**Before any rubric renumbering:** add a new era to `rule_registry.json` and map every old id forward, marking each `renamed`, `renumbered`, `retired`, `reversed`, or `merged` with a reason. Run `python rule_registry.py validate` after. Never renumber without this — the damage is undetectable at the time and only shows up as an auditor that mysteriously finds nothing.

---

## Integration Patch — exact additions to `finsight-drafting-workflow/SKILL.md`

Add to **Part A1**, step 2 (Gate 1) and step 4 (Gate 2): *"On FAIL, call `log_failure(...)` before returning the critique to the researcher/drafter. Call `log_verdict(...)` for every verdict, PASS included."*

Add a new step 9 to Part A1: *"Learning Loop Check: after successful publish, call `audit_due()`. If it reports due, dispatch `content_pattern_auditor`, then call `mark_audit_run()`."* Prefer `audit_due()` over `should_run_pattern_audit()`: the latter fires only on an exact multiple and increments as a side effect, so a missed tick costs another ten articles — which is exactly what happened when the counter file didn't exist and five trigger points slid past.

Add to **Part B**: subagent entries for `content_pattern_auditor` (H2 above) and `content_ranker` (see the drafting skill's Part B, agent 4).

Add **Part H (Asset Safety)** to the drafting skill: never overwrite an untracked file at a target path without asking. Evidence: failure_log `a92b8d4f`, engineering-solutions `sol-014`.
