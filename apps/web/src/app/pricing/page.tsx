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
      name: 'Free Starter',
      price: '₹0',
      annual: 'Free Forever',
      desc: 'Small homestays & boutique stays wanting direct bookings with zero upfront cost.',
      rooms: 'Up to 10 Rooms',
      properties: '1 Property',
      users: '2 Staff Accounts',
      channels: 'None (Manual Updates Only)',
      features: [
        'Room Calendar & Fast Walk-in Bookings',
        'Direct Booking Engine & FlexiLink (0% commission)',
        'Basic SAC 9963 GST Billing Folios',
        'Guest Directory & Master Ledger',
        'AI Concierge (2 queries / day)',
        'Limitations: No Live OTA Sync, No Siren',
      ],
      highlighted: false,
    },
    {
      id: 'essential',
      name: 'Essential',
      price: '₹499',
      annual: '₹4,990/year (2 Months Free)',
      desc: 'Mid-scale boutique hotels & apartments wanting full automation & OTA reach.',
      rooms: 'Up to 30 Rooms',
      properties: '1 Property',
      users: '5 Staff Accounts',
      channels: '4 Live OTA Channels',
      features: [
        '2-Way Live Channel Manager (MMT, Agoda, Booking.com, Airbnb)',
        'FlexiLink Digital Self Check-in & In-Stay Room Service Orders',
        'Dine-Out Table Bookings with 100% Pure Veg Badge',
        'Housekeeping Urgency Siren Alert System (<7m resolution)',
        'Bilingual FlexiAI Concierge (200 commands/mo)',
        'Real-Time FCM Push Notifications & Google Play Store App',
        'Tiered 12% & 18% GST Compliance Invoices',
      ],
      highlighted: true,
      badge: 'Included in 14-Day Free Trial',
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '₹1,499',
      annual: '₹14,990/year',
      desc: 'Fast-growing resorts & boutique hotel groups scaling occupancy & direct brand.',
      rooms: 'Up to 75 Rooms',
      properties: 'Up to 3 Properties',
      users: '15 Staff Accounts',
      channels: '10 Live OTA Channels',
      features: [
        'Everything in Essential Plan',
        'Custom Hotel Website with Free Domain, Hosting & Annual Maintenance Included',
        'Multi-Property Dashboard & Inventory Switcher',
        'Dynamic Pricing Rules & Competitor Price Tracking',
        'Automated WhatsApp Review & Feedback Engine',
        '600 AI Assistant commands/mo',
        'Priority WhatsApp & Phone Support SLA',
      ],
      highlighted: false,
      badge: 'Includes Custom Website',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₹3,999',
      annual: '₹39,990/year',
      desc: 'Hotel chains, luxury resort groups, and heritage properties.',
      rooms: 'Unlimited Rooms',
      properties: 'Unlimited Properties',
      users: 'Unlimited Staff',
      channels: 'Unlimited Live Channels',
      features: [
        'Everything in Growth Plan',
        'Custom Multi-Property Central Reservation System (CRS)',
        'White-Label Android Mobile App & Brand Integration',
        'Custom Webhooks & REST API Integrations',
        'Dedicated Technical Account Manager',
        '99.99% Uptime Guarantee with Custom SLA',
      ],
      highlighted: false,
    },
  ];

  const comparisonRows = [
    { name: 'Monthly Price (INR)', starter: '₹0 (Free)', essential: '₹499 / mo', growth: '₹1,499 / mo', enterprise: '₹3,999 / mo' },
    { name: 'Room Inventory Capacity', starter: 'Up to 10 Rooms', essential: 'Up to 30 Rooms', growth: 'Up to 75 Rooms', enterprise: 'Unlimited' },
    { name: 'Staff User Logins', starter: '2 Users', essential: '5 Users', growth: '15 Users', enterprise: 'Unlimited' },
    { name: '2-Way Live Channel Manager (OTAs)', starter: 'No (Manual only)', essential: '4 Live Channels', growth: '10 Live Channels', enterprise: 'Unlimited Channels' },
    { name: 'Direct Booking Engine (0% Fee)', starter: true, essential: true, growth: true, enterprise: true },
    { name: 'FlexiLink Contactless Self Check-In', starter: 'Basic link', essential: 'Full (ID & Child proof)', growth: 'Full (ID & Child proof)', enterprise: 'Full + Custom domain' },
    { name: 'In-Stay Room Service Food Ordering', starter: false, essential: true, growth: true, enterprise: true },
    { name: 'Dine-Out Table Bookings (Non-Guests)', starter: false, essential: true, growth: true, enterprise: true },
    { name: 'Housekeeping Urgency Siren System', starter: false, essential: true, growth: true, enterprise: true },
    { name: 'Custom Hotel Website + Annual AMC', starter: false, essential: false, growth: 'Included Free', enterprise: 'Included Free' },
    { name: 'Bilingual AI Assistant Commands', starter: '2 / day', essential: '200 / mo', growth: '600 / mo', enterprise: 'Unlimited' },
    { name: 'Dynamic Pricing & Competitor Tracking', starter: false, essential: false, growth: true, enterprise: true },
    { name: 'Mobile PWA & Google Play Store App', starter: true, essential: true, growth: true, enterprise: true },
    { name: 'GST Billing (12% & 18% SAC 9963)', starter: true, essential: true, growth: true, enterprise: true },
    { name: 'Support SLA', starter: 'Community / Email', essential: 'WhatsApp & Email', growth: 'Priority WhatsApp & Phone', enterprise: '24/7 Dedicated Manager' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <th className="p-3.5 text-center">Free Starter</th>
                  <th className="p-3.5 text-center bg-blue-50/50 text-brand-blue">Essential (Trial)</th>
                  <th className="p-3.5 text-center">Growth (Website)</th>
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
                      <td className="p-3.5 text-center bg-blue-50/20">{renderVal(row.essential)}</td>
                      <td className="p-3.5 text-center">{renderVal(row.growth)}</td>
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
