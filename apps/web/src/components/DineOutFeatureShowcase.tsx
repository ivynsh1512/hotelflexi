import React from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Bell,
  CreditCard,
  Building,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';

export const DineOutFeatureShowcase: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-amber-50/40 via-white to-white border-b border-border-light overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text / Features */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black uppercase tracking-wider">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />
              New Feature: Dine-Out For Resorts &amp; Hotels
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Turn Your Resort Restaurant into a Destination.
            </h2>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Don't limit your restaurant to in-house guests. With HotelFlexi Dine-Out, travelers staying at neighboring resorts, boutique homestays, or visiting the city can book tables, browse your digital menu, and dine at your property.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    100% Pure Veg Certification Label
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Auto-Verified
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Properties serving exclusively vegetarian menus automatically receive a prominent Pure Veg trust badge, driving family and pilgrimage tourism bookings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Configurable Meal Slots &amp; Timings</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define opening and closing times for Breakfast (07:30 - 10:30), Lunch (12:30 - 15:30), High Tea, and Dinner (19:30 - 23:00) with seat capacity limits.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Pay Online or Pay at Restaurant</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Guests can pre-pay via UPI QR or Razorpay in the app, or settle their bill with cash/card directly at the restaurant counter after their meal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Instant Staff &amp; Owner Notification</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Staff and management receive instant push and in-app alerts whenever a table is booked, detailing guest count, arrival time, and pre-ordered dishes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Link
                href="/dine-out"
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition shadow-md flex items-center gap-1.5"
              >
                Explore Dine-Out Platform
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs transition"
              >
                Set Up Your Restaurant
              </Link>
            </div>
          </div>

          {/* Right Visual Card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">The Royal Spice Courtyard</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-400">Hotel Code: #58291</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                        🟢 100% Pure Veg
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400">Open 07:00 - 23:00</span>
              </div>

              {/* Simulated Live Table Booking Alert */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 animate-bounce" />
                    New Dine-Out Booking Alert
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                </div>
                <div className="text-xs text-slate-200">
                  <strong className="text-white">Rajesh &amp; Sunita Singhal</strong> (Staying at <em>Woodlands Valley Resort</em>) booked a table for <strong className="text-white">4 guests</strong> for Dinner at <strong className="text-white">08:30 PM</strong>.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>Pre-order: Paneer Butter Masala (2), Garlic Naan (4)</span>
                  <span className="text-emerald-400 font-bold">₹1,450 (Paid Online)</span>
                </div>
              </div>

              {/* Sample Digital Menu Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Live Menu Highlights
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Dal Makhani
                      </div>
                      <div className="text-[10px] text-slate-400">Slow cooked 16 hrs</div>
                    </div>
                    <span className="font-black text-amber-400">₹320</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Paneer Tikka
                      </div>
                      <div className="text-[10px] text-slate-400">Clay oven roasted</div>
                    </div>
                    <span className="font-black text-amber-400">₹380</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Guest Dine-Out URL:</span>
                <span className="text-blue-400 font-mono underline">hotelflexi.novaxai.in/dine/58291</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
