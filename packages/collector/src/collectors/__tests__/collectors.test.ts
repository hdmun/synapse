import { test, expect, describe, afterAll, beforeAll, spyOn } from 'bun:test';
import fs from 'fs/promises';
import path from 'path';
import { GeminiCollector } from '../gemini.collector';
import { CodexCollector } from '../codex.collector';
import { CopilotCollector } from '../copilot.collector';
import { Database } from 'bun:sqlite';

const TEST_DIR = path.join(import.meta.dir, 'temp_test_collectors');

describe('Collectors Real-time Functionality', () => {
  
  beforeAll(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('GeminiCollector', () => {
    const geminiDir = path.join(TEST_DIR, 'gemini');
    const chatsDir = path.join(geminiDir, 'project1', 'chats');

    beforeAll(async () => {
      await fs.mkdir(chatsDir, { recursive: true });
    });

    test('should detect and parse new gemini chat file', async () => {
      const collector = new GeminiCollector(geminiDir);
      const onSessionUpdate = spyOn({ fn: (event: any) => {} }, 'fn');
      collector.on('session-update', onSessionUpdate as any);

      await collector.start();

      const chatFile = path.join(chatsDir, 'session1.json');
      const chatData = {
        sessionId: 'session-123',
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        messages: [
          { id: '1', type: 'user', content: 'hello', timestamp: new Date().toISOString() },
          { id: '2', type: 'agent', content: 'hi', timestamp: new Date().toISOString() }
        ]
      };

      await fs.writeFile(chatFile, JSON.stringify(chatData));

      // Wait for debounce and chokidar
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(onSessionUpdate).toHaveBeenCalled();
      const event = onSessionUpdate.mock.calls[0]![0];
      const session = event.session;
      expect(session.id).toBe('session-123');
      expect(session.source).toBe('gemini');
      expect(session.messages.length).toBe(2);
      expect(event.raw).toBeDefined();

      await collector.stop();
    });
  });

  describe('CodexCollector', () => {
    const codexDir = path.join(TEST_DIR, 'codex');

    beforeAll(async () => {
      await fs.mkdir(codexDir, { recursive: true });
    });

    test('should detect and parse new codex jsonl file', async () => {
      const collector = new CodexCollector(codexDir);
      const onSessionUpdate = spyOn({ fn: (event: any) => {} }, 'fn');
      collector.on('session-update', onSessionUpdate as any);

      await collector.start();

      const chatFile = path.join(codexDir, 'session_codex.jsonl');
      const lines = [
        JSON.stringify({ timestamp: new Date().toISOString(), type: 'session_meta', payload: { id: 'codex-123', cwd: '/test/path', model: 'gpt-4' } }),
        JSON.stringify({ timestamp: new Date().toISOString(), type: 'event_msg', payload: { type: 'user_message', message: 'hello codex' } }),
        JSON.stringify({ timestamp: new Date().toISOString(), type: 'event_msg', payload: { type: 'agent_message', message: 'hello human' } })
      ];

      await fs.writeFile(chatFile, lines.join('\n') + '\n');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 800));

      expect(onSessionUpdate).toHaveBeenCalled();
      const event = onSessionUpdate.mock.calls[0]![0];
      const session = event.session;
      expect(session.id).toBe('codex-123');
      expect(session.source).toBe('codex');
      expect(session.messages.length).toBe(2);
      expect(event.raw).toBeDefined();

      await collector.stop();
    });
  });

  describe('CopilotCollector', () => {
    const copilotDir = path.join(TEST_DIR, 'copilot');
    const dbPath = path.join(copilotDir, 'session-store.db');

    beforeAll(async () => {
      await fs.mkdir(copilotDir, { recursive: true });
      const db = new Database(dbPath);
      db.run('CREATE TABLE sessions (id TEXT PRIMARY KEY, cwd TEXT, summary TEXT, created_at TEXT, updated_at TEXT)');
      db.run('CREATE TABLE turns (id TEXT PRIMARY KEY, session_id TEXT, turn_index INTEGER, user_message TEXT, assistant_response TEXT, timestamp TEXT)');
      db.close();
    });

    test('should detect and parse new copilot db entry', async () => {
      const targetDbDir = path.join(TEST_DIR, '.copilot');
      await fs.mkdir(targetDbDir, { recursive: true });
      const targetDbPath = path.join(targetDbDir, 'session-store.db');
      
      // Move our prepared db
      await fs.rename(dbPath, targetDbPath);

      const collector = new CopilotCollector(targetDbPath);
      const onSessionUpdate = spyOn({ fn: (event: any) => {} }, 'fn');
      collector.on('session-update', onSessionUpdate as any);

      await collector.start();

      // Insert data into DB
      const db = new Database(targetDbPath);
      const now = new Date().toISOString();
      db.run('INSERT INTO sessions (id, cwd, summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', 
        ['copilot-123', '/test/path', 'Test Summary', now, now]);
      db.run('INSERT INTO turns (id, session_id, turn_index, user_message, assistant_response, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        ['turn-1', 'copilot-123', 0, 'hello copilot', 'hi there', now]);
      db.close();

      // Wait for chokidar and debounce
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(onSessionUpdate).toHaveBeenCalled();
      const calls = onSessionUpdate.mock.calls;
      const foundCall = calls.find(call => call[0].session.id === 'copilot-123');
      expect(foundCall).toBeDefined();
      const event = foundCall![0];
      expect(event.session.id).toBe('copilot-123');
      expect(event.session.source).toBe('copilot');
      expect(event.raw).toBeDefined();

      await collector.stop();
    });
  });
});
