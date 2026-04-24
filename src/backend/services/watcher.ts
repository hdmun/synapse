import * as chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import path from 'path';
import { Syncer } from './syncer';

export class Watcher {
  private watcher: FSWatcher | null = null;
  private syncer: Syncer;
  private debounceMap = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(syncer: Syncer) {
    this.syncer = syncer;
  }

  async start(targetDir: string) {
    console.log(`Watching directory: ${targetDir}`);
    
    // 초기 파일 스캔 추가
    await this.scanInitialFiles(targetDir);

    this.watcher = chokidar.watch(targetDir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', (filePath: string) => this.handleFileChange(filePath))
      .on('change', (filePath: string) => this.handleFileChange(filePath))
      .on('error', (error: any) => console.error(`Watcher error: ${error}`));
  }

  private async scanInitialFiles(targetDir: string) {
    console.log(`Scanning initial files in: ${targetDir}`);
    
    // Bun.glob 사용 (Bun v1.1+)
    const pattern = `**/*.*`;
    // @ts-ignore: Bun.Glob exists in Bun environment
    const glob = new (require('bun').Glob)(pattern);
    
    let count = 0;
    for await (const file of glob.scan({ cwd: targetDir, onlyFiles: true })) {
      count++;
      const filePath = path.join(targetDir, file as string);
      console.log(`[DEBUG] Initial file found: ${filePath}`);
      this.handleFileChange(filePath);
    }
    console.log(`Scanning complete. Found ${count} files.`);
  }

  private handleFileChange(filePath: string) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);

    // 1. JSON 데이터 처리 (chats/**/*.json 또는 logs.json)
    if (ext === '.json') {
      if (filePath.includes('chats') || fileName === 'logs.json') {
        console.log(`[DEBUG] JSON data detected: ${filePath}`);
        this.debounce(filePath, () => this.syncer.syncSessionFile(filePath));
      }
    }

    // 2. 계획서 MD 파일 처리 (세션ID/plans/*.md)
    if (ext === '.md' && filePath.includes('plans')) {
      console.log(`[DEBUG] Plan file detected: ${filePath}`);
      const parts = filePath.split(path.sep);
      const plansIndex = parts.indexOf('plans');
      if (plansIndex > 0) {
        const sessionId = parts[plansIndex - 1];
        if (sessionId) {
          this.debounce(filePath, () => this.syncer.syncPlanFile(filePath, sessionId));
        }
      }
    }

    // 3. 도구 출력 텍스트 파일 처리 (tool-outputs/**/*.txt)
    if (ext === '.txt' && filePath.includes('tool-outputs')) {
      console.log(`[DEBUG] Tool output detected: ${filePath}`);
      this.debounce(filePath, () => this.syncer.syncToolOutputFile(filePath));
    }
  }

  private debounce(key: string, fn: () => void) {
    if (this.debounceMap.has(key)) {
      clearTimeout(this.debounceMap.get(key));
    }
    const timer = setTimeout(() => {
      fn();
      this.debounceMap.delete(key);
    }, 300);
    this.debounceMap.set(key, timer);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
