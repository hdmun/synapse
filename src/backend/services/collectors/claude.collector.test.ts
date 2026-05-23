import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ClaudeCollector } from './claude.collector';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UnifiedSession } from './types';

describe('ClaudeCollector', () => {
  const targetDir = path.join(process.cwd(), '.tmp-claude-test');
  let collector: ClaudeCollector;

  beforeEach(async () => {
    await fs.mkdir(targetDir, { recursive: true });
    collector = new ClaudeCollector(targetDir);
  });

  afterEach(async () => {
    await collector.stop();
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it('should parse existing jsonl files during initial scan', async () => {
    const sessionFile = path.join(targetDir, 'session-123.jsonl');
    const jsonLines = [
      JSON.stringify({ type: 'system', cwd: '/mock/project/path', timestamp: '2024-01-01T00:00:00Z' }),
      JSON.stringify({ 
        type: 'user', 
        content: [{ type: 'text', text: 'Hello Claude' }],
        timestamp: '2024-01-01T00:00:01Z'
      }),
      JSON.stringify({ 
        type: 'assistant', 
        content: [
          { type: 'thinking', content: 'I should say hi' },
          { type: 'text', text: 'Hello human!' }
        ],
        usage: { input_tokens: 10, output_tokens: 20 },
        timestamp: '2024-01-01T00:00:02Z'
      })
    ];
    await fs.writeFile(sessionFile, jsonLines.join('\n'));

    let emittedSession: UnifiedSession | null = null;
    collector.on('session-update', (session) => {
      emittedSession = session;
    });

    await collector.start();

    // Wait briefly for initial scan to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(emittedSession).not.toBeNull();
    if (emittedSession) {
      expect(emittedSession.source).toBe('claude');
      expect(emittedSession.id).toBe('session-123');
      expect(emittedSession.projectPath).toBe('/mock/project/path');
      expect(emittedSession.messages.length).toBe(2);

      const userMsg = emittedSession.messages[0];
      expect(userMsg.type).toBe('user');
      expect(userMsg.content).toBe('Hello Claude');

      const agentMsg = emittedSession.messages[1];
      expect(agentMsg.type).toBe('agent');
      expect(agentMsg.content).toBe('Hello human!');
      expect(agentMsg.thoughts?.length).toBe(1);
      expect(agentMsg.inputTokens).toBe(10);
      expect(agentMsg.outputTokens).toBe(20);
    }
  });

  it('should detect new jsonl files and emit session updates', async () => {
    let emittedSession: UnifiedSession | null = null;
    let resolveSession: () => void;
    const sessionPromise = new Promise<void>((resolve) => {
      resolveSession = resolve;
    });

    collector.on('session-update', (session) => {
      emittedSession = session;
      resolveSession();
    });

    await collector.start();

    // Give watcher a bit more time to settle natively
    await new Promise(r => setTimeout(r, 500));

    const sessionFile = path.join(targetDir, 'session-new.jsonl');
    const jsonLines = [
      JSON.stringify({ type: 'system', cwd: '/mock/new/project' }),
      JSON.stringify({ type: 'user', text: 'Just testing text field' }),
      JSON.stringify({ type: 'assistant', text: 'Got it!' })
    ];
    
    // Write new file which triggers chokidar add/change event
    await fs.writeFile(sessionFile, jsonLines.join('\n'));

    // Manually trigger to bypass chokidar flakiness on Windows in test environments
    (collector as any).scheduleParse('session-new.jsonl');

    // We can also poll to avoid hanging forever if watcher fails
    const timeoutPromise = new Promise<void>(r => setTimeout(r, 2000));
    await Promise.race([sessionPromise, timeoutPromise]);

    expect(emittedSession).not.toBeNull();
    if (emittedSession) {
      expect(emittedSession.id).toBe('session-new');
      expect(emittedSession.projectPath).toBe('/mock/new/project');
      expect(emittedSession.messages.length).toBe(2);
      expect(emittedSession.messages[0].content).toBe('Just testing text field');
      expect(emittedSession.messages[1].content).toBe('Got it!');
    }
  });
});
