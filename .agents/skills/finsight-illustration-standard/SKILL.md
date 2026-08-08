---
name: finsight-illustration-standard
description: Use this skill to correctly format and generate prompts for FinSight illustrations, ensuring adherence to the strict brand aesthetic for Hero vs Contextual images.
---

# FinSight Illustration Standard

This skill defines the exact visual aesthetics required for FinSight INDIA articles.
Use this skill whenever you are instructed to generate an image prompt or an actual image using the `generate_image` tool for an article.

## General Philosophy
Treat these standards as a launchpad for creativity, not a cage. The images should evoke emotion, anxiety, or relief, directly relating to the financial trap being discussed.

## 1. Hero Illustrations (Article Headers)
Hero illustrations are the main cover images for articles. They must look extremely premium, narrative-driven, and high-stakes, but must seamlessly blend into the website's clean interface.

**Mandatory Prompt Modifiers for Hero Images:**
- **Format:** "A spot illustration with a pure, solid white background. The subjects must be isolated in the center. Do NOT include background scenery, walls, rooms, or rectangular borders."
- **Style:** "A premium, high-detail comic-book style spot illustration. Bold black inking, expressive narrative."
- **Color Palette:** "Deep navy blue and institutional gold, placed strictly against a pure white background."
- **Typography (Optional but encouraged):** "Include bold, thematic typography integrated naturally into the isolated scene."
- **Vibe:** "Dramatic, high-stakes financial tension. Anxiety-inducing or relief-providing."

*Example Prompt:*
"A premium, high-detail comic-book style spot illustration on a pure, solid white background. The subjects must be completely isolated with no background scenery, rooms, or borders. Bold black inking, expressive narrative, and rich colors (deep navy and institutional gold). Subject: A stressed freelancer staring at a glowing red 194J TDS mismatch warning on a laptop, surrounded by piles of rejected tax forms. The vibe is dramatic, high-stakes financial tension."

## 2. Contextual Illustrations (In-Article Explanations)
Contextual illustrations are used mid-article to explain a mechanic or concept visually. They must be simple, original, and metaphorical. Do NOT make them as complex as the Hero images.

**Mandatory Prompt Modifiers for Contextual Images:**
- **Style:** "A clean, simple whiteboard-style explanatory diagram. Crisp black line art on a pure white background."
- **Color Palette:** "Pure white background with black line art and one specific accent color (institutional gold)."
- **Vibe:** "Clear, metaphorical, original, and simple. Focused entirely on explaining a single concept."

*Example Prompt:*
"A clean, simple whiteboard-style explanatory diagram. Crisp black line art on a pure white background with one specific accent color (institutional gold). Subject: A flowchart showing money flowing from a 'Salary' bucket to a 'Business Loss' bucket, blocked by a massive steel firewall labeled 'Section 71'."

## Execution Rule
Whenever you insert an image placeholder in MDX (`{/* ILLUSTRATION PLACEHOLDER: ... */}`), you MUST include the exact prompt you would use to generate that image, adhering strictly to the modifiers above.
