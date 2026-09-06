import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from './Dashboard';
import { useStore } from '../store/useStore';

vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('Dashboard Component - Token Taxonomy & Scoped Cost', () => {
  const defaultMock = {
    tokenStats: [
      { name: 'Synapse Core', tokens: 1500, baseTokens: 1200, reasoningTokens: 300, estimatedCost: 0.0025 }
    ],
    tokenStatsLoading: false,
    fetchTokenStats: vi.fn(),
    overviewStats: {
      totalTokens: 1500,
      baseTokens: 1200,
      reasoningTokens: 300,
      totalEstimatedCost: 0.0025,
      totalSessions: 5,
      activeAgents: ['gemini', 'copilot'],
      costSupportedAgents: ['gemini'],
    },
    overviewStatsLoading: false,
    fetchOverviewStats: vi.fn(),
    activityStats: [{ date: '2026-03-01', count: 5, level: 2 }],
    activityStatsLoading: false,
    fetchActivityStats: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockImplementation(() => defaultMock);
  });

  it('renders Command Center header and overview badges', () => {
    render(<Dashboard />);
    expect(screen.getByText('Command Center')).toBeInTheDocument();
    expect(screen.getByText('Global AI Activity & Token Audit Overview')).toBeInTheDocument();
  });

  it('renders Token Taxonomy breakdown (Base and Reasoning)', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText(/Base: 1,200/)).toBeInTheDocument();
    expect(screen.getByText(/Reasoning: 300/)).toBeInTheDocument();
  });

  it('renders Scoped Estimated Cost with provider notice', () => {
    render(<Dashboard />);
    expect(screen.getByText('Estimated Cost')).toBeInTheDocument();
    expect(screen.getByText('$0.0025')).toBeInTheDocument();
    expect(screen.getByText('Scoped')).toBeInTheDocument();
    expect(screen.getByText(/GEMINI 지원 소스 기준/)).toBeInTheDocument();
  });

  it('renders active agents accurately', () => {
    render(<Dashboard />);
    expect(screen.getByText('Active Agents')).toBeInTheDocument();
    expect(screen.getByText('gemini, copilot')).toBeInTheDocument();
  });
});
