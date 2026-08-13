"""
FinSight Content Factory - Learning Loop (slow loop) utilities.

Deterministic bookkeeping for the failure log, regression harness, and
calibration tracking. This module deliberately contains NO agent/LLM calls.
Logging, counting, and diffing pass/fail don't need a model in the loop -
using one just adds cost and a new source of error to something that should
be boring and 100% reliable. The only place an LLM belongs in the slow loop
is the content_pattern_auditor subagent itself (see SKILL.md, H2), which you
dispatch separately through your existing CrewAI/Gemini orchestration - this
module just tells you WHEN to dispatch it and hands it pre-summarized input.

Wire this into your Orchestrator at the four integration points marked in
SKILL.md's "Integration Patch" section.
"""

from __future__ import annotations

import json
import uuid
import datetime
from pathlib import Path
from collections import Counter
from typing import Callable, Literal, Optional

MEMORY_DIR = Path("content_factory_memory")
FAILURE_LOG = MEMORY_DIR / "failure_log.jsonl"
PUBLISH_COUNT_FILE = MEMORY_DIR / "publish_count.txt"
CALIBRATION_LOG = MEMORY_DIR / "calibration_log.jsonl"
REGRESSION_SET_DIR = MEMORY_DIR / "regression_set"

Stage = Literal["gate1_research", "gate2_draft", "manual_intervention"]
ResolvedBy = Literal["drafter_rewrite", "researcher_revision", "human_manual_edit"]


def _ensure_memory_dir() -> None:
    MEMORY_DIR.mkdir(exist_ok=True)
    REGRESSION_SET_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# H1 - Failure log
# ---------------------------------------------------------------------------

