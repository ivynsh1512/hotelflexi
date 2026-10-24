'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Percent,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Tag,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  X,
} from 'lucide-react';

export default function CouponsPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [maxCap, setMaxCap] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [validTo, setValidTo] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const loadData = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const data = await apiClient(`/coupons?property_id=${activeProp.id}`);
        setCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !propertyId) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const valNum = parseFloat(discountValue);
      const discountValPaise = discountType === 'flat' ? Math.round(valNum * 100) : valNum;

      await apiClient('/coupons', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: discountValPaise,
          minBookingAmountPaise: minSpend ? Math.round(parseFloat(minSpend) * 100) : 0,
          maxDiscountPaise: maxCap ? Math.round(parseFloat(maxCap) * 100) : null,
          validFrom: validFrom || null,
          validTo: validTo || null,
          usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        }),
      });

      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiClient(`/coupons/${id}/status`, { method: 'PATCH' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this coupon?')) return;
    try {
      await apiClient(`/coupons/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinSpend('');
    setMaxCap('');
    setValidTo('');
    setUsageLimit('');
  };

  const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Promotional Coupons & Discount Rules
          </h1>
          <p className="text-xs text-content-secondary-light">
            Create promotional discount codes for your Booking Engine and direct walk-in reservations
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-border-light shadow-sm">
              <span className="text-xs text-content-secondary-light font-medium">Total Coupons</span>
              <div className="text-2xl font-extrabold text-content-primary-light mt-1">{coupons.length}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-border-light shadow-sm">
              <span className="text-xs text-content-secondary-light font-medium">Active Codes</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                {coupons.filter((c) => c.is_active === 1).length}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-border-light shadow-sm">
              <span className="text-xs text-content-secondary-light font-medium">Total Redemptions</span>
              <div className="text-2xl font-extrabold text-brand-blue mt-1">
                {coupons.reduce((acc, c) => acc + (c.times_used || 0), 0)}
              </div>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-blue" />
              Active Property Promo Codes
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-content-primary-light">
                  <tr>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min Spend</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4">Usage Count</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-content-secondary-light">
                        No promotional coupons created yet. Click "Create New Coupon" to start.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-light transition">
                        <td className="py-3 px-4 font-mono font-bold text-brand-blue">
                          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                            {c.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-content-primary-light">
                          {c.discount_type === 'percentage'
                            ? `${c.discount_value}% OFF ${c.max_discount_paise ? `(Cap: ${formatINR(c.max_discount_paise)})` : ''}`
                            : `${formatINR(c.discount_value)} FLAT`}
                        </td>
                        <td className="py-3 px-4 text-content-secondary-light">
                          {c.min_booking_amount_paise > 0 ? formatINR(c.min_booking_amount_paise) : 'No Minimum'}
                        </td>
                        <td className="py-3 px-4 text-content-secondary-light">
                          {c.valid_from || 'Always'} &rarr; {c.valid_to || 'Ongoing'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-content-primary-light">{c.times_used || 0}</span>
                          <span className="text-[10px] text-content-secondary-light">
                            {c.usage_limit ? ` / ${c.usage_limit}` : ' (Unlimited)'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatus(c.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.is_active === 1
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {c.is_active === 1 ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1.5 rounded-lg text-content-secondary-light hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create Coupon Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-modal-title"
            className="relative max-w-md w-full bg-white rounded-2xl border border-border-light shadow-xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-border-light">
              <h3 id="coupon-modal-title" className="font-bold text-base text-content-primary-light">Create Promotional Coupon</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MONSOON20"
                  className="w-full px-3 py-2 rounded-lg border border-border-light font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '15 (for 15%)' : '500 (for ₹500)'}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                    Min Booking Spend (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxCap}
                    onChange={(e) => setMaxCap(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                    Valid From Date
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                    Valid To Date
                  </label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                  Usage Limit (Leave empty for unlimited)
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="e.g. 50 bookings"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2 rounded-lg border border-border-light font-semibold text-content-secondary-light hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white font-bold transition flex items-center justify-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
