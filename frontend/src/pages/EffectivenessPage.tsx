import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { EffectivenessQueueItem, Capa, EffectivenessCreate } from '../types';
import { Button } from '../components/common/Button';
import { OutcomeBadge, SyntheticBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const EffectivenessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCapa = searchParams.get('capa');

  const [queue, setQueue] = useState<EffectivenessQueueItem[]>([]);
  const [capas, setCapas] = useState<Capa[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [selectedCapaId, setSelectedCapaId] = useState('');
  const [outcome, setOutcome] = useState<
    'VERIFIED_EFFECTIVE' | 'RECURRENCE_OBSERVED' | 'INCONCLUSIVE' | 'NOT_ASSESSED'
  >('VERIFIED_EFFECTIVE');
  const [monitoringDays, setMonitoringDays] = useState(90);
  const [evidence, setEvidence] = useState(
    'Zero pressure decay or micro-leak detected across 18 subsequent batch runs over 90 days. Visual seal inspection meets USP Class VI standards.'
  );
  const [reviewer, setReviewer] = useState('Dr. Marcus Vance (QA Lead)');
  const [submitting, setSubmitting] = useState(false);
  const [assessmentSuccess, setAssessmentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preselectedCapa) {
      setSelectedCapaId(preselectedCapa);
      setIsAssessmentOpen(true);
    }
  }, [preselectedCapa]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [queueRes, capaRes] = await Promise.all([
        api.getEffectivenessQueue(),
        api.getCapas(),
      ]);
      setQueue(queueRes.data);
      setCapas(capaRes.data);
      if (capaRes.data.length > 0 && !selectedCapaId) {
        setSelectedCapaId(capaRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCapaId) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload: EffectivenessCreate = {
        capa_id: selectedCapaId,
        outcome,
        monitoring_days: Number(monitoringDays),
        evidence: evidence.trim(),
        reviewer: reviewer.trim(),
      };
      await api.assessEffectiveness(selectedCapaId, payload);
      setAssessmentSuccess(true);
      setTimeout(() => {
        setAssessmentSuccess(false);
        setIsAssessmentOpen(false);
        loadData();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit effectiveness check');
    } finally {
      setSubmitting(false);
    }
  };

  const verifiedCount = queue.filter((q) => q.outcome === 'VERIFIED_EFFECTIVE').length;
  const recurrenceCount = queue.filter((q) => q.outcome === 'RECURRENCE_OBSERVED').length;
  const pendingCount = queue.filter((q) => q.outcome === 'NOT_ASSESSED' || q.outcome === 'INCONCLUSIVE').length;

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Monitoring 07 &bull; Effectiveness Calibration
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Specification: 21 CFR §211.192
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              Effectiveness Monitoring & Timelines
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Longitudinal tracking of implemented corrective actions. Monitors recurrence risks over 30, 60, 90, and 180-day production horizons to ensure sustained compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Sync Queue
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAssessmentOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Record Evaluation
            </Button>
          </div>
        </div>
      </section>

      {/* Timeline & Efficacy Progress Overview */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 divide-y sm:divide-y-0 sm:divide-x divide-stone-300 dark:divide-stone-800 grid grid-cols-1 sm:grid-cols-3 transition-colors">
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-forest-700 dark:text-forest-400 font-semibold">
            <span>Verified Interventions</span>
            <span className="text-forest-600 dark:text-forest-400">CLEARED</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-forest-800 dark:text-forest-300 pt-1">{verifiedCount}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Confirmed zero recurrence through full monitoring horizon.</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-crimson-700 dark:text-crimson-400 font-semibold">
            <span>Recurrence Observed</span>
            <span className="text-crimson-600 dark:text-crimson-400">FAILED</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-crimson-800 dark:text-crimson-300 pt-1">{recurrenceCount}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Interventions with repeat failure mode during verification.</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">
            <span>Active Verification Horizon</span>
            <span className="text-brass-700 dark:text-brass-400 font-semibold">PENDING</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-900 dark:text-ivory-100 pt-1">{pendingCount}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Currently within active 30-180 day monitoring windows.</p>
        </div>
      </section>

      {/* Monitoring Window Timeline Breakdown */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 space-y-4 transition-colors">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
              Temporal Horizons
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
              Monitoring Window Verification Cadence
            </h3>
          </div>
          <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
            Automated Recurrence Intercept
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block">Horizon A</span>
            <div className="font-serif text-base font-semibold text-ink-900 dark:text-ivory-100 mt-1">30 Days</div>
            <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Immediate restart post-intervention; checks for transient re-seating defects.
            </p>
          </div>

          <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block">Horizon B</span>
            <div className="font-serif text-base font-semibold text-ink-900 dark:text-ivory-100 mt-1">60 Days</div>
            <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Mid-term thermal cycle endurance & operator shift shift-handover stability.
            </p>
          </div>

          <div className="p-3 border border-brass-300 dark:border-brass-700 bg-brass-50 dark:bg-brass-950/40">
            <span className="font-mono text-[10px] uppercase tracking-wider text-brass-700 dark:text-brass-400 font-semibold block">Horizon C (Standard)</span>
            <div className="font-serif text-base font-semibold text-ink-900 dark:text-ivory-100 mt-1">90 Days</div>
            <p className="font-sans text-[11px] text-stone-600 dark:text-stone-300 mt-1">
              Standard regulatory closing gate under FDA cGMP / Annex 11 protocols.
            </p>
          </div>

          <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block">Horizon D</span>
            <div className="font-serif text-base font-semibold text-ink-900 dark:text-ivory-100 mt-1">180 Days</div>
            <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Extended material wear & longitudinal degradation qualification.
            </p>
          </div>
        </div>
      </section>

      {/* Effectiveness Queue Registry Table */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 transition-colors">
        <div className="px-6 py-4 border-b border-stone-300 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
              Verification Registry
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
              Effectiveness Assessment Queue
            </h3>
          </div>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
            {queue.length} Active Tracking Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-300 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Queue Check ID</th>
                <th className="py-3 px-4 font-semibold">CAPA Program ID</th>
                <th className="py-3 px-4 font-semibold">Monitoring Horizon</th>
                <th className="py-3 px-4 font-semibold">Outcome Verdict</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-ink-800 dark:text-ivory-100">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-ivory-200/50 dark:hover:bg-obsidian-300/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-ink-900 dark:text-ivory-50">
                    {item.id}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-brass-700 dark:text-brass-400">
                    {item.capa_id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-700 dark:text-stone-300">
                    {item.monitoring_days} Days Horizon
                  </td>
                  <td className="py-3.5 px-4">
                    <OutcomeBadge outcome={item.outcome} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedCapaId(item.capa_id);
                        setMonitoringDays(item.monitoring_days);
                        setIsAssessmentOpen(true);
                      }}
                      className="font-mono text-[10px] uppercase text-ink-800 dark:text-ivory-100 hover:text-brass-700 dark:hover:text-brass-400 border border-stone-300 dark:border-stone-700 hover:border-ink-800 dark:hover:border-brass-400 px-2 py-1 bg-ivory-100 dark:bg-obsidian-300 transition-colors font-medium"
                    >
                      Re-Evaluate Check
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assessment Modal */}
      {isAssessmentOpen && (
        <Modal
          isOpen={isAssessmentOpen}
          onClose={() => setIsAssessmentOpen(false)}
          title="Record CAPA Effectiveness Assessment"
          description="Formal cGMP effectiveness verification under 21 CFR §211.192."
          maxWidth="lg"
        >
          {assessmentSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 border border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">Assessment Recorded</h4>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
                Effectiveness verification logged into audit ledger.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitAssessment} className="space-y-4 text-xs font-sans">
              {error && (
                <div className="p-3 border border-crimson-300 dark:border-crimson-700 bg-crimson-50 dark:bg-crimson-900/30 text-crimson-800 dark:text-crimson-300 font-mono">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Target CAPA Program
                </label>
                <select
                  value={selectedCapaId}
                  onChange={(e) => setSelectedCapaId(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
                >
                  {capas.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-obsidian-400">
                      {c.id} — [{c.status.toUpperCase()}] {c.action_class}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Evaluation Verdict
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as any)}
                    className="w-full px-3 py-2 font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
                  >
                    <option value="VERIFIED_EFFECTIVE" className="dark:bg-obsidian-400">VERIFIED EFFECTIVE (Zero Recurrence)</option>
                    <option value="RECURRENCE_OBSERVED" className="dark:bg-obsidian-400">RECURRENCE OBSERVED (Failed)</option>
                    <option value="INCONCLUSIVE" className="dark:bg-obsidian-400">INCONCLUSIVE (Extend Window)</option>
                    <option value="NOT_ASSESSED" className="dark:bg-obsidian-400">NOT ASSESSED (Pending)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Monitoring Horizon (Days)
                  </label>
                  <input
                    type="number"
                    value={monitoringDays}
                    onChange={(e) => setMonitoringDays(Number(e.target.value))}
                    min={7}
                    max={365}
                    required
                    className="w-full px-3 py-2 font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Evaluator Identity
                </label>
                <input
                  type="text"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  required
                  className="w-full px-3 py-2 font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Objective Evidentiary Observations
                </label>
                <textarea
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  rows={3}
                  required
                  placeholder="Detail sensory inspection, batch testing results, and seal pressure hold data..."
                  className="w-full px-3 py-2 font-sans bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAssessmentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                  Execute Formal Verification
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
