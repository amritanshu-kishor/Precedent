import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'teal' | 'blue' | 'amber' | 'rose' | 'none';
  header?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  number?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  header,
  subtitle,
  action,
  number,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-ivory-50 dark:bg-obsidian-400 border border-stone-200 dark:border-stone-800 p-6 transition-colors',
        className
      )}
      {...props}
    >
      {(header || action || number) && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2.5">
              {number && (
                <span className="font-mono text-xs text-brass-600 dark:text-brass-400 font-medium tracking-widest">
                  [{number}]
                </span>
              )}
              {header && (
                <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100 tracking-tight">
                  {header}
                </h3>
              )}
            </div>
            {subtitle && (
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
  number?: string;
  className?: string;
}> = ({ title, value, change, changeType = 'neutral', icon, description, number, className }) => {
  return (
    <div
      className={cn(
        'bg-ivory-50 dark:bg-obsidian-400 border border-stone-200 dark:border-stone-800 p-5 transition-colors relative group',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {number && (
              <span className="font-mono text-[10px] text-brass-600 dark:text-brass-400 tracking-widest">
                {number}
              </span>
            )}
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium">
              {title}
            </p>
          </div>
          <div className="pt-1 flex items-baseline gap-3">
            <span className="font-serif text-3xl font-semibold tracking-tight text-ink-800 dark:text-ivory-100">
              {value}
            </span>
            {change && (
              <span
                className={cn(
                  'font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border',
                  changeType === 'positive' && 'bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 border-forest-300 dark:border-forest-700',
                  changeType === 'negative' && 'bg-crimson-50 dark:bg-crimson-900/30 text-crimson-700 dark:text-crimson-300 border-crimson-300 dark:border-crimson-700',
                  changeType === 'neutral' && 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                )}
              >
                {change}
              </span>
            )}
          </div>
          {description && (
            <p className="font-sans text-xs text-stone-500 dark:text-stone-400 pt-1 leading-snug">
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 border border-stone-200 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300 text-stone-600 dark:text-stone-400 group-hover:text-ink-800 dark:group-hover:text-ivory-100 group-hover:border-stone-400 dark:group-hover:border-stone-500 transition-colors">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
