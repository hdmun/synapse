import path from 'path';

export interface SynapseConfig {
  repoRoot: string;            // 모노레포 루트 절대 경로
  collectedDir: string;       // collected/ 루트
  rawDir: string;             // collected/raw/
  unifiedDir: string;         // collected/unified/
  processedDir: string;       // collected/processed/
  errorDir: string;           // collected/error/ (파싱 실패 등 격리)
  plansDir: string;           // collected/plans/
  toolOutputsDir: string;     // collected/tool-outputs/
  dbPath: string;             // synapse.db 경로
  agents: {
    gemini: { dir: string };
    claude: { dir: string };
    copilot: { dbPath: string };
    codex: { dir: string };
  };
}

function resolveRepoRoot(): string {
  // Bun runtime defines import.meta.dir, which points to packages/shared/src/
  return process.env.SYNAPSE_ROOT || path.resolve(import.meta.dir, '../../..');
}

export function loadConfig(): SynapseConfig {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const repoRoot = resolveRepoRoot();
  const collectedDir = process.env.SYNAPSE_COLLECTED_DIR || path.join(repoRoot, 'data', 'collected');
  
  return {
    repoRoot,
    collectedDir,
    rawDir: path.join(collectedDir, 'raw'),
    unifiedDir: path.join(collectedDir, 'unified'),
    processedDir: path.join(collectedDir, 'processed'),
    errorDir: path.join(collectedDir, 'error'),
    plansDir: path.join(collectedDir, 'plans'),
    toolOutputsDir: path.join(collectedDir, 'tool-outputs'),
    dbPath: process.env.DATABASE_URL || path.join(repoRoot, 'synapse.db'),
    agents: {
      gemini: { dir: process.env.GEMINI_TMP_DIR || path.join(home, '.gemini', 'tmp') },
      claude: { dir: process.env.CLAUDE_PROJECTS_DIR || path.join(home, '.claude', 'projects') },
      copilot: { dbPath: process.env.COPILOT_DB_PATH || path.join(home, '.copilot', 'session-store.db') },
      codex: { dir: process.env.CODEX_SESSIONS_DIR || path.join(home, '.codex', 'sessions') },
    },
  };
}
