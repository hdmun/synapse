import path from 'path';
import { buildApp } from './app';

const targetDir = process.env.GEMINI_TMP_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'tmp');
const codexDir = process.env.CODEX_SESSIONS_DIR || path.join(process.env.USERPROFILE || '', '.codex', 'sessions');

async function main() {
  console.log('--------------------------------------------------');
  console.log(`[DEBUG] Monitoring Gemini TMP: ${targetDir}`);
  console.log(`[DEBUG] Monitoring Codex Sessions: ${codexDir}`);
  console.log('--------------------------------------------------');

  const { fastify, start } = await buildApp({ targetDir, codexDir });

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
