import { db } from '../db';
import { projects, sessions, messages, thoughts, toolCalls } from '../db/schema';
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
        }).onConflictDoUpdate({
          target: sessions.id,
          set: {
            lastUpdated: sessionData.lastUpdated,
            summary: sessionData.summary,
            source: sessionData.source, // Update source in case it's missing or changed
          }
        });

        // 3. Update Messages
        for (const msg of sessionData.messages) {
          // Normalize type to match schema enum
          let msgType = msg.type;
          // Standardize all AI replies as 'agent' type
          if (msg.type === 'agent' || msg.type === 'gemini') {
            msgType = 'agent';
          }

          await tx.insert(messages).values({
            id: msg.id,
            sessionId: sessionData.id,
            type: msgType as any,
            content: msg.content,
            timestamp: msg.timestamp,
            inputTokens: msg.inputTokens,
            outputTokens: msg.outputTokens,
            thoughtTokens: msg.thoughtTokens,
          }).onConflictDoUpdate({
            target: messages.id,
            set: {
              content: msg.content,
            }
          });

          if (msg.thoughts && Array.isArray(msg.thoughts)) {
            for (const thought of msg.thoughts) {
              await tx.insert(thoughts).values({
                messageId: msg.id,
                subject: thought.subject,
                description: thought.description,
                timestamp: new Date(thought.timestamp),
              }).onConflictDoNothing();
            }
          }

          if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
            for (const tc of msg.toolCalls) {
              await tx.insert(toolCalls).values({
                id: tc.id,
                messageId: msg.id,
                name: tc.name,
                args: typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args),
                result: typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result), 
                status: tc.status,
                timestamp: new Date(tc.timestamp),
              }).onConflictDoUpdate({
                target: toolCalls.id,
                set: {
                  result: typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result),
                  status: tc.status
                }
              });
            }
          }
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