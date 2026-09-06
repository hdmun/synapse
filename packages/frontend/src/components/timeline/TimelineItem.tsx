import React, { memo, useMemo } from 'react';
import type { Message, ToolCall, ThoughtTrace } from '@synapse/shared';
import { TimelineUserMessage } from './TimelineUserMessage';
import { TimelineAgentMessage } from './TimelineAgentMessage';
import { TimelineToolCall } from './TimelineToolCall';
import { TimelineThoughtTrace } from './TimelineThoughtTrace';
import type { TimelineFilterMode } from './TimelineFilterBar';

interface TimelineItemProps {
  message: Message;
  agentName: string;
  filterMode: TimelineFilterMode;
  expandAll: boolean;
}

export const TimelineItem = memo(({
  message,
  agentName,
  filterMode,
  expandAll,
}: TimelineItemProps) => {
  const isUser = message.type === 'user';

  // Extract thoughtTraces
  const thoughtTraces: ThoughtTrace[] = useMemo(() => {
    if (message.thoughtTraces && message.thoughtTraces.length > 0) {
      return message.thoughtTraces;
    }
    if (message.enrichers?.gemini?.thoughtTrace && message.enrichers.gemini.thoughtTrace.length > 0) {
      return message.enrichers.gemini.thoughtTrace;
    }
    return [];
  }, [message.thoughtTraces, message.enrichers]);

  // Extract toolCalls (combining standard toolCalls with any embedded in content)
  const toolCalls: ToolCall[] = useMemo(() => {
    const list: ToolCall[] = [];
    if (message.toolCalls && message.toolCalls.length > 0) {
      list.push(...message.toolCalls);
    }
    // Also parse any legacy function_call in content JSON if toolCalls was empty
    if (list.length === 0 && message.content.trim().startsWith('[') && message.content.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(message.content);
        if (Array.isArray(parsed)) {
          for (const part of parsed) {
            if (part.function_call) {
              list.push({
                id: part.function_call.id || `tc-${Math.random().toString(36).slice(2, 7)}`,
                messageId: message.id,
                name: part.function_call.name,
                args: typeof part.function_call.args === 'object' ? JSON.stringify(part.function_call.args) : String(part.function_call.args || ''),
                status: 'success',
                timestamp: message.timestamp,
              });
            }
          }
        }
      } catch {}
    }
    return list;
  }, [message.toolCalls, message.content, message.id, message.timestamp]);

  // If filter is active, check visibility
  if (filterMode === 'tools' && toolCalls.length === 0) {
    return null;
  }
  if (filterMode === 'thoughts' && thoughtTraces.length === 0) {
    return null;
  }
  if (filterMode === 'messages' && isUser && !message.content) {
    return null;
  }

  // Render User Message
  if (isUser) {
    if (filterMode === 'tools' || filterMode === 'thoughts') {
      return null;
    }
    return <TimelineUserMessage message={message} />;
  }

  // Render Agent Turn in timeline flow: Thoughts -> Tools -> Final Message
  const hasThoughts = thoughtTraces.length > 0 && (filterMode === 'all' || filterMode === 'thoughts');
  const hasTools = toolCalls.length > 0 && (filterMode === 'all' || filterMode === 'tools');
  const hasAgentText = message.content && (filterMode === 'all' || filterMode === 'messages');

  return (
    <div className="w-full relative pl-6 my-4 before:absolute before:left-2 before:top-3 before:bottom-0 before:w-px before:bg-slate-800">
      {/* Node indicator on rail */}
      <div className="absolute left-1 top-3 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-900 ring-2 ring-indigo-500/20" />

      {/* 1. Thought Traces (Internal Reasoning) */}
      {hasThoughts && (
        <div className="mb-2">
          <TimelineThoughtTrace
            thoughtTraces={thoughtTraces}
            reasoningTokens={message.tokens?.reasoning}
            defaultExpanded={expandAll}
          />
        </div>
      )}

      {/* 2. Tool Calls (Execution & Results) */}
      {hasTools && (
        <div className="space-y-2 mb-2">
          {toolCalls.map((tc, idx) => (
            <TimelineToolCall
              key={tc.id || idx}
              toolCall={tc}
              defaultExpanded={expandAll}
            />
          ))}
        </div>
      )}

      {/* 3. Final Agent Explanation / Response */}
      {hasAgentText && (
        <TimelineAgentMessage
          message={message}
          agentName={agentName}
        />
      )}
    </div>
  );
});

TimelineItem.displayName = 'TimelineItem';
