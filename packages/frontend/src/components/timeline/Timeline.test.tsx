import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineToolCall } from './TimelineToolCall';
import { TimelineThoughtTrace } from './TimelineThoughtTrace';
import { TimelineFilterBar } from './TimelineFilterBar';
import { TimelineItem } from './TimelineItem';
import type { ToolCall, ThoughtTrace, Message } from '@synapse/shared';

describe('Timeline Components', () => {
  describe('TimelineToolCall', () => {
    it('renders tool name and success badge', () => {
      const toolCall: ToolCall = {
        id: 'tc-1',
        name: 'run_command',
        args: JSON.stringify({ CommandLine: 'git status' }),
        result: 'On branch main',
        status: 'success',
        timestamp: new Date().toISOString(),
      };

      render(<TimelineToolCall toolCall={toolCall} />);
      expect(screen.getByText('run_command')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();

      // Expand to view arguments and result
      const button = screen.getByRole('button', { name: /run_command/i });
      fireEvent.click(button);

      expect(screen.getByText('Arguments')).toBeInTheDocument();
      expect(screen.getByText(/git status/)).toBeInTheDocument();
      expect(screen.getByText('Result / Output')).toBeInTheDocument();
      expect(screen.getByText('On branch main')).toBeInTheDocument();
    });

    it('renders failed tool call properly', () => {
      const toolCall: ToolCall = {
        id: 'tc-2',
        name: 'npm_install',
        args: 'package-xyz',
        result: '404 Not Found',
        status: 'error',
        timestamp: new Date().toISOString(),
      };

      render(<TimelineToolCall toolCall={toolCall} defaultExpanded={true} />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    });
  });

  describe('TimelineThoughtTrace', () => {
    it('renders reasoning steps and token count', () => {
      const traces: ThoughtTrace[] = [
        { subject: 'Analysis', description: 'Investigating bug origin' },
        { subject: 'Hypothesis', description: 'Missing column in query' },
      ];

      render(<TimelineThoughtTrace thoughtTraces={traces} reasoningTokens={150} />);
      expect(screen.getByText('Thought Process')).toBeInTheDocument();
      expect(screen.getByText('2 steps')).toBeInTheDocument();
      expect(screen.getByText('150 REASONING TOKENS')).toBeInTheDocument();

      // Click to expand
      const button = screen.getByRole('button', { name: /Thought Process/i });
      fireEvent.click(button);

      expect(screen.getByText('Analysis: Investigating bug origin')).toBeInTheDocument();
      expect(screen.getByText('Hypothesis: Missing column in query')).toBeInTheDocument();
    });
  });

  describe('TimelineFilterBar', () => {
    it('handles filter mode and search input changes', () => {
      const onFilterChange = vi.fn();
      const onSearchChange = vi.fn();
      const onToggleExpandAll = vi.fn();

      render(
        <TimelineFilterBar
          filterMode="all"
          onFilterChange={onFilterChange}
          searchQuery=""
          onSearchChange={onSearchChange}
          expandAll={false}
          onToggleExpandAll={onToggleExpandAll}
          counts={{ totalMessages: 10, totalTools: 4, totalThoughts: 2 }}
        />
      );

      // Check count badges
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      // Click on Tools tab
      const toolsTab = screen.getByRole('button', { name: /Tools/i });
      fireEvent.click(toolsTab);
      expect(onFilterChange).toHaveBeenCalledWith('tools');

      // Click on Expand All
      const expandBtn = screen.getByRole('button', { name: /Expand All/i });
      fireEvent.click(expandBtn);
      expect(onToggleExpandAll).toHaveBeenCalled();

      // Search input
      const searchInput = screen.getByPlaceholderText(/Search in session/i);
      fireEvent.change(searchInput, { target: { value: 'error' } });
      expect(onSearchChange).toHaveBeenCalledWith('error');
    });
  });

  describe('TimelineItem', () => {
    it('renders user message', () => {
      const userMsg: Message = {
        id: 'm1',
        sessionId: 's1',
        type: 'user',
        content: 'Please check git status',
        timestamp: new Date().toISOString(),
      };

      render(
        <TimelineItem
          message={userMsg}
          agentName="Gemini"
          filterMode="all"
          expandAll={false}
        />
      );

      expect(screen.getByText('Please check git status')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('renders agent turn with thought traces and tool calls in chronological order', () => {
      const agentMsg: Message = {
        id: 'm2',
        sessionId: 's1',
        type: 'agent',
        content: 'Everything is up to date.',
        timestamp: new Date().toISOString(),
        thoughtTraces: [
          { subject: 'Planning', description: 'Run git status first' }
        ],
        toolCalls: [
          {
            id: 'tc-1',
            name: 'git_status',
            args: '{}',
            result: 'Clean working tree',
            status: 'success'
          }
        ]
      };

      render(
        <TimelineItem
          message={agentMsg}
          agentName="Claude"
          filterMode="all"
          expandAll={true}
        />
      );

      expect(screen.getByText('Thought Process')).toBeInTheDocument();
      expect(screen.getByText('Planning: Run git status first')).toBeInTheDocument();
      expect(screen.getByText('git_status')).toBeInTheDocument();
      expect(screen.getByText('Clean working tree')).toBeInTheDocument();
      expect(screen.getByText('Everything is up to date.')).toBeInTheDocument();
    });
  });
});
