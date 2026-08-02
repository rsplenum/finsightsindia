# Content Maintenance & Updation Protocol

Tax laws in India change every year with the Union Budget (usually in February or July). To ensure our platform never displays outdated financial limits or regulations, we enforce a strict metadata protocol.

## 1. The MDX Frontmatter Requirement
Every single article in the `src/content/direct-tax/` directory MUST contain the following frontmatter fields:

```yaml
---
updatedDate: "FY 2025-26"
statutoryAct: "Income Tax Act Section 10(13A) & Rule 2A"
---
```

### Why this is critical:
- **`updatedDate`:** Indicates the Financial Year the article is currently compliant with.
- **`statutoryAct`:** Lists every specific section of the IT Act or GST Act the article relies on.

## 2. The Post-Budget Audit Process
When a new Union Budget is passed, or a major GST Council meeting concludes, the AI agent or developer maintaining this platform must follow this exact process:

1. **Extract Amendments:** Identify the specific Sections of the Acts that were amended (e.g., "Section 115BAC slabs changed," "Section 43(5) F&O definition updated").
2. **Execute Metadata Scan:** Run a codebase-wide search querying the `statutoryAct` metadata field for those exact sections.
   - *Example:* If Section 54 (Capital Gains Exemption) is capped, run a search for `Section 54` in all `.mdx` files.
3. **Targeted Rewrites:** The search will yield the exact 2 or 3 articles that rely on that section. Update only those articles.
4. **Bump the FY Date:** Once verified, update the `updatedDate` frontmatter to the new Financial Year (e.g., "FY 2026-27").

## 3. Structural Code Updates
If a core calculation changes (e.g., HRA math or Slabs), update the React/Astro component (e.g., `HRAExemptionWorkbench.astro`) first. Because the UI is decoupled from the prose, updating the component math will instantly fix the calculator across all articles that embed it.
