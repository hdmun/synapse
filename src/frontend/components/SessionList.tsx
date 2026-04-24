import React, { memo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { MessageSquare } from 'lucide-react';
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
    estimateSize: () => 64,
    overscan: 5,
  });

  return (
    <div className="w-72 border-r border-gray-800 flex flex-col bg-gray-900/30">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <MessageSquare size={20} className="text-emerald-400" />
        <h2 className="font-bold">Sessions</h2>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto p-2">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const s = sessions[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: '4px'
                }}
              >
                <button
                  onClick={() => { setCurrentSession(s); fetchMessages(s.id); }}
                  className={`w-full text-left p-3 rounded-lg transition ${currentSession?.id === s.id ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/50' : 'hover:bg-gray-800 text-gray-400'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm truncate">{s.id.slice(0, 8)}...</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="text-xs opacity-60 mt-1">{s.model}</div>
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
