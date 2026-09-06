import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// 1. Projects 테이블
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), // 프로젝트 루트 해시 또는 경로 기반 ID
  path: text('path').notNull(),
  name: text('name').notNull(),
  totalTokens: integer('total_tokens').default(0), // 전역 지표용 (필요시 추후 JSON화)
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  sessions: many(sessions),
}));

// 2. Sessions 테이블
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // sessionId
  projectId: text('project_id').references(() => projects.id),
  source: text('source').default('gemini').notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['active', 'success', 'error', 'cancelled'] }).default('active'),
  model: text('model'),
  summary: text('summary'),
  totalTokens: text('total_tokens'), // JSON string of TokenTaxonomy
  estimatedCost: real('estimated_cost').default(0),
});

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [sessions.projectId],
    references: [projects.id],
  }),
  messages: many(messages),
}));

// 3. Messages 테이블
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(), // messageId (UUID)
  sessionId: text('session_id').references(() => sessions.id),
  type: text('type', { enum: ['user', 'agent', 'info', 'error'] }).notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  // Tier 1: Core Taxonomy
  tokens: text('tokens'), // JSON string of TokenTaxonomy
  toolCalls: text('tool_calls'), // JSON string of ToolCall[]
  // Tier 2: Source Enrichers
  enrichers: text('enrichers'), // JSON string of Enrichers
});

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(sessions, {
    fields: [messages.sessionId],
    references: [sessions.id],
  }),
}));

