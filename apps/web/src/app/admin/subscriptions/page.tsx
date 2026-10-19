'use client';

import React, { useEffect, useState } from 'react';
import { apiClient, formatINR } from '@/lib/api';
import { DollarSign, Edit2, CheckCircle2, Loader2 } from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/admin/plans');
      setPlans(data.plans || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEditPrice = async (plan: any) => {
    const newPriceStr = prompt(`Enter new monthly price in INR for ${plan.name}:`, (plan.monthly_price_paise / 100).toString());
    if (!newPriceStr) return;
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice < 0) return;

    try {
      await apiClient(`/admin/plans/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          monthlyPricePaise: Math.round(newPrice * 100),
          annualPricePaise: Math.round(newPrice * 10 * 100),
        }),
      });
      await fetchPlans();
    } catch (e: any) {
      alert(e.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-dark flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            SaaS Subscription Plans & Feature Quotas
          </h1>
          <p className="text-xs text-content-secondary-dark">
            Modify monthly and annual plan tariffs, room limits, and feature entitlements dynamically
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-surface-dark-surface rounded-2xl border border-border-dark">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="p-6 rounded-2xl bg-surface-dark-surface border border-border-dark flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <span className="font-mono text-xs text-purple-400 uppercase font-bold">
                    {p.id}
                  </span>
                </div>
                <p className="text-xs text-content-secondary-dark mt-1 min-h-[32px]">{p.description}</p>

                <div className="mt-4 pb-4 border-b border-border-dark flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-white">{formatINR(p.monthly_price_paise)}</div>
                    <div className="text-[10px] text-content-secondary-dark">Annual: {formatINR(p.annual_price_paise)}/yr</div>
                  </div>
                  <button
                    onClick={() => handleEditPrice(p)}
                    className="p-2 rounded bg-surface-dark-elevated text-purple-400 hover:text-white"
                    title="Edit Plan Price"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-xs text-content-secondary-dark">
                  <div className="flex justify-between">
                    <span>Max Rooms Allowed:</span>
                    <span className="font-bold text-white">{p.max_rooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Properties Allowed:</span>
                    <span className="font-bold text-white">{p.max_properties}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Staff Users:</span>
                    <span className="font-bold text-white">{p.max_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Assistant Limit:</span>
                    <span className="font-bold text-white">{p.ai_monthly_limit} prompts/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OTA Channel Manager:</span>
                    <span className="font-bold text-white">{p.has_channel_manager ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
