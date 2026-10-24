'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Receipt, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TallyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <div className="bg-white rounded-3xl border border-border-light p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-content-primary-light">
          Built-in GST Accounting &amp; Financial Reporting Active
        </h1>

        <p className="text-sm text-content-secondary-light max-w-xl mx-auto leading-relaxed">
          HotelFlexi provides complete native GST SAC 9963 tax invoicing, expense management, and Profit &amp; Loss reporting directly inside your dashboard. Third-party Tally integration is not required.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
          <div className="p-4 rounded-2xl bg-surface-light border border-border-light space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-content-primary-light">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>GST Tax Invoices &amp; Folios</span>
            </div>
            <p className="text-[11px] text-content-secondary-light">
              Generate 12% &amp; 18% SAC 9963 tax invoices with automated CGST/SGST breakdowns and printable guest folios.
            </p>
            <div className="pt-2">
              <Link
                href="/app/billing"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
              >
                <span>View GST Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-light border border-border-light space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-content-primary-light">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Live Accounting Profit &amp; Loss</span>
            </div>
            <p className="text-[11px] text-content-secondary-light">
              Real-time revenue, expense categorization, gross operating income, and net profit ledger.
            </p>
            <div className="pt-2">
              <Link
                href="/app/accounting"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
              >
                <span>Open Accounting P&amp;L</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border-light flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All financial data is safely stored and isolated under your tenant account</span>
        </div>
      </div>
    </div>
  );
}
