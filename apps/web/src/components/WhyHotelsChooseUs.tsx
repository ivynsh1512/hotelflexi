import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Bot,
  Globe,
  TrendingUp,
  Smartphone,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const WhyHotelsChooseUs: React.FC = () => {
  const points = [
    {
      title: 'All-in-one platform',
      description:
        'PMS calendar, direct booking engine, dine-out restaurant POS, housekeeping emergency siren, and GST accounting — all in one place.',
      icon: Layers,
    },
    {
      title: 'Powered by FlexiAI',
      description:
        'Proprietary bilingual AI handles reservations, dynamic pricing, guest communication in Hindi & English, and reviews automatically.',
      icon: Bot,
    },
    {
      title: 'Direct Booking Engine (0% Commission)',
      description:
        'Accept commission-free guest bookings directly with UPI, Razorpay, QR codes, automated tax folios, and instant confirmations.',
      icon: Globe,
    },
    {
      title: 'Revenue intelligence',
      description:
        'City demand analytics, competitor intelligence, automated SAC 9963 GST calculation, and AI-powered dynamic pricing.',
      icon: TrendingUp,
    },
    {
      title: 'Mobile app (iOS & Android)',
      description:
        'Full hotel and restaurant management from your phone. Manage multiple properties from a single app with offline PWA support.',
      icon: Smartphone,
    },
    {
      title: 'Onboard in 10 minutes',
      description:
        'Go live in minutes with your unique 5-digit hotel code. Free automated AI onboarding, property profile setup, and 24/7 dedicated support.',
      icon: Rocket,
    },
  ];

  return (
    <section className="py-24 bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header matching Screenshot 3 */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Why Hotels Choose HotelFlexi
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Replace multiple tools with a single unified system.
          </p>
        </div>

        {/* 6 Feature Grid matching Screenshot 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center space-y-4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {pt.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {pt.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 justify-center sm:justify-start">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Get Started with the ₹499/mo Starter Plan
            </h3>
            <p className="text-xs sm:text-sm text-blue-200">
              Includes Direct Booking Engine, Bilingual AI Agent, Dine-Out POS, and Housekeeping Urgency Siren.
            </p>
          </div>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-xl bg-white text-slate-900 font-black text-xs hover:bg-blue-50 transition shadow whitespace-nowrap"
          >
            Start 14-Day Free Trial
          </Link>
        </div>
      </div>
    </section>
  );
};
