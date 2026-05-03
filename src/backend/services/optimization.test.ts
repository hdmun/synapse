import { test, expect, describe, beforeEach, afterEach, spyOn } from 'bun:test';
import { Watcher } from './watcher';
import { Syncer } from './syncer';
import { initDb, db } from '../db';
import { fileSyncMetadata } from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

describe('Initial Scan Optimization', () => {
  let testDir: string;
  let syncer: Syncer;
  let watcher: Watcher;

  beforeEach(async () => {
    await initDb();
    
    // Create a temporary directory for testing
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'synapse-test-'));
    
    // Setup some initial files
    const chatsDir = path.join(testDir, 'chats');
    await fs.mkdir(chatsDir, { recursive: true });
    
    const sessionFile = path.join(chatsDir, 'session1.json');
    await fs.writeFile(sessionFile, JSON.stringify({
      sessionId: 'session1',
      projectHash: 'project1',
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messages: []
    }));

    syncer = new Syncer(testDir);
    watcher = new Watcher(syncer);
  });

  afterEach(async () => {
    watcher.stop();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('Initial scan registers file in DB', async () => {
    const sessionFile = path.join(testDir, 'chats', 'session1.json');
    
    // Spy on handleFileChange
    // @ts-ignore - access private method for testing
    const handleSpy = spyOn(watcher, 'handleFileChange');
    // Mock syncer.syncSessionFile to do nothing or update metadata
    const syncSpy = spyOn(syncer, 'syncSessionFile').mockImplementation(async (path) => {
      // @ts-ignore
      await syncer.updateMetadata(path);
    });

    // @ts-ignore
    await watcher.scanInitialFiles(testDir);

    // Wait for debounce
    await new Promise(r => setTimeout(r, 400));

    expect(handleSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalledTimes(1);

    const metadata = await db.query.fileSyncMetadata.findFirst({
      where: eq(fileSyncMetadata.path, sessionFile)
    });
    expect(metadata).toBeDefined();
    expect(metadata?.path).toBe(sessionFile);
  });

  test('Subsequent scan skips unchanged file', async () => {
    const sessionFile = path.join(testDir, 'chats', 'session1.json');
    
    // 1. First scan to register
    const syncSpy = spyOn(syncer, 'syncSessionFile').mockImplementation(async (path) => {
      // @ts-ignore
      await syncer.updateMetadata(path);
    });
    // @ts-ignore
    await watcher.scanInitialFiles(testDir);
    // Wait for debounce to ensure metadata is updated
    await new Promise(r => setTimeout(r, 400));
    expect(syncSpy).toHaveBeenCalledTimes(1);

    // 2. Second scan - should skip
    // @ts-ignore
    const handleSpy = spyOn(watcher, 'handleFileChange');
    syncSpy.mockClear();
    
    // @ts-ignore
    await watcher.scanInitialFiles(testDir);
    
    expect(handleSpy).not.toHaveBeenCalled();
    expect(syncSpy).not.toHaveBeenCalled();
  });

  test('Subsequent scan syncs changed file', async () => {
    const sessionFile = path.join(testDir, 'chats', 'session1.json');
    
    // 1. First scan
    const syncSpy = spyOn(syncer, 'syncSessionFile').mockImplementation(async (path) => {
      // @ts-ignore
      await syncer.updateMetadata(path);
    });
    // @ts-ignore
    await watcher.scanInitialFiles(testDir);
    // Wait for debounce
    await new Promise(r => setTimeout(r, 400));
    syncSpy.mockClear();

    // 2. Modify file (wait a bit to ensure mtime changes)
    await new Promise(r => setTimeout(r, 100));
    await fs.writeFile(sessionFile, JSON.stringify({
      sessionId: 'session1',
      projectHash: 'project1',
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messages: [{ id: '1', type: 'user', content: 'modified', timestamp: new Date().toISOString() }]
    }));

    // 3. Second scan - should sync
    // @ts-ignore
    const handleSpy = spyOn(watcher, 'handleFileChange');
    
    // @ts-ignore
    await watcher.scanInitialFiles(testDir);
    
    expect(handleSpy).toHaveBeenCalledTimes(1);
  });
});
