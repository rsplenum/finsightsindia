"""
FinSight Content Factory - the ceiling.

The floor is measurable and the ceiling is not. That asymmetry has a
consequence the factory has been living with: given one evaluator and one
budget, the measurable job wins every time, because it's the one that
returns a clean verdict. The Floor grew to R1-R7 plus M1-M5 with detailed
sub-clauses. The Mandate is still one sentence, and Layer B is a 5-point
compliance count whose maximum score is "obeyed everything we thought to
ask for".

That ceiling cannot represent an article that is good in a way nobody
anticipated. Not because the rubric is badly written - because an
absolute score requires having named the dimension in advance, and naming
it in advance is exactly what "a way I did not explicitly teach it"
rules out.

This module holds the two things that follow from that, kept deliberately
apart from learning_loop.py so the measurable side can't quietly absorb
their budget:

    1. Pairwise preference. Comparative judgment does not require a named
       dimension. "Which of these two openings moves the reader further?"
       is answerable without a rubric that anticipated the answer, and the
       accumulated answers are the only artifact in this system that
       encodes taste rather than corrections.

    2. A relaxation operator. Until now the loop had exactly one move:
       add a constraint. R7 added, M13 added, S8 proposed, ban list grows.
       A loop whose only operator tightens can only ever shrink the space
       of permitted outputs - which is the arithmetic reason it cannot
       surprise you, independent of how good any individual rule is.

No LLM calls here either. This module decides *what to ask a human or an
agent about*; it never does the judging itself.
"""

from __future__ import annotations

import json
import uuid
import datetime
from pathlib import Path
from collections import Counter, defaultdict
from typing import Literal, Optional

try:
    from rule_registry import resolve, era_for_entry
    from learning_loop import load_failure_log, load_verdict_log, count_published_articles
except ImportError:  # package-relative import
    from .rule_registry import resolve, era_for_entry
    from .learning_loop import load_failure_log, load_verdict_log, count_published_articles

MEMORY_DIR = Path("content_factory_memory")
PREFERENCE_LOG = MEMORY_DIR / "preference_log.jsonl"
RELAXATION_LOG = MEMORY_DIR / "relaxation_log.jsonl"

Winner = Literal["a", "b", "tie", "both_bad"]


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines()
            if l.strip()]


# ---------------------------------------------------------------------------
# Pairwise preference - the ceiling signal
# ---------------------------------------------------------------------------

