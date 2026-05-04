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

// Mock react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 100,
    measureElement: vi.fn(),
    scrollToIndex: vi.fn(),
    measure: vi.fn()
  })
}));

import { useStore } from './store/useStore';

describe('App Component', () => {
  const mockState = {
    projectsById: {}, projectIds: [],
    sessionsById: {}, sessionIds: [],
    messagesById: {}, messageIds: [],
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

  it('renders "Synapse Monitor" title', () => {
    render(<App />);
    expect(screen.getByText('Synapse Monitor')).toBeInTheDocument();
  });

  it('renders "Welcome to Synapse" when no session is selected', async () => {
    render(<App />);
    expect(await screen.findByText('Welcome to Synapse')).toBeInTheDocument();
  });
});
