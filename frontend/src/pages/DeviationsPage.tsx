import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  FileSearch,
} from 'lucide-react';
import { api } from '../services/api';
import { Deviation, Severity } from '../types';
import { Button } from '../components/common/Button';
import { SeverityBadge, StatusBadge, SyntheticBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LayoutContextType } from '../components/layout/Layout';

export const DeviationsPage: React.FC = () => {
  const { currentPlant, openNewDeviationModal } = useOutletContext<LayoutContextType>();
  const navigate = useNavigate();

  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail Modal State
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);

  // Quick CAPA modal state
  const [capaModalDev, setCapaModalDev] = useState<Deviation | null>(null);
  const [capaActionClass, setCapaActionClass] = useState('component upgrade / material change');
  const [capaDescription, setCapaDescription] = useState('');
  const [capaLoading, setCapaLoading] = useState(false);
  const [capaSuccess, setCapaSuccess] = useState(false);

  useEffect(() => {
    fetchDeviations();
  }, [currentPlant]);

  const fetchDeviations = async () => {
    setLoading(true);
    try {
      const res = await api.getDeviations(currentPlant);
      setDeviations(res.data);
    } catch (err) {
      console.error('Failed to load deviations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capaModalDev) return;
    setCapaLoading(true);
    try {
      await api.createCapa(capaModalDev.id, capaActionClass, capaDescription);
      setCapaSuccess(true);
      setTimeout(() => {
        setCapaSuccess(false);
        setCapaModalDev(null);
        setCapaDescription('');
      }, 1200);
    } catch (err) {
      console.error('Failed to create CAPA', err);
    } finally {
      setCapaLoading(false);
    }
  };

  const filteredDeviations = deviations.filter((dev) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      dev.id.toLowerCase().includes(q) ||
      dev.failure_mode.toLowerCase().includes(q) ||
      dev.equipment_code.toLowerCase().includes(q) ||
      dev.line.toLowerCase().includes(q) ||
      dev.description.toLowerCase().includes(q);

    const matchesSeverity = severityFilter === 'ALL' || dev.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || dev.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Register 02 &bull; Quality Deviations
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Facility: {currentPlant}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              Deviations Registry
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Official pharmaceutical non-conformance registry. Filter batch anomalies, inspect root-cause hypotheses, and initiate autonomous multi-agent precedent recall.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeviations}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
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

      {/* Filter Ledger Bar */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-4 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Field */}
          <div className="md:col-span-6 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by deviation ID, equipment code, failure mode, or line..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 placeholder-stone-400 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
            />
          </div>

          {/* Severity Filter */}
          <div className="md:col-span-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
            >
              <option value="ALL">Severity: All Levels</option>
              <option value="critical">Critical (Quarantine)</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
            >
              <option value="ALL">Status: All States</option>
              <option value="open">Open / Unreviewed</option>
              <option value="investigating">Investigating</option>
              <option value="reviewed">Reviewed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
          <div>
            Showing <span className="font-semibold text-ink-800 dark:text-ivory-100">{filteredDeviations.length}</span> of {deviations.length} records
          </div>
          {(searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-brass-700 dark:text-brass-400 hover:underline uppercase text-[10px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Primary Registry Table */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-300 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Deviation ID & Date</th>
                <th className="py-3 px-4 font-semibold">Production Line</th>
                <th className="py-3 px-4 font-semibold">Equipment Code</th>
                <th className="py-3 px-4 font-semibold">Failure Mode & Synopsis</th>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-ink-800 dark:text-ivory-100">
              {filteredDeviations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500 dark:text-stone-400 font-mono text-xs">
                    No matching deviation records found in facility registry.
                  </td>
                </tr>
              ) : (
                filteredDeviations.map((dev) => (
                  <tr key={dev.id} className="hover:bg-ivory-200/50 dark:hover:bg-obsidian-300/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-ink-900 dark:text-ivory-50">{dev.id}</div>
                      <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {dev.created_at ? new Date(dev.created_at).toLocaleDateString() : 'Active'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-stone-700 dark:text-stone-300">{dev.line}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-stone-800 dark:text-stone-200">
                      {dev.equipment_code}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-ink-900 dark:text-ivory-100 truncate">{dev.failure_mode}</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5" title={dev.description}>
                        {dev.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={dev.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={dev.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDeviation(dev)}
                          className="font-mono text-[10px] uppercase text-stone-600 dark:text-stone-300 hover:text-ink-900 dark:hover:text-ivory-50 border border-stone-300 dark:border-stone-700 hover:border-ink-800 dark:hover:border-brass-400 px-2 py-1 bg-ivory-100 dark:bg-obsidian-300 transition-colors"
                          title="Inspect deviation dossier"
                        >
                          Dossier
                        </button>
                        <button
                          onClick={() => navigate(`/investigation?id=${dev.id}`)}
                          className="font-mono text-[10px] uppercase text-ivory-50 dark:text-ink-950 bg-ink-800 dark:bg-brass-500 hover:bg-ink-900 dark:hover:bg-brass-600 px-2.5 py-1 font-semibold transition-colors flex items-center gap-1"
                        >
                          Investigate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
          <span>PRECEDENT Non-Conformance Ledger</span>
          <span>Regulatory Specification: 21 CFR §211.192</span>
        </div>
      </section>

      {/* Selected Deviation Dossier Modal */}
      {selectedDeviation && (
        <Modal
          isOpen={!!selectedDeviation}
          onClose={() => setSelectedDeviation(null)}
          title={`Deviation Dossier — ${selectedDeviation.id}`}
          description={`Full non-conformance record for ${selectedDeviation.line} (${selectedDeviation.equipment_code})`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Metadata Ledger */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border border-stone-200 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 font-mono">
              <div>
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Severity</span>
                <div className="mt-1">
                  <SeverityBadge severity={selectedDeviation.severity} />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedDeviation.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Equipment</span>
                <div className="mt-1 font-bold text-ink-900 dark:text-ivory-50">{selectedDeviation.equipment_code}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400 block">Plant / Line</span>
                <div className="mt-1 font-medium text-stone-700 dark:text-stone-300">
                  {selectedDeviation.plant_id} &bull; {selectedDeviation.line}
                </div>
              </div>
            </div>

            {/* Failure Mode & Observation */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block">
                Observed Non-Conformance Details
              </span>
              <div className="p-4 border border-stone-200 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400 space-y-2">
                <div className="font-serif text-base font-semibold text-ink-900 dark:text-ivory-100">
                  {selectedDeviation.failure_mode}
                </div>
                <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {selectedDeviation.description}
                </p>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCapaModalDev(selectedDeviation);
                  setSelectedDeviation(null);
                }}
                icon={<ClipboardList className="w-3.5 h-3.5" />}
              >
                Create Immediate CAPA
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/inspector?id=${selectedDeviation.id}`);
                  }}
                  icon={<FileSearch className="w-3.5 h-3.5" />}
                >
                  Audit Check
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    navigate(`/investigation?id=${selectedDeviation.id}`);
                  }}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Run 4-Agent Investigation
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick CAPA Creation Modal */}
      {capaModalDev && (
        <Modal
          isOpen={!!capaModalDev}
          onClose={() => setCapaModalDev(null)}
          title="Initiate Corrective & Preventive Action"
          description={`Formulate CAPA for deviation ${capaModalDev.id} (${capaModalDev.failure_mode})`}
          maxWidth="lg"
        >
          {capaSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 border border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">CAPA Program Initiated</h4>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
                Action program logged into tracking ledger. Proceeding to CAPA Registry...
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreateCapa} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Corrective Action Classification
                </label>
                <select
                  value={capaActionClass}
                  onChange={(e) => setCapaActionClass(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
                >
                  <option value="component upgrade / material change">
                    Component upgrade / material change
                  </option>
                  <option value="preventive maintenance frequency increase">
                    Preventive maintenance frequency increase
                  </option>
                  <option value="recalibration / sensor replacement">
                    Recalibration / sensor replacement
                  </option>
                  <option value="SOP revision & engineering interlock">
                    SOP revision & engineering interlock
                  </option>
                  <option value="operator retraining">
                    Operator retraining (high historical recurrence risk)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Intervention Description & Scope
                </label>
                <textarea
                  value={capaDescription}
                  onChange={(e) => setCapaDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Detail engineering modification, maintenance schedule, or supplier replacement specifications..."
                  className="w-full px-3 py-2 text-xs font-sans bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setCapaModalDev(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={capaLoading}>
                  Authorize CAPA Program
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
