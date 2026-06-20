import { TokenTaxonomy, FeatureAdoptionTaxonomy, Enrichers, ToolCall } from '../../../shared/schema';

export interface UnifiedMessage {
  id: string;
  type: 'user' | 'agent' | 'info' | 'error';
  content: string;
  timestamp: Date;
  // Tier 1: Core Taxonomy
  tokens?: TokenTaxonomy;
  features?: FeatureAdoptionTaxonomy[];
  toolCalls?: ToolCall[];
  // Tier 2: Source Enrichers
  enrichers?: Enrichers;
}

export interface UnifiedSession {
  source: 'gemini' | 'copilot' | 'codex' | 'claude';
  id: string;
  projectPath: string; // Used to derive projectId/projectHash
  summary?: string;
  model?: string;
  startTime: Date;
  lastUpdated: Date;
  messages: UnifiedMessage[];
  // New Core Analytics Fields
  totalTokens?: TokenTaxonomy;
  estimatedCost?: number;
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
