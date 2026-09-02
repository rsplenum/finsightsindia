import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';

interface ChartMilestoneData {
  year: number;
  label: string;
  optimisticCorpus: number;
  projectedCorpus: number;
  pessimisticCorpus: number;
  targetCorpus: number;
  surplusDeficit: number;
  p10: number;
  p50: number;
  p90: number;
}

export default function CorpusGrowthVsTargetChart() {
  const [data, setData] = useState<ChartMilestoneData[]>([]);
  const [displayMode, setDisplayMode] = useState<'nominal' | 'real'>('real');
  const [intervalStep, setIntervalStep] = useState<5 | 1>(5);
  const [scenarioMode, setScenarioMode] = useState<'all' | 'base_target' | 'pessimistic_focus' | 'optimistic_focus'>('all');
  const [visibleSeries, setVisibleSeries] = useState<{
    optimistic: boolean;
    base: boolean;
    pessimistic: boolean;
    target: boolean;
  }>({
    optimistic: true,
    base: true,
    pessimistic: true,
    target: true,
  });

  const [inputsSummary, setInputsSummary] = useState<{
    corpus: number;
    withdrawal: number;
    inflation: number;
    horizon: number;
    expectedReturn: number;
    survival: number;
  }>({
    corpus: 10000000,
    withdrawal: 40000,
    inflation: 6,
    horizon: 30,
    expectedReturn: 12,
    survival: 95,
  });

  const formatRupee = (val: number): string => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)} L`;
    return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
  };

  const recomputeChartData = (detail: any) => {
    if (!detail) return;
    const inputs = detail.inputs || {};
    const sim = detail.simulation || {};
    const outlook = detail.outlook || {};

    const initialCorpus = Number(inputs.initialCorpus) || 10000000;
    const monthly = Number(inputs.monthlyWithdrawal) || 40000;
    const inflation = Number(inputs.expectedInflation) || 6;
    const expectedReturn = Number(inputs.expectedReturn) || 12;
    const horizon = Number(inputs.horizonYears) || 30;
    const survival = outlook.survival !== undefined ? Math.round(outlook.survival * 100) : 95;

    setInputsSummary({
      corpus: initialCorpus,
      withdrawal: monthly,
      inflation,
      horizon,
      expectedReturn,
      survival,
    });

    const p50Arr: number[] = sim.p50 || [];
    const p10Arr: number[] = sim.p10 || [];
    const p90Arr: number[] = sim.p90 || [];

    const result: ChartMilestoneData[] = [];
    const infRate = inflation / 100;

    // Generate intervals
    const yearsToPick: number[] = [];
    if (intervalStep === 5) {
      for (let y = 5; y <= horizon; y += 5) {
        yearsToPick.push(y);
      }
      if (horizon % 5 !== 0 && !yearsToPick.includes(horizon)) {
        yearsToPick.push(horizon);
      }
    } else {
      for (let y = 1; y <= horizon; y++) {
        yearsToPick.push(y);
      }
    }

    // Build comparison per milestone
    for (const yr of yearsToPick) {
      const deflator = Math.pow(1 + infRate, yr);
      
      // Target: Capital needed to preserve purchasing power of initial corpus
      const rawTargetNominal = initialCorpus * deflator;
      const targetVal = displayMode === 'real' ? initialCorpus : rawTargetNominal;

      // Projected median, pessimistic (10th percentile adverse), optimistic (90th percentile bull)
      const rawP50 = p50Arr[yr] !== undefined ? p50Arr[yr] : 0;
      const rawP10 = p10Arr[yr] !== undefined ? p10Arr[yr] : 0;
      const rawP90 = p90Arr[yr] !== undefined ? p90Arr[yr] : 0;

      const p50Val = displayMode === 'real' ? rawP50 / deflator : rawP50;
      const p10Val = displayMode === 'real' ? rawP10 / deflator : rawP10;
      const p90Val = displayMode === 'real' ? rawP90 / deflator : rawP90;

      result.push({
        year: yr,
        label: `Yr ${yr}`,
        optimisticCorpus: Math.round(Math.max(0, p90Val)),
        projectedCorpus: Math.round(Math.max(0, p50Val)),
        pessimisticCorpus: Math.round(Math.max(0, p10Val)),
        targetCorpus: Math.round(targetVal),
        surplusDeficit: Math.round(p50Val - targetVal),
        p10: Math.round(Math.max(0, p10Val)),
        p50: Math.round(Math.max(0, p50Val)),
        p90: Math.round(Math.max(0, p90Val)),
      });
    }

    setData(result);
  };

  useEffect(() => {
    const handleResult = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        recomputeChartData(customEvent.detail);
      }
    };

    window.addEventListener('swp:result', handleResult);

    // Initial load from DOM inputs if available
    try {
      const initCorpusEl = document.getElementById('initialCorpus') as HTMLInputElement | null;
      const initMonthlyEl = document.getElementById('monthlyWithdrawal') as HTMLInputElement | null;
      const initInflationEl = document.getElementById('expectedInflation') as HTMLInputElement | null;
      const initReturnEl = document.getElementById('expectedReturn') as HTMLInputElement | null;
      const initYearsEl = document.getElementById('horizonYears') as HTMLInputElement | null;

      if (initCorpusEl && initMonthlyEl) {
        const corpus = parseFloat(initCorpusEl.value.replace(/,/g, '')) || 10000000;
        const monthly = parseFloat(initMonthlyEl.value.replace(/,/g, '')) || 40000;
        const inflation = parseFloat(initInflationEl?.value || '6') || 6;
        const expRet = parseFloat(initReturnEl?.value || '12') || 12;
        const horizon = parseInt(initYearsEl?.value || '30', 10) || 30;

        const mockP50: number[] = [corpus];
        const mockP10: number[] = [corpus];
        const mockP90: number[] = [corpus];

        let curr50 = corpus;
        let curr10 = corpus;
        let curr90 = corpus;

        for (let i = 1; i <= horizon; i++) {
          curr50 = (curr50 - monthly * 12) * (1 + (expRet - 5) / 100);
          curr10 = (curr10 - monthly * 12) * (1 + (expRet - 11) / 100);
          curr90 = (curr90 - monthly * 12) * (1 + (expRet + 3) / 100);
          mockP50.push(Math.max(0, curr50));
          mockP10.push(Math.max(0, curr10));
          mockP90.push(Math.max(0, curr90));
        }

        recomputeChartData({
          inputs: {
            initialCorpus: corpus,
            monthlyWithdrawal: monthly,
            expectedInflation: inflation,
            expectedReturn: expRet,
            horizonYears: horizon,
          },
          simulation: { p50: mockP50, p10: mockP10, p90: mockP90 },
          outlook: { survival: 0.95 },
        });
      }
    } catch {
      // safe fallback
    }

    return () => {
      window.removeEventListener('swp:result', handleResult);
    };
  }, [displayMode, intervalStep]);

  const toggleScenario = (mode: 'all' | 'base_target' | 'pessimistic_focus' | 'optimistic_focus') => {
    setScenarioMode(mode);
    if (mode === 'all') {
      setVisibleSeries({ optimistic: true, base: true, pessimistic: true, target: true });
    } else if (mode === 'base_target') {
      setVisibleSeries({ optimistic: false, base: true, pessimistic: false, target: true });
    } else if (mode === 'pessimistic_focus') {
      setVisibleSeries({ optimistic: false, base: true, pessimistic: true, target: true });
    } else if (mode === 'optimistic_focus') {
      setVisibleSeries({ optimistic: true, base: true, pessimistic: false, target: true });
    }
  };

  const toggleSingleSeries = (key: 'optimistic' | 'base' | 'pessimistic' | 'target') => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pData: ChartMilestoneData = payload[0]?.payload;
      if (!pData) return null;

      const isSurplus = pData.surplusDeficit >= 0;

      return (
        <div className="p-3 bg-navy-950/95 border border-navy-700 text-white rounded-xl shadow-xl text-xs space-y-2 backdrop-blur-md min-w-[240px]">
          <div className="font-bold border-b border-navy-800 pb-1 text-gold-400 flex items-center justify-between">
            <span>{pData.label} (Year {pData.year})</span>
            <span className="text-navy-400 font-mono text-xs">{displayMode === 'real' ? "Real ₹" : "Nominal ₹"}</span>
          </div>

          <div className="space-y-1">
            {visibleSeries.optimistic && (
              <div className="flex items-center justify-between gap-3 text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Optimistic (90th %ile):</span>
                </span>
                <span className="font-bold font-mono">{formatRupee(pData.optimisticCorpus)}</span>
              </div>
            )}

            {visibleSeries.base && (
              <div className="flex items-center justify-between gap-3 text-blue-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Base Plan (Median 50th):</span>
                </span>
                <span className="font-bold font-mono">{formatRupee(pData.projectedCorpus)}</span>
              </div>
            )}

            {visibleSeries.pessimistic && (
              <div className="flex items-center justify-between gap-3 text-rose-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Pessimistic (10th %ile):</span>
                </span>
                <span className="font-bold font-mono">{formatRupee(pData.pessimisticCorpus)}</span>
              </div>
            )}

            {visibleSeries.target && (
              <div className="flex items-center justify-between gap-3 text-amber-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Inflation Benchmark:</span>
                </span>
                <span className="font-bold font-mono">{formatRupee(pData.targetCorpus)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-navy-800 font-semibold">
            <span className={isSurplus ? 'text-emerald-300' : 'text-rose-400'}>
              {isSurplus ? 'Base Surplus vs Target:' : 'Base Deficit vs Target:'}
            </span>
            <span className={`font-mono ${isSurplus ? 'text-emerald-300' : 'text-rose-400'}`}>
              {formatRupee(pData.surplusDeficit)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Header & What-If Scenario Toggles */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-navy-950 border border-navy-200 dark:border-navy-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-navy-900 dark:text-white block">
              What-If Scenario Stress Testing
            </span>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Compare your baseline retirement projection against adverse bear crashes and bull expansions.
            </p>
          </div>

          {/* Quick Scenario Preset Pills */}
          <div className="inline-flex rounded-lg border border-navy-200 dark:border-navy-800 p-0.5 bg-navy-50 dark:bg-navy-900">
            <button
              type="button"
              onClick={() => toggleScenario('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                scenarioMode === 'all'
                  ? 'bg-gold-500 text-navy-950 shadow-xs'
                  : 'text-navy-600 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              All Scenarios
            </button>
            <button
              type="button"
              onClick={() => toggleScenario('pessimistic_focus')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                scenarioMode === 'pessimistic_focus'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-navy-600 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              Bear Stress (-10th %ile)
            </button>
            <button
              type="button"
              onClick={() => toggleScenario('optimistic_focus')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                scenarioMode === 'optimistic_focus'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-navy-600 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              Bull Rally (+90th %ile)
            </button>
            <button
              type="button"
              onClick={() => toggleScenario('base_target')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                scenarioMode === 'base_target'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-navy-600 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              Base Plan Only
            </button>
          </div>
        </div>

        {/* Series Legend & Interactive Filter Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-navy-100 dark:border-navy-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSingleSeries('optimistic')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all ${
                visibleSeries.optimistic
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-navy-200 dark:border-navy-800 text-navy-400 line-through opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
              <span>Optimistic (90th %ile)</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSingleSeries('base')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all ${
                visibleSeries.base
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'border-navy-200 dark:border-navy-800 text-navy-400 line-through opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
              <span>Current Plan (Median 50th)</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSingleSeries('pessimistic')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all ${
                visibleSeries.pessimistic
                  ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  : 'border-navy-200 dark:border-navy-800 text-navy-400 line-through opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span>
              <span>Pessimistic (10th %ile Adverse)</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSingleSeries('target')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all ${
                visibleSeries.target
                  ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'border-navy-200 dark:border-navy-800 text-navy-400 line-through opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-600"></span>
              <span>Inflation Preservation Target</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Interval Toggle */}
            <div className="inline-flex rounded-lg border border-navy-200 dark:border-navy-800 p-0.5 bg-navy-100/60 dark:bg-navy-900/60">
              <button
                type="button"
                onClick={() => setIntervalStep(5)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  intervalStep === 5
                    ? 'bg-white dark:bg-navy-800 text-navy-950 dark:text-white shadow-xs font-semibold'
                    : 'text-navy-600 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                5-Yr Steps
              </button>
              <button
                type="button"
                onClick={() => setIntervalStep(1)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  intervalStep === 1
                    ? 'bg-white dark:bg-navy-800 text-navy-950 dark:text-white shadow-xs font-semibold'
                    : 'text-navy-600 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                Annual
              </button>
            </div>

            {/* Real vs Nominal Toggle */}
            <button
              type="button"
              onClick={() => setDisplayMode(displayMode === 'real' ? 'nominal' : 'real')}
              className="px-2.5 py-1 rounded-md border text-xs font-semibold border-navy-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-800 dark:text-navy-200 hover:border-gold-500 transition-colors"
            >
              {displayMode === 'real' ? "Today's Purchasing Power (Real)" : 'Statement Value (Nominal)'}
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Multi-Series Bar Chart */}
      <div className="w-full h-80 sm:h-96 rounded-xl bg-navy-50/70 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 p-3 pt-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
              barGap={3}
              barCategoryGap="18%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#94a3b8"
                strokeOpacity={0.25}
              />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                dy={6}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => formatRupee(v)}
                width={72}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />

              {visibleSeries.optimistic && (
                <Bar
                  dataKey="optimisticCorpus"
                  name="Optimistic (90th %ile)"
                  fill="#059669"
                  radius={[3, 3, 0, 0]}
                  opacity={0.9}
                />
              )}

              {visibleSeries.base && (
                <Bar
                  dataKey="projectedCorpus"
                  name="Base Plan (Median 50th)"
                  fill="#2563eb"
                  radius={[3, 3, 0, 0]}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-proj-${index}`}
                      fill={entry.projectedCorpus <= 0 ? '#ef4444' : '#2563eb'}
                    />
                  ))}
                </Bar>
              )}

              {visibleSeries.pessimistic && (
                <Bar
                  dataKey="pessimisticCorpus"
                  name="Pessimistic (10th %ile)"
                  fill="#e11d48"
                  radius={[3, 3, 0, 0]}
                  opacity={0.9}
                />
              )}

              {visibleSeries.target && (
                <Bar
                  dataKey="targetCorpus"
                  name="Inflation Benchmark"
                  fill="#d97706"
                  radius={[3, 3, 0, 0]}
                  opacity={0.8}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-navy-400">
            Loading Monte Carlo what-if scenarios…
          </div>
        )}
      </div>

      {/* Scenario Guidance Banner */}
      <div className="p-3.5 rounded-xl bg-navy-100/60 dark:bg-navy-900/60 border border-navy-200/80 dark:border-navy-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-navy-900 dark:text-white block">
            What-If Scenario Key Findings:
          </span>
          <span className="text-navy-700 dark:text-navy-300">
            Under adverse timing (10th %ile bear sequence), your portfolio {data[data.length - 1]?.pessimisticCorpus > 0 ? `preserves ${formatRupee(data[data.length - 1]?.pessimisticCorpus)} at Year ${inputsSummary.horizon}` : `risks premature depletion before Year ${inputsSummary.horizon}`}. In an expanding market (90th %ile bull), compounding expands your wealth to {formatRupee(data[data.length - 1]?.optimisticCorpus || 0)}.
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-white dark:bg-navy-800 border border-navy-300 dark:border-navy-700 font-semibold text-navy-800 dark:text-navy-200">
            {inputsSummary.survival}% Survival Rate
          </span>
        </div>
      </div>
    </div>
  );
}
