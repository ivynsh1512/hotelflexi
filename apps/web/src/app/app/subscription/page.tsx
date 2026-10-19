'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { Shield, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function SubscriptionPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    async function loadSub() {
      if (!currentTenant) return;
      try {
        const [cData, pData] = await Promise.all([
          apiClient('/subscriptions/current'),
          apiClient('/subscriptions/plans'),
        ]);
        setSubData(cData);
        setPlans(pData.plans || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSub();
  }, [currentTenant]);

  const currentPlan = subData?.subscription;
  const entitlements = subData?.entitlements;

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Hotel Subscription & Entitlements
        </h1>
        <p className="text-xs text-content-secondary-light">
          Manage your SaaS plan, room quotas, and active feature flags
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          {/* Current Status Box */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase text-content-secondary-light">Current Plan:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-brand-blue uppercase">
                  {currentPlan?.plan_name || 'Starter'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 uppercase">
                  {currentPlan?.subscription_status || 'Trial'}
                </span>
              </div>
              <p className="text-xs text-content-secondary-light">
                {currentPlan?.trial_ends_at
                  ? `Trial active until ${new Date(currentPlan.trial_ends_at * 1000).toLocaleDateString()}`
                  : 'Active subscription'}
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-extrabold text-content-primary-light">
                {formatINR(currentPlan?.monthly_price_paise || 49900)}
                <span className="text-xs text-content-secondary-light font-normal">/month</span>
              </div>
            </div>
          </div>

          {/* Entitlements Grid */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-content-primary-light">Active Feature Entitlements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-light border border-border-light">
                <div className="text-content-secondary-light">Max Rooms</div>
                <div className="text-lg font-bold text-content-primary-light mt-0.5">
                  {entitlements?.max_rooms || 10} Rooms
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-light border border-border-light">
                <div className="text-content-secondary-light">Max Staff Users</div>
                <div className="text-lg font-bold text-content-primary-light mt-0.5">
                  {entitlements?.max_users || 2} Users
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-light border border-border-light">
                <div className="text-content-secondary-light">AI Monthly Limit</div>
                <div className="text-lg font-bold text-content-primary-light mt-0.5">
                  {entitlements?.ai_monthly_limit || 100} Prompts
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-light border border-border-light">
                <div className="text-content-secondary-light">OTA Connections</div>
                <div className="text-lg font-bold text-content-primary-light mt-0.5">
                  {entitlements?.max_channel_connections || 0} Channels
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
