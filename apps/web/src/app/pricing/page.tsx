import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CheckCircle2, ChevronRight, Check, X, Wrench, Shield, Zap } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Plans — Transparent Hotel Software in India',
  description:
    'Affordable hotel PMS & channel manager pricing starting at ₹499/mo. 100% transparent INR plans with Indian GST support, OTA sync, and no hidden lock-ins.',
  keywords: [
    'hotel pms pricing india',
    'hotel channel manager cost',
    'affordable hotel management software',
    'hotel billing software price inr',
  ],
};

export default function PricingPage() {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '₹499',
      annual: '₹4,990/year',
      desc: 'Small homestays, guesthouses & boutique stays.',
      rooms: 'Up to 10 Rooms',
      properties: '1 Property',
      users: '2 Staff Accounts',
      channels: '2 OTA Channels',
      features: [
        '2-Way Live Channel Manager (2 OTAs)',
        'Room Calendar & Fast Walk-ins',
        'Direct Booking Engine & FlexiLink',
        'GST Tax Folios (12% / 18%)',
        'Housekeeping Urgency Siren Alerts',
        'Bilingual AI Assistant (100 commands/mo)',
        'Guest Directory & Ledger',
      ],
      highlighted: false,
    },
    {
      id: 'essential',
      name: 'Essential',
      price: '₹999',
      annual: '₹9,990/year',
      desc: 'Budget hotels, bed & breakfasts, and serviced apartments.',
      rooms: 'Up to 25 Rooms',
      properties: '1 Property',
      users: '5 Staff Accounts',
      channels: '5 OTA Channels',
      features: ['Full PMS & Fast Check-in/out', 'Direct Booking Engine', '5 Active OTA Channels', 'Housekeeping Urgency Siren & Tickets', '200 AI Assistant commands/mo', 'Daily Collections Reports'],
      highlighted: true,
      badge: 'Recommended',
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '₹2,499',
      annual: '₹24,990/year',
      desc: 'Mid-scale resorts and boutique hotel groups.',
      rooms: 'Up to 60 Rooms',
      properties: '2 Properties',
      users: '12 Staff Accounts',
      channels: '10 OTA Channels',
      features: ['Advanced Room Grid', '10 Active OTA Channels', 'Direct Booking Engine with Razorpay', 'Financial P&L & Cash Flow Reports', '500 AI Assistant commands/mo', 'Priority Phone & WhatsApp Support'],
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹4,999',
      annual: '₹49,990/year',
      desc: 'Large independent hotels and multi-property operators.',
      rooms: 'Up to 150 Rooms',
      properties: '5 Properties',
      users: '25 Staff Accounts',
      channels: 'Unlimited Channels',
      features: ['Multi-Property Switcher', 'Unlimited OTA Channels', 'Complete Accounting Ledger', '2,000 AI Assistant commands/mo', 'Custom Invoicing & Branding', 'Dedicated Account Manager'],
      highlighted: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₹9,999+',
      annual: 'Custom Annual Billing',
      desc: 'Hotel chains, management groups, and large heritage resorts.',
      rooms: 'Unlimited Rooms',
      properties: 'Unlimited Properties',
      users: 'Unlimited Staff',
      channels: 'Unlimited Channels',
      features: ['Tailored Cloudflare Architecture', 'Dedicated Database Isolation', 'Custom Channel Adapters', 'SLA 99.99% Guaranteed Uptime', 'On-premise / Custom Domain Integration'],
      highlighted: false,
    },
  ];

  const comparisonRows = [
    { name: 'Room Inventory Capacity', starter: 'Up to 10 Rooms', essential: 'Up to 25 Rooms', growth: 'Up to 60 Rooms', pro: 'Up to 150 Rooms', enterprise: 'Unlimited' },
    { name: 'Staff User Logins', starter: '2 Users', essential: '5 Users', growth: '12 Users', pro: '25 Users', enterprise: 'Unlimited' },
    { name: 'Channel Manager (OTAs)', starter: '2 Channels (Live Sync)', essential: '5 Channels', growth: '10 Channels', pro: 'Unlimited Channels', enterprise: 'Unlimited Channels' },
    { name: 'Housekeeping Urgency Siren', starter: true, essential: true, growth: true, pro: true, enterprise: true },
    { name: 'Direct Booking Engine', starter: true, essential: true, growth: true, pro: true, enterprise: true },
    { name: 'Guest Portal (FlexiLink)', starter: true, essential: true, growth: true, pro: true, enterprise: true },
    { name: 'GST Billing & Invoicing (12%/18%)', starter: true, essential: true, growth: true, pro: true, enterprise: true },
    { name: 'AI Business Agent Prompts', starter: '100 / mo', essential: '200 / mo', growth: '500 / mo', pro: '2,000 / mo', enterprise: 'Unlimited' },
    { name: 'Housekeeping & Task Assignment', starter: true, essential: true, growth: true, pro: true, enterprise: true },
    { name: 'Financial P&L & Cash Flow', starter: false, essential: false, growth: true, pro: true, enterprise: true },
    { name: 'Multi-Property Management', starter: false, essential: false, growth: '2 Properties', pro: '5 Properties', enterprise: 'Unlimited' },
    { name: 'Support SLA', starter: 'Email Support', essential: 'Email & WhatsApp', growth: 'Priority WhatsApp', pro: 'Dedicated Manager', enterprise: '24/7 Phone SLA' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Simple &amp; Fair Indian Pricing</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Plans for Properties of Every Scale
          </h1>
          <p className="mt-4 text-base sm:text-lg text-content-secondary-light max-w-2xl mx-auto">
            Choose the plan that matches your room inventory. All plans include direct booking engine, Indian GST billing, and zero booking commission.
          </p>
        </div>
      </section>

      {/* Cards Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-6 rounded-2xl bg-white border flex flex-col justify-between ${
                p.highlighted ? 'border-brand-blue shadow-lg ring-1 ring-brand-blue' : 'border-border-light'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-content-primary-light">{p.name}</h3>
                  {p.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-blue-surface text-brand-blue">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-content-secondary-light min-h-[28px]">{p.desc}</p>
                <div className="mt-3 pb-3 border-b border-border-light">
                  <div className="text-2xl font-extrabold text-content-primary-light">{p.price}</div>
                  <div className="text-[10px] text-content-secondary-light">{p.annual}</div>
                </div>

                <div className="mt-4 space-y-1.5 text-[11px] font-medium text-content-primary-light pb-4 border-b border-border-light">
                  <div>🛏️ {p.rooms}</div>
                  <div>🏢 {p.properties}</div>
                  <div>👥 {p.users}</div>
                  <div>🌐 {p.channels}</div>
                </div>

                <ul className="mt-4 space-y-2 text-[11px] text-content-secondary-light">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <Link
                  href={`/signup?plan=${p.id}`}
                  className={`w-full block text-center py-2 rounded-lg text-xs font-semibold transition ${
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

        {/* Full Feature Comparison Table */}
        <div className="mt-16 bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-blue" />
            <span>Complete Plan Feature Comparison</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Feature / Capability</th>
                  <th className="p-3.5 text-center">Starter</th>
                  <th className="p-3.5 text-center">Essential</th>
                  <th className="p-3.5 text-center">Growth</th>
                  <th className="p-3.5 text-center">Pro</th>
                  <th className="p-3.5 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {comparisonRows.map((row) => {
                  const renderVal = (v: any) => {
                    if (v === true) return <Check className="w-4 h-4 text-emerald-600 mx-auto" />;
                    if (v === false) return <X className="w-4 h-4 text-gray-300 mx-auto" />;
                    return <span className="font-semibold text-content-primary-light">{v}</span>;
                  };

                  return (
                    <tr key={row.name} className="hover:bg-surface-light/40">
                      <td className="p-3.5 font-medium text-content-primary-light">{row.name}</td>
                      <td className="p-3.5 text-center">{renderVal(row.starter)}</td>
                      <td className="p-3.5 text-center">{renderVal(row.essential)}</td>
                      <td className="p-3.5 text-center">{renderVal(row.growth)}</td>
                      <td className="p-3.5 text-center">{renderVal(row.pro)}</td>
                      <td className="p-3.5 text-center">{renderVal(row.enterprise)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Done-For-You Setup Assistance Callout */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
              <Wrench className="w-3.5 h-3.5 text-blue-300" />
              White-Glove Setup Service
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">
              Want NovaX AI to set up your entire hotel?
            </h3>
            <p className="text-xs text-blue-200 leading-relaxed">
              Our engineering team configures all your rooms, pricing plans, GST tax brackets, OTA channel connections,
              and staff accounts for just ₹499 one-time.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <div className="text-2xl font-extrabold text-white">₹499 <span className="text-xs font-normal text-blue-300">one-time</span></div>
            <a
              href="mailto:info@novaxai.in?subject=HotelFlexi%20Developer%20Setup%20Service%20(Rs.%20499)&body=Hi%20NovaX%20AI%20Team,%0A%0AI%20would%20like%20to%20hire%20a%20developer%20for%20complete%20HotelFlexi%20setup%20for%20my%20property.%0A%0AProperty%20Name:%20%0APhone%20Number:%20"
              className="px-6 py-3 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-blue-50 transition shadow-lg"
            >
              Hire Developer Setup (₹499)
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
