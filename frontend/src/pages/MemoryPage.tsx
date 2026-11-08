import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  RefreshCw,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { MemoryStatus, MemoryGovernanceResponse, MemorySyncStatus } from '../types';
import { Button } from '../components/common/Button';
import { SyntheticBadge } from '../components/common/Badge';
import { LayoutContextType } from '../components/layout/Layout';

export const MemoryPage: React.FC = () => {
  const { currentPlant } = useOutletContext<LayoutContextType>();

  const [governance, setGovernance] = useState<MemoryGovernanceResponse | null>(null);
  const [syncStatus, setSyncStatus] = useState<MemorySyncStatus | null>(null);
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Governance Toggle state
  const [governanceEnabled, setGovernanceEnabled] = useState(true);
  const [governanceActor, setGovernanceActor] = useState('Dr. Marcus Vance (QA Governance Lead)');
  const [governanceUpdating, setGovernanceUpdating] = useState(false);
  const [governanceMessage, setGovernanceMessage] = useState<string | null>(null);

  // Sync Trigger state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  // Retain Event form state
  const [retainSourceId, setRetainSourceId] = useState('HIN-REC-2026-LIVE');
  const [retainEventType, setRetainEventType] = useState('DEVIATION_INTERVENTION');
  const [retainActionClass, setRetainActionClass] = useState('gasket replacement with EPDM fluoropolymer');
  const [retainSubmitting, setRetainSubmitting] = useState(false);
  const [retainResponse, setRetainResponse] = useState<any | null>(null);

  useEffect(() => {
    loadMemoryData();
  }, [currentPlant]);

  const loadMemoryData = async () => {
    setLoading(true);
    try {
      const [govRes, syncRes, memRes] = await Promise.all([
        api.getMemoryGovernance(currentPlant),
        api.getMemorySyncStatus(),
        api.getMemoryStatus('dev-seal-001'),
      ]);
      setGovernance(govRes.data);
      setGovernanceEnabled(govRes.data.enabled);
      setSyncStatus(syncRes.data);
      setMemoryStatus(memRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGovernance = async (enabled: boolean) => {
    setGovernanceUpdating(true);
    setGovernanceMessage(null);
    try {
      const res = await api.setMemoryGovernance(currentPlant, enabled, governanceActor);
      setGovernance(res.data);
      setGovernanceEnabled(res.data.enabled);
      setGovernanceMessage(
        `Memory layer for ${currentPlant} is now ${enabled ? 'ENABLED' : 'DISABLED'}. Enforcement verified.`
      );
      setTimeout(() => setGovernanceMessage(null), 4000);
    } catch (err: any) {
      setGovernanceMessage(`Error: ${err?.message || 'Failed to update governance'}`);
    } finally {
      setGovernanceUpdating(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await api.triggerMemorySync();
      setSyncResult(res.data);
      const updated = await api.getMemorySyncStatus();
      setSyncStatus(updated.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetainSubmitting(true);
    try {
      const res = await api.memoryRetain({
        source_record_id: retainSourceId,
        event_type: retainEventType,
        plant_id: currentPlant,
        deviation_id: 'dev-seal-001',
        payload: {
          action_class: retainActionClass,
          outcome: 'VERIFIED_EFFECTIVE',
          monitoring_days: 90,
        },
        is_synthetic: true,
      });
      setRetainResponse(res.data);
      setTimeout(() => setRetainResponse(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setRetainSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Governance 09 &bull; AI Memory & Audit Provenance
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Facility: {currentPlant}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              AI Memory & Provenance Governance
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Transparent institutional memory controls. Authorize facility memory retrieval, monitor transactional outbox synchronization, and inspect empirical fact retention.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMemoryData}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Sync State
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Overview Ledger */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 divide-y sm:divide-y-0 sm:divide-x divide-stone-300 dark:divide-stone-800 grid grid-cols-1 sm:grid-cols-4 transition-colors">
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>Facility Status</span>
            <span className="text-brass-700 dark:text-brass-400 font-semibold">GATE</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-900 dark:text-ivory-100 pt-1">
            {governanceEnabled ? 'Active' : 'Muted'}
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
            Hindsight memory integration for {currentPlant}.
          </p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>Outbox Total</span>
            <span className="text-stone-700 dark:text-stone-300">LOGGED</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-900 dark:text-ivory-100 pt-1">
            {syncStatus?.total ?? 0}
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Total transactional events registered in queue.</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-forest-700 dark:text-forest-400 font-semibold">
            <span>Synced Events</span>
            <span className="text-forest-600 dark:text-forest-400">RECONCILED</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-forest-800 dark:text-forest-300 pt-1">
            {syncStatus?.synced ?? 0}
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Events synchronized into Hindsight knowledge graph.</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-crimson-700 dark:text-crimson-400 font-semibold">
            <span>Pending Sync</span>
            <span className="text-crimson-600 dark:text-crimson-400">IN QUEUE</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-crimson-800 dark:text-crimson-300 pt-1">
            {syncStatus?.pending ?? 0}
          </div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Outbox items awaiting worker reconciliation.</p>
        </div>
      </section>

      {/* Main Grid: Controls & Outbox Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Governance Controls & Outbox Engine */}
        <div className="lg:col-span-7 space-y-8">
          {/* Governance Switch Deck */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 sm:p-8 space-y-6 transition-colors">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
                Authorization Deck
              </span>
              <h3 className="font-serif text-xl font-medium text-ink-900 dark:text-ivory-100">
                Facility Memory Governance Authority
              </h3>
            </div>

            {governanceMessage && (
              <div className="p-3 border border-forest-300 dark:border-forest-700 bg-forest-50 dark:bg-forest-950/30 text-forest-800 dark:text-forest-300 text-xs font-mono">
                {governanceMessage}
              </div>
            )}

            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between p-4 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300">
                <div>
                  <div className="font-serif text-base font-semibold text-ink-900 dark:text-ivory-100">
                    Hindsight Recall Integration
                  </div>
                  <div className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
                    Permits 4-agent investigation studio to recall historical deviations and CAPAs for {currentPlant}.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateGovernance(!governanceEnabled)}
                    disabled={governanceUpdating}
                    className={`font-mono text-xs uppercase px-3 py-1.5 border transition-all ${
                      governanceEnabled
                        ? 'bg-forest-700 dark:bg-forest-600 text-ivory-50 border-forest-800 font-semibold'
                        : 'bg-ivory-50 dark:bg-obsidian-400 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    {governanceUpdating ? 'Updating...' : governanceEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Responsible QA Governance Officer
                </label>
                <input
                  type="text"
                  value={governanceActor}
                  onChange={(e) => setGovernanceActor(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                />
              </div>

              <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100/60 dark:bg-obsidian-300/60 font-mono text-[11px] text-stone-600 dark:text-stone-400 space-y-1">
                <div className="flex justify-between">
                  <span>Last Modified:</span>
                  <span className="text-ink-900 dark:text-ivory-100">
                    {governance?.updated_at ? new Date(governance.updated_at).toLocaleString() : 'System Default'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sign-Off Officer:</span>
                  <span className="text-ink-900 dark:text-ivory-100">{governance?.updated_by || governanceActor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Outbox Synchronization Terminal */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 sm:p-8 space-y-6 transition-colors">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
                  Transactional Queue
                </span>
                <h3 className="font-serif text-xl font-medium text-ink-900 dark:text-ivory-100">
                  Memory Outbox Synchronization
                </h3>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleTriggerSync}
                loading={syncing}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />}
              >
                Reconcile Outbox Now
              </Button>
            </div>

            <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              All quality events are captured in a local transactional outbox prior to asynchronous sync with Hindsight knowledge base to guarantee zero data loss during network disruptions (ACID compliance).
            </p>

            {syncResult && (
              <div className="p-4 border border-forest-300 dark:border-forest-700 bg-forest-50 dark:bg-forest-950/30 text-forest-900 dark:text-forest-200 font-mono text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-forest-700 dark:text-forest-300">
                  <CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-forest-400" />
                  Outbox Reconciliation Complete
                </div>
                <div>Processed: {syncResult.processed} | Synced: {syncResult.synced} | Failed: {syncResult.failed}</div>
                {syncResult.synthetic_note && (
                  <div className="text-[10px] text-forest-700 dark:text-forest-400">{syncResult.synthetic_note}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Retain Knowledge Form & Provenance */}
        <div className="lg:col-span-5 space-y-8">
          {/* Retain New Knowledge Event Form */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border-2 border-stone-400 dark:border-stone-700 p-6 space-y-5 transition-colors">
            <div className="border-b border-stone-300 dark:border-stone-800 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
                Memory Injection
              </span>
              <h3 className="font-serif text-lg font-medium text-ink-900 dark:text-ivory-100">
                Retain Verified Precedent
              </h3>
            </div>

            {retainResponse && (
              <div className="p-3 border border-forest-300 dark:border-forest-700 bg-forest-50 dark:bg-forest-950/30 text-forest-900 dark:text-forest-200 font-mono text-xs">
                <div>Status: {retainResponse.status}</div>
                <div>Event ID: {retainResponse.event_id}</div>
              </div>
            )}

            <form onSubmit={handleRetainSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Source Record Reference ID
                </label>
                <input
                  type="text"
                  value={retainSourceId}
                  onChange={(e) => setRetainSourceId(e.target.value)}
                  required
                  className="w-full px-3 py-2 font-mono text-xs bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Event Classification
                </label>
                <select
                  value={retainEventType}
                  onChange={(e) => setRetainEventType(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
                >
                  <option value="DEVIATION_INTERVENTION" className="dark:bg-obsidian-400">DEVIATION_INTERVENTION</option>
                  <option value="CAPA_EFFECTIVENESS_VERIFIED" className="dark:bg-obsidian-400">CAPA_EFFECTIVENESS_VERIFIED</option>
                  <option value="EQUIPMENT_QUALIFICATION" className="dark:bg-obsidian-400">EQUIPMENT_QUALIFICATION</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Corrective Action Classification
                </label>
                <input
                  type="text"
                  value={retainActionClass}
                  onChange={(e) => setRetainActionClass(e.target.value)}
                  required
                  className="w-full px-3 py-2 font-sans text-xs bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={retainSubmitting}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Retain Event to Knowledge Graph
              </Button>
            </form>
          </div>

          {/* Provenance Telemetry Card */}
          <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-6 space-y-3 font-mono text-xs transition-colors">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold block border-b border-stone-200 dark:border-stone-800 pb-2">
              Hindsight Adapter Telemetry
            </span>
            <div className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <span>Adapter:</span>
                <span className="text-ink-900 dark:text-ivory-100 font-semibold">{memoryStatus?.adapter || 'hindsight'}</span>
              </div>
              <div className="flex justify-between">
                <span>Deviation Scope:</span>
                <span className="text-ink-900 dark:text-ivory-100">{memoryStatus?.deviation_id || 'dev-seal-001'}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Status:</span>
                <span className="text-forest-700 dark:text-forest-400 font-semibold">{memoryStatus?.status || 'ready'}</span>
              </div>
              <div className="pt-2 text-[10px] text-stone-500 dark:text-stone-400 font-sans leading-relaxed border-t border-stone-200 dark:border-stone-800">
                {memoryStatus?.note || 'Hindsight knowledge graph adapter online.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
