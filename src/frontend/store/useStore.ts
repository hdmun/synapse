import { create } from 'zustand';
import type { Project, Session, Message } from '../../shared/schema';

interface AppState {
  projects: Project[];
  sessions: Session[];
  messages: Message[];
  currentProject: Project | null;
  currentSession: Session | null;
  searchQuery: string;
  
  // 상태 관리
  loading: boolean;
  error: string | null;

  setProjects: (projects: Project[]) => void;
  setSessions: (sessions: Session[]) => void;
  setMessages: (messages: Message[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentSession: (session: Session | null) => void;
  setSearchQuery: (query: string) => void;

  // Delta Updates
  addMessage: (sessionId: string, message: Message) => void;
  updateProject: (project: Partial<Project> & { id: string }) => void;
  updateSession: (session: Partial<Session> & { id: string }) => void;

  // 비동기 액션
  fetchProjects: () => Promise<void>;
  fetchSessions: (projectId: string) => Promise<void>;
  fetchMessages: (sessionId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  sessions: [],
  messages: [],
  currentProject: null,
  currentSession: null,
  searchQuery: '',
  loading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setSessions: (sessions) => set({ sessions }),
  setMessages: (messages) => set({ messages }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addMessage: (sessionId, message) => set((state) => {
    if (state.currentSession?.id === sessionId) {
      // 중복 방지 로직 (ID 기준)
      const exists = state.messages.some(m => m.id === message.id);
      if (exists) return state;
      
      return { messages: [...state.messages, message] };
    }
    return state;
  }),

  updateProject: (updatedProject) => set((state) => ({
    projects: state.projects.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p),
    currentProject: state.currentProject?.id === updatedProject.id ? { ...state.currentProject, ...updatedProject } : state.currentProject
  })),

  updateSession: (updatedSession) => set((state) => ({
    sessions: state.sessions.map(s => s.id === updatedSession.id ? { ...s, ...updatedSession } : s),
    currentSession: state.currentSession?.id === updatedSession.id ? { ...state.currentSession, ...updatedSession } : state.currentSession
  })),

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      set({ projects: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchSessions: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/projects/${projectId}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      set({ sessions: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMessages: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      set({ messages: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
