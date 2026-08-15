"""
FinSight Content Factory - Learning Loop (slow loop) utilities.

Deterministic bookkeeping for the failure log, verdict log, regression
harness, and calibration tracking. This module deliberately contains NO
agent/LLM calls. Logging, counting, and diffing pass/fail don't need a
model in the loop - using one just adds cost and a new source of error to
something that should be boring and 100% reliable. The only place an LLM
belongs in the slow loop is the content_pattern_auditor subagent itself
(see SKILL.md, H2), which you dispatch separately through your existing
CrewAI/Gemini orchestration - this module just tells you WHEN to dispatch
it and hands it pre-summarized input.

Wire this into your Orchestrator at the integration points marked in
SKILL.md's "Integration Patch" section.

Two things changed after the 2026-08-15 audit, and both were failures of
bookkeeping rather than of judgment:

1. Frequency counts now resolve through `rule_registry.py`. Counting raw
   rule_ids was safe right up until the rubric was renumbered in place,
   at which point it silently began adding unrelated things together.
   Counting is only meaningful once identity is stable.

2. Verdicts are logged, not just failures. H5 calibration asks Rahul to
   re-grade a blinded sample of past Gate 2 verdicts - which was
   impossible, because a log that only records FAILs has no PASSes to
   sample. A quality system that only remembers what went wrong cannot
   tell you whether its successes were real.

The ceiling-side machinery - pairwise preferences and the relaxation
operator - lives in `ceiling.py`, deliberately separate. The floor is
measurable and the ceiling is not, and mixing them in one module is how
the measurable one ends up eating the budget.
"""

from __future__ import annotations

import json
import uuid
import datetime
import random
from pathlib import Path
from collections import Counter, defaultdict
from typing import Callable, Literal, Optional

try:
    from rule_registry import resolve, era_for_entry, CURRENT_ERA
except ImportError:  # imported as part of a package rather than by path
    from .rule_registry import resolve, era_for_entry, CURRENT_ERA

MEMORY_DIR = Path("content_factory_memory")
FAILURE_LOG = MEMORY_DIR / "failure_log.jsonl"
VERDICT_LOG = MEMORY_DIR / "verdict_log.jsonl"
PUBLISH_COUNT_FILE = MEMORY_DIR / "publish_count.txt"
CALIBRATION_LOG = MEMORY_DIR / "calibration_log.jsonl"
REGRESSION_SET_DIR = MEMORY_DIR / "regression_set"
LIVE_ARTICLE_DIR = Path("src/content/direct-tax")

Stage = Literal["gate1_research", "gate2_draft", "manual_intervention"]
ResolvedBy = Literal[
    "drafter_rewrite", "researcher_revision", "human_manual_edit",
    "manual_orchestrator", "manual_intervention",
]
Gate = Literal["gate1_research", "gate2_draft"]
Verdict = Literal["PASS", "FAIL"]


def _ensure_memory_dir() -> None:
    MEMORY_DIR.mkdir(exist_ok=True)
    REGRESSION_SET_DIR.mkdir(exist_ok=True)


