import { buildApp } from './app';
import { loadConfig } from '@synapse/shared';

async function main() {
  const config = loadConfig();
  console.log('--------------------------------------------------');
  console.log(`[DEBUG] Synapse Backend Server Starting`);
  console.log(`[DEBUG] DB Path: ${config.dbPath}`);
  console.log(`[DEBUG] Unified Dir: ${config.unifiedDir}`);
  console.log('--------------------------------------------------');

  const { fastify, start } = await buildApp({});

  try {
    start();
    await fastify.listen({ port: 4000 });
    console.log('Backend server running on http://localhost:4000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
