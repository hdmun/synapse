import path from 'path';
import { buildApp } from './app';

const targetDir = process.env.GEMINI_TMP_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'tmp');

async function main() {
  console.log('--------------------------------------------------');
  console.log(`[DEBUG] Monitoring Gemini TMP: ${targetDir}`);
  console.log('--------------------------------------------------');

  const { fastify, start } = await buildApp({ targetDir });

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
