import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CheckCircle2, ChevronRight, Check, X, Wrench, Shield, Zap, Globe, Sparkles } from 'lucide-react';
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

        {/* White-Glove Setup & Complete OTA Listing Assistance */}
        <div className="mt-16 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              White-Glove Onboarding &amp; OTA Services
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Want NovaX AI to Launch &amp; List Your Hotel?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Save hundreds of manual hours. Choose from our quick setup package or get full end-to-end OTA listing and channel synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Package 1: Developer Software Setup (Rs. 499) */}
            <div className="p-7 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col justify-between space-y-6 border border-slate-800">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
                    <Wrench className="w-3.5 h-3.5 text-blue-300" />
                    Basic Setup Package
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">₹499</div>
                    <span className="text-[10px] text-slate-400">One-Time Fee</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white">Dedicated Developer Setup</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    A dedicated NovaX AI engineer configures your complete HotelFlexi PMS, rooms, rate cards, and payment gateway.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Complete Room Inventory &amp; Category Configuration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Base Rates, Weekend Pricing &amp; Child Policies Setup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Indian GST Tax Slabs (12% / 18%) &amp; SAC Billing Profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Razorpay Payment Gateway &amp; Hotel UPI ID Connection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Staff Accounts &amp; Housekeeping Siren Alert Setup</span>
                  </li>
                </ul>
              </div>

              <a
                href="mailto:info@novaxai.in?subject=HotelFlexi%20Developer%20Setup%20Service%20(Rs.%20499)&body=Hi%20NovaX%20AI%20Team,%0A%0AI%20would%20like%20to%20hire%20a%20developer%20for%20complete%20HotelFlexi%20setup%20for%20my%20property.%0A%0AProperty%20Name:%20%0APhone%20Number:%20"
                className="w-full text-center py-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition shadow-md block"
              >
                Hire Developer Setup (₹499) &rarr;
              </a>
            </div>

            {/* Package 2: Complete OTA Listing & HotelFlexi 2-Way Setup (Rs. 4,999) */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950 text-white shadow-2xl flex flex-col justify-between space-y-6 border-2 border-blue-400/40 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow">
                ★ Complete OTA Listing
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
                    <Globe className="w-3.5 h-3.5 text-blue-300" />
                    Full OTA Onboarding Package
                  </div>
                  <div className="text-right pt-6 sm:pt-0">
                    <div className="text-2xl font-black text-amber-300">₹4,999</div>
                    <span className="text-[10px] text-blue-200">One-Time All-Inclusive</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white">Complete OTA Listing &amp; HotelFlexi Setup</h3>
                  <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                    Get your hotel listed, verified, and live on every major OTA with 2-way synchronization into HotelFlexi PMS.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-blue-100 pt-2 border-t border-blue-800/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span><strong>Full OTA Listings:</strong> MakeMyTrip, Goibibo, Booking.com, Agoda &amp; Expedia</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Professional Room Photo Categorization &amp; Amenity Tagging on OTAs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span><strong>2-Way Channel Sync:</strong> Live rate &amp; inventory push directly from HotelFlexi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Dynamic Weekend Pricing, Meal Plans (CP/MAP/EP) &amp; Cancellation Policies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Google Hotel Ads / Free Booking Links profile verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>1-on-1 Dedicated Video Training &amp; Staff Handover Call</span>
                  </li>
                </ul>
              </div>

              <a
                href="mailto:info@novaxai.in?subject=Complete%20OTA%20Listing%20%26%20HotelFlexi%20Setup%20(Rs.%204,999)&body=Hi%20NovaX%20AI%20Team,%0A%0AI%20would%20like%20to%20get%20complete%20OTA%20listings%20on%20Expedia,%20Booking.com,%20MakeMyTrip,%20Goibibo%20with%20full%20HotelFlexi%202-Way%20Setup.%0A%0AProperty%20Name:%20%0ACity/State:%20%0ANumber%20of%20Rooms:%20%0AContact%20Phone:%20"
                className="w-full text-center py-3 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition shadow-lg block"
              >
                Get Complete OTA Listing &amp; Setup (₹4,999) &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
