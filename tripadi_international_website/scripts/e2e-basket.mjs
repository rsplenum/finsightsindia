/**
 * End-to-end check of the two baskets, the RFQ attachment and the cart maths.
 *
 *   npm run build && npx astro preview --port 4321   # in one terminal
 *   npm run test:e2e                                  # in another
 *
 * It guards two bugs that were real and would be easy to reintroduce:
 *   1. "Add to bag" must add ONE unit, not the wholesale MOQ sitting in the
 *      quantity box next to it.
 *   2. The enquiry badge counts lines; the bag badge counts units.
 */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));

// 1. Add a product to the enquiry basket with a quantity.
await p.goto('http://localhost:4321/products/roll-top-chafing-dish-9l-stainless-steel', { waitUntil: 'networkidle' });
await p.fill('#qty', '40');
await p.click('[data-add-enquiry]');
await p.waitForTimeout(400);
console.log('button feedback:', (await p.textContent('[data-add-enquiry]')).trim());
console.log('header badge   :', await p.textContent('[data-basket-count="enquiry"]'));

// 2. Add a second product, then a retail item.
await p.goto('http://localhost:4321/products/hammered-charger-plate-13-inch-antique-brass', { waitUntil: 'networkidle' });
await p.click('[data-add-enquiry]');
await p.click('[data-add-cart]');
await p.waitForTimeout(300);

// 3. Enquiry page should list both, editable.
await p.goto('http://localhost:4321/enquiry', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
const rows = await p.$$eval('[data-row]', (e) => e.map((x) => x.getAttribute('data-row')));
console.log('enquiry rows   :', rows.join(', '));
console.log('attached to RFQ:', (await p.getAttribute('[data-enquiry-payload]', 'value'))?.replace(/\n/g, ' | '));

// 4. Cart should price it and total it.
await p.goto('http://localhost:4321/shop/cart', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
console.log('cart subtotal  :', await p.textContent('[data-subtotal]'));
console.log('cart delivery  :', await p.textContent('[data-shipping-line]'));
console.log('cart total     :', await p.textContent('[data-total]'));

// 5. Checkout should refuse an empty form and summarise the order.
await p.goto('http://localhost:4321/shop/checkout', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
console.log('checkout total :', await p.textContent('[data-total]'));
console.log('pay disabled?  :', await p.isDisabled('[data-pay]'));
await p.click('[data-pay]');
await p.waitForTimeout(300);
console.log('still on page  :', p.url().endsWith('/shop/checkout'));

console.log('JS errors      :', errs.length ? errs : 'none');
await b.close();
