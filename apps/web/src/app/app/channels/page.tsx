'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, ArrowRight, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

export default function ChannelManagerAppPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <div className="bg-white rounded-3xl border border-border-light p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mx-auto">
          <Globe className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-content-primary-light">
          Direct Booking Engine &amp; Guest Portal Active
        </h1>

        <p className="text-sm text-content-secondary-light max-w-xl mx-auto leading-relaxed">
          HotelFlexi powers commission-free direct bookings through your branded property booking engine, Google Free Booking Links, and FlexiLink contactless guest portal. Third-party OTA channel management is not active.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
          <div className="p-4 rounded-2xl bg-surface-light border border-border-light space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-content-primary-light">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Direct Booking Engine</span>
            </div>
            <p className="text-[11px] text-content-secondary-light">
              Share your direct booking link with guests, collect online advance payments via UPI/cards, and accept bookings with zero OTA commissions.
            </p>
            <div className="pt-2">
              <Link
                href="/app/booking-engine"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
              >
                <span>Manage Booking Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-light border border-border-light space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-content-primary-light">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Room Rates &amp; Daily Overrides</span>
            </div>
            <p className="text-[11px] text-content-secondary-light">
              Set seasonal room prices, weekend surcharges, and date-specific rate overrides that apply immediately to your direct booking engine.
            </p>
            <div className="pt-2">
              <Link
                href="/app/rates/daily"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
              >
                <span>Adjust Room Rates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border-light flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Direct bookings eliminate high OTA commissions and give you 100% guest ownership</span>
        </div>
      </div>
    </div>
  );
}
