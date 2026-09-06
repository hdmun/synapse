import React, { memo, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Zap, Cpu, Calendar, Hash, ArrowLeftRight } from 'lucide-react';
import { EmptyState, ErrorState, MessageSkeleton } from './StatusStates';
import { TimelineItem } from './timeline/TimelineItem';
import { TimelineFilterBar, type TimelineFilterMode } from './timeline/TimelineFilterBar';
import { getAgentConfig } from '../constants/agents';

export const MessageViewer = memo(() => {
  const messagesById = useStore(state => state.messagesById);
  const messageIds = useStore(state => state.messageIds);
  const currentSession = useStore(state => state.currentSession);
  const searchQuery = useStore(state => state.searchQuery);
  const loading = useStore(state => state.messagesLoading);
  const error = useStore(state => state.messagesError);
  const fetchMessages = useStore(state => state.fetchMessages);
  const setSearchQuery = useStore(state => state.setSearchQuery);

  const [filterMode, setFilterMode] = useState<TimelineFilterMode>('all');
  const [expandAll, setExpandAll] = useState(false);
  const [isModelInfoVisible, setIsModelInfoVisible] = useState(false);

  // Total counts for stats bar
  const counts = useMemo(() => {
    let totalTools = 0;
    let totalThoughts = 0;

    for (const id of messageIds) {
      const m = messagesById[id];
      if (!m) continue;
      if (m.toolCalls && m.toolCalls.length > 0) {
        totalTools += m.toolCalls.length;
      }
      if (m.thoughtTraces && m.thoughtTraces.length > 0) {
        totalThoughts += m.thoughtTraces.length;
      } else if (m.enrichers?.gemini?.thoughtTrace) {
        totalThoughts += m.enrichers.gemini.thoughtTrace.length;
      }
    }

    return {
      totalMessages: messageIds.length,
      totalTools,
      totalThoughts,
    };
  }, [messageIds, messagesById]);

  // Filter messages by search query and filterMode
  const filteredIds = useMemo(() => {
    return messageIds.filter(id => {
      const m = messagesById[id];
      if (!m) return false;

      // 1. Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const contentMatch = m.content && m.content.toLowerCase().includes(q);
        const toolMatch = m.toolCalls?.some(t => t.name.toLowerCase().includes(q) || (typeof t.args === 'string' && t.args.toLowerCase().includes(q)));
        const thoughtMatch = m.thoughtTraces?.some(t => t.description.toLowerCase().includes(q) || (t.subject && t.subject.toLowerCase().includes(q)));
        if (!contentMatch && !toolMatch && !thoughtMatch) return false;
      }

      // 2. Filter mode filter
      if (filterMode === 'tools') {
        const hasTools = (m.toolCalls && m.toolCalls.length > 0) || (m.content.includes('"function_call"'));
        return hasTools;
      }
      if (filterMode === 'thoughts') {
        const hasThoughts = (m.thoughtTraces && m.thoughtTraces.length > 0) || (m.enrichers?.gemini?.thoughtTrace && m.enrichers.gemini.thoughtTrace.length > 0);
        return hasThoughts;
      }
      if (filterMode === 'messages') {
        return m.content && m.content.trim().length > 0;
      }

      return true;
    });
  }, [messageIds, messagesById, searchQuery, filterMode]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      const id = filteredIds[index];
      const m = messagesById[id!];
      if (!m) return 120;
      return 120 + Math.min(300, (m.content?.length || 0) / 3);
    }, [filteredIds, messagesById]),
    overscan: 5,
  });

  useEffect(() => {
    if (filteredIds.length > 0) {
      rowVirtualizer.scrollToIndex(filteredIds.length - 1);
    }
  }, [filteredIds.length, rowVirtualizer]);

  const agentConfig = useMemo(() => {
    return getAgentConfig(currentSession?.source || 'unknown');
  }, [currentSession?.source]);

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
        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-20">
          <Search size={32} className="opacity-20" />
          <p className="text-sm font-medium">
            {searchQuery ? `"${searchQuery}"에 일치하는 항목이 없습니다.` : '선택된 필터에 해당하는 메시지가 없습니다.'}
          </p>
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
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const id = filteredIds[virtualItem.index]!;
          const message = messagesById[id];
          if (!message) return null;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '16px',
              }}
            >
              <TimelineItem
                message={message}
                agentName={currentSession.model || agentConfig.name}
                filterMode={filterMode}
                expandAll={expandAll}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/40 min-h-0 overflow-hidden">
      {/* 1. Header: Session Overview & Metadata */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Hash size={10} /> Session ID
            </span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {currentSession ? `#${currentSession.id.slice(0, 12).toUpperCase()}` : 'None'}
            </span>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Zap size={10} className="text-indigo-400" /> Model / Agent
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${agentConfig.bgThemeClass} ${agentConfig.themeColorClass} ${agentConfig.borderThemeClass}`}>
                {agentConfig.name}
              </span>
              <span className="text-sm font-semibold text-slate-300">
                {currentSession ? currentSession.model : 'N/A'}
              </span>
            </div>
          </div>

          {currentSession?.startTime && (
            <>
              <div className="w-px h-8 bg-slate-800 hidden md:block" />
              <div className="flex-col hidden md:flex">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={10} /> Started
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(currentSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Info: Replay Core Badge & Details Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-bold">
            <ArrowLeftRight size={12} />
            <span>Replay Core</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsModelInfoVisible(!isModelInfoVisible)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isModelInfoVisible ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Session Details"
            >
              <Cpu size={16} />
            </button>

            {isModelInfoVisible && currentSession && (
              <div className="absolute right-0 top-11 w-72 bg-slate-850 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-30 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Cpu size={14} className="text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Session Audit</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agent Source:</span>
                    <span className="font-semibold text-slate-300 capitalize">{currentSession.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model:</span>
                    <span className="font-mono text-slate-300">{currentSession.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Tokens:</span>
                    <span className="font-mono text-slate-300">{currentSession.totalTokens?.base ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reasoning Tokens:</span>
                    <span className="font-mono text-indigo-400 font-bold">{currentSession.totalTokens?.reasoning ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Cost:</span>
                    <span className="font-mono text-emerald-400 font-bold">${currentSession.estimatedCost?.toFixed(4) || '0.0000'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Timeline Filter Bar */}
      {currentSession && (
        <TimelineFilterBar
          filterMode={filterMode}
          onFilterChange={setFilterMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          expandAll={expandAll}
          onToggleExpandAll={() => setExpandAll(!expandAll)}
          counts={counts}
        />
      )}

      {/* 3. Main Timeline Body */}
      <main
        ref={parentRef}
        className="flex-1 overflow-y-auto px-6 py-4 relative custom-scrollbar"
      >
        {renderMainContent()}
      </main>
    </div>
  );
});

MessageViewer.displayName = 'MessageViewer';
