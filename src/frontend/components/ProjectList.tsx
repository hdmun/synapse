import React, { memo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { FolderOpen } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useVirtualizer } from '@tanstack/react-virtual';

export const ProjectList = memo(() => {
  const projects = useStore(useShallow(state => state.projects));
  const currentProject = useStore(state => state.currentProject);
  const setCurrentProject = useStore(state => state.setCurrentProject);
  const fetchSessions = useStore(state => state.fetchSessions);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Increased for card style
    overscan: 5,
  });

  return (
    <div className="w-80 h-full border-r border-slate-800/50 flex flex-col bg-slate-900/50">
      <div className="p-6 border-b border-slate-800/50">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Active Projects</h3>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const p = projects[virtualItem.index];
            const isActive = currentProject?.id === p.id;
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
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
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-indigo-600/20' : 'bg-slate-700/50'}`}>
                      <FolderOpen size={16} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                    </div>
                    <span className={`font-bold text-sm ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>{p.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mb-3 truncate">{p.path}</div>
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
          })}
        </div>
      </div>
    </div>
  );
});

ProjectList.displayName = 'ProjectList';
