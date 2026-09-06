import React, { memo } from 'react';
import { Layers, MessageSquare, Zap, Terminal, Search, ChevronsUpDown, X } from 'lucide-react';

export type TimelineFilterMode = 'all' | 'messages' | 'tools' | 'thoughts';

interface TimelineFilterBarProps {
  filterMode: TimelineFilterMode;
  onFilterChange: (mode: TimelineFilterMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  expandAll: boolean;
  onToggleExpandAll: () => void;
  counts: {
    totalMessages: number;
    totalTools: number;
    totalThoughts: number;
  };
}

export const TimelineFilterBar = memo(({
  filterMode,
  onFilterChange,
  searchQuery,
  onSearchChange,
  expandAll,
  onToggleExpandAll,
  counts,
}: TimelineFilterBarProps) => {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
      {/* Filter Mode Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => onFilterChange('all')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
            filterMode === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Layers size={13} />
          <span>All</span>
          <span className="text-[10px] opacity-70 bg-black/20 px-1.5 py-0.2 rounded-full">
            {counts.totalMessages}
          </span>
        </button>

        <button
          onClick={() => onFilterChange('messages')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
            filterMode === 'messages'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <MessageSquare size={13} />
          <span>Messages</span>
        </button>

        <button
          onClick={() => onFilterChange('tools')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
            filterMode === 'tools'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Zap size={13} className={filterMode === 'tools' ? 'text-white' : 'text-amber-400'} />
          <span>Tools</span>
          {counts.totalTools > 0 && (
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-500/30">
              {counts.totalTools}
            </span>
          )}
        </button>

        <button
          onClick={() => onFilterChange('thoughts')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
            filterMode === 'thoughts'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Terminal size={13} className={filterMode === 'thoughts' ? 'text-white' : 'text-purple-400'} />
          <span>Thoughts</span>
          {counts.totalThoughts > 0 && (
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded-full border border-purple-500/30">
              {counts.totalThoughts}
            </span>
          )}
        </button>
      </div>

      {/* Right Controls: Search & Expand All */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search in session..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          onClick={onToggleExpandAll}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors"
          title={expandAll ? "Collapse details" : "Expand all details"}
        >
          <ChevronsUpDown size={13} />
          <span className="hidden sm:inline">{expandAll ? 'Collapse' : 'Expand All'}</span>
        </button>
      </div>
    </div>
  );
});

TimelineFilterBar.displayName = 'TimelineFilterBar';
