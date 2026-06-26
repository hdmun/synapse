import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import type { SynapseConfig, SocketUpdatePayload, UnifiedSession } from '@synapse/shared';
import { db } from '../db';
import { projects, sessions, messages, plans } from '../db/schema';

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
  private sessionWatcher?: chokidar.FSWatcher;
  private planWatcher?: chokidar.FSWatcher;
  private toolOutputWatcher?: chokidar.FSWatcher;
  private dbQueue = new TaskQueue();

  constructor(
    private config: SynapseConfig,
    private onUpdate?: (payload: SocketUpdatePayload) => void
  ) {}

  async start(): Promise<void> {
    await fs.mkdir(this.config.unifiedDir, { recursive: true });
    await fs.mkdir(this.config.processedDir, { recursive: true });
    await fs.mkdir(this.config.errorDir, { recursive: true });
    await fs.mkdir(this.config.plansDir, { recursive: true });
    await fs.mkdir(this.config.toolOutputsDir, { recursive: true });

    // 1. Scan and process existing files in unified/ first
    await this.processExistingFiles();

    // 2. Real-time watch
    this.sessionWatcher = chokidar.watch('*.json', {
      cwd: this.config.unifiedDir,
      ignoreInitial: true,
      persistent: true,
    });
    this.planWatcher = chokidar.watch('**/*.md', {
      cwd: this.config.plansDir,
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
    
    this.planWatcher.on('add', (file) => this.ingestPlanFile(file));
    this.planWatcher.on('change', (file) => this.ingestPlanFile(file));
    
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
      
      const projectId = await this.dbQueue.enqueue(() => this.syncToDb(session));
      
      const dest = path.join(this.config.processedDir, relPath);
      await fs.rename(filePath, dest);

      this.onUpdate?.({
        type: 'sync',
        sessionId: session.id,
        projectId,
        status: 'synced',
      });
    } catch (error) {
      console.error(`[Ingester] Failed to process ${relPath}:`, error);
      const dest = path.join(this.config.errorDir, relPath);
      await fs.rename(filePath, dest).catch(() => {});
    }
  }

  private async ingestPlanFile(relPath: string): Promise<void> {
    const filePath = path.join(this.config.plansDir, relPath);
    const parts = relPath.replace(/\\/g, '/').split('/');
    if (parts.length < 3) return;
    const sessionId = parts[1];

    if (!sessionId) return;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tasks = content.match(/- \[[ xX]\]/g) || [];
      const completed = tasks.filter(t => t.includes('[x]') || t.includes('[X]')).length;
      const total = tasks.length;
      const progress = total > 0 ? (completed / total) * 100 : 0;

      await this.dbQueue.enqueue(async () => {
        await db.transaction(async (tx) => {
          await tx.insert(plans).values({
            id: filePath,
            sessionId: sessionId,
            projectId: this.deriveProjectId(sessionId), // Fallback fallback mapping
            content: content,
            totalTasks: total,
            completedTasks: completed,
            lastUpdated: new Date(),
          }).onConflictDoUpdate({
            target: plans.id,
            set: { content, totalTasks: total, completedTasks: completed, lastUpdated: new Date() }
          });

          const session = await tx.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
          if (session?.projectId) {
            await tx.update(projects).set({ progress }).where(eq(projects.id, session.projectId));
            
            this.onUpdate?.({
              type: 'progress',
              sessionId,
              projectId: session.projectId,
              progress,
            });
          }
        });
      });
    } catch (err) {
      console.error(`[Ingester] Error syncing plan ${filePath}:`, err);
    }
  }

  private async ingestToolOutputFile(relPath: string): Promise<void> {
    const parts = relPath.replace(/\\/g, '/').split('/');
    if (parts.length < 3) return;
    const sessionId = parts[1];
    const fileName = parts[2];

    if (!sessionId || !fileName) return;

    this.onUpdate?.({
      type: 'status',
      sessionId,
      status: `Tool output updated: ${fileName}`
    });
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
        model: sessionData.model || 'unknown',
        summary: sessionData.summary,
        totalTokens: sessionData.totalTokens ? JSON.stringify(sessionData.totalTokens) : null,
        estimatedCost: sessionData.estimatedCost || 0,
      }).onConflictDoUpdate({
        target: sessions.id,
        set: {
          lastUpdated: new Date(sessionData.lastUpdated),
          summary: sessionData.summary,
          source: sessionData.source,
          totalTokens: sessionData.totalTokens ? JSON.stringify(sessionData.totalTokens) : null,
          estimatedCost: sessionData.estimatedCost || 0,
        }
      });

      // 3. Update Messages
      for (const msg of sessionData.messages) {
        let msgType = msg.type;
        if (msg.type === 'agent' || msg.type === 'gemini') {
          msgType = 'agent';
        }

        await tx.insert(messages).values({
          id: msg.id,
          sessionId: sessionData.id,
          type: msgType as any,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          tokens: msg.tokens ? JSON.stringify(msg.tokens) : null,
          features: msg.features ? JSON.stringify(msg.features) : JSON.stringify([]),
          toolCalls: msg.toolCalls ? JSON.stringify(msg.toolCalls) : JSON.stringify([]),
          enrichers: msg.enrichers ? JSON.stringify(msg.enrichers) : null,
        }).onConflictDoUpdate({
          target: messages.id,
          set: {
            content: msg.content,
            tokens: msg.tokens ? JSON.stringify(msg.tokens) : null,
            features: msg.features ? JSON.stringify(msg.features) : JSON.stringify([]),
            toolCalls: msg.toolCalls ? JSON.stringify(msg.toolCalls) : JSON.stringify([]),
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
    await this.planWatcher?.close();
    await this.toolOutputWatcher?.close();
  }
}
