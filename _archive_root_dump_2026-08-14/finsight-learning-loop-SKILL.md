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

**Input:** All failure log entries since the last audit, pre-grouped by `rule_id` (use `learning_loop.py::summarize_by_rule_id` first — often the raw frequency count already tells you most of what you need before the agent call is even justified).

**System Prompt:**
> "You are the Pattern Auditor for FinSight India's Content Factory. You do not write or edit articles. Your only job is to find recurring failure patterns in the failure log and propose precise, minimal changes to the Ban List, the Evaluator rubric (R1–R6, M1–M12, S1–S7), or the researcher/drafter system prompts.
>
> Rules:
> - A pattern requires at least 3 occurrences of the same `rule_id`, OR 2 occurrences whose `human_note` fields point at the same root cause. A single incident is noise, not a pattern — do not propose a rule change for one occurrence.
> - Every proposal must cite the specific failure_log entry `id`s that justify it. No evidence, no proposal.
> - Propose the smallest possible change. Prefer tightening the wording of an existing rule over inventing a new `rule_id`. Only propose a new `rule_id` if nothing existing covers the pattern.
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

Every 20 published articles: the Orchestrator surfaces a random sample of 5 past Gate 2 verdicts (mix of PASS and FAIL, blinded — don't show Rahul which the evaluator originally chose) and asks Rahul to re-grade them independently. Log the agreement rate via `learning_loop.py::log_calibration_check`.

If the trailing 3-check average (`calibration_trend`) drops below 80%, the Orchestrator must surface an explicit flag: *"Evaluator calibration may be drifting — recommend reviewing the Layer B rubric before the next pattern audit."* This is the one check with no automation on the judging side by design — it exists specifically to catch the evaluator marking its own homework badly, and only a human comparison can catch that.

---

## Integration Patch — exact additions to `finsight-drafting-workflow/SKILL.md`

Add to **Part A1**, step 2 (Gate 1) and step 4 (Gate 2): *"On FAIL, call `log_failure(...)` before returning the critique to the researcher/drafter."*

Add a new step 9 to Part A1: *"Learning Loop Check: after successful publish, call `should_run_pattern_audit()`. If it returns True, dispatch `content_pattern_auditor` before starting the next article."*

Add to **Part B**: a fifth subagent entry for `content_pattern_auditor` (system prompt in H2 above).
