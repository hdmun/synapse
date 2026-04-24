import React, { memo } from 'react';
import { useStore } from '../store/useStore';
import { FolderOpen } from 'lucide-react';
import { useShallow } from 'zustand/shallow';

export const ProjectList = memo(() => {
  const projects = useStore(state => state.projects);
  const currentProject = useStore(state => state.currentProject);
  const setCurrentProject = useStore(state => state.setCurrentProject);
  const fetchSessions = useStore(state => state.fetchSessions);

  return (
    <div className="w-64 border-r border-gray-800 flex flex-col bg-gray-900/50">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <FolderOpen size={20} className="text-blue-400" />
        <h1 className="font-bold text-lg">Projects</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => { setCurrentProject(p); fetchSessions(p.id); }}
            className={`w-full text-left p-3 rounded-lg mb-1 transition ${currentProject?.id === p.id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'hover:bg-gray-800 text-gray-400'}`}
          >
            <div className="font-medium truncate">{p.name}</div>
            <div className="text-xs opacity-60 mt-1 truncate">{p.path}</div>
            {/* Progress Bar */}
            <div className="h-1 bg-gray-800 rounded-full mt-2">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

ProjectList.displayName = 'ProjectList';
