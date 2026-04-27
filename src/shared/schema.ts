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

export const messageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: z.string(),
  content: z.string(),
  timestamp: z.string(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  thoughtTokens: z.number().optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Message = z.infer<typeof messageSchema>;
