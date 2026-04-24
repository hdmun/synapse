import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. Projects 테이블
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), // 프로젝트 루트 해시 또는 경로 기반 ID
  path: text('path').notNull(),
  name: text('name').notNull(),
  totalTokens: integer('total_tokens').default(0),
  progress: real('progress').default(0), // Plan 기반 진행률 (0~100)
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
});

// 2. Sessions 테이블
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // sessionId
  projectId: text('project_id').references(() => projects.id),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['active', 'success', 'error', 'cancelled'] }).default('active'),
  model: text('model'),
  totalTokens: integer('total_tokens').default(0),
});

// 3. Messages 테이블 (FTS5 연동 대상)
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(), // messageId (UUID)
  sessionId: text('session_id').references(() => sessions.id),
  type: text('type', { enum: ['user', 'gemini', 'info', 'error'] }).notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  // Gemini 전용 필드
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  thoughtTokens: integer('thought_tokens'),
});

// 4. Thoughts 테이블 (Gemini 내부 사고 과정)
export const thoughts = sqliteTable('thoughts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  messageId: text('message_id').references(() => messages.id),
  subject: text('subject'),
  description: text('description').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// 5. ToolCalls 테이블
export const toolCalls = sqliteTable('tool_calls', {
  id: text('id').primaryKey(), // tool call ID
  messageId: text('message_id').references(() => messages.id),
  name: text('name').notNull(),
  args: text('args'), // JSON string
  result: text('result'), // JSON string
  status: text('status', { enum: ['success', 'error'] }).notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// 6. Plans 테이블 (체크리스트 추적용)
export const plans = sqliteTable('plans', {
  id: text('id').primaryKey(), // plan file path or hash
  sessionId: text('session_id').references(() => sessions.id),
  projectId: text('project_id').references(() => projects.id),
  content: text('content').notNull(),
  totalTasks: integer('total_tasks').default(0),
  completedTasks: integer('completed_tasks').default(0),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
});
