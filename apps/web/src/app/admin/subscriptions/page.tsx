'use client';

import React, { useEffect, useState } from 'react';
import { apiClient, formatINR } from '@/lib/api';
import {
  DollarSign,
  Edit2,
  CheckCircle2,
  Loader2,
  Globe,
  Layers,
  Sparkles,
  Shield,
  X,
  Plus,
  Sliders,
} from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form states for plan editing
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyRupees, setMonthlyRupees] = useState(0);
  const [annualRupees, setAnnualRupees] = useState(0);
  const [maxRooms, setMaxRooms] = useState(10);
  const [maxProperties, setMaxProperties] = useState(1);
  const [maxUsers, setMaxUsers] = useState(2);
  const [hasChannelManager, setHasChannelManager] = useState(false);
  const [maxChannelConnections, setMaxChannelConnections] = useState(0);
  const [hasCustomWebsite, setHasCustomWebsite] = useState(false);
  const [hasWebsiteMaintenance, setHasWebsiteMaintenance] = useState(false);
  const [aiMonthlyLimit, setAiMonthlyLimit] = useState(100);
  const [hasAdvancedReports, setHasAdvancedReports] = useState(false);
  const [hasAccounting, setHasAccounting] = useState(false);

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

  const openEditModal = (p: any) => {
    setEditingPlan(p);
    setName(p.name || '');
    setDescription(p.description || '');
    setMonthlyRupees(Math.round(p.monthly_price_paise / 100));
    setAnnualRupees(Math.round(p.annual_price_paise / 100));
    setMaxRooms(p.max_rooms || 10);
    setMaxProperties(p.max_properties || 1);
    setMaxUsers(p.max_users || 2);
    setHasChannelManager(Boolean(p.has_channel_manager));
    setMaxChannelConnections(p.max_channel_connections || 0);
    setHasCustomWebsite(Boolean(p.has_custom_website));
    setHasWebsiteMaintenance(Boolean(p.has_website_maintenance));
    setAiMonthlyLimit(p.ai_monthly_limit || 100);
    setHasAdvancedReports(Boolean(p.has_advanced_reports));
    setHasAccounting(Boolean(p.has_accounting));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);
    try {
      await apiClient(`/admin/plans/${editingPlan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          monthlyPricePaise: Math.round(Number(monthlyRupees) * 100),
          annualPricePaise: Math.round(Number(annualRupees) * 100),
          maxRooms: Number(maxRooms),
          maxProperties: Number(maxProperties),
          maxUsers: Number(maxUsers),
          hasChannelManager,
          maxChannelConnections: Number(maxChannelConnections),
          hasCustomWebsite,
          hasWebsiteMaintenance,
          aiMonthlyLimit: Number(aiMonthlyLimit),
          hasAdvancedReports,
          hasAccounting,
        }),
      });
      alert(`Plan '${name}' updated successfully!`);
      setEditingPlan(null);
      await fetchPlans();
    } catch (e: any) {
      alert(e.message || 'Failed to update plan settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            SaaS Subscription Plans &amp; Feature Model
          </h1>
          <p className="text-xs text-content-secondary-dark mt-1">
            Configure plan pricing, room limits, custom website inclusion, channel manager quotas, and AI allowances.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60 text-xs font-mono font-bold self-start sm:self-auto">
          {plans.length} Configured Tiers
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-surface-dark-surface rounded-2xl border border-border-dark">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isFree = p.monthly_price_paise === 0;

            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl bg-surface-dark-surface border flex flex-col justify-between space-y-5 transition shadow-lg ${
                  p.id === 'essential'
                    ? 'border-purple-600 ring-2 ring-purple-600/30'
                    : 'border-border-dark'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-purple-400 uppercase font-black px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60">
                      Tier: {p.id}
                    </span>
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg bg-surface-dark-elevated text-purple-400 hover:text-white border border-border-dark transition"
                      title="Edit Plan Model & Limits"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-lg font-black text-white mt-3">{p.name}</h3>
                  <p className="text-xs text-content-secondary-dark mt-1 line-clamp-2 min-h-[32px]">
                    {p.description}
                  </p>

                  <div className="mt-4 pb-4 border-b border-border-dark">
                    <div className="text-2xl font-black text-white">
                      {isFree ? '₹0 Free' : formatINR(p.monthly_price_paise)}
                      <span className="text-xs text-slate-400 font-normal"> /mo</span>
                    </div>
                    <div className="text-[11px] text-content-secondary-dark font-mono mt-0.5">
                      {isFree ? 'Free forever' : `Annual: ${formatINR(p.annual_price_paise)} /yr`}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-content-secondary-dark">
                    <div className="flex justify-between items-center">
                      <span>Room Capacity:</span>
                      <span className="font-bold text-white font-mono">{p.max_rooms} Rooms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Properties Allowed:</span>
                      <span className="font-bold text-white font-mono">{p.max_properties} Property</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Staff Logins:</span>
                      <span className="font-bold text-white font-mono">{p.max_users} Staff</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Channel Manager:</span>
                      <span className={`font-bold font-mono ${p.has_channel_manager ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.has_channel_manager ? `${p.max_channel_connections || 2} OTAs` : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>AI Commands:</span>
                      <span className="font-bold text-white font-mono">{p.ai_monthly_limit} /mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Custom Website + AMC:</span>
                      <span className={`font-bold font-mono ${p.has_custom_website ? 'text-amber-400' : 'text-slate-500'}`}>
                        {p.has_custom_website ? 'Included' : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openEditModal(p)}
                  className="w-full py-2.5 rounded-xl bg-surface-dark-elevated hover:bg-purple-600/20 border border-border-dark text-purple-300 font-bold text-xs transition text-center"
                >
                  Configure Limits &amp; Pricing
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT PLAN CONFIGURATION MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface-dark-surface border border-border-dark rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl text-white my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  Configure Subscription Tier: {editingPlan.name}
                </h3>
                <p className="text-xs text-content-secondary-dark">
                  Adjust plan pricing, quotas, features, and website maintenance inclusions
                </p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-content-secondary-dark hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Plan Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Internal Identifier (Read-only)
                  </label>
                  <input
                    type="text"
                    value={editingPlan.id}
                    disabled
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated/40 border border-border-dark text-xs text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Plan Description &amp; Target Hoteliers
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface-dark-elevated/50 border border-border-dark">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Monthly Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={monthlyRupees}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMonthlyRupees(val);
                      setAnnualRupees(val * 10);
                    }}
                    placeholder="0 for Free"
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-surface border border-border-dark text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <span className="text-[10px] text-content-secondary-dark">
                    Set 0 for Free Starter plan
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Annual Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={annualRupees}
                    onChange={(e) => setAnnualRupees(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-surface border border-border-dark text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <span className="text-[10px] text-content-secondary-dark">
                    Usually 10 months (2 months free)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Max Rooms</label>
                  <input
                    type="number"
                    min="1"
                    value={maxRooms}
                    onChange={(e) => setMaxRooms(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Max Properties</label>
                  <input
                    type="number"
                    min="1"
                    value={maxProperties}
                    onChange={(e) => setMaxProperties(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Max Staff Logins</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark-elevated/40 border border-border-dark cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasChannelManager}
                    onChange={(e) => setHasChannelManager(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white block">
                      Enable Live 2-Way OTA Channel Manager
                    </span>
                    <span className="text-[11px] text-content-secondary-dark block">
                      Syncs with MakeMyTrip, Agoda, Booking.com, Airbnb &amp; Expedia
                    </span>
                  </div>
                  {hasChannelManager && (
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={maxChannelConnections}
                        onChange={(e) => setMaxChannelConnections(Number(e.target.value))}
                        placeholder="OTAs"
                        className="w-full px-2 py-1 rounded bg-surface-dark-surface border border-border-dark text-xs font-mono text-white text-center"
                        title="Maximum OTA connections allowed"
                      />
                    </div>
                  )}
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark-elevated/40 border border-border-dark cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCustomWebsite}
                    onChange={(e) => {
                      setHasCustomWebsite(e.target.checked);
                      if (e.target.checked) setHasWebsiteMaintenance(true);
                    }}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-amber-300 block">
                      Include Custom Hotel Website with Free Domain &amp; Hosting
                    </span>
                    <span className="text-[11px] text-content-secondary-dark block">
                      Growth plan feature: HotelFlexi team builds and hosts a high-converting direct booking website
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-dark-elevated/40 border border-border-dark cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasWebsiteMaintenance}
                    onChange={(e) => setHasWebsiteMaintenance(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white block">
                      Managed Website Annual Maintenance (AMC Included)
                    </span>
                    <span className="text-[11px] text-content-secondary-dark block">
                      Continuous updates, SSL certificates, menu refreshes, and seasonal promotional banners
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-dark-elevated/40 border border-border-dark">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Bilingual AI Assistant Monthly Quota
                    </span>
                    <span className="text-[11px] text-content-secondary-dark block">
                      Number of voice/text commands allowed per month
                    </span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={aiMonthlyLimit}
                    onChange={(e) => setAiMonthlyLimit(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded bg-surface-dark-surface border border-border-dark text-xs font-mono text-white text-center"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border-dark flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl border border-border-dark text-xs text-slate-300 hover:bg-surface-dark-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Plan Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
