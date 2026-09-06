import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { ProjectList } from './components/ProjectList';
import { SessionList } from './components/SessionList';
import { ThemeProvider } from './components/theme-provider';
import { SidebarProvider } from './components/layout/sidebar-context';
import { ClientLayout } from './components/layout/client-layout';
import { Dashboard } from './components/Dashboard';
import { AlertCircle, RefreshCw, Activity, Cpu, Bell, Search } from 'lucide-react';

import { CommandPalette } from './components/CommandPalette';

const MessageViewer = lazy(() => import('./components/MessageViewer').then(m => ({ default: m.MessageViewer })));

function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-700 space-y-4">
      <Activity size={48} className="opacity-10 animate-spin" />
      <p className="text-sm font-medium">Loading...</p>
    </div>
  );
}

export const App = () => {
  const fetchProjects = useStore(state => state.fetchProjects);
  const loading = useStore(state => state.loading);
  
  // 통합 에러 상태 감시
  const error = useStore(state => state.projectsError || state.sessionsError || state.messagesError);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <BrowserRouter>
      <CommandPalette />
      <ThemeProvider>
        <SidebarProvider>
          <ClientLayout>
            <div className="flex-1 flex flex-col min-h-0 relative">
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

              {/* Top Header for Desktop */}
              <header className="hidden md:flex h-16 border-b border-slate-800 items-center justify-between px-8 shrink-0 bg-slate-900/50 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                          <Cpu size={18} className="text-indigo-500" />
                      </div>
                      <span className="font-bold text-slate-100 tracking-tight text-lg">Synapse Monitor</span>
                  </div>
                  <div className="flex items-center gap-6 text-slate-500">
                      <button 
                        onClick={() => fetchProjects()} 
                        title="Refresh data"
                        className="p-1.5 hover:text-indigo-400 hover:bg-slate-800/60 rounded-md transition-colors flex items-center gap-1.5 text-xs text-slate-400"
                      >
                        <RefreshCw size={16} className={loading ? "animate-spin text-indigo-400" : ""} />
                        <span>Refresh</span>
                      </button>
                      <button className="hover:text-indigo-400 transition-colors"><Search size={20} /></button>
                      <button className="hover:text-indigo-400 transition-colors relative">
                          <Bell size={20} />
                          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 border-2 border-slate-900 rounded-full"></span>
                      </button>
                      <div className="w-px h-6 bg-slate-800"></div>
                      <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-slate-300">Admin</span>
                              <span className="text-[10px] text-slate-400 font-bold">Static Mode</span>
                          </div>
                          <div className="w-8 h-8 bg-slate-800 rounded-lg border border-slate-700"></div>
                      </div>
                  </div>
              </header>

              <div className="flex-1 flex min-h-0 overflow-hidden">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={
                    <>
                      <ProjectList />
                      <SessionList />
                      <Suspense fallback={<Loading />}>
                        <MessageViewer />
                      </Suspense>
                    </>
                  } />
                  <Route path="/sessions" element={
                    <>
                      <SessionList />
                      <Suspense fallback={<Loading />}>
                        <MessageViewer />
                      </Suspense>
                    </>
                  } />
                </Routes>
              </div>
            </div>
          </ClientLayout>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
