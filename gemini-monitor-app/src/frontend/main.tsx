import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useStore } from './store/useStore';
import { io } from 'socket.io-client';
import { Layout, FolderOpen, MessageSquare, Terminal, Search, Activity } from 'lucide-react';

const App = () => {
  const { 
    projects, sessions, messages, currentProject, currentSession,
    fetchProjects, fetchSessions, fetchMessages, 
    setCurrentProject, setCurrentSession 
  } = useStore();

  useEffect(() => {
    fetchProjects();
    
    const socket = io();
    socket.on('session-update', (data: { sessionId: string, type: string, progress?: number }) => {
      console.log('Update received:', data);
      
      // 1. 현재 보고 있는 세션이 업데이트된 경우 메시지 갱신
      if (currentSession?.id === data.sessionId) {
        fetchMessages(data.sessionId);
      }
      
      // 2. 프로젝트 목록 및 세션 목록 갱신 (진행률 등 반영)
      fetchProjects();
      if (currentProject) {
        fetchSessions(currentProject.id);
      }
    });

    return () => { socket.disconnect(); };
  }, [currentProject, currentSession]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 font-sans">
      {/* 1. Project Explorer (Left Pane) */}
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

      {/* 2. Session Browser (Middle Pane) */}
      <div className="w-72 border-r border-gray-800 flex flex-col bg-gray-900/30">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <MessageSquare size={20} className="text-emerald-400" />
          <h2 className="font-bold">Sessions</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => { setCurrentSession(s); fetchMessages(s.id); }}
              className={`w-full text-left p-3 rounded-lg mb-1 transition ${currentSession?.id === s.id ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/50' : 'hover:bg-gray-800 text-gray-400'}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm truncate">{s.id.slice(0, 8)}...</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'}`}>
                  {s.status}
                </span>
              </div>
              <div className="text-xs opacity-60 mt-1">{s.model}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Detail Viewer (Main Pane) */}
      <div className="flex-1 flex flex-col bg-gray-950">
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/20">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-200">
              {currentSession ? `Session: ${currentSession.id.slice(0, 12)}...` : 'Select a session'}
            </h3>
            {currentSession && (
               <div className="flex gap-2 text-[10px] uppercase tracking-wider font-bold">
                 <span className="text-gray-500">Model:</span>
                 <span className="text-blue-400">{currentSession.model}</span>
               </div>
            )}
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-gray-800 rounded-lg p-1 flex items-center">
                <Search size={16} className="mx-2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="FTS5 Search..." 
                  className="bg-transparent border-none focus:outline-none text-sm w-48"
                />
             </div>
             <Activity size={20} className="text-gray-600" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${m.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100 border border-gray-700'}`}>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                
                {/* Thought Flow (Gemini Only) */}
                {m.thoughts && m.thoughts.length > 0 && (
                  <div className="mt-4 border-t border-gray-700 pt-3 space-y-2">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <Terminal size={12} /> Thought Process
                    </div>
                    {m.thoughts.map((t, idx) => (
                      <details key={idx} className="group">
                        <summary className="text-xs cursor-pointer text-gray-400 hover:text-gray-200 list-none flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {t.subject}
                        </summary>
                        <p className="mt-1 pl-4 text-xs text-gray-500 leading-relaxed">{t.description}</p>
                      </details>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-600 mt-2">{new Date(m.timestamp).toLocaleString()}</span>
            </div>
          ))}
          {!currentSession && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
              <Activity size={48} className="opacity-20" />
              <p className="text-sm">Select a project and session to start monitoring</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
