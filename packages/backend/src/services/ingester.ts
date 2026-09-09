import * as chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import type { SynapseConfig, UnifiedSession } from '@synapse/shared';
import { db } from '../db';
import { projects, sessions, messages } from '../db/schema';

class TaskQueue {
  private promise: Promise<any> = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.promise = this.promise
        .then(() => task())
        .then(resolve)
        .catch(reject);
    });
  }
}

export class Ingester {
  private sessionWatcher?: FSWatcher;
  private toolOutputWatcher?: FSWatcher;
  private dbQueue = new TaskQueue();

  constructor(
    private config: SynapseConfig
  ) {}

  async start(): Promise<void> {
    await fs.mkdir(this.config.unifiedDir, { recursive: true });
    await fs.mkdir(this.config.processedDir, { recursive: true });
    await fs.mkdir(this.config.errorDir, { recursive: true });
    await fs.mkdir(this.config.toolOutputsDir, { recursive: true });

    // 1. Scan and process existing files in unified/ first
    await this.processExistingFiles();

    // 2. Real-time watch
    this.sessionWatcher = chokidar.watch('*.json', {
      cwd: this.config.unifiedDir,
      ignoreInitial: true,
      persistent: true,
    });
    this.toolOutputWatcher = chokidar.watch('**/*.txt', {
      cwd: this.config.toolOutputsDir,
      ignoreInitial: true,
      persistent: true,
    });

    this.sessionWatcher.on('add', (file) => this.ingestSessionFile(file));
    this.sessionWatcher.on('change', (file) => this.ingestSessionFile(file));
    
    this.toolOutputWatcher.on('add', (file) => this.ingestToolOutputFile(file));
    this.toolOutputWatcher.on('change', (file) => this.ingestToolOutputFile(file));
  }

  private async processExistingFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.unifiedDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await this.ingestSessionFile(file);
        }
      }
    } catch (e) {
      console.error('[Ingester] Error scanning existing files:', e);
    }
  }

  private async ingestSessionFile(relPath: string): Promise<void> {
    const filePath = path.join(this.config.unifiedDir, relPath);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const session: UnifiedSession = JSON.parse(content);
      
      await this.dbQueue.enqueue(() => this.syncToDb(session));
      
      const dest = path.join(this.config.processedDir, relPath);
      await fs.rename(filePath, dest);
    } catch (error) {
      console.error(`[Ingester] Failed to process ${relPath}:`, error);
      const dest = path.join(this.config.errorDir, relPath);
      await fs.rename(filePath, dest).catch(() => {});
    }
  }

  private async ingestToolOutputFile(relPath: string): Promise<void> {
    // Tool output background tracking if needed
  }

  private async syncToDb(sessionData: UnifiedSession): Promise<string> {
    const projectId = this.deriveProjectId(sessionData.projectPath);
    let normalizedPath = path.resolve(sessionData.projectPath);
    normalizedPath = normalizedPath.replace(/\\/g, '/');
    if (process.platform === 'win32' || process.platform === 'darwin') {
      normalizedPath = normalizedPath.toLowerCase();
    }
    const projectPath = normalizedPath;
    const projectName = path.basename(sessionData.projectPath);

    await db.transaction(async (tx) => {
      // 1. Update Project
      await tx.insert(projects).values({
        id: projectId,
        path: projectPath,
        name: projectName,
        lastUpdated: new Date(sessionData.lastUpdated),
      }).onConflictDoUpdate({
        target: projects.id,
        set: { 
          lastUpdated: new Date(sessionData.lastUpdated),
          name: projectName
        }
      });

      // 2. Update Session
      await tx.insert(sessions).values({
        id: sessionData.id,
        projectId: projectId,
        source: sessionData.source,
        startTime: new Date(sessionData.startTime),
        lastUpdated: new Date(sessionData.lastUpdated),
        status: 'active',
        model: sessionData.model || 'unknown',
        summary: sessionData.summary,
        totalTokens: sessionData.totalTokens ? JSON.stringify(sessionData.totalTokens) : null,
        estimatedCost: sessionData.estimatedCost !== undefined ? sessionData.estimatedCost : null,
      }).onConflictDoUpdate({
        target: sessions.id,
        set: {
          lastUpdated: new Date(sessionData.lastUpdated),
          summary: sessionData.summary,
          source: sessionData.source,
          totalTokens: sessionData.totalTokens ? JSON.stringify(sessionData.totalTokens) : null,
          estimatedCost: sessionData.estimatedCost !== undefined ? sessionData.estimatedCost : null,
        }
      });

      // 3. Update Messages
      for (const msg of sessionData.messages) {
        let msgType = msg.type;
        if (msg.type === 'agent' || (msg.type as any) === 'gemini') {
          msgType = 'agent';
        }

        // Normalize thoughtTraces
        let thoughtTraces = msg.thoughtTraces;
        if (!thoughtTraces && msg.enrichers?.gemini?.thoughtTrace) {
          thoughtTraces = msg.enrichers.gemini.thoughtTrace.map(t => ({
            subject: t.subject,
            description: t.description,
            timestamp: t.timestamp
          }));
        } else if (!thoughtTraces && msg.thoughts) {
          try {
            const parsed = JSON.parse(msg.thoughts);
            if (Array.isArray(parsed)) {
              thoughtTraces = parsed.map((item: any) => ({
                subject: item.subject || 'Reasoning',
                description: item.description || item.text || (typeof item === 'string' ? item : JSON.stringify(item)),
                timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : undefined,
              }));
            }
          } catch {}
        }

        await tx.insert(messages).values({
          id: msg.id,
          sessionId: sessionData.id,
          type: msgType as any,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          tokens: msg.tokens ? JSON.stringify(msg.tokens) : null,
          toolCalls: msg.toolCalls ? JSON.stringify(msg.toolCalls) : JSON.stringify([]),
          thoughtTraces: thoughtTraces ? JSON.stringify(thoughtTraces) : JSON.stringify([]),
          enrichers: msg.enrichers ? JSON.stringify(msg.enrichers) : null,
        }).onConflictDoUpdate({
          target: messages.id,
          set: {
            content: msg.content,
            tokens: msg.tokens ? JSON.stringify(msg.tokens) : null,
            toolCalls: msg.toolCalls ? JSON.stringify(msg.toolCalls) : JSON.stringify([]),
            thoughtTraces: thoughtTraces ? JSON.stringify(thoughtTraces) : JSON.stringify([]),
            enrichers: msg.enrichers ? JSON.stringify(msg.enrichers) : null,
          }
        });
      }
    });

    return projectId;
  }

  private deriveProjectId(projectPath: string): string {
    let normalized = path.resolve(projectPath);
    normalized = normalized.replace(/\\/g, '/');
    if (process.platform === 'win32' || process.platform === 'darwin') {
      normalized = normalized.toLowerCase();
    }
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  async stop(): Promise<void> {
    await this.sessionWatcher?.close();
    await this.toolOutputWatcher?.close();
  }
}
