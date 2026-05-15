import { test, expect, describe, afterAll, beforeAll } from 'bun:test';
import { buildApp } from './app';

describe('App Builder', () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp({ targetDir: '/tmp/test', codexDir: '/tmp/codex', isTest: true });
  });

  afterAll(async () => {
    if (app) {
      await app.stop();
    }
  });

  test('buildApp returns required components', () => {
    expect(app.fastify).toBeDefined();
    expect(app.io).toBeDefined();
    expect(app.syncManager).toBeDefined();
    expect(app.geminiCollector).toBeDefined();
    expect(app.copilotCollector).toBeDefined();
    expect(app.codexCollector).toBeDefined();
    expect(typeof app.start).toBe('function');
    expect(typeof app.stop).toBe('function');
  });
  
  test('fastify app has api routes registered', async () => {
    const res = await app.fastify.inject({
      method: 'GET',
      url: '/api/projects'
    });
    // In test environment, the DB might be in-memory or empty but should return 200 array.
    expect(res.statusCode).toBe(200);
  });
});