'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Sparkles, Send, Bot, User, Loader2, CheckCircle2, ShieldCheck, Trash2, AlertTriangle, ArrowRight, Wand2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolExecuted?: boolean;
  timestamp: Date;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content:
    'Namaste! 🙏 I\'m FlexiAI, your hotel\'s bilingual business assistant. Type a command in English, Hindi or Hinglish — or tap a quick action below.',
  timestamp: new Date(),
};

export default function AiAgentPage() {
  const { currentTenant } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickChips = useMemo(() => {
    return [
      'Kal ke arrivals dikhao',
      'Room 101 block kar do kal ke liye',
      'Saare rooms unblock kar do',
      'Weekend rate ₹3,500 set karo',
      'Aaj ki payment collection dikhao',
      'Room 204 housekeeping assign karo',
      'Aaj ki occupancy dikhao',
      'Pending checkouts dikhao',
    ];
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageToSend) setInput('');
    setLoading(true);

    try {
      const data = await apiClient('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      if (data.conversationId) setConversationId(data.conversationId);

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        toolExecuted: data.toolExecuted,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `Action could not be completed: ${err.message || 'Error executing assistant command.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([{ ...INITIAL_MESSAGE, timestamp: new Date() }]);
    setConversationId(undefined);
    setInput('');
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const isWarningMessage = (content: string) =>
    content.startsWith('Action could not be completed:');

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="px-4 py-3 border-b border-border-light bg-surface-light flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-content-primary-light">
              FlexiAI — Hotel Business Assistant
            </h1>
            <p className="text-[11px] text-content-secondary-light">
              Bilingual • English, Hindi &amp; Hinglish • Tenant Isolated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/ai-agent/setup"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-blue bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-xs"
          >
            <Wand2 className="w-3.5 h-3.5 text-brand-blue" />
            <span>Property Setup Assistant</span>
            <ArrowRight className="w-3 h-3 text-brand-blue" />
          </Link>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Audited
          </span>
          <button
            onClick={handleClearConversation}
            title="Clear conversation"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-content-secondary-light border border-border-light rounded-lg hover:bg-white hover:text-status-danger transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Setup Callout Banner */}
      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100 flex items-center justify-between gap-3 text-xs text-blue-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">★</span>
          <span>
            <strong>New:</strong> Set up your entire hotel in 60 seconds by pasting room catalogues, WhatsApp rate cards, or policy notes.
          </span>
        </div>
        <Link
          href="/app/ai-agent/setup"
          className="font-bold underline text-blue-700 hover:text-blue-900 shrink-0 flex items-center gap-1"
        >
          Open AI Setup <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 px-4 py-5 sm:px-6 overflow-y-auto space-y-5 min-h-0">
        {messages.map((m) => {
          const isWarning = m.role === 'assistant' && isWarningMessage(m.content);
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs ${
                  m.role === 'user' ? 'bg-content-primary-light' : 'bg-brand-blue'
                }`}
              >
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-blue text-white rounded-tr-none'
                      : isWarning
                      ? 'bg-amber-50 border border-amber-300 text-amber-900 rounded-tl-none'
                      : 'bg-surface-light border border-border-light text-content-primary-light rounded-tl-none'
                  }`}
                >
                  {/* Warning icon prefix */}
                  {isWarning && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-amber-700 font-semibold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Action could not be completed
                    </div>
                  )}
                  {isWarning ? m.content.replace('Action could not be completed: ', '') : m.content}

                  {/* Tool executed badge */}
                  {m.toolExecuted && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ✓ Action Executed &amp; recorded in audit log
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-content-secondary-light px-1">
                  {formatTime(m.timestamp)}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-surface-light border border-border-light rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 text-content-secondary-light">
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              Checking business rules and executing operation...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-border-light bg-surface-light flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[10px] font-bold uppercase text-content-secondary-light shrink-0">Quick:</span>
        {quickChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            disabled={loading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-border-light hover:border-brand-blue hover:text-brand-blue transition text-content-secondary-light shrink-0 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="px-4 py-3 border-t border-border-light bg-white flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type in English, Hindi or Hinglish… (e.g. 'Saare rooms unblock kar do')"
          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue bg-surface-light"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-hover transition disabled:opacity-40 flex items-center gap-2 shrink-0 shadow-sm"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}
