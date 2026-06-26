import { Database } from 'bun:sqlite';
import path from 'path';
import fs from 'fs';
import * as chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import { BaseCollector } from './base.collector';
import type { UnifiedSession, UnifiedMessage } from '@synapse/shared';

export class CopilotCollector extends BaseCollector {
  private dbPath: string;
  private watcher: FSWatcher | null = null;
  private lastCheckedMap = new Map<string, string>(); // sessionId -> max updated_at
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isPolling = false;

  constructor(dbPath?: string) {
    super();
    if (dbPath) {
      this.dbPath = dbPath;
    } else {
      const userProfile = process.env.USERPROFILE || process.env.HOME || '';
      // GitHub Copilot CLI standard path
      this.dbPath = path.join(userProfile, '.copilot', 'session-store.db');
    }
  }

  async start(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      console.warn(`[CopilotCollector] Copilot directory not found: ${dir}.`);
      // We don't return here because the directory might be created later
    }

    console.log(`[CopilotCollector] Watching Copilot CLI database: ${this.dbPath}`);
    
    // Initial sync
    await this.poll();

    return new Promise((resolve, reject) => {
      this.watcher = chokidar.watch(this.dbPath, {
        persistent: true,
        ignoreInitial: true,
      });

      this.watcher.on('all', (event) => {
        if (event === 'add' || event === 'change') {
          this.debouncePoll();
        }
      });

      this.watcher.on('error', (error) => {
        this.emitError(error);
        reject(error);
      });

      this.watcher.on('ready', () => {
        console.log(`[CopilotCollector] Watcher ready.`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private debouncePoll() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.poll(), 500);
  }

  private async poll(): Promise<void> {
    if (this.isPolling) return;
    if (!fs.existsSync(this.dbPath)) return;

    this.isPolling = true;
    try {
      // Connect in readonly mode to prevent locking issues
      const db = new Database(this.dbPath, { readonly: true });
      
      const sessionsQuery = db.query(`
        SELECT id, cwd, summary, created_at, updated_at 
        FROM sessions 
        ORDER BY updated_at DESC
        LIMIT 50
      `);
      
      const sessions = sessionsQuery.all() as any[];
      
      for (const sessionRow of sessions) {
        const sessionId = sessionRow.id;
        const updatedAt = sessionRow.updated_at;
        
        const lastChecked = this.lastCheckedMap.get(sessionId);
        if (lastChecked && new Date(lastChecked).getTime() >= new Date(updatedAt).getTime()) {
          continue;
        }

        const turnsQuery = db.query(`
          SELECT id, turn_index, user_message, assistant_response, timestamp 
          FROM turns 
          WHERE session_id = ? 
          ORDER BY turn_index ASC
        `);
        const turns = turnsQuery.all(sessionId) as any[];

        const messages: UnifiedMessage[] = [];
        const rawTurns: any[] = [];
        
        for (const turn of turns) {
          rawTurns.push(turn);
          if (turn.user_message) {
            messages.push({
              id: `${turn.id}-user`,
              type: 'user',
              content: turn.user_message,
              timestamp: new Date(turn.timestamp),
            });
          }
          if (turn.assistant_response) {
            const inputTokens = turn.user_message ? Math.ceil(turn.user_message.length / 4) : 0;
            const outputTokens = Math.ceil(turn.assistant_response.length / 4);

            messages.push({
              id: `${turn.id}-agent`,
              type: 'agent',
              content: turn.assistant_response,
              timestamp: new Date(turn.timestamp),
              tokens: {
                base: inputTokens + outputTokens
              }
            });
          }
        }

        // Aggregate total tokens for the session
        let totalBase = 0;
        for (const m of messages) {
          if (m.tokens) {
            totalBase += m.tokens.base || 0;
          }
        }

        const unifiedSession: UnifiedSession = {
          source: 'copilot',
          id: sessionId,
          projectPath: sessionRow.cwd || 'unknown-project',
          summary: sessionRow.summary,
          model: 'copilot-cli',
          startTime: new Date(sessionRow.created_at),
          lastUpdated: new Date(sessionRow.updated_at),
          messages,
          totalTokens: {
            base: totalBase
          }
        };

        this.emitSessionUpdate({
          session: unifiedSession,
          raw: { sessionRow, turns: rawTurns }
        });
        this.lastCheckedMap.set(sessionId, updatedAt);
      }
      
      db.close();
    } catch (err: any) {
      this.emitError(new Error(`[CopilotCollector] DB Sync Error: ${err.message}`));
    } finally {
      this.isPolling = false;
    }
  }
}
