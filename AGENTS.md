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
2. **Visual Standards Integration:**
   - Always use the `<CardPremium>` component for the TL;DR.
   - All interactive calculators/components MUST include Tailwind `dark:` mode classes (e.g., `dark:bg-navy-900`, `dark:text-white`) to align with the brand theme.
3. **Data & Navigation Architecture:**
   - **Reel Scripts** must NEVER be embedded inline in the `.mdx`. They MUST be appended as JSON objects to `src/data/reel-scripts.json`.
   - New pages or ledgers MUST be wired into the global navigation (`src/layouts/Layout.astro`) so they are actually accessible to users.
4. **No Haste Rule:** Do not cut corners to save tokens or bypass API limits. It is better to pause and ask the user to wait or proceed in batches than to deliver a compromised, stripped-down artifact.
