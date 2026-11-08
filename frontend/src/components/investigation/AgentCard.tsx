import React from 'react';
import { AgentFinding } from '../../types';
import { ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AgentCardProps {
  finding: AgentFinding;
  onViewRecord?: (recordId: string) => void;
  className?: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({ finding, onViewRecord, className }) => {
  const roleConfig = {
    INVESTIGATOR: {
      stage: 'STAGE 01',
      name: 'Agent Investigator',
      title: 'Hypothesis & Telemetry Grounding',
      subtitle: 'Extracts objective process anomalies and recalls identical failure modes.',
    },
    SKEPTIC: {
      stage: 'STAGE 02',
      name: 'Agent Skeptic',
      title: 'Counter-Hypothesis & Recurrence Stress-Test',
      subtitle: 'Rejects correlation assumptions; flags interventions that previously failed.',
    },
    AUDITOR: {
      stage: 'STAGE 03',
      name: 'Agent Auditor',
      title: 'GMP Traceability & Batch Compliance',
      subtitle: 'Validates 21 CFR §211.192 requirements, lot scope, and audit trail records.',
    },
  }[finding.role];

  return (
    <div
      className={cn(
        'bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-5 space-y-4 font-sans flex flex-col justify-between transition-colors',
        className
      )}
    >
      <div className="space-y-4">
        {/* Header Ledger */}
        <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-brass-700 dark:text-brass-400 font-semibold tracking-wider">{roleConfig.stage}</span>
            <span className="uppercase px-1.5 py-0.5 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 text-stone-700 dark:text-stone-300">
              {finding.role}
            </span>
          </div>
          <h4 className="font-serif text-base font-semibold text-ink-900 dark:text-ivory-100 tracking-tight">
            {roleConfig.name}
          </h4>
          <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
            {roleConfig.title}
          </p>
        </div>

        {/* Findings List */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block">
            Analytical Findings & Inferences
          </span>
          <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
            {finding.findings.length > 0 ? (
              finding.findings.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2 border border-stone-200 dark:border-stone-800 bg-ivory-100/70 dark:bg-obsidian-300/70 text-xs font-sans leading-relaxed flex items-start gap-2"
                >
                  <span className="font-mono text-[11px] text-brass-700 dark:text-brass-400 font-bold">&bull;</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-stone-400 dark:text-stone-500 italic text-[11px]">No explicit findings returned.</li>
            )}
          </ul>
        </div>

        {/* Unsupported Claims / Warnings (if any) */}
        {finding.unsupported_claims && finding.unsupported_claims.length > 0 && (
          <div className="space-y-1.5 p-3 border border-crimson-200 dark:border-crimson-800 bg-crimson-50 dark:bg-crimson-900/30 text-crimson-800 dark:text-crimson-300 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold block text-crimson-700 dark:text-crimson-400">
              Challenged / Unsupported Claims
            </span>
            <ul className="space-y-1 list-disc list-inside text-[11px]">
              {finding.unsupported_claims.map((claim, idx) => (
                <li key={idx}>{claim}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Evidence Gaps (if any) */}
        {finding.missing_evidence && finding.missing_evidence.length > 0 && (
          <div className="space-y-1.5 p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold block text-amber-700 dark:text-amber-400">
              Identified Evidentiary Gaps
            </span>
            <ul className="space-y-1 list-disc list-inside text-[11px]">
              {finding.missing_evidence.map((gap, idx) => (
                <li key={idx}>{gap}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Supporting Evidence Record IDs Footer */}
      <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <span className="text-stone-500 dark:text-stone-400 text-[10px] uppercase tracking-wider">Historical Precedents:</span>
        <div className="flex flex-wrap gap-1">
          {finding.supporting_record_ids && finding.supporting_record_ids.length > 0 ? (
            finding.supporting_record_ids.map((recId) => (
              <button
                key={recId}
                onClick={() => onViewRecord && onViewRecord(recId)}
                className="text-[10px] px-1.5 py-0.5 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 text-ink-800 dark:text-ivory-100 hover:border-ink-800 dark:hover:border-brass-400 inline-flex items-center gap-1 transition-colors"
                title={`Inspect record ${recId}`}
              >
                <span>{recId}</span>
                <ExternalLink className="w-2.5 h-2.5 text-stone-500 dark:text-stone-400" />
              </button>
            ))
          ) : (
            <span className="text-stone-400 dark:text-stone-500 text-[10px]">None cited</span>
          )}
        </div>
      </div>
    </div>
  );
};
