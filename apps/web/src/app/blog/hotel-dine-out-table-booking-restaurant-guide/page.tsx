import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  UtensilsCrossed,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building,
  QrCode,
  Share2,
  Bell,
  CreditCard,
  ChefHat,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How Hotels & Resorts Unlock 35%+ F&B Revenue With Dine-Out Table Bookings | HotelFlexi',
  description:
    'Discover how Indian hotels and resort kitchens capture high-margin outside dining revenue from tourists and non-resident guests with public Dine-Out table booking links, 100% Pure Veg certification, and instant staff notifications.',
  keywords: [
    'hotel dine out table booking system',
    'resort restaurant reservation software india',
    'pure veg hotel restaurant marketing',
    'hotel f&b revenue optimization',
    'non resident hotel dining booking',
    'hotelflexi dine-out guide',
  ],
  openGraph: {
    title: 'How Hotels & Resorts Unlock 35%+ F&B Revenue With Dine-Out Table Bookings',
    description:
      'Learn how to turn your resort kitchen into an independent profit center using 5-digit hotel codes, public table booking links, and contactless menu ordering.',
    url: 'https://hotelflexi.com/blog/hotel-dine-out-table-booking-restaurant-guide',
  },
};

export default function HotelDineOutGuidePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: 'How Hotels & Resorts Unlock 35%+ F&B Revenue With Dine-Out Table Bookings',
        description:
          'A comprehensive guide for Indian hoteliers on expanding restaurant capacity to non-resident tourists, homestay travelers, and local diners with public Dine-Out links.',
        author: {
          '@type': 'Organization',
          name: 'HotelFlexi Hospitality Intelligence Team',
          url: 'https://hotelflexi.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'HotelFlexi',
          logo: {
            '@type': 'ImageObject',
            url: 'https://hotelflexi.com/logo-dark.png',
          },
        },
        datePublished: '2026-10-20',
        dateModified: '2026-10-20',
        mainEntityOfPage:
          'https://hotelflexi.com/blog/hotel-dine-out-table-booking-restaurant-guide',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Can guests staying at other resorts book a table at my hotel restaurant?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! With HotelFlexi Dine-Out, every hotel receives a dedicated public reservation URL (e.g., hotelflexi.com/dine/58291) and 5-digit code. Guests from neighboring resorts, homestays, or passing tourists can view your digital menu, reserve a table, and even pre-order dishes.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the 100% Pure Veg badge certification work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'HotelFlexi automatically inspects your restaurant menu items. If all active dishes are strictly vegetarian, a verified 100% Pure Veg badge is prominently displayed on your public booking page and search listings, driving high-trust bookings from vegetarian and Jain travelers.',
            },
          },
          {
            '@type': 'Question',
            name: 'How are kitchen staff alerted when a dine-out table is reserved?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'When a diner books a table or pre-orders food, an instant audio-visual push notification is broadcast across staff mobile devices via Firebase Cloud Messaging, ensuring the table is set and kitchen prep begins immediately.',
            },
          },
        ],
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
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30">
              F&amp;B Revenue &amp; Dining
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5" /> 6 min read
            </span>
            <span>•</span>
            <span className="text-slate-300">October 20, 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            How Hotels &amp; Resorts Unlock 35%+ F&amp;B Revenue with Dine-Out Table Bookings
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Why keep your culinary masterchefs and scenic dining courtyards locked behind room keys? Here is how independent hoteliers use public Dine-Out links and 5-digit property codes to capture tourist dining footfall.
          </p>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-16 bg-white border-b border-border-light flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-slate-800 leading-relaxed text-base sm:text-lg">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              1. The Uncaptured Goldmine in Resort Dining
            </h2>
            <p>
              In major holiday destinations across India—such as Goa, Udaipur, Manali, Ooty, and Rishikesh—tourists frequently complain about the lack of authentic, hygienic, and authentic local dining outside crowded street lanes. Concurrently, dozens of premium hotel and resort restaurants operate with 40% empty tables on weekday evenings because they only cater to registered in-house room guests.
            </p>
            <p>
              By opening your hotel restaurant to non-resident diners through a dedicated <strong>Dine-Out portal</strong>, you turn fixed kitchen overheads (chefs, electricity, inventory) into a high-margin revenue engine that generates between ₹1,50,000 and ₹4,00,000 in incremental profit every month.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              2. Seamless Discovery with 5-Digit Hotel Codes
            </h2>
            <p>
              Most third-party food delivery and table booking aggregators demand 15% to 25% commissions and hide your brand behind generic listings. HotelFlexi solves this by equipping every property with:
            </p>
            <ul className="space-y-3 pl-4 border-l-2 border-amber-500">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                <span><strong>Unique 5-Digit Property Code (e.g. #58291):</strong> Easy for guests staying in neighboring resorts or homestays to remember and search at <Link href="/dine-out" className="text-amber-600 font-bold underline">hotelflexi.com/dine-out</Link>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                <span><strong>Direct Booking URL:</strong> A clean, shareable web link (e.g. <code>/dine/58291</code>) that you can post on Google Maps, Instagram, TripAdvisor, and WhatsApp business profiles.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                <span><strong>Standee &amp; Reception QR Codes:</strong> Standees placed at nearby cafes, taxi stands, and viewpoints allowing walk-in tourists to instantly check available table slots.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              3. The Power of 100% Pure Veg Certification
            </h2>
            <p>
              Over 38% of domestic Indian travelers adhere to pure vegetarian or Jain dietary guidelines and actively avoid restaurants serving non-vegetarian cuisine due to cross-contamination concerns.
            </p>
            <p>
              HotelFlexi’s automated <strong>Pure Veg verification engine</strong> scans your active dishes. When your property serves exclusively vegetarian meals, a verified green <em>100% Pure Veg</em> badge is prominently attached to your profile. Properties showcasing this badge report a <strong>42% increase</strong> in family and group table bookings.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              4. Digital Pre-Orders &amp; Payment Flexibility
            </h2>
            <p>
              Nothing ruins a romantic dinner or family celebration like a 45-minute wait for appetizers. When reserving through HotelFlexi Dine-Out, non-guests can browse categorized menus and pre-order their signature dishes in advance.
            </p>
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <h3 className="text-lg font-black text-amber-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-700" />
                Dual Payment Methods
              </h3>
              <p className="text-sm text-amber-800">
                Guests can choose between paying online in advance via UPI, Razorpay, or credit card to confirm their reservation, or paying directly at the restaurant counter after their meal with zero platform commission deductions.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              5. Instant Push Siren Alerts for Kitchen &amp; Stewards
            </h2>
            <p>
              When a booking is confirmed, staff devices run a real-time push notification alert powered by Firebase Cloud Messaging. Stewards receive the guest's name, headcount, selected meal session (Breakfast, Lunch, High Tea, or Dinner), and any dietary pre-orders, preventing double-bookings and table delays.
            </p>
          </section>

          {/* Call to action */}
          <div className="mt-12 p-8 rounded-3xl bg-slate-900 text-white text-center space-y-6">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              Get Started In 2 Minutes
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Fill Your Restaurant Tables Tonight?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              HotelFlexi includes Dine-Out table booking, digital menus, and QR management in the ₹499/month starter plan with 0% commission.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-black text-sm text-white shadow-lg transition"
              >
                Start 14-Day Free Trial
              </Link>
              <Link
                href="/dine-out"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 font-bold text-sm transition"
              >
                Explore Live Dine-Out Portal
              </Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
