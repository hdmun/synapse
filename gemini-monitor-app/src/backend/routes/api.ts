import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { projects, sessions, messages, thoughts, toolCalls } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export default async function apiRoutes(fastify: FastifyInstance) {
  // ... (기존 라우트들 생략되지 않도록 전체 교체 또는 정확한 부분 교체 필요)

  // 1. 모든 프로젝트 조회
  fastify.get('/api/projects', async () => {
    return await db.select().from(projects).orderBy(desc(projects.lastUpdated));
  });

  // 2. 특정 프로젝트의 세션 목록 조회
  fastify.get('/api/projects/:id/sessions', async (request) => {
    const { id } = request.params as { id: string };
    return await db.select().from(sessions)
      .where(eq(sessions.projectId, id))
      .orderBy(desc(sessions.lastUpdated));
  });

  // 3. 특정 세션의 메시지 상세 조회 (Thoughts, ToolCalls 포함)
  fastify.get('/api/sessions/:id', async (request) => {
    const { id } = request.params as { id: string };
    const msgs = await db.select().from(messages)
      .where(eq(messages.sessionId, id))
      .orderBy(desc(messages.timestamp));
    
    const res = await Promise.all(msgs.map(async (m) => {
      const [thoughtList, toolList] = await Promise.all([
        db.select().from(thoughts).where(eq(thoughts.messageId, m.id)),
        db.select().from(toolCalls).where(eq(toolCalls.messageId, m.id))
      ]);
      return { ...m, thoughts: thoughtList, toolCalls: toolList };
    }));
    
    return res;
  });

  // 4. 전역 검색 (SQLite FTS5 활용)
  fastify.get('/api/search', async (request) => {
    const { q } = request.query as { q: string };
    if (!q) return [];

    const results = await db.all(sql`
      SELECT m.*, s.project_id as projectId 
      FROM messages m
      JOIN messages_fts f ON m.rowid = f.rowid
      JOIN sessions s ON m.session_id = s.id
      WHERE f.content MATCH ${q}
      ORDER BY m.timestamp DESC
    `);
    return results;
  });
}
