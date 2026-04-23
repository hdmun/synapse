import { create } from 'zustand';

interface Project {
  id: string;
  name: string;
  path: string;
  progress: number;
}

interface Session {
  id: string;
  projectId: string;
  status: string;
  model: string;
  lastUpdated: string;
}

interface Message {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  thoughts?: any[];
  toolCalls?: any[];
}

interface AppState {
  projects: Project[];
  sessions: Session[];
  messages: Message[];
  currentProject: Project | null;
  currentSession: Session | null;
  searchQuery: string;

  setProjects: (projects: Project[]) => void;
  setSessions: (sessions: Session[]) => void;
  setMessages: (messages: Message[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentSession: (session: Session | null) => void;
  setSearchQuery: (query: string) => void;

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

  setProjects: (projects) => set({ projects }),
  setSessions: (sessions) => set({ sessions }),
  setMessages: (messages) => set({ messages }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  fetchProjects: async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    set({ projects: data });
  },

  fetchSessions: async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}/sessions`);
    const data = await res.json();
    set({ sessions: data });
  },

  fetchMessages: async (sessionId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    const data = await res.json();
    set({ messages: data });
  },
}));
