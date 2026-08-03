# FinSight India: Architecture & AI Agent Handoff Guide

**To future AI Agents (Claude, Gemini, GPT, or others):** 
Read this document completely before modifying the codebase. This project recently underwent a 7-Wave Forensic Audit that drastically altered its structure, strictness, and performance. Do not regress these standards.

## 1. Project Philosophy & State
This is an institutional-grade financial intelligence platform. It is not a standard blog. The math must be flawlessly accurate (tested), the pages must load instantly (optimized assets), and the SEO must parse flawlessly into Google's Knowledge Graph (JSON-LD).

## 2. Tech Stack Overview
*   **Framework:** Astro v4+ (Static Site Generation)
*   **Styling:** Tailwind CSS v4 (using native `@theme` in `src/styles/global.css`, NO `tailwind.config.js`)
*   **Content:** Astro Content Collections (Zod typed frontmatter for `.mdx` files)
*   **Testing:** Vitest (for all math utilities)
*   **Asset Optimization:** Astro's native `src/assets/` pipeline (`<Image />` component)

## 3. The 7-Wave Forensic Audit (What Was Changed)
If you are looking at historical code or older prompts, know that the following paradigms are the **new law** of the codebase:

### Wave 1: SEO & Structured Data
*   **Location:** `src/layouts/Layout.astro`
*   **Rule:** Every page injects canonical URLs, strict Open Graph tags, Twitter Cards, and `application/ld+json` schemas. The Layout accepts a `jsonLd` prop. DO NOT build a page without passing the correct schema (e.g., `Article`, `FAQPage`, `WebSite`).

### Wave 2: TypeScript Strictness
*   **Location:** `src/utils/*.ts` and `tsconfig.json`
*   **Rule:** ALL JavaScript files were deleted. The financial engines (`blackScholes.ts`, `xirr.ts`, `tax.ts`) are 100% strongly typed. If you add a utility, it must be `.ts`.
*   **Path Aliases:** Use `@components/`, `@layouts/`, `@utils/`, `@styles/`, `@data/` instead of relative spaghetti paths.

### Wave 3: UX Components & Search
*   **Location:** `src/pages/tax-code.astro` & `src/components/`
*   **Rule:** The Tax Code master list features a client-side JavaScript search engine and category filter utilizing `data-title`, `data-summary`, and `data-category` attributes on cards. 
*   **Components Added:** `Breadcrumbs.astro`, `ReadingProgressBar.astro`, `ShareButtons.astro`, `RelatedArticles.astro`. These are integrated directly into `ArticleLayout.astro`.

### Wave 4: Accessibility (A11y)
*   **Location:** `src/components/InputGroup.astro` & `src/components/Header.astro`
*   **Rule:** Tooltips use `group-focus-within:visible` to support keyboard navigation. The mobile drawer has a strict `focus trap` and `Escape` key listener. Any new interactive component MUST be keyboard accessible.

### Wave 5: Asset Pipeline
*   **Location:** `src/assets/images/`
*   **Rule:** `public/images/` is DEAD. Do not put images in the public folder. All images (42+) were moved to `src/assets/images/`.
*   **Usage:** In `.astro` files, use `import { Image } from 'astro:assets';` and `<Image src={myImg} alt="..." />`. In `.mdx` files, use relative paths: `![Alt](../../assets/images/file.jpg)`. This triggers Astro's auto-WebP compression.

### Wave 6: Unit Testing
*   **Location:** `src/tests/`
*   **Rule:** Vitest is installed. The math utilities (`blackScholes`, `xirr`, `tax`) are covered by 10 strict tests. If you touch financial math, you MUST write or update the corresponding Vitest test. Run `npm run test` to verify.

### Wave 7: Differentiators (URL State & PDF)
*   **Location:** `src/pages/swp-planner.astro` & `src/pages/sip-engine.astro`
*   **Rule:** Calculators are deep-linkable. Inputs sync with `window.history.replaceState` (e.g., `?corpus=10000000`). If you build a new calculator, it MUST encode its state into the URL so users can share links.
*   **PDF:** We use `html2pdf.js` client-side to generate branded reports.

## 4. MDX Content Collections
*   **Location:** `src/content/direct-tax/` & `src/content.config.ts`
*   **Rule:** Articles are written in `.mdx`. They are not simple markdown files; they are interactive whitepapers. They import complex calculators (e.g., `<CapitalGainsWorkbench />`).
*   **Narrative Style:** The user demands the "5 Whys" and "Substantive Justice" approach. Do not write generic SEO fluff. Start with the problem, explain the historical intent of the law, and present the mathematical arbitrage opportunity.

## 5. Development Workflow
*   **Dev Server:** `astro dev`
*   **Build:** `ASTRO_TELEMETRY_DISABLED=1 npm run build` (This will convert all assets to WebP).
*   **Test:** `npm run test` (Runs Vitest suite).

---
*Document automatically generated post-7-Wave Audit.*
