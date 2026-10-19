'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Globe,
  Sparkles,
  UtensilsCrossed,
  TrendingUp,
  CreditCard,
  Layers,
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  BedDouble,
  Bell,
  Smartphone,
  Zap,
} from 'lucide-react';

export const HospitalityOSShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pms' | 'channels' | 'booking' | 'dining' | 'revenue' | 'ai'>('pms');

  const tabs = [
    {
      id: 'pms' as const,
      label: 'Property Management',
      desc: 'Drag-and-drop reservation calendar & instant check-in',
      icon: Calendar,
    },
    {
      id: 'channels' as const,
      label: 'Channel Manager',
      desc: 'Sync with 100+ OTAs instantly with zero overselling',
      icon: Globe,
    },
    {
      id: 'booking' as const,
      label: 'Booking Engine',
      desc: 'Direct bookings, mobile-optimized with 0% commission',
      icon: CreditCard,
    },
    {
      id: 'dining' as const,
      label: 'Dine-Out & Restaurant POS',
      desc: 'Table reservations for resort & outside guests with Pure Veg badge',
      icon: UtensilsCrossed,
    },
    {
      id: 'revenue' as const,
      label: 'Revenue Manager',
      desc: 'AI-powered dynamic pricing & SAC 9963 GST folios',
      icon: TrendingUp,
    },
    {
      id: 'ai' as const,
      label: 'Bilingual FlexiAI',
      desc: 'Autonomous front desk & review manager in Hindi & English',
      icon: Sparkles,
    },
  ];

  return (
    <section className="py-24 bg-slate-50/70 border-b border-border-light overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full">
            COMPLETE PLATFORM
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            The Hospitality Operating System
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            More than AI agents — a full platform that replaces multiple fragmented tools with a single unified system.
          </p>
        </div>

        {/* Tabbed Interactive Section (Matching Screenshot 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Vertical Tabs */}
          <div className="lg:col-span-5 space-y-2.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all flex items-start gap-3.5 border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.01]'
                      : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:bg-white shadow-sm'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {tab.label}
                      </h3>
                      {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Preview Card (Matching Screenshot 2 High-Fidelity UI) */}
          <div className="lg:col-span-7 bg-emerald-50/50 rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xl space-y-6">
            {/* Top Guest Loyalty Profile Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-sm flex items-center justify-center shadow-md">
                    AS
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      Aarav Sharma
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        🏆 Silver Loyalty • High Value
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      aarav.sharma@example.com • +91 98765 43210
                    </p>
                  </div>
                </div>

                <span className="self-start sm:self-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Checked In
                </span>
              </div>

              {/* Guest Stats Grid */}
              <div className="grid grid-cols-3 gap-4 pt-5 text-center sm:text-left">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reservations</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">12</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Spend</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹84,500</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Visit</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">27 days</div>
                </div>
              </div>
            </div>

            {/* Middle: Today's Overview Grid */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Today's Overview</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Hotel Code: <strong className="text-slate-900 font-mono">#58291</strong></span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-2xl font-black text-slate-900">12</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-0.5">Check-ins</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-2xl font-black text-slate-900">8</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-0.5">Check-outs</div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <div className="text-2xl font-black text-emerald-700">87%</div>
                  <div className="text-[11px] font-bold text-emerald-600 mt-0.5">Occupancy</div>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
                  <div className="text-2xl font-black text-blue-700">6</div>
                  <div className="text-[11px] font-bold text-blue-600 mt-0.5">Available</div>
                </div>
              </div>
            </div>

            {/* Dynamic Interactive Detail based on activeTab */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-md">
              {activeTab === 'pms' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Front Desk Tape Chart Preview</span>
                    <span className="text-emerald-600 font-semibold">● Auto-Room Allocation Active</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                      <div>Room 101</div>
                      <div className="text-[10px] font-medium opacity-80">Occupied</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                      <div>Room 102</div>
                      <div className="text-[10px] font-medium opacity-80">Occupied</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 font-bold border border-amber-200">
                      <div>Room 201</div>
                      <div className="text-[10px] font-medium opacity-80">Cleaning</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-100 text-blue-900 font-bold border border-blue-200">
                      <div>Room 202</div>
                      <div className="text-[10px] font-medium opacity-80">Reserved</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'channels' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>2-Way Live Channel Manager Sync</span>
                    <span className="text-emerald-600 font-semibold">● 2-Way Live Sync Active</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">MakeMyTrip &amp; Goibibo</span>
                      <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">Synced 2s ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">Agoda &amp; Booking.com</span>
                      <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">Synced 4s ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">Airbnb &amp; Expedia</span>
                      <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">Synced 1s ago</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'booking' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Direct Booking Engine (FlexiLink)</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">0% Commission</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Direct Online Reservation #HF-4091</div>
                      <div className="text-slate-500 text-[11px]">Paid via Razorpay UPI QR • Immediate Settlement</div>
                    </div>
                    <span className="font-black text-blue-700 text-sm">₹4,200</span>
                  </div>
                </div>
              )}

              {activeTab === 'dining' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span>Dine-Out Table Reservation</span>
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        🟢 100% Pure Veg
                      </span>
                    </div>
                    <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">Table for 4</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Pooja Verma (Pine Valley Resort Guest)</div>
                      <div className="text-slate-500 text-[11px]">Today at 08:30 PM • Pre-ordered Paneer Tikka &amp; Dal Makhani</div>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded text-[11px]">Confirmed</span>
                  </div>
                </div>
              )}

              {activeTab === 'revenue' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Indian GST Billing &amp; SAC 9963 Folio</span>
                    <span className="text-blue-600 font-bold">12% / 18% Automated</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500">Base Tariff</div>
                      <div className="font-bold text-slate-900">₹3,500.00</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500">CGST + SGST (12%)</div>
                      <div className="font-bold text-emerald-600">₹420.00</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500">Net Invoice</div>
                      <div className="font-bold text-slate-900">₹3,920.00</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Bilingual FlexiAI Conversation</span>
                    <span className="text-purple-600 font-bold">Hindi &amp; English</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700">
                    💬 "Kal ke arrivals dikhao aur Room 101 block kar do"
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-purple-900 font-medium">
                    🤖 "Tomorrow you have 5 arrivals. Room 101 has been blocked for maintenance and calendar updated."
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Quick CTA */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-600 font-medium">
                Included in the flat <strong>₹499/mo</strong> plan with channel manager.
              </span>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow"
              >
                Try It Free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
