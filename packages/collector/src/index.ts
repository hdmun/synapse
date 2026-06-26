import { loadConfig } from '@synapse/shared';
import { GeminiCollector } from './collectors/gemini.collector';
import { ClaudeCollector } from './collectors/claude.collector';
import { CopilotCollector } from './collectors/copilot.collector';
import { CodexCollector } from './collectors/codex.collector';
import { FileWriter } from './file-writer';

async function main() {
  const config = loadConfig();
  const fileWriter = new FileWriter(config);
  
  const collectors = [
    new GeminiCollector(config.agents.gemini.dir),
    new ClaudeCollector(config.agents.claude.dir),
    new CopilotCollector(config.agents.copilot.dbPath),
    new CodexCollector(config.agents.codex.dir),
  ];

  for (const collector of collectors) {
    collector.on('session-update', (event) => fileWriter.write(event));
    collector.on('error', (err) => console.error(`[${collector.constructor.name}] Error:`, err));
    await collector.start();
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    for (const c of collectors) await c.stop();
    process.exit(0);
  });
}

main();
