import fs from 'fs/promises';
import path from 'path';
import type { CollectedEvent, SynapseConfig } from '@synapse/shared';

export class FileWriter {
  constructor(private config: SynapseConfig) {}

  async write(event: CollectedEvent): Promise<void> {
    const { session, raw, artifacts = [] } = event;

    // 1. source-native raw 저장
    const rawDir = path.join(this.config.rawDir, session.source);
    await fs.mkdir(rawDir, { recursive: true });
    await fs.writeFile(
      path.join(rawDir, `${session.id}.json`),
      JSON.stringify(raw, null, 2), 'utf-8'
    );

    // 2. unified 저장 (백엔드가 감시하는 디렉토리)
    const timestamp = Date.now();
    await fs.mkdir(this.config.unifiedDir, { recursive: true });
    await fs.writeFile(
      path.join(this.config.unifiedDir, `${session.id}-${timestamp}.json`),
      JSON.stringify(session, null, 2), 'utf-8'
    );

    // 3. plan/tool-output 등 부가 아티팩트 저장
    for (const artifact of artifacts) {
      const baseDir =
        artifact.kind === 'plan' ? this.config.plansDir : this.config.toolOutputsDir;
      const artifactDir = path.join(baseDir, session.source, session.id);
      await fs.mkdir(artifactDir, { recursive: true });
      await fs.writeFile(path.join(artifactDir, artifact.fileName), artifact.content, 'utf-8');
    }
  }
}
