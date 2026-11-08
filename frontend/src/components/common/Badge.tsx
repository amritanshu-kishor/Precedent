import React from 'react';
import { cn } from '../../utils/cn';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity | string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
  const s = severity?.toLowerCase() || 'low';
  switch (s) {
    case 'critical':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-crimson-50 dark:bg-crimson-900/30 text-crimson-700 dark:text-crimson-300 border border-crimson-300 dark:border-crimson-700 font-semibold',
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-crimson-600 dark:bg-crimson-400 rounded-none inline-block" />
          Critical
        </span>
      );
    case 'high':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-semibold',
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-none inline-block" />
          High
        </span>
      );
    case 'medium':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 font-medium',
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-stone-500 dark:bg-stone-400 rounded-none inline-block" />
          Medium
        </span>
      );
    case 'low':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-ivory-200 dark:bg-obsidian-300 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 font-medium',
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-stone-400 rounded-none inline-block" />
          Low
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const s = status?.toLowerCase() || '';
  let color = 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700';

  if (s === 'open') {
    color = 'bg-ivory-50 dark:bg-obsidian-300 text-ink-800 dark:text-ivory-100 border-ink-800 dark:border-brass-400 font-semibold';
  } else if (s === 'investigating') {
    color = 'bg-brass-50 dark:bg-brass-900/30 text-brass-700 dark:text-brass-300 border-brass-400 dark:border-brass-600 font-semibold';
  } else if (s === 'reviewed' || s === 'approved' || s === 'implemented') {
    color = 'bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 border-forest-300 dark:border-forest-700 font-semibold';
  } else if (s === 'rejected') {
    color = 'bg-crimson-50 dark:bg-crimson-900/30 text-crimson-700 dark:text-crimson-300 border-crimson-300 dark:border-crimson-700 font-semibold';
  } else if (s === 'overridden') {
    color = 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold';
  } else if (s === 'assessed') {
    color = 'bg-stone-200 dark:bg-stone-800 text-ink-800 dark:text-ivory-100 border-stone-400 dark:border-stone-600 font-semibold';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border transition-colors',
        color,
        className
      )}
    >
      {status}
    </span>
  );
};

export const SyntheticBadge: React.FC<{ className?: string; text?: string }> = ({
  className,
  text = 'Synthetic Precedent Mode',
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-400 text-stone-600 dark:text-stone-400 transition-colors',
        className
      )}
      title="Transparent indicator: operating with verified synthetic training/evaluation precedents in accordance with 21 CFR §11.10."
    >
      <span className="w-1 h-1 bg-brass-600 dark:bg-brass-400 inline-block" />
      {text}
    </span>
  );
};

interface OutcomeBadgeProps {
  outcome: 'VERIFIED_EFFECTIVE' | 'RECURRENCE_OBSERVED' | 'INCONCLUSIVE' | 'NOT_ASSESSED' | string;
  className?: string;
}

export const OutcomeBadge: React.FC<OutcomeBadgeProps> = ({ outcome, className }) => {
  switch (outcome) {
    case 'VERIFIED_EFFECTIVE':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 border border-forest-300 dark:border-forest-700 font-semibold',
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-forest-600 dark:bg-forest-400 inline-block" />
          Verified Effective
        </span>
      );
    case 'RECURRENCE_OBSERVED':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-crimson-50 dark:bg-crimson-900/30 text-crimson-700 dark:text-crimson-300 border border-crimson-300 dark:border-crimson-700 font-semibold',
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-crimson-600 dark:bg-crimson-400 inline-block" />
          Recurrence Observed
        </span>
      );
    case 'INCONCLUSIVE':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-medium',
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 inline-block" />
          Inconclusive
        </span>
      );
    case 'NOT_ASSESSED':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 font-medium',
            className
          )}
        >
          <span className="w-1.5 h-1.5 bg-stone-400 inline-block" />
          Pending Check
        </span>
      );
  }
};
