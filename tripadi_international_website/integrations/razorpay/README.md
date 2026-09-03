# Turning on card payments

The shop works today without any of this: a customer places an order and we
send them a secure payment link. That is a legitimate way to run an Indian
e-commerce operation and it costs nothing to set up. Do the following when you
want card, UPI and netbanking taken on the site itself.

## 1. Get a Razorpay account

Sign up at razorpay.com and complete KYC. You will need the GSTIN, the PAN,
a cancelled cheque and the business registration. Approval usually takes two to
three working days.

You end up with two keys:

| Key | Looks like | Where it goes |
|---|---|---|
| Key ID (publishable) | `rzp_live_XXXXXXXX` | `PUBLIC_RAZORPAY_KEY_ID` in `.env` — safe in the browser |
| Key Secret | a long random string | **Only** in your serverless function's environment. Never in `.env`, never in git, never in a message. |

If the secret is ever pasted somewhere it should not be, rotate it in the
Razorpay dashboard immediately. Treat that as the same category of mistake as
losing a bank password.

## 2. Deploy the function

`create-order.js` in this folder is the whole server side.

**Vercel** — copy it to `api/create-order.js` in the deployed project. Set
`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Project Settings → Environment
Variables. Your endpoint is `https://yourdomain.com/api/create-order`.

**Netlify** — copy it to `netlify/functions/create-order.js` and export
`netlifyHandler` as `handler`. Set the same two variables in Site settings →
Environment variables. Your endpoint is `/.netlify/functions/create-order`.

## 3. Point the site at it

In `.env`:

```
PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXX
PUBLIC_ORDER_ENDPOINT=https://yourdomain.com/api/create-order
```

Rebuild. The checkout button changes from "Place order" to "Pay securely" and
opens Razorpay.

## 4. Before you take real money

- **Test with `rzp_test_` keys first.** Razorpay provides test cards; run a full
  order through and confirm it appears in the dashboard.
- **Set up the webhook.** Dashboard → Webhooks → add `payment.captured` pointing
  at an endpoint that calls `verifyPayment()`. The browser callback can be
  forged; the webhook signature cannot. Do not mark an order paid on the
  callback alone.
- **Check the amount is recomputed server-side.** It already is in this file,
  and that is deliberate — without it a customer can edit the price in devtools
  and pay ₹1. Never change that to trust the client total.
- **Confirm the GST rate per HSN code with your accountant** and update
  `retail.gst_rate` in `src/data/company.json`.
- **Publish refund and shipping terms.** Razorpay requires reachable Terms,
  Privacy, Shipping and Refund pages before they activate a live account. All
  four exist on the site.
