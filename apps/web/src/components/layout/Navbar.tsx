'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, Hotel, Sparkles, ChevronRight, LayoutDashboard, ShieldCheck, LogIn, UtensilsCrossed } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isPlatformAdmin, currentTenant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/light-logo.png"
            alt="HotelFlexi by NovaX AI"
            className="h-10 w-auto max-w-[180px] object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-content-secondary-light">
          <Link href="/features" className="hover:text-brand-blue transition-colors">
            Features
          </Link>
          <Link href="/hotel-management" className="hover:text-brand-blue transition-colors">
            PMS
          </Link>
          <Link href="/channel-manager" className="hover:text-brand-blue transition-colors">
            Channel Manager
          </Link>
          <Link href="/booking-engine" className="hover:text-brand-blue transition-colors">
            Booking Engine
          </Link>
          <Link href="/dine-out" className="flex items-center gap-1 hover:text-brand-blue transition-colors">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
            Dine-Out
          </Link>
          <Link href="/ai-hotel-agent" className="flex items-center gap-1.5 text-brand-blue font-semibold hover:text-brand-blue-hover transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI Agent
          </Link>
          <Link href="/pricing" className="hover:text-brand-blue transition-colors">
            Pricing
          </Link>
          <Link href="/compare" className="hover:text-brand-blue transition-colors">
            Compare
          </Link>
          <Link href="/blog" className="hover:text-brand-blue transition-colors">
            Blog
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-content-secondary-light hover:text-brand-blue border border-border-light rounded-lg transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Log In
              </Link>
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-blue text-white hover:bg-brand-blue-hover shadow-sm transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to PMS Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-content-primary-light hover:text-brand-blue hover:bg-surface-light rounded-lg transition"
              >
                <LogIn className="w-4 h-4 text-brand-blue" />
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-blue text-white hover:bg-brand-blue-hover shadow-sm transition"
              >
                Start Free Trial
                <ChevronRight className="w-4 h-4" />
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
        <div className="md:hidden border-b border-border-light bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-content-secondary-light"
          >
            Features
          </Link>
          <Link
            href="/hotel-management"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-content-secondary-light"
          >
            PMS
          </Link>
          <Link
            href="/channel-manager"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-content-secondary-light"
          >
            Channel Manager
          </Link>
          <Link
            href="/booking-engine"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-content-secondary-light"
          >
            Booking Engine
          </Link>
          <Link
            href="/ai-hotel-agent"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-brand-blue"
          >
            AI Agent
          </Link>
          <Link
            href="/dine-out"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-1.5 py-2 text-sm font-semibold text-amber-700"
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-600" />
            Dine-Out &amp; Restaurant
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-content-secondary-light"
          >
            Pricing
          </Link>
          <Link
            href="/compare"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-content-secondary-light"
          >
            Compare
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-content-secondary-light"
          >
            Blog
          </Link>

          <div className="pt-4 border-t border-border-light space-y-2">
            {user ? (
              <>
                <Link
                  href="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center block px-4 py-2.5 rounded-lg bg-brand-blue text-white font-semibold text-sm shadow-sm"
                >
                  Go to PMS Dashboard
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-border-light text-content-primary-light font-medium text-xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-brand-blue" />
                  Log In / Switch Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-border-light text-content-primary-light font-semibold text-sm"
                >
                  <LogIn className="w-4 h-4 text-brand-blue" />
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center block px-4 py-2.5 rounded-lg bg-brand-blue text-white font-semibold text-sm shadow-sm"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
