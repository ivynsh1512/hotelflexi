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
  ShieldCheck,
  Ban,
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

  // Approve Deletion modal (Account Purge requested by Hotelier)
  const [approveDeletionTenant, setApproveDeletionTenant] = useState<any>(null);
  const [approveConfirmText, setApproveConfirmText] = useState('');
  const [approvingDeletion, setApprovingDeletion] = useState(false);

  // Reject Deletion modal
  const [rejectDeletionTenant, setRejectDeletionTenant] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingDeletion, setRejectingDeletion] = useState(false);

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

  const openStatusModal = (tenant: any, defaultStatus = 'active', paymentBlock = false) => {
    setStatusModalTenant(tenant);
    setTargetStatus(defaultStatus);
    setIsPaymentIssue(paymentBlock);
    if (paymentBlock) {
      setStatusReason('Software subscription bill unpaid. Please clear outstanding dues to restore hotel operations.');
    } else if (defaultStatus === 'active') {
      setStatusReason('Account restored and verified by administrator');
    } else {
      setStatusReason(tenant.suspension_reason || 'Administrative review freeze');
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
          isPaymentDefault: isPaymentIssue,
        }),
      });
      alert(`Status updated to "${targetStatus}" for ${statusModalTenant.name}`);
      setStatusModalTenant(null);
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openEditModal = (tenant: any) => {
    setEditModalTenant(tenant);
    setEditTenantName(tenant.name || '');
    setEditPropertyName(tenant.property_name || tenant.name || '');
    setEditPropertyPhone(tenant.owner_phone || '');
    setEditPropertyEmail(tenant.owner_email || '');
    setEditPropertyAddress(tenant.address_line1 || '');
    setEditPropertyCity(tenant.city || '');
    setEditPropertyState(tenant.state || '');
    setEditPropertyPostalCode(tenant.postal_code || '');
    setEditPropertyDescription(tenant.description || '');
    setEditPropertyStarRating(String(tenant.star_rating || 3));
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

  // Approve Hotelier's Deletion Request
  const handleApproveDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveDeletionTenant) return;
    if (approveConfirmText !== 'DELETE') {
      alert('Please type DELETE to execute the purge.');
      return;
    }
    setApprovingDeletion(true);
    try {
      const res = await apiClient(`/admin/tenants/${approveDeletionTenant.id}/approve-deletion`, {
        method: 'POST',
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      alert(res.message || 'Account & hotel data successfully purged from the database.');
      setApproveDeletionTenant(null);
      setApproveConfirmText('');
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Failed to execute deletion');
    } finally {
      setApprovingDeletion(false);
    }
  };

  // Reject Hotelier's Deletion Request
  const handleRejectDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectDeletionTenant) return;
    setRejectingDeletion(true);
    try {
      const res = await apiClient(`/admin/tenants/${rejectDeletionTenant.id}/reject-deletion`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason || 'Declined by Super Admin compliance' }),
      });
      alert(res.message || 'Deletion request rejected.');
      setRejectDeletionTenant(null);
      setRejectReason('');
      await fetchTenants(query);
    } catch (e: any) {
      alert(e.message || 'Failed to reject deletion');
    } finally {
      setRejectingDeletion(false);
    }
  };

  const pendingDeletions = tenants.filter((t) => t.deletion_status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-blue" />
            Hotel Tenants &amp; Property Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Edit hotel profiles, manage subscription tiers, lock delinquent accounts, or review data purge requests.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              fetchTenants(e.target.value);
            }}
            placeholder="Search hotel name, email..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {/* Pending Account Deletion Requests Alert Banner */}
      {pendingDeletions.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-red-900">
                  {pendingDeletions.length} Hotelier Account Deletion Request{pendingDeletions.length > 1 ? 's' : ''} Pending Review
                </h3>
                <p className="text-xs text-red-700">
                  The following hoteliers requested complete data purge and closure of their HotelFlexi account.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {pendingDeletions.map((pt) => (
              <div
                key={pt.id}
                className="p-3.5 bg-white rounded-xl border border-red-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{pt.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 font-normal">({pt.slug})</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-3 text-[11px]">
                    <span>Owner: {pt.owner_email}</span>
                    {pt.deletion_requested_at && (
                      <span>Requested: {new Date(pt.deletion_requested_at).toLocaleDateString('en-IN')}</span>
                    )}
                  </div>
                  {pt.deletion_reason && (
                    <div className="text-slate-500 italic text-[11px]">
                      Reason: &ldquo;{pt.deletion_reason}&rdquo;
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setRejectDeletionTenant(pt);
                      setRejectReason('');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => {
                      setApproveDeletionTenant(pt);
                      setApproveConfirmText('');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Approve Deletion &amp; Purge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenants Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-brand-blue mr-2" />
          Loading registered hotels...
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          No hotel tenants found matching &quot;{query}&quot;
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-3.5">Hotel / Organization</th>
                  <th className="p-3.5">Owner Contact</th>
                  <th className="p-3.5">Subscription Plan</th>
                  <th className="p-3.5">Inventory</th>
                  <th className="p-3.5">Access Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t) => {
                  const isLocked =
                    t.account_access_status === 'locked' ||
                    t.account_access_status === 'suspended' ||
                    t.subscription_status === 'payment_issue';
                  const isPaymentBlocked =
                    t.subscription_status === 'payment_issue' ||
                    (t.suspension_reason && t.suspension_reason.toLowerCase().includes('due'));
                  const isPendingDeletion = t.deletion_status === 'pending';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-brand-blue shrink-0" />
                          <span>{t.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          slug: /{t.slug}
                        </div>
                        {isPendingDeletion && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold text-[9px] border border-red-200">
                            <AlertTriangle className="w-2.5 h-2.5" /> Deletion Requested
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600">
                        <div className="text-slate-800 font-semibold flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {t.owner_email}
                        </div>
                        {t.owner_phone && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {t.owner_phone}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 capitalize">{t.plan_name || 'Starter Plan'}</div>
                        <div className="text-[10px] text-slate-500">
                          Status:{' '}
                          <span
                            className={`font-semibold ${
                              t.subscription_status === 'active'
                                ? 'text-emerald-600'
                                : isPaymentBlocked
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {isPaymentBlocked ? 'Payment Due Lock' : t.subscription_status}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800">
                        {t.room_count || 0} Rooms
                        <div className="text-[10px] text-slate-500 font-normal">
                          {t.property_count || 1} Property
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPendingDeletion
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : isLocked
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isPendingDeletion ? 'Pending Purge' : isPaymentBlocked ? 'Payment Locked' : t.account_access_status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Edit Details */}
                          <button
                            onClick={() => openEditModal(t)}
                            title="Edit Property, Hotel Name, Phone, and Details"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs transition"
                          >
                            <Edit3 className="w-3.5 h-3.5 inline mr-1 text-brand-blue" />
                            Edit
                          </button>

                          {/* Upgrade Plan Button */}
                          <button
                            onClick={() => openPlanModal(t)}
                            className="px-2.5 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs transition shadow-xs"
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
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                            >
                              <Lock className="w-3.5 h-3.5 inline mr-1" />
                              Lock
                            </button>
                          )}

                          {/* Clear Data */}
                          <button
                            onClick={() => {
                              setClearDataModalTenant(t);
                              setClearConfirmation('');
                            }}
                            title="Purge all test reservations, housekeeping, folios for clean slate"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-800 border border-slate-200 font-semibold text-xs transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                            Reset
                          </button>

                          {/* Delete Tenant */}
                          <button
                            onClick={() => {
                              setDeleteModalTenant(t);
                              setDeleteConfirmation('');
                            }}
                            title="Permanently delete property & tenant"
                            className="px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVE DELETION & PURGE MODAL */}
      {approveDeletionTenant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Approve Account Purge: {approveDeletionTenant.name}
                  </h3>
                  <p className="text-[11px] text-red-600 font-semibold">
                    Irreversible destruction of hotel &amp; records
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApproveDeletionTenant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1.5">
              <p className="font-bold">The hotelier requested account deletion:</p>
              <p className="italic">&ldquo;{approveDeletionTenant.deletion_reason || 'No reason specified'}&rdquo;</p>
              <p className="text-[11px] pt-1">
                Executing this will immediately purge all property settings, rooms, rates, reservations, folios, invoices, and staff memberships.
              </p>
            </div>

            <form onSubmit={handleApproveDeletion} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type <strong className="text-red-600 font-mono font-bold">DELETE</strong> to confirm execution
                </label>
                <input
                  type="text"
                  value={approveConfirmText}
                  onChange={(e) => setApproveConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-red-300 text-xs text-red-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApproveDeletionTenant(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approvingDeletion || approveConfirmText !== 'DELETE'}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {approvingDeletion ? 'Purging Records...' : 'Approve & Purge All Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT DELETION MODAL */}
      {rejectDeletionTenant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                Reject Deletion Request: {rejectDeletionTenant.name}
              </h3>
              <button
                onClick={() => setRejectDeletionTenant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectDeletion} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for rejection <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Active bookings exist, pending settlement..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectDeletionTenant(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectingDeletion}
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {rejectingDeletion ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROPERTY & HOTEL DETAILS MODAL */}
      {editModalTenant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-brand-blue" />
                  Edit Hotel &amp; Property Details: {editModalTenant.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Super admin override for hotel name, address, contact, and description
                </p>
              </div>
              <button
                onClick={() => setEditModalTenant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Organization / Tenant Name
                  </label>
                  <input
                    type="text"
                    value={editTenantName}
                    onChange={(e) => setEditTenantName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Property Display Name
                  </label>
                  <input
                    type="text"
                    value={editPropertyName}
                    onChange={(e) => setEditPropertyName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPropertyPhone}
                    onChange={(e) => setEditPropertyPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={editPropertyEmail}
                    onChange={(e) => setEditPropertyEmail(e.target.value)}
                    placeholder="stay@hotel.com"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={editPropertyAddress}
                  onChange={(e) => setEditPropertyAddress(e.target.value)}
                  placeholder="Plot No. 42, Civil Lines, Near MG Road"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editPropertyCity}
                    onChange={(e) => setEditPropertyCity(e.target.value)}
                    placeholder="Goa"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editPropertyState}
                    onChange={(e) => setEditPropertyState(e.target.value)}
                    placeholder="Goa"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={editPropertyPostalCode}
                    onChange={(e) => setEditPropertyPostalCode(e.target.value)}
                    placeholder="403001"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Property Description
                </label>
                <textarea
                  value={editPropertyDescription}
                  onChange={(e) => setEditPropertyDescription(e.target.value)}
                  rows={3}
                  placeholder="A premium boutique stay offering luxurious rooms..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-blue" />
                  Upgrade Plan for {planModalTenant.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Assign subscription tier and update live entitlements
                </p>
              </div>
              <button
                onClick={() => setPlanModalTenant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Subscription Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="starter">Free Starter Plan (₹0 / mo - Basic PMS &amp; Engine)</option>
                  <option value="essential">Essential Plan (₹499 / mo - Live Channel Manager &amp; Siren)</option>
                  <option value="growth">Growth Plan (₹1,499 / mo - Website + Maintenance)</option>
                  <option value="pro">Pro Plan (₹2,999 / mo - Multi-Property Scale)</option>
                  <option value="enterprise">Enterprise Plan (₹3,999 / mo - Custom CRS &amp; SLA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subscription Status
                </label>
                <select
                  value={selectedSubStatus}
                  onChange={(e) => setSelectedSubStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="active">Active (Paid / Subscribed)</option>
                  <option value="trial">Trial (Free 14-day trial period)</option>
                  <option value="past_due">Past Due (Payment Pending)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Extend Trial Duration (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  placeholder="0 (no extension)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPlanModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPlan}
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Account Access Control: {statusModalTenant.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Strict backend lock &amp; payment default suspension
                </p>
              </div>
              <button
                onClick={() => setStatusModalTenant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="active">Active (Full PMS &amp; Operations Access)</option>
                  <option value="suspended">Suspended (Temporary Freeze / Billing Default)</option>
                  <option value="locked">Locked (Strict Lock - Disables Staff &amp; Operational APIs)</option>
                </select>
              </div>

              {targetStatus !== 'active' && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
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
                  <label htmlFor="payment-issue-cb" className="text-xs text-red-900 cursor-pointer">
                    <strong className="block text-red-800 font-bold">Unpaid Dues / Payment Lockout</strong>
                    Rejects all operational requests with HTTP 402 and renders unbypassable lockout overlay directing the hotelier to clear dues.
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason Displayed to Hotelier
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition disabled:opacity-50 ${
                    targetStatus === 'active'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {updatingStatus ? 'Updating...' : `Confirm ${targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAR ALL TEST DATA MODAL */}
      {clearDataModalTenant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Clear All Test Data: {clearDataModalTenant.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Purge test reservations &amp; start with a clean slate
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClearDataModalTenant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">What will be deleted:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>All reservations, guest records, and folios</li>
                <li>All housekeeping tasks and maintenance tickets</li>
                <li>All complaints and billing invoices</li>
                <li>Rooms will be reset to Clean / Ready</li>
              </ul>
              <p className="pt-1 text-[11px] text-slate-600">
                Property details, room categories, and staff user logins are preserved!
              </p>
            </div>

            <form onSubmit={handleClearData} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type <strong className="text-amber-700 font-mono">CLEAR</strong> to confirm
                </label>
                <input
                  type="text"
                  value={clearConfirmation}
                  onChange={(e) => setClearConfirmation(e.target.value)}
                  placeholder="CLEAR"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClearDataModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clearingData || clearConfirmation !== 'CLEAR'}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-40"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Permanently Delete Hotel: {deleteModalTenant.name}
                  </h3>
                  <p className="text-[11px] text-red-600 font-semibold">
                    Irreversible destruction of property and all data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalTenant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
              <strong className="block text-red-800 mb-1">Warning: Irreversible Action</strong>
              This will permanently delete the hotel property, all rooms, staff memberships, and channel listings from the database.
            </div>

            <form onSubmit={handleDeleteTenant} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type <strong className="text-red-600 font-mono">DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-red-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalTenant(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingTenant || deleteConfirmation !== 'DELETE'}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-40"
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