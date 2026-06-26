import React from 'react';
import { FolderOpen, MessageSquare, AlertCircle, RefreshCcw, Search } from 'lucide-react';

interface SkeletonProps {
  count?: number;
}

export const ProjectSkeleton = ({ count = 5 }: SkeletonProps) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="w-full h-[120px] bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-700/50" />
          <div className="h-4 bg-slate-700/50 rounded w-1/2" />
        </div>
        <div className="h-3 bg-slate-700/50 rounded w-3/4 mb-3" />
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-slate-700/50 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export const SessionSkeleton = ({ count = 5 }: SkeletonProps) => (
  <div className="space-y-2 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="w-full h-[110px] bg-slate-800/20 border border-transparent rounded-xl p-4">
        <div className="flex justify-between items-start mb-1">
          <div className="h-4 bg-slate-700/50 rounded w-1/4" />
          <div className="h-4 bg-slate-700/50 rounded w-1/5" />
        </div>
        <div className="h-3 bg-slate-700/50 rounded w-1/3 mt-2" />
        <div className="h-3 bg-slate-700/50 rounded w-full mt-3" />
        <div className="h-2 bg-slate-700/50 rounded w-1/4 mt-3" />
      </div>
    ))}
  </div>
);

export const MessageSkeleton = ({ count = 4 }: SkeletonProps) => (
  <div className="space-y-8 animate-pulse p-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'} space-y-2`}>
        <div className={`h-24 bg-slate-800/50 rounded-2xl w-[70%] ${i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`} />
        <div className="h-3 bg-slate-800/30 rounded w-32" />
      </div>
    ))}
  </div>
);

interface EmptyStateProps {
  icon?: 'project' | 'session' | 'search';
  title: string;
  description?: string;
}

export const EmptyState = ({ icon, title, description }: EmptyStateProps) => {
  const Icon = icon === 'project' ? FolderOpen : icon === 'session' ? MessageSquare : Search;
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
      <h4 className="text-sm font-bold text-slate-300 mb-1">{title}</h4>
      {description && <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">{description}</p>}
    </div>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center p-8 text-center h-full">
    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
      <AlertCircle size={24} className="text-red-500" />
    </div>
    <h4 className="text-sm font-bold text-red-400 mb-1">오류가 발생했습니다</h4>
    <p className="text-xs text-slate-500 mb-4 break-words max-w-[240px]">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700"
      >
        <RefreshCcw size={14} />
        다시 시도
      </button>
    )}
  </div>
);
