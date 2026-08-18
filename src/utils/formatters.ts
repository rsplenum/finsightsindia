import { debounce } from './debounce';

export function parseFormattedNumber(val: string | number | undefined | null): number {
	if (!val) return 0;
	return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

/**
 * Rupees the way a person says them. D-3, answered by Rahul on 16 August:
 *
 *   "the word, not the abbreviation. No space after the symbol. One decimal
 *    above a lakh - Rs 1.28 crore, Rs 89.1 lakh, Rs 59,190."
 *
 * THE RULING WAS RECORDED AND NOT IMPLEMENTED. This function was still printing
 * "Rs 55.86 Lakh" and "Rs 1.28 Cr" - a space after the symbol, a capital on the
 * unit, two decimals where one was asked for, and "Cr", which is the
 * trading-desk abbreviation D-3 exists to remove. It is the terminal aesthetic
 * the whole rebuild is walking away from, surviving in the one place every page
 * passes through.
 *
 * The three worked examples in the ruling are reproduced exactly: two decimals
 * at crore, one at lakh, whole grouped rupees below. That is the reading that
 * satisfies all three of the figures he wrote down; "one decimal above a lakh"
 * read literally would have given Rs 1.3 crore, which is not the example he gave.
 *
 * `rupeeConvention.test.ts` holds it, because a convention with no detector is
 * one that drifts back (dd-011/do-1).
 */
export function formatShortRupee(val: number): string {
	const absVal = Math.abs(val);
	// The sign belongs outside the symbol: "-₹11.08 lakh", never "₹-11.08 lakh".
	const sign = val < 0 ? '-' : '';
	if (absVal >= 10000000) return `${sign}₹${(absVal / 10000000).toFixed(2)} crore`;
	if (absVal >= 100000) return `${sign}₹${(absVal / 100000).toFixed(1)} lakh`;
	// Whole rupees below a lakh. Above it the figure is already rounded to a
	// decimal or two of its unit, so only this branch could ever leak paise - and
	// it did, printing "₹ 59,189.846" on the insurance page the first time a
	// computed rather than typed figure reached it.
	return `${sign}₹${Math.round(absVal).toLocaleString('en-IN')}`;
}

export const tableFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0
});

/**
 * Group a money field's digits, and recompute when the reader is done with it.
 *
 * `live` makes it recompute WHILE they type, debounced. It is opt-in and must
 * stay that way: most callers of this sit on pages where one recompute is a
 * 10,000-path Monte Carlo run, and firing that per keystroke would be a serious
 * regression. Only surfaces whose recompute is cheap - the insurance analyser
 * walks thirty deterministic years - should ask for it.
 *
 * It exists because a form should not have two behaviours. On the analyser the
 * numeric fields (term, start year, inflation) updated as you typed while the
 * money fields sat still until you clicked away, so half the form looked broken
 * and the other half did not.
 */
export function setupFormattingField(
	inputEl: HTMLInputElement | null,
	callback?: () => void,
	options: { live?: boolean; delayMs?: number } = {}
): void {
	if (!inputEl) return;

	inputEl.addEventListener('blur', function (e) {
        const target = e.target as HTMLInputElement;
		const raw = parseFormattedNumber(target.value);
		if (raw > 0) target.value = raw.toLocaleString('en-IN');
		if (callback) callback();
	});

	inputEl.addEventListener('focus', function (e) {
        const target = e.target as HTMLInputElement;
		const raw = parseFormattedNumber(target.value);
		if (raw > 0) target.value = String(raw);
	});

	if (options.live && callback) {
		// Not re-grouped mid-typing: rewriting the value under the cursor moves
		// the caret and fights the reader. The digits are grouped on blur, as
		// before; only the RESULT keeps up.
		const run = debounce(callback, options.delayMs ?? 250);
		inputEl.addEventListener('input', run);
	}
}

export function formatIndianRupeeLabel(val: number): string {
	if (isNaN(val) || val <= 0) return '₹ 0';
	const absVal = Math.abs(val);
	if (absVal >= 10000000) {
		return `₹ ${(val / 10000000).toFixed(2)} Cr (${val.toLocaleString('en-IN')})`;
	} else if (absVal >= 100000) {
		return `₹ ${(val / 100000).toFixed(2)} Lakh (${val.toLocaleString('en-IN')})`;
	}
	return `₹ ${val.toLocaleString('en-IN')}`;
}
