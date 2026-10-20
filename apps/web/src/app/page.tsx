'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { InteractiveProductShowcase } from '@/components/InteractiveProductShowcase';
import { BookDemoModal } from '@/components/BookDemoModal';
import {
  Calendar,
  Sparkles,
  Receipt,
  Globe,
  BedDouble,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowRight,
  Layers,
  HelpCircle,
  Smartphone,
  Download,
  UtensilsCrossed,
  Volume2,
  Users,
  Check,
  Star,
  Building,
  HeartHandshake,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '₹0',
      interval: 'Free Forever',
      desc: 'Ideal for small homestays & independent guesthouses.',
      features: [
        'Up to 10 Rooms',
        '1 Property',
        'Room Calendar & PMS Grid',
        'Direct Booking Engine (/book/slug)',
        'Indian GST Invoicing (12% & 18%)',
        'Guest FlexiLink Contactless Portal',
        'Community & Email Support',
      ],
      highlighted: false,
      ctaText: 'Start Free Forever',
    },
    {
      id: 'essential',
      name: 'Essential',
      price: '₹499',
      interval: '/month',
      desc: 'Perfect for growing budget & boutique hotels.',
      features: [
        'Up to 25 Rooms',
        '1 Property',
        '2-Way OTA Channel Manager (MMT, Agoda, Booking.com)',
        'Hardware Urgency Siren Alert on Staff Phones',
        'Bilingual AI Business Agent (Hindi & English)',
        'Direct Razorpay Payment Integration',
        'Advance Payment Rules (Full / Partial % / Pay at Hotel)',
        'Priority WhatsApp & Email Support',
      ],
      highlighted: true,
      badge: 'Most Popular for Hotels',
      ctaText: 'Start 14-Day Free Trial',
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '₹1,499',
      interval: '/month',
      desc: 'Designed for busy mid-scale resorts & wedding banquets.',
      features: [
        'Up to 60 Rooms',
        '2 Properties',
        'Unlimited 2-Way OTA Channel Connections',
        'Dino Restaurant & In-Stay Room POS with KOT',
        'Banquets & Destination Wedding Group Blocking',
        'Financial P&L & SAC 9963 Audit Reports',
        'Staff Roster with Role Permissions',
        'Dedicated 1-on-1 Onboarding Specialist',
      ],
      highlighted: false,
      ctaText: 'Start 14-Day Free Trial',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₹2,999',
      interval: '/month',
      desc: 'Full-power operations for multi-property resort groups.',
      features: [
        'Up to 150 Rooms',
        'Multi-Property Central Switcher',
        'Custom Central Reservation System (CRS)',
        'Multi-Property Consolidated P&L',
        'Custom SMS / WhatsApp Gateway Integration',
        '24/7 Dedicated Account Manager',
        '99.9% Uptime SLA Guarantee',
      ],
      highlighted: false,
      ctaText: 'Contact Enterprise Sales',
    },
  ];

  const faqs = [
    {
      q: 'How does the 2-Way Channel Manager prevent double-bookings?',
      a: 'HotelFlexi connects directly to MakeMyTrip, Goibibo, Booking.com, Agoda, Airbnb, and Expedia. The moment a room is booked directly at your front desk, on your website, or via an OTA, availability counts are updated across all channels within seconds, automatically placing stop-sells on booked rooms.',
    },
    {
      q: 'Do you charge commissions on direct bookings?',
      a: 'No! HotelFlexi charges 0% commission on direct bookings. When guests book through your custom booking engine (/book/[slug]), payments go directly into your own Razorpay account with your preferred advance policy (full advance, partial percentage, or pay at hotel).',
    },
    {
      q: 'What is the Housekeeping Urgency Siren and how does it work?',
      a: 'When an in-house guest reports an urgent grievance via their mobile FlexiLink (such as dirty linen, plumbing leakage, or emergency assistance), staff smartphones sound a dual-tone European siren accompanied by continuous hardware vibrations until a staff member taps "Pick & Silence Siren". Floor staff can then rectify the issue within minutes, and the admin panel shows "Taken by [Staff Name]".',
    },
    {
      q: 'How does Indian GST (12% / 18%) billing work in HotelFlexi?',
      a: 'HotelFlexi automatically applies statutory Indian GST rules based on room tariff slabs (12% for room tariffs up to ₹7,500/night and 18% for tariffs above ₹7,500/night). Invoices record CGST, SGST, and IGST breakdowns accurately in integer paise, preventing fractional rounding errors, with SAC 9963 classification.',
    },
    {
      q: 'Can our staff operate HotelFlexi in Hindi or Hinglish?',
      a: 'Yes! HotelFlexi features a built-in Bilingual AI Business Assistant. Floor managers and receptionists can speak or type in English, Hindi, or Hinglish (e.g. "Kal Room 101 block kar do", "Today ke arrivals dikhao", or "Show today\'s cash collection") to execute PMS operations instantly.',
    },
    {
      q: 'Is there an installable mobile app for floor staff?',
      a: 'Yes. HotelFlexi provides an installable Android APK and Google Play Store package. The app runs in full-screen mode with zero URL bars, maintains persistent logins, and requests native operating system notification permissions for real-time siren alerts.',
    },
  ];

  const comparisonData = [
    { feature: '2-Way OTA Channel Manager (MMT, Agoda, Booking.com)', hotelflexi: 'Yes (Live 2-Way)', stayflexi: 'Yes', cloudbeds: 'Yes', axisrooms: 'Yes', ezee: 'Yes' },
    { feature: 'Direct Booking Engine with Zero Commission', hotelflexi: 'Yes (0% Fee)', stayflexi: 'Yes', cloudbeds: 'Yes', axisrooms: 'Extra Add-on', ezee: 'Extra Fee' },
    { feature: 'Emergency Housekeeping Siren & Vibration Alert', hotelflexi: 'Yes (Patented Audio-Visual Alert)', stayflexi: 'No', cloudbeds: 'No', axisrooms: 'No', ezee: 'No' },
    { feature: 'Contactless Guest Portal (FlexiLink) with ID Upload', hotelflexi: 'Included Free', stayflexi: 'Yes (Magic Link)', cloudbeds: 'Add-on ($)', axisrooms: 'No', ezee: 'Add-on ($)' },
    { feature: 'Bilingual AI Business Agent (Hindi & English Voice)', hotelflexi: 'Yes (Autonomous PMS Actions)', stayflexi: 'English Only', cloudbeds: 'No', axisrooms: 'No', ezee: 'No' },
    { feature: 'Indian GST (12%/18% SAC 9963) Compliant Invoicing', hotelflexi: 'Native Integer-Paise', stayflexi: 'Partial', cloudbeds: 'Requires Plugin', axisrooms: 'Partial', ezee: 'Native' },
    { feature: 'Entry Pricing for Indian Independent Hotels', hotelflexi: '₹499 / month', stayflexi: '$49+ (~₹4,100/mo)', cloudbeds: '$140+ (~₹11,500/mo)', axisrooms: '₹2,500+ / mo', ezee: '₹2,200+ / mo' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-20 overflow-hidden border-b border-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 text-brand-blue border border-blue-200/80 text-xs font-bold uppercase tracking-wider mb-5 shadow-xs backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-brand-blue" />
            <span>India&apos;s Cloud Hospitality Operating System</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.16]">
            Run Your Entire Hotel, Resort &amp; Banquet{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block sm:inline">
              From One Unified Cloud.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Replace 6 fragmented softwares with HotelFlexi: 2-Way OTA Channel Manager (MakeMyTrip, Agoda, Booking.com), Zero-Commission Direct Engine, Contactless Guest FlexiLinks, and Urgent Housekeeping Sirens on staff mobile devices.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Start 14-Day Free Trial</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-xs transition flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4 text-brand-blue" />
              <span>Schedule Live Demo</span>
            </button>
          </div>

          {/* Mobile App Download Pill */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Installable Android App:
            </span>
            <Link href="/download-app" className="font-bold text-brand-blue hover:underline">
              Download APK / Play Store Bundle →
            </Link>
          </div>

          {/* Trust Value Badges */}
          <div className="mt-10 pt-6 border-t border-slate-200/80 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              0% Direct Booking Commission
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2-Way Channel Sync (MMT, Agoda, Booking.com)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              12% &amp; 18% Indian GST Ready
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Hardware Siren Alert on Staff Phones
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              No Credit Card Required
            </span>
          </div>

          {/* Interactive Operating System Showcase */}
          <div className="mt-14 max-w-6xl mx-auto">
            <div className="text-center mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Interactive Product Simulation • Tap to Experience
              </span>
            </div>
            <InteractiveProductShowcase />
          </div>
        </div>
      </section>

      {/* 2. TAILORED FOR INDIAN HOSPITALITY VERTICALS */}
      <section className="py-20 bg-white border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full">
              Tailored For Every Hospitality Business
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Built Specifically for the Realities of Indian Hotels
            </h2>
            <p className="text-base text-slate-600">
              From busy Goa beach resorts to heritage wedding palaces in Rajasthan, HotelFlexi adapts to your operational scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Independent & Boutique Hotels */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center font-bold">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Boutique &amp; City Hotels</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Streamline front desk walk-ins, scan government IDs in 15 seconds, and eliminate OTA commission bleed with your custom direct booking engine.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Instant walk-in registration
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Indian GST 12%/18% invoices
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  2-Way MakeMyTrip &amp; Agoda sync
                </li>
              </ul>
            </div>

            {/* 2. Destination Holiday Resorts */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Holiday &amp; Leisure Resorts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empower resort guests in Goa, Manali, and Rishikesh to order food by the pool or from their cottage via mobile FlexiLinks with instant room charge posting.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  In-stay dining &amp; cottage ordering
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  7-minute housekeeping siren
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Poolside &amp; restaurant table POS
                </li>
              </ul>
            </div>

            {/* 3. Destination Wedding & Banquets */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Weddings &amp; Banquets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Block 20 to 50 rooms in bulk for wedding parties without OTA overbooking conflicts. Manage guest lists and banquet Hall packages seamlessly.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Bulk room group blocking
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Banquet &amp; event amenities
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Custom partial advance deposits
                </li>
              </ul>
            </div>

            {/* 4. Homestays & Luxury Villas */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Homestays &amp; Villas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Operate entirely from your phone. Sync with Airbnb and Booking.com, collect direct UPI payments, and let guests self-check-in with contactless FlexiLinks.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  100% Mobile app management
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Zero hardware or PC needed
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Free Starter tier available
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PLATFORM PILLARS (DEEP DIVE) */}
      <section className="py-24 bg-slate-50/70 border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Pillar 1: 2-Way Channel Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
                PILLAR 01 • DISTRIBUTION
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                2-Way OTA Channel Synchronization Across 100+ Portals
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect your live inventory to MakeMyTrip, Goibibo, Booking.com, Agoda, Airbnb, and Expedia. When a room is booked anywhere, all OTAs are updated in under a second to eliminate double-booking penalties.
              </p>
              <div className="space-y-2.5 pt-2 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sub-second 2-way Availability, Rates, and Inventory (ARI) push</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Channel-specific rate markups (+15% OTA price multiplier to preserve direct margins)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Scheduled automated daily reconciliation to audit rate parity</span>
                </div>
              </div>
              <div className="pt-3">
                <Link
                  href="/channel-manager"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-blue-hover"
                >
                  <span>Explore Channel Manager Features</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-900">
                <span>Active OTA Rate Multiplier</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                  All Synced ✓
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900">Direct Booking Engine</strong>
                    <div className="text-[10px] text-slate-500">Your Official Website</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">₹3,500</span>
                    <span className="block text-[9px] text-emerald-600 font-bold">0% Commission</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900">MakeMyTrip / Goibibo</strong>
                    <div className="text-[10px] text-slate-500">+15% Markup Applied</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">₹4,025</span>
                    <span className="block text-[9px] text-slate-500">Covers OTA Cut</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900">Booking.com</strong>
                    <div className="text-[10px] text-slate-500">+18% Markup Applied</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">₹4,130</span>
                    <span className="block text-[9px] text-slate-500">Covers OTA Cut</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 2: Contactless FlexiLink & Direct Engine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 order-2 lg:order-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-900">
                <span>Direct Razorpay Payment Policy</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                  Direct Bank Settlement
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Advance Deposit Option:</span>
                  <span className="font-bold text-blue-400">20% Partial Advance</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Guest pays 20% advance via UPI/Card to guarantee booking; balance 80% is collected at front desk upon check-in.
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                  <span>Payment Gateway:</span>
                  <span className="font-mono text-emerald-400">Hotelier Direct Key ID</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 order-1 lg:order-2">
              <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                PILLAR 02 • DIRECT REVENUE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Zero-Commission Booking Engine with Custom Advance Rules
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Eliminate middlemen fees entirely. Publish your custom booking portal at <code>/book/[slug]</code> with your photos, amenities, and direct Razorpay checkout.
              </p>
              <div className="space-y-2.5 pt-2 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Flexible advance rules: 100% Full, Partial %, Partial Fixed, or Pay at Hotel</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic guest confirmation emails with encrypted FlexiLink check-in links</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Guests upload government Aadhaar/Passport before arrival to eliminate lobby queues</span>
                </div>
              </div>
              <div className="pt-3">
                <Link
                  href="/booking-engine"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-blue-hover"
                >
                  <span>Explore Direct Booking Engine</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Pillar 3: Hardware Urgency Siren & Housekeeping */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-black uppercase text-red-600 tracking-wider">
                PILLAR 03 • STAFF SPEED
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Patented Housekeeping Urgency Siren on Floor Staff Phones
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                In most hotels, guest complaints get lost on scratch pads or delayed in busy WhatsApp groups. HotelFlexi dispatches a high-priority audible siren and continuous hardware vibration directly to floor staff smartphones.
              </p>
              <div className="space-y-2.5 pt-2 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dual-tone European siren (880Hz / 660Hz) cuts through noisy resort environments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Continuous device vibration pulse loops until staff taps &quot;Pick &amp; Silence Siren&quot;</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Admin and owner dashboards monitor live dispatch: &quot;Taken by Suresh (Housekeeping)&quot;</span>
                </div>
              </div>
              <div className="pt-3">
                <Link
                  href="/hotel-management"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-blue-hover"
                >
                  <span>See How Housekeeping Operations Work</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black text-2xl animate-bounce shrink-0">
                  🚨
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded">
                    7-Minute SLA Timer
                  </span>
                  <h3 className="font-extrabold text-base mt-1">
                    Room 302: Emergency Linen Sanitation
                  </h3>
                </div>
              </div>
              <p className="text-xs text-red-100">
                Dispatched by Guest via FlexiLink. Audible siren sounding on 4 active staff devices across Floor 3.
              </p>
              <div className="p-3 bg-red-700/80 rounded-2xl flex items-center justify-between text-xs font-bold">
                <span>Staff Pickup Status:</span>
                <span className="bg-white text-red-700 px-3 py-1 rounded-xl">
                  Taken by Ramesh (Housekeeping)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPETITOR COMPARISON MATRIX */}
      <section className="py-20 bg-white border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full">
              COMPETITIVE BENCHMARK
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Why Indian Hoteliers Switch to HotelFlexi
            </h2>
            <p className="text-base text-slate-600">
              Compare HotelFlexi against legacy desktop software and expensive overseas platforms.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
              <thead className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Feature / Capability</th>
                  <th className="p-4 bg-brand-blue text-white">HotelFlexi (NovaX AI)</th>
                  <th className="p-4">StayFlexi</th>
                  <th className="p-4">Cloudbeds</th>
                  <th className="p-4">AxisRooms</th>
                  <th className="p-4">eZee / Yanolja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="p-4 font-bold text-slate-900">{row.feature}</td>
                    <td className="p-4 font-black text-brand-blue bg-blue-50/50">{row.hotelflexi}</td>
                    <td className="p-4 text-slate-600">{row.stayflexi}</td>
                    <td className="p-4 text-slate-600">{row.cloudbeds}</td>
                    <td className="p-4 text-slate-600">{row.axisrooms}</td>
                    <td className="p-4 text-slate-600">{row.ezee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
            >
              <span>View In-Depth Technical Comparison Against Each Competitor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. PRICING PLANS */}
      <section className="py-24 bg-slate-50/80 border-b border-border-light" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full">
              TRANSPARENT PRICING
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Simple, Predictable Plans for Indian Hoteliers
            </h2>
            <p className="text-base text-slate-600">
              Zero setup fees. Zero commission on direct bookings. 14-day free trial on all plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`rounded-3xl p-6 transition flex flex-col justify-between border ${
                  p.highlighted
                    ? 'bg-slate-950 text-white border-blue-600 shadow-2xl relative scale-[1.02]'
                    : 'bg-white text-slate-900 border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                    {p.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg">{p.name}</h3>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black">{p.price}</span>
                    <span className={`text-xs ${p.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                      {p.interval}
                    </span>
                  </div>
                  <p className={`mt-2 text-xs leading-relaxed ${p.highlighted ? 'text-slate-300' : 'text-slate-600'}`}>
                    {p.desc}
                  </p>

                  <div className="mt-6 pt-6 border-t border-slate-200/20 space-y-2.5 text-xs">
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className={p.highlighted ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href="/signup"
                    className={`block w-full py-3 rounded-xl font-bold text-xs text-center transition shadow ${
                      p.highlighted
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {p.ctaText}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Dedicated Developer Setup Callout */}
          <div className="mt-12 max-w-4xl mx-auto p-6 rounded-3xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-brand-blue tracking-wider">
                OPTIONAL WHITE-GLOVE SERVICE
              </span>
              <h4 className="text-base font-extrabold text-slate-900">
                Want a Developer to Set Up Your Entire Hotel &amp; OTA Mapping?
              </h4>
              <p className="text-xs text-slate-600">
                Hire a dedicated NovaX AI integration engineer for ₹499 one-time. We configure your rooms, rate plans, Razorpay keys, and MMT credentials.
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-6 py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shrink-0 shadow"
            >
              Learn More &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-20 bg-white border-b border-border-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-start gap-2">
                  <span className="text-brand-blue font-mono">Q.</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 pl-5 leading-relaxed font-normal">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL HIGH-CONVERTING CTA BANNER */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="text-xs font-black uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            INSTANT ACTIVATION
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-3xl mx-auto leading-tight">
            Ready to Automate Your Hotel Operations and Stop Overpaying OTAs?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking hotels across India. Start your 14-day free trial now or book a live 1-on-1 walkthrough.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl transition"
            >
              Start Free 14-Day Trial &rarr;
            </Link>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition"
            >
              Book a Live Demo
            </button>
            <Link
              href="/download-app"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-sm border border-emerald-500/30 transition flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Download Android App</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Book Demo Modal */}
      <BookDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
}