def log_preference(
    article_slug: str,
    variant_a: str,
    variant_b: str,
    winner: Winner,
    form_a: Optional[str] = None,
    form_b: Optional[str] = None,
    why: Optional[str] = None,
    judged_by: str = "rahul",
    scope: str = "whole_draft",
) -> dict:
    """
    Record one comparative judgment between two variants of the same piece.

    `variant_a` / `variant_b` are paths to the staged drafts (or excerpt
    ids for a scoped comparison - an opening, a single explanation).
    `why` is the field that matters. The winner alone tells you which one;
    only `why` tells you what dimension you were actually judging on, and
    that dimension is frequently one no rule names yet. This is the exact
    counterpart of `human_note` in the failure log: the log captures why
    something was wrong, this captures why something was better, and those
    generalise in different directions.

    `both_bad` is a real option on purpose. Forcing a winner between two
    weak drafts manufactures a preference that isn't there and poisons the
    signal.
    """
    MEMORY_DIR.mkdir(exist_ok=True)
    entry = {
        "id": uuid.uuid4().hex[:8],
        "timestamp": _now(),
        "article_slug": article_slug,
        "scope": scope,
        "variant_a": variant_a,
        "variant_b": variant_b,
        "form_a": form_a,
        "form_b": form_b,
        "winner": winner,
        "why": why,
        "judged_by": judged_by,
    }
    with open(PREFERENCE_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def load_preferences() -> list[dict]:
    return _read_jsonl(PREFERENCE_LOG)


def form_preference_table() -> dict:
    """
    Which Forms actually win when put head to head.

    The Form menu (causal essay, decision tree, myth-busting, historical
    reconstruction...) is currently chosen once per article by the
    strategist, from a fixed list, with no record of whether the choice
    was right. This turns it into something with evidence behind it.

    Note what this can show that a rubric cannot: a Form that keeps
    winning on topics where the strategist rated it "off-template" is the
    system telling you your safe default is worse than you think.
    """
    prefs = load_preferences()
    wins: Counter = Counter()
    appearances: Counter = Counter()
    for p in prefs:
        fa, fb = p.get("form_a"), p.get("form_b")
        if fa:
            appearances[fa] += 1
        if fb:
            appearances[fb] += 1
        if p["winner"] == "a" and fa:
            wins[fa] += 1
        elif p["winner"] == "b" and fb:
            wins[fb] += 1

    return {
        "comparisons": len(prefs),
        "forms": {
            f: {
                "appearances": appearances[f],
                "wins": wins[f],
                "win_rate": round(wins[f] / appearances[f], 3)
                if appearances[f] else None,
            }
            for f in sorted(appearances)
        },
        "unresolved": sum(1 for p in prefs if p["winner"] in ("tie", "both_bad")),
    }


def unnamed_dimensions(min_len: int = 12) -> list[dict]:
    """
    The `why` texts from preference judgments, surfaced for review.

    These are the raw material for rules that don't exist yet. A failure
    log tells the pattern auditor which existing rule keeps being broken.
    This tells it which dimension keeps deciding outcomes while having no
    rule at all - which is the only input from which a genuinely new
    quality criterion can come, rather than a tighter version of an old
    one.
    """
    return [
        {"id": p["id"], "article": p["article_slug"], "why": p["why"],
         "winner": p["winner"], "scope": p.get("scope")}
        for p in load_preferences()
        if p.get("why") and len(p["why"]) >= min_len
    ]


# ---------------------------------------------------------------------------
# The relaxation operator - the loop's missing second move
# ---------------------------------------------------------------------------

def rule_pressure(window: Optional[int] = None) -> dict:
    """
    How hard each live rule is actually working.

    Three signatures worth acting on, and none of them is visible from a
    plain failure count:

      dormant  - the rule has never once fired. It is either perfectly
                 internalised by the drafter or never actually checked.
                 Either way it costs evaluator attention every single run
                 and buys nothing measurable. Candidate for retirement.

      dominant - the rule fires on most drafts. A floor the drafter
                 cannot reach is not a standard, it's a misconfiguration:
                 the fix belongs in the drafter's prompt or in splitting
                 the rule, not in tightening it further.

      working  - fires sometimes. This is what a useful rule looks like.

    A rubric with many dormant rules looks rigorous and is mostly
    ceremony.
    """
    entries = load_failure_log()
    if window:
        entries = entries[-window:]

    fired: Counter = Counter()
    for e in entries:
        r = resolve(e["rule_id"], era_for_entry(e), entry_id=e.get("id"))
        if r.forwards:
            for cid in r.canonical_ids:
                fired[cid] += 1

    live_rules = {
        "R1": "Fact integrity", "R2": "Recency", "R3": "Focus",
        "R4": "INSIGHT exists", "R5": "Sufficiency", "R6": "Honesty/Limits",
        "R7": "Primary Source Floor",
        "M1": "MDX structure publishable", "M2": "No banned filler/melodrama",
        "M3": "No generic headers", "M4": "Statutory currency preserved",
        "M5": "2-3 SVG_PROPOSAL tags",
        "S1": "Concept coverage & depth", "S2": "Causal completeness",
        "S3": "Evidence density", "S4": "Reader comprehension",
        "S5": "Originality / Bhumika",
    }

    published = max(count_published_articles(), 1)
    out = {}
    for rid, desc in live_rules.items():
        count = fired.get(rid, 0)
        rate = count / published
        out[rid] = {
            "description": desc,
            "times_fired": count,
            "signature": ("dormant" if count == 0
                          else "dominant" if rate > 0.5
                          else "working"),
        }
    return out


# Rules whose evidence postdates most of the failure log. A rule added
# last week cannot be judged dormant on a log that mostly predates it -
# and these two exist *because* of logged failures (R2 tightening, R7 and
# M4 added 2026-08-11..14), so "never fired" here means "barely had the
# chance to".
RECENTLY_ADDED = {"R7", "M4"}

# Below this, the failure log is not a sample of the factory's output -
# it's a sample of the handful of articles someone happened to be
# watching. Retirement proposals drawn from it would be noise wearing
# evidence's clothes.
MIN_COVERAGE_FOR_RETIREMENT = 0.30


def logging_coverage() -> float:
    """Fraction of published articles that produced any logged gate signal."""
    published = count_published_articles()
    if not published:
        return 0.0
    seen = {e.get("article_slug", "").replace("_", "-")
            for e in load_failure_log() + load_verdict_log()}
    seen.discard("")
    live = {p.stem for p in Path("src/content/direct-tax").glob("*.mdx")}
    covered = {a for a in live
               if a in seen or any(a in s or s in a for s in seen)}
    return len(covered) / published


def propose_relaxation(dormant_after: int = 20) -> list[dict]:
    """
    Generate candidate *removals*. The second learning operator.

    Everything the slow loop could previously propose made the permitted
    space smaller. This proposes the opposite move, on the same evidential
    footing the pattern auditor uses for additions: never on a hunch,
    always with a count behind it, and always for a human to approve.

    Deliberately conservative, and it checks its own evidence first. A
    "dormant" rule and an unobserved rule look identical from a frequency
    count, and the difference is entirely in how much of the output the
    log actually saw. Below MIN_COVERAGE_FOR_RETIREMENT this refuses to
    propose retirements at all and says so, rather than confidently
    recommending you delete a rule that was added three days ago because
    of a real failure.
    """
    pressure = rule_pressure()
    published = count_published_articles()
    coverage = logging_coverage()
    proposals = []

    if coverage < MIN_COVERAGE_FOR_RETIREMENT:
        proposals.append({
            "kind": "blocked",
            "target": "all retire_candidate proposals",
            "description": "Insufficient logging coverage",
            "evidence": f"only {coverage:.1%} of {published} published "
                        f"articles produced any logged gate signal",
            "proposed": "No retirement proposals generated. At this "
                        "coverage a zero failure count means 'never "
                        "observed', not 'never violated'. Fix coverage "
                        "first: call log_verdict() on every gate decision "
                        "for the next 10-15 articles, then re-run. "
                        "Relaxation is the operator most likely to do "
                        "damage on thin evidence, because removing a rule "
                        "is invisible until something bad ships.",
        })

    for rid, p in pressure.items():
        if p["signature"] == "dormant" and published >= dormant_after:
            if coverage < MIN_COVERAGE_FOR_RETIREMENT or rid in RECENTLY_ADDED:
                continue
            proposals.append({
                "kind": "retire_candidate",
                "target": rid,
                "description": p["description"],
                "evidence": f"0 failures across {published} published articles",
                "proposed": f"Review {rid} for retirement or demotion to a "
                            f"drafter-prompt expectation. A rule that has "
                            f"never fired is either internalised or "
                            f"unenforced; both are reasons to stop spending "
                            f"evaluator attention on it.",
                "caution": "Check it is actually being evaluated before "
                           "retiring it. A rule that never fires because "
                           "nobody checks it is a coverage bug, not dead "
                           "weight - and the two look identical from here.",
            })
        elif p["signature"] == "dominant":
            proposals.append({
                "kind": "misconfigured_candidate",
                "target": rid,
                "description": p["description"],
                "evidence": f"{p['times_fired']} failures across "
                            f"{published} published articles",
                "proposed": f"{rid} fires on most drafts. Fix the drafter "
                            f"prompt or split the rule; do not tighten it. "
                            f"A floor the drafter cannot reach produces "
                            f"retry churn, not quality.",
            })

    # Reversed rules are a standing obligation, not a frequency question.
    reg = json.loads((MEMORY_DIR / "rule_registry.json").read_text(encoding="utf-8"))
    for era, rules in reg.get("mappings", {}).items():
        for rid, m in rules.items():
            if m.get("status") == "reversed":
                proposals.append({
                    "kind": "reversal_review",
                    "target": f"{rid} ({era})",
                    "description": m.get("was"),
                    "evidence": "registry status: reversed",
                    "proposed": "Confirm the reversal was deliberate and "
                                "record why in the CHANGELOG. A silent "
                                "reversal means the system once punished "
                                "exactly what it now requires, and nothing "
                                "in the log says which era was right.",
                    "reason": m.get("reason"),
                })

    return proposals


def log_relaxation_outcome(target: str, decision: Literal["approved", "rejected"],
                           note: Optional[str] = None) -> dict:
    """
    Record what Rahul decided about a relaxation proposal.

    Symmetrical with content_graph.py::log_proposal_outcome for additions.
    Without this, rejected relaxations get re-proposed forever and the
    loop develops a stutter.
    """
    MEMORY_DIR.mkdir(exist_ok=True)
    entry = {"timestamp": _now(), "target": target,
             "decision": decision, "note": note}
    with open(RELAXATION_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


if __name__ == "__main__":
    import sys

    cmd = sys.argv[1] if len(sys.argv) > 1 else "pressure"

    if cmd == "pressure":
        p = rule_pressure()
        by_sig = defaultdict(list)
        for rid, d in p.items():
            by_sig[d["signature"]].append((rid, d))
        for sig in ("dominant", "working", "dormant"):
            rows = by_sig.get(sig, [])
            print(f"\n{sig.upper()} ({len(rows)})")
            for rid, d in rows:
                print(f"  {rid:<5} {d['times_fired']:>3} fires   "
                      f"{d['description']}")

    elif cmd == "relax":
        props = propose_relaxation()
        print(f"{len(props)} relaxation candidate(s):\n")
        for pr in props:
            print(f"  [{pr['kind']}] {pr['target']} - {pr['description']}")
            print(f"    evidence: {pr['evidence']}")
            print(f"    proposed: {pr['proposed']}")
            if pr.get("caution"):
                print(f"    caution:  {pr['caution']}")
            print()

    elif cmd == "forms":
        print(json.dumps(form_preference_table(), indent=2))

    elif cmd == "dimensions":
        dims = unnamed_dimensions()
        if not dims:
            print("No preference judgments logged yet.")
            print("This is the ceiling signal - it stays empty until the "
                  "drafter produces two variants and someone ranks them.")
        else:
            for d in dims:
                print(f"[{d['id']}] {d['article']} ({d['scope']}): {d['why']}")

    else:
        print("Usage: python ceiling.py [pressure|relax|forms|dimensions]")
