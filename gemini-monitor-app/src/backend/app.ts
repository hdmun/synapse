import Fastify, { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import cors from '@fastify/cors';
import { apiRoutes } from './routes/api';
import { Syncer } from './services/syncer';
import { Watcher } from './services/watcher';
import { initDb } from './db';

export interface AppConfig {
  targetDir: string;
  isTest?: boolean;
}

export async function buildApp(config: AppConfig) {
  const fastify = Fastify({ logger: !config.isTest });
  
  // 1. Socket.io 서버 설정
  const io = new Server(fastify.server, {
    cors: { origin: '*' }
  });

  await fastify.register(cors);
  await fastify.register(apiRoutes);

  // 2. 서비스 초기화
  const syncer = new Syncer(config.targetDir, (sessionId, data) => {
    io.emit('session-update', { sessionId, ...data });
  });
  const watcher = new Watcher(syncer);

  // DB 초기화
  await initDb();

  // Socket.io 연결 로그 (테스트 환경이 아닐 때만)
  if (!config.isTest) {
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
    });
  }

  return {
    fastify,
    io,
    syncer,
    watcher,
    start: () => {
      watcher.start(config.targetDir);
    },
    stop: async () => {
      watcher.stop();
      await fastify.close();
    }
  };
}
