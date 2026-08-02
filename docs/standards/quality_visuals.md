# Visual Design & Artwork Checklist

Before publishing any article, you MUST verify it passes this strict visual and aesthetic checklist to ensure the platform feels like a premium "Work of Art."

## 1. The Emotional Mapping Framework (Contextual Visuals)
Illustrations MUST be anchored to specific emotional triggers in the text, rather than hardcoded to the top/bottom of the page.
- [ ] **The "Anxiety Hook":** Anchored directly under the Executive Summary. Must capture the panic, confusion, or fear of the user's specific query.
- [ ] **The "Aha!" Moment (Optional Inset):** Anchored to the deepest edge case or most complex rule to visually break down the complexity.
- [ ] **The "Relief/Empowerment":** Anchored *exactly* inside the section providing the "way out" (e.g., "How can I save money?" or specific loophole text). It must visually depict relief and accompany the paragraph that provides the solution.
- [ ] Are all illustrations in the "Varsity Style" (Minimalist, stick-figure, relatable, black line art with subtle colored accents)?
- [ ] Are we strictly avoiding rigid, robotic Mermaid.js charts or technical SVG diagrams?

## 2. Inset "Curiosity" Illustrations
- [ ] Are there smaller, secondary illustrations placed deeper within the article (e.g., in the Edge Cases section) to break up dense text?
- [ ] Do these inset illustrations continue the visual journey and create a modern artwork feel?

## 3. Seamless CSS Blending
- [ ] Are all JPG illustrations organically blended into the UI background? (There should be NO white rectangular patches).
- [ ] *Development Check:* Ensure `ArticleLayout.astro` retains the CSS logic: `prose-img:mix-blend-multiply dark:prose-img:invert dark:prose-img:mix-blend-screen` so that images appear as if drawn directly onto the page in both Light and Dark modes.

## 4. UI Components and Typography
- [ ] Are Notice Traps utilizing the `<NoticeTrap>` component to render properly styled glassmorphism cards?
- [ ] Are calculators wrapped in the `<TaxWorkbench>` (or similar) component to provide interactive value?
- [ ] Is the typography readable and appropriately spaced (using Tailwind prose)?
