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
