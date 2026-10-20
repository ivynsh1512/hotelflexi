import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Bell,
  Building,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi Competitor Comparisons — StayFlexi, Yojna Cloud, eZee & Djubo',
  description:
    'Compare HotelFlexi with StayFlexi, Yojna Cloud Solution, eZee Absolute, and Djubo. Discover why Indian hoteliers choose HotelFlexi for ₹499/mo with autonomous AI, live channel manager, and housekeeping urgency siren.',
  keywords: [
    'hotelflexi vs stayflexi',
    'hotelflexi vs yojna cloud solution',
    'hotelflexi vs ezee absolute',
    'hotelflexi vs djubo',
    'best hotel pms india comparison',
    'affordable hotel channel manager india',
    'hotel software alternative india',
  ],
  openGraph: {
    title: 'HotelFlexi Competitor Comparisons — Modern Indian Hotel PMS & Channel Manager',
    description:
      'Compare features, pricing, autonomous AI, and 2-way OTA synchronization between HotelFlexi and other hotel management systems.',
    url: 'https://hotelflexi.com/compare',
  },
};

export default function CompareHubPage() {
  const comparisons = [
    {
      slug: 'stayflexi',
      competitor: 'StayFlexi',
      tagline: 'Modern Autonomous AI vs Expensive USD Pricing',
      summary:
        'StayFlexi charges high monthly USD rates ($30–$100+/mo) with expensive room-tier add-ons. HotelFlexi delivers a transparent ₹499/mo Indian INR plan with built-in channel manager, Indian GST compliance, and autonomous AI front desk.',
      keyAdvantages: [
        '₹499/mo INR pricing vs steep USD subscription fees',
        '2-Way live IngoMMT / Goibibo / Agoda sync included in Starter plan',
        'Built-in Housekeeping Urgency Siren alert system',
        '100% SAC 9963 Indian GST tax invoice automation',
      ],
      badge: 'Most Popular Alternative',
    },
    {
      slug: 'yojna-cloud',
      competitor: 'Yojna Cloud Solution (YCS PMS)',
      tagline: 'Modern Cloud PWA & Urgency Siren vs Legacy AMC Setup',
      summary:
        'Yojna Cloud Solution and traditional Indian desktop software lock hoteliers into expensive annual maintenance contracts (AMC), complex training, and clunky interfaces. HotelFlexi offers a zero-install mobile PWA with instant setup.',
      keyAdvantages: [
        'Zero Annual Maintenance Contracts (AMC) or hidden hardware lock-ins',
        'Installable Progressive Web App (PWA) with Google Play Store support',
        'Urgency siren alarm on staff mobile devices for quick guest resolution',
        'Autonomous AI business concierge that handles reservations 24/7',
      ],
      badge: 'Best Legacy Upgrade',
    },
    {
      slug: 'ezee-absolute',
      competitor: 'eZee Absolute (Yanolja Cloud)',
      tagline: 'Intuitive Zero-Training PMS vs Steep Learning Curve',
      summary:
        'eZee Absolute requires extensive staff training, complex menu structures, and fragmented add-on billing for channel distribution. HotelFlexi is designed for instant 5-minute onboarding with direct FlexiLink self check-ins.',
      keyAdvantages: [
        '5-minute self-onboarding without days of staff training',
        'FlexiLink digital guest self check-in via WhatsApp & Email',
        'Integrated single source of truth for rates, blocks & inventory',
        'Transparent ₹499/mo plan with no booking commissions',
      ],
      badge: 'Easiest to Use',
    },
    {
      slug: 'djubo',
      competitor: 'Djubo',
      tagline: 'Unified All-in-One Suite vs Fragmented Add-on Fees',
      summary:
        'Djubo separates channel management, booking engine, and front desk operations into distinct paid modules with transaction cut. HotelFlexi combines PMS, Channel Manager, and Direct Booking Engine under one single dashboard.',
      keyAdvantages: [
        'All-in-one unified architecture without separate module invoices',
        'Direct UPI & Razorpay payments without transaction commissions',
        'Autonomous AI agent capable of answering booking queries in Hindi & English',
        'Real-time oversell prevention across all connected OTAs',
      ],
      badge: 'Best Value Suite',
    },
  ];

  const featureMatrix = [
    { feature: 'Starting Monthly Price (INR)', hotelflexi: '₹499 / month flat', others: '₹3,000 – ₹10,000 / mo or $50+' },
    { feature: 'Channel Manager Included in Starter', hotelflexi: 'Yes (2 Live OTAs)', others: 'Extra Paid Add-on or Manual' },
    { feature: 'FlexiLink Contactless Guest Portal', hotelflexi: 'Yes (Self Check-in, Govt ID & Child proof, In-Stay Food Orders, 7-Day Auto-Purge)', others: 'Paper forms or Expensive 3rd-party app' },
    { feature: 'Dine-Out Table Bookings (Public Link for Non-Guests)', hotelflexi: 'Yes (5-Digit Code / Public URL, 100% Pure Veg Badge, In-App or Counter Pay)', others: 'No (In-house only, loses outside restaurant revenue)' },
    { feature: 'Autonomous AI Concierge & Front Desk', hotelflexi: 'Yes (Bilingual Voice & Text 24/7)', others: 'No or Limited Chatbot' },
    { feature: 'Housekeeping Urgency Siren System', hotelflexi: 'Yes (Instant Audio-Visual Siren Alert on all staff devices)', others: 'No (Manual register / phone calls only)' },
    { feature: 'Real-Time FCM Push Notifications', hotelflexi: 'Yes (Instant booking & staff dispatch alerts)', others: 'Delayed SMS / Email only' },
    { feature: 'Native Android App & Installable PWA', hotelflexi: 'Yes (Google Play Store + Offline PWA)', others: 'Desktop browser only or slow wrappers' },
    { feature: 'Direct Booking Engine Commission', hotelflexi: '0% Commission Included', others: '2% - 5% Commission or Paid Engine' },
    { feature: 'Indian GST 12% & 18% Compliance (SAC 9963)', hotelflexi: 'Automated Tiered Folios', others: 'Manual Tally Export' },
    { feature: 'Setup & Onboarding Time', hotelflexi: '5 Minutes', others: '1 – 3 Weeks with Paid Training' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why should I choose HotelFlexi over StayFlexi or Yojna Cloud?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HotelFlexi is purpose-built for Indian hospitality operators with a transparent ₹499/mo starter plan that includes a 2-way OTA channel manager, autonomous AI assistant, Indian GST compliance, and an urgency siren alert system for housekeeping that resolves guest grievances in under 7 minutes.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does HotelFlexi charge commission on direct bookings?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. HotelFlexi charges 0% commission on direct bookings made through your hotel booking engine or FlexiLink guest portal.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>

      {/* Hero Header */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-70"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Objective Hospitality Software Comparison
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Compare HotelFlexi Against Other Hotel Management Platforms
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover why boutique hotels, homestays, and resorts across India are leaving clunky legacy PMSs and expensive USD software for HotelFlexi’s autonomous AI platform starting at just ₹499/mo.
          </p>
        </div>
      </section>

      {/* Competitor Cards Grid */}
      <section className="py-16 bg-surface-light border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-content-primary-light tracking-tight">
              Detailed Platform Comparisons
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary-light mt-2">
              Select a competitor below for an in-depth breakdown of features, architecture, pricing, and migration guides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {comparisons.map((c) => (
              <div
                key={c.slug}
                className="bg-white rounded-3xl border border-border-light shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg hover:border-brand-blue/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-brand-blue border border-blue-200">
                      {c.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Head-to-Head</span>
                  </div>

                  <h3 className="text-xl font-black text-content-primary-light">
                    HotelFlexi <span className="text-slate-400 font-normal">vs</span> {c.competitor}
                  </h3>
                  <p className="text-xs font-bold text-brand-blue mt-1">{c.tagline}</p>
                  <p className="text-xs text-content-secondary-light mt-3 leading-relaxed">
                    {c.summary}
                  </p>

                  <div className="mt-5 space-y-2 pt-4 border-t border-border-light">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 block">
                      Why Hoteliers Choose HotelFlexi:
                    </span>
                    {c.keyAdvantages.map((adv, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border-light">
                  <Link
                    href={`/compare/${c.slug}`}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm"
                  >
                    <span>Read Full HotelFlexi vs {c.competitor} Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive Feature Comparison Matrix */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Feature Breakdown</span>
            <h2 className="text-2xl sm:text-4xl font-black text-content-primary-light tracking-tight mt-1">
              HotelFlexi vs Typical Indian Hotel PMS
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary-light mt-2">
              See how HotelFlexi compares on modern hospitality automation, pricing transparency, and guest satisfaction.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-4 px-6 text-sm">Capability / Feature</th>
                    <th className="py-4 px-6 text-sm bg-blue-600 font-black">HotelFlexi</th>
                    <th className="py-4 px-6 text-sm text-slate-300">Typical Alternatives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {featureMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-content-primary-light">{row.feature}</td>
                      <td className="py-4 px-6 font-extrabold text-brand-blue bg-blue-50/40">{row.hotelflexi}</td>
                      <td className="py-4 px-6 text-content-secondary-light">{row.others}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Upgrade Your Hotel to Autonomous AI?
          </h2>
          <p className="text-sm sm:text-base text-blue-200 max-w-xl mx-auto leading-relaxed">
            Join hoteliers who have cut operational overhead, automated 2-way OTA distribution, and solved housekeeping issues with real-time sirens.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-white text-brand-blue font-black text-sm hover:bg-blue-50 transition shadow-lg"
            >
              Start 14-Day Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-sm border border-blue-400/30 transition"
            >
              View All ₹499/mo Plans
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
