import { db } from '../db';
import { projects, sessions, messages, thoughts, toolCalls } from '../db/schema';
import type { UnifiedSession } from './collectors/types';
import path from 'path';

export class SyncManager {
  private onUpdate?: (sessionId: string, data: any) => void;

  constructor(onUpdate?: (sessionId: string, data: any) => void) {
    this.onUpdate = onUpdate;
  }

  public async syncSession(sessionData: UnifiedSession) {
    try {
      const projectId = this.deriveProjectId(sessionData.projectPath);
      
      await db.transaction(async (tx) => {
        // 1. Update Project
        await tx.insert(projects).values({
          id: projectId,
          path: sessionData.projectPath,
          name: path.basename(sessionData.projectPath),
          lastUpdated: sessionData.lastUpdated,
        }).onConflictDoUpdate({
          target: projects.id,
          set: { lastUpdated: sessionData.lastUpdated }
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
          }
        });

        // 3. Update Messages
        for (const msg of sessionData.messages) {
          await tx.insert(messages).values({
            id: msg.id,
            sessionId: sessionData.id,
            type: msg.type,
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
    return path.basename(projectPath);
  }
}