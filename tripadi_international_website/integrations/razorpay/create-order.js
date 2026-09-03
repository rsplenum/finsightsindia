/**
 * Razorpay order creation — deploy as a serverless function.
 *
 * Works as-is on Vercel (`api/create-order.js`) and Netlify
 * (`netlify/functions/create-order.js` with the handler export at the bottom).
 *
 * WHY THIS HAS TO EXIST: Razorpay requires an order to be created server-side
 * with your SECRET key before the browser can open checkout. The secret can
 * never touch the front end. This function is the only place it lives, and it
 * lives there as an environment variable, never in the repository.
 *
 * It also recomputes the amount from the catalogue rather than trusting the
 * number the browser sent. Without that, anyone can edit the price in devtools
 * and pay one rupee for a chafing dish.
 */
import crypto from 'node:crypto';
import products from '../../src/data/products.json' with { type: 'json' };
import company from '../../src/data/company.json' with { type: 'json' };

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const priceOf = (sku) => products.find((p) => p.id === sku)?.retail?.price_inr ?? null;

export async function createOrder(order) {
  if (!KEY_ID || !KEY_SECRET) throw new Error('Razorpay keys are not configured');

  // Recompute from our own data. Never trust a client-supplied total.
  let subtotal = 0;
  for (const item of order.items ?? []) {
    const price = priceOf(item.sku);
    const qty = Math.max(1, Math.floor(Number(item.qty) || 0));
    if (price == null) throw new Error(`Unknown or unpriced SKU: ${item.sku}`);
    subtotal += price * qty;
  }
  if (subtotal <= 0) throw new Error('Empty order');

  const { free_shipping_above_inr, shipping_flat_inr } = company.retail;
  const shipping = subtotal >= free_shipping_above_inr ? 0 : shipping_flat_inr;
  const amountPaise = (subtotal + shipping) * 100;

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: `tri_${Date.now()}`,
      notes: {
        customer: order.customer?.name ?? '',
        email: order.customer?.email ?? '',
        phone: order.customer?.phone ?? '',
      },
    }),
  });

  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  const created = await res.json();
  return { razorpay_order_id: created.id, amount_paise: amountPaise };
}

/**
 * Verify the signature Razorpay sends back after payment. Call this from your
 * webhook (or from a confirmation endpoint) before you treat an order as paid.
 * A payment is not real until this passes — the browser callback alone can be
 * forged.
 */
export function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
}

/** Vercel-style handler. */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const order = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    res.status(200).json(await createOrder(order));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/** Netlify-style handler. */
export const netlifyHandler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    return { statusCode: 200, body: JSON.stringify(await createOrder(JSON.parse(event.body))) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
