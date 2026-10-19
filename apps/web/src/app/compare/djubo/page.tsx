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
  DollarSign,
  Layers,
  Bell,
  Clock,
  Layers2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi vs Djubo (2026) — Complete Feature & Cost Comparison',
  description:
    'Compare HotelFlexi vs Djubo. See why Indian hotels prefer HotelFlexi’s unified ₹499/mo suite with 0% direct booking commission, autonomous AI front desk, 2-way live OTA channel manager, and housekeeping urgency siren.',
  keywords: [
    'hotelflexi vs djubo',
    'djubo alternative',
    'djubo channel manager cost',
    'best hotel channel manager india',
    'hotel pms with 0 commission',
    'djubo vs hotelflexi',
  ],
  openGraph: {
    title: 'HotelFlexi vs Djubo — Channel Manager & PMS Comparison',
    description:
      'Avoid separate modular billing and booking commissions. Switch to HotelFlexi for ₹499/mo all-in-one.',
    url: 'https://hotelflexi.novaxai.in/compare/djubo',
  },
};

export default function DjuboComparePage() {
  const comparisonData = [
    {
      feature: 'Cost Architecture',
      hotelflexi: '₹499 / month flat all-inclusive (PMS, Channel Manager, Booking Engine & AI)',
      djubo: 'Separate fees for Fireball (Channel Manager), PMS & CRS, plus transaction charges',
    },
    {
      feature: 'Direct Booking Engine Commission',
      hotelflexi: '0% commission on direct bookings via FlexiLink',
      djubo: 'Commission or per-booking payment gateway markup on engine transactions',
    },
    {
      feature: 'Autonomous AI Business Agent',
      hotelflexi: 'Built-in conversational AI assistant handling guest queries & reservations in Hindi & English 24/7',
      djubo: 'No autonomous conversational AI agent',
    },
    {
      feature: 'Housekeeping Urgency Siren',
      hotelflexi: 'Real-time audio-visual siren sounding on staff mobile devices for quick linen & leak resolution',
      djubo: 'No emergency siren alert system',
    },
    {
      feature: '2-Way Live OTA Channel Manager',
      hotelflexi: 'Real-time single source of truth for IngoMMT, Agoda, Booking.com, Airbnb & Expedia',
      djubo: 'Strong channel distribution, but locked behind expensive multi-product subscriptions',
    },
    {
      feature: 'Digital Guest Check-In (FlexiLink)',
      hotelflexi: 'Automated WhatsApp/Email link for pre-arrival verification & Aadhaar/passport ID upload',
      djubo: 'Standard web check-in requiring complex custom setup',
    },
    {
      feature: 'Payment Settlements',
      hotelflexi: 'Direct payouts into hotel’s own Razorpay or UPI bank account with zero middleman holding',
      djubo: 'Integrated payment processing often subject to aggregator hold periods',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does HotelFlexi compare to Djubo in pricing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Djubo charges separate fees for its channel manager (Fireball), PMS, and central reservation modules, often exceeding ₹4,000–₹12,000 per month. HotelFlexi includes the PMS, 2-way OTA channel manager, booking engine, and AI assistant starting at just ₹499/month flat.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does HotelFlexi prevent room overselling like Djubo does?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. HotelFlexi maintains a strict central source of truth with database concurrency checks and duplicate webhook deduplication, guaranteeing that room inventory is decremented across all OTAs instantly when a reservation occurs.',
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

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-900 to-slate-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Direct Competitor Comparison
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            HotelFlexi vs Djubo
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Why pay multiple separate invoices for PMS, Channel Manager, and CRS? Get everything under one intelligent roof for just ₹499/mo.
          </p>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-12 bg-surface-light border-b border-border-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border-2 border-brand-blue shadow-md space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-blue text-white text-[10px] font-black uppercase tracking-wider">
                All-in-One Value
              </span>
              <h3 className="text-xl font-black text-content-primary-light">HotelFlexi</h3>
              <div className="text-2xl font-black text-brand-blue">₹499 / mo flat</div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Single unified platform combining PMS, 2-way live OTA channel manager, 0% commission direct booking engine, and autonomous AI assistant.
              </p>
              <ul className="text-xs space-y-2 pt-2 text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> ₹499/mo flat all-inclusive with zero surprise fees</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 0% commission on direct bookings via FlexiLink</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Housekeeping Urgency Siren alert system for fast ticket resolution</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bilingual AI front desk agent that answers inquiries 24/7</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-border-light shadow-sm space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                Competitor
              </span>
              <h3 className="text-xl font-black text-content-primary-light">Djubo</h3>
              <div className="text-2xl font-black text-slate-700">₹4,000 – ₹12,000+ / mo</div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Modular software requiring separate purchases for Channel Manager (Fireball), PMS, and CRS, often with transaction-based cuts.
              </p>
              <ul className="text-xs space-y-2 pt-2 text-slate-600">
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Unbundled product pricing inflating monthly costs</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Booking engine commissions or payment processing fees</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> No emergency housekeeping siren alarm for urgent guest tickets</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> No autonomous conversational AI assistant</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Table */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-content-primary-light tracking-tight">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary-light mt-1">
              Compare features, commissions, and automation between HotelFlexi and Djubo.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-4 px-6 text-sm">Capability</th>
                    <th className="py-4 px-6 text-sm bg-blue-600 font-black">HotelFlexi</th>
                    <th className="py-4 px-6 text-sm text-slate-300">Djubo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-content-primary-light">{row.feature}</td>
                      <td className="py-4 px-6 font-extrabold text-brand-blue bg-blue-50/50">{row.hotelflexi}</td>
                      <td className="py-4 px-6 text-content-secondary-light">{row.djubo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Stop Overpaying for Fragmented Hotel Tech
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Get PMS, Channel Manager, Booking Engine, and Autonomous AI in one single ₹499/mo package. Start your 14-day free trial now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover transition shadow-lg"
            >
              Start Free Trial Now
            </Link>
            <Link
              href="/compare"
              className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm hover:bg-slate-700 transition border border-slate-700"
            >
              Back to Comparisons
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
