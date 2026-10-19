import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HelpCircle } from 'lucide-react';

export default function FaqPage() {
  const faqs = [
    {
      q: 'How does HotelFlexi differ from older hotel software?',
      a: 'Traditional hotel PMS software requires local desktop installations, complex manual backups, and separate subscriptions for channel management and billing. HotelFlexi runs natively on Cloudflare’s serverless edge, works on any device, includes Indian GST billing natively, and offers a natural language AI agent that non-technical staff can use in English, Hindi, and Hinglish.',
    },
    {
      q: 'Can I connect my hotel to Booking.com, Agoda, and MakeMyTrip?',
      a: 'Yes. HotelFlexi includes a built-in OTA Channel Manager framework with room mapping, rate plan distribution, and automated inventory sync to keep your availability consistent across all channels.',
    },
    {
      q: 'How does the Direct Booking Engine work?',
      a: 'Every property on HotelFlexi gets an online booking portal accessible at /book/[property-slug]. Guests can view room types, check live availability, select meal plans, calculate GST, and complete payments via Razorpay (UPI, Credit/Debit cards, Net Banking).',
    },
    {
      q: 'Is my data isolated from other hotels?',
      a: 'Yes. Tenant isolation is strictly enforced on every single database query inside our Cloudflare Worker. Each hotel’s rooms, rates, reservations, financial folios, and staff permissions are fully protected.',
    },
    {
      q: 'What happens when my 14-day free trial ends?',
      a: 'You can choose any plan (Starter ₹499, Essential ₹999, Growth ₹2,499, Pro ₹4,999) to continue uninterrupted service. Your data, room configurations, and reservations are never deleted.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="pt-16 pb-14 bg-surface-light border-b border-border-light text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Knowledge & Answers</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-primary-light mt-2 tracking-tight">
            Frequently Asked Questions
          </h1>
        </div>
      </section>

      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {faqs.map((f) => (
            <div key={f.q} className="p-6 rounded-2xl border border-border-light bg-surface-light">
              <h3 className="text-base font-bold text-content-primary-light flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" />
                {f.q}
              </h3>
              <p className="mt-2 text-sm text-content-secondary-light leading-relaxed pl-6">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
