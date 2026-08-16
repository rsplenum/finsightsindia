export function parseFormattedNumber(val: string | number | undefined | null): number {
	if (!val) return 0;
	return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

export function formatShortRupee(val: number): string {
	const absVal = Math.abs(val);
	if (absVal >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
	if (absVal >= 100000) return `₹ ${(val / 100000).toFixed(2)} Lakh`;
	// Whole rupees below a lakh. Above it the figure is already rounded to two
	// decimals of its unit, so only this branch could ever leak paise - and it
	// did, printing "₹ 59,189.846" on the insurance page the first time a
	// computed rather than typed figure reached it.
	return `₹ ${Math.round(val).toLocaleString('en-IN')}`;
}

export const tableFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0
});

export function setupFormattingField(inputEl: HTMLInputElement | null, callback?: () => void): void {
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
