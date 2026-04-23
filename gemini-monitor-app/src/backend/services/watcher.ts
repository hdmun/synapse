import chokidar from 'chokidar';
import path from 'path';
import { Syncer } from './syncer';

export class Watcher {
  private watcher: chokidar.FSWatcher | null = null;
  private syncer: Syncer;
  private debounceMap = new Map<string, Timer>();

  constructor(syncer: Syncer) {
    this.syncer = syncer;
  }

  start(targetDir: string) {
    console.log(`Watching directory: ${targetDir}`);
    
    this.watcher = chokidar.watch(targetDir, {
      ignored: /(^|[\/\\])\../, // 숨김 파일 무시
      persistent: true,
      ignoreInitial: false, // 초기 로드 시에도 동기화 수행
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath))
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('error', (error) => console.error(`Watcher error: ${error}`));
  }

  private handleFileChange(filePath: string) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);

    // 1. 세션 JSON 파일 처리 (chats/session-*.json)
    if (ext === '.json' && fileName.startsWith('session-')) {
      this.debounce(filePath, () => this.syncer.syncSessionFile(filePath));
    }

    // 2. 계획서 MD 파일 처리 (세션ID/plans/*.md)
    if (ext === '.md' && filePath.includes('plans')) {
      // 경로 구조에서 sessionId 추출 (예: .../tmp/project/sessionId/plans/plan.md)
      const parts = filePath.split(path.sep);
      const plansIndex = parts.indexOf('plans');
      if (plansIndex > 0) {
        const sessionId = parts[plansIndex - 1];
        this.debounce(filePath, () => this.syncer.syncPlanFile(filePath, sessionId));
      }
    }
  }

  private debounce(key: string, fn: () => void) {
    if (this.debounceMap.has(key)) {
      clearTimeout(this.debounceMap.get(key));
    }
    const timer = setTimeout(() => {
      fn();
      this.debounceMap.delete(key);
    }, 300); // 300ms 디바운싱
    this.debounceMap.set(key, timer);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
