import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App } from './App';

// Mocking useStore
vi.mock('./store/useStore', () => ({
  useStore: vi.fn(),
}));

// Mocking socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

import { useStore } from './store/useStore';

describe('App Component', () => {
  beforeEach(() => {
    (useStore as any).mockReturnValue({
      projects: [],
      sessions: [],
      messages: [],
      currentProject: null,
      currentSession: null,
      fetchProjects: vi.fn(),
      fetchSessions: vi.fn(),
      fetchMessages: vi.fn(),
      setCurrentProject: vi.fn(),
      setCurrentSession: vi.fn(),
    });
  });

  it('renders "Projects" header', () => {
    render(<App />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders "Select a project and session" when no session is selected', () => {
    render(<App />);
    expect(screen.getByText('Select a project and session to start monitoring')).toBeInTheDocument();
  });
});
