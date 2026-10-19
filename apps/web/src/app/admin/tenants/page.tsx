'use client';

import React, { useEffect, useState } from 'react';
import { apiClient, formatINR } from '@/lib/api';
import { Users, Search, Lock, Unlock, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

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

  const handleUpdateStatus = async (tenantId: string, status: string) => {
    const reason = prompt(`Enter reason for marking tenant as ${status}:`, 'Administrative action');
    if (!reason) return;
    try {
      await apiClient(`/admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Status update failed');
    }
  };

  const handleExtendTrial = async (tenantId: string, days: number) => {
    if (!confirm(`Extend trial by ${days} days for this tenant?`)) return;
    try {
      await apiClient(`/admin/tenants/${tenantId}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ trialExtensionDays: days }),
      });
      await fetchTenants(query);
      alert(`Trial successfully extended by ${days} days.`);
    } catch (e: any) {
      alert(e.message || 'Trial extension failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-dark flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Tenant & Hotel Management
          </h1>
          <p className="text-xs text-content-secondary-dark">
            Inspect hotel organizations, override entitlements, manage trial expiry, and lock access
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-dark-surface border border-border-dark max-w-md">
        <form onSubmit={(e) => { e.preventDefault(); fetchTenants(query); }} className="relative">
          <Search className="w-4 h-4 text-content-secondary-dark absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by hotel name, owner email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-surface-dark-elevated border border-border-dark text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-surface-dark-surface rounded-2xl border border-border-dark">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-12 text-center bg-surface-dark-surface rounded-2xl border border-border-dark text-xs text-content-secondary-dark">
          No registered hotel tenants found matching search.
        </div>
      ) : (
        <div className="bg-surface-dark-surface rounded-2xl border border-border-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border-dark text-[10px] uppercase font-bold text-content-secondary-dark">
                <tr>
                  <th className="p-3.5">Hotel Name</th>
                  <th className="p-3.5">Owner Details</th>
                  <th className="p-3.5">Plan & Billing</th>
                  <th className="p-3.5">Rooms</th>
                  <th className="p-3.5">Access State</th>
                  <th className="p-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {tenants.map((t) => {
                  const isLocked = t.account_access_status === 'locked' || t.account_access_status === 'suspended';
                  return (
                    <tr key={t.id} className="hover:bg-surface-dark-elevated/50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{t.name}</div>
                        <div className="text-[10px] font-mono text-content-secondary-dark">Slug: {t.slug}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{t.owner_name || 'Owner'}</div>
                        <div className="text-[11px] text-content-secondary-dark">{t.owner_email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-purple-400 uppercase text-[11px]">
                          {t.plan_name || 'Starter'}
                        </span>
                        <div className="text-[10px] text-content-secondary-dark capitalize">
                          Status: {t.subscription_status}
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-white">
                        {t.room_count || 0} Rooms ({t.property_count || 1} Property)
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isLocked ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {t.account_access_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleExtendTrial(t.id, 14)}
                          className="px-2 py-1 rounded bg-surface-dark-elevated border border-border-dark text-[11px] font-semibold text-content-secondary-dark hover:text-white"
                        >
                          +14d Trial
                        </button>
                        {isLocked ? (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'active')}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700"
                          >
                            Unlock Access
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'locked')}
                            className="px-2.5 py-1 rounded bg-red-700 text-white font-semibold text-[11px] hover:bg-red-800"
                          >
                            Lock Access
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
    </div>
  );
}
