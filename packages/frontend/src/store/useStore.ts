import { create } from 'zustand';
import type { Project, Session, Message } from '@synapse/shared';

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
  filterAgents: string[];
  showEmptySessions: boolean;
  
  // 상태 관리
  projectsLoading: boolean;
  projectsError: string | null;
  sessionsLoading: boolean;
  sessionsError: string | null;
  messagesLoading: boolean;
  messagesError: string | null;

  setProjects: (projects: Project[]) => void;
  setSessions: (sessions: Session[]) => void;
  setMessages: (messages: Message[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentSession: (session: Session | null) => void;
  setSearchQuery: (query: string) => void;
  toggleFilterAgent: (agent: string) => void;
  toggleShowEmptySessions: () => void;

  // Delta Updates
  addMessage: (sessionId: string, message: Message) => void;
  updateProject: (project: Partial<Project> & { id: string }) => void;
  updateSession: (session: Partial<Session> & { id: string }) => void;

  // 비동기 액션
  fetchProjects: () => Promise<void>;
  fetchSessions: (projectId: string) => Promise<void>;
  fetchMessages: (sessionId: string) => Promise<void>;
  
  tokenStats: { name: string, tokens: number }[];
  tokenStatsLoading: boolean;
  tokenStatsError: string | null;
  fetchTokenStats: () => Promise<void>;

  activityStats: { date: string, count: number, level: number }[];
  activityStatsLoading: boolean;
  activityStatsError: string | null;
  fetchActivityStats: () => Promise<void>;
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
  filterAgents: ['gemini', 'copilot', 'codex'],
  showEmptySessions: false,
  
  projectsLoading: false,
  projectsError: null,
  sessionsLoading: false,
  sessionsError: null,
  messagesLoading: false,
  messagesError: null,

  tokenStats: [],
  tokenStatsLoading: false,
  tokenStatsError: null,

  activityStats: [],
  activityStatsLoading: false,
  activityStatsError: null,

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
  toggleFilterAgent: (agent) => set((state) => ({
    filterAgents: state.filterAgents.includes(agent)
      ? state.filterAgents.filter(a => a !== agent)
      : [...state.filterAgents, agent]
  })),

  toggleShowEmptySessions: () => set((state) => ({
    showEmptySessions: !state.showEmptySessions
  })),

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
    set({ projectsLoading: true, projectsError: null });
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      get().setProjects(data);
    } catch (err: any) {
      set({ projectsError: err.message });
    } finally {
      set({ projectsLoading: false });
    }
  },

  fetchSessions: async (projectId: string) => {
    const isInitial = get().sessionIds.length === 0;
    set({ sessionsLoading: true, sessionsError: null, sessionIds: isInitial ? [] : get().sessionIds });
    try {
      const res = await fetch(`/api/projects/${projectId}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      get().setSessions(data);
    } catch (err: any) {
      set({ sessionsError: err.message });
    } finally {
      set({ sessionsLoading: false });
    }
  },

  fetchMessages: async (sessionId: string) => {
    const isInitial = get().messageIds.length === 0;
    set({ messagesLoading: true, messagesError: null, messageIds: isInitial ? [] : get().messageIds });
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      get().setMessages(data);
    } catch (err: any) {
      set({ messagesError: err.message });
    } finally {
      set({ messagesLoading: false });
    }
  },

  fetchTokenStats: async () => {
    set({ tokenStatsLoading: true, tokenStatsError: null });
    try {
      const res = await fetch('/api/stats/tokens');
      if (!res.ok) throw new Error('Failed to fetch token stats');
      const data = await res.json();
      set({ tokenStats: data });
    } catch (err: any) {
      set({ tokenStatsError: err.message });
    } finally {
      set({ tokenStatsLoading: false });
    }
  },

  fetchActivityStats: async () => {
    set({ activityStatsLoading: true, activityStatsError: null });
    try {
      const res = await fetch('/api/stats/activity');
      if (!res.ok) throw new Error('Failed to fetch activity stats');
      const data = await res.json();
      set({ activityStats: data });
    } catch (err: any) {
      set({ activityStatsError: err.message });
    } finally {
      set({ activityStatsLoading: false });
    }
  },
}));
