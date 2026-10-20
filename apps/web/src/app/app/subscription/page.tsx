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
  Globe,
  AlertCircle,
  HelpCircle,
  Lock,
  Phone,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

export default function SubscriptionPage() {
  const { currentTenant, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [assignedDevModal, setAssignedDevModal] = useState<any>(null);
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

      if (planId === 'starter') {
        setMessage({ type: 'error', text: 'Free starter tier has been discontinued. Please choose an active Essential, Pro or Enterprise plan.' });
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

  const handlePurchasePackage = async (packageId: 'developer_setup' | 'ota_setup') => {
    try {
      setPurchasingPackage(packageId);
      setMessage(null);

      const orderRes = await apiClient('/subscriptions/create-order', {
        method: 'POST',
        body: JSON.stringify({ packageId }),
      });

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency || 'INR',
          name: 'HotelFlexi by NovaX AI',
          description: orderRes.planName,
          order_id: orderRes.orderId,
          prefill: {
            name: user?.displayName || user?.email || '',
            email: user?.email,
          },
          theme: { color: '#1e40af' },
          handler: async function (response: any) {
            try {
              const verifyRes = await apiClient('/subscriptions/verify-payment', {
                method: 'POST',
                body: JSON.stringify({
                  packageId,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });

              setAssignedDevModal(verifyRes.assignedDeveloper || {
                name: 'Divyansh Shukla (HotelFlexi Technical Lead)',
                phone: '+91 8400999966',
                whatsappUrl: 'https://wa.me/918400999966',
                contactText: 'Kindly reach out to your assigned developer at wa.me/918400999966 with your property details.',
              });
            } catch (err: any) {
              setMessage({ type: 'error', text: err.message || 'Payment verification failed' });
            } finally {
              setPurchasingPackage(null);
            }
          },
          modal: {
            ondismiss: function () {
              setPurchasingPackage(null);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay checkout SDK is loading. Please try again.');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not initiate purchase' });
    } finally {
      setPurchasingPackage(null);
    }
  };

  const currentPlan = subData?.subscription;
  const entitlements = subData?.entitlements;
  const activePlanId = currentPlan?.current_plan_id || 'starter';

  const comparisonRows = [
    { name: 'Monthly Tariff (INR)', essential: '₹499 / mo', pro: '₹999 / mo', enterprise: '₹1,999 / mo' },
    { name: 'Room Inventory Capacity', essential: 'Up to 30 Rooms', pro: 'Up to 75 Rooms', enterprise: 'Unlimited Rooms' },
    { name: 'Staff User Logins', essential: '5 Users', pro: '15 Users', enterprise: 'Unlimited Staff' },
    { name: '2-Way Live Channel Manager (OTAs)', essential: 'No (Direct Only)', pro: '10 Live Channels (MMT, Agoda, Booking.com, Airbnb, Expedia)', enterprise: 'Unlimited Channels' },
    { name: 'Destination Wedding Engine', essential: false, pro: true, enterprise: true },
    { name: 'Housekeeping Urgency Siren', essential: true, pro: true, enterprise: true },
    { name: 'Direct Booking Engine', essential: true, pro: true, enterprise: true },
    { name: 'Google Hotel Center & FBL Feed', essential: true, pro: true, enterprise: true },
    { name: 'Guest Portal (FlexiLink)', essential: 'Full (ID & Child proof)', pro: 'Full (ID & Child proof)', enterprise: 'Full + Custom domain' },
    { name: 'In-Stay Room Service Orders', essential: true, pro: true, enterprise: true },
    { name: 'Dine-Out Table Bookings', essential: true, pro: true, enterprise: true },
    { name: 'Custom Hotel Website + Annual AMC', essential: false, pro: 'Included Free', enterprise: 'Included Free' },
    { name: 'GST Billing & Invoicing (12%/18%)', essential: true, pro: true, enterprise: true },
    { name: 'AI Business Agent Prompts', essential: '200 / mo', pro: '600 / mo', enterprise: 'Unlimited' },
    { name: 'Multi-Property Management', essential: false, pro: 'Up to 3 Properties', enterprise: 'Unlimited' },
    { name: 'Support SLA', essential: 'WhatsApp & Email', pro: 'Priority WhatsApp & Phone', enterprise: '24/7 Dedicated Manager' },
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
                    <th className="p-3.5 text-center">Essential (₹499)</th>
                    <th className="p-3.5 text-center text-brand-blue bg-blue-50/50">Pro (₹999)</th>
                    <th className="p-3.5 text-center">Enterprise (₹1,999)</th>
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
                        <td className="p-3.5 text-center">{renderVal(row.essential)}</td>
                        <td className="p-3.5 text-center bg-blue-50/20">{renderVal(row.pro)}</td>
                        <td className="p-3.5 text-center">{renderVal(row.enterprise)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* White-Glove Onboarding & Complete OTA Listing Assistance */}
          <div className="space-y-4 pt-2">
            <div>
              <h3 className="text-base font-extrabold text-content-primary-light">
                White-Glove Onboarding &amp; OTA Listing Packages
              </h3>
              <p className="text-xs text-content-secondary-light">
                Let our dedicated hospitality engineering team set up your hotel, map your inventory, and get you live on all OTAs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Package 1: Basic Developer Setup (Rs. 499) */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-lg flex flex-col justify-between space-y-4 border border-slate-800">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                      <Wrench className="w-3 h-3 text-blue-300" />
                      Basic Setup
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-white">₹499</div>
                      <span className="text-[9px] text-slate-400">One-Time</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white">Dedicated Developer PMS Setup</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    We configure your entire room inventory, rate plans, GST tax brackets, Razorpay payment gateway, and staff accounts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePurchasePackage('developer_setup')}
                  disabled={purchasingPackage === 'developer_setup'}
                  className="w-full text-center py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition shadow flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {purchasingPackage === 'developer_setup' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pay &amp; Hire Developer (₹499) &rarr;</span>
                    </>
                  )}
                </button>
              </div>

              {/* Package 2: Complete OTA Listing & HotelFlexi 2-Way Setup (Rs. 4,999) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-lg flex flex-col justify-between space-y-4 border border-blue-400/30">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      <Globe className="w-3 h-3 text-amber-300" />
                      Complete OTA Launch
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-amber-300">₹4,999</div>
                      <span className="text-[9px] text-blue-200">One-Time All-Inclusive</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white">Complete OTA Listing &amp; 2-Way Setup</h4>
                  <p className="text-[11px] text-blue-100 leading-relaxed">
                    Full hotel listing &amp; verification on Expedia, Booking.com, MakeMyTrip, Goibibo, Agoda + 2-way HotelFlexi channel sync &amp; staff onboarding.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePurchasePackage('ota_setup')}
                  disabled={purchasingPackage === 'ota_setup'}
                  className="w-full text-center py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition shadow flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {purchasingPackage === 'ota_setup' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 text-slate-900" />
                      <span>Pay &amp; Get Complete OTA Listing (₹4,999) &rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Developer Modal Popup after Payment */}
          {assignedDevModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Payment Verified!</span>
                    <h3 className="text-base font-extrabold text-slate-900">Your Developer is Assigned</h3>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <p className="text-slate-700 leading-relaxed">
                    Thank you! Your setup order has been confirmed. Here is your dedicated technical onboarding specialist:
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 space-y-1 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Lead:</span>
                      <strong className="text-slate-900">{assignedDevModal.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Direct Phone:</span>
                      <strong className="text-slate-900">{assignedDevModal.phone}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Support Hours:</span>
                      <strong className="text-slate-900">10:00 AM - 8:00 PM IST</strong>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Kindly reach out to him directly on WhatsApp with your hotel name and city to kick off your setup:
                </p>

                <div className="space-y-2 pt-1">
                  <a
                    href="https://wa.me/918400999966?text=Hi%20Divyansh%2C%20I%20have%20completed%20the%20payment%20for%20HotelFlexi%20Setup.%20Here%20are%20my%20property%20details."
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open WhatsApp (wa.me/918400999966) &rarr;</span>
                  </a>

                  <a
                    href="tel:+918400999966"
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call +91 8400999966</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setAssignedDevModal(null)}
                    className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
