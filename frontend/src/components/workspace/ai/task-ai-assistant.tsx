"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import API from '@/lib/axios-client';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Send, RotateCw, Sparkles, Bot, User, XCircle } from 'lucide-react';

interface AiResponse {
  message: string;
  summary: string;
  fallbackSummary?: string;
  parsed: any;
  count: number;
  llm?: { success: boolean; provider: string; error?: string };
  tasks: Array<{ _id: string; title: string; status: string; priority: string; dueDate?: string; project?: { name: string; emoji?: string } }>;
}

const suggestionsPreset = [
  "today's tasks",
  'overdue high priority',
  'what did I complete last week',
  'summarize blockers',
  'tasks due this week'
];

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string; meta?: { provider?: string; error?: string } };

const TaskAIAssistant: React.FC = () => {
  const workspaceId = useWorkspaceId();
  const [query, setQuery] = useState("what are today's tasks");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rateInfo, setRateInfo] = useState<{ limit?: string; remaining?: string; reset?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setHistory(h => [...h, msg]);
  }, []);

  const { mutate, isPending, reset } = useMutation<AiResponse, any, string>({
    mutationFn: async (q: string) => {
      const res = await API.post(`/ai/tasks/workspace/${workspaceId}`, { query: q });
      // Capture rate limit headers if present
      setRateInfo({
        limit: res.headers['x-ratelimit-limit'] || res.headers['x-ratelimit-ai-limit'] || undefined,
        remaining: res.headers['x-ratelimit-remaining'] || res.headers['x-ratelimit-ai-remaining'] || undefined,
        reset: res.headers['x-ratelimit-reset'] || res.headers['x-ratelimit-ai-reset'] || undefined
      });
      return res.data;
    },
    onMutate: (q) => {
      setError(null);
      addMessage({ role: 'user', content: q });
    },
    onSuccess: (data) => {
      const provider = data.llm?.success ? data.llm.provider : 'rule';
      addMessage({ role: 'assistant', content: data.summary, meta: { provider } });
    },
    onError: (err: any) => {
      setError(err?.message || 'Request failed');
      addMessage({ role: 'assistant', content: 'Unable to generate summary right now.', meta: { error: err?.message } });
    }
  });

  const ask = useCallback((preset?: string) => {
    const q = (preset ?? query).trim();
    if (!q || isPending) return;
    setQuery('');
    mutate(q);
  }, [query, mutate, isPending]);

  const clearChat = () => {
    setHistory([]);
    setError(null);
    reset();
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-6 md:p-8 shadow-lg dark:shadow-xl dark:shadow-gray-900/20 relative overflow-hidden">
      {/* Subtle background highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 font-bold text-lg text-gray-800 dark:text-gray-100">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 via-blue-800 to-gray-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Task AI Assistant
            </span>
            {rateInfo?.remaining && (
              <span className="ml-2 text-[10px] rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5">
                {rateInfo.remaining}/{rateInfo.limit ?? '?'} left
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={clearChat} disabled={isPending} className="h-7 text-xs">
              <RotateCw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <input
              className="w-full rounded-xl border border-gray-300 dark:border-border bg-white dark:bg-card text-gray-900 dark:text-gray-100 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 shadow-sm"
              placeholder="Ask about tasks... (e.g. 'today', 'overdue', 'my tasks')"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') ask(); }}
              disabled={isPending}
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30" onClick={() => ask()} disabled={isPending || !query.trim()}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" /> : <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </Button>
            </div>
          </div>
          <Button size="default" variant="secondary" onClick={() => ask("summarize today's focus")} disabled={isPending} className="hidden md:inline-flex gap-2 px-4 py-3 rounded-xl font-medium">
            <Sparkles className="w-4 h-4" /> Quick
          </Button>
        </div>

        {history.length === 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {suggestionsPreset.map(s => (
              <button key={s} onClick={() => ask(s)} className="text-xs px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200 hover:scale-105 font-medium">
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={scrollRef} className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4 border border-gray-200 dark:border-border shadow-inner">
          {history.map((m, i) => {
            const isUser = m.role === 'user';
            const bubbleClasses = isUser
              ? 'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-500 text-slate-800 dark:text-slate-100'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white';
            return (
              <div key={i} className="flex gap-2 items-start animate-fade-in">
                <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${isUser ? 'bg-slate-300 dark:bg-slate-500' : 'bg-blue-600'} text-[11px] text-white`}> {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />} </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs leading-relaxed px-3 py-2 rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${bubbleClasses}`}>
                    {m.content}
                  </div>
                  {m.meta?.provider && !m.meta.error && (
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-300 font-medium">
                      {m.meta.provider}
                    </div>
                  )}
                  {m.meta?.error && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
                      <XCircle className="w-3 h-3" /> {m.meta.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isPending && (
            <div className="flex gap-2 items-start opacity-80">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="text-xs px-3 py-2 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-400/30 animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> {error}
            <Button size="sm" variant="outline" onClick={() => ask(history.filter(m => m.role === 'user').slice(-1)[0]?.content || query)} disabled={isPending}>
              Retry
            </Button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400">
          <span>Natural language queries supported.</span>
          {rateInfo?.reset && (
            <span className="italic">Reset at {new Date(parseInt(rateInfo.reset) * 1000).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskAIAssistant;
