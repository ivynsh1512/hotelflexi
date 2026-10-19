import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Globe, CreditCard, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function BookingEnginePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Direct Bookings</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Commission-Free Direct Booking Engine
          </h1>
          <p className="mt-4 text-base sm:text-lg text-content-secondary-light max-w-2xl mx-auto">
            Convert website visitors into confirmed guests without paying 18% to 25% OTA commissions.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">0% Commission</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-primary-light mt-1">
              Mobile-First Guest Checkout
            </h2>
            <p className="mt-3 text-sm text-content-secondary-light leading-relaxed">
              Every HotelFlexi property gets a dedicated high-converting booking engine at /book/[property-slug]. Guests can browse photos, select meal plans, calculate GST, and pay via UPI, cards, and netbanking.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-content-secondary-light">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Integrated Razorpay payment gateway with server-side signature verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Dynamic GST tax breakdown (12% / 18%) shown transparently</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Instant automated booking voucher and invoice generation</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <span className="font-bold text-sm text-content-primary-light">The Grand Heritage Palace</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Live Booking</span>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-border-light flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-content-primary-light">Deluxe King Room</div>
                  <div className="text-[11px] text-content-secondary-light">2 Adults • Free Wi-Fi • AC</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-content-primary-light">₹2,800/night</div>
                  <div className="text-[10px] text-content-secondary-light">+ ₹336 GST</div>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border-light flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-content-primary-light">Executive Luxury Suite</div>
                  <div className="text-[11px] text-content-secondary-light">3 Adults • Bathtub • Breakfast</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-content-primary-light">₹4,800/night</div>
                  <div className="text-[10px] text-content-secondary-light">+ ₹576 GST</div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <button className="w-full py-2.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover transition">
                Proceed to UPI / Card Checkout
              </button>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-border-light">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-hover shadow transition"
          >
            Launch Your Booking Engine <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
