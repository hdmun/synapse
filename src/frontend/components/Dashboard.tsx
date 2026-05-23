import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Cpu, Activity, CalendarDays } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ActivityCalendar from 'react-activity-calendar';

export function Dashboard() {
  const { 
    tokenStats, tokenStatsLoading, fetchTokenStats,
    activityStats, activityStatsLoading, fetchActivityStats
  } = useStore();

  useEffect(() => {
    fetchTokenStats();
    fetchActivityStats();
  }, [fetchTokenStats, fetchActivityStats]);

  if (tokenStatsLoading || activityStatsLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center h-full">
        <Activity size={48} className="opacity-10 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  const hasTokenData = tokenStats && tokenStats.length > 0;
  // Ensure we provide some data even if empty to prevent calendar from crashing
  const calendarData = activityStats && activityStats.length > 0 ? activityStats : [{ date: new Date().toISOString().split('T')[0], count: 0, level: 0 }];

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Cpu size={32} className="text-indigo-500" />
        <h2 className="text-2xl font-bold text-slate-100">Synapse Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Token Usage Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-indigo-400" />
            Token Usage by Project
          </h3>
          
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
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                  />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Bar 
                    dataKey="tokens" 
                    name="Total Tokens" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <p>No token usage data available yet.</p>
            </div>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <CalendarDays size={18} className="text-emerald-400" />
            Agent Activity Heatmap
          </h3>
          <div className="flex-1 flex items-center justify-center overflow-x-auto custom-scrollbar">
            <ActivityCalendar 
              data={calendarData} 
              theme={{
                light: ['#1e293b', '#34d399', '#10b981', '#059669', '#047857'],
                dark: ['#1e293b', '#34d399', '#10b981', '#059669', '#047857']
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
