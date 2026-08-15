export function calculateNewRegimeTax(grossSalary: number) {
	const stdDed = 75000;
	const taxableIncome = Math.max(0, grossSalary - stdDed);
	let tax = 0;

	if (taxableIncome <= 400000) {
		tax = 0;
	} else if (taxableIncome <= 800000) {
		tax = (taxableIncome - 400000) * 0.05;
	} else if (taxableIncome <= 1200000) {
		tax = (400000 * 0.05) + (taxableIncome - 800000) * 0.10;
	} else if (taxableIncome <= 1600000) {
		tax = (400000 * 0.05) + (400000 * 0.10) + (taxableIncome - 1200000) * 0.15;
	} else if (taxableIncome <= 2000000) {
		tax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (taxableIncome - 1600000) * 0.20;
	} else if (taxableIncome <= 2400000) {
		tax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (400000 * 0.20) + (taxableIncome - 2000000) * 0.25;
	} else {
		tax = (400000 * 0.05) + (400000 * 0.10) + (400000 * 0.15) + (400000 * 0.20) + (400000 * 0.25) + (taxableIncome - 2400000) * 0.30;
	}

	if (taxableIncome <= 1200000) {
		tax = 0;
	}

	const cess = Math.round(tax * 0.04);
	const total = Math.round(tax + cess);
	const effectiveRate = grossSalary > 0 ? ((total / grossSalary) * 100).toFixed(1) : '0.0';

	return { tax, cess, total, effectiveRate };
}

export function calculateOldRegimeTax(grossSalary: number, deductions: number) {
	const stdDed = 50000;
	const taxableIncome = Math.max(0, grossSalary - stdDed - deductions);
	let tax = 0;

	if (taxableIncome <= 250000) {
		tax = 0;
	} else if (taxableIncome <= 500000) {
		tax = (taxableIncome - 250000) * 0.05;
	} else if (taxableIncome <= 1000000) {
		tax = (250000 * 0.05) + (taxableIncome - 500000) * 0.20;
	} else {
		tax = (250000 * 0.05) + (500000 * 0.20) + (taxableIncome - 1000000) * 0.30;
	}

	if (taxableIncome <= 500000) {
		tax = 0; 
	}

	const cess = Math.round(tax * 0.04);
	const total = Math.round(tax + cess);
	const effectiveRate = grossSalary > 0 ? ((total / grossSalary) * 100).toFixed(1) : '0.0';

	return { tax, cess, total, effectiveRate };
}
