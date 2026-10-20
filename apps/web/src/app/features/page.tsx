'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookDemoModal } from '@/components/BookDemoModal';
import {
  Calendar,
  Globe,
  Layers,
  Receipt,
  BedDouble,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Users,
  CheckCircle2,
  ChevronRight,
  UtensilsCrossed,
  BellRing,
  Smartphone,
  PhoneCall,
  Clock,
  ArrowRight,
  HeartHandshake,
  Check,
} from 'lucide-react';

export default function FeaturesPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  const categories = [
    {
      title: 'Cloud PMS & Front Desk',
      badge: 'Core Operating System',
      desc: 'Everything required to run front-desk check-ins, reservations, room allocations, and guest folios without paper or slow software.',
      items: [
        {
          name: 'Interactive Calendar Grid',
          desc: 'Visual multi-day occupancy grid with drag-and-drop bookings, real-time status badges, and instant room assignment.',
        },
        {
          name: 'Bulk Room Code Generator',
          desc: 'Create entire wings or floors in seconds (e.g. 101 to 125, 201 to 225) with automatic category linking and occupancy limits.',
        },
        {
          name: 'Click-to-Call Guest Dialer',
          desc: 'Native device dialer integration directly in guest ledgers and arrival lists for rapid front-desk coordination.',
        },
        {
          name: 'Future Date Room Blockage',
          desc: 'Block rooms for maintenance or VIP holds with conflict prevention and automated stop-sell pushes to all OTAs.',
        },
      ],
      link: '/hotel-management',
      cta: 'Explore PMS Features',
    },
    {
      title: 'OTA Channel Manager',
      badge: '2-Way Real-Time Sync',
      desc: 'Direct sub-2-second synchronization with MakeMyTrip, Agoda, Booking.com, Airbnb, and Expedia to eliminate double bookings.',
      items: [
        {
          name: 'Sub-2s Real-Time ARI Push',
          desc: 'Availability, rates, and inventory push across all remote OTAs the instant a room is booked anywhere.',
        },
        {
          name: 'Channel Rate Multipliers',
          desc: 'Offset 18%–25% OTA commissions by applying custom percentage markups per channel (e.g. +15% on Booking.com).',
        },
        {
          name: 'Single-Click Stop-Sell & Min-Stay',
          desc: 'Restrict OTA sales during peak holiday weekends or wedding buyouts to save rooms for high-margin direct guests.',
        },
        {
          name: 'Scheduled 02:00 UTC Reconciliation',
          desc: 'Automated nightly integrity audit ensures your local PMS inventory exactly matches all remote extranets.',
        },
      ],
      link: '/channel-manager',
      cta: 'Explore Channel Manager',
    },
    {
      title: 'Direct Booking Engine',
      badge: '0% OTA Commission',
      desc: 'Mobile-first, high-converting booking portal published at /book/[property-slug] that deposits 100% of guest payments directly into your bank.',
      items: [
        {
          name: 'Direct Razorpay Credentials',
          desc: 'Hoteliers plug in their own Razorpay Key ID and Secret so guest funds settle directly without platform intermediaries.',
        },
        {
          name: 'Custom Advance Payment Rules',
          desc: 'Choose between 100% full advance, percentage deposit (e.g. 25% or 50%), fixed token (₹500), or pay at hotel during check-in.',
        },
        {
          name: 'Transparent GST Calculation',
          desc: 'Automatic Indian GST breakdown (12% for tariffs ≤ ₹7,500, 18% for &gt; ₹7,500) under SAC 9963 displayed at checkout.',
        },
        {
          name: 'Dynamic Property Showcase',
          desc: 'High-res image galleries, amenities list, location maps, and flexible cancellation rules designed to build guest trust.',
        },
      ],
      link: '/booking-engine',
      cta: 'Explore Direct Engine',
    },
    {
      title: 'Contactless Guest FlexiLink',
      badge: 'Zero Password Friction',
      desc: 'A personalized digital concierge portal sent to guests via WhatsApp or SMS that eliminates physical front-desk queues.',
      items: [
        {
          name: 'Aadhaar & Passport ID Upload',
          desc: 'Guests upload government IDs securely from their smartphone before arrival for instant paperless check-in.',
        },
        {
          name: 'Digital Room Key & Wi-Fi Password',
          desc: 'Self-serve access to property Wi-Fi credentials, digital keys, and receptionist assistance contacts.',
        },
        {
          name: 'In-Room Dining (Dino POS)',
          desc: 'Browse digital restaurant menus with Veg/Non-Veg filters and place direct room service orders.',
        },
        {
          name: '7-Day Post-Checkout Auto-Expiry',
          desc: 'Strict privacy enforcement automatically deletes temporary token access 7 days after checkout.',
        },
      ],
      link: '/booking-engine',
      cta: 'Explore Guest FlexiLink',
    },
    {
      title: 'Urgent Siren Housekeeping Alerts',
      badge: '7-Minute Turnaround',
      desc: 'Patented high-frequency audio sirens and physical device vibrations on staff smartphones for rapid room turnaround.',
      items: [
        {
          name: 'Dual-Tone Acoustic Siren',
          desc: '880Hz / 660Hz penetrating alarm alerts on-duty housekeeping staff the second a room checkout is logged.',
        },
        {
          name: 'Staff Claim & Lock Tracking',
          desc: 'First staff member to tap "Claim Task" silences the siren across all other staff devices and claims the room.',
        },
        {
          name: 'Admin Panel Claim Attribution',
          desc: 'Front-desk and hotel owners see exactly which staff member accepted the cleaning task in real time.',
        },
        {
          name: 'Cleanliness Verification Workflow',
          desc: 'Inspectors verify room readiness before releasing the room back into available PMS inventory.',
        },
      ],
      link: '/hotel-management',
      cta: 'Explore Housekeeping Siren',
    },
    {
      title: 'Bilingual AI Business Agent',
      badge: 'English, Hindi & Hinglish',
      desc: 'Operate your hotel using everyday conversational speech or text commands without navigating menus.',
      items: [
        {
          name: 'Natural Language Room Blockage',
          desc: 'Instruct: "Block Room 101 tomorrow to 25th for AC maintenance" to validate conflicts and push stop-sells instantly.',
        },
        {
          name: 'Voice Tariff Overrides',
          desc: 'Say: "Weekend ka rate ₹3,800 kar do sabhi Deluxe rooms ke liye" to apply rate surcharges across all channels.',
        },
        {
          name: 'Arrivals & Balance Roster',
          desc: 'Ask: "Kal kitne arrivals hain?" to get a structured summary of arriving guests, room numbers, and unpaid balances.',
        },
        {
          name: 'Zero Raw SQL Architecture',
          desc: 'Deterministic function-calling preserves tenant security and logs an immutable audit trail for every action.',
        },
      ],
      link: '/ai-hotel-agent',
      cta: 'Explore AI Assistant',
    },
    {
      title: 'Dine-In & Restaurant POS (Dino)',
      badge: 'F&B Operations',
      desc: 'Complete restaurant and in-room dining point-of-sale system integrated directly into your front desk billing folio.',
      items: [
        {
          name: 'Strict 100% Pure Veg Validation',
          desc: 'Smart UI safeguards prevent marking a restaurant as 100% Pure Veg whenever non-veg dishes exist on the active menu.',
        },
        {
          name: 'Table QR Code Ordering',
          desc: 'Guests scan table QR codes to place orders directly without waiting for physical paper menus.',
        },
        {
          name: 'Direct Room Folio Bill Transfer',
          desc: 'Transfer food bills directly to the guest’s room folio for consolidated GST invoice generation at final checkout.',
        },
        {
          name: 'Kitchen Order Ticket (KOT) Dispatch',
          desc: 'Orders route instantly to kitchen staff with special dietary instructions and table numbering.',
        },
      ],
      link: '/hotel-management',
      cta: 'Explore Restaurant POS',
    },
    {
      title: 'Indian GST Billing & Finance',
      badge: '100% Tax Compliant',
      desc: 'Built specifically for Indian tax laws with SAC 9963 compliance, integer paise precision, and print-ready tax invoices.',
      items: [
        {
          name: 'Dual GST Slabs (12% & 18%)',
          desc: 'Dynamic automatic calculation based on room tariff slabs (≤ ₹7,500 = 12% GST, &gt; ₹7,500 = 18% GST).',
        },
        {
          name: 'Multi-Payment Ledger',
          desc: 'Record split payments across UPI, Credit/Debit cards, Cash, and Online Payment Gateways with balance tracking.',
        },
        {
          name: 'Integer Paise Rounding',
          desc: 'All calculations are computed in integer paise to avoid rounding discrepancies with government GST portals.',
        },
        {
          name: 'P&L and ADR Revenue Analytics',
          desc: 'Track Average Daily Rate (ADR), RevPAR, occupancy percentages, and net operating profit in real time.',
        },
      ],
      link: '/hotel-management',
      cta: 'Explore GST Billing',
    },
    {
      title: 'Native Mobile App (Android APK & AAB)',
      badge: 'Play Store Ready',
      desc: 'A true native installable mobile app with official Android 13+ runtime notification permissions and background alerts.',
      items: [
        {
          name: 'Official POST_NOTIFICATIONS Support',
          desc: 'Requests notification access via the native Android OS permission dialog for guaranteed push delivery.',
        },
        {
          name: 'Hardware Vibration & Siren Alert',
          desc: 'Triggers device vibration patterns and audible sirens for urgent housekeeping calls and guest complaints.',
        },
        {
          name: 'Universal APK & Production AAB',
          desc: 'Direct 1-click APK download available for staff phones alongside production Google Play Store AAB packages.',
        },
        {
          name: 'Role-Based Mobile View',
          desc: 'Automatically simplifies screens for housekeeping staff to prioritize room turnover without exposing accounting.',
        },
      ],
      link: '/download-app',
      cta: 'Download Mobile App',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-blue-50/60 via-surface-light to-white border-b border-border-light text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-brand-blue border border-blue-200 text-xs font-bold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Comprehensive Platform Matrix
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-content-primary-light tracking-tight leading-[1.15]">
            Every Hospitality Tool You Need.<br />
            <span className="text-brand-blue">One Unified Operating System.</span>
          </h1>
          <p className="mt-5 text-base sm:text-xl text-content-secondary-light max-w-3xl mx-auto leading-relaxed">
            From the front-desk calendar and 2-way OTA distribution to patented housekeeping sirens, direct Razorpay booking engines, and bilingual AI. Explore the verified capabilities of HotelFlexi.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              Start Free 14-Day Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border-light bg-white text-content-primary-light font-bold text-sm hover:bg-surface-light transition shadow-sm"
            >
              Book a 1-on-1 Demo
            </button>
          </div>
        </div>
      </section>

      {/* Categorized Features Matrix */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {categories.map((cat, idx) => (
          <div
            key={cat.title}
            className="p-8 sm:p-10 rounded-3xl bg-white border border-border-light shadow-sm hover:shadow-md transition space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border-light gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-brand-blue border border-blue-200 mb-2">
                  {cat.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-content-primary-light">{cat.title}</h2>
                <p className="text-sm text-content-secondary-light mt-1.5 max-w-2xl leading-relaxed">
                  {cat.desc}
                </p>
              </div>

              <Link
                href={cat.link}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-light border border-border-light text-content-primary-light font-bold text-xs hover:bg-white hover:border-brand-blue hover:text-brand-blue transition self-start md:self-auto shrink-0"
              >
                <span>{cat.cta}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cat.items.map((item) => (
                <div key={item.name} className="p-5 rounded-2xl bg-surface-light border border-border-light/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />
                    <h3 className="text-sm font-bold text-content-primary-light">{item.name}</h3>
                  </div>
                  <p className="text-xs text-content-secondary-light leading-relaxed pl-6">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-brand-blue text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Modernize Your Hotel in Less Than 10 Minutes
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Join hundreds of independent hoteliers, heritage resorts, and homestays scaling direct bookings and stopping overbookings with HotelFlexi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-brand-blue font-extrabold text-sm hover:bg-blue-50 shadow-lg transition"
            >
              Start Free 14-Day Trial
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/30 text-white font-bold text-sm hover:bg-white/10 transition"
            >
              Schedule Live Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <BookDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}