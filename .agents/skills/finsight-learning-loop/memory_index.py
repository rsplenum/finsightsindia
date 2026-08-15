"""
FinSight Content Factory - one view over six memories.

The factory accumulated six memory stores, each with its own schema and no
join between them:

    content_factory_memory/failure_log.jsonl      content quality failures
    content_factory_memory/verdict_log.jsonl      every gate decision
    content_factory_memory/strategist_log.jsonl   angles proposed vs chosen
    content_factory_memory/content_graph.json     pillars and spokes
    src/data/engineering-solutions.json           build/UI failures + fixes
    src/data/shelved-ideas.json                   deliberately deferred work

The cost of that split is concrete. When the pipeline destroyed a
human-approved hero illustration by writing to a hardcoded filename, it
was filed in the *content* failure log under a rubric id, while every
sibling of that failure - "articles vanished from the live site", "images
break in dark mode" - lives in the *engineering* memory. No auditor
reading either file alone can see the pattern, because the pattern spans
both. Same for the dark-mode Tailwind omission: mandated in CLAUDE.md,
logged as a content failure, owned by neither rubric.

This module doesn't migrate anything. Rewriting append-only logs to fit a
new schema would destroy the provenance that makes them worth having. It
projects each store into a common event shape at read time, so questions
can finally cross a store boundary.
"""

from __future__ import annotations

import json
from pathlib import Path
from collections import Counter, defaultdict
from typing import Iterator, NamedTuple, Optional

MEMORY_DIR = Path("content_factory_memory")
SRC_DATA = Path("src/data")


class Event(NamedTuple):
    """The common shape. Deliberately thin - it's a join key, not a model."""
    store: str
    kind: str
    timestamp: Optional[str]
    subject: Optional[str]      # article slug, pillar, component, or topic
    judge: Optional[str]        # who decided: evaluator, human, code
    summary: str
    detail: dict

    @property
    def domain(self) -> str:
        """content | engineering | strategy | meta"""
        return {
            "failure_log": "content",
            "verdict_log": "content",
            "strategist_log": "strategy",
            "content_graph": "strategy",
            "engineering_solutions": "engineering",
            "shelved_ideas": "meta",
        }.get(self.store, "meta")


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines()
            if l.strip()]


def _read_json(path: Path):
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def iter_events() -> Iterator[Event]:
    """Project every store into the common event shape."""

    for e in _read_jsonl(MEMORY_DIR / "failure_log.jsonl"):
        yield Event(
            store="failure_log",
            kind=f"failure:{e.get('stage', '?')}",
            timestamp=e.get("timestamp"),
            subject=e.get("article_slug"),
            judge=e.get("resolved_by"),
            summary=f"{e.get('rule_id')}: {str(e.get('fix_applied', ''))[:120]}",
            detail=e,
        )

    for e in _read_jsonl(MEMORY_DIR / "verdict_log.jsonl"):
        yield Event(
            store="verdict_log",
            kind=f"verdict:{e.get('gate', '?')}",
            timestamp=e.get("timestamp"),
            subject=e.get("article_slug"),
            judge="content_evaluator",
            summary=f"{e.get('verdict')} (Layer B {e.get('layer_b_score')})",
            detail=e,
        )

    for e in _read_jsonl(MEMORY_DIR / "strategist_log.jsonl"):
        angles = e.get("angles", [])
        yield Event(
            store="strategist_log",
            kind="strategy:angle_selection",
            timestamp=e.get("timestamp"),
            subject=e.get("topic"),
            judge="rahul",
            summary=(f"{len(angles)} angles proposed, chose "
                     f"{e.get('chosen_angle_id')}"),
            detail=e,
        )

    graph = _read_json(MEMORY_DIR / "content_graph.json") or {}
    for slug, p in (graph.get("pillars") or {}).items():
        spokes = p.get("spokes") or []
        yield Event(
            store="content_graph",
            kind="strategy:pillar",
            timestamp=p.get("registered"),
            subject=slug,
            judge=None,
            summary=f"pillar '{p.get('title')}' with {len(spokes)} spoke(s)",
            detail=p,
        )

    for e in (_read_json(SRC_DATA / "engineering-solutions.json") or []):
        yield Event(
            store="engineering_solutions",
            kind=f"engineering:{e.get('category', 'general')}",
            timestamp=e.get("date"),
            subject=e.get("id"),
            judge="rahul",
            summary=str(e.get("problem", ""))[:160],
            detail=e,
        )

    for e in (_read_json(SRC_DATA / "shelved-ideas.json") or []):
        yield Event(
            store="shelved_ideas",
            kind="meta:shelved",
            timestamp=e.get("dateShelved"),
            subject=str(e.get("title")),
            judge="rahul",
            summary=str(e.get("description", ""))[:160],
            detail=e,
        )


