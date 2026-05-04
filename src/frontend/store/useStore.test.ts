import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from './useStore';
import type { Project, Session, Message } from '../../shared/schema';

const mockProject: Project = { id: 'p1', path: '/test', name: 'Test', progress: 0 };
const mockSession: Session = { id: 's1', projectId: 'p1', startTime: '2024-01-01T00:00:00Z', lastUpdated: '2024-01-01T00:00:00Z', status: 'active', model: 'gemini-1.5' };
const mockMessage: Message = { id: 'm1', sessionId: 's1', type: 'user', content: 'hello', timestamp: '2024-01-01T00:00:01Z' };

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      projectsById: {}, projectIds: [],
      sessionsById: {}, sessionIds: [],
      messagesById: {}, messageIds: [],
      currentProject: null, currentSession: null, searchQuery: '',
      loading: false, error: null
    });
  });

  it('sets and updates projects', () => {
    useStore.getState().setProjects([mockProject]);
    expect(useStore.getState().projectIds).toEqual(['p1']);
    expect(useStore.getState().projectsById['p1']).toEqual(mockProject);
    
    useStore.getState().updateProject({ id: 'p1', progress: 50 });
    expect(useStore.getState().projectsById['p1']?.progress).toBe(50);
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
    expect(useStore.getState().messageIds).toHaveLength(1);
    
    // Duplicate
    useStore.getState().addMessage('s1', mockMessage);
    expect(useStore.getState().messageIds).toHaveLength(1);
    
    // Different session ID
    useStore.getState().addMessage('s2', { ...mockMessage, id: 'm2' });
    expect(useStore.getState().messageIds).toHaveLength(1); // Not added because currentSession is s1
  });

  it('handles fetchProjects success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([mockProject])
    }) as unknown as typeof fetch;

    await useStore.getState().fetchProjects();
    expect(useStore.getState().projectIds).toEqual(['p1']);
    expect(useStore.getState().loading).toBe(false);
  });

  it('handles fetchProjects failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    }) as unknown as typeof fetch;

    await useStore.getState().fetchProjects();
    expect(useStore.getState().error).toBe('Failed to fetch projects');
    expect(useStore.getState().loading).toBe(false);
  });
});