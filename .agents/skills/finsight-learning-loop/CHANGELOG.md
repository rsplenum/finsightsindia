# finsight-learning-loop — CHANGELOG

## v2.0 — 2026-08-15 (infrastructure only; rubric changes staged separately)

Audit of the loop against 51 published articles found that three of its five
mechanisms had never run, and that the evidence base the other two depend on
had been silently corrupted by a rubric renumbering. None of this produced an
error at any point — every failure mode here is quiet by construction, which
is the thing worth remembering.

**Added — `rule_registry.py` + `content_factory_memory/rule_registry.json`.**
Rule ids are now scoped to a rubric era and resolve forward through explicit,
reviewed mappings. Commit 59c3970 renumbered M1–M14 → M1–M5 in place; every M
and S id changed meaning at once, and half the failure log stopped resolving.
Measured effect on the existing 18 entries: raw counting produced a maximum
frequency of **2** against the auditor's own threshold of 3 — i.e. zero
patterns, reported as "nothing found". Resolved, the same entries yield
**M3 ×5** (bespoke headers) and **M2 ×3** (banned melodrama). Evidence:
798f8cb2, 5a64a2fa, 05700fc1, 53cf4983, c7f3e9a2 (M3); d891ceed, 19fc0a16,
c7f3e9a2 (M2).

**Added — `verdict_log.jsonl`, `log_verdict()`, `sample_verdicts_for_calibration()`,
`grade_calibration_sample()`.** H5 calibration asks for a blinded mix of PASS and
FAIL verdicts; the failure log stores only FAILs, so the check had nothing to
sample and had never run once. The sample is stratified across both classes and
strips `verdict`, `layer_b_score`, `failed_rule_ids` and `residual_risk` before
returning.

**Added — `audit_due()` / `mark_audit_run()`.** `publish_count.txt` never existed,
so `should_run_pattern_audit()` was never called and five trigger points passed
unnoticed across 51 articles. `audit_due()` answers from state without
incrementing, so asking twice can't skip a trigger, and it reports overdue
rather than waiting another ten articles after a missed tick. Counter seeded to
51 and reconciled against `src/content/direct-tax/`.

**Added — `actionable_patterns()`.** Segregates retired and reversed rules under
`do_not_act_on`. Old M9 required a "Key Takeaways" section that Part A2 now
bans; old M2 and M4 reversed the same way. Feeding these to the auditor teaches
it current policy backwards.

**Added — `memory_index.py`.** One read-time view over six previously unjoined
stores. Demonstrated cost of the split: "dark mode" appears as `sol-002`
(engineering, 2026-08-07) and again as failure `c7f3e9a2` (content, 2026-08-14)
— the same failure class a week apart, in two memories that share no schema,
never connected. Logging coverage measured at **5.9%** (3 of 51 articles have
any logged gate signal).

**Added — `ceiling.py`.** Pairwise preference logging and the relaxation
operator; see H7. The loop previously had exactly one move — add a constraint —
which is the arithmetic reason it could not surprise you. `propose_relaxation()`
refuses to emit retirement proposals below 30% logging coverage rather than
recommending the deletion of R7 and M4, which were added days ago from real
failures.

**Fixed — `run_learning_loop_regression.py` hardcoded the live SKILL.md path.**
H3 step 1 says "apply the proposed change to a scratch copy only, never edit the
live file", and the harness could only read the live file. The protocol was
unexecutable as written, which is the most likely reason the renumbering shipped
untested. Now takes `--skill`, with `--baseline` and `--dry-run`. An unparseable
verdict is now a hard stop rather than being counted as a pass.

**Not changed:** `failure_log.jsonl` (append-only guarantee held — corrections
for three mis-tagged entries live in the registry's `entry_overrides`, not in the
log), and both live `SKILL.md` files. Rubric and workflow changes are staged at
`_proposals/ceiling-and-variants/` pending the H3 regression gate.
