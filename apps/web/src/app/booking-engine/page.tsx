'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookDemoModal } from '@/components/BookDemoModal';
import {
  Globe,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Receipt,
  Percent,
  QrCode,
  Image as ImageIcon,
  Check,
  Lock,
} from 'lucide-react';

export default function BookingEnginePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [selectedAdvancePolicy, setSelectedAdvancePolicy] = useState<'full' | 'partial_pct' | 'partial_fixed' | 'pay_at_hotel'>('partial_pct');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-blue-50/60 via-surface-light to-white border-b border-border-light text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-brand-blue border border-blue-200 text-xs font-bold mb-4 shadow-sm">
            <Globe className="w-3.5 h-3.5" />
            Zero Commission Direct Booking Engine
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-content-primary-light tracking-tight leading-[1.15]">
            Convert Website Visitors into Direct Guests.<br />
            <span className="text-brand-blue">Keep 100% of Your Profits.</span>
          </h1>
          <p className="mt-5 text-base sm:text-xl text-content-secondary-light max-w-3xl mx-auto leading-relaxed">
            Stop losing 18% to 25% of your hard-earned room revenue to OTAs. Deploy your branded, mobile-first direct booking engine with direct Razorpay payouts, custom advance rules, and contactless guest FlexiLinks.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-blue text-white font-bold text-sm hover:bg-brand-blue-hover shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              Launch Direct Booking Engine <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border-light bg-white text-content-primary-light font-bold text-sm hover:bg-surface-light transition shadow-sm"
            >
              Book a 1-on-1 Demo
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-content-secondary-light font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> 0% Commission
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Direct Razorpay Credentials
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Partial & Full Advance Policies
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Contactless FlexiLink Included
            </span>
          </div>
        </div>
      </section>

      {/* Direct Payment & Advance Rules Showcase */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
              Direct Hoteliers Payouts
            </span>
            <h2 className="text-3xl font-extrabold text-content-primary-light mt-1">
              Your Money Goes Directly to Your Bank Account
            </h2>
            <p className="mt-3 text-sm text-content-secondary-light leading-relaxed">
              Unlike other platforms that hold guest funds for weeks and deduct transaction markups, HotelFlexi connects directly to your own <strong>Razorpay Key ID and Key Secret</strong>. Guest payments settle instantly into your registered bank account.
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl border border-border-light bg-surface-light flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-content-primary-light">Direct Razorpay API Key Integration</h3>
                  <p className="text-[11px] text-content-secondary-light mt-0.5">
                    Enter your live Razorpay credentials under Hotel Settings. UPI, Google Pay, PhonePe, Debit Cards, and NetBanking activate automatically for your property.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border-light bg-surface-light flex items-start gap-3">
                <Percent className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-content-primary-light">Flexible Advance Payment Policies</h3>
                  <p className="text-[11px] text-content-secondary-light mt-0.5">
                    Decide whether to require 100% full advance payment, a percentage deposit (e.g. 25% or 50%), a fixed token amount (e.g. ₹500), or pay at hotel during check-in.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border-light bg-surface-light flex items-start gap-3">
                <Receipt className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-content-primary-light">Compliant GST Calculation (SAC 9963)</h3>
                  <p className="text-[11px] text-content-secondary-light mt-0.5">
                    Transparent automated tax calculation displays 12% GST (tariffs ≤ ₹7,500) or 18% GST (tariffs &gt; ₹7,500) so guests see clear breakdowns without checkout surprises.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Advance Policy Simulator */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-light">
              <div>
                <span className="text-[10px] font-mono uppercase text-brand-blue font-bold tracking-wider">
                  Live Engine Preview
                </span>
                <h3 className="text-base font-bold text-content-primary-light">The Heritage Grand Resort</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                0% OTA Commission
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-content-primary-light block mb-2">
                Simulate Advance Payment Rule:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAdvancePolicy('partial_pct')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                    selectedAdvancePolicy === 'partial_pct'
                      ? 'bg-blue-50 border-brand-blue text-brand-blue'
                      : 'bg-surface-light border-border-light text-content-secondary-light'
                  }`}
                >
                  25% Partial Advance
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAdvancePolicy('full')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                    selectedAdvancePolicy === 'full'
                      ? 'bg-blue-50 border-brand-blue text-brand-blue'
                      : 'bg-surface-light border-border-light text-content-secondary-light'
                  }`}
                >
                  100% Full Advance
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAdvancePolicy('partial_fixed')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                    selectedAdvancePolicy === 'partial_fixed'
                      ? 'bg-blue-50 border-brand-blue text-brand-blue'
                      : 'bg-surface-light border-border-light text-content-secondary-light'
                  }`}
                >
                  ₹1,000 Fixed Token
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAdvancePolicy('pay_at_hotel')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                    selectedAdvancePolicy === 'pay_at_hotel'
                      ? 'bg-blue-50 border-brand-blue text-brand-blue'
                      : 'bg-surface-light border-border-light text-content-secondary-light'
                  }`}
                >
                  Pay at Check-In
                </button>
              </div>
            </div>

            {/* Price Breakdown Calculation */}
            <div className="p-4 rounded-2xl bg-surface-light border border-border-light space-y-2 text-xs">
              <div className="flex justify-between text-content-secondary-light">
                <span>Deluxe Luxury King (2 Nights)</span>
                <span className="font-semibold text-content-primary-light">₹6,000</span>
              </div>
              <div className="flex justify-between text-content-secondary-light">
                <span>GST (12% SAC 9963)</span>
                <span className="font-semibold text-content-primary-light">₹720</span>
              </div>
              <div className="pt-2 border-t border-border-light flex justify-between font-bold text-sm text-content-primary-light">
                <span>Total Booking Bill</span>
                <span>₹6,720</span>
              </div>

              <div className="pt-2 mt-2 border-t border-blue-200 bg-blue-50/60 -mx-4 -mb-4 p-4 rounded-b-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-blue">
                    {selectedAdvancePolicy === 'full'
                      ? 'Amount Payable Right Now (100%):'
                      : selectedAdvancePolicy === 'partial_pct'
                      ? 'Amount Payable Right Now (25% Advance):'
                      : selectedAdvancePolicy === 'partial_fixed'
                      ? 'Amount Payable Right Now (Fixed Token):'
                      : 'Amount Payable Right Now:'}
                  </span>
                  <span className="text-base font-extrabold text-brand-blue">
                    {selectedAdvancePolicy === 'full'
                      ? '₹6,720'
                      : selectedAdvancePolicy === 'partial_pct'
                      ? '₹1,680'
                      : selectedAdvancePolicy === 'partial_fixed'
                      ? '₹1,000'
                      : '₹0 (Pay at Desk)'}
                  </span>
                </div>
                {selectedAdvancePolicy !== 'full' && selectedAdvancePolicy !== 'pay_at_hotel' && (
                  <p className="text-[10px] text-content-secondary-light mt-1">
                    Balance of {selectedAdvancePolicy === 'partial_pct' ? '₹5,040' : '₹5,720'} will be collected seamlessly during front-desk check-in.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover shadow transition flex items-center justify-center gap-2"
            >
              <span>Instant Pay via UPI / Card / NetBanking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Guest FlexiLink Deep Dive */}
      <section className="py-20 bg-surface-light border-y border-border-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-brand-blue" />
                  <span className="font-bold text-xs">Guest FlexiLink Experience</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Auto-Expires 7 Days Post-Checkout
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">Guest: Rajesh Sharma</h3>
                    <p className="text-[11px] text-slate-400">Room 302 • Deluxe King • 2 Nights</p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Check-in Complete
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-3 rounded-xl bg-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Wi-Fi Password</span>
                    <span className="font-mono font-bold text-xs text-white">HERITAGE@2026</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Aadhaar Verification</span>
                    <span className="text-xs font-bold text-emerald-400">Verified & Uploaded</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-900 flex items-center justify-between">
                  <span className="text-xs text-blue-200 font-medium">In-Room Dining (Dino POS)</span>
                  <span className="text-xs font-bold text-brand-blue">Order Food Online →</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Guests access this directly via WhatsApp/Email link or download the HotelFlexi guest app with 1 click.
              </p>
            </div>

            <div className="order-1 lg:order-2 space-y-5">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                Patented Contactless Flow
              </span>
              <h2 className="text-3xl font-extrabold text-content-primary-light">
                Digital Check-In with Guest FlexiLinks
              </h2>
              <p className="text-sm text-content-secondary-light leading-relaxed">
                Send a personalized FlexiLink via SMS, WhatsApp, or confirmation email. Guests can upload their government ID (Aadhaar or Passport) before arrival, view room details, connect to property Wi-Fi, and order food directly from their smartphone.
              </p>

              <ul className="space-y-3 text-xs text-content-secondary-light">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />
                  <span><strong>Zero App Login Barrier:</strong> Direct tokenized authentication skips frustrating password creation for travelers.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />
                  <span><strong>Instant Play Store Integration:</strong> Guest app download link (<a href="https://play.google.com/store/apps/details?id=in.novaxai.hotelflexi" target="_blank" rel="noreferrer" className="text-brand-blue underline">in.novaxai.hotelflexi</a>) automatically routes guests into their personalized booking portal.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />
                  <span><strong>Automated Data Expiration:</strong> All sensitive guest IDs and digital key privileges are strictly removed 7 days after checkout for total compliance.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Property Customization Features */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Full Creative Control</span>
          <h2 className="text-3xl font-extrabold text-content-primary-light mt-1">
            Build Your Property Brand Identity
          </h2>
          <p className="text-sm text-content-secondary-light mt-2">
            Customize your direct booking site to reflect the unique atmosphere of your boutique hotel or resort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border-light bg-white space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-content-primary-light">High-Res Galleries & Amenities</h3>
            <p className="text-xs text-content-secondary-light leading-relaxed">
              Upload multiple images per room category, showcase swimming pools, conference halls, and banquet spaces with fast CDN rendering.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border-light bg-white space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-content-primary-light">Branded Slug & Custom Domain</h3>
            <p className="text-xs text-content-secondary-light leading-relaxed">
              Host your booking portal at <code>/book/your-hotel-name</code> or link your existing WordPress/Wix website with simple booking widget embed buttons.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border-light bg-white space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-content-primary-light">Flexible Cancellation Rules</h3>
            <p className="text-xs text-content-secondary-light leading-relaxed">
              Define transparent cancellation policies (Free cancellation up to 48 hours, non-refundable discount deals, or seasonal peak policies).
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-brand-blue text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Start Accepting Direct Bookings Today
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Zero commission. Direct bank payouts via Razorpay. Setup takes less than 5 minutes.
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