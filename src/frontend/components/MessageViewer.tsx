import React, { memo, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Zap, PlusCircle, Mic, Send, Terminal, Cpu } from 'lucide-react';

const MessageListItem = memo(({ 
  id, 
  index, 
  start, 
  measureRef,
  currentSessionModel
}: { 
  id: string, 
  index: number, 
  start: number, 
  measureRef: (node: Element | null) => void,
  currentSessionModel: string
}) => {
  const m = useStore(state => state.messagesById[id]);
  if (!m) return null;
  const isUser = m.type === 'user';

  return (
    <div
      data-index={index}
      ref={measureRef}
      className="absolute top-0 left-0 w-full"
      style={{
        transform: `translateY(${start}px)`,
        paddingBottom: '40px'
      }}
    >
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group space-y-2`}>
        {(() => {
          let parts = [];
          try {
            if (m.content.startsWith('[') && m.content.endsWith(']')) {
              const parsed = JSON.parse(m.content);
              if (Array.isArray(parsed)) {
                parts = parsed;
              } else {
                parts = [{ text: m.content }];
              }
            } else {
              parts = [{ text: m.content }];
            }
          } catch (e) {
            parts = [{ text: m.content }];
          }

          return parts.map((part: any, idx) => {
            let content: React.ReactNode = null;
            if (part.text) {
              content = part.text;
            } else if (part.inline_data) {
              content = <span className="italic opacity-70">[Image Data: {part.inline_data.mime_type}]</span>;
            } else if (part.file_data) {
              content = <span className="italic opacity-70">[File: {part.file_data.file_uri}]</span>;
            } else if (part.function_call) {
              content = <span className="italic opacity-70">[Function Call: {part.function_call.name}]</span>;
            } else if (part.function_response) {
              content = <span className="italic opacity-70">[Function Response: {part.function_response.name}]</span>;
            } else {
              content = JSON.stringify(part);
            }

            return (
              <div key={idx} className={`px-5 py-3.5 rounded-2xl max-w-[85%] leading-relaxed text-sm ${
                isUser 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap">{content}</div>
                
                {/* Thought Flow (Gemini Only - Only show in the last part or once) */}
                {idx === parts.length - 1 && !isUser && m.thoughts && m.thoughts.length > 0 && (
                  <div className="mt-5 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-900 transition-colors">
                          <div className="flex items-center gap-2.5">
                              <Terminal size={14} className="text-slate-500" />
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thought Process</span>
                          </div>
                      </div>
                      <div className="px-5 pb-4 pt-1 space-y-1.5 font-mono text-[11px] text-slate-500 border-t border-slate-800/50 mt-1">
                          {m.thoughts.map((t, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-indigo-500">&gt;</span>
                              <span>{t.subject}: {t.description}</span>
                            </div>
                          ))}
                      </div>
                  </div>
                )}
              </div>
            );
          });
        })()}
        <div className={`mt-2.5 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${isUser ? 'mr-1' : 'ml-1'}`}>
            {isUser ? 'User' : currentSessionModel} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
});

MessageListItem.displayName = 'MessageListItem';

export const MessageViewer = memo(() => {
  const messageIds = useStore(state => state.messageIds);
  const currentSession = useStore(state => state.currentSession);
  
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messageIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  useEffect(() => {
    if (messageIds.length > 0) {
      rowVirtualizer.scrollToIndex(messageIds.length - 1);
    }
  }, [messageIds.length, rowVirtualizer]);

  return (
    <div className="flex-1 flex flex-col bg-slate-900/50">
      {/* Chat Sub-Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8">
              <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Session ID</span>
                  <span className="text-sm font-bold text-slate-200">
                    {currentSession ? `#${currentSession.id.slice(0, 12).toUpperCase()}` : 'None'}
                  </span>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Model</span>
                  <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-200">
                        {currentSession ? currentSession.model : 'N/A'}
                      </span>
                      <Zap size={14} className="text-indigo-500" />
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-800 transition-all">
                  <Search size={20} />
              </button>
              <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-800 transition-all">
                  <Cpu size={20} />
              </button>
          </div>
      </div>

      <main 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-8 relative custom-scrollbar"
      >
        {!currentSession ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
            <Cpu size={48} className="opacity-10" />
            <p className="text-sm font-medium">Select a project and session to start monitoring</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => (
              <MessageListItem 
                key={virtualItem.key}
                id={messageIds[virtualItem.index]!}
                index={virtualItem.index}
                start={virtualItem.start}
                measureRef={rowVirtualizer.measureElement}
                currentSessionModel={currentSession.model || 'Gemini'}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mock Input Area */}
      <div className="p-8 bg-slate-900 border-t border-slate-800 shrink-0">
          <div className="max-w-4xl mx-auto relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <button className="text-slate-500 hover:text-indigo-400 transition-colors">
                      <PlusCircle size={20} />
                  </button>
              </div>
              <input 
                type="text" 
                placeholder="Ask Gemini anything..." 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-14 pr-32 focus:outline-none focus:border-indigo-500 transition-all text-sm text-slate-200 placeholder:text-slate-600"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-4">
                  <button className="text-slate-500 hover:text-indigo-400 transition-colors">
                      <Mic size={20} />
                  </button>
                  <div className="w-px h-5 bg-slate-700"></div>
                  <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20">
                      <span className="text-xs font-bold uppercase tracking-wider">Send</span>
                      <Send size={14} />
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
});

MessageViewer.displayName = 'MessageViewer';
