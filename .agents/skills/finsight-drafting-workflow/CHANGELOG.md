## v4.1 — 2026-08-11
- Integrated `finsight-strategist` as Step 0 (Strategist Dispatch) of the fast loop.
- Added `content_strategist` subagent to Part B to force angle generation against competitive gaps.
- Wired `content_pattern_auditor` proposal outcomes to `content_graph.py::log_proposal_outcome()`.

## v4.0 — 2026-08-10
- Integrated `finsight-learning-loop` to provide cross-run memory.
- Added `log_failure` triggers to Gate 1 FAIL, Gate 2 FAIL, and Manual Intervention states.
- Added post-publish `Learning Loop Check` (Step 9).
- Added `content_pattern_auditor` as the 5th subagent.
