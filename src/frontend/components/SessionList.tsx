import React, { memo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { useVirtualizer } from '@tanstack/react-virtual';

export const SessionList = memo(() => {
  const sessions = useStore(useShallow(state => state.sessions));
  const currentSession = useStore(state => state.currentSession);
  const setCurrentSession = useStore(state => state.setCurrentSession);
  const fetchMessages = useStore(state => state.fetchMessages);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  return (
    <div className="w-80 border-r border-slate-800/50 flex flex-col bg-slate-900/30">
      <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Chat Sessions</h3>
        {sessions.length > 0 && (
          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {sessions.filter(s => s.status === 'active').length} Active
          </span>
        )}
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const s = sessions[virtualItem.index];
            const isActive = currentSession?.id === s.id;
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: '8px'
                }}
              >
                <button
                  onClick={() => { setCurrentSession(s); fetchMessages(s.id); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive 
                    ? 'bg-indigo-600/10 border-indigo-500/50' 
                    : 'bg-transparent border-transparent hover:bg-slate-800/30 hover:border-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold text-xs ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>
                      #{s.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                      s.status === 'active' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-800 text-slate-500'
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <div className={`text-[11px] ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>Model {s.model}</div>
                  {s.summary && (
                    <div className={`text-[11px] font-medium truncate mt-2 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} title={s.summary}>
                      {s.summary}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-600 mt-2">Recently updated</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

SessionList.displayName = 'SessionList';
