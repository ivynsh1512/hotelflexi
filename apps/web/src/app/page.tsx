'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookDemoModal } from '@/components/BookDemoModal';
import {
  Calendar,
  Sparkles,
  Receipt,
  Globe,
  BedDouble,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Smartphone,
  UtensilsCrossed,
  Users,
  Check,
  Building,
  HeartHandshake,
  Zap,
  TrendingUp,
  Clock,
  Star,
  Layers,
  Volume2,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   WORD-REVEAL HOOK
───────────────────────────────────────────── */
function useWordReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // wrap each word in mask + inner span
    const rawText = el.textContent || '';
    const words = rawText.split(/\s+/).filter(Boolean);
    el.innerHTML = words
      .map(
        (w) =>
          `<span class="hf-word-mask"><span class="hf-word">${w}</span></span>`
      )
      .join(' ');
    // stagger reveal
    const spans = el.querySelectorAll<HTMLElement>('.hf-word');
    spans.forEach((s, i) => {
      setTimeout(() => s.classList.add('revealed'), 120 + i * 80);
    });
  }, [ref]);
}

/* ─────────────────────────────────────────────
   INTERSECTION OBSERVER HOOK
───────────────────────────────────────────── */
function useRevealObserver() {
  useEffect(() => {
    const targets = document.querySelectorAll('.hf-reveal, .hf-fade-slide, .hf-scale-in');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────
   SCROLL PROGRESS BAR
───────────────────────────────────────────── */
function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('hf-scroll-progress');
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = `${(scrolled / total) * 100}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div id="hf-scroll-progress" aria-hidden="true" />;
}

/* ─────────────────────────────────────────────
   HERO TAB SWITCHER CONTENT
───────────────────────────────────────────── */
const HERO_TABS = [
  { id: 'pms',     label: 'Front Desk PMS' },
  { id: 'channel', label: 'Channel Manager' },
  { id: 'booking', label: 'Booking Engine' },
  { id: 'wedding', label: 'Wedding Engine' },
  { id: 'ai',      label: 'FlexiAI Agent' },
];

const TAB_CONTENT: Record<string, { title: string; desc: string; metrics: { label: string; val: string; color: string }[] }> = {
  pms: {
    title: 'Cloud Front Desk — Anywhere, Any Device',
    desc: 'Walk-in check-in in under 30 seconds. Instant room assignment, GST invoice generation, and government ID scanning from your phone.',
    metrics: [
      { label: 'Check-in time', val: '< 30s', color: 'text-blue-600' },
      { label: 'GST Accuracy', val: '100%', color: 'text-emerald-600' },
      { label: 'Rooms Managed', val: '∞', color: 'text-indigo-600' },
    ],
  },
  channel: {
    title: '2-Way OTA Sync — Zero Double Bookings',
    desc: 'Live 2-way inventory & rate sync with MakeMyTrip, Goibibo, Booking.com, Agoda, Airbnb, and Expedia in under 1 second.',
    metrics: [
      { label: 'Sync Latency', val: '< 1s', color: 'text-blue-600' },
      { label: 'OTA Portals', val: '6+', color: 'text-emerald-600' },
      { label: 'Double Bookings', val: '0', color: 'text-red-500' },
    ],
  },
  booking: {
    title: 'Commission-Free Direct Bookings',
    desc: 'Publish your branded booking page at /book/[slug] with Razorpay checkout. Guests pay directly into your account — 0% commission.',
    metrics: [
      { label: 'Commission', val: '0%', color: 'text-emerald-600' },
      { label: 'Payment Gateway', val: 'Razorpay', color: 'text-blue-600' },
      { label: 'Settlement', val: 'Instant', color: 'text-indigo-600' },
    ],
  },
  wedding: {
    title: 'Destination Wedding Packages & Quotations',
    desc: 'Curate decoration tiers, meal plans, and function packages. Couples get an instant PDF quotation with HotelFlexi branding.',
    metrics: [
      { label: 'Quotation', val: 'Instant PDF', color: 'text-amber-600' },
      { label: 'Decorations', val: 'Customisable', color: 'text-pink-600' },
      { label: 'Catering', val: 'Veg / Non-Veg', color: 'text-emerald-600' },
    ],
  },
  ai: {
    title: 'Bilingual AI — Hindi + English Voice Commands',
    desc: 'Speak or type in Hindi, English, or Hinglish. "Kal Room 101 block kar do" executes PMS actions autonomously.',
    metrics: [
      { label: 'Languages', val: 'Hindi + EN', color: 'text-blue-600' },
      { label: 'Query Cap', val: '600/mo (Pro)', color: 'text-indigo-600' },
      { label: 'Actions', val: 'Autonomous', color: 'text-emerald-600' },
    ],
  },
};

/* ─────────────────────────────────────────────
   MARQUEE ITEMS
───────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  '⚡ Channel Manager',
  '🏨 Cloud PMS',
  '🎯 Direct Booking Engine',
  '💍 Wedding Engine',
  '🤖 FlexiAI Concierge',
  '🧾 GST Billing',
  '🔔 Housekeeping Siren',
  '📲 FlexiLink Check-In',
  '📊 Revenue Analytics',
  '🌐 OTA Sync',
  '📸 Photo Management',
  '🛎️ Guest Portal',
];

/* ─────────────────────────────────────────────
   BENTO FEATURE CARDS
───────────────────────────────────────────── */
const BENTO_FEATURES = [
  {
    num: '01', icon: <Globe className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50',
    title: '2-Way OTA Channel Manager',
    desc: 'Sub-second ARI sync to MMT, Goibibo, Booking.com, Agoda, Airbnb & Expedia. Channel-specific markup rules.',
    tag: 'Pro & Enterprise',
  },
  {
    num: '02', icon: <BedDouble className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50',
    title: 'Cloud Front Desk PMS',
    desc: 'Walk-in check-in in 30s, instant room grid, government ID scan, and shift handover summaries.',
    tag: 'All Plans',
  },
  {
    num: '03', icon: <Receipt className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50',
    title: 'Indian GST Billing — 12% & 18%',
    desc: 'SAC 9963 compliant folios. CGST, SGST & IGST auto-calculated by tariff slab. Integer-paise accuracy.',
    tag: 'All Plans',
  },
  {
    num: '04', icon: <HeartHandshake className="w-5 h-5" />, color: 'text-pink-600', bg: 'bg-pink-50',
    title: 'Destination Wedding Engine',
    desc: 'Decoration tiers, day-wise catering, function selection, and instant branded PDF quotations for couples.',
    tag: 'Pro & Enterprise',
  },
  {
    num: '05', icon: <Sparkles className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50',
    title: 'FlexiAI Bilingual Agent',
    desc: 'Hindi + English voice commands. "Aaj ke arrivals dikhao" — AI executes PMS actions autonomously.',
    tag: 'All Plans',
  },
  {
    num: '06', icon: <Volume2 className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-50',
    title: 'Housekeeping Urgency Siren',
    desc: '880Hz audible siren + hardware vibration on staff phones until silenced. 7-minute SLA tracking.',
    tag: 'All Plans',
  },
  {
    num: '07', icon: <Smartphone className="w-5 h-5" />, color: 'text-teal-600', bg: 'bg-teal-50',
    title: 'Contactless FlexiLink Check-In',
    desc: 'Encrypted guest URL for self check-in, Aadhaar/Passport ID upload, and food ordering from room.',
    tag: 'All Plans',
  },
  {
    num: '08', icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50',
    title: 'Dynamic Pricing & Rate Shopper',
    desc: 'Date-based price matrix, seasonal rules, competitor rate tracking, and bulk rate updates.',
    tag: 'Pro & Enterprise',
  },
];

/* ─────────────────────────────────────────────
   PRICING PLANS
───────────────────────────────────────────── */
const plans = [
  {
    id: 'essential',
    name: 'Essential',
    price: '₹499',
    interval: '/month',
    desc: 'Front-desk PMS & booking automation for boutique hotels, homestays & apartments.',
    features: [
      'Up to 30 Rooms & 1 Property',
      'Room Calendar & Fast Walk-in Bookings',
      'Direct Booking Engine (/book/slug) — 0% Commission',
      'FlexiLink Contactless Self Check-In',
      'Housekeeping Urgency Siren System',
      'Tiered 12% & 18% GST SAC 9963 Billing',
      'Dine-Out Table Bookings with Pure Veg Badge',
      '14-Day Free Trial Included',
    ],
    highlighted: false,
    ctaText: 'Try for Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹999',
    interval: '/month',
    desc: 'Fast-growing resorts, boutique hotel groups & destination wedding properties.',
    features: [
      'Up to 75 Rooms & 3 Properties',
      '2-Way Live OTA Channel Manager (MMT, Agoda, Booking.com, Airbnb, Expedia)',
      'Interactive Destination Wedding Engine & Quotation Builder',
      'Custom Hotel Website with Free Domain & Hosting',
      'Google Hotel Center & GMB "Official Site" Free Booking Links',
      'Dynamic Pricing Matrix & Competitor Rate Shopper',
      'Bilingual FlexiAI Concierge (600 queries/mo)',
      'Priority WhatsApp & Dedicated Phone Support',
    ],
    highlighted: true,
    badge: 'Most Popular',
    ctaText: 'Try for Free',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹1,999',
    interval: '/month',
    desc: 'Multi-property hotel chains, luxury resorts & heritage palace franchises.',
    features: [
      'Unlimited Rooms & Properties',
      'Multi-Property Central Reservation System (CRS)',
      'White-Label Android App on Play Store',
      'Custom Webhooks & REST API Integrations',
      'Automated Dynamic Pricing & Competitor Tracking',
      'Dedicated Technical Account Manager',
      '99.99% Uptime Guarantee with Custom SLA',
    ],
    highlighted: false,
    ctaText: 'Contact Enterprise Sales',
  },
];

/* ─────────────────────────────────────────────
   FAQ
───────────────────────────────────────────── */
const faqs = [
  {
    q: 'How does the 2-Way Channel Manager prevent double-bookings?',
    a: 'HotelFlexi connects directly to MakeMyTrip, Goibibo, Booking.com, Agoda, Airbnb, and Expedia. The moment a room is booked anywhere, availability is updated across all channels within seconds, automatically placing stop-sells on booked rooms.',
  },
  {
    q: 'Do you charge commissions on direct bookings?',
    a: 'No! HotelFlexi charges 0% commission on direct bookings. Payments go directly into your own Razorpay account with your preferred advance policy — full advance, partial %, or pay at hotel.',
  },
  {
    q: 'What is the Housekeeping Urgency Siren and how does it work?',
    a: 'When a guest raises a complaint via FlexiLink, staff smartphones sound a dual-tone siren (880Hz/660Hz) with continuous vibration until a staff member picks it. The admin panel shows "Taken by [Staff Name]".',
  },
  {
    q: 'How does Indian GST (12%/18%) billing work?',
    a: 'HotelFlexi automatically applies statutory GST rules — 12% for room tariffs ≤ ₹7,500/night and 18% above. Invoices record CGST, SGST, and IGST with SAC 9963 classification and integer-paise precision.',
  },
  {
    q: 'Can staff operate HotelFlexi in Hindi or Hinglish?',
    a: 'Yes! FlexiAI supports Hindi, English, and Hinglish — e.g., "Kal Room 101 block kar do", "Today ke arrivals dikhao". The AI executes PMS operations autonomously.',
  },
  {
    q: 'Is there an installable mobile app for floor staff?',
    a: 'Yes — installable Android APK and Play Store bundle. Full-screen, no URL bar, persistent login, and native OS notifications for real-time siren alerts.',
  },
];

/* ─────────────────────────────────────────────
   COMPARISON DATA
───────────────────────────────────────────── */
const comparisonData = [
  { feature: '2-Way OTA Channel Manager (MMT, Agoda, Booking.com)', hotelflexi: 'Yes (Live 2-Way)', stayflexi: 'Yes', cloudbeds: 'Yes', axisrooms: 'Yes', ezee: 'Yes' },
  { feature: 'Direct Booking Engine with Zero Commission', hotelflexi: 'Yes (0% Fee)', stayflexi: 'Yes', cloudbeds: 'Yes', axisrooms: 'Extra Add-on', ezee: 'Extra Fee' },
  { feature: 'Emergency Housekeeping Siren & Vibration Alert', hotelflexi: 'Yes (Patented Alert)', stayflexi: 'No', cloudbeds: 'No', axisrooms: 'No', ezee: 'No' },
  { feature: 'Contactless Guest Portal (FlexiLink) with ID Upload', hotelflexi: 'Included Free', stayflexi: 'Yes (Magic Link)', cloudbeds: 'Add-on ($)', axisrooms: 'No', ezee: 'Add-on ($)' },
  { feature: 'Bilingual AI Agent (Hindi & English Voice)', hotelflexi: 'Yes (Autonomous PMS)', stayflexi: 'English Only', cloudbeds: 'No', axisrooms: 'No', ezee: 'No' },
  { feature: 'Indian GST (12%/18% SAC 9963) Compliant Invoicing', hotelflexi: 'Native Integer-Paise', stayflexi: 'Partial', cloudbeds: 'Requires Plugin', axisrooms: 'Partial', ezee: 'Native' },
  { feature: 'Entry Pricing for Indian Independent Hotels', hotelflexi: '₹499 / month', stayflexi: '$49+ (~₹4,100/mo)', cloudbeds: '$140+ (~₹11,500/mo)', axisrooms: '₹2,500+ / mo', ezee: '₹2,200+ / mo' },
];

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
const STATS = [
  { val: '500+', label: 'Hotels Live on Platform', icon: <Building className="w-5 h-5" /> },
  { val: '₹0', label: 'Commission on Direct Bookings', icon: <Receipt className="w-5 h-5" /> },
  { val: '6+', label: 'OTA Portals Synced', icon: <Globe className="w-5 h-5" /> },
  { val: '< 1s', label: 'OTA Sync Latency', icon: <Zap className="w-5 h-5" /> },
];

/* ═══════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════ */
export default function HomePage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pms');
  const heroHeadRef = useRef<HTMLHeadingElement>(null);

  // Word reveal on hero headline
  useWordReveal(heroHeadRef as React.RefObject<HTMLElement | null>);

  // Intersection observer for scroll reveals
  useRevealObserver();

  const tabContent = TAB_CONTENT[activeTab];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollProgress />
      <Navbar />

      {/* ═══════════════════════════
          1. HERO SECTION
      ═══════════════════════════ */}
      <section className="relative pt-6 sm:pt-10 pb-0 overflow-hidden bg-white border-b border-slate-100">
        {/* subtle radial gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.09) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Live badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 mb-8 hf-float">
            <span className="hf-live-dot" />
            India&apos;s Cloud Hospitality Operating System
          </div>

          {/* Headline — word reveal */}
          <h1
            ref={heroHeadRef}
            className="text-4xl sm:text-6xl lg:text-[4.5rem] font-black text-slate-900 tracking-tight leading-[1.1] max-w-5xl mx-auto"
          >
            Run Your Entire Hotel from One Intelligent Cloud.
          </h1>

          {/* Serif italic accent line */}
          <p className="mt-5 hf-serif-accent text-2xl sm:text-3xl text-blue-600 hf-fade-slide">
            Zero Commission. Real-Time OTA Sync. Built for India.
          </p>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed hf-fade-slide hf-delay-150">
            Replace 6 fragmented softwares with HotelFlexi — 2-way OTA Channel Manager (MakeMyTrip, Agoda, Booking.com), Zero-Commission Direct Engine, Contactless FlexiLink Check-In, and Hardware Siren Alerts on staff phones.
          </p>

          {/* CTA buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 hf-fade-slide hf-delay-300">
            <Link
              href="/signup"
              className="hf-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg transition"
            >
              <span>Try for Free</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-800 font-semibold text-sm border border-slate-200 hover:bg-slate-50 shadow-sm transition"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Schedule Live Demo</span>
            </button>
            <Link
              href="/download-app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Android App</span>
            </Link>
          </div>

          {/* Trust row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 text-xs font-semibold text-slate-500 hf-fade-slide hf-delay-400">
            {[
              '0% Commission on Direct Bookings',
              '12% & 18% Indian GST Ready',
              'MakeMyTrip · Agoda · Booking.com',
              'Hardware Siren on Staff Phones',
              'No Credit Card Required',
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {t}
              </span>
            ))}
          </div>

          {/* ── Browser window mockup with tab switcher ── */}
          <div className="mt-16 hf-scale-in hf-delay-400 max-w-5xl mx-auto pb-0">
            {/* Tab switcher pill bar */}
            <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit mx-auto mb-6 flex-wrap">
              {HERO_TABS.map((t) => (
                <button
                  key={t.id}
                  className={`hf-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Browser window */}
            <div className="hf-browser-window rounded-2xl border border-slate-200 overflow-hidden bg-white">
              {/* Chrome bar */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <span className="hf-win-dot red" />
                  <span className="hf-win-dot yellow" />
                  <span className="hf-win-dot green" />
                </div>
                <div className="flex-1 bg-white rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-400 font-mono text-left">
                  hotelflexi.com/dashboard
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  ● Live
                </span>
              </div>

              {/* Window content — tab panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[260px]">
                {/* Left: description */}
                <div className="lg:col-span-1 p-6 border-r border-slate-100 flex flex-col justify-between text-left">
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2">
                      Module Preview
                    </p>
                    <h3 className="text-base font-black text-slate-900 leading-snug mb-3">
                      {tabContent.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {tabContent.desc}
                    </p>
                  </div>
                  <Link
                    href="/signup"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Get started free <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Right: metric cards */}
                <div className="lg:col-span-2 p-6 grid grid-cols-3 gap-4 bg-slate-50/50 content-center">
                  {tabContent.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                    >
                      <span className={`text-2xl sm:text-3xl font-black ${m.color}`}>{m.val}</span>
                      <span className="mt-1 text-[10px] text-slate-500 text-center font-semibold">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          2. MARQUEE TICKER
      ═══════════════════════════ */}
      <div className="py-5 border-y border-slate-100 overflow-hidden bg-slate-50/60">
        <div className="hf-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 whitespace-nowrap mx-8"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════
          3. STATS STRIP
      ═══════════════════════════ */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`text-center hf-reveal hf-delay-${i === 0 ? '100' : i === 1 ? '200' : i === 2 ? '300' : '400'}`}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 mb-3">
                {s.icon}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900">{s.val}</div>
              <div className="mt-1 text-xs text-slate-500 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════
          4. BENTO FEATURES GRID
      ═══════════════════════════ */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16 hf-reveal">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 mb-4">
              <span className="hf-live-dot" />
              Complete Platform Suite
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Everything Your Hotel Needs.{' '}
              <span className="hf-serif-accent text-blue-600">Nothing It Doesn&apos;t.</span>
            </h2>
            <p className="mt-4 text-base text-slate-600">
              From boutique homestays to heritage wedding palaces — HotelFlexi adapts to your operational scale.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENTO_FEATURES.map((f, i) => (
              <div
                key={f.num}
                className={`hf-bento-card hf-fade-slide hf-delay-${[100, 200, 300, 400, 100, 200, 300, 400][i]} p-6 rounded-2xl bg-white border border-slate-200 flex flex-col gap-4 cursor-default`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${f.bg} ${f.color}`}>
                    {f.icon}
                  </div>
                  <span className={`font-mono text-xs font-black ${f.color} opacity-60`}>{f.num}</span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 leading-snug mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
                <span className="mt-auto inline-block text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 w-fit">
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          5. TAILORED FOR VERTICALS
      ═══════════════════════════ */}
      <section className="py-24 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 hf-reveal">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 mb-4">
              <span className="hf-live-dot" />
              Tailored For Every Hospitality Business
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Built Specifically for the Realities of{' '}
              <span className="hf-serif-accent text-blue-600">Indian Hotels</span>
            </h2>
            <p className="mt-4 text-base text-slate-600">
              From Goa beach resorts to heritage wedding palaces in Rajasthan, HotelFlexi adapts to your scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Building className="w-6 h-6" />,
                color: 'text-blue-600', bg: 'bg-blue-100',
                title: 'Boutique & City Hotels',
                desc: 'Streamline front desk walk-ins, scan government IDs in 15 seconds, and eliminate OTA commission bleed with your custom direct booking engine.',
                checks: ['Instant walk-in registration', 'Indian GST 12%/18% invoices', '2-Way MakeMyTrip & Agoda sync'],
              },
              {
                icon: <Globe className="w-6 h-6" />,
                color: 'text-purple-600', bg: 'bg-purple-100',
                title: 'Holiday & Leisure Resorts',
                desc: 'Empower guests to order food from their cottage via FlexiLinks with instant room charge posting. 7-minute housekeeping SLA.',
                checks: ['In-stay dining & cottage ordering', '7-minute housekeeping siren', 'Poolside & restaurant POS'],
              },
              {
                icon: <HeartHandshake className="w-6 h-6" />,
                color: 'text-amber-600', bg: 'bg-amber-100',
                title: 'Weddings & Banquets',
                desc: 'Block 20–50 rooms in bulk for wedding parties. Decoration packages, catering by day, and instant PDF quotation builder.',
                checks: ['Bulk room group blocking', 'Decoration & banquet tiers', 'Branded PDF quotations'],
              },
              {
                icon: <Smartphone className="w-6 h-6" />,
                color: 'text-emerald-600', bg: 'bg-emerald-100',
                title: 'Homestays & Villas',
                desc: 'Operate entirely from your phone. Sync with Airbnb and Booking.com, collect direct UPI payments, and let guests self-check-in.',
                checks: ['100% mobile app management', 'Zero hardware or PC needed', '14-Day full free trial'],
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`hf-bento-card hf-fade-slide hf-delay-${[100, 200, 300, 400][i]} p-6 rounded-2xl bg-white border border-slate-200 space-y-4`}
              >
                <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                  {card.icon}
                </div>
                <h3 className="text-base font-black text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                  {card.checks.map((c) => (
                    <li key={c} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          6. PILLARS — DEEP DIVE
      ═══════════════════════════ */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">

          {/* Pillar 1: Channel Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center hf-reveal">
            <div className="space-y-5">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-widest">PILLAR 01 · DISTRIBUTION</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                2-Way OTA Sync Across{' '}
                <span className="hf-serif-accent text-blue-600">100+ Portals</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect your live inventory to MakeMyTrip, Goibibo, Booking.com, Agoda, Airbnb, and Expedia. When a room is booked anywhere, all OTAs are updated in under a second.
              </p>
              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                {[
                  'Sub-second 2-way Availability, Rates & Inventory (ARI) push',
                  'Channel-specific rate markups (+15% OTA price multiplier)',
                  'Scheduled daily reconciliation to audit rate parity',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <Link href="/channel-manager" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                Explore Channel Manager <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-3 hf-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-900">
                <span>Active OTA Rate Multiplier</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">All Synced ✓</span>
              </div>
              {[
                { name: 'Direct Booking Engine', sub: 'Your Official Website', price: '₹3,500', badge: '0% Commission', badgeColor: 'text-emerald-600' },
                { name: 'MakeMyTrip / Goibibo', sub: '+15% Markup Applied', price: '₹4,025', badge: 'Covers OTA Cut', badgeColor: 'text-slate-500' },
                { name: 'Booking.com', sub: '+18% Markup Applied', price: '₹4,130', badge: 'Covers OTA Cut', badgeColor: 'text-slate-500' },
              ].map((row) => (
                <div key={row.name} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-900">{row.name}</strong>
                    <div className="text-[10px] text-slate-500">{row.sub}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900">{row.price}</span>
                    <span className={`block text-[9px] font-bold ${row.badgeColor}`}>{row.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 2: Direct Booking Engine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center hf-reveal">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-3 order-2 lg:order-1 hf-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-900">
                <span>Direct Razorpay Payment Policy</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">Direct Bank Settlement</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Advance Deposit Option:</span>
                  <span className="font-bold text-blue-400">20% Partial Advance</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Guest pays 20% advance via UPI/Card; balance 80% collected at front desk upon check-in.
                </p>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                  <span>Payment Gateway:</span>
                  <span className="font-mono text-emerald-400">Hotelier Direct Key ID</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 order-1 lg:order-2">
              <span className="text-[11px] font-black uppercase text-indigo-600 tracking-widest">PILLAR 02 · DIRECT REVENUE</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Zero-Commission Booking Engine with{' '}
                <span className="hf-serif-accent text-indigo-600">Custom Advance Rules</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Publish your custom booking portal at <code className="text-blue-600 bg-blue-50 px-1 rounded text-[11px]">/book/[slug]</code> with your photos, amenities, and direct Razorpay checkout.
              </p>
              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                {[
                  'Flexible advance rules: 100% Full, Partial %, Fixed, or Pay at Hotel',
                  'Automatic guest confirmation emails with encrypted FlexiLink check-in links',
                  'Guests upload Aadhaar/Passport before arrival to eliminate lobby queues',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <Link href="/booking-engine" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                Explore Direct Booking Engine <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillar 3: Housekeeping Siren */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center hf-reveal">
            <div className="space-y-5">
              <span className="text-[11px] font-black uppercase text-red-600 tracking-widest">PILLAR 03 · STAFF SPEED</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Patented Housekeeping Urgency{' '}
                <span className="hf-serif-accent text-red-600">Siren on Staff Phones</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Guest complaints dispatched as a high-priority audible siren and continuous hardware vibration directly to floor staff smartphones. No more lost WhatsApp messages.
              </p>
              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                {[
                  'Dual-tone European siren (880Hz / 660Hz) cuts through noisy resort environments',
                  'Continuous vibration pulse loops until staff taps "Pick & Silence Siren"',
                  'Admin dashboard monitors: "Taken by Suresh (Housekeeping)"',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <Link href="/hotel-management" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                See Housekeeping Operations <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl space-y-4 hf-scale-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black text-2xl animate-bounce shrink-0">
                  🚨
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded">
                    7-Minute SLA Timer
                  </span>
                  <h3 className="font-extrabold text-base mt-1">Room 302: Emergency Linen Sanitation</h3>
                </div>
              </div>
              <p className="text-xs text-red-100">
                Dispatched by Guest via FlexiLink. Audible siren sounding on 4 active staff devices across Floor 3.
              </p>
              <div className="p-3 bg-red-700/80 rounded-xl flex items-center justify-between text-xs font-bold">
                <span>Staff Pickup Status:</span>
                <span className="bg-white text-red-700 px-3 py-1 rounded-xl">Taken by Ramesh (Housekeeping)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          7. COMPARISON TABLE
      ═══════════════════════════ */}
      <section className="py-24 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 hf-reveal">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 mb-4">
              <span className="hf-live-dot" />
              Competitive Benchmark
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Why Indian Hoteliers Switch to{' '}
              <span className="hf-serif-accent text-blue-600">HotelFlexi</span>
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Compare against legacy desktop software and expensive overseas platforms.
            </p>
          </div>

          <div className="overflow-x-auto hf-scale-in">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Feature / Capability</th>
                  <th className="p-4 bg-blue-600 text-white">HotelFlexi (NovaX AI)</th>
                  <th className="p-4">StayFlexi</th>
                  <th className="p-4">Cloudbeds</th>
                  <th className="p-4">AxisRooms</th>
                  <th className="p-4">eZee / Yanolja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="p-4 font-bold text-slate-900">{row.feature}</td>
                    <td className="p-4 font-black text-blue-600 bg-blue-50/50">{row.hotelflexi}</td>
                    <td className="p-4 text-slate-600">{row.stayflexi}</td>
                    <td className="p-4 text-slate-600">{row.cloudbeds}</td>
                    <td className="p-4 text-slate-600">{row.axisrooms}</td>
                    <td className="p-4 text-slate-600">{row.ezee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link href="/compare" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
              View In-Depth Competitor Comparison <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          8. PRICING PLANS
      ═══════════════════════════ */}
      <section className="py-24 bg-white border-b border-slate-100" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 hf-reveal">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 mb-4">
              <span className="hf-live-dot" />
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Simple Plans for{' '}
              <span className="hf-serif-accent text-blue-600">Indian Hoteliers</span>
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Zero setup fees. Zero commission on direct bookings. 14-day free trial on all plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto hf-fade-slide">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-2xl p-7 flex flex-col justify-between border transition ${
                  p.highlighted
                    ? 'bg-slate-950 text-white border-blue-600 shadow-2xl scale-[1.02]'
                    : 'bg-white text-slate-900 border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                    {p.badge}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-lg">{p.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black">{p.price}</span>
                    <span className={`text-xs ${p.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>{p.interval}</span>
                  </div>
                  <p className={`mt-2 text-xs leading-relaxed ${p.highlighted ? 'text-slate-300' : 'text-slate-600'}`}>
                    {p.desc}
                  </p>
                  <div className="mt-6 pt-6 border-t border-slate-200/20 space-y-2.5 text-xs">
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className={p.highlighted ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-8">
                  <Link
                    href="/signup"
                    className={`block w-full py-3 rounded-xl font-bold text-xs text-center transition shadow ${
                      p.highlighted
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {p.ctaText}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* White-glove add-on callout */}
          <div className="mt-12 max-w-4xl mx-auto p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4 hf-reveal">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Optional White-Glove Service</span>
              <h4 className="text-base font-extrabold text-slate-900">
                Need Help Setting Up Your Hotel or Getting Listed on OTAs?
              </h4>
              <p className="text-xs text-slate-600">
                Basic PMS setup for <strong>₹499</strong> · Complete OTA Listing on Expedia, Booking.com, MakeMyTrip & Goibibo with full 2-way HotelFlexi sync for <strong>₹4,999</strong> one-time.
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shrink-0 shadow whitespace-nowrap"
            >
              View Setup Packages →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          9. FAQ
      ═══════════════════════════ */}
      <section className="py-24 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center hf-reveal">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 mb-4">
              <span className="hf-live-dot" />
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`hf-fade-slide hf-delay-${[100, 200, 300, 100, 200, 300][idx]} p-5 rounded-2xl bg-white border border-slate-200 space-y-2`}>
                <h3 className="font-bold text-sm text-slate-900 flex items-start gap-2">
                  <span className="text-blue-600 font-mono shrink-0">Q.</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-600 pl-5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          10. FINAL CTA BANNER
      ═══════════════════════════ */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        {/* subtle radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(37,99,235,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7 relative z-10 hf-reveal">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            <span className="hf-live-dot" style={{ background: '#60a5fa' }} />
            Instant Activation
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            Ready to Automate Your Hotel and{' '}
            <span className="hf-serif-accent text-blue-400">Stop Overpaying OTAs?</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking hotels across India. Try for free or book a live 1-on-1 walkthrough.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="hf-btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl transition"
            >
              Try for Free →
            </Link>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition"
            >
              Book a Live Demo
            </button>
            <Link
              href="/download-app"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-sm border border-emerald-500/30 transition flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Download Android App
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <BookDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
}
