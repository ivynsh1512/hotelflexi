import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Sparkles, MessageSquare, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AiHotelAgentPage() {
  const samplePrompts = [
    { cmd: 'Block Room 101 from 3 October to 4 October.', lang: 'English', desc: 'Validates zero conflicting bookings and blocks the room.' },
    { cmd: 'Weekend ka rate ₹3,500 kar do.', lang: 'Hinglish', desc: 'Updates weekend rate tariffs across room types.' },
    { cmd: 'Kal ke arrivals dikhao.', lang: 'Hindi', desc: 'Fetches tomorrow’s check-in schedule with guest details.' },
    { cmd: 'Aaj kitni payment collect hui?', lang: 'Hinglish', desc: 'Summarizes payments collected across UPI, cash, and card.' },
    { cmd: 'Mark Room 204 as requiring housekeeping.', lang: 'English', desc: 'Marks room dirty and dispatches task to housekeeping staff.' },
    { cmd: 'Is booking ke liye complaint create karo.', lang: 'Hinglish', desc: 'Files a complaint ticket linked to guest reservation.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Bilingual Hospitality Intelligence
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            AI Business Agent for Hoteliers
          </h1>
          <p className="mt-4 text-base sm:text-lg text-content-secondary-light max-w-2xl mx-auto">
            Give instructions in English, Hindi, or Hinglish. Your assistant executes verified actions through real PMS services without executing unsafe raw SQL.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {samplePrompts.map((p) => (
            <div key={p.cmd} className="p-6 rounded-2xl border border-border-light bg-surface-light space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                  {p.lang}
                </span>
                <MessageSquare className="w-4 h-4 text-content-secondary-light" />
              </div>
              <div className="font-mono text-sm font-semibold text-content-primary-light bg-white p-3 rounded-lg border border-border-light">
                "{p.cmd}"
              </div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-2xl bg-surface-dark-bg border border-border-dark text-white space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-blue" />
            Safety & Strict Tenant Isolation
          </h3>
          <p className="text-sm text-content-secondary-dark leading-relaxed">
            The AI agent never executes raw SQL, cannot bypass role permissions, and never leaks one hotel’s business data to another hotel. Every consequential change (blocking a room, updating tariffs, creating invoices) is validated server-side and recorded in an immutable audit log.
          </p>
        </div>

        <div className="text-center pt-8 border-t border-border-light">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-hover shadow transition"
          >
            Try AI Assistant Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
