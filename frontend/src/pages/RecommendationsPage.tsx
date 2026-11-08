import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import { RecommendationOut, ReviewCreate, ReviewDecisionResponse } from '../types';
import { Button } from '../components/common/Button';
import { StatusBadge, SyntheticBadge } from '../components/common/Badge';
import { AdvisoryBanner } from '../components/common/AdvisoryBanner';
import { Modal } from '../components/common/Modal';

export const RecommendationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetRecId = searchParams.get('id') || 'rec-seal-001';

  const [recommendation, setRecommendation] = useState<RecommendationOut | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Form State
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'overridden'>('approved');
  const [rationale, setRationale] = useState(
    'Based on Hindsight precedent HIN-REC-2023-089 confirming 180-day zero recurrence, the proposed EPDM gasket replacement is substantiated. Re-training alone rejected.'
  );
  const [reviewer, setReviewer] = useState('Dr. Marcus Vance (QA Lead)');
  const [submitting, setSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewDecisionResponse | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Quick CAPA modal after approval
  const [capaModalOpen, setCapaModalOpen] = useState(false);
  const [capaLoading, setCapaLoading] = useState(false);
  const [capaSuccess, setCapaSuccess] = useState(false);

  useEffect(() => {
    loadRecommendation(targetRecId);
  }, [targetRecId]);

  const loadRecommendation = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getRecommendation(id);
      setRecommendation(res.data);
      if (res.data.review_status && res.data.review_status !== 'pending') {
        setReviewResult({
          status: 'recorded',
          recommendation_id: res.data.recommendation_id,
          decision: res.data.review_status,
          ai_recommendation_preserved: true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendation) return;

    if (rationale.trim().length < 3) {
      setReviewError('Reviewer rationale is mandatory (minimum 3 characters).');
      return;
    }

    setSubmitting(true);
    setReviewError(null);
    try {
      const payload: ReviewCreate = {
        decision,
        rationale: rationale.trim(),
        reviewer: reviewer.trim(),
      };
      const res = await api.reviewRecommendation(recommendation.recommendation_id, payload);
      setReviewResult(res.data);
      setRecommendation({
        ...recommendation,
        review_status: decision,
      });
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to record review decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCapaFromRecommendation = async () => {
    if (!recommendation) return;
    setCapaLoading(true);
    try {
      const firstAction = recommendation.proposed_actions[0];
      const actionClass = typeof firstAction === 'object' ? (firstAction as any).action_class : firstAction;
      await api.createCapa(
        recommendation.deviation_id,
        actionClass || 'component upgrade / material change',
        `Approved CAPA derived from AI Recommendation ${recommendation.recommendation_id}. Reviewer: ${reviewer}. Rationale: ${rationale}`
      );
      setCapaSuccess(true);
      setTimeout(() => {
        setCapaSuccess(false);
        setCapaModalOpen(false);
        navigate('/capa');
      }, 1200);
    } catch (err) {
      console.error('Failed to create CAPA', err);
    } finally {
      setCapaLoading(false);
    }
  };

  const successfulPrecedents =
    recommendation?.historical_evidence?.filter((e) => e.outcome === 'VERIFIED_EFFECTIVE') || [];
  const failedPrecedents =
    recommendation?.historical_evidence?.filter((e) => e.outcome === 'RECURRENCE_OBSERVED') || [];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Protocol 04 &bull; Human Governance & Review
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Target Rec: {targetRecId}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              Recommendation Decision Memo
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              21 CFR Part 11 electronic review gate. Qualified QA leadership must review synthesized precedent evidence and record binding rationale before CAPA progression.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadRecommendation(targetRecId)}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Reload Memo
            </Button>
            {decision === 'approved' && reviewResult && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCapaModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Derive CAPA Program
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Mandatory Advisory Banner */}
      <AdvisoryBanner />

      {loading ? (
        <div className="p-12 border border-stone-300 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400 text-center font-mono text-xs text-stone-500 dark:text-stone-400">
          Loading decision memo dossier for {targetRecId}...
        </div>
      ) : !recommendation ? (
        <div className="p-8 border border-crimson-300 dark:border-crimson-700 bg-crimson-50 dark:bg-crimson-900/30 text-crimson-800 dark:text-crimson-300 text-center space-y-2">
          <h4 className="font-serif text-lg font-medium">Recommendation Not Found</h4>
          <p className="text-xs">No active consensus recommendation found matching ID {targetRecId}.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/investigation')}>
            Go to Investigation Studio
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Decision Document (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Formal QA Memo Container */}
            <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-400 dark:border-stone-700 p-6 sm:p-10 space-y-8 shadow-editorial transition-colors">
              {/* Memo Formal Masthead */}
              <div className="border-b-2 border-ink-800 dark:border-brass-400 pb-5 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
                  <span>PRECEDENT PHARMACEUTICAL QUALITY DOSSIER</span>
                  <span className="text-brass-700 dark:text-brass-400 font-semibold">FORM QA-DISP-2026</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-stone-300 dark:border-stone-800 font-mono text-xs">
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Memo ID</span>
                    <span className="font-bold text-ink-900 dark:text-ivory-100">{recommendation.recommendation_id}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Deviation Link</span>
                    <span className="font-bold text-brass-700 dark:text-brass-400">{recommendation.deviation_id}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Review Status</span>
                    <div className="mt-0.5">
                      <StatusBadge status={recommendation.review_status || 'pending'} />
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Inference Engine</span>
                    <span className="text-stone-700 dark:text-stone-300 text-[11px] truncate block">
                      {recommendation.model_name || 'Llama 3.3'}
                    </span>
                  </div>
                </div>

                <div className="font-serif text-2xl font-medium text-ink-900 dark:text-ivory-100 tracking-tight pt-1">
                  Synthesized Precedent Disposition & Corrective Intervention Proposal
                </div>
              </div>

              {/* 1. Consensus Finding & Executive Summary */}
              <section className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold block">
                  1.0 &bull; Synthesized Finding Summary
                </span>
                <div className="p-4 border border-stone-300 dark:border-stone-700 bg-ivory-100/70 dark:bg-obsidian-300/70 font-sans text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                  {recommendation.summary}
                </div>
              </section>

              {/* 2. Comparative Evidence Ledger: Verified vs Failed Interventions */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
                    2.0 &bull; Historical Precedent Evidence Balance
                  </span>
                  <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                    Source: Hindsight Memory Layer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Verified Precedents */}
                  <div className="border border-forest-300 dark:border-forest-700 bg-forest-50/50 dark:bg-forest-950/20 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-forest-700 dark:text-forest-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
                      Verified Effective Interventions
                    </div>
                    {successfulPrecedents.length > 0 ? (
                      <ul className="space-y-2 text-xs font-sans text-forest-900 dark:text-forest-200">
                        {successfulPrecedents.map((rec, i) => (
                          <li key={i} className="p-2 border border-forest-200 dark:border-forest-800 bg-ivory-50/80 dark:bg-obsidian-400/80 space-y-1">
                            <div className="font-medium text-ink-900 dark:text-ivory-100">{rec.action_class}</div>
                            <div className="font-mono text-[10px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                              <span>Ref: {rec.source_record_id}</span>
                              <span className="text-forest-700 dark:text-forest-400 font-semibold">
                                {rec.monitoring_days ? `${rec.monitoring_days}d zero recurrence` : 'Verified'}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-stone-500 dark:text-stone-400 text-xs italic">
                        No verified positive precedents recorded.
                      </div>
                    )}
                  </div>

                  {/* Failed Precedents */}
                  <div className="border border-crimson-300 dark:border-crimson-700 bg-crimson-50/50 dark:bg-crimson-950/20 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-crimson-700 dark:text-crimson-400 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-crimson-600 dark:text-crimson-400" />
                      Documented Recurrence Failures
                    </div>
                    {failedPrecedents.length > 0 ? (
                      <ul className="space-y-2 text-xs font-sans text-crimson-900 dark:text-crimson-200">
                        {failedPrecedents.map((rec, i) => (
                          <li key={i} className="p-2 border border-crimson-200 dark:border-crimson-800 bg-ivory-50/80 dark:bg-obsidian-400/80 space-y-1">
                            <div className="font-medium text-ink-900 dark:text-ivory-100">{rec.action_class}</div>
                            <div className="font-mono text-[10px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                              <span>Ref: {rec.source_record_id}</span>
                              <span className="text-crimson-700 dark:text-crimson-400 font-semibold">
                                Recurrence observed within {rec.monitoring_days || 30}d
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-stone-500 dark:text-stone-400 text-xs italic">
                        No recurrence failures documented.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* 3. Proposed Interventions */}
              <section className="space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold block">
                  3.0 &bull; Proposed Corrective Interventions
                </span>
                <div className="border border-stone-300 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-300 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-semibold">Action Classification</th>
                        <th className="py-2.5 px-4 font-semibold">Historical Efficacy</th>
                        <th className="py-2.5 px-4 font-semibold">Mandatory Window</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-ink-800 dark:text-ivory-100">
                      {recommendation.proposed_actions.map((act, i) => {
                        const isObj = typeof act === 'object' && act !== null;
                        const actionClass = isObj ? (act as any).action_class : act;
                        const status = isObj ? (act as any).historical_status : 'no_precedent';
                        const days = isObj ? (act as any).monitoring_days : 90;

                        return (
                          <tr key={i} className="hover:bg-ivory-100/70 dark:hover:bg-obsidian-300/70">
                            <td className="py-3 px-4 font-medium text-ink-900 dark:text-ivory-100">{actionClass}</td>
                            <td className="py-3 px-4">
                              {status === 'associated_with_no_recurrence_in_recorded_monitoring' ? (
                                <span className="text-forest-700 dark:text-forest-400 font-mono text-[11px] font-semibold">
                                  Grounded — Zero Recurrence
                                </span>
                              ) : status === 'recurrence_observed' ? (
                                <span className="text-crimson-700 dark:text-crimson-400 font-mono text-[11px] font-semibold">
                                  High Recurrence Warning
                                </span>
                              ) : (
                                <span className="text-stone-400 dark:text-stone-500 font-mono text-[11px]">
                                  Unverified Novel Action
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                              {days} days
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. Epistemic Uncertainty & Regulatory Boundaries */}
              {recommendation.uncertainty && recommendation.uncertainty.length > 0 && (
                <section className="space-y-2 p-4 border border-stone-300 dark:border-stone-700 bg-ivory-100/60 dark:bg-obsidian-300/60">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold block">
                    4.0 &bull; Epistemic Uncertainty & Regulatory Boundary
                  </span>
                  <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-400 list-disc list-inside font-sans">
                    {recommendation.uncertainty.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          {/* Right Column: QA Review & Digital Sign-Off Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-ivory-50 dark:bg-obsidian-400 border-2 border-stone-400 dark:border-stone-700 p-6 space-y-6 shadow-editorial transition-colors">
              <div className="border-b border-stone-300 dark:border-stone-800 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold block">
                  Part 11 Electronic Gate
                </span>
                <h3 className="font-serif text-xl font-medium text-ink-900 dark:text-ivory-100">
                  Formal QA Disposition
                </h3>
              </div>

              {reviewResult ? (
                <div className="space-y-4">
                  <div className="p-4 border border-forest-300 dark:border-forest-700 bg-forest-50 dark:bg-forest-950/30 text-forest-800 dark:text-forest-200 space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-semibold text-forest-700 dark:text-forest-300">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-forest-400" />
                      Decision Officially Recorded
                    </div>
                    <div className="font-mono text-[11px] text-forest-900 dark:text-forest-200 space-y-0.5">
                      <div>Disposition: <strong>{reviewResult.decision.toUpperCase()}</strong></div>
                      <div>Record ID: {reviewResult.recommendation_id}</div>
                      <div>Preserved: {reviewResult.ai_recommendation_preserved ? 'Audit Intact' : 'No'}</div>
                    </div>
                  </div>

                  <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Electronic signature has been digitally signed into the permanent 21 CFR §11 audit trail.
                  </p>

                  {reviewResult.decision === 'approved' && (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => setCapaModalOpen(true)}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Authorize CAPA Program
                    </Button>
                  )}

                  <button
                    onClick={() => setReviewResult(null)}
                    className="w-full text-center font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-ink-800 dark:hover:text-ivory-100 hover:underline pt-2"
                  >
                    Edit / Override Decision
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  {reviewError && (
                    <div className="p-3 border border-crimson-300 dark:border-crimson-700 bg-crimson-50 dark:bg-crimson-900/30 text-crimson-800 dark:text-crimson-300 font-mono text-xs">
                      {reviewError}
                    </div>
                  )}

                  {/* Decision Selector */}
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400">
                      QA Disposition Verdict
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDecision('approved')}
                        className={`py-2 px-2 text-center font-mono text-[11px] uppercase tracking-wider border transition-all ${
                          decision === 'approved'
                            ? 'bg-forest-700 dark:bg-forest-600 text-ivory-50 border-forest-800 font-bold shadow-fine'
                            : 'bg-ivory-100 dark:bg-obsidian-300 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-forest-400'
                        }`}
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecision('overridden')}
                        className={`py-2 px-2 text-center font-mono text-[11px] uppercase tracking-wider border transition-all ${
                          decision === 'overridden'
                            ? 'bg-amber-600 dark:bg-amber-500 text-ivory-50 border-amber-700 font-bold shadow-fine'
                            : 'bg-ivory-100 dark:bg-obsidian-300 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-amber-400'
                        }`}
                      >
                        Override
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecision('rejected')}
                        className={`py-2 px-2 text-center font-mono text-[11px] uppercase tracking-wider border transition-all ${
                          decision === 'rejected'
                            ? 'bg-crimson-700 dark:bg-crimson-600 text-ivory-50 border-crimson-800 font-bold shadow-fine'
                            : 'bg-ivory-100 dark:bg-obsidian-300 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-crimson-400'
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Reviewer Identity */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                      Qualified Reviewer / Sign-Off Role
                    </label>
                    <input
                      type="text"
                      value={reviewer}
                      onChange={(e) => setReviewer(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                    />
                  </div>

                  {/* Justification Rationale */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                      Mandatory Scientific & Regulatory Rationale
                    </label>
                    <textarea
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      rows={5}
                      required
                      placeholder="State explicit objective justification citing historical precedents or specific engineering evidence..."
                      className="w-full px-3 py-2 text-xs font-sans bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 leading-relaxed"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    loading={submitting}
                  >
                    Execute Binding QA Sign-Off
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CAPA Creation Modal */}
      {capaModalOpen && recommendation && (
        <Modal
          isOpen={capaModalOpen}
          onClose={() => setCapaModalOpen(false)}
          title="Derive CAPA from Approved Recommendation"
          description={`Formulate CAPA for deviation ${recommendation.deviation_id} with approved rationale.`}
          maxWidth="lg"
        >
          {capaSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 border border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">CAPA Program Formulated</h4>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
                Action program transferred to CAPA Management ledger. Redirecting...
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs font-sans">
              <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 space-y-1">
                <span className="font-mono text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Derived Action</span>
                <p className="font-medium text-ink-900 dark:text-ivory-100">
                  {typeof recommendation.proposed_actions[0] === 'object'
                    ? (recommendation.proposed_actions[0] as any).action_class
                    : recommendation.proposed_actions[0]}
                </p>
              </div>

              <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 space-y-1">
                <span className="font-mono text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Reviewer Rationale</span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{rationale}</p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <Button variant="outline" size="sm" onClick={() => setCapaModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateCapaFromRecommendation}
                  loading={capaLoading}
                >
                  Create & Link CAPA
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
