import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import type { ServerOptions } from 'socket.io';

export interface SocketPluginOptions {
  socketOptions?: ServerOptions;
}

export const socketPlugin = fp(async (fastify, opts: SocketPluginOptions) => {
  const io = new Server(fastify.server, opts.socketOptions);
  fastify.decorate('io', io);
  
  fastify.addHook('onClose', (instance, done) => {
    io.close();
    done();
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}
