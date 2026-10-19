'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { FileText, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';

export default function AccountingPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    async function loadFinance() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        if (activeProp) {
          const [sData, eData] = await Promise.all([
            apiClient(`/reports/monthly-summary?property_id=${activeProp.id}`),
            apiClient(`/billing/expenses?property_id=${activeProp.id}`),
          ]);
          setSummary(sData);
          setExpenses(eData.expenses || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadFinance();
  }, [currentTenant]);

  const totalRevenuePaise = summary?.totalRevenuePaise || 0;
  const totalExpensesPaise = expenses.reduce((acc, curr) => acc + (curr.amount_paise || 0), 0);
  const netProfitPaise = totalRevenuePaise - totalExpensesPaise;

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Hotel Accounting & P&L Statement
        </h1>
        <p className="text-xs text-content-secondary-light">
          Financial performance summary (Last 30 Days) comparing gross room revenue against expenses
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary-light flex items-center justify-between">
                <span>Total Room Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-2">
                {formatINR(totalRevenuePaise)}
              </div>
              <div className="text-[11px] text-content-secondary-light mt-1">
                From {summary?.totalReservations || 0} reservations
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary-light flex items-center justify-between">
                <span>Operating Expenses</span>
                <TrendingDown className="w-4 h-4 text-amber-600" />
              </span>
              <div className="text-2xl font-extrabold text-content-primary-light mt-2">
                {formatINR(totalExpensesPaise)}
              </div>
              <div className="text-[11px] text-content-secondary-light mt-1">
                Supplies, bills, and maintenance
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary-light flex items-center justify-between">
                <span>Net Operational Margin</span>
                <DollarSign className="w-4 h-4 text-brand-blue" />
              </span>
              <div className={`text-2xl font-extrabold mt-2 ${netProfitPaise >= 0 ? 'text-brand-blue' : 'text-status-danger'}`}>
                {formatINR(netProfitPaise)}
              </div>
              <div className="text-[11px] text-content-secondary-light mt-1">
                Gross revenue minus operational expenses
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-content-primary-light">
              Guest Accounts Receivable (Outstanding Balances)
            </h2>
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-light border border-border-light">
              <div>
                <div className="text-xs text-content-secondary-light">Total Uncollected Balance</div>
                <div className="text-xl font-extrabold text-amber-600 mt-0.5">
                  {formatINR(summary?.totalOutstandingPaise || 0)}
                </div>
              </div>
              <div className="text-xs text-content-secondary-light max-w-xs text-right">
                Balance amounts pending collection upon guest checkout at the front desk.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
