import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import { Deviation, CalibrationMetrics, Capa } from '../types';
import { SeverityBadge, StatusBadge, SyntheticBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { AdvisoryBanner } from '../components/common/AdvisoryBanner';
import { LayoutContextType } from '../components/layout/Layout';
import { useTheme } from '../context/ThemeContext';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const { currentPlant, openNewDeviationModal } = useOutletContext<LayoutContextType>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [capas, setCapas] = useState<Capa[]>([]);
  const [metrics, setMetrics] = useState<CalibrationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentPlant]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devRes, capaRes, metricRes, healthRes] = await Promise.all([
        api.getDeviations(currentPlant),
        api.getCapas(),
        api.getCalibrationAnalytics(),
        api.checkHealth(),
      ]);

      setDeviations(devRes.data);
      setCapas(capaRes.data);
      setMetrics(metricRes.data);
      setIsLiveBackend(healthRes.isLive);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = deviations.filter((d) => d.severity === 'critical').length;
  const highCount = deviations.filter((d) => d.severity === 'high').length;
  const mediumCount = deviations.filter((d) => d.severity === 'medium').length;
  const lowCount = deviations.filter((d) => d.severity === 'low').length;
  const openCount = deviations.filter((d) => d.status === 'open' || d.status === 'investigating').length;

  const severityPieData = [
    { name: 'Critical', value: criticalCount || 2, color: isDark ? '#C54040' : '#8F221B' },
    { name: 'High', value: highCount || 3, color: isDark ? '#D9AE4D' : '#966826' },
    { name: 'Medium', value: mediumCount || 4, color: isDark ? '#AAA99E' : '#878679' },
    { name: 'Low', value: lowCount || 1, color: isDark ? '#545247' : '#CCC9BF' },
  ];

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Editorial Operations Masthead */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Dispatch 01 &bull; Command Centre
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                {currentDateStr}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              Quality Command & Triage
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Autonomous multi-agent precedent recall, containment governance, and auditable CAPA effectiveness calibration across active production campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/investigation')}
            >
              Investigation Studio
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openNewDeviationModal}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              File Deviation
            </Button>
          </div>
        </div>
      </section>

      {/* Advisory Safeguard Banner */}
      <AdvisoryBanner />

      {/* Key Metrics Ledger: Fine Separator Grid */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 divide-y sm:divide-y-0 sm:divide-x divide-stone-300 dark:divide-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 transition-colors">
        {/* Metric 1 */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">
              Active Deviations
            </span>
            <span className="font-mono text-[10px] text-brass-600 dark:text-brass-400 font-bold">01</span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-serif text-3xl lg:text-4xl font-semibold text-ink-800 dark:text-ivory-100 tracking-tight">
              {deviations.length}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-600 dark:text-stone-300 bg-ivory-200 dark:bg-obsidian-300 px-1.5 py-0.5 border border-stone-200 dark:border-stone-700">
              {openCount} in triage
            </span>
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 pt-1 leading-snug">
            Total registered process non-conformances in {currentPlant}.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">
              Critical Severity
            </span>
            <span className="font-mono text-[10px] text-brass-600 dark:text-brass-400 font-bold">02</span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-serif text-3xl lg:text-4xl font-semibold text-ink-800 dark:text-ivory-100 tracking-tight">
              {criticalCount}
            </span>
            <span
              className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${
                criticalCount > 0
                  ? 'bg-crimson-50 dark:bg-crimson-900/30 text-crimson-700 dark:text-crimson-300 border-crimson-300 dark:border-crimson-700'
                  : 'bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 border-forest-300 dark:border-forest-700'
              }`}
            >
              {criticalCount > 0 ? 'Batch Quarantine' : 'Nominal'}
            </span>
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 pt-1 leading-snug">
            Immediate product release block condition required.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">
              Verified Effectiveness
            </span>
            <span className="font-mono text-[10px] text-brass-600 dark:text-brass-400 font-bold">03</span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-serif text-3xl lg:text-4xl font-semibold text-ink-800 dark:text-ivory-100 tracking-tight">
              {metrics?.effectiveness_rate?.effectiveness_percent ?? 77.8}%
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 border border-forest-300 dark:border-forest-700 px-1.5 py-0.5">
              {metrics?.effectiveness_rate?.verified_effective ?? 14} cleared
            </span>
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 pt-1 leading-snug">
            Interventions with confirmed zero 90-day recurrence.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">
              Memory & Inference
            </span>
            <span className="font-mono text-[10px] text-brass-600 dark:text-brass-400 font-bold">04</span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-serif text-3xl lg:text-4xl font-semibold text-ink-800 dark:text-ivory-100 tracking-tight">
              {isLiveBackend ? 'Active' : 'Demo'}
            </span>
            <span
              className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${
                isLiveBackend
                  ? 'bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 border-forest-300 dark:border-forest-700'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
              }`}
            >
              {isLiveBackend ? 'Port 8004' : 'Mock Adapter'}
            </span>
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 pt-1 leading-snug">
            Hindsight institutional memory reflection engine status.
          </p>
        </div>
      </section>

      {/* Main Asymmetric Grid: 8 cols left / 4 cols right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Critical Deviations Registry & Agent Pipeline */}
        <div className="lg:col-span-8 space-y-8">
          {/* Urgent Deviations Ledger */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 transition-colors">
            <div className="px-6 py-4 border-b border-stone-300 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
                  Triage Ledger
                </span>
                <h2 className="font-serif text-xl font-medium text-ink-800 dark:text-ivory-100">
                  Priority Process Deviations
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/deviations')}
                icon={<ArrowRight className="w-3 h-3" />}
              >
                All Deviations ({deviations.length})
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-300 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Deviation / Line</th>
                    <th className="py-2.5 px-4 font-semibold">Equipment</th>
                    <th className="py-2.5 px-4 font-semibold">Observed Failure Mode</th>
                    <th className="py-2.5 px-4 font-semibold">Severity</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-ink-800 dark:text-ivory-100">
                  {deviations.slice(0, 6).map((dev) => (
                    <tr key={dev.id} className="hover:bg-ivory-200/50 dark:hover:bg-obsidian-300/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-ink-900 dark:text-ivory-50 truncate max-w-[140px]">
                          {dev.id}
                        </div>
                        <div className="font-sans text-[11px] text-stone-500 dark:text-stone-400">{dev.line}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-stone-700 dark:text-stone-300">
                        {dev.equipment_code}
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-stone-700 dark:text-stone-300" title={dev.failure_mode}>
                        {dev.failure_mode}
                      </td>
                      <td className="py-3 px-4">
                        <SeverityBadge severity={dev.severity} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={dev.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/investigation?id=${dev.id}`)}
                          className="font-mono text-[11px] uppercase tracking-wider text-ink-800 dark:text-brass-400 hover:text-brass-700 dark:hover:text-brass-300 font-semibold inline-flex items-center gap-1 group border-b border-ink-800 dark:border-brass-400 hover:border-brass-700 pb-0.5"
                        >
                          Investigate
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
              <span>Showing 6 of {deviations.length} total plant records</span>
              <span className="text-brass-700 dark:text-brass-400">Audit Trail: In Compliance</span>
            </div>
          </div>

          {/* Connected 4-Agent Analytical Core Overview */}
          <div className="border border-stone-300 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400 p-6 space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
                  Analytical Architecture
                </span>
                <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
                  Autonomous Precedent Cross-Examination Pipeline
                </h3>
              </div>
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                4 Coordinated Agent Roles
              </span>
            </div>

            <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Every deviation is systematically interrogated across four discrete analytical stages to prevent premature root-cause assumptions and evaluate recurrence risks against historical GMP records.
            </p>

            {/* Continuous Connected Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 block">
                  Stage 01
                </span>
                <div className="font-serif text-sm font-semibold text-ink-800 dark:text-ivory-100">Investigator</div>
                <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                  Recalls historical similarities & isolates process parameters.
                </p>
              </div>

              <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 block">
                  Stage 02
                </span>
                <div className="font-serif text-sm font-semibold text-ink-800 dark:text-ivory-100">Skeptic</div>
                <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                  Stress-tests correlation vs causation & recurrence history.
                </p>
              </div>

              <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400 block">
                  Stage 03
                </span>
                <div className="font-serif text-sm font-semibold text-ink-800 dark:text-ivory-100">Auditor</div>
                <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                  Evaluates 21 CFR §11 audit trail & batch isolation criteria.
                </p>
              </div>

              <div className="p-3 border border-brass-300 dark:border-brass-700 bg-brass-50 dark:bg-brass-950/40 space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-brass-700 dark:text-brass-300 font-semibold block">
                  Stage 04 Consensus
                </span>
                <div className="font-serif text-sm font-semibold text-ink-800 dark:text-ivory-100">Synthesizer</div>
                <p className="font-sans text-[11px] text-stone-600 dark:text-stone-300 leading-snug">
                  Derives auditable, evidence-backed CAPA recommendation.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/investigation')}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Launch Multi-Agent Investigation Studio
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Severity Mix & Quality Operations Hub */}
        <div className="lg:col-span-4 space-y-8">
          {/* Severity Distribution Donut / Ledger */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 space-y-4 transition-colors">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
                Risk Distribution
              </span>
              <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
                Severity Mix
              </h3>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={2}
                    dataKey="value"
                    stroke={isDark ? '#141512' : '#F7F5F0'}
                    strokeWidth={2}
                  >
                    {severityPieData.map((entry, index) => (
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
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="divide-y divide-stone-200 dark:divide-stone-800 pt-2 text-xs font-mono">
              {severityPieData.map((item) => (
                <div key={item.name} className="py-1.5 flex items-center justify-between text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 inline-block" style={{ backgroundColor: item.color }} />
                    <span className="uppercase text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-ink-900 dark:text-ivory-100">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fast Navigation Hub: Distinctive Document Links */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 space-y-4 transition-colors">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
                Operational Portals
              </span>
              <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
                Action Registry
              </h3>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/recommendations')}
                className="w-full p-3 border border-stone-200 dark:border-stone-800 hover:border-ink-800 dark:hover:border-brass-400 bg-ivory-100 dark:bg-obsidian-300 hover:bg-ivory-200 dark:hover:bg-obsidian-200 text-left flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="font-serif text-sm font-medium text-ink-900 dark:text-ivory-100 group-hover:text-brass-700 dark:group-hover:text-brass-400">
                    Human Approval Portal
                  </div>
                  <div className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Review recommendations & record rationale
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-ink-800 dark:group-hover:text-ivory-100 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/capa')}
                className="w-full p-3 border border-stone-200 dark:border-stone-800 hover:border-ink-800 dark:hover:border-brass-400 bg-ivory-100 dark:bg-obsidian-300 hover:bg-ivory-200 dark:hover:bg-obsidian-200 text-left flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="font-serif text-sm font-medium text-ink-900 dark:text-ivory-100 group-hover:text-brass-700 dark:group-hover:text-brass-400">
                    CAPA Action Program
                  </div>
                  <div className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {capas.length} active corrective interventions
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-ink-800 dark:group-hover:text-ivory-100 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/inspector')}
                className="w-full p-3 border border-stone-200 dark:border-stone-800 hover:border-ink-800 dark:hover:border-brass-400 bg-ivory-100 dark:bg-obsidian-300 hover:bg-ivory-200 dark:hover:bg-obsidian-200 text-left flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="font-serif text-sm font-medium text-ink-900 dark:text-ivory-100 group-hover:text-brass-700 dark:group-hover:text-brass-400">
                    Inspector & Audit Readiness
                  </div>
                  <div className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Pre-audit documentation gap review
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-ink-800 dark:group-hover:text-ivory-100 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/memory')}
                className="w-full p-3 border border-stone-200 dark:border-stone-800 hover:border-ink-800 dark:hover:border-brass-400 bg-ivory-100 dark:bg-obsidian-300 hover:bg-ivory-200 dark:hover:bg-obsidian-200 text-left flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="font-serif text-sm font-medium text-ink-900 dark:text-ivory-100 group-hover:text-brass-700 dark:group-hover:text-brass-400">
                    AI Memory & Governance
                  </div>
                  <div className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Sync outbox & manage facility memory
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-ink-800 dark:group-hover:text-ivory-100 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
