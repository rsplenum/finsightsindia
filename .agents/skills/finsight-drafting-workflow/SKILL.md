---
name: finsight-drafting-workflow
description: Use this skill to enforce the Swarm-Draft-Mold writing process for all FinSight articles, preventing shallow execution and regressions.
---

# FinSight Drafting Workflow

This skill defines the mandatory workflow for creating new FinSight INDIA articles. Never bypass these steps to save time or tokens.

## The Swarm-Draft-Mold Process

You must progress through the following three distinct phases sequentially. Do not merge them into a single step.

### Phase 1: Deep Research (The Swarm)
Before writing any code or markdown, you must perform deep research on the financial topic.
1. Identify the exact statutory mechanics (e.g., specific sections of the Income Tax Act, GST laws, etc.).
2. Identify the "Search Intent": What are users panicking about? What notice are they receiving?
3. Document the "Delta": What separates the trapped user from the safe user?
4. **Output:** Update the `Research Ledger` (`src/data/researchLedger.json`) with the detailed findings.
5. **Check:** Wait for user approval on the Research Ledger before proceeding to Phase 2.

### Phase 2: The Outline & Molding (The Draft)
Do not write the full `.mdx` article yet. 
1. Present a structural outline of the article to the user.
2. Ask for explicit feedback on the mechanics or edge-cases to be highlighted.
3. Allow the user to "mold" the structure.
4. **Check:** Wait for the user's explicit sign-off on the structure.

### Phase 3: Final Execution
Once the structure is approved, draft the final `.mdx` article and update all components.
1. **Depth Parity:** Ensure the final `.mdx` article contains *every* mechanical step, edge-case, and psychological hook detailed in the Research Ledger. No stripping down.
2. **Visuals:** Use the `finsight-illustration-standard` to format the image placeholders.
3. **TL;DR:** Always use the `<CardPremium>` component for the TL;DR section.
4. **Reel Script:** Do NOT embed the 100-Second Reel script inside the `.mdx` file. You must append it as a JSON object to `src/data/reel-scripts.json`.
5. **Calculators:** Any interactive component or calculator built for the article MUST support Dark Mode using Tailwind `dark:` classes (e.g., `dark:bg-navy-900`, `dark:text-white`).
6. **Navigation:** Ensure any new page is wired into `src/layouts/Layout.astro`.

By following this strict 3-phase workflow, you guarantee that no research is lost and all architectural standards are maintained.
