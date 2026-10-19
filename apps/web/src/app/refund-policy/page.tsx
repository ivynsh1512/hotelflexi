import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-12 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Billing Policy</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-2 text-xs text-content-secondary-light">Last updated: October 2026</p>
        </div>
      </section>

      <section className="py-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm text-content-secondary-light leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">1. 14-Day Free Trial</h2>
          <p>
            HotelFlexi provides an initial 14-day free trial on all new property accounts with zero upfront payment. You can cancel at any time during the trial with no charges incurred.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">2. Subscription Cancellation</h2>
          <p>
            You may cancel your monthly or annual subscription at any time through your hotel dashboard settings or by contacting <a href="mailto:info@novaxai.in" className="text-brand-blue underline">info@novaxai.in</a>. Upon cancellation, your account remains active until the end of the paid billing period.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-content-primary-light mb-2">3. Refund Requests</h2>
          <p>
            If you encounter technical issues or service disruption within the first 7 days of paid billing, you may request a review for a prorated or full refund. Refunds are processed back to the original payment method (via Razorpay/bank transfer) within 5–7 business days.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
