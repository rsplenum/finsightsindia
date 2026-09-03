# Tripadi International

The website for Tripadi International — manufacturer and exporter of stainless
steel, brass and copper hospitality metalware, Moradabad, Uttar Pradesh, India.

Astro 7 · Tailwind CSS 4 · static output · no runtime dependencies.

```bash
npm install
npm run dev        # http://localhost:4321
npm run verify     # data audit + slug check + build
```

---

## What is here

| | |
|---|---|
| **159 pages** | 29 products, 7 collections, 7 use-case settings, 3 journal guides, 92 programmatic SEO pages, plus shop, wholesale and company pages |
| **Wholesale** | An enquiry basket that persists across visits, an RFQ form that never dead-ends, WhatsApp deep links on every product |
| **Retail** | Shop, bag, checkout, Razorpay wired but not switched on |
| **pSEO** | 92 generated landing pages from a matrix in `src/data/pseo.json` |
| **No JS framework** | Roughly 8 KB of hand-written client JS, all of it for the two baskets |

## Before it goes live

Run `npm run audit:data` — it prints exactly what is still provisional.

Three things block launch:

1. **The 29 product photographs.** They did not reach the environment this site
   was built in. Every image renders a typeset placeholder until the file exists
   at the path in `src/data/products.json`. Drop the files in and the
   placeholders disappear — no code change. See `docs/photography-brief.md`.
2. **Real company facts.** Everything listed in `company.json → _provisional` is
   a placeholder: address, phone, WhatsApp, GSTIN, IEC. A wrong phone number is
   worse than no site.
3. **Real product data and prices.** All 29 products are `verified: false`. The
   retail prices are invented placeholders (`provisional_price: true`) and must
   be replaced or the shop switched to price-on-request.

`docs/questionnaire.md` collects all of it in one pass.

Also, before go-live: have `terms.astro`, `privacy.astro` and
`shipping-and-returns.astro` read by your accountant or a lawyer. They are
accurate to how the site works, but they are drafts, not legal advice.

## How the data works

Everything on the site is generated from five files. Change a file, rebuild, the
site follows.

```
src/data/
  company.json      Every company fact. Single source of truth.
  products.json     The 29 pieces. Drives product pages, collections, shop, schema.
  categories.json   The 7 collections.
  use-cases.json    The 7 "in use" settings, each listing product IDs.
  pseo.json         The programmatic SEO matrix.
  journal.json      Journal article metadata.
```

**Adding a product:** append to `products.json` with a unique `id` and `slug`,
drop the photograph at the `images.hero` path, rebuild. The product page,
collection listing, shop entry, sitemap and structured data all appear.

**Adding pSEO pages:** add a topic, market or buyer to `pseo.json`. The pages
build themselves. Do not expand this into thousands of combinations — thin pages
at scale are a penalty, not a strategy. `npm run check:slugs` fails the build if
a generated slug would collide with a real page.

## Photographs

Drop files at these paths in `public/`:

```
public/products/tri-cd-101.jpg      hero image for TRI-CD-101
public/products/tri-cd-101-b.jpg    second angle
public/lifestyle/use-banquet-buffet.jpg   the "in use" setting photographs
public/brand/rajendra-sharma.jpg
public/brand/og-default.jpg         1200×630, used for link previews
```

`npm run audit:data` lists every missing file by exact path.

Nothing is renamed or resized by the build — export at roughly 2000px on the
long edge, sRGB, quality 80. WebP works and is smaller; if you use it, change
the extension in `products.json` to match.

## Configuration

Copy `.env.example` to `.env`. Every variable is optional — with none set, the
site still works end to end, because every form falls back to composing an email
and a WhatsApp message.

- `PUBLIC_FORM_ENDPOINT` — where enquiries POST as JSON. See `docs/forms.md`.
- `PUBLIC_RAZORPAY_KEY_ID` + `PUBLIC_ORDER_ENDPOINT` — turns on card checkout.
  See `integrations/razorpay/README.md`. **The Razorpay secret key never goes in
  this repository.**

Set the live domain in `astro.config.mjs` → `site`. It drives canonicals, the
sitemap and every absolute URL in the structured data.

## Deploying

Static output — host it anywhere. Netlify, Vercel and Cloudflare Pages all work
with zero configuration:

```
build command:      npm run build
publish directory:  dist
```

Set the environment variables in the host's dashboard, not in a committed file.

## Documents

- `docs/questionnaire.md` — everything needed from Rajendra Sharma
- `docs/growth-playbook.md` — reaching buyers and converting them
- `docs/photography-brief.md` — the shot list
- `docs/forms.md` — wiring up enquiry delivery
- `integrations/razorpay/README.md` — turning on payments
