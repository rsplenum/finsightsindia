export function parseFormattedNumber(val) {
	if (!val) return 0;
	return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

export function formatShortRupee(val) {
	const absVal = Math.abs(val);
	if (absVal >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
	if (absVal >= 100000) return `₹ ${(val / 100000).toFixed(2)} Lakh`;
	return `₹ ${val.toLocaleString('en-IN')}`;
}

export const tableFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0
});

export function setupFormattingField(inputEl, callback) {
	if (!inputEl) return;
	
	inputEl.addEventListener('blur', function (e) {
		const raw = parseFormattedNumber(e.target.value);
		if (raw > 0) e.target.value = raw.toLocaleString('en-IN');
		if (callback) callback();
	});
	
	inputEl.addEventListener('focus', function (e) {
		const raw = parseFormattedNumber(e.target.value);
		if (raw > 0) e.target.value = String(raw);
	});
}

export function formatIndianRupeeLabel(val) {
	if (isNaN(val) || val <= 0) return '₹ 0';
	const absVal = Math.abs(val);
	if (absVal >= 10000000) {
		return `₹ ${(val / 10000000).toFixed(2)} Cr (${val.toLocaleString('en-IN')})`;
	} else if (absVal >= 100000) {
		return `₹ ${(val / 100000).toFixed(2)} Lakh (${val.toLocaleString('en-IN')})`;
	}
	return `₹ ${val.toLocaleString('en-IN')}`;
}
