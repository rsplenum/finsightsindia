# System Architecture & Component Blueprint

This document maps out the exact technical infrastructure of the FinSight/SWP Calculator platform. Any new complex logic, calculator, or major component added to this repository MUST be documented here.

## 1. Directory Structure
```text
swp_calculator/
├── docs/                   # Institutional Standards & Master Checklists
├── public/
│   └── images/             # All "Varsity-style" hand-drawn JPG illustrations
├── src/
│   ├── components/
│   │   ├── mdx/            # React/Astro components embedded in markdown prose
│   │   └── ui/             # Reusable UI elements (Buttons, Cards, Headers)
│   ├── content/
│   │   └── direct-tax/     # The high-anxiety MDX Deep-Dive Articles
│   ├── layouts/            # Global structural wrappers (Layout, ArticleLayout)
│   └── pages/              # Astro routing (e.g., /direct-tax/[slug])
```

## 2. Core Calculators (The Engines)
These are the heavy standalone interactive web applications built to solve complex financial math.

### A. The SWP Planner (Stochastic Accumulation Engine)
- **Purpose:** Helps users plan retirement withdrawals while simulating market crashes.
- **Key Mechanics:**
  - **Monte Carlo Simulation:** Uses a randomized Gaussian distribution to simulate 1,000 different market paths based on historical Nifty 50 volatility.
  - **Black-Scholes Hedging:** Allows users to allocate a % of their portfolio to Put Options. It calculates the theoretical premium cost and applies the payoff if the simulated market drops below the strike price, acting as an insurance floor.

### B. The SIP Engine
- **Purpose:** Calculates the future value of systematic investments, adjusting for inflation to show real purchasing power.

## 3. The Article Architecture (MDX + Components)
We use MDX to blend standard Markdown prose with highly interactive React/Astro components. This transforms static articles into "Interactive Workbenches."

### A. `ArticleLayout.astro` (The Visual Engine)
- **Role:** Wraps every MDX article.
- **The CSS Blend Magic:** To achieve our signature "Work of Art" aesthetic, we enforce strict CSS in the Tailwind prose configuration: `prose-img:mix-blend-multiply dark:prose-img:invert dark:prose-img:mix-blend-screen`. This guarantees that JPG illustrations organically blend into the dark/light backgrounds without white rectangular patches.

### B. Interactive MDX Workbenches
- `<HRAExemptionWorkbench>`: Calculates the exact Section 10(13A) exemption (Least of: Actual HRA, 50% Basic, Rent - 10% Basic).
- `<TaxWorkbench>`: Embedded in the New vs Old Regime article to visualize the ₹3.75L breakeven point dynamically.
- `<NoticeTrap>`: A heavily styled glassmorphism Astro component used strictly to highlight CPC scrutiny triggers and legal penalties.

## 4. The UI / Design Language
- **Framework:** Tailwind CSS v4.
- **Theme:** Institutional Navy (`#0A192F`) and Gold (`#D4AF37`).
- **Typography:** `Inter` for prose readability; `Geist Mono` for financial figures and tabular data.
- **Vibe:** Serious, premium, empathetic. Dark mode optimized with frosted glass components (`.card-premium`).
