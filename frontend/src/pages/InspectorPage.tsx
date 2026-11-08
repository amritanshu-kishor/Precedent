import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileSearch,
} from 'lucide-react';
import { api } from '../services/api';
import { InspectorOut, Deviation } from '../types';
import { Button } from '../components/common/Button';
import { SyntheticBadge } from '../components/common/Badge';
import { LayoutContextType } from '../components/layout/Layout';

export const InspectorPage: React.FC = () => {
  const { currentPlant } = useOutletContext<LayoutContextType>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramDevId = searchParams.get('id') || 'dev-seal-001';

  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [selectedDevId, setSelectedDevId] = useState(paramDevId);
  const [inspectorData, setInspectorData] = useState<InspectorOut | null>(null);
  const [loading, setLoading] = useState(true);

  // Checkbox verification states for questions
  const [verifiedQuestions, setVerifiedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadDeviations();
  }, [currentPlant]);

  useEffect(() => {
    if (selectedDevId) {
      loadInspection(selectedDevId);
    }
  }, [selectedDevId]);

  const loadDeviations = async () => {
    try {
      const res = await api.getDeviations(currentPlant);
      setDeviations(res.data);
      if (res.data.length > 0 && !selectedDevId) {
        setSelectedDevId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadInspection = async (devId: string) => {
    setLoading(true);
    try {
      const res = await api.getInspectorReview(devId);
      setInspectorData(res.data);
      setVerifiedQuestions({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setVerifiedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const currentDev = deviations.find((d) => d.id === selectedDevId);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <section className="border-b border-stone-300 dark:border-stone-800 pb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border border-brass-300 dark:border-brass-700 bg-ivory-50 dark:bg-obsidian-300 px-2 py-0.5">
                Audit 10 &bull; Regulatory Readiness & Interrogation
              </span>
              <SyntheticBadge />
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Protocol: FDA 21 CFR §211 / EU Annex 11
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ivory-50">
              Inspector & Regulatory Audit Workspace
            </h1>

            <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              Pre-audit interrogation simulator. Stress-tests deviation dossiers against regulatory scrutiny, verifies physical evidentiary traceability, and exposes documentation gaps.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Export / Print Dossier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadInspection(selectedDevId)}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Re-Evaluate
            </Button>
          </div>
        </div>
      </section>

      {/* Target Deviation Selector */}
      <section className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
            Audit Target Deviation:
          </span>
          <select
            value={selectedDevId}
            onChange={(e) => setSelectedDevId(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono bg-ivory-100 dark:bg-obsidian-300 border border-stone-300 dark:border-stone-700 text-ink-900 dark:text-ivory-100 focus:outline-none focus:border-ink-800 dark:focus:border-brass-500 cursor-pointer"
          >
            {deviations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} — [{d.severity.toUpperCase()}] {d.equipment_code} ({d.failure_mode})
              </option>
            ))}
          </select>
        </div>

        {currentDev && (
          <div className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
            Line: <span className="text-ink-800 dark:text-ivory-200 font-semibold">{currentDev.line}</span> &bull; Severity:{' '}
            <span className="uppercase text-ink-800 dark:text-ivory-200 font-semibold">{currentDev.severity}</span>
          </div>
        )}
      </section>

      {/* Primary Formal Audit Dossier Container */}
      <div className="bg-ivory-50 dark:bg-obsidian-400 border-2 border-stone-400 dark:border-stone-700 p-6 sm:p-10 space-y-8 shadow-editorial">
        {/* Formal Header */}
        <div className="border-b-2 border-ink-800 dark:border-ivory-300 pb-5 space-y-3">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
            <span>OFFICIAL REGULATORY INSPECTION ADVISORY REVIEW</span>
            <span className="text-brass-700 dark:text-brass-400 font-semibold">FORM FDA-483-SIM</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-stone-300 dark:border-stone-800 font-mono text-xs">
            <div>
              <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Inspection Target</span>
              <span className="font-bold text-ink-900 dark:text-ivory-100">{selectedDevId}</span>
            </div>
            <div>
              <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Facility Code</span>
              <span className="font-bold text-brass-700 dark:text-brass-400">{currentPlant}</span>
            </div>
            <div>
              <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Compliance Mandate</span>
              <span className="font-semibold text-ink-900 dark:text-ivory-100">21 CFR §211.192</span>
            </div>
            <div>
              <span className="text-stone-400 dark:text-stone-500 block text-[9px] uppercase">Review Mode</span>
              <span className="text-stone-700 dark:text-stone-300 font-semibold">Pre-Audit Advisory</span>
            </div>
          </div>

          <div className="font-serif text-2xl font-medium text-ink-900 dark:text-ivory-100 tracking-tight pt-1">
            Documentation Traceability & Objective Evidence Audit
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-stone-500 dark:text-stone-400">
            Synthesizing regulatory inspection review criteria...
          </div>
        ) : !inspectorData ? (
          <div className="py-8 text-center text-stone-500 dark:text-stone-400 text-xs font-mono">
            No inspection records returned for this deviation.
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Regulatory Interrogation Checklist */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
                  1.0 &bull; Regulatory Interrogation Protocol
                </span>
                <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                  Click to mark verified in dossier
                </span>
              </div>

              <div className="space-y-2">
                {inspectorData.questions?.map((q, idx) => {
                  const isChecked = !!verifiedQuestions[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleQuestion(idx)}
                      className={`p-4 border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'border-forest-300 bg-forest-50/70 text-forest-900 dark:border-forest-700 dark:bg-forest-900/30 dark:text-forest-300'
                          : 'border-stone-300 bg-ivory-100/70 text-ink-900 hover:border-stone-400 dark:border-stone-800 dark:bg-obsidian-300/70 dark:text-ivory-100 dark:hover:border-stone-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div
                        className="mt-1 border-stone-300 dark:border-stone-600 text-ink-800 dark:bg-obsidian-200 dark:text-brass-500 focus:ring-ink-800 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="font-serif text-sm font-medium leading-snug">
                          {q}
                        </div>
                        <div className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                          {isChecked ? 'Marked Verified by Auditor' : 'Pending objective evidentiary attachment'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. Documentation Gaps Identified */}
            <section className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-crimson-700 dark:text-crimson-400 font-semibold block">
                2.0 &bull; Identified Documentation Gaps & Evidentiary Vulnerabilities
              </span>

              {inspectorData.documentation_gaps && inspectorData.documentation_gaps.length > 0 ? (
                <div className="p-4 border border-crimson-300 bg-crimson-50/60 dark:border-crimson-800 dark:bg-crimson-950/40 space-y-2">
                  <div className="font-mono text-[11px] text-crimson-800 dark:text-crimson-300 font-semibold">
                    Warning: Inspector citation risk prior to formal close-out
                  </div>
                  <ul className="space-y-1.5 text-xs text-crimson-900 dark:text-crimson-200 list-disc list-inside font-sans">
                    {inspectorData.documentation_gaps.map((gap, i) => (
                      <li key={i} className="leading-relaxed">{gap}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-4 border border-forest-300 bg-forest-50 text-forest-900 dark:border-forest-800 dark:bg-forest-950/40 dark:text-forest-300 text-xs font-mono">
                  Zero critical documentation gaps detected. All primary attachments verified.
                </div>
              )}
            </section>

            {/* 3. Supporting Evidence Records & Lineage */}
            <section className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold block">
                3.0 &bull; Evidentiary Precedent Traceability Records
              </span>

              <div className="p-4 border border-stone-300 bg-ivory-100 dark:border-stone-800 dark:bg-obsidian-300 font-mono text-xs space-y-2">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Cited Regulatory Evidence Record IDs:
                </span>
                <div className="flex flex-wrap gap-2">
                  {inspectorData.evidence_record_ids && inspectorData.evidence_record_ids.length > 0 ? (
                    inspectorData.evidence_record_ids.map((id) => (
                      <button
                        key={id}
                        onClick={() => navigate(`/precedents?id=${selectedDevId}`)}
                        className="px-2.5 py-1 border border-stone-300 bg-ivory-50 text-ink-800 hover:border-ink-800 dark:border-stone-700 dark:bg-obsidian-400 dark:text-ivory-200 dark:hover:border-brass-500 font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>{id}</span>
                        <ExternalLink className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                      </button>
                    ))
                  ) : (
                    <span className="text-stone-400 dark:text-stone-500">None indexed for this record</span>
                  )}
                </div>
              </div>
            </section>

            {/* Official Certification Signature Block */}
            <section className="pt-6 border-t-2 border-stone-300 dark:border-stone-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase">Auditor Sign-Off</span>
                  <div className="font-serif text-sm font-semibold text-ink-900 dark:text-ivory-100">Dr. Marcus Vance</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">Quality Assurance Director &bull; Lead Auditor</div>
                </div>

                <div className="space-y-1">
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase">Audit Date & Location</span>
                  <div className="text-ink-900 dark:text-ivory-100">{new Date().toLocaleDateString()} &bull; Basel Lyophilization QA Unit</div>
                  <div className="text-[10px] text-brass-700 dark:text-brass-400 font-semibold">21 CFR Part 11 Electronically Attested</div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
