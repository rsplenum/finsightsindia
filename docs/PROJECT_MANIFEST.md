# Project Manifest: The "Gold Standard" Architecture

Welcome to the FinSight / SWP Calculator knowledge base repository.

This project is **not a generic tax blog**. We are building a premium, high-anxiety friction-solver for Indian taxpayers. Our goal is to provide **Outcome Certainty** through highly detailed, legally bulletproof deep-dives combined with interactive web applications and embedded calculators.

Any developer, content creator, or AI agent contributing to this project MUST strictly adhere to the standards outlined in the `docs/standards/` directory.

## Core Philosophy
- **Empathy over Jargon:** We elevate the user. We do not make them feel lesser for not knowing technical terms.
- **Relief over Panic:** We identify high-anxiety friction points (Notices, Penalties) and guide the user through a psychological arc to ultimate relief and empowerment.
- **Work of Art Aesthetic:** The UI is dark, premium (Navies and Golds), using glassmorphism and perfectly blended hand-drawn "Varsity-style" artwork to create a sentimental bond with the reader.

## 🚨 The Continuous Documentation Mandate
**Non-Negotiable Rule:** No new feature, calculator, component, or article is considered "complete" until:
1. Its underlying technical mechanics have been documented in the [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md).
2. Any new volatile financial variables it introduces have been added to the [`docs/standards/yearly_updation_index.md`](./standards/yearly_updation_index.md).

## The Standard Operating Procedures (SOPs)

Before taking any action on this repository, you must review the specific SOPs below:

### 1. Selecting a Topic
We do not write dictionary definitions. We write answers to high-anxiety queries.
👉 **Read the SOP:** [`docs/standards/search_criterion.md`](./standards/search_criterion.md)

### 2. Writing an Article (The 4-Pillar Narrative)
Every article must follow a strict psychological architecture: Regulation -> Notice Traps -> Loopholes -> Edge Cases. It must be dense with utility.
👉 **Read the SOP:** [`docs/standards/quality_narrative.md`](./standards/quality_narrative.md)

### 3. Creating Visuals & UI
We map illustrations contextually to emotions (The Anxiety Hook at the top, The Relief at the bottom). We use mix-blend modes to ensure no white backgrounds ever show.
👉 **Read the SOP:** [`docs/standards/quality_visuals.md`](./standards/quality_visuals.md)

### 4. Code Maintenance & Updates
Tax laws change. We use strict MDX Frontmatter (`updatedDate` and `statutoryAct`) to track dependencies. 
👉 **Read the SOP:** [`docs/standards/maintenance_protocol.md`](./standards/maintenance_protocol.md)
👉 **Read the Dictionary:** [`docs/standards/yearly_updation_index.md`](./standards/yearly_updation_index.md) (The master list of all volatile tax limits and thresholds).

## Tech Stack
- **Framework:** Astro + MDX
- **Styling:** Tailwind CSS (Custom color palette in `tailwind.config.mjs`)
- **Components:** React (for complex stateful interactive calculators), Astro components (for layout and MDX wrappers like `<NoticeTrap>`).
