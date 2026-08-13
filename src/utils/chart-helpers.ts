import { formatShortRupee } from './formatters';

export async function createLineChart(canvasId: string, data: any, activeViewMode: string = 'percentiles', chartInstance: any = null): Promise<any> {
	const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
	if (!canvas) return chartInstance;

	if (chartInstance) {
		chartInstance.destroy();
	}

	const ctx = canvas.getContext('2d');
	if (!ctx) return chartInstance;

	const { Chart } = await import('chart.js/auto');

	const labels = data.years ? data.years.map((y: number) => `Year ${y}`) : [];
	const isDark = document.documentElement.classList.contains('dark');

	const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
	const tickTextColor = isDark ? '#a1a1aa' : '#64748b';
	const axisTitleColor = isDark ? '#d4d4d8' : '#475569';
	const expectedLineColor = isDark ? '#f4f4f5' : '#0f172a';
	const bestLineColor = isDark ? '#34d399' : '#059669';
	const worstLineColor = isDark ? '#f87171' : '#dc2626';

	let datasets: any[] = [];

	if (activeViewMode === 'percentiles' && data.p50) {
		datasets = [
			{
				label: 'The Lucky Start (Booming Markets)',
				data: data.p90,
				borderColor: bestLineColor,
				backgroundColor: isDark ? 'rgba(52, 211, 153, 0.04)' : 'rgba(5, 150, 105, 0.04)',
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.3,
				fill: false
			},
			{
				label: 'The Expected Journey',
				data: data.p50,
				borderColor: expectedLineColor,
				backgroundColor: isDark ? 'rgba(244, 244, 245, 0.04)' : 'rgba(15, 23, 42, 0.04)',
				borderWidth: 2.5,
				pointRadius: 0,
				tension: 0.3,
				fill: false
			},
			{
				label: 'The Unlucky Start (Market Crash)',
				data: data.p10,
				borderColor: worstLineColor,
				backgroundColor: isDark ? 'rgba(248, 113, 113, 0.04)' : 'rgba(220, 38, 38, 0.04)',
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.3,
				fill: false
			}
		];
	} else if (data.samplePaths) {
		const pathColors = [
			'#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185',
			'#34d399', '#a3e635', '#facc15', '#fb923c', '#a1a1aa'
		];
		datasets = data.samplePaths.map((path: any, idx: number) => ({
			label: `Simulated Path #${idx + 1}`,
			data: path,
			borderColor: pathColors[idx % pathColors.length],
			borderWidth: 1.25,
			pointRadius: 0,
			tension: 0.3,
			fill: false
		}));
	}
	const timelinePlugin = {
		id: 'retirementTimeline',
		beforeDraw: (chart: any) => {
			if (activeViewMode !== 'percentiles') return;
			const ctx = chart.ctx;
			const xAxis = chart.scales.x;
			const chartArea = chart.chartArea;

			ctx.save();
			const drawLine = (yearIndex: number, color: string, text: string) => {
				if (yearIndex < 0 || yearIndex >= labels.length) return;
				const xPos = xAxis.getPixelForTick(yearIndex);
				
				ctx.beginPath();
				ctx.setLineDash([5, 5]);
				ctx.moveTo(xPos, chartArea.top);
				ctx.lineTo(xPos, chartArea.bottom);
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = color;
				ctx.stroke();

				ctx.fillStyle = color;
				ctx.font = 'bold 10px sans-serif';
				ctx.textAlign = 'left';
				ctx.textBaseline = 'top';
				ctx.fillText(text, xPos + 6, chartArea.top + 6);
			};

			const horizon = labels.length - 1;
			if (data.p10) {
				const depletionIndex = data.p10.findIndex((v: number, i: number) => i > 0 && v <= 0);
				if (depletionIndex > 0 && depletionIndex <= horizon) {
					drawLine(depletionIndex, isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)', 'Danger: Rock-Bottom Depletion');
					const startX = xAxis.getPixelForTick(depletionIndex);
					const endX = xAxis.getPixelForTick(horizon);
					ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(220, 38, 38, 0.05)';
					ctx.fillRect(startX, chartArea.top, endX - startX, chartArea.bottom - chartArea.top);
				}
			}

			drawLine(horizon, isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', 'Expected Lifespan');

			ctx.restore();
		}
	};

	return new Chart(ctx, {
		type: 'line',
		data: {
			labels,
			datasets
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			animation: { duration: 300 },
			interaction: {
				mode: 'index',
				intersect: false,
			},
			plugins: {
				legend: { display: false },
				retirementTimeline: true,
				tooltip: {
					backgroundColor: isDark ? '#000000' : '#0f172a',
					borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#334155',
					borderWidth: 1,
					titleColor: '#f8fafc',
					bodyColor: '#e2e8f0',
					padding: 12,
					displayColors: true,
					callbacks: {
						label: function (context: any) {
							const val = context.raw;
							let formatted = val;
							if (typeof val === 'number') {
								if (val >= 10000000) formatted = `₹ ${(val / 10000000).toFixed(2)} Cr`;
								else if (val >= 100000) formatted = `₹ ${(val / 100000).toFixed(2)} Lakh`;
								else formatted = `₹ ${val.toLocaleString('en-IN')}`;
							}
							return ` ${context.dataset.label}: ${formatted}`;
						}
					}
				}
			},
			scales: {
				x: {
					border: { color: gridColor },
					grid: { display: false },
					ticks: { color: tickTextColor, font: { family: 'Inter', size: 11 } },
					title: { display: true, text: 'Time (Years)', color: axisTitleColor, font: { family: 'Inter', size: 11 } }
				},
				y: {
					border: { color: gridColor },
					grid: { color: gridColor },
					ticks: {
						color: tickTextColor,
						font: { family: 'Inter', size: 11 },
						callback: function (val: any) {
							if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
							if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
							return `₹${val}`;
						}
					},
					title: { display: true, text: 'Value (₹)', color: axisTitleColor, font: { family: 'Inter', size: 11 } }
				}
			}
		},
		plugins: [timelinePlugin]
	});
}

export async function createMicroCashflowChart(canvasId: string, data: any, inputs: any, chartInstance: any = null): Promise<any> {
	const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
	if (!canvas) return chartInstance;

	if (chartInstance) {
		chartInstance.destroy();
	}

	const ctx = canvas.getContext('2d');
	if (!ctx) return chartInstance;

	const { Chart } = await import('chart.js/auto');

	const initialMonthly = inputs.initialMonthly;
	const expectedInflation = inputs.expectedInflation;
	const annualStepUp = inputs.annualStepUp;
	const horizonYears = inputs.horizonYears;
	const escalationFactor = (1 + expectedInflation / 100) * (1 + annualStepUp / 100);

	const labels = ['Yr 0'];
	const actualMonthlyData = data.actualPaycheckTimeline ? [...data.actualPaycheckTimeline] : [initialMonthly];
	const idealMonthlyData = data.idealPaycheckTimeline ? [...data.idealPaycheckTimeline] : [initialMonthly];
	const corpusData = [inputs.initialCorpus];

	if (!data.actualPaycheckTimeline || !data.idealPaycheckTimeline) {
		let currentMonthly = initialMonthly;
		let idealMonthly = initialMonthly;
		for (let yr = 1; yr <= horizonYears; yr++) {
			labels.push(`Yr ${yr}`);
			if (yr > 1) {
				currentMonthly = currentMonthly * escalationFactor;
				idealMonthly = idealMonthly * escalationFactor;
			}
			let grossAnnual = currentMonthly * 12;
			if (data.medianWithdrawals && data.medianWithdrawals[yr] !== undefined) {
				grossAnnual = data.medianWithdrawals[yr];
			}
			const annualTax = (data.medianTaxes && data.medianTaxes[yr] !== undefined) ? data.medianTaxes[yr] : 0;
			const netAnnual = Math.max(0, grossAnnual - annualTax);
			actualMonthlyData.push(grossAnnual > 0 ? Math.round(netAnnual / 12) : 0);
			idealMonthlyData.push(Math.round(idealMonthly));

			const bal = (data.p50 && data.p50[yr] !== undefined) ? data.p50[yr] : 0;
			corpusData.push(bal);
		}
	} else {
		for (let yr = 1; yr <= horizonYears; yr++) {
			labels.push(`Yr ${yr}`);
			const bal = (data.p50 && data.p50[yr] !== undefined) ? data.p50[yr] : 0;
			corpusData.push(bal);
		}
	}

	const isDark = document.documentElement.classList.contains('dark');
	const tickColor = isDark ? '#94a3b8' : '#64748b';

	return new Chart(ctx, {
		type: 'line',
		data: {
			labels,
			datasets: [
				{
					label: 'Actual Income (Realized)',
					data: actualMonthlyData,
					borderColor: isDark ? '#818cf8' : '#4f46e5',
					backgroundColor: 'transparent',
					borderWidth: 2.5,
					borderDash: [],
					pointRadius: 0,
					tension: 0.4,
					yAxisID: 'y'
				},
				{
					label: 'Ideal Income (Target)',
					data: idealMonthlyData,
					borderColor: isDark ? '#fbbf24' : '#d97706',
					backgroundColor: 'transparent',
					borderWidth: 1.5,
					borderDash: [5, 5],
					fill: false,
					pointRadius: 0,
					tension: 0.4,
					yAxisID: 'y'
				},
				{
					label: 'Savings Balance (₹)',
					data: corpusData,
					borderColor: isDark ? '#34d399' : '#059669',
					backgroundColor: 'transparent',
					borderWidth: 2,
					borderDash: [4, 4],
					pointRadius: 0,
					tension: 0.4,
					yAxisID: 'y1'
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			animation: { duration: 300 },
			interaction: { mode: 'index', intersect: false },
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: '#0f172a',
					borderColor: '#334155',
					borderWidth: 1,
					titleColor: '#f8fafc',
					bodyColor: '#e2e8f0',
					padding: 10,
					callbacks: {
						label: function (context: any) {
							const val = context.raw;
							if (context.datasetIndex === 0) {
								return ` Actual Income (Realized): ₹ ${Math.round(val).toLocaleString('en-IN')}`;
							} else if (context.datasetIndex === 1) {
								return ` Ideal Income (Target): ₹ ${Math.round(val).toLocaleString('en-IN')}`;
							} else {
								return ` Balance: ${formatShortRupee(val)}`;
							}
						}
					}
				}
			},
			scales: {
				x: {
					grid: { display: false },
					ticks: { color: tickColor, font: { family: 'Inter', size: 10 }, maxTicksLimit: 8 }
				},
				y: {
					type: 'linear',
					display: true,
					position: 'left',
					grid: { display: false },
					ticks: {
						color: isDark ? '#818cf8' : '#4f46e5',
						font: { family: 'Inter', size: 10 },
						callback: function(val: any) {
							return `₹${Math.round(val / 1000)}k`;
						}
					}
				},
				y1: {
					type: 'linear',
					display: true,
					position: 'right',
					grid: { display: false },
					ticks: {
						color: isDark ? '#34d399' : '#059669',
						font: { family: 'Inter', size: 10 },
						callback: function(val: any) {
							if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
							if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
							return `₹${val}`;
						}
					}
				}
			}
		}
	});
}
