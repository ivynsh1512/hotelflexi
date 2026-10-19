import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-12 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Legal</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs text-content-secondary-light">Last updated: October 2026</p>
        </div>
      </section>

      <section className="py-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm text-content-secondary-light leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">1. Agreement to Terms</h2>
          <p>
            By accessing or using HotelFlexi (a product of NovaX AI), you agree to be bound by these Terms of Service. If you do not agree, you must not use our software or platform services.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">2. SaaS Subscription and Usage</h2>
          <p>
            HotelFlexi provides hotel management, direct booking engine, channel synchronization, and AI assistant capabilities based on the chosen subscription plan. Users are responsible for maintaining the confidentiality of their login credentials.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">3. Indian GST and Accounting Disclaimer</h2>
          <p>
            HotelFlexi provides configurable tools for calculating and generating GST invoices. However, each hotel property owner is solely responsible for validating tax filings, compliance, and accurate bookkeeping in accordance with applicable tax regulations.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">4. Support & Contact</h2>
          <p>
            For inquiries regarding terms, contact us at <a href="mailto:info@novaxai.in" className="text-brand-blue underline">info@novaxai.in</a>.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