def log_failure(
    article_slug: str,
    stage: Stage,
    rule_id: str,
    quote: str,
    fix_applied: str,
    resolved_by: ResolvedBy,
    iteration: Optional[int] = None,
    human_note: Optional[str] = None,
) -> dict:
    """
    Append one structured entry to the failure log. Call this from the
    Orchestrator every time Gate 1 or Gate 2 returns FAIL (each iteration,
    even ones fixed on the same run), and every time Manual Intervention
    is used.

    For manual_intervention entries, always try to pass a real human_note -
    it's the highest-value field in the log, because it's the one place
    your judgment about *why* something was wrong gets captured instead of
    disappearing the moment you save the file.
    """
    _ensure_memory_dir()
    entry = {
        "id": uuid.uuid4().hex[:8],
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "article_slug": article_slug,
        "stage": stage,
        "iteration": iteration,
        "rule_id": rule_id,
        "quote": quote,
        "fix_applied": fix_applied,
        "resolved_by": resolved_by,
        "human_note": human_note
        or (
            "UNLOGGED - recommend backfilling"
            if resolved_by == "human_manual_edit"
            else None
        ),
    }
    with open(FAILURE_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def load_failure_log(since_id: Optional[str] = None) -> list[dict]:
    """Read all failure log entries, optionally only those after a given id."""
    if not FAILURE_LOG.exists():
        return []
    entries = [
        json.loads(line)
        for line in FAILURE_LOG.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if since_id:
        ids = [e["id"] for e in entries]
        if since_id in ids:
            entries = entries[ids.index(since_id) + 1 :]
    return entries


def summarize_by_rule_id(entries: list[dict]) -> Counter:
    """
    Quick frequency count. Run this before ever dispatching the
    content_pattern_auditor agent - a Counter often already tells you 80%
    of what you need ("S3 has failed 6 times, everything else is 1-2"),
    and the agent call is only worth its cost once the raw counts alone
    don't explain the pattern.
    """
    return Counter(e["rule_id"] for e in entries)


# ---------------------------------------------------------------------------
# Publish counter - triggers the periodic slow-loop pass
# ---------------------------------------------------------------------------

def increment_publish_count() -> int:
    _ensure_memory_dir()
    count = 0
    if PUBLISH_COUNT_FILE.exists():
        raw = PUBLISH_COUNT_FILE.read_text().strip()
        count = int(raw) if raw else 0
    count += 1
    PUBLISH_COUNT_FILE.write_text(str(count))
    return count


def should_run_pattern_audit(every_n: int = 10) -> bool:
    """Call once after each successful publish. True on article 10, 20, 30..."""
    return increment_publish_count() % every_n == 0


# ---------------------------------------------------------------------------
# H3 - Regression gate
# ---------------------------------------------------------------------------

def run_regression_set(evaluate_fn: Callable[[str], str]) -> dict:
    """
    Re-run every frozen case in content_factory_memory/regression_set/
    through `evaluate_fn` and diff the result against each case's
    expected_result.

    evaluate_fn: Callable[[str], "PASS" | "FAIL"]
        Wire this to your actual evaluator agent call, pointed at whichever
        SKILL.md version you're testing - including a scratch/proposed one.
        It should accept the case's `input` and return the evaluator's
        verdict as a plain string, "PASS" or "FAIL".

    Each case file in regression_set/ is a JSON object, e.g.:
        {
          "case_id": "bma_causal_arc_should_pass",
          "gate": "gate2_draft",
          "input": "... frozen draft excerpt or dossier ...",
          "expected_result": "PASS"
        }

    Returns a report dict. Any entry under "regressions" means STOP - do
    not merge the rule change that produced this run. This applies in
    BOTH directions: a case that used to pass and now fails is one kind of
    regression (the rule got too strict); a case that used to fail and now
    passes is the other kind (the rule got too loose) - and the second
    kind is the one a PASS-only regression set would never catch.
    """
    _ensure_memory_dir()
    report = {"total": 0, "matched": 0, "regressions": []}
    for case_file in sorted(REGRESSION_SET_DIR.glob("*.json")):
        case = json.loads(case_file.read_text(encoding="utf-8"))
        report["total"] += 1
        actual = evaluate_fn(case["input"])
        if actual == case["expected_result"]:
            report["matched"] += 1
        else:
            report["regressions"].append(
                {
                    "case_id": case["case_id"],
                    "expected": case["expected_result"],
                    "actual": actual,
                }
            )
    return report


# ---------------------------------------------------------------------------
# H5 - Evaluator calibration
# ---------------------------------------------------------------------------

def log_calibration_check(sample_size: int, agreements: int) -> dict:
    """
    Call after Rahul blind-re-grades a sample of past Gate 2 verdicts.
    agreements = number of the sample where his independent judgment
    matched what the evaluator originally decided.
    """
    _ensure_memory_dir()
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "sample_size": sample_size,
        "agreements": agreements,
        "agreement_rate": round(agreements / sample_size, 3) if sample_size else None,
    }
    with open(CALIBRATION_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


def calibration_trend(last_n: int = 3) -> Optional[float]:
    """Average agreement rate over the last N calibration checks."""
    if not CALIBRATION_LOG.exists():
        return None
    lines = [l for l in CALIBRATION_LOG.read_text(encoding="utf-8").splitlines() if l.strip()]
    if not lines:
        return None
    recent = [json.loads(l) for l in lines[-last_n:]]
    rates = [r["agreement_rate"] for r in recent if r["agreement_rate"] is not None]
    return round(sum(rates) / len(rates), 3) if rates else None


if __name__ == "__main__":
    import sys

    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"

    if cmd == "status":
        entries = load_failure_log()
        print(f"{len(entries)} failure log entries on file.")
        if entries:
            print("By rule_id:")
            for rule_id, count in summarize_by_rule_id(entries).most_common():
                print(f"  {rule_id}: {count}")
        trend = calibration_trend()
        print(f"Calibration trend (last 3 checks): {trend if trend is not None else 'no data yet'}")

    elif cmd == "audit-check":
        # Call this once, right after a publish, to see if it's time to
        # dispatch content_pattern_auditor.
        if should_run_pattern_audit():
            print("Publish count hit a multiple of 10 - dispatch content_pattern_auditor now.")
        else:
            print("Not yet - keep publishing.")

    else:
        print(f"Unknown command: {cmd}")
        print("Usage: python learning_loop.py [status|audit-check]")
