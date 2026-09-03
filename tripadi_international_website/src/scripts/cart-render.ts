/**
 * Shared cart rendering for the bag and the checkout summary.
 *
 * Money is handled in whole rupees throughout — every price in the catalogue is
 * a whole rupee figure, and introducing paise would mean rounding decisions the
 * gateway would then disagree with.
 */
export interface Entry { name: string; slug: string; moq: number; price: number | null; image: string }
export interface Totals { subtotal: number; shipping: number; total: number; count: number }

export function productIndex(): Record<string, Entry> {
  try {
    return JSON.parse(document.getElementById('product-index')?.textContent || '{}');
  } catch {
    return {};
  }
}

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

export function computeTotals(
  items: { id: string; qty: number }[],
  products: Record<string, Entry>,
  freeAbove: number,
  flatShipping: number
): Totals {
  const subtotal = items.reduce((sum, i) => sum + (products[i.id]?.price ?? 0) * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= freeAbove ? 0 : flatShipping;
  return { subtotal, shipping, total: subtotal + shipping, count };
}

interface Api {
  read: (kind: 'cart') => { id: string; qty: number }[];
  setQty: (kind: 'cart', id: string, qty: number) => void;
  remove: (kind: 'cart', id: string) => void;
}

export function renderCart(root: HTMLElement | null, api: Api): void {
  if (!root) return;
  const products = productIndex();
  const freeAbove = Number(root.dataset.freeAbove || 0);
  const flat = Number(root.dataset.shipping || 0);

  const list = root.querySelector<HTMLElement>('[data-list]');
  const empty = root.querySelector<HTMLElement>('[data-empty]');
  const summary = root.querySelector<HTMLElement>('[data-summary]');

  function paint() {
    const items = api.read('cart');
    const t = computeTotals(items, products, freeAbove, flat);

    empty?.classList.toggle('hidden', items.length > 0);
    list?.classList.toggle('hidden', items.length === 0);
    summary?.classList.toggle('hidden', items.length === 0);

    if (list) {
      list.innerHTML = items
        .map((item) => {
          const p = products[item.id];
          const line = (p?.price ?? 0) * item.qty;
          return `
            <li class="flex flex-wrap items-center gap-4 py-5">
              <div class="min-w-0 flex-1">
                <a href="/products/${p?.slug ?? ''}" class="text-[15px] font-medium text-ink-900 hover:text-brass-600">${p?.name ?? item.id}</a>
                <p class="mt-1 text-[12px] text-ink-500">${p?.price ? inr(p.price) + ' each' : 'Price on request'}</p>
              </div>
              <input type="number" min="1" value="${item.qty}" data-qty="${item.id}" aria-label="Quantity"
                class="w-20 rounded-lg border border-ink-300 px-3 py-2 text-[14px] text-ink-900 outline-none focus:border-brass-500" />
              <span class="w-24 text-right text-[14px] font-medium text-ink-900">${inr(line)}</span>
              <button type="button" data-remove="${item.id}" class="text-[13px] text-ink-500 underline hover:text-ink-900">Remove</button>
            </li>`;
        })
        .join('');

      list.querySelectorAll<HTMLInputElement>('[data-qty]').forEach((input) => {
        input.addEventListener('change', () => {
          api.setQty('cart', input.dataset.qty!, parseInt(input.value, 10) || 1);
          paint();
        });
      });
      list.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((btn) => {
        btn.addEventListener('click', () => {
          api.remove('cart', btn.dataset.remove!);
          paint();
        });
      });
    }

    const set = (sel: string, value: string) => {
      const el = root!.querySelector<HTMLElement>(sel);
      if (el) el.textContent = value;
    };
    set('[data-subtotal]', inr(t.subtotal));
    set('[data-shipping-line]', t.shipping === 0 ? 'Free' : inr(t.shipping));
    set('[data-total]', inr(t.total));

    root!.dispatchEvent(new CustomEvent('cart:totals', { detail: t, bubbles: true }));
  }

  paint();
}
