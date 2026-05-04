import { create } from 'zustand';
import type { Project, Session, Message } from '../../shared/schema';

interface AppState {
  projectsById: Record<string, Project>;
  projectIds: string[];
  
  sessionsById: Record<string, Session>;
  sessionIds: string[];
  
  messagesById: Record<string, Message>;
  messageIds: string[];

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
  projectsById: {},
  projectIds: [],
  
  sessionsById: {},
  sessionIds: [],
  
  messagesById: {},
  messageIds: [],

  currentProject: null,
  currentSession: null,
  searchQuery: '',
  loading: false,
  error: null,

  setProjects: (projects) => {
    const projectsById: Record<string, Project> = {};
    const projectIds: string[] = [];
    projects.forEach(p => {
      projectsById[p.id] = p;
      projectIds.push(p.id);
    });
    set({ projectsById, projectIds });
  },

  setSessions: (sessions) => {
    const sessionsById: Record<string, Session> = {};
    const sessionIds: string[] = [];
    sessions.forEach(s => {
      sessionsById[s.id] = s;
      sessionIds.push(s.id);
    });
    set({ sessionsById, sessionIds });
  },

  setMessages: (messages) => {
    const messagesById: Record<string, Message> = {};
    const messageIds: string[] = [];
    messages.forEach(m => {
      messagesById[m.id] = m;
      messageIds.push(m.id);
    });
    set({ messagesById, messageIds });
  },

  setCurrentProject: (currentProject) => set({ currentProject }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addMessage: (sessionId, message) => set((state) => {
    if (state.currentSession?.id === sessionId) {
      if (state.messagesById[message.id]) return state; // 중복 방지
      
      return {
        messagesById: { ...state.messagesById, [message.id]: message },
        messageIds: [...state.messageIds, message.id]
      };
    }
    return state;
  }),

  updateProject: (updatedProject) => set((state) => {
    const existing = state.projectsById[updatedProject.id];
    if (!existing) return state;

    return {
      projectsById: {
        ...state.projectsById,
        [updatedProject.id]: { ...existing, ...updatedProject }
      },
      currentProject: state.currentProject?.id === updatedProject.id 
        ? { ...state.currentProject, ...updatedProject } 
        : state.currentProject
    };
  }),

  updateSession: (updatedSession) => set((state) => {
    const existing = state.sessionsById[updatedSession.id];
    if (!existing) return state;

    return {
      sessionsById: {
        ...state.sessionsById,
        [updatedSession.id]: { ...existing, ...updatedSession }
      },
      currentSession: state.currentSession?.id === updatedSession.id 
        ? { ...state.currentSession, ...updatedSession } 
        : state.currentSession
    };
  }),

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      get().setProjects(data);
      set({ loading: false });
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
      get().setSessions(data);
      set({ loading: false });
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
      get().setMessages(data);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
