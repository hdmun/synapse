import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { projects, sessions, messages, thoughts, toolCalls, plans } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export interface SessionData {
  sessionId: string;
  projectHash: string;
  startTime: string;
  lastUpdated: string;
  messages: any[];
}

export class Syncer {
  private baseDir: string;
  private onUpdate?: (sessionId: string, data: any) => void;

  constructor(baseDir: string, onUpdate?: (sessionId: string, data: any) => void) {
    this.baseDir = baseDir;
    this.onUpdate = onUpdate;
  }

  async syncSessionFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // logs.json 같은 배열 형태는 무시하거나 별도 처리 (여기서는 일단 무시)
      if (Array.isArray(parsed)) {
        console.log(`[DEBUG] Array-based JSON skipped: ${filePath}`);
        return;
      }

      const data: SessionData = parsed;
      const sessionId = data.sessionId;
      if (!sessionId) return;

      const projectDir = path.dirname(path.dirname(filePath));
      const projectPath = await this.getProjectPath(projectDir);
      const projectId = data.projectHash || path.basename(projectDir);

      await db.insert(projects).values({
        id: projectId,
        path: projectPath,
        name: path.basename(projectPath),
        lastUpdated: new Date(data.lastUpdated),
      }).onConflictDoUpdate({
        target: projects.id,
        set: { lastUpdated: new Date(data.lastUpdated) }
      });

      await db.insert(sessions).values({
        id: sessionId,
        projectId: projectId,
        startTime: new Date(data.startTime),
        lastUpdated: new Date(data.lastUpdated),
        model: data.messages.find(m => m.model)?.model || 'unknown',
      }).onConflictDoUpdate({
        target: sessions.id,
        set: { lastUpdated: new Date(data.lastUpdated) }
      });

      for (const msg of data.messages) {
        if (msg.type === 'info') continue;

        await db.insert(messages).values({
          id: msg.id,
          sessionId: sessionId,
          type: msg.type,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          timestamp: new Date(msg.timestamp),
          inputTokens: msg.tokens?.input,
          outputTokens: msg.tokens?.output,
          thoughtTokens: msg.tokens?.thoughts,
        }).onConflictDoUpdate({
          target: messages.id,
          set: {
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          }
        });

        if (msg.thoughts && Array.isArray(msg.thoughts)) {
          for (const thought of msg.thoughts) {
            await db.insert(thoughts).values({
              messageId: msg.id,
              subject: thought.subject,
              description: thought.description,
              timestamp: new Date(thought.timestamp),
            }).onConflictDoNothing();
          }
        }

        if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
          for (const tc of msg.toolCalls) {
            await db.insert(toolCalls).values({
              id: tc.id,
              messageId: msg.id,
              name: tc.name,
              args: JSON.stringify(tc.args),
              result: JSON.stringify(tc.result),
              status: tc.status,
              timestamp: new Date(tc.timestamp),
            }).onConflictDoNothing();
          }
        }
      }

      console.log(`Synced session: ${sessionId}`);
      if (this.onUpdate) {
        this.onUpdate(sessionId, { type: 'session' });
      }
    } catch (err) {
      console.error(`Error syncing session ${filePath}:`, err);
    }
  }

  async syncToolOutputFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // 파일명 분석: run_shell_command_1776920238833_1.txt
      // 경로 분석: tool-outputs/session-60ad641a.../
      const parts = filePath.split(path.sep);
      const sessionDir = parts.find(p => p.startsWith('session-'));
      const sessionId = sessionDir ? sessionDir.replace('session-', '') : null;

      if (!sessionId) return;

      // 도구 실행 결과 업데이트 (파일명에 포함된 도구명으로 매칭 시도)
      // 정확한 매칭을 위해서는 DB 조회 필요
      const toolName = fileName.split('_')[0]; // run, shell, command 등이 섞일 수 있음
      
      // 결과 업데이트 (여기서는 단순히 sessionId에 매치되는 최근 도구 호출의 결과를 보강하거나, 
      // 나중에 상세 조회를 위해 저장하는 용도로 활용)
      console.log(`Synced tool output for session ${sessionId}: ${fileName}`);
      if (this.onUpdate) {
        this.onUpdate(sessionId, { type: 'tool-output', fileName });
      }
    } catch (err) {
      console.error(`Error syncing tool output ${filePath}:`, err);
    }
  }

  async syncPlanFile(filePath: string, sessionId: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tasks = content.match(/- \[[ xX]\]/g) || [];
      const completed = tasks.filter(t => t.includes('[x]') || t.includes('[X]')).length;
      const total = tasks.length;
      const progress = total > 0 ? (completed / total) * 100 : 0;

      await db.insert(plans).values({
        id: filePath,
        sessionId: sessionId,
        content: content,
        totalTasks: total,
        completedTasks: completed,
        lastUpdated: new Date(),
      }).onConflictDoUpdate({
        target: plans.id,
        set: { content, totalTasks: total, completedTasks: completed, lastUpdated: new Date() }
      });

      const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
      if (session?.projectId) {
        await db.update(projects).set({ progress }).where(eq(projects.id, session.projectId));
        if (this.onUpdate) this.onUpdate(sessionId, { type: 'plan', progress });
      }
    } catch (err) {
      console.error(`Error syncing plan ${filePath}:`, err);
    }
  }

  private async getProjectPath(projectDir: string): Promise<string> {
    try {
      const rootFile = path.join(projectDir, '.project_root');
      return await fs.readFile(rootFile, 'utf-8');
    } catch {
      return projectDir;
    }
  }
}
