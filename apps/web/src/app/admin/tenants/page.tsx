'use client';

import React, { useEffect, useState } from 'react';
import { apiClient, formatINR } from '@/lib/api';
import {
  Users,
  Search,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Calendar,
  X,
  Phone,
  Mail,
  Building,
} from 'lucide-react';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Modals state
  const [planModalTenant, setPlanModalTenant] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('essential');
  const [selectedSubStatus, setSelectedSubStatus] = useState('active');
  const [trialDays, setTrialDays] = useState(14);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const [statusModalTenant, setStatusModalTenant] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('Administrative compliance review');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTenants = async (q = '') => {
    setLoading(true);
    try {
      const data = await apiClient(`/admin/tenants?q=${encodeURIComponent(q)}`);
      setTenants(data.tenants || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const openPlanModal = (tenant: any) => {
    setPlanModalTenant(tenant);
    setSelectedPlanId(tenant.current_plan_id || 'essential');
    setSelectedSubStatus(tenant.subscription_status || 'active');
    setTrialDays(0);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planModalTenant) return;
    setUpdatingPlan(true);
    try {
      await apiClient(`/admin/tenants/${planModalTenant.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({
          planId: selectedPlanId,
          subscriptionStatus: selectedSubStatus,
          trialExtensionDays: Number(trialDays) || 0,
        }),
      });
      alert(`Plan updated successfully for ${planModalTenant.name}`);
      setPlanModalTenant(null);
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Failed to update plan');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const openStatusModal = (tenant: any, defaultStatus: string) => {
    setStatusModalTenant(tenant);
    setTargetStatus(defaultStatus);
    setStatusReason(
      defaultStatus === 'active'
        ? 'Account reviewed and verified by super-admin'
        : 'Payment default / Terms compliance review'
    );
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalTenant) return;
    setUpdatingStatus(true);
    try {
      await apiClient(`/admin/tenants/${statusModalTenant.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason,
        }),
      });
      alert(`Account status updated to ${targetStatus}`);
      setStatusModalTenant(null);
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Status update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-purple-400" />
            Hotel &amp; Tenant Management
          </h1>
          <p className="text-xs text-content-secondary-dark mt-1">
            Upgrade hotel subscription plans, extend trials, lock/suspend access, and manage property overrides.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60 text-xs font-mono font-bold self-start sm:self-auto">
          {tenants.length} Registered Properties
        </span>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchTenants(query);
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-content-secondary-dark absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hotel name, owner email or phone..."
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-surface-dark-surface border border-border-dark text-white placeholder:text-content-secondary-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-surface-dark-surface rounded-2xl border border-border-dark">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-12 text-center bg-surface-dark-surface rounded-2xl border border-border-dark text-xs text-content-secondary-dark">
          No registered hotel tenants found matching search query.
        </div>
      ) : (
        /* Responsive Table & Card Views */
        <div className="bg-surface-dark-surface rounded-2xl border border-border-dark overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="border-b border-border-dark text-[10px] uppercase font-bold text-content-secondary-dark bg-surface-dark-elevated/40">
                <tr>
                  <th className="p-3.5">Hotel &amp; Code</th>
                  <th className="p-3.5">Owner Details</th>
                  <th className="p-3.5">Plan &amp; Billing</th>
                  <th className="p-3.5">Rooms</th>
                  <th className="p-3.5">Account State</th>
                  <th className="p-3.5 text-right">Super-Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {tenants.map((t) => {
                  const isLocked =
                    t.account_access_status === 'locked' ||
                    t.account_access_status === 'suspended';
                  const hotelCode =
                    t.hotel_code ||
                    (t.id
                      ? (
                          Math.abs(
                            t.id
                              .split('')
                              .reduce(
                                (acc: number, char: string) =>
                                  ((acc << 5) - acc + char.charCodeAt(0)) | 0,
                                0
                              )
                          ) % 90000 +
                          10000
                        ).toString()
                      : '58291');

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-surface-dark-elevated/50 transition group"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{t.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-purple-300 font-mono text-[10px] font-bold">
                            #{hotelCode}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-content-secondary-dark mt-0.5">
                          ID: {t.id}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-white">
                          {t.owner_name || 'Property Owner'}
                        </div>
                        <div className="text-[11px] text-content-secondary-dark flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {t.owner_email}
                        </div>
                        {t.owner_phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {t.owner_phone}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="font-black text-purple-400 uppercase text-xs">
                          {t.plan_name || t.current_plan_id || 'Essential'}
                        </span>
                        <div className="text-[10px] text-content-secondary-dark capitalize mt-0.5">
                          Status:{' '}
                          <span
                            className={`font-semibold ${
                              t.subscription_status === 'active'
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {t.subscription_status}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-white">
                        {t.room_count || 0} Rooms
                        <div className="text-[10px] text-content-secondary-dark font-normal">
                          {t.property_count || 1} Property
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isLocked
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {t.account_access_status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                        {/* Upgrade Plan Button */}
                        <button
                          onClick={() => openPlanModal(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow"
                        >
                          Change Plan
                        </button>

                        {/* Lock / Unlock Toggle */}
                        {isLocked ? (
                          <button
                            onClick={() => openStatusModal(t, 'active')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                          >
                            <Unlock className="w-3.5 h-3.5 inline mr-1" />
                            Unlock
                          </button>
                        ) : (
                          <button
                            onClick={() => openStatusModal(t, 'locked')}
                            className="px-2.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition"
                          >
                            <Lock className="w-3.5 h-3.5 inline mr-1" />
                            Lock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLAN UPGRADE MODAL */}
      {planModalTenant && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-dark-surface border border-border-dark rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Upgrade Plan for {planModalTenant.name}
                </h3>
                <p className="text-xs text-content-secondary-dark">
                  Assign subscription tier and update live entitlements
                </p>
              </div>
              <button
                onClick={() => setPlanModalTenant(null)}
                className="text-content-secondary-dark hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Select Subscription Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="starter">Free Starter Plan (₹0 / mo - Basic PMS &amp; Engine)</option>
                  <option value="essential">Essential Plan (₹499 / mo - Live Channel Manager &amp; Siren)</option>
                  <option value="growth">Growth Plan (₹1,499 / mo - Website + Maintenance)</option>
                  <option value="pro">Pro Plan (₹2,999 / mo - Multi-Property Scale)</option>
                  <option value="enterprise">Enterprise Plan (₹3,999 / mo - Custom CRS &amp; SLA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Subscription Status
                </label>
                <select
                  value={selectedSubStatus}
                  onChange={(e) => setSelectedSubStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active (Paid / Subscribed)</option>
                  <option value="trial">Trial (Free 14-day trial period)</option>
                  <option value="past_due">Past Due (Payment Pending)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Extend Trial Duration (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  placeholder="0 (no extension)"
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-content-secondary-dark mt-1">
                  Enter days to add to current trial period (e.g. 14 for two weeks, 30 for one month).
                </p>
              </div>

              <div className="pt-3 border-t border-border-dark flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPlanModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-border-dark text-xs text-slate-300 hover:bg-surface-dark-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPlan}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {updatingPlan ? 'Saving...' : 'Apply Plan Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCK / STATUS MODAL */}
      {statusModalTenant && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-dark-surface border border-border-dark rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Update Access Status: {statusModalTenant.name}
                </h3>
                <p className="text-xs text-content-secondary-dark">
                  Lock or suspend hotel PMS access immediately
                </p>
              </div>
              <button
                onClick={() => setStatusModalTenant(null)}
                className="text-content-secondary-dark hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active (Full PMS Access)</option>
                  <option value="suspended">Suspended (Temporary Freeze / Billing Default)</option>
                  <option value="locked">Locked (Strict Lock - Disables Staff Logins)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Reason for Action
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-border-dark flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-border-dark text-xs text-slate-300 hover:bg-surface-dark-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow transition disabled:opacity-50 ${
                    targetStatus === 'active'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-red-700 hover:bg-red-600'
                  }`}
                >
                  {updatingStatus ? 'Updating...' : `Confirm ${targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
