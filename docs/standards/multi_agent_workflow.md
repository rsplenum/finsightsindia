# Multi-Agent Workflow Standard

To prevent generic, boilerplate, or "assembly-line" content generation, all future articles MUST be drafted using the 5-Agent Architecture. This ensures that every piece of content undergoes rigorous, adversarial review against our strict quality standards before it is written to the disk.

## The 5-Agent Architecture

When asked to draft a new article, the parent agent must define and invoke the following 5 sub-agents:

### 1. `content_quality_agent` (The Novelist)
- **Role:** Enforces `quality_narrative.md` and `writing_styles_catalog.md`.
- **System Prompt Requirements:** Instruct the agent to aggressively critique drafts based on the 4-Pillar psychological mapping, extreme prose depth, Substantive Justice, and historical intent (The 5 Whys). It must reject any generic boilerplate.

### 2. `visual_quality_agent` (The Art Director)
- **Role:** Enforces `quality_visuals.md`.
- **System Prompt Requirements:** Instruct the agent to critique visual layout and image prompts. It must ensure image prompts explicitly demand Varsity Minimalist style, pure white backgrounds (for CSS mix-blend-mode compatibility), and correct emotional mapping (Anxiety hook vs Relief inset).

### 3. `behaviour_quality_agent` (The Architect)
- **Role:** Enforces structural and MDX behaviour.
- **System Prompt Requirements:** Instruct the agent to validate MDX syntax, strict frontmatter mapping, proper usage of `<NoticeTrap>` and `<CardPremium>`, and ensure the hidden 100-second reel script is correctly formatted in `{/* */}` at the bottom of the article. **CRITICAL:** The agent MUST reject the draft if the markdown content starts with an `# H1` heading that simply repeats the frontmatter title. Our Astro layout automatically renders the title, so explicitly writing it in the MDX creates a duplicate.

### 4. `search_quality_agent` (The SEO Forensic)
- **Role:** Enforces `search_criterion.md`.
- **System Prompt Requirements:** Instruct the agent to ensure the H1 targets a high-anxiety symptom, passes the "Outcome Certainty" test, avoids generic dictionary definitions, and accurately maps to the target commercial bucket.

### 5. `orchestrator_agent` (The Editor-in-Chief)
- **Role:** The lead author and coordinator.
- **System Prompt Requirements:** This agent must be granted `enable_subagent_tools` and `enable_write_tools`. It is responsible for:
  1. Drafting the initial article.
  2. Launching the 4 Quality Agents.
  3. Sending the draft to the 4 Quality Agents for critique.
  4. Iterating and revising the draft until it receives unanimous approval from all 4 agents.
  5. Generating the pure white background illustrations and writing the final `.mdx` file to the disk.

## Execution Rules
- The parent agent should not write the article directly. It must invoke the `orchestrator_agent` and wait for it to complete the multi-agent debate and write the file.
- The parent agent must verify the final output (e.g., ensuring the 100-second reel wasn't accidentally stripped by the orchestrator) before presenting the final result to the user.
