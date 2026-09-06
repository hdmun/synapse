import React, { memo, useState, useMemo } from 'react';
import { Bot, Copy, Check, FileText, Image as ImageIcon, ExternalLink, Zap, Cpu, File } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@synapse/shared';

interface TimelineAgentMessageProps {
  message: Message;
  agentName: string;
}

export const TimelineAgentMessage = memo(({ message, agentName }: TimelineAgentMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyFilePath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Parse multi-part JSON or standard string content
  const parsedParts = useMemo(() => {
    if (!message.content) return [{ text: '' }];
    if (message.content.trim().startsWith('[') && message.content.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(message.content);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fallback to text
      }
    }
    return [{ text: message.content }];
  }, [message.content]);

  return (
    <div className="flex flex-col items-start w-full group mb-4">
      <div className="flex items-center gap-2 mb-1.5 ml-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Bot size={12} />
          <span>{agentName}</span>
        </div>
        <span>•</span>
        <span className="font-mono text-slate-500">{formattedTime}</span>
      </div>

      <div className="relative max-w-[88%] w-full bg-slate-850 bg-slate-800/80 border border-slate-700/70 rounded-2xl rounded-tl-none p-5 shadow-sm text-slate-200">
        <div className="space-y-3">
          {parsedParts.map((part: any, idx: number) => {
            if (part.text) {
              return (
                <div key={idx} className="text-sm leading-relaxed text-slate-200 prose prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="relative group/code my-3 rounded-lg overflow-hidden border border-slate-800">
                            <div className="bg-slate-900 px-3 py-1 text-[10px] font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
                              <span>{match[1]}</span>
                              <button
                                onClick={() => copyToClipboard(String(children))}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                                title="Copy code"
                              >
                                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!m-0 !bg-slate-950 !p-3 text-[11px] font-mono leading-relaxed"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            }

            if (part.inline_data) {
              const src = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <ImageIcon size={12} />
                    <span>Inline Image ({part.inline_data.mime_type})</span>
                  </div>
                  <img src={src} alt="inline" className="rounded-lg max-w-full border border-slate-700 shadow-sm" />
                </div>
              );
            }

            if (part.file_data) {
              const isImage = part.file_data.mime_type?.startsWith('image/');
              const fileUrl = `/files/${part.file_data.file_uri}`;
              return (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <File size={12} />
                    <span>Local File Reference</span>
                  </div>

                  {isImage ? (
                    <img src={fileUrl} alt={part.file_data.file_uri} className="rounded-lg max-w-full border border-slate-700 shadow-sm" />
                  ) : (
                    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={20} className="text-indigo-400" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-bold text-slate-200 truncate">
                            {part.file_data.file_uri.split('/').pop()}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate font-mono">
                            {part.file_data.file_uri}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyFilePath(part.file_data.file_uri)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            copiedFile ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                          title="Copy Local Path"
                        >
                          {copiedFile ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                          title="Open File"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Token Usage Badge */}
        {message.tokens && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-900 border border-slate-700/80 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
              <Zap size={10} className="text-amber-500" />
              <span>{message.tokens.base + (message.tokens.reasoning || 0)} TOKENS</span>
            </div>
            {message.tokens.reasoning ? (
              <div className="bg-slate-900 border border-slate-700/80 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-indigo-400 flex items-center gap-1.5">
                <Cpu size={10} />
                <span>{message.tokens.reasoning} REASONING</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
});

TimelineAgentMessage.displayName = 'TimelineAgentMessage';
