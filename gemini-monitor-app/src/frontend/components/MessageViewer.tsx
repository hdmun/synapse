import React, { memo, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Terminal, Search, Activity } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

export const MessageViewer = memo(() => {
  const messages = useStore(state => state.messages);
  const currentSession = useStore(state => state.currentSession);
  
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 대략적인 초기 높이
    overscan: 5,
  });

  // 새 메시지가 올 때 자동 스크롤 하단 이동 (옵션)
  useEffect(() => {
    if (messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1);
    }
  }, [messages.length, rowVirtualizer]);

  return (
    <div className="flex-1 flex flex-col bg-gray-950">
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/20">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-200">
            {currentSession ? `Session: ${currentSession.id.slice(0, 12)}...` : 'Select a session'}
          </h3>
          {currentSession && (
             <div className="flex gap-2 text-[10px] uppercase tracking-wider font-bold">
               <span className="text-gray-500">Model:</span>
               <span className="text-blue-400">{currentSession.model}</span>
             </div>
          )}
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-gray-800 rounded-lg p-1 flex items-center">
              <Search size={16} className="mx-2 text-gray-500" />
              <input 
                type="text" 
                placeholder="FTS5 Search..." 
                className="bg-transparent border-none focus:outline-none text-sm w-48"
              />
           </div>
           <Activity size={20} className="text-gray-600" />
        </div>
      </header>

      <main 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-6 relative"
      >
        {!currentSession ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
            <Activity size={48} className="opacity-20" />
            <p className="text-sm">Select a project and session to start monitoring</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const m = messages[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                    paddingBottom: '24px' // space-y-6 대응
                  }}
                >
                  <div className={`flex flex-col ${m.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${m.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100 border border-gray-700'}`}>
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                      
                      {/* Thought Flow (Gemini Only) */}
                      {m.thoughts && m.thoughts.length > 0 && (
                        <div className="mt-4 border-t border-gray-700 pt-3 space-y-2">
                          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                            <Terminal size={12} /> Thought Process
                          </div>
                          {m.thoughts.map((t, idx) => (
                            <details key={idx} className="group" onToggle={() => rowVirtualizer.measure()}>
                              <summary className="text-xs cursor-pointer text-gray-400 hover:text-gray-200 list-none flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {t.subject}
                              </summary>
                              <p className="mt-1 pl-4 text-xs text-gray-500 leading-relaxed">{t.description}</p>
                            </details>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 mt-2">{new Date(m.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
});

MessageViewer.displayName = 'MessageViewer';
