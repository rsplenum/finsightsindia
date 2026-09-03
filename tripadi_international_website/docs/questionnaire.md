# The questionnaire

**For: Rajendra Sharma. Purpose: to replace every invented detail on the website with a real one.**

The site is built and working. What it does not yet have is your facts. Every
answer below has a specific home in the code — the right-hand note tells you
where — so nothing you write here gets lost in a conversation.

**How to use this:** answer what you can in one sitting, skip what you cannot,
and send it back however is easiest (typed, voice note, photographs of a
handwritten page). Section 1 and Section 6 are the two that block launch.
Everything else improves the site rather than unblocking it.

Run `npm run audit:data` at any time to see exactly what is still provisional.

---

## Section 1 — Facts we must have before the site goes live

> These are currently placeholders. The site displays them, so a wrong one is
> worse than a missing one. → `src/data/company.json`

| # | Question | Currently shows |
|---|---|---|
| 1.1 | Full legal name of the business, and is it a proprietorship, partnership, LLP or Pvt Ltd? | "Tripadi International (proprietorship — CONFIRM)" |
| 1.2 | Complete factory address, including plot/street, area and PIN code | placeholder |
| 1.3 | Complete office address, if different from the factory | — |
| 1.4 | Google Maps link or pin for the factory | empty |
| 1.5 | Primary phone number, in international format | +91 00000 00000 |
| 1.6 | WhatsApp number, if different (this drives every WhatsApp button on the site) | placeholder |
| 1.7 | Email for trade and export enquiries | sales@tripadiinternational.com |
| 1.8 | Email for general enquiries | info@tripadiinternational.com |
| 1.9 | GSTIN | "TO CONFIRM" |
| 1.10 | IEC (Import Export Code) | "TO CONFIRM" |
| 1.11 | The exact year the business was founded | 1995 (assumed from "30 years") |
| 1.12 | Working hours and days | Mon–Sat 10:00–18:30 IST |
| 1.13 | **The domain name you want.** Do you already own one? | www.tripadiinternational.com (assumed) |

---

## Section 2 — You and the company story

> This is what separates the site from every trading company's site. → `about.astro`, `company.json`

2.1 In your own words: how did you start? What were you doing before Tripadi International?

2.2 What is the piece you are proudest of making? Why that one?

2.3 What is the mistake you made early on that you never made again?

2.4 Is there a family history in metalwork? How many generations?

2.5 Who else is in the business — sons, daughters, partners, a long-serving master craftsman? Names and roles, if you want them on the site.

2.6 How many people work in the factory?

2.7 What is the size of the factory in square feet?

2.8 **A photograph of you.** Working, at the bench or on the floor, not a formal portrait. This will be one of the most-looked-at images on the site.

2.9 Is "Tripadi" a family name, a place, or something else? The story behind the name, if there is one.

---

## Section 3 — The factory and what it can do

> → `factory.astro`, `company.json` → `factory`

3.1 Which of these do you do **in your own building**? Cross out any you job out:
spinning · deep drawing · sand casting · die casting · hand hammering · chasing · TIG welding · buffing · mirror polishing · satin finishing · electroplating (nickel/chrome/silver/gold) · antiquing · PVD coating · lacquering · tool and die making · laser etching

3.2 What machinery do you have, roughly? (Number of lathes, presses, polishing stations, plating tanks.)

3.3 What is your monthly production capacity — in pieces, or in containers?

3.4 What is your **largest single order** to date? (Quantity and, if you are comfortable, the value.)

3.5 What is the **shortest** lead time you can honestly hold for a repeat order?

3.6 Which certifications do you actually hold? Please mark: ISO 9001 · EPCH membership · FDA/LFGB food-contact · SEDEX or social audit · REACH · BIS · any other.
*(Where you have none, say so — we will simply not claim it. A false certification claim is the fastest way to lose an export buyer.)*

3.7 Do you have a fire safety certificate and a factory licence? (Some hotel groups ask.)

---

## Section 4 — The 29 products

> **This is the big one.** → `src/data/products.json`
>
> I have drafted all 29 products with names, dimensions, capacities, materials,
> MOQs and lead times. **They are educated guesses, not your data.** Every one is
> marked `verified: false`.
>
> The fastest way to do this: send me your existing price list, catalogue or
> Excel sheet in whatever state it is in, and I will map it across. If you do not
> have one, use the table below.

For **each** product, I need:

| Field | Why it matters |
|---|---|
| Your own product name / model number | Buyers search for what you call it |
| Category | Which of the seven collections |
| Metal and grade (304? 202? brass alloy?) | Trade buyers ask this first |
| Finishes actually available for this item | Currently drafted, not confirmed |
| Capacity (litres) | On the spec table |
| Dimensions L × W × H in mm | On the spec table |
| Weight in kg | Determines freight cost |
| **MOQ** | Every product page states this |
| Lead time | Every product page states this |
| **Wholesale price band** — even a rough range | See 4.2 |
| **Retail price** if sold to individuals | See 4.3 |
| Packing: pieces per carton, carton size, gross weight | Export buyers need this |
| HS code | Currently drafted — must be verified |

4.1 **Which of the 29 are your genuine best-sellers?** Name the top five. They should lead the homepage.

