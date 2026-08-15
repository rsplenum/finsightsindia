"""
FinSight Content Factory - rule identity across rubric eras.

Why this module exists
----------------------
A rule_id used to be a bare string in a log line. Commit 59c3970 renumbered
the entire evaluator rubric in place, and every M and S id changed meaning
at once. Nothing errored. `summarize_by_rule_id` carried on counting, and
started adding together events that had nothing to do with each other -
"the TL;DR wasn't bulleted" and "the draft used banned melodrama" both
became "M2: 2 occurrences".

That matters because the pattern auditor's whole trigger is a frequency
count over rule_ids. A broken namespace doesn't make the auditor fail
loudly; it makes it quietly find nothing, or find the wrong thing.

This module resolves a historical rule_id forward to whatever the current
rubric calls that same failure class - or tells you honestly that the rule
was retired, reversed, or never mapped cleanly. It is deliberately
deterministic and has no model in the loop.

Read `content_factory_memory/rule_registry.json` for the mappings and the
reasoning behind each one.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal, NamedTuple, Optional

MEMORY_DIR = Path("content_factory_memory")
REGISTRY_FILE = MEMORY_DIR / "rule_registry.json"

CURRENT_ERA = "floor_mandate_form"

# Statuses that mean "this id does not carry forward as a live rule".
# `reversed` is the sharpest of these: the system was once penalised for
# the exact behaviour it is now required to exhibit (or vice versa).
NON_FORWARDING = {"retired", "reversed", "merged", "meta", "unmapped_gap"}

Status = Literal[
    "stable", "renamed", "renamed_and_strengthened", "renumbered",
    "renumbered_and_narrowed", "moved_layer", "retired", "reversed",
    "merged", "meta", "unmapped_gap", "split", "unknown",
]


class Resolution(NamedTuple):
    """The result of resolving one historical rule_id."""
    original_id: str
    canonical_ids: list[str]      # [] when the rule does not forward
    status: Status
    was: Optional[str]            # what the id meant in its own era
    reason: Optional[str]         # why it doesn't forward, when it doesn't
    forwards: bool                # safe to include in a frequency count?

    @property
    def label(self) -> str:
        if self.forwards:
            return " + ".join(self.canonical_ids)
        return f"[{self.status.upper()}] {self.original_id}"


_registry_cache: Optional[dict] = None


def load_registry(force: bool = False) -> dict:
    global _registry_cache
    if _registry_cache is None or force:
        if not REGISTRY_FILE.exists():
            raise FileNotFoundError(
                f"{REGISTRY_FILE} is missing. Rule ids cannot be resolved "
                "without it, and counting them raw is how the namespace "
                "broke the first time. Restore it before running any audit."
            )
        _registry_cache = json.loads(REGISTRY_FILE.read_text(encoding="utf-8"))
    return _registry_cache


def resolve(rule_id: str, era: str = "pre_floor_mandate",
            entry_id: Optional[str] = None) -> Resolution:
    """
    Resolve one historical rule_id to its current equivalent(s).

    `entry_id` is optional but worth passing: a few log entries were filed
    under an id that doesn't match the failure they describe, and the
    registry carries per-entry corrections for those. Correcting them in
    the log itself would break the append-only guarantee, so the override
    lives in the registry and is applied here.
    """
    reg = load_registry()

    # Per-entry corrections win over the generic id mapping.
    override = reg.get("entry_overrides", {}).get(entry_id or "")
    if override and not str(entry_id or "").startswith("_"):
        targets = override.get("resolves_to")
        targets = [] if targets is None else (
            targets if isinstance(targets, list) else [targets]
        )
        return Resolution(
            original_id=rule_id,
            canonical_ids=targets,
            status=override.get("status", "unknown"),
            was=override.get("described"),
            reason=override.get("problem"),
            forwards=bool(targets),
        )

    if era == CURRENT_ERA:
        return Resolution(rule_id, [rule_id], "stable", None, None, True)

    mapping = reg.get("mappings", {}).get(era, {}).get(rule_id)
    if mapping is None:
        return Resolution(
            original_id=rule_id,
            canonical_ids=[],
            status="unknown",
            was=None,
            reason=f"'{rule_id}' is not registered in era '{era}'. Add it to "
                   "rule_registry.json rather than letting it be counted raw.",
            forwards=False,
        )

    target = mapping.get("resolves_to")
    targets = [] if target is None else (
        target if isinstance(target, list) else [target]
    )
    status = mapping.get("status", "unknown")
    return Resolution(
        original_id=rule_id,
        canonical_ids=targets,
        status=status,
        was=mapping.get("was"),
        reason=mapping.get("reason") or mapping.get("note"),
        forwards=status not in NON_FORWARDING and bool(targets),
    )


def era_for_entry(entry: dict) -> str:
    """
    Which rubric era does a failure_log entry belong to?

    New entries stamp `rubric_version` themselves. Older ones predate the
    field entirely - and their timestamps can't settle it, because the last
    two pre-refactor entries carry IST clock times mislabelled 'Z' and so
    appear to fall on the wrong side of the boundary. Anything unstamped is
    therefore treated as pre-refactor, which is correct for every entry
    written before this registry existed.
    """
    return entry.get("rubric_version") or "pre_floor_mandate"


def collision_report() -> list[dict]:
    """
    Every id whose meaning changed across the era boundary.

    This is the list to check before trusting any analysis that groups by a
    bare rule_id.
    """
    reg = load_registry()
    out = []
    for era, rules in reg.get("mappings", {}).items():
        for rid, m in rules.items():
            if m.get("collides_with_current"):
                out.append({
                    "id": rid,
                    "era": era,
                    "meant_then": m.get("was"),
                    "means_now": m["collides_with_current"],
                    "status": m.get("status"),
                })
    return out


def validate() -> list[str]:
    """
    Self-check. Returns a list of problems; empty means healthy.

    Run this in CI, or at least before every pattern audit. The failure
    mode this guards against is silent: a rubric gets renumbered, no id
    resolves, and the auditor reports "no patterns found" - which reads
    exactly like good news.
    """
    problems: list[str] = []
    reg = load_registry()

    current_ids = set()
    for era, rules in reg.get("mappings", {}).items():
        for rid, m in rules.items():
            t = m.get("resolves_to")
            for tid in ([] if t is None else (t if isinstance(t, list) else [t])):
                current_ids.add(tid)

    for era, rules in reg.get("mappings", {}).items():
        for rid, m in rules.items():
            if "status" not in m:
                problems.append(f"{era}/{rid}: missing 'status'")
            if m.get("status") in NON_FORWARDING and not (
                m.get("reason") or m.get("note")
            ):
                problems.append(
                    f"{era}/{rid}: status '{m['status']}' with no reason - a "
                    "retired rule without a recorded reason is how a rule "
                    "gets silently reintroduced later."
                )
    return problems


if __name__ == "__main__":
    import sys

    cmd = sys.argv[1] if len(sys.argv) > 1 else "collisions"

    if cmd == "collisions":
        rows = collision_report()
        print(f"{len(rows)} rule ids changed meaning across the era boundary.\n")
        for r in rows:
            print(f"  {r['id']:<20} then: {r['meant_then']}")
            print(f"  {'':<20} now:  {r['means_now']}")
            print(f"  {'':<20} ({r['status']})\n")

    elif cmd == "validate":
        problems = validate()
        if not problems:
            print("Registry healthy.")
        else:
            print(f"{len(problems)} problem(s):")
            for p in problems:
                print(f"  - {p}")
            sys.exit(1)

    elif cmd == "resolve":
        rid = sys.argv[2]
        r = resolve(rid)
        print(f"{rid}  ->  {r.label}")
        print(f"  status:   {r.status}")
        print(f"  meant:    {r.was}")
        print(f"  forwards: {r.forwards}")
        if r.reason:
            print(f"  reason:   {r.reason}")

    else:
        print("Usage: python rule_registry.py [collisions|validate|resolve <id>]")
