import React from 'react';
import { cn } from '../../utils/cn';

interface AgentWorkflowVisualizerProps {
  activeAgent?: 'INVESTIGATOR' | 'SKEPTIC' | 'AUDITOR' | 'SYNTHESIZER' | 'ALL';
  onSelectAgent?: (agent: 'INVESTIGATOR' | 'SKEPTIC' | 'AUDITOR' | 'SYNTHESIZER') => void;
  investigatorDone?: boolean;
  skepticDone?: boolean;
  auditorDone?: boolean;
  synthesizerDone?: boolean;
}

export const AgentWorkflowVisualizer: React.FC<AgentWorkflowVisualizerProps> = ({
  activeAgent = 'ALL',
  onSelectAgent,
  investigatorDone = true,
  skepticDone = true,
  auditorDone = true,
  synthesizerDone = true,
}) => {
  const stages = [
    {
      id: 'INVESTIGATOR' as const,
      num: '01',
      name: 'Investigator',
      role: 'Evidence Grounding',
      desc: 'Process telemetry & historical recall',
      done: investigatorDone,
    },
    {
      id: 'SKEPTIC' as const,
      num: '02',
      name: 'Skeptic',
      role: 'Recurrence Stress-Test',
      desc: 'Rejects unproven correlation',
      done: skepticDone,
    },
    {
      id: 'AUDITOR' as const,
      num: '03',
      name: 'Auditor',
      role: '21 CFR §11 Compliance',
      desc: 'Audit trail & batch isolation',
      done: auditorDone,
    },
    {
      id: 'SYNTHESIZER' as const,
      num: '04',
      name: 'Synthesizer',
      role: 'Consensus Decision',
      desc: 'Actionable CAPA formulation',
      done: synthesizerDone,
    },
  ];

  return (
    <div className="bg-ivory-50 dark:bg-obsidian-400 border border-stone-300 dark:border-stone-800 p-5 space-y-4 font-sans transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-brass-700 dark:text-brass-400 font-semibold">
            Autonomous Pipeline &bull; 4-Stage Verification
          </span>
          <h3 className="font-serif text-lg font-medium text-ink-800 dark:text-ivory-100">
            Connected Multi-Agent Analytical Workflow
          </h3>
        </div>
        <p className="font-sans text-xs text-stone-500 dark:text-stone-400 max-w-sm">
          Sequential cross-examination pipeline. Click any stage to filter analysis findings.
        </p>
      </div>

      {/* Connected Horizontal Workflow */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
        {stages.map((st) => {
          const isSelected = activeAgent === st.id;
          return (
            <button
              key={st.id}
              onClick={() => onSelectAgent && onSelectAgent(st.id)}
              className={cn(
                'text-left p-3.5 border transition-all relative flex flex-col justify-between group',
                isSelected
                  ? 'bg-ink-800 dark:bg-brass-500 text-ivory-50 dark:text-ink-950 border-ink-800 dark:border-brass-400 shadow-fine'
                  : 'bg-ivory-100 dark:bg-obsidian-300 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:bg-ivory-200 dark:hover:bg-obsidian-200 text-ink-800 dark:text-ivory-100'
              )}
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                  <span
                    className={cn(
                      'font-semibold tracking-wider',
                      isSelected ? 'text-brass-300 dark:text-ink-950' : 'text-stone-500 dark:text-stone-400'
                    )}
                  >
                    STAGE {st.num}
                  </span>
                  <span
                    className={cn(
                      'uppercase tracking-widest text-[9px] px-1 py-0.2 border',
                      isSelected
                        ? 'border-brass-400 dark:border-ink-950 bg-ink-900 dark:bg-brass-600 text-brass-300 dark:text-ink-950'
                        : 'border-stone-300 dark:border-stone-700 bg-ivory-50 dark:bg-obsidian-400 text-stone-600 dark:text-stone-300'
                    )}
                  >
                    {st.done ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>

                <div className="font-serif text-base font-semibold tracking-tight">
                  {st.name}
                </div>
                <div
                  className={cn(
                    'font-mono text-[10px] uppercase tracking-wider mt-0.5',
                    isSelected ? 'text-stone-300 dark:text-ink-900 font-semibold' : 'text-brass-700 dark:text-brass-400'
                  )}
                >
                  {st.role}
                </div>
              </div>

              <p
                className={cn(
                  'font-sans text-[11px] leading-snug mt-2 pt-2 border-t',
                  isSelected
                    ? 'border-ink-700 dark:border-brass-600 text-stone-300 dark:text-ink-900 font-medium'
                    : 'border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400'
                )}
              >
                {st.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
