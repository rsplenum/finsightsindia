# FinSight Architecture Standards

## The Core Philosophy
FinSight is engineered to solve a singular problem: **Cognitive Overload.**
Finance is inherently complex, and presenting heavy computational engines alongside dense statutory literature is a recipe for user anxiety. 

To solve this, FinSight strictly adheres to an **Architectural Split** between the Engine layer and the Literature layer.

## The Architectural Split
The platform's frontend is strictly divided into two distinct domains:

### 1. `/tax-calculator` (The Engine)
- **Purpose:** Pure, frictionless computational execution.
- **Design:** This path hosts the Interactive India Income Tax Calculator (Slab Engine).
- **Constraint:** It must NEVER include heavy text, articles, or master guides. The user’s focus must remain 100% on inputs (salary, deductions) and outputs (tax regime comparison).

### 2. `/tax-code` (The Knowledge Base)
- **Purpose:** Institutional-grade tax literature, rewritten for human consumption.
- **Design:** This path hosts the Master Whitepapers and Tax Guides. 
- **Constraint:** It must NEVER embed the heavy Interactive Slab Engine at the top of the page. Doing so paralyzes users attempting to read literature. Instead, articles here should link *out* to the calculators contextually via inline CTA buttons or `NoticeTrap` components.

## Polymorphic Component Design
Every article inside `/tax-code` uses the MDX format. We rely on polymorphic, context-aware components to keep the prose rich and engaging, avoiding the "assembly line" feel of generic blogs.
- Headings are bespoke (e.g., *The Interrogation Room* instead of *Edge Cases*).
- Visual layouts use the `NoticeTrap` component (minimum `text-base` size for accessibility).

*All developers must respect this hard architectural line. Do not merge computational tools and deep literature into the same scrollable view.*
