import { test, expect, describe, mock, beforeEach, afterEach } from 'bun:test';
import { Watcher } from './watcher';
import { Syncer } from './syncer';

// Mock chokidar
mock.module('chokidar', () => {
  return {
    watch: mock(() => ({
      on: mock().mockReturnThis(),
      close: mock(),
    })),
  };
});

describe('Watcher Service', () => {
  let syncerMock: Syncer;
  let watcher: Watcher;

  beforeEach(() => {
    syncerMock = {
      syncSessionFile: mock(),
      syncPlanFile: mock(),
      syncToolOutputFile: mock()
    } as unknown as Syncer;
    
    watcher = new Watcher(syncerMock);
  });
  
  afterEach(() => {
    watcher.stop();
  });

  test('constructor creates a watcher', () => {
    expect(watcher).toBeDefined();
  });

  test('handleFileChange triggers syncSessionFile for json', async () => {
    const handleFileChange = watcher['handleFileChange'].bind(watcher);
    handleFileChange('some/chats/test.json');
    
    await new Promise(r => setTimeout(r, 350));
    
    expect(syncerMock.syncSessionFile).toHaveBeenCalledWith('some/chats/test.json');
  });

  test('handleFileChange triggers syncPlanFile for md in plans folder', async () => {
    const handleFileChange = watcher['handleFileChange'].bind(watcher);
    const path = require('path');
    const filePath = path.join('session123', 'plans', 'plan.md');
    handleFileChange(filePath);
    
    await new Promise(r => setTimeout(r, 350));
    
    expect(syncerMock.syncPlanFile).toHaveBeenCalledWith(filePath, 'session123');
  });
});
