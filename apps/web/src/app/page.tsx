import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Calendar,
  Sparkles,
  Receipt,
  Globe,
  BedDouble,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowRight,
  Layers,
  HelpCircle,
} from 'lucide-react';

export default function HomePage() {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '₹499',
      interval: '/month',
      desc: 'Ideal for homestays, guesthouses & boutique stays.',
      features: ['Up to 10 Rooms', '1 Property', 'Room Calendar & PMS', 'Direct Booking Engine', 'Basic AI Assistant', 'GST Invoicing'],
      highlighted: false,
    },
    {
      id: 'essential',
      name: 'Essential',
      price: '₹999',
      interval: '/month',
      desc: 'Perfect for growing budget hotels & serviced apartments.',
      features: ['Up to 25 Rooms', '1 Property', 'PMS & Fast Check-in', 'Direct Booking Engine', '2 OTA Channel Connections', 'Housekeeping & Maintenance', 'Bilingual AI Agent'],
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '₹2,499',
      interval: '/month',
      desc: 'Designed for busy mid-scale resorts & boutique hotels.',
      features: ['Up to 60 Rooms', '2 Properties', 'Advanced Room Grid', '5 OTA Channel Connections', 'Financial Reports & P&L', '500 AI Monthly Prompts', 'Priority Support'],
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹4,999',
      interval: '/month',
      desc: 'Full-power operations for hotel groups & large properties.',
      features: ['Up to 150 Rooms', '5 Properties', 'Unlimited Channel Connections', 'Multi-property Switcher', 'Full Accounting Ledger', '2,000 AI Monthly Prompts', 'Dedicated Account Manager'],
      highlighted: false,
    },
  ];

  const faqs = [
    {
      q: 'What is HotelFlexi?',
      a: 'HotelFlexi by NovaX AI is an all-in-one hospitality SaaS platform that integrates a Property Management System (PMS), Channel Manager framework, Direct Booking Engine, Indian GST Billing, Housekeeping operations, and an AI Business Assistant into a single dashboard.',
    },
    {
      q: 'Can I operate HotelFlexi in Hindi or Hinglish?',
      a: 'Yes! HotelFlexi includes a built-in AI Business Agent designed specifically for Indian hoteliers. You can speak or type commands like "Kal ke arrivals dikhao", "3 October ko Room 101 block kar do", or "Aaj kitni payment collect hui?".',
    },
    {
      q: 'How does Indian GST billing work?',
      a: 'HotelFlexi supports standard hotel GST tiers (12% for room tariffs up to ₹7,500/night and 18% for tariffs above ₹7,500/night). Invoices record CGST, SGST, and IGST breakdowns in integer paise without rounding errors.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes. Every new property registration starts with an immediate 14-day full feature trial without requiring a credit card up front.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-border-light bg-gradient-to-b from-surface-light via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-blue-surface text-brand-blue border border-blue-200 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Indian Hospitality
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-content-primary-light tracking-tight max-w-4xl mx-auto leading-tight">
            Your Hotel. <br className="hidden sm:inline" />
            <span className="text-brand-blue">One Intelligent System.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-content-secondary-light max-w-2xl mx-auto leading-relaxed">
            Eliminate fragmented software. HotelFlexi unifies your PMS calendar, OTA channel distribution,
            direct booking engine, GST accounting, and a bilingual AI assistant into one intuitive platform.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-lg bg-brand-blue text-white hover:bg-brand-blue-hover shadow-md transition"
            >
              Start 14-Day Free Trial
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/hotel-management"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-medium rounded-lg border border-border-light text-content-primary-light hover:bg-surface-light transition"
            >
              Explore PMS Features
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-content-secondary-light">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span>Built for INR & Indian GST</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span>Cloudflare D1 & Worker Speed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span>Hindi & Hinglish AI Commands</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span>No Credit Card Required for Trial</span>
            </div>
          </div>

          {/* 2. PRODUCT DASHBOARD PREVIEW */}
          <div className="mt-14 max-w-5xl mx-auto rounded-xl border border-border-light bg-surface-dark-bg p-2 shadow-2xl overflow-hidden">
            <div className="rounded-lg bg-surface-dark-surface p-6 text-left">
              {/* Window Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border-dark mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-content-secondary-dark font-mono ml-2">hotelflexi.app • The Grand Heritage Palace</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live PMS
                </span>
              </div>

              {/* Sample Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-surface-dark-elevated border border-border-dark">
                  <span className="text-xs text-content-secondary-dark">Occupancy Today</span>
                  <div className="text-2xl font-bold text-white mt-1">84%</div>
                  <span className="text-[11px] text-emerald-400 font-medium">18 of 22 Rooms Occupied</span>
                </div>
                <div className="p-4 rounded-lg bg-surface-dark-elevated border border-border-dark">
                  <span className="text-xs text-content-secondary-dark">Today's Collections</span>
                  <div className="text-2xl font-bold text-white mt-1">₹42,800</div>
                  <span className="text-[11px] text-content-secondary-dark">6 Payments Captured</span>
                </div>
                <div className="p-4 rounded-lg bg-surface-dark-elevated border border-border-dark">
                  <span className="text-xs text-content-secondary-dark">Expected Arrivals</span>
                  <div className="text-2xl font-bold text-white mt-1">5 Guests</div>
                  <span className="text-[11px] text-blue-400">3 Checked-in</span>
                </div>
                <div className="p-4 rounded-lg bg-surface-dark-elevated border border-border-dark">
                  <span className="text-xs text-content-secondary-dark">Housekeeping</span>
                  <div className="text-2xl font-bold text-white mt-1">2 Dirty</div>
                  <span className="text-[11px] text-amber-400">Tasks in progress</span>
                </div>
              </div>

              {/* Sample Calendar Strip */}
              <div className="p-4 rounded-lg bg-surface-dark-elevated border border-border-dark">
                <div className="flex items-center justify-between mb-3 text-xs text-content-secondary-dark">
                  <span className="font-semibold text-white">Live Room Grid Snapshot</span>
                  <span>October 2026</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
                  {['101 DLX', '102 DLX', '103 DLX', '104 DLX', '201 STE', '202 STE', '203 STE', '204 STE'].map((room, idx) => (
                    <div
                      key={room}
                      className={`p-2.5 rounded border text-[11px] font-mono ${
                        idx === 2
                          ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                          : idx === 6
                          ? 'bg-blue-950/40 border-blue-600/40 text-blue-300'
                          : 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                      }`}
                    >
                      <div className="font-bold">{room}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {idx === 2 ? 'Maintenance' : idx === 6 ? 'Dirty' : 'Occupied'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI AGENT DEMONSTRATION SECTION */}
      <section className="py-20 bg-surface-light border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Intelligent Automation</span>
            <h2 className="text-3xl font-extrabold text-content-primary-light mt-2">
              Operate Your Hotel via Natural Language
            </h2>
            <p className="mt-3 text-content-secondary-light text-base">
              Non-technical hotel staff can execute operations without complicated menus. Speak or type in English, Hindi, or Hinglish.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white border border-border-light shadow-sm">
              <div className="text-xs font-bold uppercase text-brand-blue mb-2">Hinglish / Hindi Command</div>
              <div className="p-3 rounded-lg bg-surface-light font-mono text-sm text-content-primary-light border border-border-light">
                "Kal ke arrivals dikhao."
              </div>
              <div className="mt-4 text-sm text-content-secondary-light">
                Instantly queries D1 database for tomorrow's check-ins, returning guest names, room assignments, and balance amounts.
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-border-light shadow-sm">
              <div className="text-xs font-bold uppercase text-brand-blue mb-2">Room Blocking with Validation</div>
              <div className="p-3 rounded-lg bg-surface-light font-mono text-sm text-content-primary-light border border-border-light">
                "3 October ko Room 101 block kar do."
              </div>
              <div className="mt-4 text-sm text-content-secondary-light">
                Verifies that no active bookings exist on Room 101, blocks the dates for maintenance, and updates the occupancy calendar.
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-border-light shadow-sm">
              <div className="text-xs font-bold uppercase text-brand-blue mb-2">Instant Financial Insights</div>
              <div className="p-3 rounded-lg bg-surface-light font-mono text-sm text-content-primary-light border border-border-light">
                "Aaj kitni payment collect hui?"
              </div>
              <div className="mt-4 text-sm text-content-secondary-light">
                Sums all UPI, cash, card, and Razorpay transactions recorded today and states outstanding guest balances.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES GRID */}
      <section className="py-20 bg-white border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Complete Hospitality Stack</span>
            <h2 className="text-3xl font-extrabold text-content-primary-light mt-2">
              Everything Your Hotel Needs in One Solution
            </h2>
            <p className="mt-3 text-content-secondary-light text-base">
              Engineered with Cloudflare Workers and D1 database for sub-100ms response times and total reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border-light hover:border-brand-blue transition group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-content-primary-light">Property Management System</h3>
              <p className="mt-2 text-sm text-content-secondary-light leading-relaxed">
                Visual room calendar grid with day, week, and month views. Fast walk-in booking, guest check-in/out, and room block safeguards.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border-light hover:border-brand-blue transition group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-content-primary-light">Direct Booking Engine</h3>
              <p className="mt-2 text-sm text-content-secondary-light leading-relaxed">
                Commission-free guest booking engine with live room availability, tax calculations, Razorpay payment processing, and instant confirmations.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border-light hover:border-brand-blue transition group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-content-primary-light">OTA Channel Manager</h3>
              <p className="mt-2 text-sm text-content-secondary-light leading-relaxed">
                Multi-channel synchronization framework for Booking.com, Agoda, MakeMyTrip, and Airbnb. Prevents double-bookings with automated inventory reconciliation.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border-light hover:border-brand-blue transition group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-content-primary-light">Indian GST Billing & Invoicing</h3>
              <p className="mt-2 text-sm text-content-secondary-light leading-relaxed">
                Tax-compliant invoices with CGST/SGST breakdowns, invoice snapshots in integer paise, payment tracking (UPI, cash, card), and printable folios.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border-light hover:border-brand-blue transition group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                <BedDouble className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-content-primary-light">Housekeeping & Maintenance</h3>
              <p className="mt-2 text-sm text-content-secondary-light leading-relaxed">
                Automatic dirty status triggers upon guest check-out, housekeeping task scheduling, room cleanliness inspection, and maintenance ticketing.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border-light hover:border-brand-blue transition group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-content-primary-light">Role-Based Team Permissions</h3>
              <p className="mt-2 text-sm text-content-secondary-light leading-relaxed">
                Enforced server-side permission matrix for Owner, Manager, Receptionist, Accountant, and Housekeeping roles with complete audit logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING PLANS */}
      <section className="py-20 bg-surface-light border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Transparent Pricing</span>
            <h2 className="text-3xl font-extrabold text-content-primary-light mt-2">
              Predictable Plans for Every Property Size
            </h2>
            <p className="mt-3 text-content-secondary-light text-base">
              All plans include complete PMS access and a 14-day free trial. Prices in Indian Rupees (INR).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`p-6 rounded-xl bg-white border flex flex-col justify-between ${
                  p.highlighted ? 'border-brand-blue shadow-lg ring-1 ring-brand-blue' : 'border-border-light'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-content-primary-light">{p.name}</h3>
                    {p.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-blue-surface text-brand-blue">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-secondary-light min-h-[32px]">{p.desc}</p>
                  <div className="mt-4 pb-4 border-b border-border-light flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-content-primary-light">{p.price}</span>
                    <span className="text-xs text-content-secondary-light">{p.interval}</span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-xs text-content-secondary-light">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href={`/signup?plan=${p.id}`}
                    className={`w-full block text-center py-2.5 rounded-lg text-xs font-semibold transition ${
                      p.highlighted
                        ? 'bg-brand-blue text-white hover:bg-brand-blue-hover shadow-sm'
                        : 'border border-border-light text-content-primary-light hover:bg-surface-light'
                    }`}
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-20 bg-white border-b border-border-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Got Questions?</span>
            <h2 className="text-3xl font-extrabold text-content-primary-light mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-6 rounded-xl border border-border-light bg-surface-light">
                <h3 className="text-base font-bold text-content-primary-light flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" />
                  {faq.q}
                </h3>
                <p className="mt-2 text-sm text-content-secondary-light leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <section className="py-20 bg-surface-dark-bg text-content-primary-dark text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Streamline Your Hotel Operations?
          </h2>
          <p className="mt-4 text-base text-content-secondary-dark max-w-xl mx-auto">
            Get started in under 3 minutes. Set up your rooms, configure your rates, and let the AI assistant handle your daily operations.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-lg bg-brand-blue text-white hover:bg-brand-blue-hover shadow-lg transition"
            >
              Start Your Free 14-Day Trial
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-medium rounded-lg border border-border-dark text-content-primary-dark hover:bg-surface-dark-surface transition"
            >
              Contact NovaX AI Team
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
