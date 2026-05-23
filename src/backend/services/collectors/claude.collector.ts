import { BaseCollector } from './base.collector';
import { UnifiedMessage, UnifiedSession } from './types';
import chokidar from 'chokidar';
import { Glob } from 'bun';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

export class ClaudeCollector extends BaseCollector {
  private watcher?: chokidar.FSWatcher;
  private targetDir: string;
  private debounceMap = new Map<string, NodeJS.Timeout>();

  constructor(targetDir?: string) {
    super();
    this.targetDir = targetDir || path.join(homedir(), '.claude', 'projects');
  }

  async start(): Promise<void> {
    try {
      await fs.mkdir(this.targetDir, { recursive: true });
    } catch (e) {
      // Ignore mkdir error if it exists
    }

    await this.scanInitialFiles();

    this.watcher = chokidar.watch('**/*.jsonl', {
      cwd: this.targetDir,
      ignoreInitial: true,
      persistent: true,
      usePolling: process.env.NODE_ENV === 'test',
    });

    this.watcher.on('add', (relPath) => this.scheduleParse(relPath));
    this.watcher.on('change', (relPath) => this.scheduleParse(relPath));
    this.watcher.on('error', (err) => this.emitError(err));

    await new Promise<void>((resolve) => {
      if (this.watcher) {
        this.watcher.on('ready', resolve);
      } else {
        resolve();
      }
    });
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
    for (const timer of this.debounceMap.values()) {
      clearTimeout(timer);
    }
    this.debounceMap.clear();
  }

  private async scanInitialFiles() {
    const glob = new Glob('**/*.jsonl');
    for await (const file of glob.scan({ cwd: this.targetDir, absolute: false })) {
      await this.parseAndEmit(file);
    }
  }

  private scheduleParse(relPath: string) {
    const existing = this.debounceMap.get(relPath);
    if (existing) {
      clearTimeout(existing);
    }
    this.debounceMap.set(
      relPath,
      setTimeout(() => {
        this.debounceMap.delete(relPath);
        this.parseAndEmit(relPath).catch((err) => this.emitError(err));
      }, 100)
    );
  }

  private async parseAndEmit(relPath: string) {
    console.log(`[ClaudeCollector] parseAndEmit called for: ${relPath}`);
    const filePath = path.join(this.targetDir, relPath);
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf8');
      console.log(`[ClaudeCollector] Read content length: ${content.length}`);
    } catch (e) {
      console.error(`[ClaudeCollector] fs.readFile failed:`, e);
      return;
    }

    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const sessionId = path.basename(relPath, '.jsonl');
    
    let projectPath = path.dirname(filePath); // fallback
    const messages: UnifiedMessage[] = [];
    let startTime: Date | undefined;
    let lastUpdated: Date = new Date();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        const data = JSON.parse(line);
        
        if (data.type === 'system' && data.cwd) {
          projectPath = data.cwd;
        }

        const rawTime = data.createdAt || data.timestamp || data.created_at;
        const ts = rawTime ? new Date(rawTime) : new Date();

        if (!startTime && rawTime) {
          startTime = new Date(rawTime);
        }
        if (rawTime) {
          lastUpdated = new Date(rawTime);
        }

        if (data.type === 'user') {
          let text = '';
          if (Array.isArray(data.content)) {
            text = data.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n');
          } else if (typeof data.content === 'string') {
            text = data.content;
          } else if (data.text) {
             text = data.text;
          }

          messages.push({
            id: `${sessionId}-${i}`,
            type: 'user',
            content: text,
            timestamp: ts,
          });
        } else if (data.type === 'assistant') {
          let text = '';
          let thoughts: any[] = [];
          let toolCalls: any[] = [];

          if (Array.isArray(data.content)) {
            text = data.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n');
            thoughts = data.content.filter((c: any) => c.type === 'thinking');
            toolCalls = data.content.filter((c: any) => c.type === 'tool_use');
          } else if (typeof data.content === 'string') {
            text = data.content;
          } else if (data.text) {
             text = data.text;
          }

          const msg: UnifiedMessage = {
            id: `${sessionId}-${i}`,
            type: 'agent',
            content: text,
            timestamp: ts,
          };

          if (thoughts.length > 0) msg.thoughts = thoughts;
          if (toolCalls.length > 0) msg.toolCalls = toolCalls;
          
          if (data.usage) {
            msg.inputTokens = data.usage.input_tokens;
            msg.outputTokens = data.usage.output_tokens;
          }

          messages.push(msg);
        }
      } catch (e) {
        // Ignored parsing error for a line
      }
    }

    if (!startTime) {
      startTime = new Date();
    }

    const session: UnifiedSession = {
      source: 'claude',
      id: sessionId,
      projectPath,
      startTime,
      lastUpdated,
      messages,
    };

    this.emitSessionUpdate(session);
  }
}
