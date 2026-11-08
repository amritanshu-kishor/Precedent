import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { api } from '../../services/api';
import { Deviation, DeviationCreate, Severity } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface NewDeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  onDeviationCreated?: (newDev: Deviation) => void;
}

export const NewDeviationModal: React.FC<NewDeviationModalProps> = ({
  isOpen,
  onClose,
  plantId,
  onDeviationCreated,
}) => {
  const [line, setLine] = useState('Line 3');
  const [equipmentCode, setEquipmentCode] = useState('SEAL-02');
  const [failureMode, setFailureMode] = useState('seal integrity failure');
  const [severity, setSeverity] = useState<Severity>('high');
  const [description, setDescription] = useState(
    'Seal integrity pressure decay test failed during routine sanitation inspection. Liquid seepage detected.'
  );
  const [isSynthetic, setIsSynthetic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload: DeviationCreate = {
        plant_id: plantId,
        line: line.trim(),
        equipment_code: equipmentCode.trim(),
        failure_mode: failureMode.trim(),
        severity,
        description: description.trim(),
        is_synthetic: isSynthetic,
      };

      const result = await api.createDeviation(payload);
      setSuccess(true);
      if (onDeviationCreated) {
        onDeviationCreated(result.data);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to create deviation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Quality Deviation Record"
      description={`Entry registration for GMP facility ${plantId}. Will initiate autonomous precedent investigation.`}
      maxWidth="lg"
    >
      {success ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-10 h-10 border border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">Deviation Registered</h4>
          <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
            Audit trail entry recorded. Precedent investigation workflow initialized.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 border border-crimson-300 dark:border-crimson-700 bg-crimson-50 dark:bg-crimson-900/30 text-crimson-800 dark:text-crimson-300 text-xs font-mono">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                Production Line
              </label>
              <input
                type="text"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                placeholder="e.g. Line 3"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                Equipment Identifier
              </label>
              <input
                type="text"
                value={equipmentCode}
                onChange={(e) => setEquipmentCode(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                placeholder="e.g. SEAL-02"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                Observed Failure Mode
              </label>
              <input
                type="text"
                value={failureMode}
                onChange={(e) => setFailureMode(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400"
                placeholder="e.g. seal integrity failure"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                Initial Severity Assessment
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full px-3 py-2 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 cursor-pointer"
              >
                <option value="low" className="dark:bg-obsidian-400">LOW — Minor process variation</option>
                <option value="medium" className="dark:bg-obsidian-400">MEDIUM — Non-critical threshold breach</option>
                <option value="high" className="dark:bg-obsidian-400">HIGH — Serious sterility/impact potential</option>
                <option value="critical" className="dark:bg-obsidian-400">CRITICAL — Immediate lot quarantine required</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
              Objective Observation / Evidence Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 text-xs font-sans bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-800 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-400 leading-relaxed"
              placeholder="State observed physical evidence, sensor readouts, lot numbers, and containment measures taken..."
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-stone-200 dark:border-stone-800">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-600 dark:text-stone-400 font-sans">
              <input
                type="checkbox"
                checked={isSynthetic}
                onChange={(e) => setIsSynthetic(e.target.checked)}
                className="border-stone-300 dark:border-stone-700 text-ink-800 dark:text-brass-500 focus:ring-ink-800"
              />
              <span className="font-mono text-[11px]">Tag as Synthetic Validation Record</span>
            </label>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading}>
                File Deviation
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
