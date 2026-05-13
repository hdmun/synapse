import React from 'react';
import { Sparkles, Bot, BrainCircuit, MessageSquare } from 'lucide-react';

export interface AgentConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  themeColorClass: string;   // For general text/border classes
  bgThemeClass: string;      // For background tint
  borderThemeClass: string;  // For border tint
}

export const AGENTS: Record<string, AgentConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    icon: Sparkles,
    themeColorClass: 'text-blue-400',
    bgThemeClass: 'bg-blue-900/30',
    borderThemeClass: 'border-blue-500/30'
  },
  copilot: {
    id: 'copilot',
    name: 'Copilot',
    icon: Bot,
    themeColorClass: 'text-purple-400',
    bgThemeClass: 'bg-purple-900/30',
    borderThemeClass: 'border-purple-500/30'
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    icon: BrainCircuit,
    themeColorClass: 'text-orange-400',
    bgThemeClass: 'bg-orange-900/30',
    borderThemeClass: 'border-orange-500/30'
  },
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: MessageSquare,
    themeColorClass: 'text-emerald-400',
    bgThemeClass: 'bg-emerald-900/30',
    borderThemeClass: 'border-emerald-500/30'
  }
};

export const DEFAULT_AGENT = {
  id: 'unknown',
  name: 'Unknown',
  icon: Sparkles,
  themeColorClass: 'text-slate-400',
  bgThemeClass: 'bg-slate-800/30',
  borderThemeClass: 'border-slate-500/30'
};

export function getAgentConfig(agentId: string): AgentConfig {
  return AGENTS[agentId] || { ...DEFAULT_AGENT, id: agentId, name: agentId.charAt(0).toUpperCase() + agentId.slice(1) };
}
