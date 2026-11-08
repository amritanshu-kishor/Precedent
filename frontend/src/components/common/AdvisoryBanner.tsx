import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AdvisoryBanner: React.FC<{ className?: string; compact?: boolean }> = ({
  className,
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 border border-stone-300 dark:border-stone-800 bg-ivory-100 dark:bg-obsidian-300 text-stone-600 dark:text-stone-300 text-xs font-sans transition-colors',
          className
        )}
      >
        <span className="font-mono text-[9px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold border-r border-stone-300 dark:border-stone-700 pr-2">
          21 CFR §11 Advisory
        </span>
        <span className="truncate">
          AI outputs are advisory decision-support. Formal QA human sign-off mandatory prior to action.
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative border-l-2 border-l-brass-600 dark:border-l-brass-400 border border-stone-200 dark:border-stone-800 bg-ivory-50 dark:bg-obsidian-400 p-4 text-xs text-stone-600 dark:text-stone-300 transition-colors',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 text-brass-700 dark:text-brass-400 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-serif text-sm font-semibold text-ink-800 dark:text-ivory-100 tracking-tight">
              Regulatory Advisory Safeguard & Human Governance Protocol
            </h4>
            <span className="font-mono text-[9px] px-1.5 py-0.2 border border-brass-300 dark:border-brass-700 bg-brass-50 dark:bg-brass-900/30 text-brass-700 dark:text-brass-300 uppercase tracking-widest">
              Human-in-the-Loop Mandate
            </span>
          </div>
          <p className="font-sans text-stone-500 dark:text-stone-400 leading-relaxed text-[11px]">
            PRECEDENT delivers synthesized historical precedent recall and 4-agent cross-examination.
            System recommendations are strictly advisory and must be reviewed, justified, and digitally approved
            by qualified Quality Assurance personnel prior to CAPA execution (21 CFR Part 11 / EU Annex 11 compliant).
          </p>
        </div>
      </div>
    </div>
  );
};
