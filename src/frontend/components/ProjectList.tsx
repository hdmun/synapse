import React, { memo, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { FolderOpen } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ProjectSkeleton, EmptyState, ErrorState } from './StatusStates';
import { AGENTS, getAgentConfig } from '../constants/agents';

const ProjectListItem = memo(({ 
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
  const p = useStore(state => state.projectsById[id]);
  const currentProject = useStore(state => state.currentProject);
  const setCurrentProject = useStore(state => state.setCurrentProject);
  const fetchSessions = useStore(state => state.fetchSessions);
  const toggleFilterAgent = useStore(state => state.toggleFilterAgent);

  if (!p) return null;
  const isActive = currentProject?.id === p.id;

  return (
    <div
      data-index={index}
      ref={measureRef}
      className="absolute top-0 left-0 w-full"
      style={{
        transform: `translateY(${start}px)`,
        paddingBottom: '16px'
      }}
    >
      <button
        onClick={() => { setCurrentProject(p); fetchSessions(p.id); }}
        className={`w-full text-left p-4 rounded-xl border transition-all ${
          isActive
          ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
          : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600' 
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-indigo-600/20' : 'bg-slate-700/50'}`}>
              <FolderOpen size={16} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
            </div>
            <span className={`font-bold text-sm ${isActive ? 'text-indigo-400' : 'text-slate-300'} truncate`}>{p.name}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {p.agents?.map(agentId => {
              const agentConfig = getAgentConfig(agentId);
              const Icon = agentConfig.icon;
              return (
                <div 
                  key={agentId} 
                  title={`Active with ${agentConfig.name}`} 
                  className={`${agentConfig.themeColorClass} opacity-70 hover:opacity-100 transition-opacity cursor-pointer`}
                  onClick={(e) => { e.stopPropagation(); toggleFilterAgent(agentId); }}
                >
                  <Icon size={14} /> 
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono mb-3 truncate" title={p.path}>{p.path}</div>     
        <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">       
          <span className={isActive ? 'text-indigo-400' : 'text-slate-400'}>
            {p.progress === 100 ? 'Completed' : 'Syncing...'} {p.progress}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isActive ? 'bg-indigo-500' : 'bg-slate-600'}`}
            style={{ width: `${p.progress}%` }}
          ></div>
        </div>
      </button>
    </div>
  );
});

ProjectListItem.displayName = 'ProjectListItem';

export const ProjectList = memo(() => {
  const projectIds = useStore(state => state.projectIds);
  const projectsById = useStore(state => state.projectsById);
  const loading = useStore(state => state.projectsLoading);
  const error = useStore(state => state.projectsError);
  const searchQuery = useStore(state => state.searchQuery);
  const filterAgents = useStore(state => state.filterAgents);
  const toggleFilterAgent = useStore(state => state.toggleFilterAgent);
  const fetchProjects = useStore(state => state.fetchProjects);

  const parentRef = useRef<HTMLDivElement>(null);

  const availableAgentKeys = Object.keys(AGENTS);

  const filteredProjectIds = useMemo(() => {
    return projectIds.filter(id => {
      const p = projectsById[id];
      if (!p) return false;

      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      const allAgentsSelected = availableAgentKeys.every(agent => filterAgents.includes(agent));
      if (allAgentsSelected) return true;

      if (filterAgents.length === 0) return false;

      const projectAgents = p.agents || [];
      return projectAgents.some(a => filterAgents.includes(a));
    });
  }, [projectIds, projectsById, searchQuery, filterAgents, availableAgentKeys]);

  const rowVirtualizer = useVirtualizer({
    count: filteredProjectIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Increased for card style
    overscan: 5,
  });

  const renderContent = () => {
    if (loading && projectIds.length === 0) {
      return <ProjectSkeleton />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={fetchProjects} />;
    }

    if (filteredProjectIds.length === 0) {
      return searchQuery ? (
        <EmptyState icon="search" title="검색 결과가 없습니다" description={`"${searchQuery}"에 해당하는 프로젝트를 찾을 수 없습니다.`} />
      ) : (
        <EmptyState icon="project" title="프로젝트가 없습니다" description="조건에 맞는 활성 프로젝트가 없습니다." />
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
          <ProjectListItem
            key={virtualItem.key}
            id={filteredProjectIds[virtualItem.index]!}
            index={virtualItem.index}
            start={virtualItem.start}
            measureRef={rowVirtualizer.measureElement}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-80 h-full border-r border-slate-800/50 flex flex-col bg-slate-900/50">   
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Active Projects</h3>
          <div className="flex gap-2">
            {Object.values(AGENTS).map((agent) => (
              <button
                key={agent.id}
                onClick={() => toggleFilterAgent(agent.id)}
                title={`Toggle ${agent.name} projects`}
                className={`text-[9px] px-2 py-1 rounded-full font-bold border transition-all ${ 
                  filterAgents.includes(agent.id)
                    ? `${agent.bgThemeClass} ${agent.themeColorClass} ${agent.borderThemeClass}`
                    : 'bg-slate-800/30 text-slate-600 border-slate-800/50 grayscale'
                }`}
              >
                {agent.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">  
        {renderContent()}
      </div>
    </div>
  );
});

ProjectList.displayName = 'ProjectList';
