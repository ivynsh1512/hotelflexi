import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

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
      channels: 'Manual sync',
      features: ['Room Calendar & Fast Walk-ins', 'Direct Booking Engine', 'GST Tax Folios (12% / 18%)', 'Bilingual AI Assistant (50 commands/mo)', 'Guest Directory'],
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
      channels: '2 OTA Channels',
      features: ['Full PMS & Fast Check-in/out', 'Direct Booking Engine', '2 Active OTA Channels', 'Housekeeping & Maintenance Tickets', '200 AI Assistant commands/mo', 'Daily Collections Reports'],
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
      channels: '5 OTA Channels',
      features: ['Advanced Room Grid', '5 Active OTA Channels', 'Direct Booking Engine with Razorpay', 'Financial P&L & Cash Flow Reports', '500 AI Assistant commands/mo', 'Priority Phone & WhatsApp Support'],
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
      channels: '15 OTA Channels',
      features: ['Multi-Property Switcher', '15 Active OTA Channels', 'Complete Accounting Ledger', '2,000 AI Assistant commands/mo', 'Custom Invoicing & Branding', 'Dedicated Account Manager'],
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Simple & Fair Pricing</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Plans for Properties of Every Scale
          </h1>
          <p className="mt-4 text-base sm:text-lg text-content-secondary-light max-w-2xl mx-auto">
            Choose the plan that suits your room inventory. Upgrade, downgrade, or cancel at any time.
          </p>
        </div>
      </section>

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
      </section>

      <Footer />
    </div>
  );
}
