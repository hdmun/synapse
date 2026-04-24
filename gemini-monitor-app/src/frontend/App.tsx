import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { io } from 'socket.io-client';
import { ProjectList } from './components/ProjectList';
import { SessionList } from './components/SessionList';
import { MessageViewer } from './components/MessageViewer';
import { SocketUpdatePayload } from '../shared/types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App = () => {
  const fetchProjects = useStore(state => state.fetchProjects);
  const addMessage = useStore(state => state.addMessage);
  const updateProject = useStore(state => state.updateProject);
  const updateSession = useStore(state => state.updateSession);
  const error = useStore(state => state.error);
  
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchProjects();
    
    const socket = io();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('session-update', (data: SocketUpdatePayload) => {
      console.log('Update received:', data);
      
      switch (data.type) {
        case 'message':
          if (data.message) addMessage(data.sessionId, data.message);
          break;
        case 'progress':
          if (data.projectId) updateProject({ id: data.projectId, progress: data.progress });
          break;
        case 'status':
          updateSession({ id: data.sessionId, status: data.status });
          break;
        case 'sync':
          fetchProjects();
          break;
        default:
          console.warn('Unknown update type received:', data.type);
      }
    });

    return () => { socket.disconnect(); };
  }, [fetchProjects, addMessage, updateProject, updateSession]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 font-sans relative">
      {/* Status Bar */}
      {!isConnected && (
        <div className="absolute top-0 left-0 w-full bg-yellow-600/90 text-white text-[10px] py-1 text-center z-50 flex items-center justify-center gap-2">
          <RefreshCw size={12} className="animate-spin" />
          Disconnected. Attempting to reconnect...
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <AlertCircle size={20} />
          <div className="text-sm font-medium">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      <ProjectList />
      <SessionList />
      <MessageViewer />
    </div>
  );
};
