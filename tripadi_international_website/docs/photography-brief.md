# Photography brief

The site is built around photography — that was the brief, and it is the right
one for metalware. This is the shot list.

`npm run audit:data` prints every missing file by exact path at any time.

---

## Priority 1 — the 29 products (blocks launch)

**What:** each piece on a plain background, three-quarter view, the whole object
in frame with a little space around it.

**Where it goes:** `public/products/tri-cd-101.jpg` — the filename for each
product is the `images.hero` value in `src/data/products.json`, which is just the
SKU in lower case.

**How to shoot metal — the four things that matter:**

1. **Diffuse the light.** Polished metal is a mirror; it photographs whatever is
   around it. A bare bulb or a window gives you a hard white streak and a
   reflection of the room. A white sheet or a translucent tent between the light
   and the piece fixes it completely, and costs nothing.
2. **Light from two sides, unevenly.** Even light makes metal look flat and grey.
   A brighter light on one side and a fill on the other is what gives it form.
3. **Shoot on light grey, not white.** A polished piece on pure white
   disappears at the edges. The site places every photograph on a soft grey tile
   for exactly this reason, and a light grey background matches it.
4. **Get low.** Slightly below the top rim, not looking down at it. Looking down
   makes a chafing dish look like a bowl.

**Format:** roughly 2000px on the long edge, sRGB, JPEG quality 80 or WebP.

## Priority 2 — second angles and details

Two extra frames per piece, at `-b` and `-c`:

- A detail — hammering, the hinge, a cast handle, the tone line on a two-tone plate
- A back or underside view, or the piece open

These are what a buyer looks at when they are close to deciding.

## Priority 3 — in use (the highest-value photographs on the site)

Seven settings, one photograph each. These are the pages that bridge inspiration
and purchase, and they are currently the largest gap.

| File | The shot |
|---|---|
| `use-banquet-buffet.jpg` | A dressed buffet line, chafers open, three or more pieces in frame |
| `use-fine-dining.jpg` | A laid table — charger, napkin ring, pitcher, warm light |
| `use-poolside-brunch.jpg` | Outdoors, daylight, coolers and bowls in the sun |
| `use-room-service.jpg` | A loaded butler tray, cloche on, corridor or threshold |
| `use-bar-lounge.jpg` | Low warm light, copper, shaker mid-use, hands in frame |
| `use-breakfast-buffet.jpg` | Mini chafers, juice dispenser, tiered stand, a working counter |
| `use-home-entertaining.jpg` | A domestic table, copper handi, family-style |

**How to get these without a budget:** ask a hotel or banquet hall you already
supply for two hours before a function. They lose nothing, you get the most
valuable photographs on the site, and it is a natural way to open a
case-study conversation. Failing that, a catering college or a friendly
restaurant on a quiet afternoon.

Real rooms beat studio composites here. Slightly imperfect and genuinely in use
outperforms perfect and staged.

## Priority 4 — the factory (your unfair advantage)

| File | The shot |
|---|---|
| `factory-floor.jpg` | Wide, the floor working, people in it |
| `factory-polishing.jpg` | A polishing wheel, sparks or the moment a piece turns bright |
| `tool-room.jpg` | Dies, tooling, the tool-room bench |
| `moradabad-workshop.jpg` | Hands hammering — the shot that says four hundred years |
| `wholesale-crates.jpg` | Export cartons stacked and labelled |
| `../brand/rajendra-sharma.jpg` | **You, working.** Not a formal portrait. |

No competitor who is a trading house can produce a single one of these. Shoot
them, and shoot video at the same time — the growth playbook leans on it.

## Priority 5 — brand and social

- `brand/og-default.jpg` — 1200 × 630, the image shown when the site is shared on
  WhatsApp, LinkedIn or in a message. Currently missing; a strong hero shot with
  breathing room works.
- Journal headers: `journal-chafing-dishes.jpg`, `journal-metals.jpg`,
  `journal-moradabad.jpg`

---

## While photographs are missing

Every image slot renders a quiet typeset placeholder — a monogram, the piece's
name, and "photograph pending". The page still looks composed, and it is honest
about what it is. Drop the file in and the placeholder is replaced automatically
on the next build. No code changes, no configuration.
