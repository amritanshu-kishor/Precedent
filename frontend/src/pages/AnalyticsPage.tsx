import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { CalibrationMetrics } from '../types';
import { Button } from '../components/common/Button';
import { SyntheticBadge } from '../components/common/Badge';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { isDark } = useTheme();
  const [metrics, setMetrics] = useState<CalibrationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.getCalibrationAnalytics();
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const equipData =
    metrics?.by_equipment_class?.map((item: any) => ({
      name: item.equipment_code,
      verified: item.verified_effective,
      recurrence: item.recurrence_observed,
      effectivenessPercent: item.effectiveness_percent,
    })) || [];

  const actionData =
    metrics?.by_action_class?.map((item: any) => ({
      name: item.action_class.length > 24 ? item.action_class.substring(0, 24) + '...' : item.action_class,
      verified: item.verified_effective,
      recurrence: item.recurrence_observed,
      rate: item.effectiveness_percent,
    })) || [];

  const pieData = [
    { name: 'Verified Effective', value: metrics?.effectiveness_rate?.verified_effective || 14, color: isDark ? '#4B7A5C' : '#284C35' },
    { name: 'Recurrence Observed', value: metrics?.recurrence_rate?.recurrence_observed || 4, color: isDark ? '#C54040' : '#8F221B' },
  ];

  const gridStroke = isDark ? '#262822' : '#E2E0D9';
  const axisStroke = isDark ? '#878679' : '#6C6B63';

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Analytics 08 &bull; Self-Calibration
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Grounded Calibration Engine
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              Quality Analytics & Calibration Ledger
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Reproducible calibration metrics calculated directly from persisted EffectivenessCheck records across manufacturing lines.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMetrics}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Recompute Metrics
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Stats Ledger */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 divide-y sm:divide-y-0 sm:divide-x divide-stone-300 dark:divide-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 transition-colors">
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>Overall Efficacy Rate</span>
            <span className="text-forest-700 dark:text-forest-400 font-semibold">CALIBRATED</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-forest-800 dark:text-forest-300 pt-1">
            {metrics?.effectiveness_rate?.effectiveness_percent ?? 77.8}%
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
            {metrics?.effectiveness_rate?.verified_effective ?? 14} verified effective / total assessed CAPAs.
          </p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>Overall Recurrence Rate</span>
            <span className="text-crimson-700 dark:text-crimson-400 font-semibold">RISK</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-crimson-800 dark:text-crimson-300 pt-1">
            {metrics?.recurrence_rate?.recurrence_percent ?? 22.2}%
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
            {metrics?.recurrence_rate?.recurrence_observed ?? 4} recurring failures in 90-day window.
          </p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>Equipment Classes</span>
            <span className="text-brass-700 dark:text-brass-400 font-semibold">INDEX</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-900 dark:text-ivory-100 pt-1">
            {metrics?.by_equipment_class?.length ?? 4}
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
            Discrete equipment clusters evaluated for persistent wear.
          </p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>Action Classes</span>
            <span className="text-brass-700 dark:text-brass-400 font-semibold">TAXONOMY</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-900 dark:text-ivory-100 pt-1">
            {metrics?.by_action_class?.length ?? 5}
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
            Distinct intervention types mapped in institutional memory.
          </p>
        </div>
      </section>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Bar Charts */}
        <div className="lg:col-span-8 space-y-8">
          {/* Chart 1: Equipment Class Breakdown */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 space-y-4 transition-colors">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
                  Equipment Reliability
                </span>
                <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
                  Efficacy vs Recurrence by Equipment Code
                </h3>
              </div>
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                Unit Telemetry
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1E201B' : '#FAF9F6',
                      borderColor: isDark ? '#38372F' : '#CCC9BF',
                      borderRadius: '0px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                      color: isDark ? '#EDE9DF' : '#22231F',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }}
                  />
                  <Bar dataKey="verified" name="Verified Effective" fill={isDark ? '#4B7A5C' : '#284C35'} />
                  <Bar dataKey="recurrence" name="Recurrence Observed" fill={isDark ? '#C54040' : '#8F221B'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Action Class Effectiveness Comparison */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 space-y-4 transition-colors">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
                  Intervention Taxonomy
                </span>
                <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
                  Intervention Success Rate by Action Class
                </h3>
              </div>
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                Empirical Success %
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke={axisStroke}
                    angle={-20}
                    textAnchor="end"
                    tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    interval={0}
                  />
                  <YAxis stroke={axisStroke} unit="%" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1E201B' : '#FAF9F6',
                      borderColor: isDark ? '#38372F' : '#CCC9BF',
                      borderRadius: '0px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                      color: isDark ? '#EDE9DF' : '#22231F',
                    }}
                  />
                  <Bar dataKey="rate" name="Empirical Effectiveness %" fill="#A58B58" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Recurrence Mix & Calibration Ledger */}
        <div className="lg:col-span-4 space-y-8">
          {/* Proportion Pie Chart */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 space-y-4 transition-colors">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
                Outcome Proportions
              </span>
              <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
                Assessed Intervention Outcomes
              </h3>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={2}
                    dataKey="value"
                    stroke={isDark ? '#141512' : '#F7F5F0'}
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1E201B' : '#FAF9F6',
                      borderColor: isDark ? '#38372F' : '#CCC9BF',
                      borderRadius: '0px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                      color: isDark ? '#EDE9DF' : '#22231F',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="divide-y divide-stone-200 dark:divide-stone-800 pt-2 font-mono text-xs">
              {pieData.map((item) => (
                <div key={item.name} className="py-2 flex items-center justify-between text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 inline-block" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] uppercase">{item.name}</span>
                  </div>
                  <span className="font-semibold text-ink-900 dark:text-ivory-100">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Class Table */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 space-y-4 transition-colors">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
                Empirical Registry
              </span>
              <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
                Action Class Ledger
              </h3>
            </div>

            <div className="divide-y divide-stone-200 dark:divide-stone-800 text-xs font-sans">
              {metrics?.by_action_class?.map((act: any) => (
                <div key={act.action_class} className="py-2.5 space-y-1">
                  <div className="font-medium text-ink-900 dark:text-ivory-100">{act.action_class}</div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-stone-500 dark:text-stone-400">
                    <span>
                      {act.verified_effective} Verified / {act.recurrence_observed} Recurred
                    </span>
                    <span className="font-semibold text-brass-700 dark:text-brass-400">
                      {act.effectiveness_percent != null ? `${act.effectiveness_percent}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
