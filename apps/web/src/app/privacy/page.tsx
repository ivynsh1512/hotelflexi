import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-12 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Legal</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-content-secondary-light">Last updated: October 2026</p>
        </div>
      </section>

      <section className="py-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm text-content-secondary-light leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">1. Overview</h2>
          <p>
            HotelFlexi, owned and operated by NovaX AI ("we", "our", or "us"), is committed to safeguarding the privacy and security of hotel owners, staff, and guests. This Privacy Policy details our data collection, usage, and protection practices.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">2. Information We Collect</h2>
          <p>
            We collect personal information required strictly to operate the hospitality SaaS platform:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Account details: User email, name, phone number, and authenticated Firebase UID.</li>
            <li>Hotel operational details: Property name, address, room types, rate plans, and staff role assignments.</li>
            <li>Reservation folios: Guest name, masked identification details, contact number, arrival/departure dates, and payment transaction logs. We never store raw payment card data on our servers.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">3. Storage & Tenant Isolation</h2>
          <p>
            HotelFlexi utilizes Cloudflare D1 database storage with strict server-side tenant isolation. Data belonging to one property is cryptographically segregated from other accounts.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">4. Contact & Inquiries</h2>
          <p>
            For questions regarding privacy, please contact the NovaX AI Data Protection team at{' '}
            <a href="mailto:info@novaxai.in" className="text-brand-blue underline">info@novaxai.in</a>.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
