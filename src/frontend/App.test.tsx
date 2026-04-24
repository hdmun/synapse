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
  const mockState = {
    projects: [],
    sessions: [],
    messages: [],
    currentProject: null,
    currentSession: null,
    loading: false,
    error: null,
    fetchProjects: vi.fn(),
    addMessage: vi.fn(),
    updateProject: vi.fn(),
    updateSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // useStore(selector) 형태에 대응하기 위해 모킹 수정
    (useStore as any).mockImplementation((selector: any) => selector(mockState));
  });

  it('renders "Projects" header via ProjectList', () => {
    render(<App />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders "Select a project and session" when no session is selected', () => {
    render(<App />);
    expect(screen.getByText('Select a project and session to start monitoring')).toBeInTheDocument();
  });
});
