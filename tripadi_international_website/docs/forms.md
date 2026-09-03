# Where enquiries go

Every form on the site — wholesale RFQ, contact, catalogue request, retail
checkout — POSTs the same JSON shape to one endpoint: `PUBLIC_FORM_ENDPOINT`.

**If that variable is empty, nothing breaks.** The form composes the enquiry into
an email and a WhatsApp message with every field filled in and hands both to the
buyer. That is a working site with zero setup, and it is what ships by default.

## Choosing an endpoint

| Option | Cost | Setup | Notes |
|---|---|---|---|
| **Web3Forms** | Free tier | 2 min | Email an API key to yourself, paste the endpoint. Simplest possible start. |
| **Formspree** | Free / paid | 5 min | Spam filtering, a dashboard of submissions, file uploads on paid plans. |
| **Netlify Forms** | Included | Deploy | Only if you host on Netlify. Submissions appear in the dashboard. |
| **Your own function** | Hosting cost | 30 min | Full control — write to a sheet, send to WhatsApp Business API, push to a CRM. |

Whichever you pick, set it in `.env`:

```
PUBLIC_FORM_ENDPOINT=https://api.web3forms.com/submit
```

## The payload

```json
{
  "_form": "wholesale",
  "_page": "/products/roll-top-chafing-dish-9l-stainless-steel",
  "name": "…", "company": "…", "email": "…", "phone": "…",
  "country": "…", "buyer_type": "Hotel / resort",
  "category": "chafing-dishes", "quantity": "200 charger plates",
  "required_by": "2027-03", "incoterm": "FOB Nhava Sheva",
  "interests": ["Logo branding / engraving", "Samples first"],
  "message": "…",
  "enquiry_list": "Roll-Top Chafing Dish, 9 L (TRI-CD-101) × 20\n…"
}
```

`enquiry_list` is the buyer's basket, attached automatically. It is the most
useful field on the form — it is a specification, written by the buyer, before
anyone has spoken to them.

Retail orders arrive with `_form: "retail-order"` and carry `items`, `totals` and
`customer` instead.

## Spam

Two measures, both invisible to a real buyer: a hidden field a person never sees,
and a check that the form was not submitted within three seconds of loading.
Together they stop essentially all drive-by bots without putting a CAPTCHA in
front of a hotel purchase manager.

If spam still gets through, add the endpoint's own filtering rather than a
CAPTCHA. A CAPTCHA on a B2B enquiry form costs more in lost enquiries than it
saves in spam.

## Two things worth doing on day one

1. **Send yourself a test enquiry** from the live site, on a phone, and confirm it
   arrives. Then do it again after any deploy that touches the form.
2. **Decide who reads the inbox and how fast they reply.** The site promises one
   working day. That promise is worth keeping or worth changing — it is on every
   form on the site.
