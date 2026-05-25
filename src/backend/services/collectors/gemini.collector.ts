import * as chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { BaseCollector } from './base.collector';
import type { UnifiedSession, UnifiedMessage } from './types';
import { extractMessageSummary, cleanMessageContent } from '../../utils/message-utils';

export class GeminiCollector extends BaseCollector {
  private watcher: FSWatcher | null = null;
  private targetDir: string;
  private debounceMap = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(targetDir: string) {
    super();
    this.targetDir = targetDir;
  }

  async start(): Promise<void> {
    console.log(`[GeminiCollector] Watching directory: ${this.targetDir}`);
    
    await this.scanInitialFiles(this.targetDir);

    return new Promise((resolve, reject) => {
      this.watcher = chokidar.watch(this.targetDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
      });

      this.watcher
        .on('add', (filePath: string) => this.handleFileChange(filePath))
        .on('change', (filePath: string) => this.handleFileChange(filePath))
        .on('error', (error: any) => {
          this.emitError(error);
          reject(error);
        })
        .on('ready', () => {
          console.log(`[GeminiCollector] Watcher ready.`);
          resolve();
        });
    });
  }

  private async scanInitialFiles(targetDir: string) {
    console.log(`[GeminiCollector] Scanning initial files in: ${targetDir}`);
    
    // Bun.glob 사용 (Bun v1.1+)
    const glob = new Bun.Glob(`**/*.{json,jsonl}`);
    
    for await (const file of glob.scan({ cwd: targetDir, onlyFiles: true })) {
      const filePath = path.join(targetDir, file as string);
      if (filePath.includes('chats') || path.basename(filePath) === 'logs.json') {
        this.handleFileChange(filePath);
      }
    }
    console.log(`[GeminiCollector] Initial scanning complete.`);
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  private handleFileChange(filePath: string) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);

    if (ext === '.json' || ext === '.jsonl') {
      if (filePath.includes('chats') || fileName === 'logs.json') {
        this.debounce(filePath, () => this.parseAndEmit(filePath));
      }
    }
  }

  private debounce(key: string, fn: () => void, ms = 100) {
    if (this.debounceMap.has(key)) {
      clearTimeout(this.debounceMap.get(key)!);
    }
    this.debounceMap.set(key, setTimeout(() => {
      fn();
      this.debounceMap.delete(key);
    }, ms));
  }

  private async parseAndEmit(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let parsedData: any;

      if (filePath.endsWith('.jsonl')) {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        if (lines.length === 0) return;
        
        parsedData = JSON.parse(lines[0]!);
        parsedData.messages = [];
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const lineData = JSON.parse(lines[i]!);
            if (lineData.$set?.lastUpdated) {
              parsedData.lastUpdated = lineData.$set.lastUpdated;
            } else if (lineData.id) {
              parsedData.messages.push(lineData);
            }
          } catch (e) {}
        }
      } else {
        parsedData = JSON.parse(content);
        if (Array.isArray(parsedData)) return;
      }

      if (!parsedData.sessionId) return;

      const projectDir = path.dirname(path.dirname(filePath));
      
      const messages: UnifiedMessage[] = parsedData.messages
        .filter((m: any) => m.type !== 'info')
        .map((m: any) => ({
          id: m.id,
          type: m.type as 'user' | 'agent' | 'info' | 'error',
          content: cleanMessageContent(m.content),
          timestamp: new Date(m.timestamp),
          inputTokens: m.tokens?.input,
          outputTokens: m.tokens?.output,
          thoughtTokens: m.tokens?.thoughts,
          thoughts: m.thoughts,
          toolCalls: m.toolCalls,
        }));

      const firstMsg = parsedData.messages.find((m: any) => m.type !== 'info');
      const summary = firstMsg ? extractMessageSummary(firstMsg.content) : undefined;

      const unifiedSession: UnifiedSession = {
        source: 'gemini',
        id: parsedData.sessionId,
        projectPath: projectDir, // This will be simplified to basename by SyncManager
        summary,
        model: parsedData.messages.find((m: any) => m.model)?.model || 'unknown',
        startTime: new Date(parsedData.startTime),
        lastUpdated: new Date(parsedData.lastUpdated),
        messages,
      };

      this.emitSessionUpdate(unifiedSession);
    } catch (err: any) {
      console.error(`[GeminiCollector] Error parsing ${filePath}:`, err);
    }
  }
}