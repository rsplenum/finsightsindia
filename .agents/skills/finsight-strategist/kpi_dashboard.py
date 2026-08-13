"""
FinSight Content Factory - KPI Dashboard.

Pulls together learning_loop.py (fast/slow loop data) and content_graph.py
(strategy layer data) into the per-agent KPI report. Run this weekly, not
daily - these numbers need enough volume behind them to mean anything, and
checking daily will just show you noise.

Requires learning_loop.py and content_graph.py in the same directory or on
the Python path.
"""

from __future__ import annotations

from collections import Counter

from learning_loop import load_failure_log, calibration_trend, PUBLISH_COUNT_FILE
from content_graph import strategist_kpis, auditor_approval_rate, load_proposal_log


def _total_articles() -> int:
    if not PUBLISH_COUNT_FILE.exists():
        return 0
    raw = PUBLISH_COUNT_FILE.read_text().strip()
    return int(raw) if raw else 0


def researcher_kpis(entries: list[dict], total_articles: int) -> dict:
    gate1_fails = [e for e in entries if e["stage"] == "gate1_research"]
    fail_articles = {e["article_slug"] for e in gate1_fails}
    r_rule_counts = Counter(e["rule_id"] for e in gate1_fails)
    return {
        "gate1_first_pass_rate": (
            round(1 - len(fail_articles) / total_articles, 3) if total_articles else None
        ),
        "top_failing_rules": r_rule_counts.most_common(3),
    }


def drafter_kpis(entries: list[dict], total_articles: int) -> dict:
    gate2_fails = [e for e in entries if e["stage"] == "gate2_draft"]
    fail_articles = {e["article_slug"] for e in gate2_fails}
    m_s_rule_counts = Counter(e["rule_id"] for e in gate2_fails)
    manual_interventions = [e for e in entries if e["stage"] == "manual_intervention"]
    return {
        "gate2_first_pass_rate": (
            round(1 - len(fail_articles) / total_articles, 3) if total_articles else None
        ),
        "top_failing_rules": m_s_rule_counts.most_common(3),
        "manual_intervention_rate": (
            round(len(manual_interventions) / total_articles, 3) if total_articles else None
        ),
    }


def evaluator_kpis() -> dict:
    return {
        "calibration_agreement_trend_last3": calibration_trend(3),
        "note": "Below 0.80 for 3 checks running means review the Layer B rubric.",
    }


def auditor_kpis() -> dict:
    entries = load_proposal_log()
    return {
        "proposals_logged": len(entries),
        "approval_rate": auditor_approval_rate(),
        "note": "Low approval rate isn't necessarily bad - it might mean the "
        "evidence bar (3+ occurrences) is working as a filter. Watch the "
        "trend, not a single number.",
    }


def print_report() -> None:
    entries = load_failure_log()
    total = _total_articles()

    print("=" * 60)
    print(f"FinSight Content Factory - KPI Report ({total} articles published)")
    print("=" * 60)

    print("\n[content_researcher]")
    for k, v in researcher_kpis(entries, total).items():
        print(f"  {k}: {v}")

    print("\n[content_drafter]")
    for k, v in drafter_kpis(entries, total).items():
        print(f"  {k}: {v}")

    print("\n[content_evaluator]")
    for k, v in evaluator_kpis().items():
        print(f"  {k}: {v}")

    print("\n[content_pattern_auditor]")
    for k, v in auditor_kpis().items():
        print(f"  {k}: {v}")

    print("\n[content_strategist]")
    for k, v in strategist_kpis().items():
        print(f"  {k}: {v}")

    print("\n[copywriter / art director / customer study]")
    print("  No KPI yet - Phase 2/3, blocked on Search Console / GA4 wiring.")
    print("=" * 60)


if __name__ == "__main__":
    print_report()
