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
    estimateSize: () => 78,
    overscan: 5,
  });

  return (
    <div className="w-64 border-r border-gray-800 flex flex-col bg-gray-900/50">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <FolderOpen size={20} className="text-blue-400" />
        <h1 className="font-bold text-lg">Projects</h1>
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
            const p = projects[virtualItem.index];
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
                  onClick={() => { setCurrentProject(p); fetchSessions(p.id); }}
                  className={`w-full text-left p-3 rounded-lg transition ${currentProject?.id === p.id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'hover:bg-gray-800 text-gray-400'}`}
                >
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs opacity-60 mt-1 truncate">{p.path}</div>
                  {/* Progress Bar */}
                  <div className="h-1 bg-gray-800 rounded-full mt-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
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
