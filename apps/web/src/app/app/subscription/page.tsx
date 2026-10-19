'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  Shield,
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
  Check,
  X,
  CreditCard,
  Headphones,
  Wrench,
  AlertCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';

export default function SubscriptionPage() {
  const { currentTenant, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSub = async () => {
    if (!currentTenant) return;
    try {
      setLoading(true);
      const [cData, pData] = await Promise.all([
        apiClient('/subscriptions/current'),
        apiClient('/subscriptions/plans'),
      ]);
      setSubData(cData);
      setPlans(pData.plans || []);
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: e.message || 'Failed to load subscription details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSub();
  }, [currentTenant]);

  // Dynamically load Razorpay SDK
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgradingPlanId(planId);
      setMessage(null);

      // Free Starter Plan doesn't require payment gateway
      if (planId === 'starter') {
        const res = await apiClient('/subscriptions/switch-free', {
          method: 'POST',
        });
        setMessage({ type: 'success', text: res.message || 'Switched to Free Starter plan successfully!' });
        await refreshUser();
        await loadSub();
        return;
      }

      // Paid plans: Initiate Order via Razorpay
      const orderRes = await apiClient('/subscriptions/create-order', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });

      // Handle simulated test mode (when platform keys are in demo test)
      if (orderRes.isSimulated) {
        const verifyRes = await apiClient('/subscriptions/verify-payment', {
          method: 'POST',
          body: JSON.stringify({
            planId,
            orderId: orderRes.orderId,
            paymentId: `pay_sim_${Date.now()}`,
            signature: 'simulated_signature_approved',
          }),
        });
        setMessage({
          type: 'success',
          text: verifyRes.message || 'Payment confirmed! Your plan is activated and property workspace is unlocked.',
        });
        await refreshUser();
        await loadSub();
        return;
      }

      // Real Razorpay Checkout modal
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency || 'INR',
          name: 'HotelFlexi by NovaX AI',
          description: `Subscription: ${orderRes.planName}`,
          image: '/light-logo.png',
          order_id: orderRes.orderId,
          prefill: {
            name: user?.displayName || currentTenant?.tenant_name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#2563eb',
          },
          handler: async function (response: any) {
            setUpgradingPlanId(planId);
            try {
              const verifyRes = await apiClient('/subscriptions/verify-payment', {
                method: 'POST',
                body: JSON.stringify({
                  planId,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });
              setMessage({
                type: 'success',
                text: verifyRes.message || 'Payment verified! Plan activated and hotel unlocked.',
              });
              await refreshUser();
              await loadSub();
            } catch (err: any) {
              setMessage({ type: 'error', text: err.message || 'Payment verification failed' });
            } finally {
              setUpgradingPlanId(null);
            }
          },
          modal: {
            ondismiss: function () {
              setUpgradingPlanId(null);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay checkout SDK is loading. Please try again in a moment.');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to complete plan upgrade' });
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const currentPlan = subData?.subscription;
  const entitlements = subData?.entitlements;
  const activePlanId = currentPlan?.current_plan_id || 'starter';

  const comparisonRows = [
    { name: 'Monthly Tariff (INR)', starter: '₹0 (Free)', essential: '₹499 / mo', growth: '₹1,499 / mo', enterprise: '₹3,999 / mo' },
    { name: 'Room Inventory Capacity', starter: 'Up to 10 Rooms', essential: 'Up to 30 Rooms', growth: 'Up to 75 Rooms', enterprise: 'Unlimited' },
    { name: 'Staff User Logins', starter: '2 Users', essential: '5 Users', growth: '15 Users', enterprise: 'Unlimited' },
    { name: '2-Way Live Channel Manager (OTAs)', starter: 'No (Manual only)', essential: '4 Live Channels', growth: '10 Live Channels', enterprise: 'Unlimited Channels' },
    { name: 'Housekeeping Urgency Siren', starter: false, essential: true, growth: true, enterprise: true },
    { name: 'Direct Booking Engine', starter: true, essential: true, growth: true, enterprise: true },
    { name: 'Guest Portal (FlexiLink)', starter: 'Basic link', essential: 'Full (ID & Child proof)', growth: 'Full (ID & Child proof)', enterprise: 'Full + Custom domain' },
    { name: 'In-Stay Room Service Orders', starter: false, essential: true, growth: true, enterprise: true },
    { name: 'Dine-Out Table Bookings (Non-Guests)', starter: false, essential: true, growth: true, enterprise: true },
    { name: 'Custom Hotel Website + Annual AMC', starter: false, essential: false, growth: 'Included Free', enterprise: 'Included Free' },
    { name: 'GST Billing & Invoicing (12%/18%)', starter: true, essential: true, growth: true, enterprise: true },
    { name: 'AI Business Agent Prompts', starter: '2 / day', essential: '200 / mo', growth: '600 / mo', enterprise: 'Unlimited' },
    { name: 'Financial P&L & Cash Flow', starter: false, essential: true, growth: true, enterprise: true },
    { name: 'Multi-Property Management', starter: false, essential: false, growth: '3 Properties', enterprise: 'Unlimited' },
    { name: 'Support SLA', starter: 'Community / Email', essential: 'WhatsApp & Email', growth: 'Priority WhatsApp & Phone', enterprise: '24/7 Dedicated Manager' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Hotel Subscription &amp; Upgrade Plans
        </h1>
        <p className="text-xs text-content-secondary-light">
          Compare plans, upgrade room inventory limits, and manage your hotel license.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          {/* Profile Locked / Trial Expired Alert Banner */}
          {(currentPlan?.is_locked || currentPlan?.is_trial_expired || currentPlan?.is_subscription_expired) && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-white animate-bounce shrink-0" />
                <h2 className="text-base font-extrabold tracking-tight">
                  {currentPlan?.is_trial_expired
                    ? '14-Day Free Trial Has Ended — Profile Locked'
                    : currentPlan?.is_subscription_expired
                    ? 'Subscription Period Has Expired — Profile Locked'
                    : 'Hotel Workspace Access is Restricted'}
                </h2>
              </div>
              <p className="text-xs text-red-100 max-w-2xl leading-relaxed">
                {currentPlan?.suspension_reason ||
                  'Protected front desk, channel manager, and rate sync operations are locked. Complete payment below for Essential, Growth, or Enterprise, or switch to the Free Starter tier to unlock your hotel workspace.'}
              </p>
            </div>
          )}

          {/* Current Status Box */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-content-secondary-light">Current Plan:</span>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-brand-blue uppercase">
                  {currentPlan?.plan_name || 'Starter'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 uppercase">
                  {currentPlan?.subscription_status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-content-secondary-light">
                {currentPlan?.trial_ends_at
                  ? `Trial active until ${new Date(currentPlan.trial_ends_at * 1000).toLocaleDateString('en-IN')}`
                  : currentPlan?.current_period_ends_at
                  ? `Next renewal date: ${new Date(currentPlan.current_period_ends_at * 1000).toLocaleDateString('en-IN')}`
                  : 'Active subscription with full system access'}
              </p>
            </div>

            <div className="sm:text-right">
              <div className="text-3xl font-extrabold text-content-primary-light">
                {formatINR(currentPlan?.monthly_price_paise || 49900)}
                <span className="text-xs text-content-secondary-light font-normal"> / month</span>
              </div>
              <div className="text-[11px] text-content-secondary-light mt-1">
                GST invoice issued automatically on every cycle
              </div>
            </div>
          </div>

          {/* Active Feature Entitlements Meters */}
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-content-primary-light flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-blue" />
              Active System Capacity &amp; Entitlements
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-light border border-border-light">
                <div className="text-content-secondary-light font-medium">Max Rooms Allowed</div>
                <div className="text-xl font-extrabold text-content-primary-light mt-1">
                  {entitlements?.max_rooms || 10} Rooms
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-light border border-border-light">
                <div className="text-content-secondary-light font-medium">Staff Accounts</div>
                <div className="text-xl font-extrabold text-content-primary-light mt-1">
                  {entitlements?.max_users || 2} Users
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-light border border-border-light">
                <div className="text-content-secondary-light font-medium">AI Agent Prompts</div>
                <div className="text-xl font-extrabold text-content-primary-light mt-1">
                  {entitlements?.ai_monthly_limit || 100} / mo
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-light border border-border-light">
                <div className="text-content-secondary-light font-medium">OTA Connections</div>
                <div className="text-xl font-extrabold text-content-primary-light mt-1">
                  {entitlements?.max_channel_connections || 0} Channels
                </div>
              </div>
            </div>
          </div>

          {/* Plan Comparison & Upgrade Cards */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-content-primary-light">
                Choose an Upgrade Tier
              </h2>
              <p className="text-xs text-content-secondary-light">
                Immediate quota activation without downtime. All data and historical bookings are preserved.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {plans.map((p) => {
                const isCurrent = p.id === activePlanId;
                const isUpgrading = upgradingPlanId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl bg-white border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'border-brand-blue ring-2 ring-brand-blue shadow-md'
                        : 'border-border-light hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-extrabold text-base text-content-primary-light">{p.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-brand-blue">
                            Current
                          </span>
                        )}
                        {p.id === 'essential' && !isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Popular
                          </span>
                        )}
                      </div>

                      <div className="pb-3 border-b border-border-light">
                        <div className="text-2xl font-extrabold text-content-primary-light">
                          {formatINR(p.monthly_price_paise)}
                          <span className="text-xs font-normal text-content-secondary-light">/mo</span>
                        </div>
                        <div className="text-[10px] text-content-secondary-light mt-0.5">
                          billed monthly in INR
                        </div>
                      </div>

                      <div className="py-3 space-y-1.5 text-xs text-content-primary-light border-b border-border-light font-medium">
                        <div>🛏️ Up to {p.max_rooms} Rooms</div>
                        <div>👥 {p.max_users} Staff Accounts</div>
                        <div>
                          🌐 {p.max_channel_connections > 0 ? `${p.max_channel_connections} OTA Channels` : 'Direct Only'}
                        </div>
                        <div>🤖 {p.ai_monthly_limit} AI Prompts/mo</div>
                      </div>
                    </div>

                    <div className="pt-4">
                      {isCurrent ? (
                        <div className="w-full py-2 text-center text-xs font-bold text-brand-blue bg-blue-50 rounded-xl">
                          Active Plan
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(p.id)}
                          disabled={isUpgrading}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                            p.id === 'starter'
                              ? 'border border-border-light bg-surface-light text-content-primary-light hover:bg-white'
                              : 'bg-brand-blue text-white hover:bg-brand-blue-hover shadow'
                          }`}
                        >
                          {isUpgrading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>
                            {isUpgrading
                              ? 'Processing...'
                              : p.id === 'starter'
                              ? 'Switch to Free Starter (₹0)'
                              : `Pay & Activate (${formatINR(p.monthly_price_paise)}/mo)`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Side-by-Side Feature Comparison Table */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-blue" />
              <span>Full Tier Feature Comparison Matrix</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Feature / Capability</th>
                    <th className="p-3.5 text-center">Starter</th>
                    <th className="p-3.5 text-center">Essential</th>
                    <th className="p-3.5 text-center">Growth</th>
                    <th className="p-3.5 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {comparisonRows.map((row) => {
                    const renderVal = (v: any) => {
                      if (v === true) return <Check className="w-4 h-4 text-emerald-600 mx-auto" />;
                      if (v === false) return <X className="w-4 h-4 text-gray-300 mx-auto" />;
                      return <span className="font-semibold text-content-primary-light">{v}</span>;
                    };

                    return (
                      <tr key={row.name} className="hover:bg-surface-light/40">
                        <td className="p-3.5 font-medium text-content-primary-light">{row.name}</td>
                        <td className="p-3.5 text-center">{renderVal(row.starter)}</td>
                        <td className="p-3.5 text-center">{renderVal(row.essential)}</td>
                        <td className="p-3.5 text-center">{renderVal(row.growth)}</td>
                        <td className="p-3.5 text-center">{renderVal(row.enterprise)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Developer Setup Assistance Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                <Wrench className="w-3.5 h-3.5 text-blue-300" />
                Done-For-You Onboarding
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">
                Need Help Setting Up? Hire a Dedicated NovaX AI Engineer
              </h3>
              <p className="text-xs text-blue-200 leading-relaxed">
                We configure your entire room inventory, rate plans, GST tax rules, OTA channels, Razorpay keys,
                and staff accounts for just ₹499 one-time fee.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
              <div className="text-2xl font-extrabold text-white">₹499 <span className="text-xs font-normal text-blue-300">one-time</span></div>
              <a
                href="mailto:info@novaxai.in?subject=HotelFlexi%20Developer%20Setup%20Service%20(Rs.%20499)&body=Hi%20NovaX%20AI%20Team,%0A%0AI%20would%20like%20to%20hire%20a%20developer%20for%20complete%20HotelFlexi%20setup%20for%20my%20property.%0A%0AProperty%20Name:%20%0APhone%20Number:%20"
                className="px-5 py-2.5 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-blue-50 transition shadow-lg"
              >
                Hire Developer (₹499)
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
