import React, { useState, memo } from 'react';
import { Terminal, Cpu, ChevronDown, ChevronRight } from 'lucide-react';
import type { ThoughtTrace } from '@synapse/shared';

interface TimelineThoughtTraceProps {
  thoughtTraces: ThoughtTrace[];
  reasoningTokens?: number;
  defaultExpanded?: boolean;
}

export const TimelineThoughtTrace = memo(({
  thoughtTraces,
  reasoningTokens,
  defaultExpanded = false
}: TimelineThoughtTraceProps) => {
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(defaultExpanded);

  if (!thoughtTraces || thoughtTraces.length === 0) return null;

  return (
    <div className="w-full my-2 bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden shadow-sm transition-all hover:border-slate-600">
      <button
        onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/40 hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-left"
        aria-expanded={isThoughtExpanded}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
            <Terminal size={14} />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Thought Process
          </span>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
            {thoughtTraces.length} steps
          </span>
          {reasoningTokens !== undefined && reasoningTokens > 0 && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full ml-1">
              <Cpu size={10} />
              <span>{reasoningTokens} REASONING TOKENS</span>
            </span>
          )}
        </div>
        <div className="text-slate-500">
          {isThoughtExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {isThoughtExpanded && (
        <div className="px-5 pb-4 pt-2 space-y-2 font-mono text-[11px] text-slate-400 border-t border-slate-800/60 bg-slate-950/30">
          {thoughtTraces.map((t, idx) => (
            <div key={idx} className="flex gap-2 text-left leading-relaxed">
              <span className="text-indigo-400 shrink-0 select-none">&gt;</span>
              <span>
                {t.subject ? `${t.subject}: ` : ''}{t.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

TimelineThoughtTrace.displayName = 'TimelineThoughtTrace';
