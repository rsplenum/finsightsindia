"""
FinSight Content Factory - Content Graph & Strategy Logging.

Companion to learning_loop.py. Where that module tracks WHAT WENT WRONG
(the fast/slow loop), this module tracks WHAT WAS CHOSEN and HOW THE
CONTENT FITS TOGETHER (the strategy layer added in Phase 1):

  - the content graph: which topics have a pillar piece, which spokes
    link back to it, and where "pillar debt" exists
  - the strategist log: every angle proposed per topic and which one
    Rahul picked
  - the pattern-auditor proposal log: every rule-change proposal and
    whether Rahul approved it

All three matter because they're the only source data for the Strategy
and Learning-Loop rows of the KPI dashboard. Like learning_loop.py, this
file is pure bookkeeping - no LLM calls.
"""

from __future__ import annotations

import json
import datetime
from pathlib import Path
from collections import Counter
from typing import Optional

MEMORY_DIR = Path("content_factory_memory")
CONTENT_GRAPH = MEMORY_DIR / "content_graph.json"
STRATEGIST_LOG = MEMORY_DIR / "strategist_log.jsonl"
PROPOSAL_LOG = MEMORY_DIR / "proposal_log.jsonl"


def _ensure_memory_dir() -> None:
    MEMORY_DIR.mkdir(exist_ok=True)
    if not CONTENT_GRAPH.exists():
        CONTENT_GRAPH.write_text(json.dumps({"pillars": {}}, indent=2))


# ---------------------------------------------------------------------------
# Content graph - pillars and spokes
# ---------------------------------------------------------------------------

def _load_graph() -> dict:
    _ensure_memory_dir()
    return json.loads(CONTENT_GRAPH.read_text(encoding="utf-8"))


def _save_graph(graph: dict) -> None:
    CONTENT_GRAPH.write_text(json.dumps(graph, indent=2, ensure_ascii=False))


def register_pillar(topic_id: str, slug: str, title: str) -> dict:
    """
    Mark an article as the pillar (deep, canonical piece) for a topic area.
    topic_id is a short stable key you choose, e.g. "black_money_act_schedule_fa".
    """
    graph = _load_graph()
    graph["pillars"][topic_id] = {
        "slug": slug,
        "title": title,
        "registered": datetime.datetime.utcnow().isoformat() + "Z",
        "spokes": graph["pillars"].get(topic_id, {}).get("spokes", []),
    }
    _save_graph(graph)
    return graph["pillars"][topic_id]


def register_spoke(topic_id: str, spoke_slug: str, spoke_title: str) -> dict:
    """
    Link a narrow article back to an existing pillar. Raises if no pillar
    is registered for topic_id yet - register_pillar must come first, or
    call check_pillar_status to confirm before calling this.
    """
    graph = _load_graph()
    if topic_id not in graph["pillars"]:
        raise ValueError(
            f"No pillar registered for topic_id={topic_id!r}. "
            "Register the pillar first, or treat this as a standalone piece."
        )
    graph["pillars"][topic_id]["spokes"].append(
        {
            "slug": spoke_slug,
            "title": spoke_title,
            "linked": datetime.datetime.utcnow().isoformat() + "Z",
        }
    )
    _save_graph(graph)
    return graph["pillars"][topic_id]


def check_pillar_status(topic_id: str) -> dict:
    """
    The call the Strategist makes before proposing angles.
    Returns one of:
      {"status": "has_pillar", "pillar_slug": ..., "spoke_count": N}
      {"status": "no_pillar"}
    """
    graph = _load_graph()
    if topic_id in graph["pillars"]:
        p = graph["pillars"][topic_id]
        return {
            "status": "has_pillar",
            "pillar_slug": p["slug"],
            "pillar_title": p["title"],
            "spoke_count": len(p["spokes"]),
        }
    return {"status": "no_pillar"}


def pillar_debt_report() -> list[str]:
    """
    Topics that have accumulated spokes without ever getting upgraded to
    a real pillar are impossible to detect from register_pillar/spoke
    alone - this needs the strategist_log's 'pillar opportunity' flags,
    which is why it lives here rather than being derivable from the graph
    alone. See kpi_dashboard.py for how the two are combined.
    """
    entries = load_strategist_log()
    flagged = [e["topic"] for e in entries if e.get("pillar_relation_flagged") == "pillar_opportunity"]
    return sorted(set(flagged))


# ---------------------------------------------------------------------------
# Strategist run log
# ---------------------------------------------------------------------------

def log_strategist_run(
    topic: str,
    angles: list[dict],
    chosen_angle_id: Optional[str],
    pillar_relation_flagged: Optional[str] = None,
) -> dict:
    """
    Call once per Strategist dispatch, after Rahul has made (or deferred)
    a choice.

    angles: list of {"angle_id": ..., "risk_level": "safe"|"moderate"|"off-template", ...}
    chosen_angle_id: which one Rahul picked, or None if he asked for a fresh set.
    pillar_relation_flagged: "pillar_opportunity" if the strategist raised
        that flag for this topic (see pillar_debt_report above).
    """
    _ensure_memory_dir()
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "topic": topic,
        "angles": angles,
        "chosen_angle_id": chosen_angle_id,
        "pillar_relation_flagged": pillar_relation_flagged,
    }
    with open(STRATEGIST_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def load_strategist_log() -> list[dict]:
    if not STRATEGIST_LOG.exists():
        return []
    return [json.loads(l) for l in STRATEGIST_LOG.read_text(encoding="utf-8").splitlines() if l.strip()]


def strategist_kpis() -> dict:
    """
    The KPIs from the table: off-template inclusion rate, chosen risk-level
    distribution, and pillar-opportunity flag count.
    """
    entries = load_strategist_log()
    if not entries:
        return {"runs": 0}

    off_template_runs = sum(
        1 for e in entries if any(a.get("risk_level") == "off-template" for a in e["angles"])
    )
    chosen_levels = Counter()
    for e in entries:
        if e["chosen_angle_id"] is None:
            continue
        chosen = next((a for a in e["angles"] if a["angle_id"] == e["chosen_angle_id"]), None)
        if chosen:
            chosen_levels[chosen["risk_level"]] += 1

    return {
        "runs": len(entries),
        "off_template_inclusion_rate": round(off_template_runs / len(entries), 3),
        "chosen_risk_level_distribution": dict(chosen_levels),
        "pillar_opportunities_flagged": len(pillar_debt_report()),
    }


# ---------------------------------------------------------------------------
# Pattern-auditor proposal outcomes (feeds the auditor's own KPI)
# ---------------------------------------------------------------------------

def log_proposal_outcome(proposal_id: str, target: str, approved: bool) -> dict:
    """Call whenever Rahul approves or rejects a content_pattern_auditor PROPOSAL block."""
    _ensure_memory_dir()
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "proposal_id": proposal_id,
        "target": target,
        "approved": approved,
    }
    with open(PROPOSAL_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def load_proposal_log() -> list[dict]:
    if not PROPOSAL_LOG.exists():
        return []
    return [json.loads(l) for l in PROPOSAL_LOG.read_text(encoding="utf-8").splitlines() if l.strip()]


def auditor_approval_rate() -> Optional[float]:
    entries = load_proposal_log()
    if not entries:
        return None
    approved = sum(1 for e in entries if e["approved"])
    return round(approved / len(entries), 3)


if __name__ == "__main__":
    print("Content graph:", json.dumps(_load_graph(), indent=2))
    print("Strategist KPIs:", strategist_kpis())
    print("Auditor approval rate:", auditor_approval_rate())