def all_events() -> list[Event]:
    return sorted(iter_events(), key=lambda e: (e.timestamp or ""))


def timeline(subject: str) -> list[Event]:
    """
    Everything that ever happened to one subject, across every store.

    This is the query that was impossible before. An article's research
    failures, its gate verdicts, the angle it was chosen from, the pillar
    it belongs to, and the engineering incidents that touched it were in
    five different files keyed five different ways.
    """
    needle = subject.lower().replace("_", "-")
    out = []
    for e in all_events():
        hay = f"{e.subject or ''} {e.summary}".lower().replace("_", "-")
        if needle in hay:
            out.append(e)
    return out


def search(term: str) -> list[Event]:
    """Cross-store full-text search over the raw detail of every event."""
    needle = term.lower()
    return [e for e in all_events()
            if needle in json.dumps(e.detail, ensure_ascii=False).lower()]


def cross_domain_findings() -> list[dict]:
    """
    Entries filed in the wrong memory.

    Sourced from rule_registry.json's entry_overrides, where the audit
    recorded which failure-log entries are really engineering failures.
    These are the ones most likely to never be learned from, because they
    sit in a store whose auditor isn't looking for their kind of problem.
    """
    reg = _read_json(MEMORY_DIR / "rule_registry.json") or {}
    out = []
    for entry_id, ov in (reg.get("entry_overrides") or {}).items():
        if entry_id.startswith("_") or "cross_domain" not in ov:
            continue
        out.append({
            "entry_id": entry_id,
            "currently_in": "failure_log.jsonl (content)",
            "belongs_also_in": ov["cross_domain"]["target_store"],
            "described": ov.get("described"),
            "reason": ov["cross_domain"]["reason"],
        })
    return out


def coverage_report() -> dict:
    """
    How much of the output actually produced a learning signal.

    51 published articles against 18 failure entries covering 6 articles
    is the shape of a loop that was switched on late. Worth watching: if
    coverage stays low, the pattern auditor is mining a sample that
    isn't representative of what the factory actually produces.
    """
    events = all_events()
    live_articles = {p.stem for p in Path("src/content/direct-tax").glob("*.mdx")}
    seen = {e.subject for e in events
            if e.store in ("failure_log", "verdict_log") and e.subject}
    normalized_seen = {s.replace("_", "-") for s in seen}

    with_signal = {a for a in live_articles
                   if a in normalized_seen
                   or any(a in s or s in a for s in normalized_seen)}

    return {
        "published_articles": len(live_articles),
        "articles_with_any_logged_signal": len(with_signal),
        "coverage_pct": round(100 * len(with_signal) / len(live_articles), 1)
        if live_articles else 0.0,
        "events_by_store": dict(Counter(e.store for e in events)),
        "events_by_domain": dict(Counter(e.domain for e in events)),
        "articles_with_no_signal": sorted(live_articles - with_signal),
    }


if __name__ == "__main__":
    import sys

    cmd = sys.argv[1] if len(sys.argv) > 1 else "coverage"

    if cmd == "coverage":
        r = coverage_report()
        print(f"Published articles:       {r['published_articles']}")
        print(f"With any logged signal:   {r['articles_with_any_logged_signal']}"
              f"  ({r['coverage_pct']}%)")
        print(f"\nEvents by store:")
        for k, v in sorted(r["events_by_store"].items(), key=lambda x: -x[1]):
            print(f"  {k:<24} {v}")
        print(f"\nEvents by domain:")
        for k, v in sorted(r["events_by_domain"].items(), key=lambda x: -x[1]):
            print(f"  {k:<24} {v}")

    elif cmd == "timeline":
        for e in timeline(sys.argv[2]):
            print(f"[{(e.timestamp or '?')[:10]}] {e.domain:<12} "
                  f"{e.kind:<28} {e.summary}")

    elif cmd == "search":
        hits = search(sys.argv[2])
        print(f"{len(hits)} hit(s) for '{sys.argv[2]}' across all stores:\n")
        for e in hits:
            print(f"[{(e.timestamp or '?')[:10]}] {e.store:<24} "
                  f"{e.domain:<12} {e.summary}")

    elif cmd == "cross-domain":
        rows = cross_domain_findings()
        print(f"{len(rows)} entry(s) filed in a memory that doesn't own "
              f"their failure class:\n")
        for r in rows:
            print(f"  {r['entry_id']}")
            print(f"    is in:      {r['currently_in']}")
            print(f"    belongs in: {r['belongs_also_in']}")
            print(f"    why:        {r['reason']}\n")

    else:
        print("Usage: python memory_index.py "
              "[coverage|timeline <subject>|search <term>|cross-domain]")
