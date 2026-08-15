# Flattened root dump — archived 2026-08-15

These 11 files were sitting loose in the repository root. They are **duplicates**.
Nothing reads them. They are kept here only because they were untracked, so
deleting them would not have been recoverable through git.

## Where each one really lives

| archived copy | the file that is actually used |
|---|---|
| `creator-logs.json` | `src/data/creator-logs.json` |
| `engineering-solutions.json` | `src/data/engineering-solutions.json` |
| `reel-scripts.json` | `src/data/reel-scripts.json` |
| `researchLedger.json` | `src/data/researchLedger.json` |
| `shelved-ideas.json` | `src/data/shelved-ideas.json` |
| `checkpoint-validation.md` | `.agents/rules/checkpoint-validation.md` |
| `paid-api-image-retention.md` | `.agents/rules/paid-api-image-retention.md` |
| `finsight-drafting-workflow-SKILL.md` | `.agents/skills/finsight-drafting-workflow/SKILL.md` |
| `finsight-illustration-standard-SKILL.md` | `.agents/skills/finsight-illustration-standard/SKILL.md` |
| `finsight-learning-loop-SKILL.md` | `.agents/skills/finsight-learning-loop/SKILL.md` |
| `finsight-strategist-SKILL.md` | `.agents/skills/finsight-strategist/SKILL.md` |

## How we know they were redundant

1. **10 of 11 were byte-identical** to the canonical file. The 11th,
   `engineering-solutions.json`, was byte-identical to the git HEAD version of
   `src/data/engineering-solutions.json` — it only appeared to differ because
   `sol-016` had just been added to the real one.
2. **Nothing referenced them.** Every consumer points elsewhere: the six Astro
   pages import `../data/*.json` (→ `src/data/`), `extract_user_logs.py` and
   `append_reel.py` write to `src/data/`, `run_learning_loop_regression.py`
   reads `.agents/skills/finsight-drafting-workflow/SKILL.md`, and
   `memory_index.py` reads `src/data/`.
3. **The canonical copies are tracked in git; these were not.**
4. **All 11 shared one mtime to the second — `2026-08-14 23:21:10`** — while
   their canonical counterparts had scattered older times (22:48:09, Aug 11,
   Aug 9). That is a single bulk flatten-to-root operation, not eleven
   authoring decisions. The naming confirms it:
   `finsight-drafting-workflow-SKILL.md` is what
   `finsight-drafting-workflow/SKILL.md` becomes when the directory is stripped.

## Why they were worth moving rather than leaving

The archived `engineering-solutions.json` is **stale** — it predates `sol-016`.
That file is the project's institutional memory, and `CLAUDE.md` instructs every
agent to read it before proposing a technical solution. A stale copy at the
repository root is the first place something would look, and it would drift
further with every entry added to the real one. That made this a correctness
hazard rather than cosmetic clutter.

**Do not restore these to the root.** If you need any of this content, take it
from the canonical path in the table above.
