import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Search, FolderGit2, MessageSquare, Home, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const projectsById = useStore(state => state.projectsById);
  const projectIds = useStore(state => state.projectIds);
  const sessionsById = useStore(state => state.sessionsById);
  const sessionIds = useStore(state => state.sessionIds);
  
  const setCurrentProject = useStore(state => state.setCurrentProject);
  const setCurrentSession = useStore(state => state.setCurrentSession);
  const fetchProjectSessions = useStore(state => state.fetchProjectSessions);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <Command 
          className="w-full flex flex-col"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <div className="flex items-center border-b border-slate-800 px-4 py-3">
            <Search className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
            <Command.Input 
              autoFocus 
              placeholder="Type a command or search..." 
              className="w-full bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500 font-medium h-8"
            />
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar transition-all">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-semibold text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/'))}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-slate-300",
                  "data-[selected=true]:bg-indigo-600/20 data-[selected=true]:text-indigo-300"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Home
              </Command.Item>
            </Command.Group>

            {projectIds.length > 0 && (
              <Command.Group heading="Projects" className="text-xs font-semibold text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 mt-2">
                {projectIds.map(id => {
                  const project = projectsById[id];
                  if (!project) return null;
                  return (
                    <Command.Item 
                      key={`proj-${id}`}
                      onSelect={() => runCommand(() => {
                        setCurrentProject(project);
                        fetchProjectSessions(project.id);
                        navigate('/projects');
                      })}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-slate-300",
                        "data-[selected=true]:bg-indigo-600/20 data-[selected=true]:text-indigo-300"
                      )}
                    >
                      <FolderGit2 className="w-4 h-4 text-slate-400" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate">{project.name}</span>
                        <span className="text-[10px] text-slate-500 truncate">{project.path}</span>
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {sessionIds.length > 0 && (
              <Command.Group heading="Recent Sessions (Current Project)" className="text-xs font-semibold text-slate-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 mt-2">
                {sessionIds.slice(0, 20).map(id => {
                  const session = sessionsById[id];
                  if (!session) return null;
                  return (
                    <Command.Item 
                      key={`sess-${id}`}
                      onSelect={() => runCommand(() => {
                        setCurrentSession(session);
                        navigate('/sessions');
                      })}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-slate-300",
                        "data-[selected=true]:bg-indigo-600/20 data-[selected=true]:text-indigo-300"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-500/70" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate">{session.summary || 'No summary'}</span>
                        <span className="text-[10px] text-slate-500">ID: {session.id.slice(0, 8)} • {session.model}</span>
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}