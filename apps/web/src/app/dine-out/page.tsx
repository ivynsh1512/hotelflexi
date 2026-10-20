'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DineOutSearchBar } from '@/components/DineOutSearchBar';
import { apiClient } from '@/lib/api';
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
  ShieldCheck,
  MapPin,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function DineOutLandingPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await apiClient('/dining/public-featured');
        setRestaurants(res.restaurants || []);
      } catch (e) {
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-20 bg-gradient-to-b from-amber-50/50 via-white to-white border-b border-border-light text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black uppercase tracking-wider">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />
            Hotel &amp; Resort Dine-Out Network
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Dine at Top Resorts. <br />
            <span className="text-amber-600">Even If You're Not Staying There.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover exquisite hotel dining, royal thalis, and pure vegetarian feasts. Guests staying at other resorts, homestays, or tourists can reserve tables, view menus, and dine seamlessly.
          </p>

          {/* Quick 5-Digit Code Search Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <DineOutSearchBar />
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Tip: Ask your hotel reception or check promotional QR codes for the 5-digit code.
            </p>
          </div>
        </div>
      </section>

      {/* Real Featured Venues */}
      <section className="py-20 bg-slate-50 border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">Curated Destinations</span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
                Featured Resort Restaurants
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Open to outside guests &amp; in-house residents
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : restaurants.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-xl mx-auto shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Featured Restaurants Listed Yet</h3>
                <p className="text-xs text-slate-500">
                  Resort and hotel owners can list their restaurant in under 2 minutes from their HotelFlexi dashboard to accept outside diner reservations.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shadow"
                >
                  List Your Restaurant
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {restaurants.map((v) => (
                <div
                  key={v.id}
                  className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100 flex items-center justify-center">
                    <UtensilsCrossed className="w-12 h-12 text-slate-300" />
                    {v.is_pure_veg === 1 && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        100% Pure Veg
                      </div>
                    )}
                    {v.hotel_code && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur text-white text-xs font-mono font-bold">
                        Code: #{v.hotel_code}
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {(v.city || v.state) && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          {[v.city, v.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                      <h3 className="text-lg font-black text-slate-900 mt-1">{v.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{v.property_name}</p>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{v.cuisine_type || v.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                        {v.open_time} - {v.close_time}
                      </div>
                      <Link
                        href={`/dine/${v.hotel_code || v.property_slug || v.id}`}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1 shadow"
                      >
                        Book Table
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* For Hoteliers & Resort Owners */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-brand-blue border border-blue-200 text-xs font-bold uppercase tracking-wider">
            For Hotel &amp; Resort Operators
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Turn Your Kitchen Into a Profit Center
          </h2>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Enable Dine-Out in your HotelFlexi dashboard in under 2 minutes. Add your dishes, set your open hours, certify pure veg status, and start taking high-margin dining bookings with zero commissions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition shadow-lg"
            >
              Enable Dine-Out (Free Trial)
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 font-bold text-sm transition"
            >
              Included in ₹499/mo Plan
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
