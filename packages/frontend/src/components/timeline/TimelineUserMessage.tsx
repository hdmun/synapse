import React, { memo, useState } from 'react';
import { User, Copy, Check } from 'lucide-react';
import type { Message } from '@synapse/shared';

interface TimelineUserMessageProps {
  message: Message;
}

export const TimelineUserMessage = memo(({ message }: TimelineUserMessageProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="flex flex-col items-end w-full group mb-4">
      <div className="flex items-center gap-2 mb-1.5 mr-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span>User</span>
        <span>•</span>
        <span className="font-mono text-slate-500">{formattedTime}</span>
      </div>

      <div className="relative max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-none px-5 py-3.5 shadow-lg shadow-indigo-600/10 border border-indigo-500/30">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>

        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 p-1 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy message"
        >
          {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
});

TimelineUserMessage.displayName = 'TimelineUserMessage';
