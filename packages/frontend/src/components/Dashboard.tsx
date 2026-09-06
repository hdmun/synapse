import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Cpu, Activity, CalendarDays, Zap, MessageSquare, DollarSign, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ActivityCalendar } from 'react-activity-calendar';

export function Dashboard() {
  const { 
    tokenStats, tokenStatsLoading, fetchTokenStats,
    overviewStats, overviewStatsLoading, fetchOverviewStats,
    activityStats, activityStatsLoading, fetchActivityStats
  } = useStore();

  useEffect(() => {
    fetchTokenStats();
    fetchOverviewStats();
    fetchActivityStats();
  }, [fetchTokenStats, fetchOverviewStats, fetchActivityStats]);

  if (tokenStatsLoading || activityStatsLoading || overviewStatsLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center h-full">
        <Activity size={48} className="opacity-10 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  const hasTokenData = tokenStats && tokenStats.length > 0;
  const totalTokens = overviewStats?.totalTokens ?? (tokenStats?.reduce((acc, curr) => acc + curr.tokens, 0) || 0);
  const baseTokens = overviewStats?.baseTokens ?? (tokenStats?.reduce((acc, curr) => acc + (curr.baseTokens || 0), 0) || 0);
  const reasoningTokens = overviewStats?.reasoningTokens ?? (tokenStats?.reduce((acc, curr) => acc + (curr.reasoningTokens || 0), 0) || 0);
  const totalSessions = overviewStats?.totalSessions ?? (activityStats?.reduce((acc, curr) => acc + curr.count, 0) || 0);
  const estimatedCost = overviewStats?.totalEstimatedCost ?? (tokenStats?.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0) || 0);
  const activeAgents = overviewStats?.activeAgents?.length ? overviewStats.activeAgents : ['gemini', 'copilot'];
  const costSupportedAgents = overviewStats?.costSupportedAgents?.length ? overviewStats.costSupportedAgents : ['gemini'];
  
  // Ensure we provide some data even if empty to prevent calendar from crashing
  const calendarData = activityStats && activityStats.length > 0 ? activityStats : [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 }];

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-slate-950/30">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Cpu size={32} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Command Center</h2>
            <p className="text-sm text-slate-400">Global AI Activity & Token Audit Overview</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          LAST SYNC: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 1. Total Tokens Card with Token Taxonomy Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tokens</span>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalTokens.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-2">
            <span className="text-indigo-400 font-semibold">Base: {baseTokens.toLocaleString()}</span>
            <span className="text-slate-600">|</span>
            <span className="text-purple-400 font-semibold">Reasoning: {reasoningTokens.toLocaleString()}</span>
          </div>
        </div>

        {/* 2. Sessions Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessions</span>
            <MessageSquare size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalSessions.toLocaleString()}</div>
          <div className="text-[10px] text-indigo-400 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp size={10} /> AI Sessions Recorded
          </div>
        </div>

        {/* 3. Estimated Cost Card (Scoped Drill-down) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Cost</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {estimatedCost > 0 ? `$${estimatedCost.toFixed(4)}` : '$0.0000'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold uppercase text-[9px]">
              Scoped
            </span>
            <span>{costSupportedAgents.map(a => a.toUpperCase()).join(', ')} 지원 소스 기준</span>
          </div>
        </div>

        {/* 4. Active Agents Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Agents</span>
            <Cpu size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{activeAgents.length}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1.5 capitalize">
            {activeAgents.join(', ')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Token Usage Chart (Stacked Bar Chart: Base vs Reasoning) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-indigo-400" />
              Token Usage by Project
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                <span className="text-slate-400">Base</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                <span className="text-slate-400">Reasoning</span>
              </div>
            </div>
          </div>
          
          {hasTokenData ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tokenStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                  />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: any, name: string) => [
                      `${Number(value).toLocaleString()} tokens`,
                      name === 'baseTokens' ? 'Base Tokens' : name === 'reasoningTokens' ? 'Reasoning Tokens' : name
                    ]}
                  />
                  <Bar 
                    dataKey="baseTokens" 
                    name="Base Tokens" 
                    stackId="tokens"
                    fill="#6366f1" 
                    radius={[0, 0, 0, 0]} 
                    barSize={36}
                  />
                  <Bar 
                    dataKey="reasoningTokens" 
                    name="Reasoning Tokens" 
                    stackId="tokens"
                    fill="#a855f7" 
                    radius={[4, 4, 0, 0]} 
                    barSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 italic text-sm">
              <p>No token usage data available yet.</p>
            </div>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
            <CalendarDays size={16} className="text-emerald-400" />
            Agent Activity Heatmap
          </h3>
          <div className="flex-1 flex items-center justify-center overflow-x-auto custom-scrollbar">
            <ActivityCalendar 
              data={calendarData} 
              theme={{
                light: ['#0f172a', '#34d399', '#10b981', '#059669', '#047857'],
                dark: ['#0f172a', '#34d399', '#10b981', '#059669', '#047857']
              }}
              labels={{
                legend: {
                  less: 'Less',
                  more: 'More'
                },
                months: [
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ],
                totalCount: '{{count}} sessions in the last year'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
