'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Hotel } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-surface-light flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-border-light shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto shadow-sm">
          <WifiOff className="w-8 h-8 text-brand-blue" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-content-primary-light">
            You Are Currently Offline
          </h1>
          <p className="text-xs text-content-secondary-light leading-relaxed">
            HotelFlexi requires an internet connection to securely synchronize reservations, guest check-ins, and room inventory.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover shadow transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check Connection &amp; Retry
          </button>

          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-xl border border-border-light text-xs font-semibold text-content-primary-light hover:bg-surface-light transition"
          >
            Go to Login
          </Link>
        </div>

        <div className="pt-4 border-t border-border-light flex items-center justify-center gap-2 text-[11px] text-content-secondary-light">
          <Hotel className="w-3.5 h-3.5 text-brand-blue" />
          <span>HotelFlexi by NovaX AI</span>
        </div>
      </div>
    </div>
  );
}
