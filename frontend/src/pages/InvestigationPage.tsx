import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { Deviation, RecommendationOut, HistoricalEvidenceRecord } from '../types';
import { Button } from '../components/common/Button';
import { SeverityBadge, StatusBadge, SyntheticBadge } from '../components/common/Badge';
import { AgentWorkflowVisualizer } from '../components/investigation/AgentWorkflowVisualizer';
import { AgentCard } from '../components/investigation/AgentCard';
import { InvestigationLoader } from '../components/investigation/InvestigationLoader';
import { Modal } from '../components/common/Modal';
import { LayoutContextType } from '../components/layout/Layout';

export const InvestigationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentPlant } = useOutletContext<LayoutContextType>();

  const paramId = searchParams.get('id');

  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [selectedDeviationId, setSelectedDeviationId] = useState<string>('');
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);
  const [activeAgentTab, setActiveAgentTab] = useState<'ALL' | 'INVESTIGATOR' | 'SKEPTIC' | 'AUDITOR' | 'SYNTHESIZER'>('ALL');

  const [investigationResult, setInvestigationResult] = useState<RecommendationOut | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Precedent detail modal
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [precedents, setPrecedents] = useState<HistoricalEvidenceRecord[]>([]);

  useEffect(() => {
    loadDeviations();
  }, [currentPlant]);

  useEffect(() => {
    if (paramId && deviations.length > 0) {
      const match = deviations.find((d) => d.id === paramId);
      if (match) {
        setSelectedDeviationId(match.id);
        triggerInvestigation(match.id);
      }
    } else if (deviations.length > 0 && !selectedDeviationId) {
      setSelectedDeviationId(deviations[0].id);
      triggerInvestigation(deviations[0].id);
    }
  }, [paramId, deviations]);

  const loadDeviations = async () => {
    try {
      const res = await api.getDeviations(currentPlant);
      setDeviations(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerInvestigation = async (deviationIdToRun?: string) => {
    const id = deviationIdToRun || selectedDeviationId;
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [invRes, precRes] = await Promise.all([
        api.investigate(id, memoryEnabled),
        api.getPrecedents(id),
      ]);
      setInvestigationResult(invRes.data);
      setPrecedents(precRes.records || []);
    } catch (err: any) {
      setError(err?.message || 'Investigation request failed');
    } finally {
      setLoading(false);
    }
  };

  const currentDev = deviations.find((d) => d.id === selectedDeviationId);
  const viewedRecord = precedents.find((p) => p.source_record_id === selectedRecordId);

  return (
    <div className="space-y-8 font-sans">
      {/* Header & Deviation Selector */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Workspace 03 &bull; AI Investigation
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Facility: {currentPlant}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              Multi-Agent Investigation Studio
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Four coordinated AI agent personas cross-examine process telemetry against historical GMP precedent to formulate auditable CAPA interventions.
            </p>
          </div>

          {/* Deviation Selector Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-ivory-50 dark:bg-obsidian-400 p-2 border border-stone-300 dark:border-stone-800">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 pl-2 hidden sm:inline">
              Target:
            </span>
            <select
              value={selectedDeviationId}
              onChange={(e) => {
                setSelectedDeviationId(e.target.value);
                triggerInvestigation(e.target.value);
              }}
              className="px-2.5 py-1.5 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer max-w-xs"
            >
              {deviations.map((d) => (
                <option key={d.id} value={d.id} className="dark:bg-obsidian-400">
                  {d.id} — [{d.severity.toUpperCase()}] {d.equipment_code}
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={() => triggerInvestigation()}
              loading={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Re-Examine
            </Button>
          </div>
        </div>
      </section>

      {/* Selected Deviation Context Banner */}
      {currentDev && (
        <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-ink-900 dark:text-ivory-50">{currentDev.id}</span>
              <span className="text-stone-300 dark:text-stone-700">&bull;</span>
              <span className="font-sans font-medium text-stone-700 dark:text-stone-300">
                {currentDev.line} &bull; {currentDev.equipment_code}
              </span>
              <SeverityBadge severity={currentDev.severity} />
              <StatusBadge status={currentDev.status} />
            </div>
            <p className="font-sans text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl">
              {currentDev.description}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-stone-200 dark:border-stone-800 flex-shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none text-stone-700 dark:text-stone-300 font-sans">
              <input
                type="checkbox"
                checked={memoryEnabled}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
                className="border-stone-300 dark:border-stone-700 text-ink-800 dark:text-brass-500 focus:ring-ink-800"
              />
              <span className="font-mono text-[11px]">Recall Institutional Memory</span>
            </label>
          </div>
        </section>
      )}

      {/* Connected 4-Agent Workflow Visualizer */}
      <AgentWorkflowVisualizer
        activeAgent={activeAgentTab}
        onSelectAgent={(agent) => setActiveAgentTab(agent)}
        investigatorDone={!loading && !!investigationResult}
        skepticDone={!loading && !!investigationResult}
        auditorDone={!loading && !!investigationResult}
        synthesizerDone={!loading && !!investigationResult}
      />

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-300 dark:border-stone-800 pb-2 overflow-x-auto text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 pl-1 mr-2">
          Filter View:
        </span>
        {[
          { id: 'ALL' as const, label: 'Consolidated View' },
          { id: 'INVESTIGATOR' as const, label: '01: Investigator' },
          { id: 'SKEPTIC' as const, label: '02: Skeptic' },
          { id: 'AUDITOR' as const, label: '03: Auditor' },
          { id: 'SYNTHESIZER' as const, label: '04: Synthesizer Consensus' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAgentTab(tab.id)}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all border ${
              activeAgentTab === tab.id
                ? 'bg-ink-800 dark:bg-brass-500 text-ivory-50 dark:text-ink-950 border-ink-800 dark:border-brass-400 font-semibold'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-ink-900 dark:hover:text-ivory-100 hover:bg-ivory-200 dark:hover:bg-obsidian-200 hover:border-stone-200 dark:hover:border-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      {loading ? (
        <InvestigationLoader deviationId={selectedDeviationId} />
      ) : error ? (
        <div className="p-8 border border-crimson-300 dark:border-crimson-700 bg-crimson-50 dark:bg-crimson-900/30 text-crimson-800 dark:text-crimson-300 text-center space-y-3">
          <AlertTriangle className="w-6 h-6 mx-auto text-crimson-600 dark:text-crimson-400" />
          <h4 className="font-serif text-lg font-medium">Investigation Synthesis Failed</h4>
          <p className="font-sans text-xs text-crimson-700/80 dark:text-crimson-300/80">{error}</p>
          <Button variant="outline" size="sm" onClick={() => triggerInvestigation()}>
            Retry Examination
          </Button>
        </div>
      ) : investigationResult ? (
        <div className="space-y-8">
          {/* 3 Core Agent Dossiers */}
          {(activeAgentTab === 'ALL' || activeAgentTab !== 'SYNTHESIZER') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(activeAgentTab === 'ALL' || activeAgentTab === 'INVESTIGATOR') && (
                <AgentCard
                  finding={investigationResult.investigator}
                  onViewRecord={(id) => setSelectedRecordId(id)}
                />
              )}
              {(activeAgentTab === 'ALL' || activeAgentTab === 'SKEPTIC') && (
                <AgentCard
                  finding={investigationResult.skeptic}
                  onViewRecord={(id) => setSelectedRecordId(id)}
                />
              )}
              {(activeAgentTab === 'ALL' || activeAgentTab === 'AUDITOR') && (
                <AgentCard
                  finding={investigationResult.auditor}
                  onViewRecord={(id) => setSelectedRecordId(id)}
                />
              )}
            </div>
          )}

          {/* Stage 4 Synthesizer Recommendation: Official Disposition Memo */}
          {(activeAgentTab === 'ALL' || activeAgentTab === 'SYNTHESIZER') && (
            <div className="bg-ivory-50 dark:bg-obsidian-400 border-2 border-stone-400 dark:border-stone-700 p-6 sm:p-8 space-y-6 transition-colors">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-stone-300 dark:border-stone-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-300 font-bold border border-brass-300 dark:border-brass-700 bg-brass-50 dark:bg-brass-950/40 px-2 py-0.5">
                      Stage 04 &bull; Consensus Disposition
                    </span>
                    <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                      Inference Engine: {investigationResult.model_name || 'Llama 3.3 (Groq)'}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-ink-900 dark:text-ivory-100 tracking-tight">
                    Synthesizer Consensus Recommendation
                  </h3>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() =>
                    navigate(
                      `/recommendations?id=${investigationResult.recommendation_id || 'rec-seal-001'}`
                    )
                  }
                  icon={<UserCheck className="w-4 h-4" />}
                >
                  Open QA Approval Portal
                </Button>
              </div>

              {/* Summary Statement */}
              <div className="p-5 border border-stone-300 dark:border-stone-700 bg-ivory-100/70 dark:bg-obsidian-300/70 text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-sans space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block">
                  Consensus Root-Cause Finding
                </span>
                <p className="font-serif text-sm text-ink-900 dark:text-ivory-100">
                  {investigationResult.summary}
                </p>
              </div>

              {/* Proposed Actions Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                    Proposed Corrective Interventions & Historical Precedent Efficacy
                  </span>
                  <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                    Mandatory 21 CFR §211.192 verification
                  </span>
                </div>

                <div className="overflow-x-auto border border-stone-300 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-300 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-semibold">Action Classification</th>
                        <th className="py-2.5 px-4 font-semibold">Historical Precedent Status</th>
                        <th className="py-2.5 px-4 font-semibold">Supporting Precedent ID</th>
                        <th className="py-2.5 px-4 font-semibold">Monitoring Window</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-ink-800 dark:text-ivory-100">
                      {investigationResult.proposed_actions.map((act, i) => {
                        const isObj = typeof act === 'object' && act !== null;
                        const actionClass = isObj ? (act as any).action_class : act;
                        const status = isObj ? (act as any).historical_status : 'no_precedent';
                        const recIds = isObj ? (act as any).supporting_record_ids || [] : [];
                        const days = isObj ? (act as any).monitoring_days : null;

                        const isNoRecurrence =
                          status === 'associated_with_no_recurrence_in_recorded_monitoring';
                        const isRecurrence = status === 'recurrence_observed';

                        return (
                          <tr key={i} className="hover:bg-ivory-100/70 dark:hover:bg-obsidian-300/70">
                            <td className="py-3 px-4 font-medium text-ink-900 dark:text-ivory-100">
                              {actionClass}
                            </td>
                            <td className="py-3 px-4">
                              {isNoRecurrence ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 border border-forest-300 dark:border-forest-700 font-semibold">
                                  <CheckCircle2 className="w-3 h-3 text-forest-600 dark:text-forest-400" />
                                  Zero Recurrence Documented
                                </span>
                              ) : isRecurrence ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-crimson-50 dark:bg-crimson-900/30 text-crimson-700 dark:text-crimson-300 border border-crimson-300 dark:border-crimson-700 font-semibold">
                                  <AlertTriangle className="w-3 h-3 text-crimson-600 dark:text-crimson-400" />
                                  Recurrence Observed In Precedent
                                </span>
                              ) : (
                                <span className="text-stone-400 dark:text-stone-500 font-mono text-[11px]">
                                  No Prior Data
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {recIds.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {recIds.map((rId: string) => (
                                    <button
                                      key={rId}
                                      onClick={() => setSelectedRecordId(rId)}
                                      className="font-mono text-[10px] text-ink-800 dark:text-ivory-100 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 hover:border-ink-800 dark:hover:border-brass-400 px-1.5 py-0.5 inline-flex items-center gap-1 transition-colors"
                                    >
                                      <span>{rId}</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-stone-500 dark:text-stone-400" />
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-stone-400 dark:text-stone-500 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                              {days ? `${days} days` : '90 days standard'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Uncertainty Disclosures */}
              {investigationResult.uncertainty && investigationResult.uncertainty.length > 0 && (
                <div className="p-4 border border-stone-300 dark:border-stone-700 bg-ivory-100/60 dark:bg-obsidian-300/60 space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block">
                    Epistemic Uncertainty & Regulatory Boundary
                  </span>
                  <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-400 list-disc list-inside font-sans">
                    {investigationResult.uncertainty.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Precedent Detail Modal */}
      {viewedRecord && (
        <Modal
          isOpen={!!viewedRecord}
          onClose={() => setSelectedRecordId(null)}
          title={`Precedent Evidence — ${viewedRecord.source_record_id}`}
          description="Historical manufacturing record retrieved from Hindsight memory layer."
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 font-mono text-[11px]">
              <div>
                <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Record ID</span>
                <span className="font-bold text-ink-900 dark:text-ivory-100">{viewedRecord.source_record_id}</span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Equipment</span>
                <span className="text-stone-700 dark:text-stone-300">{viewedRecord.equipment_code || 'All Class'}</span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Outcome</span>
                <span className="font-semibold text-ink-900 dark:text-ivory-100">{viewedRecord.outcome}</span>
              </div>
            </div>

            <div className="space-y-1 p-3 border border-stone-200 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400">
              <span className="font-mono text-[10px] uppercase text-stone-500 dark:text-stone-400 font-semibold block">
                Action Class Applied
              </span>
              <p className="font-medium text-ink-900 dark:text-ivory-100">{viewedRecord.action_class}</p>
            </div>

            {viewedRecord.notes && (
              <div className="space-y-1 p-3 border border-stone-200 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400">
                <span className="font-mono text-[10px] uppercase text-stone-500 dark:text-stone-400 font-semibold block">
                  Field Observations & Recurrence Notes
                </span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{viewedRecord.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecordId(null)}>
                Close Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
