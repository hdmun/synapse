import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useStore } from './store/useStore';
import { io } from 'socket.io-client';
import { ProjectList } from './components/ProjectList';
import { SessionList } from './components/SessionList';
import type { SocketUpdatePayload } from '../shared/types';
import { AlertCircle, RefreshCw, Activity, User, Folder, MessageSquare, BarChart3, Archive, Cpu, Bell, Settings, Search } from 'lucide-react';

const MessageViewer = lazy(() => import('./components/MessageViewer').then(m => ({ default: m.MessageViewer })));

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
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200 font-sans relative">
      {/* Status Bar */}
      {!isConnected && (
        <div className="absolute top-0 left-0 w-full bg-amber-600/90 text-white text-[10px] py-1 text-center z-50 flex items-center justify-center gap-2">
          <RefreshCw size={12} className="animate-spin" />
          Disconnected. Attempting to reconnect...
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-rose-600 text-white px-4 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
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

      {/* Navigation Sidebar */}
      <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-8 shrink-0">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-500/20">
            <User size={20} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-6">
            <button className="p-3 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition-all">
                <Folder size={20} />
            </button>
            <button className="p-3 rounded-xl bg-slate-800 text-indigo-400 shadow-sm">
                <MessageSquare size={20} />
            </button>
            <button className="p-3 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition-all">
                <BarChart3 size={20} />
            </button>
            <button className="p-3 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition-all">
                <Archive size={20} />
            </button>
        </nav>

        <div className="mt-auto flex flex-col gap-6 items-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                24%
            </div>
            <button className="text-slate-500 hover:text-slate-300">
                <Settings size={20} />
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                      <Cpu size={18} className="text-indigo-500" />
                  </div>
                  <span className="font-bold text-slate-100 tracking-tight text-lg">Gemini Monitor</span>
              </div>
              <div className="flex items-center gap-6 text-slate-500">
                  <button className="hover:text-indigo-400 transition-colors"><Search size={20} /></button>
                  <button className="hover:text-indigo-400 transition-colors relative">
                      <Bell size={20} />
                      <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 border-2 border-slate-900 rounded-full"></span>
                  </button>
                  <div className="w-px h-6 bg-slate-800"></div>
                  <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-slate-300">Admin</span>
                          <span className="text-[10px] text-emerald-500 font-bold">Online</span>
                      </div>
                      <div className="w-8 h-8 bg-slate-800 rounded-lg border border-slate-700"></div>
                  </div>
              </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
              <ProjectList />
              <SessionList />
              <Suspense fallback={
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-700 space-y-4">
                  <Activity size={48} className="opacity-10 animate-spin" />
                  <p className="text-sm font-medium">Loading Viewer...</p>
                </div>
              }>
                <MessageViewer />
              </Suspense>
          </div>
      </main>
    </div>
  );
};
