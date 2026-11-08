import React from 'react';
import { RefreshCw } from 'lucide-react';

interface InvestigationLoaderProps {
  deviationId: string;
}

export const InvestigationLoader: React.FC<InvestigationLoaderProps> = ({ deviationId }) => {
  return (
    <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-8 text-center space-y-6 font-sans transition-colors">
      <div className="max-w-md mx-auto space-y-4">
        {/* Editorial progress spinner */}
        <div className="w-10 h-10 border border-ink-800 dark:border-brass-400 text-ink-800 dark:text-brass-400 flex items-center justify-center mx-auto bg-ivory-100 dark:bg-obsidian-300">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold block">
            Pipeline Active &bull; Recall Execution
          </span>
          <h3 className="font-serif text-xl font-medium text-ink-800 dark:text-ivory-100 mt-1">
            Synthesizing Multi-Agent Investigation
          </h3>
          <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1">
            Analyzing deviation record <span className="font-mono text-ink-900 dark:text-ivory-50 font-semibold">{deviationId}</span> against historical precedent archives.
          </p>
        </div>

        {/* 4-Stage Status Progress Indicator */}
        <div className="grid grid-cols-4 gap-2 pt-2 text-left font-mono text-[10px]">
          <div className="p-2 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300">
            <span className="text-stone-400 dark:text-stone-500 block text-[9px]">01</span>
            <span className="font-semibold text-ink-800 dark:text-ivory-100">Telemetry</span>
          </div>
          <div className="p-2 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300">
            <span className="text-stone-400 dark:text-stone-500 block text-[9px]">02</span>
            <span className="font-semibold text-ink-800 dark:text-ivory-100">Recurrence</span>
          </div>
          <div className="p-2 border border-stone-300 dark:border-stone-700 bg-ivory-100 dark:bg-obsidian-300">
            <span className="text-stone-400 dark:text-stone-500 block text-[9px]">03</span>
            <span className="font-semibold text-ink-800 dark:text-ivory-100">Auditing</span>
          </div>
          <div className="p-2 border border-brass-400 dark:border-brass-700 bg-brass-50 dark:bg-brass-950/40">
            <span className="text-brass-700 dark:text-brass-400 block text-[9px]">04</span>
            <span className="font-semibold text-brass-800 dark:text-brass-300">Consensus</span>
          </div>
        </div>

        <p className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
          Querying Hindsight memory adapter &bull; Cross-checking 90-day recurrence vectors
        </p>
      </div>
    </div>
  );
};
