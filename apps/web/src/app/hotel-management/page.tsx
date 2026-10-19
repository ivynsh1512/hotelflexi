import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Calendar, BedDouble, CheckCircle2, ChevronRight, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

export default function HotelManagementPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Core PMS</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Hotel Property Management System
          </h1>
          <p className="mt-4 text-base sm:text-lg text-content-secondary-light max-w-2xl mx-auto">
            The beating heart of your front desk. Control rooms, reservations, walk-ins, and guest communication from a clean interactive visual grid.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Visual Operations</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-primary-light mt-1">
              Multi-View Room Booking Calendar
            </h2>
            <p className="mt-3 text-sm text-content-secondary-light leading-relaxed">
              Toggle between day, 14-day, and 30-day views. Instantly spot available rooms, occupied stays, maintenance blocks, and housekeeping status without refreshing.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-content-secondary-light">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Strict double-booking prevention on all booking channels</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>One-click guest check-in and check-out with automatic folio balance checks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Custom room blocks for maintenance or VIP owner usage</span>
              </li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-surface-dark-bg border border-border-dark text-white">
            <div className="text-xs font-mono text-emerald-400 mb-2">Live Calendar Grid Preview</div>
            <div className="space-y-2">
              {['Room 101 (Deluxe)', 'Room 102 (Deluxe)', 'Room 201 (Suite)', 'Room 202 (Suite)'].map((room, idx) => (
                <div key={room} className="flex items-center justify-between p-2.5 rounded bg-surface-dark-elevated text-xs">
                  <span>{room}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    idx === 1 ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'
                  }`}>
                    {idx === 1 ? 'Cleaning Required' : 'Occupied (Mr. Sharma)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-border-light">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-hover shadow transition"
          >
            Start Free PMS Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
