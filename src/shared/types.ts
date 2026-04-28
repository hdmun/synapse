export interface Project {
  id: string;
  name: string;
  path: string;
  progress: number;
  lastUpdated?: string;
}

export interface Session {
  id: string;
  projectId: string;
  status?: string;
  model: string;
  summary?: string;
  startTime: string;
  lastUpdated: string;
}

export interface Message {
  id: string;
  sessionId: string;
  type: string;
  content: string;
  timestamp: string;
  inputTokens?: number;
  outputTokens?: number;
  thoughtTokens?: number;
  thoughts?: Thought[];
  toolCalls?: ToolCall[];
}

export interface Thought {
  id?: number;
  messageId: string;
  subject: string;
  description: string;
  timestamp: string;
}

export interface ToolCall {
  id: string;
  messageId: string;
  name: string;
  args: string;
  result?: string;
  status: string;
  timestamp: string;
}

export type SocketUpdateType = 'message' | 'progress' | 'status' | 'sync';

export interface SocketUpdatePayload {
  type: SocketUpdateType;
  sessionId: string;
  projectId?: string;
  message?: Message;
  progress?: number;
  status?: string;
}

// 런타임 모듈 인식 및 ESM 호환성을 위한 상수
export const TYPES_VERSION = '1.0.0';
