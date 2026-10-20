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
  Edit3,
  RotateCcw,
  Trash2,
  CreditCard,
  AlertTriangle,
  Hotel,
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

  // Status & Lockout modal
  const [statusModalTenant, setStatusModalTenant] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('Administrative compliance review');
  const [isPaymentIssue, setIsPaymentIssue] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Edit Details modal
  const [editModalTenant, setEditModalTenant] = useState<any>(null);
  const [editTenantName, setEditTenantName] = useState('');
  const [editPropertyName, setEditPropertyName] = useState('');
  const [editPropertyPhone, setEditPropertyPhone] = useState('');
  const [editPropertyEmail, setEditPropertyEmail] = useState('');
  const [editPropertyAddress, setEditPropertyAddress] = useState('');
  const [editPropertyCity, setEditPropertyCity] = useState('');
  const [editPropertyState, setEditPropertyState] = useState('');
  const [editPropertyPostalCode, setEditPropertyPostalCode] = useState('');
  const [editPropertyDescription, setEditPropertyDescription] = useState('');
  const [editPropertyStarRating, setEditPropertyStarRating] = useState('3');
  const [savingDetails, setSavingDetails] = useState(false);

  // Clear Data modal
  const [clearDataModalTenant, setClearDataModalTenant] = useState<any>(null);
  const [clearConfirmation, setClearConfirmation] = useState('');
  const [clearingData, setClearingData] = useState(false);

  // Delete Tenant modal
  const [deleteModalTenant, setDeleteModalTenant] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingTenant, setDeletingTenant] = useState(false);

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

  const openStatusModal = (tenant: any, defaultStatus: string, defaultPaymentIssue = false) => {
    setStatusModalTenant(tenant);
    setTargetStatus(defaultStatus);
    setIsPaymentIssue(defaultPaymentIssue);
    if (defaultPaymentIssue) {
      setStatusReason(
        'Software subscription bill unpaid. Please clear outstanding dues to restore hotel operations.'
      );
    } else {
      setStatusReason(
        defaultStatus === 'active'
          ? 'Account reviewed and verified by platform administrator'
          : 'Payment default / Terms compliance review'
      );
    }
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
          isPaymentIssue: isPaymentIssue && targetStatus !== 'active',
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

  // Open Edit Details Modal
  const openEditModal = async (tenant: any) => {
    setEditModalTenant(tenant);
    setEditTenantName(tenant.name || '');
    setEditPropertyName(tenant.name || '');
    setEditPropertyPhone(tenant.owner_phone || '');
    setEditPropertyEmail(tenant.owner_email || '');
    setEditPropertyAddress('');
    setEditPropertyCity('');
    setEditPropertyState('');
    setEditPropertyPostalCode('');
    setEditPropertyDescription('');
    setEditPropertyStarRating('3');

    try {
      const data = await apiClient(`/admin/tenants/${tenant.id}`);
      const prop = (data.properties || [])[0];
      if (prop) {
        setEditPropertyName(prop.name || tenant.name || '');
        setEditPropertyPhone(prop.phone || tenant.owner_phone || '');
        setEditPropertyEmail(prop.email || tenant.owner_email || '');
        setEditPropertyAddress(prop.address || '');
        setEditPropertyCity(prop.city || '');
        setEditPropertyState(prop.state || '');
        setEditPropertyPostalCode(prop.postal_code || '');
        setEditPropertyDescription(prop.description || '');
        setEditPropertyStarRating(String(prop.star_rating || '3'));
      }
    } catch (err) {
      console.warn('Could not pre-fetch full property details:', err);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalTenant) return;
    setSavingDetails(true);
    try {
      await apiClient(`/admin/tenants/${editModalTenant.id}/details`, {
        method: 'PATCH',
        body: JSON.stringify({
          tenantName: editTenantName,
          propertyName: editPropertyName,
          propertyPhone: editPropertyPhone,
          propertyEmail: editPropertyEmail,
          propertyAddress: editPropertyAddress,
          propertyCity: editPropertyCity,
          propertyState: editPropertyState,
          propertyPostalCode: editPropertyPostalCode,
          propertyDescription: editPropertyDescription,
          propertyStarRating: Number(editPropertyStarRating) || 3,
        }),
      });
      alert(`Property & hotel details updated successfully for ${editPropertyName || editTenantName}`);
      setEditModalTenant(null);
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Failed to update details');
    } finally {
      setSavingDetails(false);
    }
  };

  // Clear Test Data
  const handleClearData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearDataModalTenant) return;
    if (clearConfirmation !== 'CLEAR') {
      alert('Please type CLEAR to confirm.');
      return;
    }
    setClearingData(true);
    try {
      const res = await apiClient(`/admin/tenants/${clearDataModalTenant.id}/clear-data`, {
        method: 'POST',
        body: JSON.stringify({ confirmation: 'CLEAR' }),
      });
      alert(res.message || 'All test data purged successfully. Hotel reset to clean state.');
      setClearDataModalTenant(null);
      setClearConfirmation('');
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Failed to clear data');
    } finally {
      setClearingData(false);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalTenant) return;
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm.');
      return;
    }
    setDeletingTenant(true);
    try {
      const res = await apiClient(`/admin/tenants/${deleteModalTenant.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      alert(res.message || 'Tenant permanently deleted.');
      setDeleteModalTenant(null);
      setDeleteConfirmation('');
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Failed to delete tenant');
    } finally {
      setDeletingTenant(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Hotel Tenants &amp; Property Management
          </h1>
          <p className="text-xs text-content-secondary-dark mt-1">
            Edit hotel profiles, lock accounts for payment issues, clear test data, or manage plans.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-content-secondary-dark absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              fetchTenants(e.target.value);
            }}
            placeholder="Search hotel name, email..."
            className="w-full pl-9 pr-3 py-2 bg-surface-dark-surface border border-border-dark rounded-xl text-xs text-white placeholder-content-secondary-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Tenants Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-content-secondary-dark">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400 mr-2" />
          Loading registered hotels...
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-8 text-center text-xs text-content-secondary-dark bg-surface-dark-surface rounded-2xl border border-border-dark">
          No hotel tenants found matching &quot;{query}&quot;
        </div>
      ) : (
        <div className="bg-surface-dark-surface border border-border-dark rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-dark-elevated text-content-secondary-dark font-bold uppercase tracking-wider border-b border-border-dark text-[10px]">
                <tr>
                  <th className="p-3.5">Hotel / Organization</th>
                  <th className="p-3.5">Owner Contact</th>
                  <th className="p-3.5">Subscription Plan</th>
                  <th className="p-3.5">Inventory</th>
                  <th className="p-3.5">Access Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {tenants.map((t) => {
                  const isLocked =
                    t.account_access_status === 'locked' ||
                    t.account_access_status === 'suspended' ||
                    t.subscription_status === 'payment_issue';
                  const isPaymentBlocked =
                    t.subscription_status === 'payment_issue' ||
                    (t.suspension_reason && t.suspension_reason.toLowerCase().includes('due'));

                  return (
                    <tr key={t.id} className="hover:bg-surface-dark-elevated/50 transition">
                      <td className="p-3.5 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>{t.name}</span>
                        </div>
                        <div className="text-[10px] text-content-secondary-dark font-mono font-normal">
                          slug: /{t.slug}
                        </div>
                      </td>

                      <td className="p-3.5 text-content-secondary-dark">
                        <div className="text-white font-semibold flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {t.owner_email}
                        </div>
                        {t.owner_phone && (
                          <div className="text-[10px] text-content-secondary-dark flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {t.owner_phone}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-white capitalize">{t.plan_name || 'Starter Plan'}</div>
                        <div className="text-[10px] text-content-secondary-dark">
                          Status:{' '}
                          <span
                            className={`font-semibold ${
                              t.subscription_status === 'active'
                                ? 'text-emerald-400'
                                : isPaymentBlocked
                                ? 'text-red-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {isPaymentBlocked ? 'Payment Due Lock' : t.subscription_status}
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
                          {isPaymentBlocked ? 'Payment Locked' : t.account_access_status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Edit Details */}
                        <button
                          onClick={() => openEditModal(t)}
                          title="Edit Property, Hotel Name, Phone, and Details"
                          className="px-2.5 py-1.5 rounded-lg bg-surface-dark-elevated hover:bg-border-dark text-slate-200 border border-border-dark font-semibold text-xs transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                          Edit Details
                        </button>

                        {/* Upgrade Plan Button */}
                        <button
                          onClick={() => openPlanModal(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow"
                        >
                          Plan
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
                            onClick={() => openStatusModal(t, 'locked', true)}
                            title="Lock account for unpaid software bill / dues"
                            className="px-2.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition"
                          >
                            <Lock className="w-3.5 h-3.5 inline mr-1" />
                            Lock (Payment Dues)
                          </button>
                        )}

                        {/* Clear Data */}
                        <button
                          onClick={() => {
                            setClearDataModalTenant(t);
                            setClearConfirmation('');
                          }}
                          title="Purge all test reservations, housekeeping, folios for clean slate"
                          className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/60 font-semibold text-xs transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                          Clear Data
                        </button>

                        {/* Delete Tenant */}
                        <button
                          onClick={() => {
                            setDeleteModalTenant(t);
                            setDeleteConfirmation('');
                          }}
                          title="Permanently delete property & tenant"
                          className="px-2 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/60 font-semibold text-xs transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT PROPERTY & HOTEL DETAILS MODAL */}
      {editModalTenant && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-dark-surface border border-border-dark rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-blue-400" />
                  Edit Hotel &amp; Property Details: {editModalTenant.name}
                </h3>
                <p className="text-xs text-content-secondary-dark">
                  Super admin override for hotel name, address, contact, and description
                </p>
              </div>
              <button
                onClick={() => setEditModalTenant(null)}
                className="text-content-secondary-dark hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Organization / Tenant Name
                  </label>
                  <input
                    type="text"
                    value={editTenantName}
                    onChange={(e) => setEditTenantName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Property Display Name
                  </label>
                  <input
                    type="text"
                    value={editPropertyName}
                    onChange={(e) => setEditPropertyName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPropertyPhone}
                    onChange={(e) => setEditPropertyPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={editPropertyEmail}
                    onChange={(e) => setEditPropertyEmail(e.target.value)}
                    placeholder="stay@hotel.com"
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={editPropertyAddress}
                  onChange={(e) => setEditPropertyAddress(e.target.value)}
                  placeholder="Plot 14, Beach Road"
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={editPropertyCity}
                    onChange={(e) => setEditPropertyCity(e.target.value)}
                    placeholder="Goa"
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={editPropertyState}
                    onChange={(e) => setEditPropertyState(e.target.value)}
                    placeholder="Goa"
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={editPropertyPostalCode}
                    onChange={(e) => setEditPropertyPostalCode(e.target.value)}
                    placeholder="403001"
                    className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Property Description
                </label>
                <textarea
                  value={editPropertyDescription}
                  onChange={(e) => setEditPropertyDescription(e.target.value)}
                  rows={3}
                  placeholder="A premium boutique stay offering luxurious rooms..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-border-dark flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-border-dark text-xs text-slate-300 hover:bg-surface-dark-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingDetails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{savingDetails ? 'Saving...' : 'Save Details'}</span>
                </button>
              </div>
            </form>
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

      {/* LOCK / STATUS / PAYMENT BLOCK MODAL */}
      {statusModalTenant && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-dark-surface border border-border-dark rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Account Access Control: {statusModalTenant.name}
                </h3>
                <p className="text-xs text-content-secondary-dark">
                  Strict backend lock &amp; payment default suspension
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
                  Access Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => {
                    setTargetStatus(e.target.value);
                    if (e.target.value === 'active') {
                      setIsPaymentIssue(false);
                      setStatusReason('Account restored and verified by administrator');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active (Full PMS &amp; Operations Access)</option>
                  <option value="suspended">Suspended (Temporary Freeze / Billing Default)</option>
                  <option value="locked">Locked (Strict Lock - Disables Staff &amp; Operational APIs)</option>
                </select>
              </div>

              {targetStatus !== 'active' && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="payment-issue-cb"
                    checked={isPaymentIssue}
                    onChange={(e) => {
                      setIsPaymentIssue(e.target.checked);
                      if (e.target.checked) {
                        setStatusReason('Software subscription bill unpaid. Please clear outstanding dues to restore hotel operations.');
                      }
                    }}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="payment-issue-cb" className="text-xs text-red-200 cursor-pointer">
                    <strong className="block text-white font-bold">Unpaid Dues / Payment Lockout</strong>
                    Rejects all operational requests with HTTP 402 and renders unbypassable lockout overlay directing the hotelier to clear dues.
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Reason Displayed to Hotelier
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

      {/* CLEAR ALL DATA MODAL */}
      {clearDataModalTenant && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-dark-surface border border-border-dark rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Clear All Test Data: {clearDataModalTenant.name}
                  </h3>
                  <p className="text-[11px] text-content-secondary-dark">
                    Purge test reservations &amp; start with a clean slate
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClearDataModalTenant(null)}
                className="text-content-secondary-dark hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 space-y-1">
              <p className="font-bold text-white">What will be deleted:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>All reservations, guest records, and folios</li>
                <li>All housekeeping tasks and maintenance tickets</li>
                <li>All complaints and billing invoices</li>
                <li>Rooms will be reset to Clean / Ready</li>
              </ul>
              <p className="pt-1 text-[11px] text-slate-300">
                Property details, room categories, and staff user logins are preserved!
              </p>
            </div>

            <form onSubmit={handleClearData} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Type <strong className="text-amber-400 font-mono">CLEAR</strong> to confirm
                </label>
                <input
                  type="text"
                  value={clearConfirmation}
                  onChange={(e) => setClearConfirmation(e.target.value)}
                  placeholder="CLEAR"
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-border-dark flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClearDataModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-border-dark text-xs text-slate-300 hover:bg-surface-dark-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clearingData || clearConfirmation !== 'CLEAR'}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-900 font-extrabold text-xs shadow transition disabled:opacity-40"
                >
                  {clearingData ? 'Clearing Data...' : 'Purge All Test Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TENANT MODAL */}
      {deleteModalTenant && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-dark-surface border border-red-900/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Permanently Delete Hotel: {deleteModalTenant.name}
                  </h3>
                  <p className="text-[11px] text-content-secondary-dark">
                    Irreversible destruction of property and all data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalTenant(null)}
                className="text-content-secondary-dark hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-200">
              <strong className="block text-white mb-1">Warning: Irreversible Action</strong>
              This will permanently delete the hotel property, all rooms, staff memberships, and channel listings from the database.
            </div>

            <form onSubmit={handleDeleteTenant} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Type <strong className="text-red-400 font-mono">DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark-elevated border border-border-dark text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-border-dark flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-border-dark text-xs text-slate-300 hover:bg-surface-dark-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingTenant || deleteConfirmation !== 'DELETE'}
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-extrabold text-xs shadow transition disabled:opacity-40"
                >
                  {deletingTenant ? 'Deleting Hotel...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
