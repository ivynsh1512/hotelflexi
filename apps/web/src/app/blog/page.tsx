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
  Layers,
  Bell,
  Cpu,
  Receipt,
  Tag,
  UtensilsCrossed,
  Smartphone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi Hospitality & Tech Blog — AI, Channel Management & PMS Insights',
  description:
    'Expert hospitality guides, hotel management best practices, 2-way OTA distribution tactics, Indian GST invoicing rules, and autonomous AI automation for hotel owners.',
  keywords: [
    'hotel management blog india',
    'hospitality tech insights',
    'hotel channel manager guide',
    'ai in hotel operations',
    'hotel housekeeping siren alerts',
    'indian hotel gst billing guide',
  ],
  openGraph: {
    title: 'HotelFlexi Hospitality & Tech Blog',
    description:
      'Guides and strategies to increase direct hotel bookings, prevent OTA overselling, and automate front-desk operations.',
    url: 'https://hotelflexi.com/blog',
  },
};

export default function BlogHubPage() {
  const posts = [
    {
      slug: 'hotel-dine-out-table-booking-restaurant-guide',
      title: 'How Hotels & Resorts Unlock 35%+ F&B Revenue With Dine-Out Table Bookings',
      excerpt:
        'Discover how Indian hotels and resort kitchens capture high-margin outside dining revenue from tourists and non-resident guests with public Dine-Out links, 100% Pure Veg certification, and instant staff notifications.',
      category: 'F&B Revenue & Dining',
      readTime: '6 min read',
      date: 'Oct 20, 2026',
      icon: UtensilsCrossed,
      gradient: 'from-amber-600 to-orange-600',
    },
    {
      slug: 'contactless-guest-portal-self-check-in-flexilink',
      title: 'The Ultimate Guide to FlexiLink: Contactless Guest Self Check-In & In-Stay Orders',
      excerpt:
        'Eliminate lobby check-in queues, collect verified government IDs and child proofs, and empower guests to order food directly from their phones with automated WhatsApp/Email FlexiLinks.',
      category: 'Guest Experience & Tech',
      readTime: '5 min read',
      date: 'Oct 20, 2026',
      icon: Smartphone,
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      slug: 'how-to-automate-hotel-operations-with-ai',
      title: 'How Indian Hoteliers Are Automating Front Desk, Reservations & Check-Ins with Autonomous AI',
      excerpt:
        'Discover how modern hotels use bilingual AI agents to handle phone inquiries, auto-allocate clean rooms, send WhatsApp FlexiLinks, and eliminate check-in queues.',
      category: 'AI & Automation',
      readTime: '6 min read',
      date: 'Oct 19, 2026',
      icon: Cpu,
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      slug: 'streamline-housekeeping-with-urgent-siren-alerts',
      title: 'Why Urgent Siren Alerts for Housekeeping Solve Guest Complaints in Under 7 Minutes',
      excerpt:
        'Learn how an audio-visual siren system on staff mobile devices ends intercom miscommunication, turns dirty linen and washroom complaints into instant resolutions, and boosts TripAdvisor ratings.',
      category: 'Front Desk & Housekeeping',
      readTime: '5 min read',
      date: 'Oct 16, 2026',
      icon: Bell,
      gradient: 'from-rose-600 to-red-600',
    },
    {
      slug: 'hotel-pms-gst-billing-guide-india',
      title: 'Complete Guide to Indian Hotel GST Invoicing (12% vs 18% SAC 9963) & Compliance',
      excerpt:
        'Master Indian hospitality taxation. Understand room tariff thresholds, restaurant food tax applicability, SAC 9963 rules, and how to automate GST folios with HotelFlexi.',
      category: 'Finance & Compliance',
      readTime: '7 min read',
      date: 'Oct 14, 2026',
      icon: Receipt,
      gradient: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-900 to-slate-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Hospitality Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            HotelFlexi Hospitality &amp; Technology Blog
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Proven playbooks, automation insights, and revenue optimization tactics tailored for independent hotels, boutique homestays, and resorts in India.
          </p>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <section className="py-16 bg-surface-light border-b border-border-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => {
              const IconComp = post.icon;
              return (
                <article
                  key={post.slug}
                  className="bg-white rounded-3xl border border-border-light shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg hover:border-brand-blue/30 transition group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-brand-blue border border-blue-200">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-content-secondary-light">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    <Link href={`/blog/${post.slug}`} className="block group-hover:text-brand-blue transition">
                      <h2 className="text-xl font-black text-content-primary-light group-hover:text-brand-blue transition leading-snug">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-content-secondary-light mt-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border-light flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">{post.date}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs font-bold text-brand-blue hover:text-brand-blue-hover flex items-center gap-1 group-hover:translate-x-0.5 transition"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Transform Your Hotel Management?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Experience HotelFlexi with a 14-day free trial. Full 2-way OTA channel manager, autonomous AI assistant, and urgency siren for just ₹499/mo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover transition shadow-lg"
            >
              Start Free Trial Now
            </Link>
            <Link
              href="/compare"
              className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm hover:bg-slate-700 transition border border-slate-700"
            >
              Compare with Competitors
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
