import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectList } from './ProjectList';
import { useStore } from '../store/useStore';

describe('ProjectList', () => {
  beforeEach(() => {
    useStore.setState({
      projectsById: {
        'p1': { id: 'p1', name: 'Test Project', path: '/test', progress: 50, agents: ['gemini'] }
      },
      projectIds: ['p1'],
      currentProject: null,
      searchQuery: '',
      projectsLoading: false,
      projectsError: null,
      setCurrentProject: vi.fn(),
      fetchSessions: vi.fn(),
      fetchProjects: vi.fn()
    });
  });

  it('renders project list correctly', () => {
    render(<ProjectList />);
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText(/Syncing\.\.\. 50%/)).toBeInTheDocument();
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