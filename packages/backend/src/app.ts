import Fastify from 'fastify';
import cors from '@fastify/cors';
import socketio from 'fastify-socket.io';
import apiRoutes from './routes/api';
import { initDb } from './db';
import { AppError } from './utils/errors';
import { Ingester } from './services/ingester';
import { loadConfig } from '@synapse/shared';
import fs from 'fs';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import type { SynapseConfig } from '@synapse/shared';

export interface AppConfig {
  isTest?: boolean;
}

export function registerFileRoutes(fastify: FastifyInstance, config: SynapseConfig) {
  fastify.get('/files/*', async (request, reply) => {
    const params = request.params as { '*': string };
    const rawPath = params['*'];
    if (!rawPath) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Missing file path' });
    }

    const decodedPath = decodeURIComponent(rawPath);
    const resolvedPath = path.resolve(decodedPath);

    const allowedRoots = [
      path.resolve(config.agents.gemini.dir),
      path.resolve(config.agents.claude.dir),
      path.resolve(config.agents.codex.dir),
      path.resolve(config.rawDir)
    ];

    const isAllowed = allowedRoots.some(allowedRoot => {
      const relative = path.relative(allowedRoot, resolvedPath);
      return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    });

    if (!isAllowed) {
      fastify.log.warn({ path: decodedPath }, 'Blocked access to file outside allowlist');
      return reply.status(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    try {
      if (!fs.existsSync(resolvedPath)) {
        return reply.status(404).send({ error: 'Not Found', message: 'File not found' });
      }

      const stream = fs.createReadStream(resolvedPath);
      return reply.send(stream);
    } catch (e: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: e.message });
    }
  });
}

export async function buildApp(config: AppConfig) {
  const fastify = Fastify({ logger: !config.isTest });
  const synapseConfig = loadConfig();
  
  await fastify.register(socketio, {
    cors: { origin: '*' }
  });
  
  await fastify.register(cors);
  await fastify.register(apiRoutes);

  // Register direct /files/* routes with path safety checks
  registerFileRoutes(fastify, synapseConfig);

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

  // Ingester initialization
  const ingester = new Ingester(synapseConfig, (payload) => {
    fastify.io.emit('session-update', payload);
  });

  if (!config.isTest) {
    fastify.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
    });
  }

  return {
    fastify,
    io: fastify.io,
    ingester,
    start: () => {
      ingester.start();
    },
    stop: async () => {
      await ingester.stop();
      await fastify.close();
    }
  };
}
