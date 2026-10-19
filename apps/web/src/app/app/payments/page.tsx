'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { CreditCard, PlusCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function PaymentsPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    async function loadPayments() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        if (activeProp) {
          const repData = await apiClient(`/reports/daily-collections?property_id=${activeProp.id}`);
          setPayments(repData.breakdown || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, [currentTenant]);

  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Payments & Collections Ledger
        </h1>
        <p className="text-xs text-content-secondary-light">
          Track transaction channels: Cash, UPI / QR, Credit/Debit POS, and Razorpay
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {['cash', 'upi', 'card', 'bank_transfer'].map((method) => {
          const item = payments.find((p) => p.payment_method === method);
          const totalPaise = item?.total_paise || 0;
          return (
            <div key={method} className="p-5 rounded-2xl bg-white border border-border-light shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary-light">
                {method.replace('_', ' ')}
              </span>
              <div className="text-2xl font-extrabold text-content-primary-light mt-1">
                {formatINR(totalPaise)}
              </div>
              <div className="text-[10px] text-content-secondary-light mt-0.5">
                {item?.transaction_count || 0} transaction(s) today
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
