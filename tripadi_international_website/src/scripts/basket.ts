/**
 * Two baskets, one mechanism.
 *
 *  - `enquiry` is the trade basket: a buyer collects pieces and sends one RFQ
 *    with quantities. It never shows a total, because the price is the thing
 *    they are writing in to ask about.
 *  - `cart` is the retail basket: one or two pieces, priced, checked out.
 *
 * Both live in localStorage so a buyer can build a list across several visits —
 * a hotel purchase manager rarely finishes a specification in one sitting.
 */
export type BasketKind = 'enquiry' | 'cart';
export interface BasketItem {
  id: string;
  qty: number;
}

const KEYS: Record<BasketKind, string> = {
  enquiry: 'tripadi.enquiry.v1',
  cart: 'tripadi.cart.v1',
};

export function read(kind: BasketKind): BasketItem[] {
  try {
    const raw = localStorage.getItem(KEYS[kind]);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.id === 'string')
      .map((i) => ({ id: i.id, qty: Math.max(1, Number(i.qty) || 1) }));
  } catch {
    // Private browsing, blocked storage, corrupted value. An empty basket is
    // always a safe answer; never let this throw into the page.
    return [];
  }
}

export function write(kind: BasketKind, items: BasketItem[]): void {
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify(items));
  } catch {
    /* storage unavailable — the basket simply does not persist */
  }
  refreshCounts();
  document.dispatchEvent(new CustomEvent('basket:change', { detail: { kind } }));
}

export function add(kind: BasketKind, id: string, qty = 1): void {
  const items = read(kind);
  const existing = items.find((i) => i.id === id);
  if (existing) existing.qty += qty;
  else items.push({ id, qty });
  write(kind, items);
}

export function setQty(kind: BasketKind, id: string, qty: number): void {
  const items = read(kind).map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
  write(kind, items);
}

export function remove(kind: BasketKind, id: string): void {
  write(
    kind,
    read(kind).filter((i) => i.id !== id)
  );
}

export function clear(kind: BasketKind): void {
  write(kind, []);
}

/**
 * The two baskets count differently on purpose.
 *
 *  - The enquiry badge counts LINES. A trade buyer specifying 400 charger
 *    plates does not want to see "400" next to the word Enquiry; they want to
 *    know how many pieces are on their list.
 *  - The bag badge counts UNITS, which is what a shopping bag has always meant.
 */
export function count(kind: BasketKind): number {
  const items = read(kind);
  return kind === 'enquiry' ? items.length : items.reduce((sum, i) => sum + i.qty, 0);
}

/** Header badges. Hidden at zero rather than showing a "0". */
export function refreshCounts(): void {
  (['enquiry', 'cart'] as BasketKind[]).forEach((kind) => {
    const n = count(kind);
    document.querySelectorAll<HTMLElement>(`[data-basket-count="${kind}"]`).forEach((el) => {
      el.textContent = String(n);
      el.classList.toggle('hidden', n === 0);
    });
  });
}

/**
 * Wires every `[data-add-enquiry]` / `[data-add-cart]` button on the page.
 * The button reports back for two seconds so the buyer knows it registered —
 * on a page with no cart drawer, that confirmation is the whole feedback loop.
 */
export function bindAddButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-add-enquiry], [data-add-cart]').forEach((btn) => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const kind: BasketKind = btn.hasAttribute('data-add-cart') ? 'cart' : 'enquiry';
      const id = btn.getAttribute(kind === 'cart' ? 'data-add-cart' : 'data-add-enquiry')!;
      // The quantity box on a product page belongs to the WHOLESALE control and
      // is pre-filled with the MOQ. Reading it for a retail "Add to bag" would
      // put 50 charger plates in a shopper's bag on one click.
      const qtyInput =
        kind === 'enquiry' ? document.querySelector<HTMLInputElement>(`[data-qty-for="${id}"]`) : null;
      const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      add(kind, id, qty);

      const original = btn.dataset.originalLabel ?? btn.innerHTML;
      btn.dataset.originalLabel = original;
      btn.innerHTML = kind === 'cart' ? 'Added to bag' : 'Added to enquiry';
      btn.classList.add('opacity-70');
      window.setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('opacity-70');
      }, 2000);
    });
  });
}

export function init(): void {
  refreshCounts();
  bindAddButtons();
  // Another tab changed the basket.
  window.addEventListener('storage', refreshCounts);
}
