"""
H3 regression gate runner.

Re-runs every frozen case in content_factory_memory/regression_set/ against
a given version of the evaluator prompt, and diffs the verdicts against
each case's expected_result.

The skill path is a parameter, not a constant. It used to be hardcoded to
the live SKILL.md, which made H3 step 1 - "apply the proposed change to a
scratch copy only, never edit the live file" - literally unexecutable: the
only way to test a change was to make it live first. That is very likely
how the M1-M14 -> M1-M5 renumbering shipped without anyone noticing it
orphaned half the failure log.

Usage:
    # test the live rubric (baseline)
    python run_learning_loop_regression.py

    # test a proposed change before merging it (this is the H3 path)
    python run_learning_loop_regression.py --skill _proposals/<name>/SKILL.scratch.md

    # compare live vs scratch in one run
    python run_learning_loop_regression.py --skill _proposals/<name>/SKILL.scratch.md --baseline
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.append(".agents/skills/finsight-learning-loop")
from learning_loop import run_regression_set  # noqa: E402

LIVE_SKILL = Path(".agents/skills/finsight-drafting-workflow/SKILL.md")

# The gate must test the model that actually judges drafts in production -
# Antigravity runs mostly Gemini 3.1 Pro, so testing anything else would tell
# us how a different model reads the rubric, not ours.
#
# Overridable because the previous hardcoded value (gemini-2.5-pro) was retired
# by Google and the gate simply stopped running. A model id is a moving target;
# pin it here, pass --model to try another, and update this when production moves.
DEFAULT_MODEL = "gemini-3.1-pro-preview"


def extract_evaluator_prompt(skill_path: Path) -> str:
    """Pull the content_evaluator system prompt out of a SKILL.md."""
    skill_content = skill_path.read_text(encoding="utf-8")
    start = skill_content.find("### 3. `content_evaluator`")
    if start == -1:
        raise ValueError(
            f"{skill_path}: no '### 3. `content_evaluator`' section found. "
            "The regression gate can't test a rubric it can't locate - fix "
            "the heading rather than letting this fall through to an "
            "empty prompt."
        )
    sys_prompt_start = skill_content.find("- **System Prompt:**", start)
    sys_prompt_end = skill_content.find("### 4.", sys_prompt_start)
    if sys_prompt_start == -1 or sys_prompt_end == -1:
        raise ValueError(f"{skill_path}: evaluator prompt block is malformed.")
    prompt = skill_content[sys_prompt_start:sys_prompt_end].strip()
    return prompt.replace("- **System Prompt:**", "").strip(' \n"')


def make_evaluate_fn(skill_path: Path, model: str = DEFAULT_MODEL):
    """Build an evaluate_fn bound to one specific rubric version."""
    from google import genai
    from google.genai import types

    client = genai.Client()
    system_instruction = extract_evaluator_prompt(skill_path)

    def evaluate_fn(input_text: str) -> str:
        response = client.models.generate_content(
            model=model,
            contents=[f"Audit the following input:\n{input_text}"],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.0,
            ),
        )
        text = (response.text or "").upper()
        # Order matters. The evaluator's own output format leads with the
        # verdict, so check the leading token before falling back to a
        # substring scan - a PASS body that mentions the word "fail" in a
        # residual-risk note should not be read as a FAIL.
        head = text.lstrip()
        if head.startswith("FAIL"):
            return "FAIL"
        if head.startswith("PASS"):
            return "PASS"
        if "FAIL" in text:
            return "FAIL"
        if "PASS" in text:
            return "PASS"
        return "UNKNOWN"

    return evaluate_fn


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skill", type=Path, default=LIVE_SKILL,
                    help="SKILL.md to test. Point this at a scratch copy to "
                         "test a proposal without touching the live file.")
    ap.add_argument("--baseline", action="store_true",
                    help="Also run the live rubric and diff the two reports.")
    ap.add_argument("--model", default=DEFAULT_MODEL,
                    help=f"Evaluator model to test against (default {DEFAULT_MODEL}).")
    ap.add_argument("--dry-run", action="store_true",
                    help="Show what would run, make no API calls.")
    args = ap.parse_args()

    if not args.skill.exists():
        print(f"error: {args.skill} does not exist", file=sys.stderr)
        return 2

    cases = sorted(Path("content_factory_memory/regression_set").glob("*.json"))
    if args.dry_run:
        print(f"Would evaluate {len(cases)} case(s) against {args.skill} using {args.model}"
              + (" and against the live rubric" if args.baseline else ""))
        for c in cases:
            case = json.loads(c.read_text())
            print(f"  {case['case_id']:<50} expects {case['expected_result']}")
        print(f"\nEstimated API calls: "
              f"{len(cases) * (2 if args.baseline else 1)}")
        return 0

    report = run_regression_set(make_evaluate_fn(args.skill, args.model))
    out = {"skill": str(args.skill), "model": args.model, "report": report}

    if args.baseline and args.skill != LIVE_SKILL:
        out["baseline"] = {
            "skill": str(LIVE_SKILL),
            "report": run_regression_set(make_evaluate_fn(LIVE_SKILL, args.model)),
        }

    print(json.dumps(out, indent=2))

    if not report["clean"]:
        print("\nSTOP - do not merge. Regressions in either direction mean "
              "the change is too strict or too loose.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
