import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { Syncer } from "./syncer";
import { initDb, db } from "../db";
import { projects, sessions, messages } from "../db/schema";
import path from "path";
import fs from "fs/promises";
import { eq } from "drizzle-orm";

describe("Syncer Service", () => {
  const testDir = path.join(process.cwd(), "test-tmp-syncer");
  let syncer: Syncer;

  beforeEach(async () => {
    // NODE_ENV=test 환경에서 initDb 호출 시 :memory: 사용됨
    await initDb();
    syncer = new Syncer(testDir);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test("syncSessionFile saves project, session and messages to DB", async () => {
    const sessionId = "test-session-unique-1";
    const sessionFile = path.join(testDir, "chats", `session-${sessionId}.json`);
    await fs.mkdir(path.dirname(sessionFile), { recursive: true });

    const sessionData = {
      sessionId: sessionId,
      projectHash: "project-unique-abc",
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messages: [
        {
          id: "msg-unique-1",
          type: "user",
          content: "Hello",
          timestamp: new Date().toISOString(),
        },
        {
          id: "msg-unique-2",
          type: "gemini",
          model: "gemini-pro",
          content: "Hi there",
          timestamp: new Date().toISOString(),
        }
      ]
    };

    await fs.writeFile(sessionFile, JSON.stringify(sessionData));
    await syncer.syncSessionFile(sessionFile);

    // DB 검증
    const projectResults = await db.select().from(projects).where(eq(projects.id, "project-unique-abc"));
    expect(projectResults.length).toBe(1);

    const sessionResults = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    expect(sessionResults.length).toBe(1);
    expect(sessionResults[0]!.model).toBe("gemini-pro");

    const messageResults = await db.select().from(messages).where(eq(messages.sessionId, sessionId));
    expect(messageResults.length).toBe(2);
  });

  test("syncSessionFile extracts clean summary from complex message structures", async () => {
    const sessionId = "summary-test-session";
    const sessionFile = path.join(testDir, "chats", `session-${sessionId}.json`);
    await fs.mkdir(path.dirname(sessionFile), { recursive: true });

    const sessionData = {
      sessionId: sessionId,
      projectHash: "project-summary",
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messages: [
        {
          id: "msg-info",
          type: "info",
          content: "System started",
          timestamp: new Date().toISOString(),
        },
        {
          id: "msg-complex",
          type: "user",
          content: JSON.stringify({
            parts: [{ text: "   This is a \n complex  prompt with parts   " }]
          }),
          timestamp: new Date().toISOString(),
        }
      ]
    };

    await fs.writeFile(sessionFile, JSON.stringify(sessionData));
    await syncer.syncSessionFile(sessionFile);

    const sessionResults = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    expect(sessionResults.length).toBe(1);
    expect(sessionResults[0]!.summary).toBe("This is a complex prompt with parts");
  });
});
