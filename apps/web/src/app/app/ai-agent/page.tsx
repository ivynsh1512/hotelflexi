'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Sparkles, Send, Bot, User, Loader2, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolExecuted?: boolean;
}

export default function AiAgentPage() {
  const { currentTenant } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        'Namaste! I am HotelFlexi’s AI Business Assistant. You can give me operational commands in English, Hindi, or Hinglish, or click any sample prompt below.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChips = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.getDate();
    const month = tomorrow.toLocaleString('en-IN', { month: 'long' });
    const formattedTomorrow = `${day} ${month}`;

    return [
      'Kal ke arrivals dikhao.',
      `Kal (${formattedTomorrow}) ko Room 101 block kar do.`,
      'Weekend ka rate ₹3,500 kar do.',
      'Aaj kitni payment collect hui?',
      'Room 204 ki housekeeping assign karo.',
      'Aaj ki occupancy dikhao.',
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
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `Action failed: ${err.message || 'Error executing assistant command.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 border-b border-border-light bg-surface-light flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-content-primary-light">
              HotelFlexi AI Business Agent
            </h1>
            <p className="text-[11px] text-content-secondary-light">
              Bilingual Assistant • Supports English, Hindi, and Hinglish
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Tenant Isolated & Audited
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs ${
                m.role === 'user' ? 'bg-content-primary-light' : 'bg-brand-blue'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-blue text-white rounded-tr-none'
                  : 'bg-surface-light border border-border-light text-content-primary-light rounded-tl-none'
              }`}
            >
              {m.content}
              {m.toolExecuted && (
                <div className="mt-2.5 pt-2 border-t border-border-light flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Action verified and recorded in audit log
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-surface-light border border-border-light rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2 text-content-secondary-light">
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              Checking business rules and executing operation...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-border-light bg-surface-light flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold uppercase text-content-secondary-light shrink-0">Try:</span>
        {quickChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-border-light hover:border-brand-blue hover:text-brand-blue transition text-content-secondary-light shrink-0"
          >
            "{chip}"
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-border-light bg-white flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak or type a command (e.g. 'Kal ke arrivals dikhao', 'Block Room 101')..."
          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>
    </div>
  );
}
