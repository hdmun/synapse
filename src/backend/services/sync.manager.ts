import { db } from '../db';
import { projects, sessions, messages } from '../db/schema';
import type { UnifiedSession } from './collectors/types';
import path from 'path';
import crypto from 'crypto';

export class SyncManager {
  private onUpdate?: (sessionId: string, data: any) => void;

  constructor(onUpdate?: (sessionId: string, data: any) => void) {
    this.onUpdate = onUpdate;
  }

  public async syncSession(sessionData: UnifiedSession) {
    try {
      const projectId = this.deriveProjectId(sessionData.projectPath);
      // We will normalize the path before saving it to the DB so that the project path is consistent
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
          lastUpdated: sessionData.lastUpdated,
        }).onConflictDoUpdate({
          target: projects.id,
          set: { 
            lastUpdated: sessionData.lastUpdated,
            name: projectName // Update name in case it changed
          }
        });

        // 2. Update Session
        await tx.insert(sessions).values({
          id: sessionData.id,
          projectId: projectId,
          source: sessionData.source,
          startTime: sessionData.startTime,
          lastUpdated: sessionData.lastUpdated,
          model: sessionData.model || 'unknown',
          summary: sessionData.summary,
          totalTokens: sessionData.totalTokens ? JSON.stringify(sessionData.totalTokens) : null,
          estimatedCost: sessionData.estimatedCost || 0,
        }).onConflictDoUpdate({
          target: sessions.id,
          set: {
            lastUpdated: sessionData.lastUpdated,
            summary: sessionData.summary,
            source: sessionData.source,
            totalTokens: sessionData.totalTokens ? JSON.stringify(sessionData.totalTokens) : null,
            estimatedCost: sessionData.estimatedCost || 0,
          }
        });

        // 3. Update Messages
        for (const msg of sessionData.messages) {
          // Normalize type to match schema enum
          let msgType = msg.type;
          if (msg.type === 'agent' || msg.type === 'gemini') {
            msgType = 'agent';
          }

          await tx.insert(messages).values({
            id: msg.id,
            sessionId: sessionData.id,
            type: msgType as any,
            content: msg.content,
            timestamp: msg.timestamp,
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

      if (this.onUpdate) {
        this.onUpdate(sessionData.id, sessionData);
      }
    } catch (err) {
      console.error(`[SyncManager] Failed to sync session ${sessionData.id}:`, err);
    }
  }

  private deriveProjectId(projectPath: string): string {
    let normalized = path.resolve(projectPath);
    normalized = normalized.replace(/\\/g, '/');
    if (process.platform === 'win32' || process.platform === 'darwin') {
      normalized = normalized.toLowerCase();
    }
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
}