import { z } from 'zod';

export const tokenTaxonomySchema = z.object({
  base: z.number().default(0),
  cacheRead: z.number().optional(),
  cacheCreation: z.number().optional(),
  reasoning: z.number().optional(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  progress: z.number().min(0).max(100).optional(),
  totalTokens: z.number().optional(),
  lastUpdated: z.string().optional(),
  agents: z.array(z.string()).optional(),
});

export const sessionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  source: z.string().optional(),
  status: z.string().optional(),
  model: z.string(),
  startTime: z.string(),
  lastUpdated: z.string(),
  summary: z.string().optional(),
  messageCount: z.number().optional(),
  totalTokens: tokenTaxonomySchema.optional(),
  estimatedCost: z.number().optional(),
});

export const thoughtTraceSchema = z.object({
  subject: z.string().optional(),
  description: z.string(),
  timestamp: z.string().optional(),
});

export const thoughtSchema = thoughtTraceSchema;

export const toolCallSchema = z.object({
  id: z.string().optional(),
  messageId: z.string().optional(),
  name: z.string(),
  args: z.string().optional(),
  result: z.string().optional(),
  status: z.string().optional(),
  timestamp: z.string().optional(),
});

// Source Enrichers
export const geminiEnricherSchema = z.object({
  thoughtTrace: z.array(thoughtTraceSchema).optional(),
});

export const claudeEnricherSchema = z.object({
  facet: z.object({
    goal: z.string().optional(),
    outcome: z.string().optional(),
    sessionType: z.string().optional(),
    friction: z.string().optional(),
  }).optional(),
});

export const copilotEnricherSchema = z.object({
  plan: z.object({
    tasks: z.array(z.object({
      id: z.string(),
      text: z.string(),
      status: z.enum(['todo', 'in-progress', 'done', 'skipped']),
    })),
  }).optional(),
});

export const enrichersSchema = z.object({
  gemini: geminiEnricherSchema.optional(),
  claude: claudeEnricherSchema.optional(),
  copilot: copilotEnricherSchema.optional(),
});

export const messageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: z.string(),
  content: z.string(),
  timestamp: z.string(),
  // Tier 1: Core Taxonomy & Minimum Contract
  tokens: tokenTaxonomySchema.optional(),
  toolCalls: z.array(toolCallSchema).optional(),
  thoughtTraces: z.array(thoughtTraceSchema).optional(),
  // Tier 2: Source Enrichers
  enrichers: enrichersSchema.optional(),
  // Transitional fields
  thoughts: z.string().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
});

export type TokenTaxonomy = z.infer<typeof tokenTaxonomySchema>;
export type GeminiEnricher = z.infer<typeof geminiEnricherSchema>;
export type ClaudeEnricher = z.infer<typeof claudeEnricherSchema>;
export type CopilotEnricher = z.infer<typeof copilotEnricherSchema>;
export type Enrichers = z.infer<typeof enrichersSchema>;

export type Project = z.infer<typeof projectSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type ThoughtTrace = z.infer<typeof thoughtTraceSchema>;
export type Thought = ThoughtTrace;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type Message = z.infer<typeof messageSchema>;

export const TYPES_VERSION = '1.0.0';

