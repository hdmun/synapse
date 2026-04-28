import Fastify from 'fastify';
import cors from '@fastify/cors';
import { socketPlugin } from './plugins/socket';
import apiRoutes from './routes/api';
import { Syncer } from './services/syncer';
import { Watcher } from './services/watcher';
import { initDb } from './db';
import { AppError } from './utils/errors';

export interface AppConfig {
  targetDir: string;
  isTest?: boolean;
}

export async function buildApp(config: AppConfig) {
  const fastify = Fastify({ logger: !config.isTest });
  
  // Register Socket.io plugin
  await fastify.register(socketPlugin as any, { socketOptions: { cors: { origin: '*' } } });
  
  await fastify.register(cors);
  await fastify.register(apiRoutes);

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
  const syncer = new Syncer(config.targetDir, (sessionId, data) => {
    fastify.io.emit('session-update', { sessionId, ...data });
  });
  const watcher = new Watcher(syncer);

  if (!config.isTest) {
    fastify.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
    });
  }

  return {
    fastify,
    io: fastify.io, // Keep returning io for compatibility with tests
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
