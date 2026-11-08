import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Search,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { Capa, Deviation } from '../types';
import { Button } from '../components/common/Button';
import { StatusBadge, SyntheticBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LayoutContextType } from '../components/layout/Layout';

export const CapaPage: React.FC = () => {
  const { currentPlant } = useOutletContext<LayoutContextType>();
  const navigate = useNavigate();

  const [capas, setCapas] = useState<Capa[]>([]);
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New CAPA Modal
  const [isNewCapaOpen, setIsNewCapaOpen] = useState(false);
  const [newDevId, setNewDevId] = useState('');
  const [newActionClass, setNewActionClass] = useState('component upgrade / material change');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentPlant]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [capaRes, devRes] = await Promise.all([
        api.getCapas(),
        api.getDeviations(currentPlant),
      ]);
      setCapas(capaRes.data);
      setDeviations(devRes.data);
      if (devRes.data.length > 0) {
        setNewDevId(devRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) {
      setFormError('CAPA description is required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createCapa(newDevId, newActionClass, newDescription.trim());
      setIsNewCapaOpen(false);
      setNewDescription('');
      loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create CAPA');
    } finally {
      setSubmitting(false);
    }
  };

  const proposedCount = capas.filter((c) => c.status === 'proposed').length;
  const implementedCount = capas.filter((c) => c.status === 'implemented').length;
  const assessedCount = capas.filter((c) => c.status === 'assessed').length;

  const filteredCapas = capas.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(q) ||
      c.deviation_id.toLowerCase().includes(q) ||
      c.action_class.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-400 px-2 py-0.5">
                Register 06 &bull; Corrective & Preventive Actions
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Facility: {currentPlant}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              CAPA Management Registry
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Structured action registry, engineering ownership, implementation milestones, and mandatory 21 CFR §211.192 effectiveness monitoring records.
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
              Sync Ledger
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewCapaOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Initiate CAPA
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Ledger */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 divide-y sm:divide-y-0 sm:divide-x divide-stone-300 dark:divide-stone-800 grid grid-cols-1 sm:grid-cols-3 transition-colors">
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">
            <span>Proposed Programs</span>
            <span className="text-brass-700 dark:text-brass-400 font-semibold">STAGE 1</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-900 dark:text-ivory-100 pt-1">{proposedCount}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Under engineering review & awaiting execution.</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-forest-700 dark:text-forest-400 font-semibold">
            <span>Implemented Interventions</span>
            <span className="text-forest-600 dark:text-forest-400 font-semibold">STAGE 2</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-forest-800 dark:text-forest-300 pt-1">{implementedCount}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Completed on lines; pending effectiveness check.</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">
            <span>Effectiveness Assessed</span>
            <span className="text-stone-700 dark:text-stone-300 font-semibold">STAGE 3</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-900 dark:text-ivory-100 pt-1">{assessedCount}</div>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">Longitudinal monitoring completed & recorded.</p>
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
              placeholder="Search by CAPA ID, deviation ID, action class, or description..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 placeholder-stone-400"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
            >
              <option value="ALL">Status: All Programs</option>
              <option value="proposed">Proposed</option>
              <option value="implemented">Implemented</option>
              <option value="assessed">Assessed</option>
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
          <div>
            Showing <span className="font-semibold text-ink-900 dark:text-ivory-100">{filteredCapas.length}</span> of {capas.length} CAPA records
          </div>
          {(searchQuery || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="text-brass-700 dark:text-brass-400 hover:underline uppercase text-[10px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Main CAPA Registry Table */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-300 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">CAPA Program ID</th>
                <th className="py-3 px-4 font-semibold">Linked Deviation</th>
                <th className="py-3 px-4 font-semibold">Action Classification</th>
                <th className="py-3 px-4 font-semibold">Program Description & Scope</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-ink-800 dark:text-ivory-100">
              {filteredCapas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500 dark:text-stone-400 font-mono text-xs">
                    No matching CAPA program records found.
                  </td>
                </tr>
              ) : (
                filteredCapas.map((capa) => (
                  <tr key={capa.id} className="hover:bg-ivory-200/50 dark:hover:bg-obsidian-300/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-ink-900 dark:text-ivory-50">
                      {capa.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-brass-700 dark:text-brass-400 font-medium">
                      {capa.deviation_id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink-900 dark:text-ivory-100">
                      {capa.action_class}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="truncate text-stone-700 dark:text-stone-300" title={capa.description}>
                        {capa.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={capa.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/effectiveness?capa=${capa.id}`)}
                        className="font-mono text-[10px] uppercase text-ink-800 dark:text-brass-400 hover:text-brass-700 dark:hover:text-brass-300 border-b border-ink-800 dark:border-brass-400 hover:border-brass-700 pb-0.5 font-semibold inline-flex items-center gap-1"
                      >
                        Effectiveness Check
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* New CAPA Modal */}
      {isNewCapaOpen && (
        <Modal
          isOpen={isNewCapaOpen}
          onClose={() => setIsNewCapaOpen(false)}
          title="Register New CAPA Program"
          description="Formulate an auditable Corrective & Preventive Action program under 21 CFR §211.192."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateCapa} className="space-y-4 text-xs font-sans">
            {formError && (
              <div className="p-3 border border-crimson-300 dark:border-crimson-700 bg-crimson-50 dark:bg-crimson-900/30 text-crimson-800 dark:text-crimson-300 font-mono">
                {formError}
              </div>
            )}

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                Associated Deviation Record
              </label>
              <select
                value={newDevId}
                onChange={(e) => setNewDevId(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
              >
                {deviations.map((d) => (
                  <option key={d.id} value={d.id} className="dark:bg-obsidian-400">
                    {d.id} — [{d.severity.toUpperCase()}] {d.equipment_code} ({d.failure_mode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                Action Classification Taxonomy
              </label>
              <select
                value={newActionClass}
                onChange={(e) => setNewActionClass(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
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
                  Operator retraining (caution: elevated historical recurrence)
                </option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                Intervention Scope & Technical Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={4}
                required
                placeholder="State specific engineering action, revision ID, replacement lot, and qualification criteria..."
                className="w-full px-3 py-2 font-sans bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewCapaOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Authorize & Register CAPA
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
