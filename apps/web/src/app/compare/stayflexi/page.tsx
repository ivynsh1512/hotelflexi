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
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi vs StayFlexi (2026) — Best Modern Alternative with AI & ₹499/mo Pricing',
  description:
    'Compare HotelFlexi vs StayFlexi. Discover why Indian hoteliers choose HotelFlexi over StayFlexi for its ₹499/mo transparent pricing, autonomous bilingual AI agent, 2-way OTA channel manager, and housekeeping urgency siren.',
  keywords: [
    'hotelflexi vs stayflexi',
    'stayflexi alternative india',
    'stayflexi pricing review',
    'best hotel pms india',
    'affordable hotel channel manager',
    'stayflexi vs hotelflexi cost comparison',
  ],
  openGraph: {
    title: 'HotelFlexi vs StayFlexi — In-Depth Feature & Price Comparison',
    description:
      'Why pay high USD pricing for StayFlexi when you can get autonomous AI, 2-way OTA sync, and urgency siren for ₹499/mo in India?',
    url: 'https://hotelflexi.novaxai.in/compare/stayflexi',
  },
};

export default function StayFlexiComparePage() {
  const comparisonData = [
    {
      feature: 'Pricing Model',
      hotelflexi: '₹499 / month flat INR (No hidden USD conversion)',
      stayflexi: 'Starting at $30 – $100+ USD / month (plus per-room surcharges)',
    },
    {
      feature: '2-Way Live OTA Channel Manager',
      hotelflexi: 'Included in ₹499 Starter plan (MakeMyTrip, Goibibo, Agoda, Booking.com, Airbnb)',
      stayflexi: 'Higher tier plans required for live OTA distribution',
    },
    {
      feature: 'Autonomous AI Concierge & Front Desk',
      hotelflexi: 'Bilingual AI Agent (English & Hindi) automating guest inquiries and bookings 24/7',
      stayflexi: 'Standard automated emails without autonomous conversational agent',
    },
    {
      feature: 'Housekeeping Urgency Siren System',
      hotelflexi: 'Audio-visual siren alarm across staff mobile devices for dirty linen & leaks (<7m resolution)',
      stayflexi: 'Basic task lists without real-time staff siren escalation',
    },
    {
      feature: 'FlexiLink Contactless Guest Experience',
      hotelflexi: 'Automated guest portal link via WhatsApp & Email: Digital self check-in, Govt ID & child birth proof upload, in-stay food orders, 7-day auto-purge with archived ledger',
      stayflexi: 'Generic web portal without native food ordering or automated proof expiration workflow',
    },
    {
      feature: 'Dine-Out Table Bookings (Non-Guest Public Link)',
      hotelflexi: 'Public discovery portal (/dine-out) & 5-digit hotel code: Outside resort guests & tourists can reserve tables, pre-order dishes (100% Pure Veg badge), and pay online or at counter',
      stayflexi: 'Limited to registered room guests; no public non-resident resort dining portal',
    },
    {
      feature: 'Mobile App & Push Notifications',
      hotelflexi: 'Native Google Play Store App + Offline PWA with Firebase Cloud Messaging (FCM) push siren alerts',
      stayflexi: 'Standard mobile browser view with basic push notifications',
    },
    {
      feature: 'Direct Booking Engine Commission',
      hotelflexi: '0% commission on direct bookings via FlexiLink',
      stayflexi: 'Often subject to percentage fees or tiered engine charges',
    },
    {
      feature: 'Indian GST Taxation Compliance',
      hotelflexi: 'Automated 12% & 18% GST brackets with SAC 9963 compliant tax folios',
      stayflexi: 'Global tax configurations requiring manual adjustment for Indian GST',
    },
    {
      feature: 'Local Payment Gateways',
      hotelflexi: 'Direct Razorpay, UPI QR, Netbanking & Credit Card payouts',
      stayflexi: 'Stripe primary, localized Indian UPI setup requires custom workarounds',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does HotelFlexi compare to StayFlexi in pricing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'While StayFlexi charges in US Dollars starting from $30 to $100+ per month plus per-room additions, HotelFlexi provides a localized Indian pricing model starting at only ₹499/month, including a 2-way OTA channel manager.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I migrate my bookings and inventory from StayFlexi to HotelFlexi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. HotelFlexi provides quick 5-minute onboarding and seamless room type imports. Our team also offers Rs. 499 complete setup assistance to migrate historical bookings and OTA connections.',
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
            HotelFlexi vs StayFlexi
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Why Indian hoteliers and boutique homestays are choosing HotelFlexi’s autonomous AI platform at ₹499/mo instead of expensive USD-billed software.
          </p>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="py-12 bg-surface-light border-b border-border-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border-2 border-brand-blue shadow-md space-y-3 relative">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-blue text-white text-[10px] font-black uppercase tracking-wider">
                Recommended for India
              </span>
              <h3 className="text-xl font-black text-content-primary-light">HotelFlexi</h3>
              <div className="text-2xl font-black text-brand-blue">₹499 / mo</div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Modern, autonomous hotel operating system with 2-way OTA channel manager, Indian GST compliance, digital FlexiLink self check-in, and instant housekeeping urgency siren.
              </p>
              <ul className="text-xs space-y-2 pt-2 text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> ₹499 flat INR pricing with no surprise currency fluctuations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> IngoMMT, Agoda, Booking.com, Airbnb &amp; Expedia sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 7-minute Housekeeping Urgency Siren on staff phones</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bilingual AI front desk agent that works 24/7</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-border-light shadow-sm space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                Competitor
              </span>
              <h3 className="text-xl font-black text-content-primary-light">StayFlexi</h3>
              <div className="text-2xl font-black text-slate-700">$30 – $100+ USD / mo</div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Global cloud hotel PMS targeting multi-regional chains with USD billing models, higher minimum fees, and complex setup requirements.
              </p>
              <ul className="text-xs space-y-2 pt-2 text-slate-600">
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Expensive foreign currency billing with credit card fees</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Channel manager requires higher-priced tiers</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> No emergency housekeeping siren alarm for urgent guest tickets</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Complex configuration for Indian 12%/18% GST brackets</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* In-Depth Feature Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-content-primary-light tracking-tight">
              Detailed Feature-by-Feature Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary-light mt-1">
              Analyze how HotelFlexi compares against StayFlexi across core hospitality workflows.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-4 px-6 text-sm">Capability</th>
                    <th className="py-4 px-6 text-sm bg-blue-600 font-black">HotelFlexi</th>
                    <th className="py-4 px-6 text-sm text-slate-300">StayFlexi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-content-primary-light">{row.feature}</td>
                      <td className="py-4 px-6 font-extrabold text-brand-blue bg-blue-50/50">{row.hotelflexi}</td>
                      <td className="py-4 px-6 text-content-secondary-light">{row.stayflexi}</td>
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
            Switch to HotelFlexi for ₹499/Month
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Experience modern hospitality automation with a 14-day free trial. Zero credit card required to start.
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
              View More Competitor Comparisons
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
