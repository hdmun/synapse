import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { buildApp } from "../app";
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
