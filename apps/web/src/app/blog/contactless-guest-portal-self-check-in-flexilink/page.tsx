import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  FileCheck2,
  Utensils,
  Lock,
  ArrowRight,
  Send,
  Users,
  CreditCard,
  Building,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contactless Guest Self Check-In & FlexiLink Guide | HotelFlexi',
  description:
    'Complete guide to automated hotel self check-in via FlexiLink. Enable digital government ID upload, child birth certificate verification, in-stay room service orders, and 7-day auto-purge for 100% guest privacy.',
  keywords: [
    'hotel self check in link',
    'contactless hotel check in india',
    'flexilink hotel guest portal',
    'hotel guest government id proof upload',
    'in stay hotel food ordering software',
    'hotel digital guest journey',
  ],
  openGraph: {
    title: 'The Ultimate Guide to FlexiLink: Contactless Guest Self Check-In & In-Stay Orders',
    description:
      'Learn how Indian hotels eliminate front-desk queues, collect verified government IDs, and boost room service revenue using automated WhatsApp and Email FlexiLinks.',
    url: 'https://hotelflexi.com/blog/contactless-guest-portal-self-check-in-flexilink',
  },
};

export default function FlexiLinkGuidePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: 'The Ultimate Guide to FlexiLink: Contactless Guest Self Check-In & In-Stay Orders',
        description:
          'Comprehensive playbook for Indian hospitality properties on implementing contactless self check-in, Aadhaar/Passport proof uploads, and room service ordering.',
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
          'https://hotelflexi.com/blog/contactless-guest-portal-self-check-in-flexilink',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does the guest receive their FlexiLink?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The moment a reservation is created (via direct engine, OTA, or front-desk manual booking), HotelFlexi automatically dispatches a unique encrypted FlexiLink to the guest via both WhatsApp and Email.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are children required to upload government ID proof during check-in?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Only if children are included in the reservation. For children under 10, a birth proof or school ID is optionally requested. For guests 10 and above, standard adult government identity proof is required, complying with local police guidelines.',
            },
          },
          {
            '@type': 'Question',
            name: 'What happens to the guest URL and uploaded IDs after check-out?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'In adherence to Indian data privacy best practices, the guest self check-in link automatically expires and is permanently deactivated 7 days after the checkout date. Crucially, the guest historical record (name, contact, booking folio) remains safely preserved in the hotelier’s master ledger.',
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
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue mb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Guest Experience &amp; Tech
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5" /> 5 min read
            </span>
            <span>•</span>
            <span className="text-slate-300">October 20, 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            The Ultimate Guide to FlexiLink: Contactless Guest Self Check-In &amp; In-Stay Orders
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Eliminate lobby queues during long weekends, automate police-compliant government ID collection, and empower guests to order food directly from their phones with automated FlexiLinks.
          </p>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-16 bg-white border-b border-border-light flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-slate-800 leading-relaxed text-base sm:text-lg">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              1. The 3:00 PM Lobby Check-In Nightmare
            </h2>
            <p>
              Every Indian hotelier dreads the 2:00 PM to 4:00 PM check-in rush on Friday afternoons. Ten families arrive simultaneously after a 6-hour road trip. Front desk staff scramble between paper registration forms, photocopying Aadhaar cards, and taking payment cards. Guests wait 25 minutes just to receive their room keys, starting their vacation on an irritated note.
            </p>
            <p>
              With <strong>FlexiLink</strong>, the entire check-in journey shifts to the guest's smartphone before they even reach your property gates.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              2. How Automated FlexiLink Works
            </h2>
            <p>
              As soon as a reservation is booked—whether through MakeMyTrip, Agoda, your direct website booking engine, or walk-in phone reservation—HotelFlexi generates a secure tokenized link sent directly to the guest’s WhatsApp and email:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <FileCheck2 className="w-6 h-6 text-brand-blue" />
                <h3 className="font-bold text-slate-900 text-sm">Aadhaar &amp; Govt ID Capture</h3>
                <p className="text-xs text-slate-600">
                  Only one primary guest ID is mandatory for the room, with quick camera capture from their phone.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <Users className="w-6 h-6 text-brand-blue" />
                <h3 className="font-bold text-slate-900 text-sm">Conditional Child Proof</h3>
                <p className="text-xs text-slate-600">
                  Only displays the child birth proof field if children are entered in the reservation. Children under 10 qualify for child rates configured by the hotelier.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <Utensils className="w-6 h-6 text-brand-blue" />
                <h3 className="font-bold text-slate-900 text-sm">In-Stay Room Service Ordering</h3>
                <p className="text-xs text-slate-600">
                  Guests browse live room service menus, place breakfast or dinner orders, and view live preparation status.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <CreditCard className="w-6 h-6 text-brand-blue" />
                <h3 className="font-bold text-slate-900 text-sm">Settlement &amp; Express Checkout</h3>
                <p className="text-xs text-slate-600">
                  Guests inspect live billing folios, pay balance via UPI / Card, or choose cash to front desk upon departure.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              3. Privacy By Design: The 7-Day Auto-Purge
            </h2>
            <p>
              Security and data privacy are paramount in modern hospitality. Unlike open web links that remain active indefinitely, HotelFlexi employs an automated <strong>7-Day Post-Checkout Expiration Policy</strong>:
            </p>
            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
              <h3 className="font-black text-blue-900 flex items-center gap-2 text-base">
                <Lock className="w-5 h-5 text-brand-blue" />
                Automatic Token Invalidation
              </h3>
              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                Seven days after the guest checks out, their private FlexiLink URL is permanently invalidated, protecting guest ID photos from unauthorized access. Crucially, your master property ledger retains the guest’s contact history, room nights, and revenue records for loyalty marketing and accounting audits.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              4. Elevating In-Stay Food &amp; Beverage Spend
            </h2>
            <p>
              Guests frequently avoid ordering room service because physical printed menus are often missing, outdated, or greasy. With FlexiLink, your full culinary catalog is right at their fingertips with high-resolution food photography and 100% Pure Veg filters.
            </p>
            <p>
              Properties implementing FlexiLink report an average <strong>28% increase</strong> in room-service F&amp;B volume, with orders delivered seamlessly without room-to-kitchen miscommunication.
            </p>
          </section>

          {/* Call to action */}
          <div className="mt-12 p-8 rounded-3xl bg-slate-900 text-white text-center space-y-6">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider">
              Zero Commissions • Instant Setup
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              Automate Your Guest Experience Starting at ₹499/Month
            </h3>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Empower your guests with contactless self check-in, in-stay food orders, and digital billing included in every HotelFlexi plan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover font-black text-sm text-white shadow-lg transition"
              >
                Start 14-Day Free Trial
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 font-bold text-sm transition"
              >
                Compare Pricing Plans
              </Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
