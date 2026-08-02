---
version: beta
name: Etihad-Bureau-Inspired-Design
description: An institutional-grade design language inspired by Al Etihad Credit Bureau. Uses a deep Navy, Gold, and Emerald color palette with Inter typography to convey trust, financial precision, and institutional weight.

colors:
  navy-950: "#0A192F"
  navy-900: "#0F172A"
  navy-800: "#1E293B"
  navy-700: "#334155"
  navy-600: "#475569"
  navy-500: "#64748B"
  navy-400: "#94A3B8"
  navy-300: "#CBD5E1"
  navy-200: "#E2E8F0"
  navy-100: "#F1F5F9"
  navy-50: "#F8FAFC"
  
  gold-600: "#B8941F"
  gold-500: "#D4AF37"
  gold-400: "#C5A059"
  gold-300: "#E8D48B"
  gold-200: "#F5EBBC"

  emerald-500: "#10B981"
  emerald-400: "#34D399"
  
  amber-500: "#F59E0B"
  amber-400: "#FBBF24"
  
  rose-500: "#EF4444"
  rose-400: "#F87171"

typography:
  font-sans: "Inter", "Geist Sans", sans-serif
  font-mono: "Geist Mono", monospace
  
  text-hero: "clamp(2rem, 5vw, 3.5rem), fw:700, lh:1.1, tracking:-0.025em"
  text-section: "clamp(1.5rem, 3.5vw, 2.25rem), fw:600, lh:1.2, tracking:-0.015em"
  text-card-title: "clamp(1rem, 2vw, 1.375rem), fw:600, lh:1.3"
  text-caption: "0.8125rem, uppercase, fw:600, tracking:0.05em"

components:
  card-premium:
    description: "The primary container for tools and content."
    border: "1px solid rgba(226, 232, 240, 0.8)"
    bg: "white"
    shadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)"
    radius: "16px"
  
  input-premium:
    description: "Standard text/number input fields."
    border: "1px solid navy-200"
    bg: "white"
    focus-ring: "gold-500/20"
  
  btn-gold:
    bg: "linear-gradient gold-400 to gold-600"
    text: "white"
    shadow: "0 4px 12px -2px rgba(212, 175, 55, 0.3)"
  
  btn-ghost:
    bg: "transparent"
    border: "1px solid navy-200"
    text: "navy-700"

---

## Overview

This project uses an institutional-grade financial intelligence platform aesthetic. It is NOT the stark, black-and-white Vercel aesthetic. Instead, it relies on deep navies and rich golds to convey trust, stability, and premium quality, much like high-end wealth management portals.

### Key Rules
- **Typography**: Always use `Inter` for prose and narrative text. Use `Geist Mono` exclusively for numbers, currency, and technical data.
- **Colors**: Rely heavily on `navy-900` for primary text and headings, `navy-500` for secondary text. Use `gold-500` for primary calls to action, highlights, and important borders. Use `emerald-500` for success states and "safe" status badges.
- **Dark Mode**: Use the explicit `.dark` variant classes. Dark mode uses `navy-950` as the page background and `navy-800` for card surfaces.
- **Elevation**: Use soft, diffuse shadows (`shadow-sm`, `shadow-md` from tailwind, or the custom `.card-premium` shadow). Do not use stark, high-contrast shadows.

### Core Utilities
- `.hero-glow`: A soft, diffuse radial gradient background used for page headers.
- `.card-premium`: The default container for calculator inputs and outputs. Has a slight border and a very soft shadow, with a hover effect.
- `.input-premium`: Form inputs with focus states mapped to the gold accent.
- `.btn-gold`: Primary action buttons with a subtle gold gradient.
