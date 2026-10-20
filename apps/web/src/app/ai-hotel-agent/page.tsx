'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookDemoModal } from '@/components/BookDemoModal';
import {
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Mic,
  Zap,
  Lock,
  Calendar,
  DollarSign,
  ClipboardList,
  Check,
} from 'lucide-react';

export default function AiHotelAgentPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  const samplePrompts = [
    {
      cmd: 'Block Room 101 from tomorrow to 25th October for AC repair.',
      lang: 'English',
      action: 'Automated Room Blockage',
      desc: 'Checks for overlapping reservations, updates room state to BLOCKED, and records maintenance rationale in audit logs.',
      output: '✅ Room 101 successfully blocked from Oct 21 to Oct 25. Maintenance ticket #1042 dispatched to engineering.',
    },
    {
      cmd: 'Weekend ka rate ₹3,800 kar do sabhi Deluxe rooms ke liye.',
      lang: 'Hinglish',
      action: 'Tariff & Surcharge Override',
      desc: 'Applies weekend pricing rules across selected room types and pushes instant rate changes to connected OTAs.',
      output: '✅ Weekend rate updated to ₹3,800 for 12 Deluxe rooms. 2-way sync pushed to MakeMyTrip, Agoda, and Booking.com.',
    },
    {
      cmd: 'Kal kitne arrivals hain aur kitna payment bacha hai?',
      lang: 'Hindi / Hinglish',
      action: 'Arrivals & Balance Roster',
      desc: 'Pulls tomorrow’s arrival schedule with guest names, allotted room codes, contact numbers, and unpaid balances.',
      output: '📋 5 arrivals scheduled tomorrow. Total pending dues: ₹12,400. Direct payment links dispatched via WhatsApp.',
    },
    {
      cmd: 'Aaj din bhar me kitni payment collect hui?',
      lang: 'Hindi',
      action: 'Daily Collection Summary',
      desc: 'Aggregates collected payments grouped by UPI, Credit Cards, Cash, and Razorpay direct engine payments.',
      output: '💰 Today’s Collection: ₹48,500 (UPI: ₹28,000 | Razorpay Direct: ₹14,500 | Cash: ₹6,000). SAC 9963 GST applied.',
    },
    {
      cmd: 'Room 205 checkout ho gaya, housekeeping ko urgent alert bhejo.',
      lang: 'Hinglish',
      action: 'Housekeeping Siren Trigger',
      desc: 'Marks room dirty and sounds the 7-minute patented siren alarm with physical vibration on staff mobile phones.',
      output: '🚨 Room 205 marked DIRTY. Urgent Siren Alert dispatched to 3 housekeeping staff phones. Timer started.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-blue-50/60 via-surface-light to-white border-b border-border-light text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-brand-blue border border-blue-200 text-xs font-bold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Bilingual Hospitality Intelligence
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-content-primary-light tracking-tight leading-[1.15]">
            Run Your Hotel at the Speed of Speech.<br />
            <span className="text-brand-blue">English, Hindi & Hinglish.</span>
          </h1>
          <p className="mt-5 text-base sm:text-xl text-content-secondary-light max-w-3xl mx-auto leading-relaxed">
            Stop digging through complex multi-level menus. Instruct your hotel assistant in natural everyday language to block rooms, adjust weekend tariffs, pull arrival rosters, and dispatch housekeeping sirens.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              Try AI Assistant Free <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border-light bg-white text-content-primary-light font-bold text-sm hover:bg-surface-light transition shadow-sm"
            >
              Book a Live Demo
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-content-secondary-light font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> English, Hindi & Hinglish Voice/Text
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Zero Raw SQL / 100% Safe Execution
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Automated Audit Logged
            </span>
          </div>
        </div>
      </section>

      {/* Interactive AI Command Terminal Simulator */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-brand-blue flex items-center justify-center border border-blue-500/30">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">HotelFlexi Business Intelligence Core</h2>
                <p className="text-[11px] text-slate-400">Natural Language Action Execution Engine</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              ● Ready for Commands
            </span>
          </div>

          {/* Interactive Prompt Tabs */}
          <div>
            <label className="text-xs font-mono uppercase text-slate-400 font-bold block mb-3">
              Click a sample command to simulate:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePromptIndex(idx)}
                  className={`p-3 rounded-xl text-left border text-xs transition ${
                    activePromptIndex === idx
                      ? 'bg-blue-600/20 border-brand-blue text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-mono text-brand-blue uppercase block">{p.lang}</span>
                  <span className="line-clamp-1 mt-0.5">"{p.cmd}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Output Display */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 font-mono space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Mic className="w-4 h-4 text-brand-blue animate-pulse" />
              <span>Voice / Text Input:</span>
            </div>
            <div className="text-sm font-bold text-white bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              "{samplePrompts[activePromptIndex].cmd}"
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                PMS Tool Triggered: {samplePrompts[activePromptIndex].action}
              </span>
              <div className="text-xs text-emerald-400 bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/60 leading-relaxed font-sans">
                {samplePrompts[activePromptIndex].output}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Legacy PMS vs HotelFlexi AI */}
      <section className="py-20 bg-surface-light border-y border-border-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Efficiency Re-imagined</span>
            <h2 className="text-3xl font-extrabold text-content-primary-light mt-1">
              Why Waste 15 Minutes on Routine Tasks?
            </h2>
            <p className="text-sm text-content-secondary-light mt-2">
              Traditional hotel software forces your staff through complex screens and submenus. HotelFlexi finishes the job in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-7 rounded-2xl bg-white border border-red-200 shadow-sm space-y-4">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                Traditional PMS (14 Clicks)
              </div>
              <h3 className="text-lg font-bold text-content-primary-light">Blocking a Room for Repairs</h3>
              <ol className="space-y-2 text-xs text-content-secondary-light list-decimal list-inside leading-relaxed">
                <li>Log in to legacy desktop server</li>
                <li>Navigate to Master Setup &gt; Inventory</li>
                <li>Find Room 101 in 8-level tree menu</li>
                <li>Change availability flag to Out of Order</li>
                <li>Select dates on date picker</li>
                <li>Open separate channel manager software</li>
                <li>Manually update MMT, Agoda, and Booking.com extranets</li>
                <li>Hope staff remembers why the room was blocked</li>
              </ol>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-brand-blue shadow-md space-y-4 relative">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-brand-blue border border-blue-200">
                HotelFlexi AI (1 Voice Command)
              </div>
              <h3 className="text-lg font-bold text-content-primary-light">Say It. Done Instantly.</h3>
              <div className="p-4 rounded-xl bg-surface-light border border-border-light font-mono text-xs text-content-primary-light">
                "Block Room 101 tomorrow to 25th for AC servicing."
              </div>
              <ul className="space-y-2 text-xs text-content-secondary-light">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Validates zero conflicting bookings automatically</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Updates calendar grid and logs maintenance note</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pushes instant stop-sell to all connected OTAs in &lt; 2s</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Records immutable audit log for the property owner</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Security Architecture */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-950 text-white border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">100% Guarded Against Raw SQL Injection</h3>
              <p className="text-xs text-slate-400">Strict Tenant Isolation & Server-Side Verification</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Unlike experimental LLM tools that execute arbitrary database queries, HotelFlexi uses a <strong>deterministic function-calling architecture</strong>. The AI never sees raw SQL, cannot bypass role permissions, and cannot access another hotel’s data. Every action is verified against property schema rules and recorded in the tamper-proof audit trail.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold text-white block">Tenant Encapsulation</span>
              <span className="text-[11px] text-slate-400 mt-1 block">Your data is completely segregated by cryptographic tenant ID.</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold text-white block">Role Permission Bounds</span>
              <span className="text-[11px] text-slate-400 mt-1 block">Reception staff cannot execute owner-level rate overrides.</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold text-white block">Immutable Audit Log</span>
              <span className="text-[11px] text-slate-400 mt-1 block">Every AI modification records timestamp, user, and previous state.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-brand-blue text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Experience the Future of Hotel Operations
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Test the HotelFlexi Bilingual AI Assistant risk-free with your 14-day trial.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-brand-blue font-extrabold text-sm hover:bg-blue-50 shadow-lg transition"
            >
              Start Free 14-Day Trial
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/30 text-white font-bold text-sm hover:bg-white/10 transition"
            >
              Schedule Live Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <BookDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}