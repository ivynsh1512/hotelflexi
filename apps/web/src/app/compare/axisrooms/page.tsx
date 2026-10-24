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
  title: 'HotelFlexi vs AxisRooms (2026) — Complete Hotel PMS vs Distribution-Only Tool',
  description:
    'Compare HotelFlexi vs AxisRooms. Why buy fragmented software when HotelFlexi provides complete PMS, front desk, housekeeping SLAs, supply tracking, and built-in GST accounting for ₹499/mo?',
  keywords: [
    'hotelflexi vs axisrooms',
    'axisrooms alternative',
    'best hotel pms india',
    'hotel management software india',
  ],
  openGraph: {
    title: 'HotelFlexi vs AxisRooms — Complete PMS vs Standalone Distribution',
    description:
      'HotelFlexi combines complete front desk operations, housekeeping SLAs, food procurement, and real-time GST P&L with direct booking engine for ₹499/mo.',
    url: 'https://hotelflexi.com/compare/axisrooms',
  },
};

export default function AxisRoomsComparePage() {
  const comparisonData = [
    {
      feature: 'Core Focus & Architecture',
      hotelflexi: 'Complete all-in-one PMS: Front desk, reservations, housekeeping, laundry, billing, and booking engine',
      axisrooms: 'Primarily channel manager and distribution engine; requires separate PMS software',
    },
    {
      feature: 'Pricing Model',
      hotelflexi: '₹499 / month flat INR (Everything included, no hidden module add-ons)',
      axisrooms: 'Higher pricing tiers with separate module costs for booking engine and rate management',
    },
    {
      feature: 'Housekeeping & Room Readiness SLA',
      hotelflexi: '4-Stage room cycle (Dirty → Cleaning → Inspected → Ready) with supervisor assignment',
      axisrooms: 'No housekeeping or maintenance management features',
    },
    {
      feature: 'Linen & Laundry Par Level Tracking',
      hotelflexi: 'Complete tracking of clean linen, in-room stock, at-laundry par levels & vendor counts',
      axisrooms: 'Not available (distribution only)',
    },
    {
      feature: 'Kitchen Food Procurement & Rasan Forecasting',
      hotelflexi: 'Recipe consumption norms & 7-day cover shortage forecasting to prevent food waste',
      axisrooms: 'Not available',
    },
    {
      feature: 'Built-in SAC 9963 GST Invoicing & P&L',
      hotelflexi: 'Automated 12% & 18% GST folios with CGST/SGST splits and live P&L ledger',
      axisrooms: 'No built-in GST tax folios or P&L',
    },
    {
      feature: 'Autonomous Groq AI Front Desk',
      hotelflexi: 'Bilingual AI Agent (English & Hindi) automating guest inquiries and operational metrics 24/7',
      axisrooms: 'No conversational AI agent',
    },
    {
      feature: 'FlexiLink Contactless Guest Portal',
      hotelflexi: 'Automated WhatsApp/Email link: Self check-in, Govt ID & child birth proof, food orders, 7-day auto-purge',
      axisrooms: 'Not available in core distribution system',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Competitive Analysis
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            HotelFlexi vs AxisRooms
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Why pay separately for standalone distribution when HotelFlexi provides complete property operations, housekeeping SLAs, and GST accounting for ₹499/mo.
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
                    AxisRooms
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
                        <span>{row.axisrooms}</span>
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
