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
  Building,
  HelpCircle,
  Package,
  FileText,
  Star,
  UtensilsCrossed,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi Competitor Comparisons — StayFlexi, Yojna Cloud, eZee & Cloudbeds',
  description:
    'Compare HotelFlexi with StayFlexi, Yojna Cloud Solution, eZee Absolute, Cloudbeds, and AxisRooms. Discover why Indian hoteliers choose HotelFlexi for ₹499/mo with autonomous Groq AI, room readiness SLAs, linen par tracking, and TallyPrime XML sync.',
  keywords: [
    'hotelflexi vs stayflexi',
    'hotelflexi vs yojna cloud solution',
    'hotelflexi vs ezee absolute',
    'hotelflexi vs cloudbeds',
    'hotelflexi vs axisrooms',
    'best hotel pms india comparison',
    'affordable hotel management software india',
    'hotel software alternative india',
  ],
  openGraph: {
    title: 'HotelFlexi Competitor Comparisons — Modern Indian Hotel PMS & Management System',
    description:
      'Compare features, pricing, autonomous AI, room readiness, TallyPrime export, and direct booking engine between HotelFlexi and other hotel management systems.',
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
        'StayFlexi charges high monthly USD rates ($30–$100+/mo) with expensive room-tier add-ons. HotelFlexi delivers a transparent ₹499/mo Indian INR plan with room readiness SLAs, Indian GST compliance, TallyPrime XML export, and autonomous AI front desk.',
      keyAdvantages: [
        '₹499/mo INR pricing vs steep USD subscription fees',
        'Direct Booking Engine with 0% commission included',
        'Housekeeping 4-stage room readiness & linen par tracking',
        '100% SAC 9963 Indian GST tax invoice automation & TallyPrime sync',
      ],
      badge: 'Most Popular Alternative',
    },
    {
      slug: 'yojna-cloud',
      competitor: 'Yojna Cloud Solution (YCS PMS)',
      tagline: 'Modern Cloud PWA & Real-Time Sync vs Legacy AMC Setup',
      summary:
        'Yojna Cloud Solution and traditional Indian desktop software lock hoteliers into expensive annual maintenance contracts (AMC), complex training, and clunky interfaces. HotelFlexi offers a zero-install mobile PWA with instant setup.',
      keyAdvantages: [
        'Zero Annual Maintenance Contracts (AMC) or hidden hardware lock-ins',
        'Installable Progressive Web App (PWA) with Google Play Store support',
        'Real-time staff mobile dispatch for fast guest resolution',
        'Autonomous AI business concierge that handles inquiries 24/7 in Hindi & English',
      ],
      badge: 'Best Legacy Upgrade',
    },
    {
      slug: 'ezee-absolute',
      competitor: 'eZee Absolute (Yanolja Cloud)',
      tagline: 'Intuitive Zero-Training PMS vs Steep Learning Curve',
      summary:
        'eZee Absolute requires extensive staff training, complex menu structures, and fragmented add-on billing. HotelFlexi is designed for instant 5-minute onboarding with direct FlexiLink self check-ins.',
      keyAdvantages: [
        '5-minute self-onboarding without days of staff training',
        'FlexiLink digital guest self check-in via WhatsApp & Email',
        'Integrated single source of truth for rates, blocks & inventory',
        'Transparent ₹499/mo plan with no booking commissions',
      ],
      badge: 'Easiest to Use',
    },
    {
      slug: 'cloudbeds',
      competitor: 'Cloudbeds',
      tagline: 'India-First Value & GST Accounting vs Global Enterprise Cost',
      summary:
        'Cloudbeds is designed for large international hotel chains with enterprise pricing starting in hundreds of dollars. HotelFlexi offers the essential power, GST 12%/18% invoices, TallyPrime export, and food procurement at a fraction of the cost.',
      keyAdvantages: [
        '₹499/mo vs $150+/mo global pricing',
        'Native Indian GST (SAC 9963) with automated CGST/SGST splits',
        'TallyPrime XML accounting export out-of-the-box',
        'Kitchen food procurement & 7-day cover forecasting',
      ],
      badge: 'Best Value vs International',
    },
    {
      slug: 'djubo',
      competitor: 'Djubo',
      tagline: 'Unified All-in-One Suite vs Fragmented Add-on Fees',
      summary:
        'Djubo separates channel management, booking engine, and front desk operations into distinct paid modules with transaction cuts. HotelFlexi combines PMS, linen inventory, and Direct Booking Engine under one single dashboard.',
      keyAdvantages: [
        'All-in-one unified architecture without separate module invoices',
        'Direct UPI & Razorpay payments without transaction commissions',
        'Autonomous AI agent capable of answering booking queries in Hindi & English',
        'Built-in kitchen food procurement & rasan par levels',
      ],
      badge: 'Best Value Suite',
    },
    {
      slug: 'axisrooms',
      competitor: 'AxisRooms',
      tagline: 'Complete PMS & Operations vs Distribution-Only Tool',
      summary:
        'AxisRooms primarily focuses on distribution and channel management, requiring hoteliers to purchase separate software for front desk, housekeeping, and accounting. HotelFlexi delivers a complete property management ecosystem.',
      keyAdvantages: [
        'Full front desk, guest ledger, and folio management included',
        'Housekeeping readiness tracking (Dirty → Cleaning → Inspected → Ready)',
        'Direct FlexiLink guest portal for paperless mobile check-in',
        'Zero commission booking engine with instant UPI payments',
      ],
      badge: 'Complete PMS Alternative',
    },
  ];

  const featureMatrix = [
    { feature: 'Starting Monthly Price (INR)', hotelflexi: '₹499 / month flat', others: '₹3,000 – ₹15,000 / mo or $100+' },
    { feature: 'Direct Booking Engine Commission', hotelflexi: '0% Commission Included', others: '2% - 5% Commission or Paid Engine' },
    { feature: 'FlexiLink Contactless Guest Portal', hotelflexi: 'Yes (Self Check-in, Govt ID & Child proof, In-Stay Food Orders, 7-Day Auto-Purge)', others: 'Paper forms or Expensive 3rd-party app' },
    { feature: 'Dine-Out Table Bookings (Public Link for Non-Guests)', hotelflexi: 'Yes (5-Digit Code / Public URL, 100% Pure Veg Badge, In-App or Counter Pay)', others: 'No (In-house only, loses outside restaurant revenue)' },
    { feature: 'Autonomous Groq AI Front Desk & Business Agent', hotelflexi: 'Yes (Bilingual Llama 3.3 70B & DeepSeek R1 24/7)', others: 'No or Limited Chatbot' },
    { feature: 'Housekeeping Room Readiness & Inspection SLA', hotelflexi: 'Yes (4-Stage: Dirty → Cleaning → Inspected → Ready)', others: 'No (Manual register / phone calls only)' },
    { feature: 'Linen & Laundry Par Level Tracking', hotelflexi: 'Yes (Bedsheet/pillowcase par health & vendor counts)', others: 'Separate manual registers' },
    { feature: 'Food & Pantry Procurement (Rasan Forecasting)', hotelflexi: 'Yes (Recipe norms & 7-day cover shortage alerts)', others: 'No / Expensive standalone F&B software' },
    { feature: 'TallyPrime Accounting Direct XML Export', hotelflexi: 'Yes (Direct vouchers.xml download & live bridge)', others: 'Manual bookkeeping / CSV re-entry' },
    { feature: 'Post-Stay Google Review Compliance', hotelflexi: 'Yes (Unconditional Google link + AI review polisher)', others: 'None / Policy-violating review gating' },
    { feature: 'Indian GST 12% & 18% Compliance (SAC 9963)', hotelflexi: 'Automated Tiered Folios with CGST/SGST splits', others: 'Manual calculations' },
    { feature: 'Setup & Onboarding Time', hotelflexi: '5 Minutes Self-Service', others: '1 – 3 Weeks with Paid Training' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why should I choose HotelFlexi over StayFlexi, Yojna Cloud, or Cloudbeds?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HotelFlexi is purpose-built for Indian hospitality operators with a transparent ₹499/mo starter plan that includes a direct booking engine, autonomous Groq AI assistant, Indian GST SAC 9963 compliance, TallyPrime XML export, room readiness SLAs, and food procurement forecasting.',
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
      {
        '@type': 'Question',
        name: 'Can I export my accounting data to TallyPrime?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. HotelFlexi generates fully balanced multi-line double-entry accounting XML with separate GST tax heads that imports directly into TallyPrime without manual data entry.',
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
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Detailed Platform Comparisons
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Select a competitor below for an in-depth breakdown of features, architecture, pricing, and migration guides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisons.map((c) => (
              <div
                key={c.slug}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-brand-blue border border-blue-200">
                      {c.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">vs HotelFlexi</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">HotelFlexi vs {c.competitor}</h3>
                    <p className="text-xs font-semibold text-brand-blue mt-0.5">{c.tagline}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{c.summary}</p>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                      Key Differences:
                    </span>
                    {c.keyAdvantages.map((adv, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link
                    href={`/compare/${c.slug}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition group"
                  >
                    <span>Read Full {c.competitor} Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix Table */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Feature-by-Feature Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              See how HotelFlexi compares directly with legacy Indian PMSs and expensive international software.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-4 px-5 font-bold uppercase tracking-wider text-[11px]">Feature / Capability</th>
                  <th className="py-4 px-5 font-black uppercase tracking-wider text-[11px] bg-brand-blue text-white">
                    HotelFlexi (by NovaX AI)
                  </th>
                  <th className="py-4 px-5 font-bold uppercase tracking-wider text-[11px] text-slate-300">
                    Legacy / Other PMS Providers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {featureMatrix.map((row, idx) => (
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
                        <span>{row.others}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Common questions about migrating to HotelFlexi.
            </p>
          </div>

          <div className="space-y-4">
            {jsonLd.mainEntity.map((item, idx) => (
              <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" />
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {item.acceptedAnswer.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="p-8 bg-gradient-to-br from-brand-blue to-blue-800 text-white rounded-3xl shadow-xl space-y-4">
              <h3 className="text-2xl font-black">Ready to modernize your property operations?</h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
                Join hoteliers across India saving ₹50,000+ per year while automating room readiness, TallyPrime sync, and direct bookings.
              </p>
              <div className="pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-blue font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:bg-slate-100 transition"
                >
                  Start Your 14-Day Free Trial (₹499/mo thereafter)
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
