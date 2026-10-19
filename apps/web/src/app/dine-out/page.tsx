import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DineOutSearchBar } from '@/components/DineOutSearchBar';
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
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HotelFlexi Dine-Out — Table Bookings & Menus at Top Resort Restaurants',
  description:
    'Experience gourmet dining at top hotels and resorts. Book dine-out tables, explore authentic local cuisine, verified 100% Pure Veg menus, and pay in-app or at the restaurant.',
  keywords: [
    'hotel dine out booking',
    'resort restaurant reservation india',
    'pure veg resort restaurant',
    'dine out table booking hotel',
    'hotel food ordering online',
  ],
};

export default function DineOutLandingPage() {
  const featuredVenues = [
    {
      code: '58291',
      name: 'The Royal Spice Courtyard',
      property: 'The Grand Heritage Palace & Spa',
      location: 'Udaipur, Rajasthan',
      cuisine: 'Royal Rajasthani, North Indian & Awadhi',
      isPureVeg: true,
      timings: '07:30 AM - 11:00 PM',
      rating: '4.9',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
    {
      code: '74192',
      name: 'Saffron Cliffside Fine Dine',
      property: 'Pine Valley Luxury Resort',
      location: 'Manali, Himachal Pradesh',
      cuisine: 'Tandoor, Continental & Himachali Delicacies',
      isPureVeg: false,
      timings: '08:00 AM - 10:30 PM',
      rating: '4.8',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
      code: '39481',
      name: 'Vrindavan Satvik Rasoi',
      property: 'Govardhan Retreat & Homestay',
      location: 'Vrindavan, Uttar Pradesh',
      cuisine: 'Authentic Satvik, Braj Specialties & Sweets',
      isPureVeg: true,
      timings: '07:00 AM - 10:00 PM',
      rating: '5.0',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    },
  ];

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

      {/* Featured Venues */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredVenues.map((v) => (
              <div
                key={v.code}
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {v.isPureVeg && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      100% Pure Veg
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur text-white text-xs font-mono font-bold">
                    Code: #{v.code}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      {v.location}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{v.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{v.property}</p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{v.cuisine}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                      {v.timings}
                    </div>
                    <Link
                      href={`/dine/${v.code}`}
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
