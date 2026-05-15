import * as chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { BaseCollector } from './base.collector';
import type { UnifiedSession, UnifiedMessage } from './types';
import { extractMessageSummary } from '../../utils/message-utils';

export class CodexCollector extends BaseCollector {
  private watcher: FSWatcher | null = null;
  private targetDir: string;
  private debounceMap = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(targetDir: string) {
    super();
    this.targetDir = targetDir;
  }

  async start(): Promise<void> {
    console.log(`[CodexCollector] Watching directory: ${this.targetDir}`);
    
    try {
      await fs.mkdir(this.targetDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    // Scan initial files using global Bun.Glob
    const pattern = `**/*.jsonl`;
    const glob = new Bun.Glob(pattern);
    
    for await (const file of glob.scan({ cwd: this.targetDir, onlyFiles: true })) {
      const filePath = path.join(this.targetDir, file as string);
      this.handleFileChange(filePath);
    }

    this.watcher = chokidar.watch(this.targetDir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', (filePath: string) => this.handleFileChange(filePath))
      .on('change', (filePath: string) => this.handleFileChange(filePath))
      .on('error', (error: any) => this.emitError(error));
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    
    // Clear all pending timeouts
    for (const timer of this.debounceMap.values()) {
      clearTimeout(timer);
    }
    this.debounceMap.clear();
  }

  private handleFileChange(filePath: string) {
    const ext = path.extname(filePath);
    if (ext === '.jsonl') {
      this.debounce(filePath, () => this.parseAndEmit(filePath));
    }
  }

  private debounce(key: string, fn: () => void, ms = 300) {
    if (this.debounceMap.has(key)) {
      clearTimeout(this.debounceMap.get(key)!);
    }
    this.debounceMap.set(key, setTimeout(() => {
      fn();
      this.debounceMap.delete(key);
    }, ms));
  }

  private async parseAndEmit(filePath: string) {
    try {
      const fileStream = createReadStream(filePath);
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let sessionId = '';
      let projectPath = '';
      let model = 'unknown';
      let startTime = new Date();
      let lastUpdated = new Date();
      
      const messages: UnifiedMessage[] = [];
      let currentMessage: UnifiedMessage | null = null;
      let msgIndex = 0;

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const entry = JSON.parse(line);
          const timestamp = new Date(entry.timestamp);
          lastUpdated = timestamp;

          if (entry.type === 'session_meta') {
            sessionId = entry.payload.id;
            projectPath = entry.payload.cwd;
            model = entry.payload.model || entry.payload.model_provider || 'codex';
            startTime = timestamp;
          } else if (entry.type === 'event_msg') {
            if (entry.payload.type === 'user_message') {
              currentMessage = {
                id: `msg-${msgIndex++}`,
                type: 'user',
                content: entry.payload.message || '',
                timestamp: timestamp,
              };
              messages.push(currentMessage);
            } else if (entry.payload.type === 'agent_message') {
              // If we already have an agent message object and it's the current one being built, append to it
              if (currentMessage && currentMessage.type === 'agent') {
                 currentMessage.content += (currentMessage.content ? '\n' : '') + (entry.payload.message || '');
                 currentMessage.timestamp = timestamp; // Update to latest
              } else {
                 currentMessage = {
                   id: `msg-${msgIndex++}`,
                   type: 'agent',
                   content: entry.payload.message || '',
                   timestamp: timestamp,
                   thoughts: [],
                   toolCalls: []
                 };
                 messages.push(currentMessage);
              }
            } else if (entry.payload.type === 'agent_reasoning') {
              const reasoningText = entry.payload.text || '';
              if (currentMessage && currentMessage.type === 'agent') {
                if (!currentMessage.thoughts) currentMessage.thoughts = [];
                currentMessage.thoughts.push({
                  subject: 'Reasoning',
                  description: reasoningText,
                  timestamp: timestamp
                });
              } else {
                currentMessage = {
                  id: `msg-${msgIndex++}`,
                  type: 'agent',
                  content: '',
                  timestamp: timestamp,
                  thoughts: [{
                    subject: 'Reasoning',
                    description: reasoningText,
                    timestamp: timestamp
                  }],
                  toolCalls: []
                };
                messages.push(currentMessage);
              }
            } else if (entry.payload.type === 'token_count') {
               if (currentMessage) {
                  currentMessage.inputTokens = entry.payload.info?.last_token_usage?.input_tokens;
                  currentMessage.outputTokens = entry.payload.info?.last_token_usage?.output_tokens;
                  currentMessage.thoughtTokens = entry.payload.info?.last_token_usage?.reasoning_output_tokens;
               }
            }
          } else if (entry.type === 'response_item') {
            if (entry.payload.type === 'function_call') {
               if (!currentMessage || currentMessage.type !== 'agent') {
                  currentMessage = {
                    id: `msg-${msgIndex++}`,
                    type: 'agent',
                    content: '',
                    timestamp: timestamp,
                    thoughts: [],
                    toolCalls: []
                  };
                  messages.push(currentMessage);
               }
               if (!currentMessage.toolCalls) currentMessage.toolCalls = [];
               
               let args = entry.payload.arguments;
               try {
                  if (typeof args === 'string') {
                    args = JSON.parse(args);
                  }
               } catch(e){}

               currentMessage.toolCalls.push({
                  id: entry.payload.call_id,
                  name: entry.payload.name,
                  args: args,
                  status: 'pending' as any, // Temporary internal state
                  timestamp: timestamp
               });
            } else if (entry.payload.type === 'function_call_output') {
               // Find the corresponding tool call in reverse to match the latest one
               for (let i = messages.length - 1; i >= 0; i--) {
                  const m = messages[i];
                  if (m && m.toolCalls) {
                     const tc = m.toolCalls.find((t: any) => t.id === entry.payload.call_id);
                     if (tc) {
                        tc.result = entry.payload.output;
                        // Map internal state to DB enum
                        tc.status = entry.payload.exit_code === 0 ? 'success' : 'error';
                        break;
                     }
                  }
               }
            } else if (entry.payload.type === 'message' && entry.payload.role === 'assistant') {
               if (currentMessage && currentMessage.type === 'agent') {
                  const contentItems = entry.payload.content || [];
                  const texts = contentItems
                    .filter((c: any) => c.type === 'output_text')
                    .map((c: any) => c.text)
                    .join('\n');
                  if (texts) {
                     currentMessage.content += (currentMessage.content ? '\n' : '') + texts;
                  }
               }
            }
          }
        } catch (e) {
          // ignore parsing error for single line
        }
      }

      if (!sessionId) return;

      // Final pass to ensure all tool calls have a valid DB status
      for (const msg of messages) {
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            if (tc.status === 'pending') {
              tc.status = 'success'; // Default to success if no output event followed
            }
          }
        }
      }

      const firstUserMsg = messages.find(m => m.type === 'user');
      const summary = firstUserMsg ? extractMessageSummary(firstUserMsg.content) : undefined;

      const unifiedSession: UnifiedSession = {
        source: 'codex',
        id: sessionId,
        projectPath,
        summary,
        model,
        startTime,
        lastUpdated,
        messages,
      };

      this.emitSessionUpdate(unifiedSession);
    } catch (err: any) {
      console.error(`[CodexCollector] Error parsing ${filePath}:`, err);
    }
  }
}
