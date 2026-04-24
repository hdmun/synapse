import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from './useStore';
import type { Project, Session, Message } from '../../shared/types';

const mockProject: Project = { id: 'p1', path: '/test', name: 'Test', progress: 0 };
const mockSession: Session = { id: 's1', projectId: 'p1', timestamp: 123, status: 'active', model: 'gemini-1.5' };
const mockMessage: Message = { id: 'm1', sessionId: 's1', type: 'user', content: 'hello', timestamp: 123 };

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      projects: [], sessions: [], messages: [],
      currentProject: null, currentSession: null, searchQuery: '',
      loading: false, error: null
    });
  });

  it('sets and updates projects', () => {
    useStore.getState().setProjects([mockProject]);
    expect(useStore.getState().projects).toEqual([mockProject]);
    
    useStore.getState().updateProject({ id: 'p1', progress: 50 });
    expect(useStore.getState().projects[0].progress).toBe(50);
  });
  
  it('updates currentProject if updated', () => {
    useStore.getState().setProjects([mockProject]);
    useStore.getState().setCurrentProject(mockProject);
    useStore.getState().updateProject({ id: 'p1', name: 'Updated' });
    expect(useStore.getState().currentProject?.name).toBe('Updated');
  });

  it('adds messages and prevents duplicates', () => {
    useStore.getState().setCurrentSession(mockSession);
    useStore.getState().addMessage('s1', mockMessage);
    expect(useStore.getState().messages).toHaveLength(1);
    
    // Duplicate
    useStore.getState().addMessage('s1', mockMessage);
    expect(useStore.getState().messages).toHaveLength(1);
    
    // Different session ID
    useStore.getState().addMessage('s2', { ...mockMessage, id: 'm2' });
    expect(useStore.getState().messages).toHaveLength(1); // Not added because currentSession is s1
  });

  it('handles fetchProjects success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([mockProject])
    });

    await useStore.getState().fetchProjects();
    expect(useStore.getState().projects).toEqual([mockProject]);
    expect(useStore.getState().loading).toBe(false);
  });

  it('handles fetchProjects failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    });

    await useStore.getState().fetchProjects();
    expect(useStore.getState().error).toBe('Failed to fetch projects');
    expect(useStore.getState().loading).toBe(false);
  });
});