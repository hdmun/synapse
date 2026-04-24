import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectList } from './ProjectList';
import { useStore } from '../store/useStore';

describe('ProjectList', () => {
  beforeEach(() => {
    useStore.setState({
      projects: [{ id: 'p1', name: 'Test Project', path: '/test/path', progress: 50 }],
      currentProject: null,
      setCurrentProject: vi.fn(),
      fetchSessions: vi.fn()
    });
  });

  it('renders project list correctly', () => {
    render(<ProjectList />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('/test/path')).toBeInTheDocument();
  });

  it('handles project selection', () => {
    render(<ProjectList />);
    const button = screen.getByText('Test Project').closest('button');
    if (button) fireEvent.click(button);

    const state = useStore.getState();
    expect(state.setCurrentProject).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
    expect(state.fetchSessions).toHaveBeenCalledWith('p1');
  });
});