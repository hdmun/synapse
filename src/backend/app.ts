import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import socketio from 'fastify-socket.io';
import apiRoutes from './routes/api';
import { SyncManager } from './services/sync.manager';
import { GeminiCollector } from './services/collectors/gemini.collector';
import { CopilotCollector } from './services/collectors/copilot.collector';
import { initDb } from './db';
import { AppError } from './utils/errors';

export interface AppConfig {
  targetDir: string;
  isTest?: boolean;
}

export async function buildApp(config: AppConfig) {
  const fastify = Fastify({ logger: !config.isTest });
  
  // Register Socket.io plugin using the official fastify-socket.io
  await fastify.register(socketio, {
    cors: { origin: '*' }
  });
  
  await fastify.register(cors);
  await fastify.register(apiRoutes);

  // Register static file serving for local files
  await fastify.register(fastifyStatic, {
    root: config.targetDir,
    prefix: '/files/',
  });

  // Global Error Handler
  fastify.setErrorHandler((error: any, request, reply) => {
    if (error instanceof AppError) {
      fastify.log.warn({ err: error }, 'Operational error');
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message
      });
    }

    if (error.validation) {
      fastify.log.warn({ err: error }, 'Validation error');
      return reply.status(400).send({
        error: 'Bad Request',
        message: error.message,
        details: error.validation
      });
    }

    // Default error handler
    fastify.log.error({ err: error }, 'Unhandled error');
    reply.status(500).send({
      error: 'Internal Server Error',
      message: config.isTest ? error.message : 'Something went wrong'
    });
  });

  // DB initialization
  await initDb();

  // Service initialization
  const syncManager = new SyncManager((sessionId, data) => {
    fastify.io.emit('session-update', { sessionId, ...data });
  });

  const geminiCollector = new GeminiCollector(config.targetDir);
  geminiCollector.on('session-update', (session) => syncManager.syncSession(session));
  geminiCollector.on('error', (err) => fastify.log.error(`[GeminiCollector] Error: ${err}`));

  const copilotCollector = new CopilotCollector();
  copilotCollector.on('session-update', (session) => syncManager.syncSession(session));
  copilotCollector.on('error', (err) => fastify.log.error(`[CopilotCollector] Error: ${err}`));

  if (!config.isTest) {
    fastify.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
    });
  }

  return {
    fastify,
    io: fastify.io, // Keep returning io for compatibility with tests
    syncManager,
    geminiCollector,
    copilotCollector,
    start: () => {
      geminiCollector.start();
      copilotCollector.start();
    },
    stop: async () => {
      await geminiCollector.stop();
      await copilotCollector.stop();
      await fastify.close();
    }
  };
}
