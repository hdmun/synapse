import { TokenTaxonomy, FeatureAdoptionTaxonomy, Enrichers, ToolCall } from './schema';

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
  // Collector fields directly assigned
  thoughts?: string;
  inputTokens?: number;
  outputTokens?: number;
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

export interface CollectedArtifact {
  kind: 'plan' | 'tool-output';
  fileName: string;
  content: string;
}

export interface CollectedEvent {
  session: UnifiedSession;
  raw: unknown;
  artifacts?: CollectedArtifact[];
}

export interface CollectorEvents {
  'session-update': (event: CollectedEvent) => void;
  'error': (error: Error) => void;
}

export interface Collector {
  start(): Promise<void>;
  stop(): Promise<void>;
  on<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this;
  off<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this;
}
