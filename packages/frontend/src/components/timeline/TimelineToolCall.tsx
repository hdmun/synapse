import React, { useState, memo } from 'react';
import { Zap, Terminal, CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import type { ToolCall } from '@synapse/shared';

interface TimelineToolCallProps {
  toolCall: ToolCall;
  defaultExpanded?: boolean;
}

export const TimelineToolCall = memo(({ toolCall, defaultExpanded = false }: TimelineToolCallProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copiedArgs, setCopiedArgs] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  const isSuccess = toolCall.status === 'success' || toolCall.status === 'completed';
  const isError = toolCall.status === 'error' || toolCall.status === 'failed';

  const formatData = (data: any): string => {
    if (data === undefined || data === null) return '';
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  };

  const formattedArgs = formatData(toolCall.args);
  const formattedResult = formatData(toolCall.result);

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full my-2 bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/40 hover:bg-slate-800/50 transition-colors text-left focus:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 shrink-0">
            <Zap size={14} />
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 truncate">
            {toolCall.name}
          </span>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {isSuccess && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={10} />
                <span>Success</span>
              </span>
            )}
            {isError && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                <XCircle size={10} />
                <span>Failed</span>
              </span>
            )}
            {!isSuccess && !isError && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                <Clock size={10} />
                <span>{toolCall.status || 'Executed'}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-slate-500">
          <span className="text-[10px] font-mono hidden sm:inline">
            {toolCall.timestamp ? new Date(toolCall.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
          </span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-slate-800 space-y-3 bg-slate-950/40">
          {formattedArgs && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arguments</span>
                <button
                  onClick={() => copyText(formattedArgs, setCopiedArgs)}
                  className="text-slate-500 hover:text-slate-300 text-[10px] flex items-center gap-1 transition-colors"
                  title="Copy arguments"
                >
                  {copiedArgs ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedArgs ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 custom-scrollbar leading-relaxed">
                {formattedArgs}
              </pre>
            </div>
          )}

          {formattedResult ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Terminal size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Result / Output</span>
                </div>
                <button
                  onClick={() => copyText(formattedResult, setCopiedResult)}
                  className="text-slate-500 hover:text-slate-300 text-[10px] flex items-center gap-1 transition-colors"
                  title="Copy output"
                >
                  {copiedResult ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className={`rounded-lg p-3 text-[11px] font-mono overflow-x-auto max-h-60 custom-scrollbar leading-relaxed border ${
                isError 
                  ? 'bg-rose-950/20 border-rose-900/30 text-rose-300' 
                  : 'bg-slate-950 border-slate-800/80 text-emerald-300/90'
              }`}>
                {formattedResult}
              </pre>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 italic">No output returned.</div>
          )}
        </div>
      )}
    </div>
  );
});

TimelineToolCall.displayName = 'TimelineToolCall';
