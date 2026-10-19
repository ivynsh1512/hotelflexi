import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Receipt,
  FileText,
  ShieldCheck,
  Percent,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Complete Guide to Indian Hotel GST Invoicing (12% vs 18% SAC 9963) & Compliance',
  description:
    'Master Indian hotel GST compliance. Learn room tariff thresholds (₹7,500/night), SAC 9963 tax codes, CGST/SGST/IGST breakdowns, and automated invoice folios with HotelFlexi.',
  keywords: [
    'hotel gst billing guide india',
    'sac code 9963 hotel accommodation',
    'hotel gst rate 12 or 18 percent',
    'hotel folio gst calculation india',
    'hotel billing software with gst india',
  ],
  openGraph: {
    title: 'Complete Guide to Indian Hotel GST Invoicing (12% vs 18% SAC 9963)',
    description:
      'Everything Indian hoteliers need to know about GST tax rates, room tariff thresholds, and automated invoicing folios.',
    url: 'https://hotelflexi.novaxai.in/blog/hotel-pms-gst-billing-guide-india',
  },
};

export default function HotelGstGuideBlogPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Complete Guide to Indian Hotel GST Invoicing (12% vs 18% SAC 9963) & Compliance',
    description:
      'An exhaustive operational guide on Indian hospitality GST laws, SAC 9963 accounting codes, and automated tax folio generation.',
    author: {
      '@type': 'Organization',
      name: 'NovaX AI',
      url: 'https://novaxai.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HotelFlexi',
      logo: {
        '@type': 'ImageObject',
        url: 'https://hotelflexi.novaxai.in/light-logo.png',
      },
    },
    datePublished: '2026-10-14',
    dateModified: '2026-10-14',
    mainEntityOfPage: 'https://hotelflexi.novaxai.in/blog/hotel-pms-gst-billing-guide-india',
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>

      {/* Header */}
      <section className="pt-16 pb-12 bg-surface-light border-b border-border-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-blue mb-3">
            <Link href="/blog" className="hover:underline">Blog</Link>
            <span>/</span>
            <span>Finance &amp; Compliance</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-content-primary-light tracking-tight leading-tight">
            Complete Guide to Indian Hotel GST Invoicing (12% vs 18% SAC 9963) &amp; Compliance
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-content-secondary-light">
            <span className="font-semibold text-content-primary-light">By NovaX AI Tax &amp; Compliance Desk</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Oct 14, 2026</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 7 min read</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-800 leading-relaxed text-sm sm:text-base">
          <p className="text-base sm:text-lg font-medium text-slate-700 leading-relaxed">
            Goods and Services Tax (GST) compliance in Indian hospitality is notorious for audit pitfalls. Hoteliers frequently miscalculate tax rates on room charges, fail to apply correct SAC 9963 accounting codes, or make floating-point rounding errors on guest checkout bills.
          </p>

          <p>
            This operational guide clarifies the statutory GST brackets, room tariff rules, and how HotelFlexi automates compliant GST invoice folios for your Chartered Accountant (CA).
          </p>

          {/* Section 1 */}
          <div className="space-y-4 pt-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Percent className="w-6 h-6 text-brand-blue" />
              1. Hotel Room Tariff Slabs &amp; Applicable GST Rates
            </h2>
            <p>
              Under Indian GST regulations, short-term accommodation in hotels, guest houses, and homestays is classified under <strong>SAC Code 996311</strong>. The tax rate is determined by the daily room tariff declared or charged per unit per day:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border-light rounded-2xl overflow-hidden">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3">Room Tariff (Per Day / Unit)</th>
                    <th className="p-3">GST Rate</th>
                    <th className="p-3">Intra-State (Within State)</th>
                    <th className="p-3">Inter-State (Outside State)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  <tr className="bg-surface-light">
                    <td className="p-3 font-bold">Up to ₹7,500 / night</td>
                    <td className="p-3 font-extrabold text-brand-blue">12%</td>
                    <td className="p-3">6% CGST + 6% SGST</td>
                    <td className="p-3">12% IGST</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Above ₹7,500 / night (Luxury)</td>
                    <td className="p-3 font-extrabold text-purple-700">18%</td>
                    <td className="p-3">9% CGST + 9% SGST</td>
                    <td className="p-3">18% IGST</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4 pt-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-600" />
              2. Eliminating Floating-Point Calculation Errors
            </h2>
            <p>
              Many older hotel PMS programs use standard floating-point numbers in JavaScript or PHP, leading to fractional paise errors like <code>₹3,920.0000000004</code>.
            </p>
            <p>
              HotelFlexi stores all tariffs and financial transactions strictly as <strong>integer paise</strong> in SQLite D1 (e.g. ₹3,500.00 is stored as <code>350000</code>). Tax is calculated using basis points (12% = 1200 bps):
            </p>
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs">
              tax_paise = Math.round((room_charge_paise * gst_basis_points) / 10000)
            </div>
            <p>
              This ensures every invoice folio, tax summary, and CA monthly export reconciles down to the exact single paisa with zero rounding discrepancies.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-4 pt-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-600" />
              3. Automated SAC 9963 Folios in HotelFlexi
            </h2>
            <p>
              When a guest checks out, HotelFlexi automatically formats a tax invoice displaying:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Hotel’s Legal Entity Name, Address, and 15-digit GSTIN</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Guest / Corporate Company GSTIN for B2B input tax credit (ITC) claims</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Clear split of room tariff (SAC 996311) vs food / restaurant services (SAC 996331 at 5%)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>One-click PDF download and direct WhatsApp receipt dispatch to the guest</span>
              </li>
            </ul>
          </div>

          {/* Internal Links & CTA */}
          <div className="mt-12 p-8 rounded-3xl bg-slate-900 text-white space-y-4 text-center">
            <h3 className="text-xl sm:text-2xl font-black">
              Automate Indian GST Invoicing on Your PMS
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Included across all HotelFlexi plans starting at ₹499/mo with zero setup fee. Try 14 days free.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="px-6 py-2.5 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition shadow"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition border border-slate-700"
              >
                View Plans &amp; Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