4.2 Wholesale pricing: do you want any prices shown publicly, or should everything be "price on request"?
*(Recommendation: keep wholesale on request — it protects your margin and forces the enquiry, which is what you actually want. My draft does exactly this.)*

4.3 **Retail prices — these are currently invented and must be replaced.** The shop is live in the code and every price in it is a placeholder. Send real retail prices, or tell me to switch the shop to "price on request" until you have them.

4.4 Is there anything in the 29 you would rather **not** show publicly?

4.5 What can you make that is **not** in these 29? (Cutlery, buckets, lamps, planters, bathroom fittings, decor?) Each one is a new category and a new set of search terms.

4.6 What is your absolute lowest MOQ, on your simplest item?

---

## Section 5 — Customers, proof and price

> Nothing converts a hotel buyer like knowing another hotel already bought. → `about.astro`, homepage

5.1 **Name any hotels, chains, banquet halls or restaurants you supply.** Even one recognisable name changes the site.

5.2 If you cannot name them, may we say "we supply properties in [cities/countries]" without naming?

5.3 Which countries have you actually exported to? *(The site currently lists twelve markets — this is my assumption and needs correcting.)*

5.4 Do you have any buyer who would give a two-line testimonial? Even a WhatsApp message we can quote.

5.5 Do you sell on IndiaMART, Alibaba, TradeIndia, Amazon or ExportersIndia? Links, please — we should point at them and, more importantly, learn from what converts there.

5.6 Do you exhibit at trade fairs? (IHGF Delhi Fair, Ambiente Frankfurt, HOTELEX, Gulfood, AAHAR?) Which ones, and when next?

5.7 Are there any photographs of your pieces **in a real hotel**? These are worth more than any studio shot.

---

## Section 6 — Photography

> The single largest gap. → `docs/photography-brief.md` has the full brief.

The 29 product images did not reach me — the upload did not come through to the
environment this site was built in. Every product page currently shows a
typeset placeholder where the photograph goes.

6.1 **Please re-send the 29 images.** Naming does not matter; I will map them.

6.2 What else do you have already? Cross what exists:
- [ ] Plain-background product shots (the 29)
- [ ] Multiple angles per product
- [ ] Detail shots (hammering, hinge, handle, finish)
- [ ] Factory floor and craftsmen at work
- [ ] Pieces on an actual buffet or table
- [ ] Packing and export cartons
- [ ] A photograph of you
- [ ] Video of any kind

6.3 The site is designed around **pieces in use**, because that is what turns a browser into a buyer. Do you have any in-situ photographs at all? If not, this is the highest-return thing you can commission — see the brief.

6.4 Do you have a logo file? Vector (`.ai`, `.svg`, `.eps`) if possible.

6.5 Do you have brand colours you want kept?

---

## Section 7 — How you want to sell

7.1 **Retail: do you actually want it?** Selling one piece at a time means packing, couriers, returns and customer questions. It is a real operational commitment.
*(My recommendation: yes, but start with about ten pieces rather than all 29 — the ones that survive a courier and do not need a finish decision.)*

7.2 Who will pack and dispatch retail orders? Do you have a courier account?

7.3 Do you have a current-account bank and, for exports, a bank that handles L/Cs?

7.4 Are you willing to set up Razorpay? *(Needs GSTIN, PAN, cancelled cheque, business registration. Two to three days. Until then the site takes the order and sends a payment link.)*

7.5 Do you want to sell internationally at retail, or India only to start?

7.6 What is your returns policy? The site currently says 7 days, which is a guess.

7.7 Would you offer an exclusive distributor arrangement in a territory for a volume commitment?

---

## Section 8 — Competition and positioning

8.1 Who do you lose orders to? Name the competitors, in Moradabad or elsewhere.

8.2 When you lose, what is the reason — price, lead time, certification, or something else?

8.3 What do you do better than them that buyers do not know about?

8.4 What do you charge more for than they do, and why is it worth it?

8.5 If a buyer could only remember one sentence about Tripadi International, what should it be?

---

## Section 9 — Operations, so the website does not overpromise

9.1 Who answers enquiries from the website, and how fast can they realistically reply? *(The site currently promises one working day. If that cannot be held, we change it — a promise the site makes and the office breaks is worse than no promise.)*

9.2 Can you handle enquiries in English by email and WhatsApp, or do you need help drafting replies?

9.3 What is your capacity for **sample** requests? If ten buyers a week ask for samples, is that a problem?

9.4 Do you want enquiries to reach you by email, WhatsApp, or both?

9.5 Is there anything you do **not** want to do? (No small orders, no particular market, no specific product type.)

---

## Section 10 — Marketing, so we can start

10.1 Do you have any social accounts already — Instagram, Facebook, LinkedIn, YouTube?

10.2 Do you have any budget for paid advertising to begin with, even a small monthly figure?

10.3 Can someone in the office take a photograph or a short video on a phone once a week? *(This one answer decides whether the Instagram strategy in the growth plan is realistic.)*

10.4 Do you speak on video comfortably? A factory-floor video series is the single strongest asset you could build, and it cannot be copied by a trading house.

10.5 Are there existing customers we could ask for a review or a referral?

---

### The three answers that unblock the most

1. **The 29 photographs** (6.1) — the site is designed around them.
2. **Your real contact details** (Section 1) — nothing can go live without these.
3. **Your real product data and prices** (Section 4) — currently drafted and marked unverified.

Everything else can follow.
