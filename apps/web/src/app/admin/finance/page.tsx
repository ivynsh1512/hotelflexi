'use client';

import React, { useEffect, useState } from 'react';
import { apiClient, formatINR } from '@/lib/api';
import { PieChart, DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export default function AdminFinancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFinance() {
      try {
        const res = await apiClient('/admin/finance/summary');
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadFinance();
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-dark flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Platform Finance & SaaS Accounting
          </h1>
          <p className="text-xs text-content-secondary-dark">
            NovaX AI HotelFlexi internal revenue, payment reconciliation, vendor expenses, and net margins
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-surface-dark-surface rounded-2xl border border-border-dark">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface-dark-surface border border-border-dark">
            <span className="text-[11px] font-bold uppercase text-content-secondary-dark">Monthly Recurring (MRR)</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {formatINR(data?.mrrPaise || 0)}
            </div>
            <div className="text-[10px] text-content-secondary-dark mt-0.5">Recognized monthly subscription billings</div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-dark-surface border border-border-dark">
            <span className="text-[11px] font-bold uppercase text-content-secondary-dark">Annual Run Rate (ARR)</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {formatINR(data?.arrPaise || 0)}
            </div>
            <div className="text-[10px] text-content-secondary-dark mt-0.5">Projected annualized subscription revenue</div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-dark-surface border border-border-dark">
            <span className="text-[11px] font-bold uppercase text-content-secondary-dark">Platform Vendor Costs</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">
              {formatINR(data?.totalExpensesPaise || 0)}
            </div>
            <div className="text-[10px] text-content-secondary-dark mt-0.5">Cloudflare, AI tokens & infrastructure</div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-dark-surface border border-border-dark">
            <span className="text-[11px] font-bold uppercase text-content-secondary-dark">Net Operating Margin</span>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">
              {formatINR(data?.netMarginPaise || 0)}
            </div>
            <div className="text-[10px] text-content-secondary-dark mt-0.5">ARR minus operational infrastructure</div>
          </div>
        </div>
      )}
    </div>
  );
}
