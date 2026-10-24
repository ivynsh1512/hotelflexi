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
  Clock,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi vs Cloudbeds (2026) — Best Affordable Alternative for Indian Hoteliers',
  description:
    'Compare HotelFlexi vs Cloudbeds. Discover why Indian hoteliers choose HotelFlexi over Cloudbeds for ₹499/mo transparent INR pricing, native Indian GST (SAC 9963) compliance, TallyPrime XML export, and autonomous Groq AI.',
  keywords: [
    'hotelflexi vs cloudbeds',
    'cloudbeds alternative india',
    'cloudbeds pricing review',
    'best hotel pms india',
    'affordable cloudbeds competitor',
    'hotel software india gst tally',
  ],
  openGraph: {
    title: 'HotelFlexi vs Cloudbeds — In-Depth Feature & Price Comparison',
    description:
      'Why pay $150+/month USD for Cloudbeds when HotelFlexi provides autonomous Groq AI, Indian GST folios, TallyPrime export, and room readiness SLAs for ₹499/mo?',
    url: 'https://hotelflexi.com/compare/cloudbeds',
  },
};

export default function CloudbedsComparePage() {
  const comparisonData = [
    {
      feature: 'Pricing Model',
      hotelflexi: '₹499 / month flat INR (No foreign currency conversion fees)',
      cloudbeds: 'Starting at $120 – $300+ USD / month (plus room count surcharges)',
    },
    {
      feature: 'Indian GST Taxation (SAC 9963)',
      hotelflexi: 'Automated 12% & 18% GST brackets with CGST/SGST splits & state tax folios',
      cloudbeds: 'Generic global tax system requiring complex manual setup for Indian GST',
    },
    {
      feature: 'TallyPrime Accounting Direct XML Export',
      hotelflexi: 'One-click vouchers.xml export with balanced double-entry accounting for Tally',
      cloudbeds: 'Requires third-party middleware or manual accounting exports',
    },
    {
      feature: 'Autonomous Groq AI Front Desk',
      hotelflexi: 'Bilingual AI Agent (English & Hindi) automating guest inquiries and operational metrics 24/7',
      cloudbeds: 'Standard automated email templates without conversational LLM agent',
    },
    {
      feature: 'Housekeeping Room Readiness & Inspection SLA',
      hotelflexi: '4-Stage room cycle (Dirty → Cleaning → Inspected → Ready) with supervisor assignment',
      cloudbeds: 'Standard Clean/Dirty status without structured inspection sign-offs',
    },
    {
      feature: 'Linen & Laundry Par Level Tracking',
      hotelflexi: 'Built-in tracking of clean linen, in-room stock, at-laundry par levels & vendor counts',
      cloudbeds: 'Requires separate inventory add-on apps',
    },
    {
      feature: 'Kitchen Food Procurement & Rasan Forecasting',
      hotelflexi: 'Recipe consumption norms & 7-day cover shortage forecasting to prevent food waste',
      cloudbeds: 'No kitchen food procurement tracking included',
    },
    {
      feature: 'FlexiLink Contactless Guest Portal',
      hotelflexi: 'Automated WhatsApp/Email link: Self check-in, Govt ID & child birth proof, food orders, 7-day auto-purge',
      cloudbeds: 'Guest portal available on higher pricing tiers',
    },
    {
      feature: 'Payment Gateways & UPI',
      hotelflexi: 'Direct Razorpay, UPI QR codes, Netbanking with 0% gateway markup',
      cloudbeds: 'Cloudbeds Payments primary (limited localized Indian UPI options)',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why is HotelFlexi a better choice for Indian hotels than Cloudbeds?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cloudbeds is designed for large international hotel chains with enterprise pricing in US Dollars. HotelFlexi is tailor-made for Indian hotels and resorts with native GST SAC 9963 compliance, TallyPrime XML export, UPI payments, and an autonomous AI front desk for just ₹499/month.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does HotelFlexi support Tally accounting?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. HotelFlexi generates fully compliant XML vouchers that import directly into TallyPrime without manual journal re-entry.',
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
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Competitive Analysis
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            HotelFlexi vs Cloudbeds
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Why Indian boutique hotels and independent resorts choose HotelFlexi’s India-first software at ₹499/mo over expensive international enterprise systems.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-4 px-5 font-bold uppercase tracking-wider text-[11px]">Feature / Capability</th>
                  <th className="py-4 px-5 font-black uppercase tracking-wider text-[11px] bg-brand-blue text-white">
                    HotelFlexi
                  </th>
                  <th className="py-4 px-5 font-bold uppercase tracking-wider text-[11px] text-slate-300">
                    Cloudbeds
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{row.feature}</td>
                    <td className="py-3.5 px-5 font-bold text-brand-blue bg-blue-50/30">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{row.hotelflexi}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{row.cloudbeds}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition"
            >
              Start Your Free 14-Day Trial of HotelFlexi (₹499/mo)
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
