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
  ThumbsUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi vs eZee Absolute — Why Indian Hoteliers Are Switching',
  description:
    'Compare HotelFlexi vs eZee Absolute (Yanolja Cloud). Discover why hoteliers prefer HotelFlexi for ₹499/mo with zero training curve, autonomous AI agent, room readiness SLAs, linen par tracking, and TallyPrime XML export.',
  keywords: [
    'hotelflexi vs ezee absolute',
    'ezee absolute alternative',
    'ezee technosys pricing review',
    'best hotel pms software india',
    'easy hotel software for staff',
    'ezee pms vs hotelflexi',
  ],
  openGraph: {
    title: 'HotelFlexi vs eZee Absolute — Modern Hospitality Software Comparison',
    description:
      'Skip the steep training curve. Switch to HotelFlexi with autonomous AI, room readiness SLAs, and TallyPrime export starting at ₹499/mo.',
    url: 'https://hotelflexi.com/compare/ezee-absolute',
  },
};

export default function EzeeAbsoluteComparePage() {
  const comparisonData = [
    {
      feature: 'User Experience & Staff Training',
      hotelflexi: 'Zero training curve; front desk staff master the interface in under 15 minutes',
      ezee: 'Steep learning curve with multi-layered legacy menus requiring days of video training',
    },
    {
      feature: 'Starting Price (INR)',
      hotelflexi: '₹499 / month flat with Direct Booking Engine included',
      ezee: 'Significantly higher base pricing (₹2,500 – ₹8,000+ per month)',
    },
    {
      feature: 'Housekeeping Room Readiness & Inspection SLA',
      hotelflexi: '4-Stage room readiness (Dirty → Cleaning → Inspected → Ready) with linen par health',
      ezee: 'Standard housekeeping status dropdowns without structured inspection stages',
    },
    {
      feature: 'TallyPrime Accounting Direct XML Export',
      hotelflexi: 'Instant vouchers.xml export with balanced double-entry accounting & GST heads',
      ezee: 'Manual CSV formatting or expensive third-party bridge licenses',
    },
    {
      feature: 'Food Procurement & Kitchen Covers (Rasan)',
      hotelflexi: 'Recipe consumption norms & 7-day cover shortage forecasting to prevent food waste',
      ezee: 'Requires standalone eZee Optimus POS license with separate billing',
    },
    {
      feature: 'Autonomous AI Concierge',
      hotelflexi: 'Bilingual Groq AI agent that automatically resolves booking queries and front-desk metrics',
      ezee: 'No autonomous conversational AI; relies on manual front-desk staff input',
    },
    {
      feature: 'Digital Guest Check-In & Food Orders (FlexiLink)',
      hotelflexi: 'Automated WhatsApp/Email link: Contactless check-in, Govt ID & child birth proof, in-stay food orders, 7-day auto-purge with archived ledger',
      ezee: 'eZee iFeedback / self check-in add-ons sold separately with complex integration',
    },
    {
      feature: 'Dine-Out Table Bookings (Non-Guest Public Link)',
      hotelflexi: 'Public discovery portal (/dine-out) & 5-digit hotel code: Outside resort guests & tourists can reserve tables, view 100% Pure Veg badge, and pre-order food',
      ezee: 'Requires standalone eZee Optimus POS license with separate billing',
    },
    {
      feature: 'Indian GST Compliance (SAC 9963)',
      hotelflexi: 'Automated 12% & 18% GST brackets with instant printable PDF tax invoices',
      ezee: 'Indian taxation supported but requires extensive initial accountant configuration',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is HotelFlexi easier to learn than eZee Absolute?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. HotelFlexi is designed for modern hospitality teams with an intuitive, clean interface that front-desk staff can learn in under 15 minutes without formal training seminars.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does HotelFlexi include channel management in the base tier?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. HotelFlexi includes 2 active OTA channels in its ₹499/month Starter plan, allowing hoteliers to sync rates and inventory across MakeMyTrip, Agoda, Booking.com, and Airbnb.',
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
            HotelFlexi vs eZee Absolute
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Experience lightning-fast front desk workflows, autonomous AI guest handling, and 2-way OTA distribution without the steep training curve.
          </p>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-12 bg-surface-light border-b border-border-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border-2 border-brand-blue shadow-md space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-blue text-white text-[10px] font-black uppercase tracking-wider">
                Easiest to Use
              </span>
              <h3 className="text-xl font-black text-content-primary-light">HotelFlexi</h3>
              <div className="text-2xl font-black text-brand-blue">₹499 / mo</div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Modern unified PMS, channel manager, and booking engine with zero training required and an autonomous AI assistant for ₹499/mo.
              </p>
              <ul className="text-xs space-y-2 pt-2 text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 15-minute staff onboarding with zero training seminars</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Built-in 2-way OTA Channel Manager on all plans</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Housekeeping Urgency Siren alert system for quick issue fixes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Digital guest self check-in via FlexiLink</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-border-light shadow-sm space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                Competitor
              </span>
              <h3 className="text-xl font-black text-content-primary-light">eZee Absolute</h3>
              <div className="text-2xl font-black text-slate-700">₹2,500 – ₹8,000+ / mo</div>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Traditional legacy cloud PMS with extensive multi-window menus and separate add-on billing for channel management (eZee Centrix).
              </p>
              <ul className="text-xs space-y-2 pt-2 text-slate-600">
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Steep learning curve requiring days of staff training</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Channel manager sold as a separate paid add-on</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> No emergency housekeeping siren alert system</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Expensive recurring subscription for small/mid hotels</li>
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
              Detailed Feature Comparison
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary-light mt-1">
              Why independent hotel owners in India are switching to HotelFlexi.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-4 px-6 text-sm">Capability</th>
                    <th className="py-4 px-6 text-sm bg-blue-600 font-black">HotelFlexi</th>
                    <th className="py-4 px-6 text-sm text-slate-300">eZee Absolute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-content-primary-light">{row.feature}</td>
                      <td className="py-4 px-6 font-extrabold text-brand-blue bg-blue-50/50">{row.hotelflexi}</td>
                      <td className="py-4 px-6 text-content-secondary-light">{row.ezee}</td>
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
            Simplify Your Hotel Operations Today
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Get started in 5 minutes with our ₹499/mo plan. Experience full autonomous AI, live OTA sync, and urgency siren alerts with our 14-day free trial.
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
