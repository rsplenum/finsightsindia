---
name: finsight-illustration-standard
description: Use this skill to correctly format and generate prompts for FinSight illustrations, ensuring adherence to the strict brand aesthetic for Hero vs Contextual images.
---

# FinSight Illustration Standard

This skill defines the exact visual aesthetics required for FinSight INDIA articles.
Use this skill whenever you are instructed to generate an image prompt or an actual image using the `generate_image` tool for an article.

## The Perfume Philosophy (Structure of an Article)
A good illustration suite is structured like a musical composition of scent. Do not underestimate the power of an illustration; it acts as the Base Chord that lingers in the mind of the reader for days.
- Never portray the government as an "evil entity."
- Never portray taxpayers as "sweat-ridden" or panicked. 
- Compliance issues are rooted in negligence and algorithms. Focus on systemic tension, rigid bureaucracy, and algorithmic sorting.

## 1. The Base Chord (Hero Illustrations)
The Hero image is the Base Chord. It must be rich, diverse, and designed to linger in the memory for days. It must function as a high-end editorial spot illustration. You have two approved visual aesthetics to choose from depending on the article's needs:

### Option A: The Varsity Standard (Seamless Integration)
Use this when you want a rich, bold illustration that floats seamlessly on a white webpage without a visible boundary.
- **Background:** "A pure, solid white background. The subjects must be isolated in the center."
- **Style & Color:** "A premium varsity-style spot illustration. Deep navy blue and institutional gold. Highly creative and storytelling-driven."
- **Typography:** "Include bold, thematic typography integrated naturally into the isolated scene."

### Option B: The Editorial Blueprint (WSJ/Economist Style)
Use this for structural metaphors, algorithms, or rigid legal structures where color acts as a strict semantic system, not just a mood.
- **Background (The Blending Rule):** "A pure, solid white background. Absolutely no off-white, porcelain, or textured paper backgrounds, as this creates ugly borders in the UI."
- **The Semantic 3-Color Palette:**
  1. **Confident Black Ink:** For the physical world (vaults, people, shadows).
  2. **Warm Metallic Accent (Brass/Gold):** Reserved *only* for value/money to visually separate it from cold industrial elements.
  3. **Red:** The System. Reserved *only* for scanning grids, laser lines, and targeting marks. It must never bleed into the physical objects.
- **Abstraction vs Recognition:** Objects must be highly recognizable (a vault needs rivets and dials; a coin needs an embossed rim). Do not let linework simplify them into generic geometric shapes. 
- **No Text/Numbers:** Never include literal text or numbers (e.g., ₹10,00,000). Encode tension structurally (e.g., identical targeting rings around a huge vault and a tiny coin).
- **Vibe:** "A minimalist editorial illustration, technical blueprint aesthetic. Flat inks and fine hatching only — no gradients or soft shading. Elegant, restrained, magazine-spread aspect ratio."

## 1.5. Visual Continuity (Hero vs Companion)
If the article uses the "1+1 Rule" and includes a second Companion illustration, it MUST be built on the *exact same visual system* as the Hero (same background color, same black ink, same red grid) so they read as a single editorial spread.
- The Companion should alter *one specific variable* (e.g., cutting a dashed "ticket stub" perforated door in the grid to signal a time-limited opening).
- Keep the original threat (the vault) visible but faint/unchanged in the background, proving this is a narrow exception within the same system, not a total amnesty.

## 2. The "1+1" Rule (Hero + Optional Spot Illustration)
To maintain a premium magazine aesthetic without looking like AI-generated spam, you MUST follow the "1+1" rule for images:

**1. The Hero Image (Mandatory 1 JPEG):** Every article gets exactly ONE stunning, varsity-style hero JPEG to set the tone.

**2. The Body Visuals (Code Default):** As a strict rule, you must explain logic, algorithms, and structures using beautiful, hand-coded CSS/Tailwind structural diagrams (flowcharts, interactive ledgers). Do NOT generate JPEGs for diagrams.

**3. The Spot Illustration (Optional 1 JPEG):** You are allowed a maximum of ONE additional contextual JPEG further down the article **ONLY** if the concept is highly metaphorical (e.g., a scale weighing deeds, a complex visual metaphor) that a code flowchart cannot capture. 
- If you generate this optional spot illustration, use the following modifiers: "Modern art-like but highly contextual. Clean, crisp. A standalone spot illustration with no borders, blending seamlessly into a pure white background with black line art and institutional gold accents."

## 3. Captioning Philosophy (The Magazine Credit Line)
Every placed illustration in an MDX file must be accompanied by a visible caption directly underneath it. The caption serves a very specific editorial purpose:

- **Do Not Decode:** A visible caption must *never* explain the metaphor. (If it says "this represents...", the illustration has failed). The caption's job is to add a second conceptual layer. 
- **Economist/WSJ Style:** Write exactly one clipped, aphoristic line that could stand alone as a pull-quote. It encodes the article's actual point (e.g., proportionality, a deadline) without narrating the visual.
- **Split the Emotional Beats:** Let the Hero image caption sit in its own discomfort or tension (the "blunt injustice"). Do not gesture at the resolution or defense in the Hero caption. Reserve the relief/resolution caption for the Companion/Inset image further down the page.
- **Styling Structure:** The caption must read as a discrete editorial beat, not body copy. Use generous whitespace above it, and style it as small, muted gray/sepia, and italicized.
  
*Example MDX Implementation:*
```mdx
![FAST-DS Amnesty Exit](../../assets/images/inset_schedule_fa_bma_fastds.jpg)
<span className="mt-6 mb-12 block text-center text-sm tracking-wide text-stone-500 italic">"One exit, cut on purpose — open until December 31."</span>
```

## Execution Rule
Whenever you insert an image placeholder in MDX (`{/* ILLUSTRATION PLACEHOLDER: ... */}`), you MUST include the exact prompt you would use to generate that image, adhering strictly to the modifiers above.

**CRITICAL:** Whenever you are instructed to actually generate an image using the `generate_image` tool, you MUST first present the exact prompt to the user and request their explicit authorization. Do NOT generate the image until the user approves the prompt.

## 4. CSS Blending Standard (Organic Integration)
AI-generated JPEGs will always have a solid pure-white background. When displaying these images in the FinSight UI (in Astro pages or layouts), they must seamlessly blend into the canvas without looking like jarring white rectangles, while strictly preserving the semantic Red and Gold colors.

You MUST apply the following exact Tailwind class combination to all `img` or Astro `<Image>` tags rendering these JPEGs:
`contrast-125 brightness-105 mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen`

**How it works (Do not deviate):**
- **Light Mode (`contrast-125 brightness-105 mix-blend-multiply`):** AI generators often produce off-white backgrounds (e.g. #F9F9F9). `contrast-125 brightness-105` pushes these off-white pixels to pure solid white (#FFFFFF) while keeping the ink black. `mix-blend-multiply` then forces the pure white to become perfectly transparent, allowing the slight off-white of the site (`bg-slate-50`) to organically show through without a bounding box.
- **Dark Mode (`dark:invert dark:hue-rotate-180 dark:mix-blend-screen`):** 
  1. `contrast` and `brightness` (applied before invert) guarantee a pure white background.
  2. `invert` turns that pure white background into pure black, and the black ink into glowing white.
  3. `hue-rotate-180` rotates the inverted colors perfectly back into their original FinSight Red and Gold.
  4. `mix-blend-screen` takes that pure black background and drops it out of existence entirely, letting the dark navy of the site show through seamlessly.
