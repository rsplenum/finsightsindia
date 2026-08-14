# Patch: finsight-drafting-workflow/SKILL.md — Evaluator rubric

Evidence: failure_log entries c4f6ba15, 48e48cfb (see CHANGELOG.md v1).
Proposal: prop_r2_tighten_r7_m13_add — approved.
Regression: 4/4 cases clean after one caught-and-corrected false start
(see CHANGELOG.md — the first draft of R2 broke bma_causal_arc_should_pass
by mistaking a Black Money Act section for an Income-tax Act citation).

---

## 1. Gate 1 (Research Audit) — R2 tightened, R7 added

**BEFORE:**
```
**Gate 1: Research Audit (Binary PASS/FAIL):** Check R1(Fact integrity), R2(Recency), R3(Focus), R4(INSIGHT exists), R5(Sufficiency), R6(Honesty/Limits). If FAIL, list each failed rule_id with a concrete fix.
```

**AFTER:**
```
**Gate 1: Research Audit (Binary PASS/FAIL):** Check R1(Fact integrity), R2(Recency), R3(Focus), R4(INSIGHT exists), R5(Sufficiency), R6(Honesty/Limits), R7(Primary Source Floor). If FAIL, list each failed rule_id with a concrete fix.

R2 (Recency), tightened: if the dossier formally cites a specific Income-tax
Act section (e.g. "Section 56... of the Income-tax Act, 1961"), it MUST also
confirm and name whether the Income-tax Act, 2025 (in force from 1 April
2026) changes that section number, and state the 2025 Act equivalent if one
exists. A dossier that cites only pre-2026 Income-tax Act section numbers
for a currently governed topic, with no 2025 Act check, fails R2. This does
NOT apply to non-Income-tax statutes (Black Money Act, GST Act, Companies
Act, etc.) unless those Acts have their own confirmed post-2026 renumbering
- do not over-apply this check to every numbered section in every statute.

R7 (Primary Source Floor), new: the dossier must ground at least one
statutory or factual claim in a primary source beyond a bare section
number - case law, a CBDT/RBI circular, a Master Direction, or a named
official comparison document. A dossier built entirely from secondary
paraphrase, with zero primary-source grounding anywhere, fails R7.
```

---

## 2. Gate 2 (Draft Audit), Layer A — M13 added

**BEFORE:**
```
- **Layer A (Mechanics - Binary PASS/FAIL):** M1(Situational Hook), M2(TL;DR 3-4 punchy bullets), M3(Origin Story exists), M4(First principles), M5(Coverage filter), M6(Rupee spine), M7(Traps), M8(Recourse), M9(Key takeaways), M10(NO banned filler/melodrama/scripts), M11(Specific headers), M12(MDX structure publishable).
```

**AFTER:**
```
- **Layer A (Mechanics - Binary PASS/FAIL):** M1(Situational Hook), M2(TL;DR 3-4 punchy bullets), M3(Origin Story exists), M4(First principles), M5(Coverage filter), M6(Rupee spine), M7(Traps), M8(Recourse), M9(Key takeaways), M10(NO banned filler/melodrama/scripts), M11(Specific headers), M12(MDX structure publishable), M13(Statutory Currency Preserved).

M13, new: if the approved dossier identified a 2025 Act equivalent section
under R2, the draft MUST state it in reader-friendly language (e.g., "as of
April 2026, this is now Section 31") - simplifying for a lay reader is not
license to drop the fact that mattered. A draft that silently loses a 2025
Act citation the dossier already established fails M13.
```

---

## Integration note

Apply directly to the live `finsight-drafting-workflow/SKILL.md`. No other
section of that file changes. The Shared Ban List (Part F), the pipeline
order (Part A1), and the subagent roster (Part B) are untouched - this is
scoped to exactly the rubric text above, per the pattern_auditor's own
"smallest possible change" rule.
