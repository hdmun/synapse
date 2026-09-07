import { test, expect, describe, beforeAll, afterEach } from "bun:test";
import { db, initDb } from "../db";
import { projects, sessions, messages } from "../db/schema";
import { getSessionDetails } from "./session.controller";
import { sql } from "drizzle-orm";

describe("Session Controller", () => {
  beforeAll(async () => {
    await initDb();
  });

  afterEach(async () => {
    // Clear tables after each test to keep isolation
    await db.delete(messages);
    await db.delete(sessions);
    await db.delete(projects);
  });

  test("getSessionDetails returns messages in ascending order", async () => {
    // 1. Setup test data
    const projectId = "test-project";
    const sessionId = "test-session";

    await db.insert(projects).values({
      id: projectId,
      name: "Test Project",
      path: "/test/path",
      lastUpdated: new Date()
    });

    await db.insert(sessions).values({
      id: sessionId,
      projectId: projectId,
      startTime: new Date(),
      lastUpdated: new Date(),
      model: "gemini-pro"
    });

    const now = new Date();
    const t1 = new Date(now.getTime() - 2000);
    const t2 = new Date(now.getTime() - 1000);
    const t3 = now;

    await db.insert(messages).values([
      { id: "m2", sessionId, type: "user", content: "Second message", timestamp: t2 },
      { id: "m1", sessionId, type: "user", content: "First message", timestamp: t1 },
      { id: "m3", sessionId, type: "gemini", content: "Third message", timestamp: t3 },
    ]);

    // 2. Call controller
    const result = await getSessionDetails(sessionId);

    // 3. Verify
    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe("m1");
    expect(result[1]!.id).toBe("m2");
    expect(result[2]!.id).toBe("m3");
    
    // Check timestamps are strictly increasing
    expect(result[0]!.timestamp.getTime()).toBeLessThan(result[1]!.timestamp.getTime());
    expect(result[1]!.timestamp.getTime()).toBeLessThan(result[2]!.timestamp.getTime());
  });

  test("getSessionDetails parses thoughtTraces and toolCalls correctly", async () => {
    const projectId = "test-project-2";
    const sessionId = "test-session-2";

    await db.insert(projects).values({
      id: projectId,
      name: "Test Project 2",
      path: "/test/path/2",
      lastUpdated: new Date()
    });

    await db.insert(sessions).values({
      id: sessionId,
      projectId: projectId,
      startTime: new Date(),
      lastUpdated: new Date(),
      model: "claude-3-5-sonnet"
    });

    const mockToolCalls = [{ name: "read_file", args: "{\"path\":\"foo.ts\"}", status: "success" }];
    const mockThoughtTraces = [{ subject: "Thinking", description: "Analyzing the request..." }];

    await db.insert(messages).values({
      id: "m1",
      sessionId,
      type: "agent",
      content: "Here is the result",
      timestamp: new Date(),
      toolCalls: JSON.stringify(mockToolCalls),
      thoughtTraces: JSON.stringify(mockThoughtTraces),
    });

    const result = await getSessionDetails(sessionId);

    expect(result).toHaveLength(1);
    expect(result[0]!.toolCalls).toEqual(mockToolCalls);
    expect(result[0]!.thoughtTraces).toEqual(mockThoughtTraces);
  });
});
