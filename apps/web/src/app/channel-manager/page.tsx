import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Layers, Globe, ShieldCheck, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';

export default function ChannelManagerPage() {
  const channels = [
    { name: 'Booking.com', icon: '🏨', desc: 'World leader in hotel bookings with instant reservation push.' },
    { name: 'Agoda', icon: '🌏', desc: 'Dominant distribution across Asian and Southeast Asian travel markets.' },
    { name: 'MakeMyTrip / Goibibo', icon: '🇮🇳', desc: 'The leading domestic online travel agency network in India.' },
    { name: 'Airbnb', icon: '🏡', desc: 'Direct synchronization for homestays, villas, and boutique suites.' },
    { name: 'Expedia', icon: '✈️', desc: 'Access global travelers via the Expedia Partner Solutions network.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Distribution Engine</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            OTA Channel Manager
          </h1>
          <p className="mt-4 text-base sm:text-lg text-content-secondary-light max-w-2xl mx-auto">
            Synchronize room inventory, rates, and incoming bookings across all leading travel portals automatically.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Zero Overbookings</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-primary-light mt-1">
              Real-Time Two-Way Inventory Push
            </h2>
            <p className="mt-3 text-sm text-content-secondary-light leading-relaxed">
              When a guest books a room directly through your front desk or website, HotelFlexi immediately updates available counts across all mapped OTAs, preventing costly double-booking penalties.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-content-secondary-light">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Automated room-type and rate-plan mapping</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Scheduled 02:00 UTC reconciliation trigger for error correction</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                <span>Clean adapter architecture for custom provider integration</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {channels.map((ch) => (
              <div key={ch.name} className="p-4 rounded-xl border border-border-light bg-surface-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ch.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-content-primary-light">{ch.name}</h3>
                    <p className="text-[11px] text-content-secondary-light">{ch.desc}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-full">
                  Adapter Ready
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-8 border-t border-border-light">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-hover shadow transition"
          >
            Connect Your Channels Today <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
