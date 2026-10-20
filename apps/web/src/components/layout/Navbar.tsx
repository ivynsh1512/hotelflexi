'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import {
  Menu,
  X,
  Sparkles,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  Smartphone,
  Calendar,
  Layers,
  Globe,
  BedDouble,
  CheckCircle2,
} from 'lucide-react';
import { BookDemoModal } from '../BookDemoModal';

export const Navbar: React.FC = () => {
  const { user, isPlatformAdmin, currentTenant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/light-logo.png"
              alt="HotelFlexi"
              className="h-7 sm:h-7.5 w-auto max-w-[145px] object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <Link
              href="/hotel-management"
              className="hover:text-brand-blue transition-colors flex items-center gap-1"
            >
              Cloud PMS
            </Link>
            <Link
              href="/channel-manager"
              className="hover:text-brand-blue transition-colors"
            >
              2-Way Channels
            </Link>
            <Link
              href="/booking-engine"
              className="hover:text-brand-blue transition-colors"
            >
              Direct Engine
            </Link>
            <Link
              href="/features"
              className="hover:text-brand-blue transition-colors"
            >
              All Features
            </Link>
            <Link
              href="/ai-hotel-agent"
              className="inline-flex items-center gap-1 text-brand-blue font-bold hover:text-blue-700 transition-colors bg-blue-50/70 px-2.5 py-1 rounded-full border border-blue-100"
            >
              <Sparkles className="w-3 h-3 text-brand-blue" />
              <span>AI Assistant</span>
            </Link>
            <Link
              href="/pricing"
              className="hover:text-brand-blue transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/compare"
              className="hover:text-brand-blue transition-colors"
            >
              Compare
            </Link>
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <Link
              href="/download-app"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition"
              title="Install official Android App (APK & Play Store Bundle)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mobile App</span>
            </Link>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-blue hover:bg-slate-50 border border-slate-200 rounded-lg transition"
            >
              Book Demo
            </button>

            {user ? (
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-lg bg-brand-blue hover:bg-blue-700 text-white shadow-sm transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-extrabold rounded-lg bg-brand-blue hover:bg-blue-700 text-white shadow-sm transition"
                >
                  <span>Start Free Trial</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-100 bg-white px-5 pt-3 pb-6 space-y-3 shadow-xl">
            <Link
              href="/hotel-management"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800"
            >
              Cloud PMS &amp; Calendar
            </Link>
            <Link
              href="/channel-manager"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800"
            >
              2-Way OTA Channel Manager
            </Link>
            <Link
              href="/booking-engine"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800"
            >
              Direct Booking Engine
            </Link>
            <Link
              href="/ai-hotel-agent"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-brand-blue flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bilingual AI Assistant</span>
            </Link>
            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800"
            >
              All Features Directory
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800"
            >
              Transparent Pricing (from ₹499/mo)
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800"
            >
              Competitor Comparisons
            </Link>
            <Link
              href="/download-app"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-emerald-700 flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Android App</span>
            </Link>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setDemoModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs"
              >
                Book a Live Demo
              </button>

              {user ? (
                <Link
                  href="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs text-center"
                >
                  Go to PMS Dashboard
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs text-center"
                  >
                    Free Trial
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <BookDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  );
};
