'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookDemoModal } from '@/components/BookDemoModal';
import {
  Calendar,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Clock,
  Volume2,
  TrendingUp,
  Receipt,
  Users,
  Building,
  Sparkles,
  Phone,
  Lock,
} from 'lucide-react';

export default function HotelManagementPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-50 via-white to-white border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-brand-blue border border-blue-200 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-brand-blue" />
            <span>Complete Front Desk &amp; Cloud PMS</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-tight">
            The Beating Heart of Your Front Desk Operations
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate paperwork, messy registers, and overbooking chaos. Manage walk-ins, reservations, room blocks, weekend rates, and housekeeping from one visual interactive grid.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-blue text-white font-extrabold text-xs hover:bg-brand-blue-hover shadow transition"
            >
              Start Free 14-Day Trial &rarr;
            </Link>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-slate-900 border border-slate-300 font-extrabold text-xs hover:bg-slate-50 shadow-xs transition"
            >
              Book a Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Deep Capabilities Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Capability 1: Multi-View Calendar & Walk-In */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
              SPEED &amp; CLARITY
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950">
              Interactive Room Calendar &amp; Instant Walk-In Check-In
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Check in guests in under 30 seconds. Scan government ID / Aadhaar details, assign clean rooms automatically, and print GST registration cards or dispatch mobile FlexiLinks immediately.
            </p>
            <div className="space-y-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Day, 14-day, and 30-day interactive occupancy matrix with drag-and-drop ease</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant color-coded room status: Clean (Green), Occupied (Blue), Dirty (Amber), Blocked (Red)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Click-to-dial guest contact numbers (<code>tel:+91...</code>) directly from the front desk ledger</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-white">Live Front Desk Occupancy</span>
              <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 font-bold text-[10px]">
                Today: 88% Full
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Arrivals Today</div>
                <div className="text-lg font-black text-white">14 Rooms</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Departures Today</div>
                <div className="text-lg font-black text-white">8 Rooms</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Housekeeping Pending</div>
                <div className="text-lg font-black text-amber-400">3 Rooms</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Collections Today</div>
                <div className="text-lg font-black text-emerald-400">₹62,400</div>
              </div>
            </div>
          </div>
        </div>

        {/* Capability 2: Room Blockage & Weekend Rates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl space-y-4 order-2 lg:order-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-white">Single &amp; Bulk Room Blockage</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                Conflict Guard Active
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center border border-slate-800">
                <div>
                  <strong className="text-white">Rooms 101, 102, 103 (Wedding Party)</strong>
                  <div className="text-[10px] text-slate-400">Blocked: 24 Oct – 27 Oct</div>
                </div>
                <span className="text-amber-400 font-bold text-[11px]">OTA Stop-Sell Active</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center border border-slate-800">
                <div>
                  <strong className="text-white">Room 205 (AC Maintenance)</strong>
                  <div className="text-[10px] text-slate-400">Blocked: 21 Oct – 22 Oct</div>
                </div>
                <span className="text-red-400 font-bold text-[11px]">Out of Order</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 order-1 lg:order-2">
            <span className="text-xs font-black uppercase text-amber-600 tracking-wider">
              DYNAMIC CONTROL
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950">
              Single &amp; Bulk Room Blockage &amp; Weekend Pricing
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Block rooms for VIP weddings or scheduled repairs without fear of double bookings. Our engine checks for existing reservation conflicts and enforces present and future date rules.
            </p>
            <div className="space-y-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bulk room group blocking: select multiple rooms across date ranges with 1 tap</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automatic weekend pricing overrides (+15%–30% on Friday–Sunday check-ins)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Festival &amp; peak date custom surcharges (Diwali, New Year, Long Weekends)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Capability 3: Indian GST Billing & Folios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
              LEGAL COMPLIANCE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950">
              Indian GST 12% &amp; 18% Slabs with SAC 9963 Invoicing
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Never worry about tax audit notices or rounding discrepancies. HotelFlexi computes CGST, SGST, and IGST in integer paise, applies correct slab logic, and generates print-ready tax invoices.
            </p>
            <div className="space-y-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automated 12% (tariffs ≤ ₹7,500/night) and 18% (tariffs &gt; ₹7,500/night) tier split</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Separate tax posting for in-stay dining, room service, and laundry</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Corporate GSTIN support for business travelers with PDF invoice download</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-lg space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900">Tax Invoice #INV-2026-0841</span>
              <span className="font-mono text-[10px] text-slate-500">SAC: 9963</span>
            </div>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Room Tariff (2 Nights @ ₹3,500):</span>
                <span className="font-bold text-slate-900">₹7,000.00</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (6%):</span>
                <span className="font-bold text-slate-900">₹420.00</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (6%):</span>
                <span className="font-bold text-slate-900">₹420.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-950">
                <span>Total Amount Paid:</span>
                <span>₹7,840.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black">Transform Your Front Desk Today</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Get started in 10 minutes with our free 14-day trial. Zero credit card required.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-xl bg-brand-blue text-white font-extrabold text-xs shadow-lg hover:bg-brand-blue-hover transition"
            >
              Start Free Trial &rarr;
            </Link>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition"
            >
              Book a Live Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <BookDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
}
