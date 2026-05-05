export interface UnifiedMessage {
  id: string;
  type: 'user' | 'agent' | 'info' | 'error';
  content: string;
  timestamp: Date;
  inputTokens?: number;
  outputTokens?: number;
  thoughtTokens?: number;
  thoughts?: any[];
  toolCalls?: any[];
}

export interface UnifiedSession {
  source: 'gemini' | 'copilot';
  id: string;
  projectPath: string; // Used to derive projectId/projectHash
  summary?: string;
  model?: string;
  startTime: Date;
  lastUpdated: Date;
  messages: UnifiedMessage[];
}

export interface CollectorEvents {
  'session-update': (session: UnifiedSession) => void;
  'error': (error: Error) => void;
}

export interface Collector {
  start(): Promise<void>;
  stop(): Promise<void>;
  on<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this;
  off<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this;
}
