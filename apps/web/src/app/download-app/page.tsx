'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Smartphone,
  Download,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Sparkles,
  QrCode,
  ArrowRight,
  Zap,
  Volume2,
} from 'lucide-react';

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Android App • Version 1.0.4</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Hotel Management on Your Smartphone.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Experience the full power of HotelFlexi on Android. Receive real-time urgent housekeeping sirens with hardware vibrations, manage walk-ins, and inspect clean rooms on the go.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/hotelflexi-app.apk"
                download="hotelflexi-app.apk"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5" />
                <span>Download Universal APK (1.65 MB)</span>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=in.novaxai.hotelflexi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 flex items-center justify-center gap-2.5 transition"
              >
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Google Play Store</span>
              </a>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified &amp; Signed
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Ultra Fast (1.65 MB)
              </span>
              <span className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-blue-400" />
                Native OS Notifications
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* App Features */}
      <section className="py-20 bg-slate-50 border-b border-border-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              Native Mobile Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-content-primary-light">
              Built Specifically for Front Desk &amp; Floor Staff
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-border-light shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Volume2 className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-content-primary-light">
                Hardware Urgent Siren &amp; Vibration
              </h3>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                When a guest reports an urgent grievance (dirty bedsheets, washroom leak, urgent cleaning), staff smartphones ring with a dual-tone alarm and continuous vibration pulse until acknowledged.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-border-light shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-content-primary-light">
                Full-Screen Native Experience
              </h3>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Zero browser URL bars or navigation clutter. Designed as a standalone Android application with persistent session retention so staff stay logged in across shifts.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-border-light shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-content-primary-light">
                Role-Based Floor Security
              </h3>
              <p className="text-xs text-content-secondary-light leading-relaxed">
                Housekeeping staff see only their assigned room cleaning roster and urgent guest calls, while managers access daily revenues, calendar grids, and OTA channel status.
              </p>
            </div>
          </div>

          {/* Quick Installation Guide */}
          <div className="mt-16 p-8 rounded-3xl bg-white border border-border-light shadow-md grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                Direct APK Sideload
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-content-primary-light">
                How to Install the APK on Your Android Device
              </h3>
              <ol className="space-y-3 text-xs text-content-secondary-light list-decimal pl-4">
                <li>
                  Tap <strong>Download Universal APK</strong> on your Android mobile device.
                </li>
                <li>
                  When prompted by your browser, tap <strong>Download anyway</strong>.
                </li>
                <li>
                  Open the downloaded <strong>hotelflexi-app.apk</strong> file from your notification bar or Downloads folder.
                </li>
                <li>
                  Tap <strong>Install</strong>. If prompted, toggle <strong>Allow from this source</strong> in your phone settings.
                </li>
                <li>
                  Launch HotelFlexi and grant notification permission when prompted to enable live siren alarms!
                </li>
              </ol>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-blue-400">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <div className="font-extrabold text-sm">HotelFlexi Android v1.0.4</div>
                <div className="text-[11px] text-slate-400">Package: in.novaxai.hotelflexi</div>
              </div>
              <a
                href="/hotelflexi-app.apk"
                download="hotelflexi-app.apk"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Direct Download APK</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
