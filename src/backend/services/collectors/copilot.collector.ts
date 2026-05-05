import { Database } from 'bun:sqlite';
import path from 'path';
import { BaseCollector } from './base.collector';
import type { UnifiedSession, UnifiedMessage } from './types';
import fs from 'fs';

export class CopilotCollector extends BaseCollector {
  private dbPath: string;
  private pollIntervalMs: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastCheckedMap = new Map<string, string>(); // sessionId -> max updated_at

  constructor(pollIntervalMs = 5000) {
    super();
    this.pollIntervalMs = pollIntervalMs;
    const userProfile = process.env.USERPROFILE || process.env.HOME || '';
    this.dbPath = path.join(userProfile, '.copilot', 'session-store.db');
  }

  async start(): Promise<void> {
    if (!fs.existsSync(this.dbPath)) {
      console.warn(`[CopilotCollector] Copilot database not found at ${this.dbPath}. Waiting for it to be created...`);
      // We still start polling in case it gets created later.
    } else {
      console.log(`[CopilotCollector] Polling Copilot database at: ${this.dbPath}`);
    }

    this.poll(); // Initial poll
    this.intervalId = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll(): Promise<void> {
    if (!fs.existsSync(this.dbPath)) return;

    try {
      // Connect in readonly mode
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
        
        // Skip if not updated since last check
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
        
        for (const turn of turns) {
          // User message
          if (turn.user_message) {
            messages.push({
              id: `${turn.id}-user`,
              type: 'user',
              content: turn.user_message,
              timestamp: new Date(turn.timestamp),
            });
          }
          // Agent message
          if (turn.assistant_response) {
            messages.push({
              id: `${turn.id}-agent`,
              type: 'agent',
              content: turn.assistant_response,
              timestamp: new Date(turn.timestamp),
              // We don't have token counts in Copilot SQLite by default, leave them undefined
            });
          }
        }

        const unifiedSession: UnifiedSession = {
          source: 'copilot',
          id: sessionId,
          projectPath: sessionRow.cwd || 'unknown-project',
          summary: sessionRow.summary,
          model: 'copilot', // Implicit
          startTime: new Date(sessionRow.created_at),
          lastUpdated: new Date(sessionRow.updated_at),
          messages,
        };

        this.emitSessionUpdate(unifiedSession);
        this.lastCheckedMap.set(sessionId, updatedAt);
      }
      
      db.close();
    } catch (err: any) {
      this.emitError(new Error(`[CopilotCollector] DB Poll Error: ${err.message}`));
    }
  }
}
