import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { buildApp } from "../app";
import { db } from "../db";
import { projects, sessions, messages } from "../db/schema";
import path from "path";
import fs from "fs/promises";

describe("API Routes", () => {
  let app: any;
  const testDir = path.join(process.cwd(), "test-tmp-api");

  beforeAll(async () => {
    // 임시 디렉토리 생성
    await fs.mkdir(testDir, { recursive: true });
    
    // 테스트용 앱 빌드 (isTest: true로 로거 끔)
    app = await buildApp({ targetDir: testDir, isTest: true });
  });

  afterAll(async () => {
    await app.stop();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test("GET /api/projects returns an empty array initially", async () => {
    const response = await app.fastify.inject({
      method: "GET",
      url: "/api/projects",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  test("GET /api/projects/:id/sessions returns sessions with summaries and performs backfilling", async () => {
    // 프로젝트 및 세션 직접 삽입 (요약 없이)
    const projectId = "test-project-1";
    const sessionId = "test-session-1";
    
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
      model: "test-model"
      // summary 필드는 비워둠
    });

    await db.insert(messages).values({
      id: "msg-1",
      sessionId: sessionId,
      type: "user",
      content: JSON.stringify({ text: "Hello from API test" }),
      timestamp: new Date()
    });

    // API 호출
    const response = await app.fastify.inject({
      method: "GET",
      url: `/api/projects/${projectId}/sessions`,
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.length).toBe(1);
    expect(data[0].summary).toBe("Hello from API test");

    // DB에 백필 되었는지 확인
    const sessionInDb = await db.query.sessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.id, sessionId)
    });
    expect(sessionInDb?.summary).toBe("Hello from API test");
  });

  test("GET /api/search returns an empty array for empty query", async () => {
    const response = await app.fastify.inject({
      method: "GET",
      url: "/api/search",
      query: { q: "" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });
});
