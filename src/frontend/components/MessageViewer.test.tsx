import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageViewer } from './MessageViewer';
import { useStore } from '../store/useStore';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('MessageViewer', () => {
  beforeEach(() => {
    useStore.setState({
      messagesById: {},
      messageIds: [],
      currentSession: null,
      searchQuery: '',
      messagesLoading: false,
      messagesError: null,
      setSearchQuery: (q) => useStore.setState({ searchQuery: q }),
      fetchMessages: vi.fn()
    });
    vi.clearAllMocks();
  });

  it('renders placeholder when no session is selected', () => {
    render(<MessageViewer />);
    expect(screen.getByText(/세션을 선택하세요/i)).toBeInTheDocument();
  });

  it('renders multi-part JSON messages correctly', () => {
    const multiPartContent = JSON.stringify([
      { text: "Here is an image" },
      { inline_data: { mime_type: "image/png", data: "base64data" } }
    ]);

    useStore.setState({
      currentSession: { id: 's1', projectId: 'p1', status: 'active', model: 'gemini-pro', createdAt: new Date() } as any,
      messagesById: {
        'm1': { id: 'm1', sessionId: 's1', type: 'gemini', content: multiPartContent, timestamp: new Date() } as any
      },
      messageIds: ['m1']
    });

    render(<MessageViewer />);
    expect(screen.getByText('Here is an image')).toBeInTheDocument();
    expect(screen.getByText(/Inline Image \(image\/png\)/i)).toBeInTheDocument();
    const img = screen.getByRole('img', { name: /inline/i });
    expect(img).toHaveAttribute('src', 'data:image/png;base64,base64data');
  });

  it('renders local file reference with copy action', async () => {
    const fileContent = JSON.stringify([
      { file_data: { file_uri: "logs/error.log", mime_type: "text/plain" } }
    ]);

    useStore.setState({
      currentSession: { id: 's1', projectId: 'p1', status: 'active', model: 'gemini-pro', createdAt: new Date() } as any,
      messagesById: {
        'm1': { id: 'm1', sessionId: 's1', type: 'gemini', content: fileContent, timestamp: new Date() } as any
      },
      messageIds: ['m1']
    });

    render(<MessageViewer />);
    expect(screen.getByText('error.log')).toBeInTheDocument();
    expect(screen.getByText('logs/error.log')).toBeInTheDocument();

    const copyBtn = screen.getByTitle(/Copy Local Path/i);
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('logs/error.log');
  });

  it('renders thought process with accordion interaction', () => {
    useStore.setState({
      currentSession: { id: 's1', projectId: 'p1', status: 'active', model: 'gemini-pro', createdAt: new Date() } as any,
      messagesById: {
        'm1': { 
          id: 'm1', 
          sessionId: 's1', 
          type: 'gemini', 
          content: 'I am thinking', 
          timestamp: new Date(),
          thoughts: [{ subject: 'reasoning', description: 'analyzing request' }]
        } as any
      },
      messageIds: ['m1']
    });

    render(<MessageViewer />);
    expect(screen.getByText(/Thought Process/i)).toBeInTheDocument();
    
    // Content should be hidden initially
    expect(screen.queryByText('reasoning: analyzing request')).not.toBeInTheDocument();

    // Click to expand
    const toggleBtn = screen.getByRole('button', { name: /Thought Process/i });
    fireEvent.click(toggleBtn);

    // Content should be visible
    expect(screen.getByText('reasoning: analyzing request')).toBeInTheDocument();
  });

  it('filters messages based on search query', () => {
    useStore.setState({
      currentSession: { id: 's1', projectId: 'p1', status: 'active', model: 'gemini-pro', createdAt: new Date() } as any,
      messagesById: {
        'm1': { id: 'm1', content: 'Apple', type: 'user', timestamp: new Date() } as any,
        'm2': { id: 'm2', content: 'Banana', type: 'user', timestamp: new Date() } as any
      },
      messageIds: ['m1', 'm2']
    });

    const { rerender } = render(<MessageViewer />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();

    // Set search query
    useStore.setState({ searchQuery: 'apple' });
    rerender(<MessageViewer />);

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });
});
