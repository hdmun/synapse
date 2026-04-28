import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getProjects, getProjectSessions } from '../controllers/project.controller';
import { getSessionDetails } from '../controllers/session.controller';
import { searchMessages } from '../controllers/search.controller';

export default async function apiRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get('/api/projects', async (request, reply) => {
    return await getProjects();
  });

  server.get('/api/projects/:id/sessions', {
    schema: {
      params: z.object({
        id: z.string()
      })
    }
  }, async (request, reply) => {
    const { id } = request.params;
    return await getProjectSessions(id);
  });

  server.get('/api/sessions/:id', {
    schema: {
      params: z.object({
        id: z.string()
      })
    }
  }, async (request, reply) => {
    const { id } = request.params;
    return await getSessionDetails(id);
  });

  server.get('/api/search', {
    schema: {
      querystring: z.object({
        q: z.string().optional().default('')
      })
    }
  }, async (request, reply) => {
    const { q } = request.query;
    return await searchMessages(q);
  });
}