def _now() -> str:
    """UTC, and actually UTC.

    Two entries in the historical log carry IST clock times with a 'Z'
    suffix, which put them on the wrong side of a rubric boundary during
    the audit. Cheap to get right, annoying to untangle later.
    """
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


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

    Entries now stamp `rubric_version`. Without it, a future renumbering
    orphans the entry the same way the last one did - and orphaned entries
    don't announce themselves, they just quietly stop matching.
    """
    _ensure_memory_dir()
    entry = {
        "id": uuid.uuid4().hex[:8],
        "timestamp": _now(),
        "rubric_version": CURRENT_ERA,
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
            if resolved_by in ("human_manual_edit", "manual_orchestrator",
                               "manual_intervention")
            else None
        ),
    }
    with open(FAILURE_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def load_failure_log(since_id: Optional[str] = None) -> list[dict]:
    """Read all failure log entries, optionally only those after a given id."""
    entries = _read_jsonl(FAILURE_LOG)
    if since_id:
        ids = [e["id"] for e in entries]
        if since_id in ids:
            entries = entries[ids.index(since_id) + 1:]
    return entries


def summarize_by_rule_id(entries: list[dict], raw: bool = False) -> Counter:
    """
    Frequency count over rule_ids, resolved through the rule registry.

    Run this before ever dispatching the content_pattern_auditor agent - a
    Counter often already tells you 80% of what you need ("S3 has failed 6
    times, everything else is 1-2"), and the agent call is only worth its
    cost once the raw counts alone don't explain the pattern.

    Entries whose rule no longer forwards (retired, reversed, meta) are
    counted under a `[STATUS] id` key rather than dropped. Dropping them
    would hide the most interesting thing in the log: the places where the
    system was once penalised for doing what it is now required to do.

    Pass raw=True to see the pre-registry behaviour. The difference between
    the two is a direct measure of how much a rubric refactor cost you.
    """
    if raw:
        return Counter(e["rule_id"] for e in entries)

    counts: Counter = Counter()
    for e in entries:
        r = resolve(e["rule_id"], era_for_entry(e), entry_id=e.get("id"))
        if r.forwards:
            for cid in r.canonical_ids:
                counts[cid] += 1
        else:
            counts[r.label] += 1
    return counts


def actionable_patterns(entries: list[dict], threshold: int = 3) -> dict:
    """
    Split the log into what the pattern auditor may act on and what it
    must not.

    The auditor's rule is "3 occurrences of the same rule_id, or 2 sharing
    a root cause in human_note". That predicate is only sound over resolved
    ids. Over raw ids it was measuring noise: before resolution the top
    count in the historical log was 2, i.e. nothing crossed the threshold
    and the auditor would have reported no patterns at all - which reads
    exactly like good news.
    """
    counts = summarize_by_rule_id(entries)
    live = {k: v for k, v in counts.items() if not k.startswith("[")}
    dead = {k: v for k, v in counts.items() if k.startswith("[")}

    by_rule: dict[str, list[str]] = defaultdict(list)
    for e in entries:
        r = resolve(e["rule_id"], era_for_entry(e), entry_id=e.get("id"))
        for cid in (r.canonical_ids if r.forwards else [r.label]):
            by_rule[cid].append(e["id"])

    return {
        "actionable": {
            k: {"count": v, "evidence": by_rule[k]}
            for k, v in sorted(live.items(), key=lambda x: -x[1]) if v >= threshold
        },
        "below_threshold": {
            k: {"count": v, "evidence": by_rule[k]}
            for k, v in sorted(live.items(), key=lambda x: -x[1]) if v < threshold
        },
        "do_not_act_on": {
            k: {"count": v, "evidence": by_rule[k], }
            for k, v in sorted(dead.items(), key=lambda x: -x[1])
        },
        "_warning": "Entries under 'do_not_act_on' name rules that were "
                    "retired or reversed. Several record the drafter being "
                    "penalised for behaviour that is now mandatory, or "
                    "vice versa. Feeding them to the auditor teaches it "
                    "the opposite of current policy.",
    }


# ---------------------------------------------------------------------------
# Verdict log - every gate decision, not just the failures
# ---------------------------------------------------------------------------

def log_verdict(
    article_slug: str,
    gate: Gate,
    verdict: Verdict,
    iteration: int = 1,
    layer_b_score: Optional[int] = None,
    failed_rule_ids: Optional[list[str]] = None,
    residual_risk: Optional[str] = None,
) -> dict:
    """
    Record every Gate 1 / Gate 2 decision, PASS included.

    H5 (evaluator calibration) asks Rahul to blind-re-grade a sample of
    past verdicts. That was unrunnable: the failure log stores only FAILs,
    so a "mix of PASS and FAIL" sample had nothing to draw the PASSes
    from. This is the missing half.

    It also makes the evaluator's own drift measurable. A rising Layer B
    average with a falling human agreement rate is the signature of a
    rubric being gamed rather than met - and you cannot see either number
    without this log.
    """
    _ensure_memory_dir()
    entry = {
        "id": uuid.uuid4().hex[:8],
        "timestamp": _now(),
        "rubric_version": CURRENT_ERA,
        "article_slug": article_slug,
        "gate": gate,
        "iteration": iteration,
        "verdict": verdict,
        "layer_b_score": layer_b_score,
        "failed_rule_ids": failed_rule_ids or [],
        "residual_risk": residual_risk,
    }
    with open(VERDICT_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def load_verdict_log() -> list[dict]:
    return _read_jsonl(VERDICT_LOG)


def sample_verdicts_for_calibration(n: int = 5, gate: Gate = "gate2_draft",
                                    seed: Optional[int] = None) -> list[dict]:
    """
    Draw a blinded sample of past verdicts for Rahul to re-grade (H5).

    Returns entries with `verdict`, `layer_b_score` and `failed_rule_ids`
    stripped. The blinding is the point - showing the original verdict
    turns an independent judgment into a nudge, and the whole reason this
    check exists is to catch the evaluator marking its own homework badly.

    Stratified across PASS and FAIL where both exist, because a sample
    that happens to be all-PASS can only ever confirm the evaluator.
    """
    entries = [e for e in load_verdict_log() if e.get("gate") == gate]
    if not entries:
        return []

    rng = random.Random(seed)
    passes = [e for e in entries if e["verdict"] == "PASS"]
    fails = [e for e in entries if e["verdict"] == "FAIL"]

    want_fail = min(len(fails), n // 2)
    want_pass = min(len(passes), n - want_fail)
    want_fail = min(len(fails), n - want_pass)

    picked = rng.sample(passes, want_pass) + rng.sample(fails, want_fail)
    rng.shuffle(picked)

    return [
        {
            "verdict_id": e["id"],
            "article_slug": e["article_slug"],
            "gate": e["gate"],
            "iteration": e["iteration"],
            "_blinded": "original verdict withheld until you record yours",
        }
        for e in picked
    ]


def grade_calibration_sample(graded: dict[str, Verdict]) -> dict:
    """
    Score Rahul's blind re-grade against what the evaluator originally said.

    `graded` maps verdict_id -> Rahul's independent PASS/FAIL. Returns the
    per-item comparison plus the agreement rate, and logs it via
    log_calibration_check so the trend is tracked.
    """
    by_id = {e["id"]: e for e in load_verdict_log()}
    rows = []
    for vid, human in graded.items():
        original = by_id.get(vid)
        if original is None:
            rows.append({"verdict_id": vid, "error": "unknown verdict id"})
            continue
        rows.append({
            "verdict_id": vid,
            "article_slug": original["article_slug"],
            "evaluator_said": original["verdict"],
            "rahul_said": human,
            "agreed": original["verdict"] == human,
        })

    valid = [r for r in rows if "agreed" in r]
    agreements = sum(1 for r in valid if r["agreed"])
    logged = log_calibration_check(len(valid), agreements) if valid else None

    return {"comparisons": rows, "logged": logged,
            "disagreements": [r for r in valid if not r["agreed"]]}


# ---------------------------------------------------------------------------
# Publish counter - triggers the periodic slow-loop pass
# ---------------------------------------------------------------------------

def count_published_articles() -> int:
    """Ground truth: how many articles are actually live."""
    if not LIVE_ARTICLE_DIR.exists():
        return 0
    return len(list(LIVE_ARTICLE_DIR.glob("*.mdx")))


def increment_publish_count() -> int:
    _ensure_memory_dir()
    count = 0
    if PUBLISH_COUNT_FILE.exists():
        raw = PUBLISH_COUNT_FILE.read_text().strip()
        count = int(raw) if raw else 0
    count += 1
    PUBLISH_COUNT_FILE.write_text(str(count))
    return count


def reconcile_publish_count() -> dict:
    """
    Check the counter against the article directory.

    The counter file simply never existed, so `should_run_pattern_audit`
    was called zero times across 51 published articles and the every-10
    trigger never fired once. A bare integer in a file that any run can
    forget to increment will drift again; this makes the drift visible
    instead of silent.
    """
    _ensure_memory_dir()
    actual = count_published_articles()
    tracked = 0
    if PUBLISH_COUNT_FILE.exists():
        raw = PUBLISH_COUNT_FILE.read_text().strip()
        tracked = int(raw) if raw else 0
    return {
        "tracked": tracked,
        "actual_published": actual,
        "drift": actual - tracked,
        "healthy": actual == tracked,
    }


def should_run_pattern_audit(every_n: int = 10) -> bool:
    """Call once after each successful publish. True on article 10, 20, 30..."""
    return increment_publish_count() % every_n == 0


def audit_due(every_n: int = 10, threshold: int = 3) -> dict:
    """
    Should the pattern auditor run? Answered from state, not from a
    side effect.

    `should_run_pattern_audit` only fires on an exact multiple, which makes
    it fragile in exactly the way that bit here: the counter file never
    existed, five trigger points slid past unnoticed, and nothing in the
    system could tell you an audit was overdue rather than merely not-yet-
    due. Missing one tick shouldn't mean waiting another ten articles.

    This is also the safer call to make from an orchestrator, because it
    doesn't increment anything - so asking the question twice can't skip
    a trigger.
    """
    rec = reconcile_publish_count()
    published = rec["actual_published"]
    marker = MEMORY_DIR / "last_audit.json"
    last_at = 0
    if marker.exists():
        last_at = json.loads(marker.read_text(encoding="utf-8")).get(
            "published_count_at_audit", 0)

    since = published - last_at
    patterns = actionable_patterns(load_failure_log(), threshold)
    missed = (published // every_n) - (last_at // every_n)

    return {
        "due": since >= every_n or bool(patterns["actionable"]),
        "published": published,
        "last_audit_at": last_at,
        "articles_since_audit": since,
        "missed_trigger_points": max(0, missed),
        "actionable_patterns": patterns["actionable"],
        "reason": (
            f"{len(patterns['actionable'])} pattern(s) at or above the "
            f"{threshold}-occurrence threshold"
            if patterns["actionable"]
            else f"{since} articles since last audit"
        ),
    }


def mark_audit_run(notes: Optional[str] = None) -> dict:
    """Record that a pattern audit actually happened."""
    _ensure_memory_dir()
    entry = {
        "timestamp": _now(),
        "published_count_at_audit": count_published_articles(),
        "notes": notes,
    }
    (MEMORY_DIR / "last_audit.json").write_text(
        json.dumps(entry, indent=2), encoding="utf-8")
    return entry


# ---------------------------------------------------------------------------
# H3 - Regression gate
# ---------------------------------------------------------------------------

def _scoping_note(case: dict) -> str:
    """
    Tell the evaluator which rules a case is actually exercising.

    Every frozen case is a short excerpt written to probe one or two rules.
    Without this, the evaluator applies the entire rubric and fails a prose
    fragment on M1 (no MDX structure) and M5 (no SVG proposals) - criteria it
    could never satisfy and was never written to. That made PASS cases fail
    for irrelevant reasons, and, worse, made FAIL cases pass for them: a
    fragment fails something, so `should_fail` succeeded whether or not the
    rule under test ever fired. The gate was giving false confidence in both
    directions, and it degraded silently as rules were added.
    """
    rules = case.get("rules_under_test") or []
    if not rules:
        return ""
    return (
        "\n\n---\nREGRESSION MODE. The input below is a deliberate excerpt, not a "
        f"complete article. Judge it ONLY against: {', '.join(rules)}. Ignore every "
        "other rule. In particular do not fail it for missing MDX structure, "
        "headers, frontmatter or [SVG_PROPOSAL] tags — an excerpt cannot have "
        "those and their absence says nothing about the rules under test. "
        "Answer with PASS or FAIL on the first line."
    )


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

    Returns a report dict. Any entry under "regressions" means STOP - do
    not merge the rule change that produced this run. This applies in
    BOTH directions: a case that used to pass and now fails is one kind of
    regression (the rule got too strict); a case that used to fail and now
    passes is the other kind (the rule got too loose) - and the second
    kind is the one a PASS-only regression set would never catch.
    """
    _ensure_memory_dir()
    report = {"total": 0, "matched": 0, "regressions": [], "errors": []}
    for case_file in sorted(REGRESSION_SET_DIR.glob("*.json")):
        case = json.loads(case_file.read_text(encoding="utf-8"))
        report["total"] += 1
        actual = evaluate_fn(case["input"] + _scoping_note(case))
        if actual not in ("PASS", "FAIL"):
            # An unparseable verdict is not a pass. Treating UNKNOWN as
            # anything other than a hard stop would let a broken evaluator
            # wave a rule change through.
            report["errors"].append({"case_id": case["case_id"], "got": actual})
            report["regressions"].append({
                "case_id": case["case_id"],
                "expected": case["expected_result"],
                "actual": actual,
            })
        elif actual == case["expected_result"]:
            report["matched"] += 1
        else:
            report["regressions"].append({
                "case_id": case["case_id"],
                "expected": case["expected_result"],
                "actual": actual,
            })
    report["clean"] = not report["regressions"]
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
        "timestamp": _now(),
        "sample_size": sample_size,
        "agreements": agreements,
        "agreement_rate": round(agreements / sample_size, 3) if sample_size else None,
    }
    with open(CALIBRATION_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


def calibration_trend(last_n: int = 3) -> Optional[float]:
    """Average agreement rate over the last N calibration checks."""
    recent = _read_jsonl(CALIBRATION_LOG)[-last_n:]
    rates = [r["agreement_rate"] for r in recent if r.get("agreement_rate") is not None]
    return round(sum(rates) / len(rates), 3) if rates else None


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"

    if cmd == "status":
        entries = load_failure_log()
        print(f"{len(entries)} failure log entries on file.\n")

        raw = summarize_by_rule_id(entries, raw=True)
        resolved = summarize_by_rule_id(entries)
        print("By rule_id (RAW - what the auditor used to see):")
        for rid, count in raw.most_common():
            print(f"  {rid}: {count}")
        print(f"  -> max count {max(raw.values(), default=0)}; "
              f"threshold is 3\n")

        print("By rule_id (RESOLVED through registry):")
        for rid, count in resolved.most_common():
            print(f"  {rid}: {count}")

        pat = actionable_patterns(entries)
        print(f"\nActionable patterns (>=3 occurrences): "
              f"{len(pat['actionable'])}")
        for rid, d in pat["actionable"].items():
            print(f"  {rid}: {d['count']}  evidence: {', '.join(d['evidence'])}")
        print(f"\nMust NOT act on (retired/reversed/meta): "
              f"{sum(d['count'] for d in pat['do_not_act_on'].values())} entries")
        for rid, d in pat["do_not_act_on"].items():
            print(f"  {rid}: {d['count']}")

        rec = reconcile_publish_count()
        print(f"\nPublish counter: tracked={rec['tracked']} "
              f"actual={rec['actual_published']} drift={rec['drift']}")
        verdicts = load_verdict_log()
        print(f"Verdict log: {len(verdicts)} entries "
              f"({sum(1 for v in verdicts if v['verdict']=='PASS')} PASS / "
              f"{sum(1 for v in verdicts if v['verdict']=='FAIL')} FAIL)")
        trend = calibration_trend()
        print(f"Calibration trend (last 3 checks): "
              f"{trend if trend is not None else 'no data yet'}")

    elif cmd == "audit-check":
        if should_run_pattern_audit():
            print("Publish count hit a multiple of 10 - dispatch content_pattern_auditor now.")
        else:
            print("Not yet - keep publishing.")

    elif cmd == "audit-due":
        print(json.dumps(audit_due(), indent=2))

    elif cmd == "reconcile":
        print(json.dumps(reconcile_publish_count(), indent=2))

    elif cmd == "calibration-sample":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        sample = sample_verdicts_for_calibration(n)
        if not sample:
            print("No verdicts logged yet - nothing to calibrate against.")
            print("log_verdict() must run on every gate decision, including PASSes.")
        else:
            print(json.dumps(sample, indent=2))

    else:
        print(f"Unknown command: {cmd}")
        print("Usage: python learning_loop.py "
              "[status|audit-check|reconcile|calibration-sample [n]]")
