import React from 'react';
import Link from 'next/link';
import { Hotel, Mail, Shield, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-dark-bg text-content-primary-dark pt-16 pb-12 border-t border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-border-dark">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white">
                <Hotel className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Hotel<span className="text-brand-blue">Flexi</span>
              </span>
            </div>
            <p className="text-sm text-content-secondary-dark max-w-sm leading-relaxed">
              Your Hotel. One Intelligent System. Complete PMS, channel manager, direct booking engine,
              Indian GST billing, and bilingual AI business agent for hospitality businesses.
            </p>
            <div className="text-xs text-content-secondary-dark space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-brand-blue" />
                <span>A SaaS product by NovaX AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand-blue" />
                <a href="mailto:info@novaxai.in" className="hover:text-white transition">info@novaxai.in</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                <span>Primary Market: India (INR, Asia/Kolkata)</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2 text-sm text-content-secondary-dark">
              <li>
                <Link href="/hotel-management" className="hover:text-white transition">PMS Calendar</Link>
              </li>
              <li>
                <Link href="/channel-manager" className="hover:text-white transition">Channel Manager</Link>
              </li>
              <li>
                <Link href="/booking-engine" className="hover:text-white transition">Direct Booking Engine</Link>
              </li>
              <li>
                <Link href="/ai-hotel-agent" className="hover:text-white transition">AI Business Agent</Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-white transition">GST Billing & Accounting</Link>
              </li>
            </ul>
          </div>

          {/* Platform & Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2 text-sm text-content-secondary-dark">
              <li>
                <Link href="/about" className="hover:text-white transition">About HotelFlexi</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">Pricing Plans</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">Contact Us</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Legal & Compliance</h4>
            <ul className="space-y-2 text-sm text-content-secondary-dark">
              <li>
                <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition">Refund & Cancellation</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">Owner Portal Login</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-content-secondary-dark gap-4">
          <p>© {new Date().getFullYear()} HotelFlexi by NovaX AI. All rights reserved.</p>
          <p>Designed for Indian Hotels, Resorts, Homestays & Boutique Properties.</p>
        </div>
      </div>
    </footer>
  );
};
