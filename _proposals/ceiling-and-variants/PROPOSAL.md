# Proposal: rule identity, the verdict log, and a ceiling that can rank

**Status:** staged, not merged. Nothing in `.agents/skills/` has been edited.
**Raised by:** audit of 2026-08-15
**Merge protocol:** H3 — regression gate must run clean, then Rahul merges by hand.

---

## Why this is staged rather than applied

The learning loop's own H3 says a rule change goes to a scratch copy, gets
regression-tested, and only Rahul merges it into the live file. The last
rubric change skipped that and renumbered M1–M14 → M1–M5 in place, which
orphaned half the failure log without producing a single error message.
Applying this proposal directly would repeat exactly the failure it exists
to fix.

There was also a mechanical reason the protocol got skipped, now fixed:
`run_learning_loop_regression.py` hardcoded the *live* SKILL.md path, so
"test a scratch copy first" was literally impossible. The only way to test
a change was to make it live. That's now a `--skill` argument.

---

## Part 1 — Corrections (no policy judgment; safe to merge on read)

These are factually wrong today. None of them is a taste call.

**1.1 — The pattern auditor is told to reason about a rubric that no longer exists.**
`finsight-learning-loop/SKILL.md:59` instructs the auditor to propose changes to
"the Evaluator rubric (R1–R6, M1–M12, S1–S7)". The live rubric is R1–R7, M1–M5,
S1–S5. The auditor is being pointed at eleven rule ids that were deleted and told
nothing about the five that replaced them.
→ Corrected in `LEARNING-LOOP.scratch.md`.

**1.2 — The auditor counts raw rule ids.**
Its input is `summarize_by_rule_id`, a `Counter` over bare strings. Across the era
boundary that adds unrelated failures together. Concretely, in the current log:

| | raw count | resolved |
|---|---|---|
| highest single count | **2** | **5** |
| patterns ≥3 (auditor's own threshold) | **0** | **2** |

Raw, the auditor finds nothing and reports "no patterns" — which reads exactly
like good news. Resolved, two real patterns appear: **M3 (bespoke headers) ×5**
and **M2 (banned melodrama) ×3**. Both have been sitting in the log unactioned.
→ Auditor input switched to `actionable_patterns()`.

**1.3 — Reversed rules are being fed to the auditor as evidence.**
Old M9 required a "Key Takeaways" section. Part A2 now bans it. The log contains
the drafter being penalised for omitting exactly what is now prohibited. Same for
old M2 (TL;DR bullets) and old M4 (First Principles, later banned as a literal
heading). An auditor mining these naively learns current policy backwards.
→ `actionable_patterns()` segregates these under `do_not_act_on`.

**1.4 — H5 calibration has never been runnable.**
It asks for a blinded mix of PASS and FAIL verdicts. The failure log stores only
FAILs. There were no PASSes to sample, which is why `calibration_log.jsonl` never
appeared despite 51 published articles.
→ New `verdict_log.jsonl` + `sample_verdicts_for_calibration()`.

**1.5 — The audit trigger has fired zero times.**
`publish_count.txt` never existed, so `should_run_pattern_audit()` was never
called. Five trigger points passed unnoticed. The function also increments as a
side effect, so asking twice skips a trigger, and missing one tick costs another
ten articles.
→ Counter seeded to the true count (51) and reconciled against the article
directory; new `audit_due()` answers from state without mutating it.

---

## Part 2 — Policy changes (require the regression gate)

**2.1 — Split the evaluator's two jobs.**
`content_evaluator` currently guards both the floor and the ceiling. The floor is
measurable and the ceiling is not, so given one agent and one budget the
measurable job wins: the Floor has grown to R1–R7 plus M1–M5 with sub-clauses,
while the Mandate is still one sentence and Layer B is a 5-point compliance
count whose maximum means "violated nothing we thought to ask for".

- `content_evaluator` keeps the Floor, and is explicitly told not to rank, compare, or praise.
- Layer B is renamed **The Mandate Minimum** with a line stating that 5/5 is a floor, not a target.
- New `content_ranker` owns the ceiling and *may only compare*, never score in isolation.

**2.2 — Twin variants.**
The drafter produces two drafts of the same dossier under different Forms
(primary + contrast, both nominated by the strategist). Cost: one extra draft.
Yield: the only signal in the system that carries information about *better*
rather than *acceptable*. Includes an honest escape hatch — if the dossier admits
only one sane structure, say so and produce one.

**2.3 — Log preferences.**
`ceiling.py::log_preference()` records the head-to-head outcome and, more
importantly, Rahul's one-line *why*. The failure log captures why something was
wrong; this captures why something was better. `unnamed_dimensions()` surfaces
deciding dimensions that no rule covers — the only source of genuinely new
criteria rather than tighter versions of old ones.

**2.4 — Give the loop a second operator.**
`propose_relaxation()` can propose retiring or loosening a rule, held to the same
evidence standard as additions. It refuses to emit retirement proposals below 30%
logging coverage — at today's 5.9% it correctly blocks itself and explains why
rather than recommending you delete R7 and M4, which were added days ago from
real failures.

**2.5 — Part H, asset safety.**
Never overwrite an untracked file at a target path without asking. Evidence:
`a92b8d4f` (hero illustration destroyed via hardcoded filename) and `sol-014`
(articles vanished from the live site). Same failure class, logged in two
different memories that share no schema, which is why it was never seen as a
pattern.

---

## What is NOT in this proposal

**Rule retirements.** The relaxation operator flags 11 of 17 live rules as never
having fired, but at 5.9% logging coverage that is a measurement artifact, not a
finding. Fix coverage first — call `log_verdict()` on every gate decision for
10–15 articles — then re-run. Recorded here so it isn't rediscovered as news.

**Resolution of the three reversals.** M2, M4 and M9 changed from required to
banned with no CHANGELOG entry explaining which era was right. That's a judgment
call, and it's yours. `ceiling.py relax` lists them under `reversal_review`.

---

## Merge steps

```bash
python run_learning_loop_regression.py --skill _proposals/ceiling-and-variants/SKILL.scratch.md --baseline
```

4 frozen cases × 2 rubrics = 8 API calls. Any entry under `regressions`, in
either direction, is a STOP. On a clean run, copy the scratch files over the live
ones and add a CHANGELOG entry naming the evidence ids above.

`--dry-run` shows the plan and makes no calls.
