'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { DollarSign, PlusCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function RatesManagementPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ratePlans, setRatePlans] = useState<any[]>([]);

  useEffect(() => {
    async function loadPlans() {
      if (!currentTenant) return;
      try {
        const data = await apiClient('/rooms/rate-plans');
        setRatePlans(data.ratePlans || []);
      } catch (e) {
        console.error('Failed to load rate plans:', e);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, [currentTenant]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Meal Plans & Rate Policies
          </h1>
          <p className="text-xs text-content-secondary-light">
            Configure meal plans (EP, CP, MAP, AP) and surcharge policies
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ratePlans.map((rp) => (
            <div key={rp.id} className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-content-primary-light">{rp.name}</h3>
                <span className="font-mono text-xs font-bold text-brand-blue bg-blue-50 px-2.5 py-0.5 rounded">
                  {rp.code}
                </span>
              </div>
              <div className="text-xs text-content-secondary-light space-y-1">
                <div>Meal Plan: <span className="font-semibold text-content-primary-light">{rp.meal_plan}</span></div>
                <div>Rate Multiplier: <span className="font-semibold text-content-primary-light">{rp.price_multiplier}% of Base</span></div>
                {rp.surcharge_paise > 0 && (
                  <div>Meal Surcharge: <span className="font-bold text-emerald-700">+{formatINR(rp.surcharge_paise)}/night</span></div>
                )}
                <div>Policy: <span className="font-semibold">{rp.is_non_refundable ? 'Non-Refundable' : 'Standard Flexible'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
