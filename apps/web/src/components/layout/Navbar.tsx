'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import {
  Menu,
  X,
  Hotel,
  Sparkles,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  LogIn,
  UtensilsCrossed,
  Smartphone,
  Calendar,
  Layers,
  Globe,
} from 'lucide-react';
import { BookDemoModal } from '../BookDemoModal';

export const Navbar: React.FC = () => {
  const { user, isPlatformAdmin, currentTenant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border-light shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/light-logo.png"
              alt="HotelFlexi by NovaX AI"
              className="h-9 w-auto max-w-[170px] object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-content-secondary-light">
            <Link href="/hotel-management" className="hover:text-brand-blue transition-colors">
              Cloud PMS
            </Link>
            <Link href="/channel-manager" className="hover:text-brand-blue transition-colors">
              2-Way Channels
            </Link>
            <Link href="/booking-engine" className="hover:text-brand-blue transition-colors">
              Direct Engine
            </Link>
            <Link href="/features" className="hover:text-brand-blue transition-colors">
              All Features
            </Link>
            <Link
              href="/ai-hotel-agent"
              className="flex items-center gap-1 text-brand-blue font-bold hover:text-brand-blue-hover transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Assistant
            </Link>
            <Link href="/pricing" className="hover:text-brand-blue transition-colors">
              Pricing
            </Link>
            <Link href="/compare" className="hover:text-brand-blue transition-colors">
              Compare
            </Link>
            <Link
              href="/download-app"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition font-bold"
            >
              <Smartphone className="w-3 h-3 text-emerald-600" />
              <span>Android App</span>
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-brand-blue hover:bg-surface-light border border-slate-200 rounded-xl transition shadow-xs"
            >
              Book a Demo
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-content-secondary-light hover:text-brand-blue border border-border-light rounded-lg transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Log In
                </Link>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-brand-blue text-white hover:bg-brand-blue-hover shadow transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  PMS Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-content-secondary-light hover:text-brand-blue transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-brand-blue" />
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-brand-blue text-white hover:bg-brand-blue-hover shadow transition"
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
            className="md:hidden p-2 rounded-lg text-content-secondary-light hover:text-content-primary-light"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border-light bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <Link
              href="/hotel-management"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-content-primary-light"
            >
              Cloud PMS &amp; Calendar
            </Link>
            <Link
              href="/channel-manager"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-content-primary-light"
            >
              2-Way OTA Channel Manager
            </Link>
            <Link
              href="/booking-engine"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-content-primary-light"
            >
              Direct Booking Engine
            </Link>
            <Link
              href="/ai-hotel-agent"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-brand-blue"
            >
              Bilingual AI Assistant
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-content-primary-light"
            >
              Pricing Plans
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-content-primary-light"
            >
              Compare with Competitors
            </Link>
            <Link
              href="/download-app"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-lg px-3"
            >
              Download Android App (APK)
            </Link>

            <div className="pt-3 border-t border-border-light flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setDemoModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-800"
              >
                Book a Live Demo
              </button>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs text-center shadow"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Book Demo Modal */}
      <BookDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  );
};
