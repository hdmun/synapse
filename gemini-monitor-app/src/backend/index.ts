import Fastify from 'fastify';
import { Server } from 'socket.io';
import cors from '@fastify/cors';
import { initDb, db } from './db';
import { Syncer } from './services/syncer';
import { Watcher } from './services/watcher';
import { projects, sessions, messages, thoughts, toolCalls } from './db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import path from 'path';

const fastify = Fastify({ logger: true });
const targetDir = process.env.GEMINI_TMP_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'tmp');
console.log('--------------------------------------------------');
console.log(`[DEBUG] Monitoring Gemini TMP: ${targetDir}`);
console.log('--------------------------------------------------');

// 1. Socket.io 서버 설정
const io = new Server(fastify.server, {
  cors: { origin: '*' }
});

// 2. 서버 실행
const start = async () => {
  try {
    await fastify.register(cors);
    await initDb();

    const syncer = new Syncer(targetDir, (sessionId, data) => {
      io.emit('session-update', { sessionId, ...data });
    });
    const watcher = new Watcher(syncer);
    watcher.start(targetDir);

    // Socket.io 연동 (DB 업데이트 시 이벤트를 보내는 훅 추가 가능)
    // 현재는 간단히 연결 시 메시지 출력
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
    });

    // --- API 엔드포인트 ---

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

      // FTS5 검색 쿼리 (가상 테이블에서 rowid 추출 후 원본 테이블 조인)
      // Drizzle에서 직접 가상 테이블을 조인하는 것이 복잡할 수 있어 직접 SQL 실행 검토
      const results = await db.execute(sql`
        SELECT m.*, s.projectId 
        FROM messages m
        JOIN messages_fts f ON m.rowid = f.rowid
        JOIN sessions s ON m.session_id = s.id
        WHERE f.content MATCH ${q}
        ORDER BY m.timestamp DESC
      `);
      return results;
    });

    await fastify.listen({ port: 4000 });
    console.log('Backend server running on http://localhost:4000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
