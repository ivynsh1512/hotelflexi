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
  Smartphone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi vs Yojna Cloud Solution (YCS PMS) — Why Hoteliers Are Switching',
  description:
    'Compare HotelFlexi with Yojna Cloud Solution (YCS PMS). Discover why modern hoteliers prefer HotelFlexi for ₹499/mo with zero AMC, installable mobile PWA, autonomous AI front desk, and housekeeping urgency siren.',
  keywords: [
    'hotelflexi vs yojna cloud solution',
    'yojna cloud pms alternative',
    'yojna cloud software review',
    'best cloud hotel pms india',
    'hotel software without amc india',
    'ycs pms vs hotelflexi',
  ],
  openGraph: {
    title: 'HotelFlexi vs Yojna Cloud Solution — Modern AI PMS Comparison',
    description:
      'Tired of clunky legacy interfaces and expensive AMCs? See why HotelFlexi is the modern choice for Indian hospitality.',
    url: 'https://hotelflexi.novaxai.in/compare/yojna-cloud',
  },
};

export default function YojnaCloudComparePage() {
  const comparisonData = [
    {
      feature: 'Architecture & User Interface',
      hotelflexi: 'Modern 2026 Next.js + Cloudflare edge architecture; sleek, fast, intuitive UI',
      yojna: 'Legacy desktop / outdated web interface with cluttered multi-window menus',
    },
    {
      feature: 'Pricing & Annual Maintenance (AMC)',
      hotelflexi: 'Transparent ₹499 / mo flat pricing; ZERO Annual Maintenance Contracts (AMC)',
      yojna: 'Hefty upfront licensing fees plus mandatory recurring AMC charges',
    },
    {
      feature: 'Mobile PWA & Google Play Store App',
      hotelflexi: '100% installable mobile PWA with offline caching & Android Play Store readiness',
      yojna: 'Primarily desktop-dependent; limited or clunky mobile companion access',
    },
    {
      feature: 'Housekeeping Urgency Siren System',
      hotelflexi: 'Automated audio-visual siren sounding on staff mobile devices for quick linen & leak resolution',
      yojna: 'No urgency siren; staff rely on intercom or manual register logbooks',
    },
    {
      feature: 'Autonomous AI Business Agent',
      hotelflexi: 'Built-in conversational AI assistant handling front-desk inquiries in Hindi & English 24/7',
      yojna: 'No artificial intelligence capabilities; completely manual data entry',
    },
    {
      feature: '2-Way Live OTA Channel Synchronization',
      hotelflexi: 'Real-time central single source of truth for MMT, Agoda, Booking.com, Airbnb & Expedia',
      yojna: 'Often requires third-party channel manager bridges with synchronization delays',
    },
    {
      feature: 'Guest Self Check-In & Room Service (FlexiLink)',
      hotelflexi: 'Automated WhatsApp/Email link: Contactless check-in, Govt ID & child birth proof, in-stay food orders, 7-day auto-purge with archived ledger',
      yojna: 'Physical paper forms, manual counter passport/Aadhaar photocopying, and paper kitchen chits',
    },
    {
      feature: 'Dine-Out Table Bookings (Non-Guest Public Link)',
      hotelflexi: 'Public discovery portal (/dine-out) & 5-digit hotel code: Outside resort guests & tourists can reserve tables, view 100% Pure Veg badge, and pre-order food',
      yojna: 'No public restaurant booking link; restaurant module only bills room numbers',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why should I switch from Yojna Cloud Solution to HotelFlexi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HotelFlexi eliminates expensive Annual Maintenance Contracts (AMC) and legacy hardware dependencies, offering a modern cloud-native PWA starting at ₹499/mo with integrated 2-way OTA sync, an autonomous AI front desk, and an emergency urgency siren for housekeeping.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does HotelFlexi support Indian GST invoices compliant with government rules?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. HotelFlexi generates 100% SAC 9963 compliant GST tax invoices, automatically applying the appropriate 12% or 18% slab based on daily room tariffs.',
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
            <Sparkles className="w-3.5 h-3.5" /> Modern vs Legacy Comparison
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            HotelFlexi vs Yojna Cloud Solution
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Upgrade from clunky legacy menus and costly annual maintenance contracts to an autonomous, mobile-first cloud PMS starting at just ₹499/month.
          </p>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-12 bg-surface-light border-b border-border-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border-2 border-brand-blue shadow-md space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-blue text-white text-[10px] font-black uppercase tracking-wider">
                Modern 2026 Platform
              </span>
              <h3 className="text-xl font-black text-content-primary-light">HotelFlexi</h3>
              <div className="text-2xl font-black text-brand-blue">₹499 / mo flat</div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Modern progressive web app accessible from any smartphone, tablet, or PC with zero installation, zero AMC, and full autonomous AI capabilities.
              </p>
              <ul className="text-xs space-y-2 pt-2 text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero Annual Maintenance Contracts (AMC)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Integrated 2-way OTA Channel Manager on Starter tier</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time Housekeeping Urgency Siren for guest complaints</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Digital guest self check-in via FlexiLink</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-border-light shadow-sm space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                Legacy Architecture
              </span>
              <h3 className="text-xl font-black text-content-primary-light">Yojna Cloud Solution</h3>
              <div className="text-2xl font-black text-slate-700">High AMC + Upfront Fee</div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Traditional hotel software relying on legacy server setups, complex multi-screen navigation, and recurring maintenance contracts.
              </p>
              <ul className="text-xs space-y-2 pt-2 text-slate-600">
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Costly annual maintenance contracts (AMC)</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Complex learning curve requiring days of staff training</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> No autonomous AI front desk agent</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> No emergency housekeeping siren escalation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Table */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-content-primary-light tracking-tight">
              Capability Comparison Table
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary-light mt-1">
              Examine the differences in flexibility, automation, and operational costs.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-4 px-6 text-sm">Feature / Workflow</th>
                    <th className="py-4 px-6 text-sm bg-blue-600 font-black">HotelFlexi</th>
                    <th className="py-4 px-6 text-sm text-slate-300">Yojna Cloud Solution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-content-primary-light">{row.feature}</td>
                      <td className="py-4 px-6 font-extrabold text-brand-blue bg-blue-50/50">{row.hotelflexi}</td>
                      <td className="py-4 px-6 text-content-secondary-light">{row.yojna}</td>
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
            Ready to Say Goodbye to Expensive AMCs?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Switch your property to HotelFlexi in under 10 minutes. Get 14 days free with full Channel Manager and PMS access.
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
