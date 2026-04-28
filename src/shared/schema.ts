import { z } from 'zod';

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  progress: z.number().min(0).max(100),
  lastUpdated: z.string().optional(),
});

export const sessionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  status: z.string().optional(),
  model: z.string(),
  startTime: z.string(),
  lastUpdated: z.string(),
  summary: z.string().optional(),
});

export const thoughtSchema = z.object({
  id: z.number().optional(),
  messageId: z.string(),
  subject: z.string(),
  description: z.string(),
  timestamp: z.string(),
});

export const toolCallSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  name: z.string(),
  args: z.string(),
  result: z.string().optional(),
  status: z.string(),
  timestamp: z.string(),
});

export const messageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: z.string(),
  content: z.string(),
  timestamp: z.string(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  thoughtTokens: z.number().optional(),
  thoughts: z.array(thoughtSchema).optional(),
  toolCalls: z.array(toolCallSchema).optional(),
});

export const socketUpdateTypeSchema = z.enum(['message', 'progress', 'status', 'sync']);

export const socketUpdatePayloadSchema = z.object({
  type: socketUpdateTypeSchema,
  sessionId: z.string(),
  projectId: z.string().optional(),
  message: messageSchema.optional(),
  progress: z.number().optional(),
  status: z.string().optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Thought = z.infer<typeof thoughtSchema>;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type Message = z.infer<typeof messageSchema>;
export type SocketUpdateType = z.infer<typeof socketUpdateTypeSchema>;
export type SocketUpdatePayload = z.infer<typeof socketUpdatePayloadSchema>;

// ESM 호환성을 위한 상수 (기존 types.ts에서 마이그레이션됨)
export const TYPES_VERSION = '1.0.0';
