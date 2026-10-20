'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookDemoModal } from '@/components/BookDemoModal';
import {
  Layers,
  Globe,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Percent,
  Clock,
  Zap,
  Sliders,
  AlertOctagon,
  ChevronRight,
  Check,
} from 'lucide-react';

export default function ChannelManagerPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  const channels = [
    {
      name: 'MakeMyTrip & Goibibo',
      market: 'India #1 Domestic OTA',
      desc: 'Connect to India’s largest travel network with real-time room availability, corporate tie-ups, and promo syncing.',
      tag: 'Indian Market Leader',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      name: 'Booking.com',
      market: 'Global International Travelers',
      desc: 'Seamless direct connection to 100M+ international travelers with dynamic room rate parity and instant cancellation sync.',
      tag: 'Global Reach',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      name: 'Agoda',
      market: 'Southeast Asia & Leisure',
      desc: 'Instant ARI push for Asian outbound travelers, inbound tourists, and last-minute city hotel flash bookings.',
      tag: 'High Conversion',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      name: 'Airbnb',
      market: 'Villas, Homestays & Boutique Stays',
      desc: 'Native iCal and API synchronization for luxury homestays, heritage palace suites, and weekend farmstays.',
      tag: 'Alternative Stays',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      name: 'Expedia Group',
      market: 'US, UK & Corporate Booking Network',
      desc: 'Distribute rooms across Hotels.com, Vrbo, and Expedia Partner Solutions with automated currency conversions.',
      tag: 'Corporate & MICE',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      name: 'Yatra & EaseMyTrip',
      market: 'Tier-2 & Tier-3 Regional Hubs',
      desc: 'Complete coverage for Indian pilgrimage cities, leisure hill stations, and Tier-2 business corridors.',
      tag: 'Regional Growth',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  const features = [
    {
      icon: RefreshCw,
      title: 'Sub-2-Second Two-Way ARI Sync',
      desc: 'Availability, Rates, and Inventory update across all connected channels simultaneously the millisecond a front-desk walk-in or website direct booking occurs.',
    },
    {
      icon: Percent,
      title: 'Channel Rate Markup Rules',
      desc: 'Offset high 18%–25% OTA commissions by applying custom percentage markups per channel (e.g. +15% on Booking.com, +12% on MakeMyTrip) while keeping direct rates lowest.',
    },
    {
      icon: AlertOctagon,
      title: 'Single-Click Stop-Sell & Min-Stay',
      desc: 'Instantly block OTA sales during high-demand wedding buyouts or long holiday weekends to reserve inventory for high-margin direct guests.',
    },
    {
      icon: Zap,
      title: 'Automated 02:00 UTC Reconciliation',
      desc: 'Scheduled automated sanity verification audits your local PMS inventory against all remote OTA extranets every night to eliminate drift and human errors.',
    },
    {
      icon: Sliders,
      title: 'Derived & Linked Rate Plans',
      desc: 'Update your base Deluxe Room rate once, and watch Non-Refundable, Breakfast Inclusive (CP/MAP), and Weekend packages recalculate automatically.',
    },
    {
      icon: ShieldCheck,
      title: 'Overbooking Protection Shield',
      desc: 'Zero duplicate bookings. When the last room of any category sells out, an instant stop-sell flag is pushed across every extranet within seconds.',
    },
  ];

  const faqs = [
    {
      q: 'How does HotelFlexi prevent double bookings between walk-ins and OTAs?',
      a: 'HotelFlexi uses a centralized transaction lock. As soon as a walk-in is created at your front desk or a guest books on your website, our Cloudflare edge worker immediately triggers outgoing webhooks to MakeMyTrip, Agoda, and Booking.com to deduct available room counts.',
    },
    {
      q: 'Can I set different room prices on MakeMyTrip vs Booking.com?',
      a: 'Yes. With HotelFlexi Rate Multipliers, you can define base room prices on your PMS (e.g. ₹3,000) and automatically push ₹3,450 (+15%) to Booking.com and ₹3,360 (+12%) to MakeMyTrip, helping you cover OTA commissions.',
    },
    {
      q: 'Do I need expensive separate contracts with third-party channel managers?',
      a: 'No. Unlike traditional PMS software that charges an extra ₹5,000 to ₹15,000 per month for channel manager integrations, HotelFlexi includes the native 2-way distribution engine right inside your plan.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-blue-50/60 via-surface-light to-white border-b border-border-light text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-brand-blue border border-blue-200 text-xs font-bold mb-4 shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            2-Way Real-Time OTA Channel Manager
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-content-primary-light tracking-tight leading-[1.15]">
            Sell Rooms Across All OTAs.<br />
            <span className="text-brand-blue">Never Get Double Booked.</span>
          </h1>
          <p className="mt-5 text-base sm:text-xl text-content-secondary-light max-w-3xl mx-auto leading-relaxed">
            Synchronize room inventories, dynamic pricing, rate multipliers, and stop-sells in real time across MakeMyTrip, Agoda, Booking.com, Airbnb, and Expedia from a single command center.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border-light bg-white text-content-primary-light font-bold text-sm hover:bg-surface-light transition shadow-sm"
            >
              Schedule Live Demo
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-content-secondary-light font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> &lt; 2s Sync Latency
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Rate Multipliers
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Instant Stop-Sell
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Zero Overbooking Guarantee
            </span>
          </div>
        </div>
      </section>

      {/* Real-Time Sync Architecture Flow Simulation */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400">
                  Live 2-Way Sync Engine Active
                </span>
              </div>
              <h2 className="text-2xl font-black mt-1">Multi-Channel Rate & Inventory Parity</h2>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              Auto-Sync: <span className="text-white font-bold">Enabled</span> • Last Reconciled:{' '}
              <span className="text-emerald-400">Just now</span>
            </div>
          </div>

          {/* Flow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {/* Master Node */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500/50 shadow-inner flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-brand-blue font-bold tracking-wide">
                  Central PMS Master
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Front Desk & Direct</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Deluxe Room • 4 Available
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-2xl font-black text-white">₹3,000</div>
                <div className="text-[10px] text-emerald-400 font-semibold">Base Direct Tariff</div>
              </div>
            </div>

            {/* MakeMyTrip Node */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-red-400 font-bold tracking-wide">
                  MakeMyTrip
                </span>
                <h3 className="text-base font-bold text-white mt-1">MMT / Goibibo</h3>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Markup:</span>
                  <span className="text-red-400 font-bold">+12%</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-xl font-bold text-white">₹3,360</div>
                <div className="text-[10px] text-slate-400">Inventory: 4 Rooms</div>
              </div>
            </div>

            {/* Booking.com Node */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-400 font-bold tracking-wide">
                  Booking.com
                </span>
                <h3 className="text-base font-bold text-white mt-1">Global Traveler</h3>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Markup:</span>
                  <span className="text-blue-400 font-bold">+15%</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-xl font-bold text-white">₹3,450</div>
                <div className="text-[10px] text-slate-400">Inventory: 4 Rooms</div>
              </div>
            </div>

            {/* Agoda Node */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold tracking-wide">
                  Agoda
                </span>
                <h3 className="text-base font-bold text-white mt-1">Asia & Inbound</h3>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Markup:</span>
                  <span className="text-purple-400 font-bold">+10%</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-xl font-bold text-white">₹3,300</div>
                <div className="text-[10px] text-slate-400">Inventory: 4 Rooms</div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>When 1 room is booked on MMT, HotelFlexi automatically deducts inventory to 3 rooms on Booking.com, Agoda, and Front Desk within 1.2 seconds.</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 shrink-0">Real-Time Webhook Verified</span>
          </div>
        </div>
      </section>

      {/* Supported OTAs */}
      <section className="py-16 bg-surface-light border-y border-border-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Complete Distribution</span>
            <h2 className="text-3xl font-extrabold text-content-primary-light mt-1">
              Direct Connections to Every Major Portal
            </h2>
            <p className="text-sm text-content-secondary-light mt-2">
              Manage your availability and rates across domestic and global online travel agencies seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((ch) => (
              <div
                key={ch.name}
                className="p-6 rounded-2xl bg-white border border-border-light shadow-sm hover:border-brand-blue transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ch.color}`}>
                      {ch.tag}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-content-primary-light">{ch.name}</h3>
                  <p className="text-xs text-content-secondary-light font-medium mt-0.5">{ch.market}</p>
                  <p className="text-xs text-content-secondary-light mt-3 leading-relaxed">{ch.desc}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-border-light flex items-center justify-between text-[11px] font-semibold text-brand-blue">
                  <span>2-Way API Integrated</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Engineered for Indian Hoteliers</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-content-primary-light mt-1">
            Why Leading Hotels Switch to HotelFlexi
          </h2>
          <p className="text-sm text-content-secondary-light mt-2">
            No more manual extranet logins. No more double bookings during festival peaks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-6 rounded-2xl border border-border-light bg-white hover:shadow-md transition">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-content-primary-light">{f.title}</h3>
                <p className="text-xs text-content-secondary-light mt-2 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-surface-light border-t border-border-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-content-primary-light">
              Frequently Asked Questions About Channel Management
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-5 rounded-2xl bg-white border border-border-light">
                <h3 className="text-sm font-bold text-content-primary-light">{faq.q}</h3>
                <p className="text-xs text-content-secondary-light mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-brand-blue text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Ready to Automate Your Room Distribution?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Connect MakeMyTrip, Agoda, and Booking.com in minutes with HotelFlexi. No long-term lock-ins.
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
              Book a 1-on-1 Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <BookDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}