import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Zap, Terminal, Cpu, FileText, Image as ImageIcon, Copy, ExternalLink, ChevronDown, ChevronRight, File, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { EmptyState, ErrorState, MessageSkeleton } from './StatusStates';

const ToolCallCard = ({ name, args }: { name: string, args: any }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      >
        <div className="flex items-center gap-2.5">
          <Zap size={14} className="text-amber-500" />
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Tool Call: {name}</span>
        </div>
        {expanded ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-600" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800/50">
          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto text-[11px] font-mono text-slate-300">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const ToolResponseCard = ({ name, response }: { name: string, response: any }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      >
        <div className="flex items-center gap-2.5">
          <Terminal size={14} className="text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Tool Result: {name}</span>
        </div>
        {expanded ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-600" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800/50">
          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto text-[11px] font-mono text-slate-300">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

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
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  if (!m) return null;
  const isUser = m.type === 'user';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedParts = React.useMemo(() => {
    if (!m.content) return [{ text: '' }];
    
    // Check if it's a JSON array of parts
    if (m.content.trim().startsWith('[') && m.content.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(m.content);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback to text if parsing fails
      }
    }
    
    return [{ text: m.content }];
  }, [m.content]);

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
        {parsedParts.map((part: any, idx) => {
          let content: React.ReactNode = null;
          
          if (part.text) {
            content = <div className="whitespace-pre-wrap">{part.text}</div>;
          } else if (part.inline_data) {
            const src = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            content = (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <ImageIcon size={12} />
                  <span>Inline Image ({part.inline_data.mime_type})</span>
                </div>
                <img src={src} alt="inline" className="rounded-lg max-w-full border border-slate-700 shadow-sm" />
              </div>
            );
          } else if (part.file_data) {
            const isImage = part.file_data.mime_type?.startsWith('image/');
            const fileUrl = `/files/${part.file_data.file_uri}`;
            
            content = (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <File size={12} />
                  <span>Local File Reference</span>
                </div>
                
                {isImage ? (
                  <img src={fileUrl} alt={part.file_data.file_uri} className="rounded-lg max-w-full border border-slate-700 shadow-sm" />
                ) : (
                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={20} className="text-indigo-400" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-200 truncate">{part.file_data.file_uri.split('/').pop()}</span>
                        <span className="text-[10px] text-slate-500 truncate font-mono">{part.file_data.file_uri}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => copyToClipboard(part.file_data.file_uri)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${copied ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        title="Copy Local Path"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                        title="Open File"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          } else if (part.function_call) {
            content = <ToolCallCard name={part.function_call.name} args={part.function_call.args} />;
          } else if (part.function_response) {
            content = <ToolResponseCard name={part.function_response.name} response={part.function_response.response} />;
          } else {
            content = <pre className="whitespace-pre-wrap text-[11px]">{JSON.stringify(part, null, 2)}</pre>;
          }

          return (
            <div key={idx} className={`px-5 py-3.5 rounded-2xl max-w-[85%] leading-relaxed text-sm relative ${
              isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
              : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none shadow-sm'
            }`}>
              {content}
              
              {/* Token Usage Badge */}
              {idx === parsedParts.length - 1 && !isUser && m.tokens && (
                <div className="absolute -bottom-6 left-0 flex gap-2">
                  <div className="bg-slate-900 border border-slate-700 rounded-full px-2 py-0.5 text-[9px] font-bold text-slate-400 flex items-center gap-1">
                    <Zap size={10} className="text-amber-500" />
                    <span>{m.tokens.base + (m.tokens.reasoning || 0)} TOKENS</span>
                  </div>
                  {m.tokens.reasoning && (
                    <div className="bg-slate-900 border border-slate-700 rounded-full px-2 py-0.5 text-[9px] font-bold text-indigo-400 flex items-center gap-1">
                      <Cpu size={10} />
                      <span>{m.tokens.reasoning} REASONING</span>
                    </div>
                  )}
                </div>
              )}

              {/* Thought Flow (Core Thought Trace) */}
              {idx === parsedParts.length - 1 && !isUser && (() => {
                const traces = (m.thoughtTraces && m.thoughtTraces.length > 0) ? m.thoughtTraces : m.enrichers?.gemini?.thoughtTrace;
                if (!traces || traces.length === 0) return null;
                return (
                  <div className="mt-5 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                      <button 
                        onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        aria-expanded={isThoughtExpanded}
                      >
                          <div className="flex items-center gap-2.5">
                              <Terminal size={14} className="text-slate-500" />
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thought Process</span>
                          </div>
                          {isThoughtExpanded ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-600" />}
                      </button>
                      {isThoughtExpanded && (
                        <div className="px-5 pb-4 pt-1 space-y-1.5 font-mono text-[11px] text-slate-500 border-t border-slate-800/50 mt-1">
                            {traces.map((t, traceIdx) => (
                              <div key={traceIdx} className="flex gap-2 text-left">
                                <span className="text-indigo-500 shrink-0">&gt;</span>
                                <span>{t.subject ? `${t.subject}: ` : ''}{t.description}</span>
                              </div>
                            ))}
                        </div>
                      )}
                  </div>
                );
              })()}
            </div>
          );
        })}
        <div className={`mt-2.5 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${isUser ? 'mr-1' : 'ml-1'}`}>
            {isUser ? 'User' : currentSessionModel} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
});

MessageListItem.displayName = 'MessageListItem';

export const MessageViewer = memo(() => {
  const messagesById = useStore(state => state.messagesById);
  const messageIds = useStore(state => state.messageIds);
  const currentSession = useStore(state => state.currentSession);
  const searchQuery = useStore(state => state.searchQuery);
  const loading = useStore(state => state.messagesLoading);
  const error = useStore(state => state.messagesError);
  const fetchMessages = useStore(state => state.fetchMessages);
  const setSearchQuery = useStore(state => state.setSearchQuery);
  
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isModelInfoVisible, setIsModelInfoVisible] = useState(false);

  const filteredIds = React.useMemo(() => {
    if (!searchQuery) return messageIds;
    const query = searchQuery.toLowerCase();
    return messageIds.filter(id => {
      const m = messagesById[id];
      return m && m.content.toLowerCase().includes(query);
    });
  }, [messageIds, messagesById, searchQuery]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      const id = filteredIds[index];
      const m = messagesById[id!];
      if (!m) return 100;
      // Rough estimate based on content length
      return 100 + (m.content.length / 2) + (m.thoughts?.length ? 60 : 0);
    }, [filteredIds, messagesById]),
    overscan: 5,
  });

  useEffect(() => {
    if (filteredIds.length > 0) {
      rowVirtualizer.scrollToIndex(filteredIds.length - 1);
    }
  }, [filteredIds.length, rowVirtualizer]);

  const renderMainContent = () => {
    if (!currentSession) {
      return (
        <EmptyState 
          icon="session" 
          title="세션을 선택하세요" 
          description="왼쪽에서 대화 세션을 선택하면 상세 메시지 내역이 여기에 표시됩니다." 
        />
      );
    }

    if (loading && messageIds.length === 0) {
      return <MessageSkeleton />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={() => fetchMessages(currentSession.id)} />;
    }

    if (filteredIds.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-2">
          <Search size={32} className="opacity-10" />
          <p className="text-sm font-medium">{searchQuery ? 'No messages match your search' : 'No messages in this session'}</p>
        </div>
      );
    }

    return (
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
            id={filteredIds[virtualItem.index]!}
            index={virtualItem.index}
            start={virtualItem.start}
            measureRef={rowVirtualizer.measureElement}
            currentSessionModel={currentSession.model || 'Gemini'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/50">
      {/* Chat Sub-Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shrink-0 relative">
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

          {/* Search Input Overlay */}
          {isSearchVisible && (
            <div className="absolute inset-0 bg-slate-900 px-8 flex items-center gap-4 z-10">
              <Search size={18} className="text-slate-500" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setIsSearchVisible(false)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600"
              />
              <button 
                onClick={() => { setIsSearchVisible(false); setSearchQuery(''); }}
                className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSearchVisible(true)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isSearchVisible ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
              >
                  <Search size={20} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setIsModelInfoVisible(!isModelInfoVisible)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isModelInfoVisible ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
                >
                    <Cpu size={20} />
                </button>
                
                {isModelInfoVisible && currentSession && (
                  <div className="absolute right-0 top-12 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-20 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                      <Cpu size={16} className="text-indigo-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Session Details</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Model Name</span>
                        <span className="text-sm text-slate-300">{currentSession.model}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Started At</span>
                        <span className="text-sm text-slate-300">{new Date(currentSession.startTime).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Tokens</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-300 font-bold">
                            {(currentSession.totalTokens?.base || 0) + (currentSession.totalTokens?.reasoning || 0)}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            (B: {currentSession.totalTokens?.base || 0}, R: {currentSession.totalTokens?.reasoning || 0})
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estimated Cost</span>
                        <span className="text-sm text-emerald-500 font-bold">${currentSession.estimatedCost?.toFixed(4) || '0.0000'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Message Count</span>
                        <span className="text-sm text-slate-300">{messageIds.length} messages</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </div>
      </div>

      <main 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-8 relative custom-scrollbar"
      >
        {renderMainContent()}
      </main>
    </div>
  );
});

MessageViewer.displayName = 'MessageViewer';
