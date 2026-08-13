## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Institutional Memory (CRITICAL)

Before proposing technical solutions, making UI changes, or debugging build errors, you **MUST** read `src/data/engineering-solutions.json`.
This file acts as our institutional memory. If a problem is listed there, you must strictly implement the documented solution to avoid repeating mistakes.

## FinSight Article Publishing Pipeline (CRITICAL STANDARD)

To prevent regressions, "stripped down" drafts, or orphaned components during the 100 Topics generation, EVERY article must pass the following strict checklist before it is considered complete:

1. **Research Depth Parity:** The final `.mdx` article MUST contain every mechanical step, edge-case, and psychological hook detailed in the initial research. Never summarize or strip down the core argument.
2. **Visual Standards Integration (The "Magazine" Aesthetic):**
   - Always use the `<CardPremium>` component for the TL;DR.
   - All interactive calculators/components MUST include Tailwind `dark:` mode classes (e.g., `dark:bg-navy-900`, `dark:text-white`) to align with the brand theme.
   - **No Juvenile Animations:** When building SVG or CSS-based infographics and components, strictly avoid "game UI" keyframe animations (like bouncing elements, flashing sirens, or rapid pulsing). Use elegant, static magazine-style editorial design to convey motion and narrative (e.g., static speed lines, dashed paths, refined borders, structural alignment). Keep the tone mature, tasteful, and sophisticated.
3. **Data & Navigation Architecture:**
   - **Reel Scripts** must NEVER be embedded inline in the `.mdx`. They MUST be appended as JSON objects to `src/data/reel-scripts.json`.
   - New pages or ledgers MUST be wired into the global navigation (`src/layouts/Layout.astro`) so they are actually accessible to users.
4. **THE NO HASTE DOCTRINE (CRITICAL):**
   - Do not rush to clear the backlog. Depth is infinitely more valuable than speed.
   - Never cut corners to save tokens, bypass API limits, or please the user with a fast turnaround.
   - Pause, reflect, and deliver uncompromising quality. 
   - Stop asking "shall we proceed to the next step?" immediately after delivering a phase. Give the user (and the process) room to breathe. No Haste.

## Image Generation (CRITICAL GUARDRAIL)

BEFORE generating any illustration using the `generate_image` tool, you MUST:
1. Stop execution.
2. Present the exact prompt you intend to use to the user.
3. Wait for the user's explicit authorization.

**Do NOT proactively execute `generate_image` under any circumstances without prior approval.**
