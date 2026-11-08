import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { HistoricalEvidenceRecord } from '../types';
import { Button } from '../components/common/Button';
import { OutcomeBadge, SyntheticBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LayoutContextType } from '../components/layout/Layout';

export const PrecedentsPage: React.FC = () => {
  const { currentPlant } = useOutletContext<LayoutContextType>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const devIdParam = searchParams.get('id') || 'dev-seal-001';

  const [records, setRecords] = useState<HistoricalEvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  // Selected precedent detail modal
  const [selectedRecord, setSelectedRecord] = useState<HistoricalEvidenceRecord | null>(null);

  // Reflection Engine Interactive Console
  const [reflectionInput, setReflectionInput] = useState('seal integrity failure');
  const [reflectionResult, setReflectionResult] = useState<any | null>(null);
  const [reflecting, setReflecting] = useState(false);

  useEffect(() => {
    loadPrecedents(devIdParam);
  }, [devIdParam, currentPlant]);

  const loadPrecedents = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getPrecedents(id);
      setRecords(res.records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    setReflecting(true);
    try {
      const res = await api.memoryReflect({
        plant_id: currentPlant,
        failure_mode: reflectionInput,
      });
      setReflectionResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setReflecting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.source_record_id.toLowerCase().includes(q) ||
      r.action_class.toLowerCase().includes(q) ||
      (r.equipment_code && r.equipment_code.toLowerCase().includes(q)) ||
      (r.failure_mode && r.failure_mode.toLowerCase().includes(q)) ||
      (r.notes && r.notes.toLowerCase().includes(q));

    const matchesOutcome = outcomeFilter === 'ALL' || r.outcome === outcomeFilter;
    return matchesSearch && matchesOutcome;
  });

  const verifiedCount = records.filter((r) => r.outcome === 'VERIFIED_EFFECTIVE').length;
  const recurrenceCount = records.filter((r) => r.outcome === 'RECURRENCE_OBSERVED').length;

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Archive 05 &bull; Precedent Registry
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Target Deviation: {devIdParam}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              Historical Precedents & Evidence Archive
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Empirical historical knowledge base. Inspect verified effective corrective actions versus failed interventions across past manufacturing campaigns to prevent recurrent failure modes.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPrecedents(devIdParam)}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh Records
            </Button>
          </div>
        </div>
      </section>

      {/* Summary KPI Ledger */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 divide-y sm:divide-y-0 sm:divide-x divide-stone-300 dark:divide-stone-800 grid grid-cols-1 sm:grid-cols-3 transition-colors">
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-widest">
            <span>Total Precedents Indexed</span>
            <span className="text-brass-700 dark:text-brass-400">TOTAL</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-900 dark:text-ivory-100 pt-1">{records.length}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Historical deviation dossiers in active memory registry.</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] text-forest-700 dark:text-forest-400 uppercase tracking-widest font-semibold">
            <span>Verified Effective Precedents</span>
            <span className="text-forest-600 dark:text-forest-400">ZERO RECURRENCE</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-forest-800 dark:text-forest-300 pt-1">{verifiedCount}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Confirmed positive interventions with 90-180d efficacy.</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] text-crimson-700 dark:text-crimson-400 uppercase tracking-widest font-semibold">
            <span>Documented Recurrence Failures</span>
            <span className="text-crimson-600 dark:text-crimson-400">RISK WARNING</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-crimson-800 dark:text-crimson-300 pt-1">{recurrenceCount}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Past interventions that resulted in repeated failure modes.</p>
        </div>
      </section>

      {/* Filter Ledger Bar */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-4 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by precedent record ID, action class, equipment code, or notes..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 placeholder-stone-400"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
            >
              <option value="ALL">Outcome: All Precedents</option>
              <option value="VERIFIED_EFFECTIVE">Verified Effective (Zero Recurrence)</option>
              <option value="RECURRENCE_OBSERVED">Recurrence Observed (Failed)</option>
              <option value="INCONCLUSIVE">Inconclusive</option>
              <option value="NOT_ASSESSED">Not Assessed</option>
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
          <div>
            Showing <span className="font-semibold text-ink-900 dark:text-ivory-100">{filteredRecords.length}</span> of {records.length} historical records
          </div>
          {(searchQuery || outcomeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setOutcomeFilter('ALL');
              }}
              className="text-brass-700 dark:text-brass-400 hover:underline uppercase text-[10px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Main Records Table */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-300 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Precedent Record ID</th>
                <th className="py-3 px-4 font-semibold">Equipment & Failure Mode</th>
                <th className="py-3 px-4 font-semibold">Corrective Intervention Class</th>
                <th className="py-3 px-4 font-semibold">Outcome Verification</th>
                <th className="py-3 px-4 font-semibold">Monitoring</th>
                <th className="py-3 px-4 font-semibold text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-ink-800 dark:text-ivory-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500 dark:text-stone-400 font-mono text-xs">
                    No historical precedent records match search parameters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.source_record_id} className="hover:bg-ivory-200/50 dark:hover:bg-obsidian-300/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-ink-900 dark:text-ivory-50">
                      {r.source_record_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-stone-800 dark:text-stone-200 font-medium">{r.equipment_code || 'General'}</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-sans truncate max-w-xs">{r.failure_mode}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink-900 dark:text-ivory-100 max-w-xs">
                      {r.action_class}
                    </td>
                    <td className="py-3.5 px-4">
                      <OutcomeBadge outcome={r.outcome} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                      {r.monitoring_days ? `${r.monitoring_days} days` : 'Standard 90d'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 text-stone-700 dark:text-stone-300 hover:text-ink-900 dark:hover:text-ivory-50 hover:border-ink-800 dark:hover:border-brass-400 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Institutional Memory Reflection Console */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border-2 border-stone-400 dark:border-stone-700 p-6 sm:p-8 space-y-6 transition-colors">
        <div className="border-b border-stone-300 dark:border-stone-800 pb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold block">
            Archival Console &bull; Memory Reflect
          </span>
          <h3 className="font-serif text-2xl font-medium text-ink-900 dark:text-ivory-100">
            Institutional Memory Reflection Engine
          </h3>
          <p className="font-sans text-xs text-stone-600 dark:text-stone-400 mt-1">
            Query the Hindsight memory adapter to isolate high-confidence verified interventions versus past recurrent pitfalls.
          </p>
        </div>

        <form onSubmit={handleRunReflection} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={reflectionInput}
            onChange={(e) => setReflectionInput(e.target.value)}
            placeholder="Enter failure mode or process condition (e.g. seal integrity failure, autoclave seal leak)..."
            required
            className="flex-1 px-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
          />
          <Button type="submit" variant="primary" size="md" loading={reflecting}>
            Execute Memory Reflection
          </Button>
        </form>

        {reflectionResult && (
          <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Verified Interventions */}
              <div className="p-4 border border-forest-300 dark:border-forest-700 bg-forest-50/50 dark:bg-forest-950/20 space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-forest-700 dark:text-forest-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
                  Verified Historical Interventions
                </span>
                <ul className="space-y-2 text-xs font-sans text-forest-900 dark:text-forest-200">
                  {reflectionResult.verified_interventions?.map((item: any, i: number) => (
                    <li key={i} className="p-2 border border-forest-200 dark:border-forest-800 bg-ivory-50/90 dark:bg-obsidian-400/90 space-y-0.5">
                      <div className="font-medium text-ink-900 dark:text-ivory-100">{item.action_class}</div>
                      <div className="font-mono text-[10px] text-stone-500 dark:text-stone-400 flex justify-between">
                        <span>Record: {item.supporting_record_id}</span>
                        <span className="text-forest-700 dark:text-forest-400">{item.monitoring_days}d zero recurrence</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Failed Interventions */}
              <div className="p-4 border border-crimson-300 dark:border-crimson-700 bg-crimson-50/50 dark:bg-crimson-950/20 space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-crimson-700 dark:text-crimson-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-crimson-600 dark:text-crimson-400" />
                  Documented Recurrence Hazards
                </span>
                <ul className="space-y-2 text-xs font-sans text-crimson-900 dark:text-crimson-200">
                  {reflectionResult.failed_interventions?.map((item: any, i: number) => (
                    <li key={i} className="p-2 border border-crimson-200 dark:border-crimson-800 bg-ivory-50/90 dark:bg-obsidian-400/90 space-y-0.5">
                      <div className="font-medium text-ink-900 dark:text-ivory-100">{item.action_class}</div>
                      <div className="font-mono text-[10px] text-stone-500 dark:text-stone-400 flex justify-between">
                        <span>Record: {item.supporting_record_id}</span>
                        <span className="text-crimson-700 dark:text-crimson-400">
                          Recurrence observed within {item.monitoring_days}d
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Reflection Uncertainty Disclosures */}
            {reflectionResult.uncertainty && (
              <div className="p-3 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 font-sans text-xs text-stone-600 dark:text-stone-400 space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block">
                  Scientific Uncertainty Notice
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {reflectionResult.uncertainty.map((u: string, idx: number) => (
                    <li key={idx}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Historical Precedent — ${selectedRecord.source_record_id}`}
          description="Archival quality record retrieved from institutional memory."
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 font-mono">
              <div>
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Record ID</span>
                <span className="font-bold text-ink-900 dark:text-ivory-100">{selectedRecord.source_record_id}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Equipment</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">{selectedRecord.equipment_code || 'All Class'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Outcome</span>
                <div className="mt-0.5">
                  <OutcomeBadge outcome={selectedRecord.outcome} />
                </div>
              </div>
            </div>

            <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400 space-y-1">
              <span className="font-mono text-[10px] uppercase text-stone-500 dark:text-stone-400 font-semibold block">
                Corrective Action Class
              </span>
              <p className="font-medium text-ink-900 dark:text-ivory-100">{selectedRecord.action_class}</p>
            </div>

            {selectedRecord.notes && (
              <div className="p-3 border border-stone-200 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400 space-y-1">
                <span className="font-mono text-[10px] uppercase text-stone-500 dark:text-stone-400 font-semibold block">
                  Archival Investigation Observations
                </span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{selectedRecord.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
