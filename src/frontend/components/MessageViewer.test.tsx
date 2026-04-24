import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageViewer } from './MessageViewer';
import { useStore } from '../store/useStore';

// Mock react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { key: 0, index: 0, start: 0 }
    ],
    getTotalSize: () => 100,
    measureElement: vi.fn(),
    scrollToIndex: vi.fn(),
    measure: vi.fn()
  })
}));

describe('MessageViewer', () => {
  beforeEach(() => {
    useStore.setState({
      messages: [],
      currentSession: null
    });
  });

  it('renders placeholder when no session is selected', () => {
    render(<MessageViewer />);
    expect(screen.getByText('Select a project and session to start monitoring')).toBeInTheDocument();
  });

  it('renders messages when session is selected', () => {
    useStore.setState({
      currentSession: { id: 's1', projectId: 'p1', status: 'active', model: 'gemini', timestamp: 1 },
      messages: [
        { id: 'm1', sessionId: 's1', type: 'user', content: 'Hello World', timestamp: Date.now() }
      ]
    });

    render(<MessageViewer />);
    expect(screen.getByText('Session: s1...')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});