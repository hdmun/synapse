import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionList } from './SessionList';
import { useStore } from '../store/useStore';

describe('SessionList', () => {
  beforeEach(() => {
    useStore.setState({
      sessionsById: {
        's1-very-long-id': { id: 's1-very-long-id', projectId: 'p1', status: 'active', model: 'gemini-1.5', startTime: '1', lastUpdated: '1' }
      },
      sessionIds: ['s1-very-long-id'],
      currentSession: null,
      setCurrentSession: vi.fn(),
      fetchMessages: vi.fn()
    });
  });

  it('renders session list correctly', () => {
    render(<SessionList />);
    expect(screen.getByText('Chat Sessions')).toBeInTheDocument();
    expect(screen.getByText('#S1-VERY-')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(/Model gemini-1\.5/)).toBeInTheDocument();
  });

  it('handles session selection', () => {
    render(<SessionList />);
    const button = screen.getByText('#S1-VERY-').closest('button');
    if (button) fireEvent.click(button);

    const state = useStore.getState();
    expect(state.setCurrentSession).toHaveBeenCalledWith(expect.objectContaining({ id: 's1-very-long-id' }));
    expect(state.fetchMessages).toHaveBeenCalledWith('s1-very-long-id');
  });
});