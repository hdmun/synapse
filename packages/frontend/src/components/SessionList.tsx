import React, { memo, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SessionSkeleton, EmptyState, ErrorState } from './StatusStates';
import { getAgentConfig } from '../constants/agents';
import { Filter, Eye, EyeOff, Zap } from 'lucide-react';
import { formatTimeAgoKorean } from '../lib/utils';

const SessionListItem = memo(({ 
  id, 
  index, 
  start, 
  measureRef 
}: { 
  id: string, 
  index: number, 
  start: number, 
  measureRef: (node: Element | null) => void 
}) => {
  const s = useStore(state => state.sessionsById[id]);
  const currentSession = useStore(state => state.currentSession);
  const setCurrentSession = useStore(state => state.setCurrentSession);
  const fetchMessages = useStore(state => state.fetchMessages);

  if (!s) return null;
  const isActive = currentSession?.id === s.id;

  const formattedDate = s.lastUpdated 
    ? formatTimeAgoKorean(s.lastUpdated) 
    : 'Unknown';

  const agentConfig = getAgentConfig(s.source || 'unknown');

  return (
    <div
      data-index={index}
      ref={measureRef}
      className="absolute top-0 left-0 w-full"
      style={{
        transform: `translateY(${start}px)`,
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
          <div className="flex items-center gap-2">
            <span className={`font-bold text-xs ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>
              #{s.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${agentConfig.bgThemeClass} ${agentConfig.themeColorClass} ${agentConfig.borderThemeClass}`}>
              {agentConfig.name}
            </span>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
            s.status === 'active' 
            ? 'bg-indigo-600 text-white' 
            : 'bg-slate-800 text-slate-500'
          }`}>
            {s.status?.toUpperCase() || ''}
          </span>
        </div>
        <div className={`text-[11px] ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>Model: {s.model || 'Unknown'}</div>
        {s.summary && (
          <div className={`text-[11px] font-medium truncate mt-2 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} title={s.summary}>
            {s.summary}
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <div className="text-[10px] text-slate-600">{formattedDate}</div>
          {s.messageCount !== undefined && (
            <div className="text-[9px] font-bold text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded-md">
              {s.messageCount} msgs
            </div>
          )}
        </div>
      </button>
    </div>
  );
});

SessionListItem.displayName = 'SessionListItem';

export const SessionList = memo(() => {
  const sessionIds = useStore(state => state.sessionIds);
  const sessionsById = useStore(state => state.sessionsById);
  const filterAgents = useStore(state => state.filterAgents);
  const showEmptySessions = useStore(state => state.showEmptySessions);
  const toggleShowEmptySessions = useStore(state => state.toggleShowEmptySessions);
  const loading = useStore(state => state.sessionsLoading);
  const error = useStore(state => state.sessionsError);
  const currentProject = useStore(state => state.currentProject);
  const fetchSessions = useStore(state => state.fetchSessions);

  const filteredSessionIds = useMemo(() => {
    return sessionIds.filter(id => {
      const s = sessionsById[id];
      if (!s) return false;
      
      const agentMatch = filterAgents.includes(s.source || 'unknown');
      const emptyMatch = showEmptySessions || (s.messageCount !== undefined && s.messageCount > 0);
      
      return agentMatch && emptyMatch;
    });
  }, [sessionIds, sessionsById, filterAgents, showEmptySessions]);

  const activeCount = useMemo(() => {
    return filteredSessionIds.filter(id => sessionsById[id]?.status === 'active').length;
  }, [filteredSessionIds, sessionsById]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredSessionIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  const renderContent = () => {
    if (!currentProject) {
      return (
        <EmptyState 
          icon="project" 
          title="프로젝트를 선택하세요" 
          description="왼쪽 목록에서 프로젝트를 선택하면 대화 세션이 여기에 표시됩니다." 
        />
      );
    }

    if (loading && sessionIds.length === 0) {
      return <SessionSkeleton />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={() => fetchSessions(currentProject.id)} />;
    }

    if (filteredSessionIds.length === 0) {
      return (
        <EmptyState 
          icon="session" 
          title="세션이 없습니다" 
          description={sessionIds.length > 0 ? "필터 조건에 맞는 세션이 없습니다." : "이 프로젝트에 생성된 대화 세션이 아직 없습니다."} 
        />
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
          <SessionListItem 
            key={virtualItem.key}
            id={filteredSessionIds[virtualItem.index]!}
            index={virtualItem.index}
            start={virtualItem.start}
            measureRef={rowVirtualizer.measureElement}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-80 h-full border-r border-slate-800/50 flex flex-col bg-slate-900/30">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Chat Sessions</h3>
          {filteredSessionIds.length > 0 && (
            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {activeCount} Active
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <button 
            onClick={() => toggleShowEmptySessions()}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-[11px] font-medium ${
              showEmptySessions 
              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' 
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60'
            }`}
            title={showEmptySessions ? "내용 없는 세션 숨기기" : "내용 없는 세션 표시"}
          >
            {showEmptySessions ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{showEmptySessions ? 'Show All' : 'Hide Empty'}</span>
          </button>
          
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Filter size={12} />
            <span>{filteredSessionIds.length} / {sessionIds.length}</span>
          </div>
        </div>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
});

SessionList.displayName = 'SessionList';
