'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  UtensilsCrossed,
  PlusCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
  Percent,
  Info,
} from 'lucide-react';

export default function RatesManagementPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: 'Continental Plan (Bed & Breakfast)',
    code: 'CP',
    mealPlan: 'CP',
    priceMultiplier: 115,
    surchargeRupees: 0,
    isNonRefundable: false,
  });

  const loadPlans = async (propId?: string) => {
    try {
      const url = propId ? `/rooms/rate-plans?property_id=${propId}` : '/rooms/rate-plans';
      const data = await apiClient(url);
      setRatePlans(data.ratePlans || []);
    } catch (e) {
      console.error('Failed to load rate plans:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const props = propData.properties || [];
        setProperties(props);
        if (props.length > 0) {
          setSelectedPropertyId(props[0].id);
          await loadPlans(props[0].id);
        } else {
          await loadPlans();
        }
      } catch (e) {
        console.error('Failed to init property rates:', e);
        setLoading(false);
      }
    }
    init();
  }, [currentTenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      name: 'Continental Plan (CP) — Bed & Breakfast',
      code: 'CP',
      mealPlan: 'CP',
      priceMultiplier: 115,
      surchargeRupees: 350,
      isNonRefundable: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: any) => {
    setModalMode('edit');
    setEditingId(plan.id);
    setFormData({
      name: plan.name || '',
      code: plan.code || '',
      mealPlan: plan.meal_plan || 'EP',
      priceMultiplier: plan.price_multiplier || 100,
      surchargeRupees: plan.surcharge_paise ? Math.round(plan.surcharge_paise / 100) : 0,
      isNonRefundable: Boolean(plan.is_non_refundable),
    });
    setModalOpen(true);
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"? Existing bookings will preserve their booked rates.`)) {
      return;
    }
    try {
      await apiClient(`/rooms/rate-plans/${id}`, { method: 'DELETE' });
      setRatePlans((prev) => prev.filter((p) => p.id !== id));
      alert('Rate policy deactivated successfully.');
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate rate policy.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Please provide both a Name and Code for this rate plan.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        mealPlan: formData.mealPlan,
        priceMultiplier: Number(formData.priceMultiplier) || 100,
        surchargePaise: Math.round((Number(formData.surchargeRupees) || 0) * 100),
        isNonRefundable: formData.isNonRefundable,
      };

      if (modalMode === 'create') {
        payload.propertyId = selectedPropertyId || properties[0]?.id;
        await apiClient('/rooms/rate-plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Meal plan and rate policy created successfully!');
      } else if (editingId) {
        await apiClient(`/rooms/rate-plans/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        alert('Rate policy updated successfully!');
      }

      setModalOpen(false);
      await loadPlans(selectedPropertyId);
    } catch (err: any) {
      alert(err.message || 'Failed to save rate plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-brand-blue" />
            Meal Plans & Rate Policies
          </h1>
          <p className="text-xs text-content-secondary-light">
            Configure meal packages (EP, CP, MAP, AP), price multipliers, nightly surcharges, and cancellation policies
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Add Rate Plan
        </button>
      </div>

      {/* Info Pill */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
        <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Standard Indian Hospitality Plans:</strong> EP (European Plan: Room Only), CP (Continental Plan: Free Breakfast), MAP (Modified American Plan: Breakfast + 1 Major Meal), AP (American Plan: All Meals Included). Rate multipliers adjust base room rates automatically across booking engine and walk-ins.
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : ratePlans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Rate Policies Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first meal package to offer guest options like Bed & Breakfast or Half-Board on your direct booking engine.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Create Rate Plan Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ratePlans.map((rp) => (
            <div
              key={rp.id}
              className="p-5 rounded-2xl bg-white border border-border-light shadow-sm space-y-3 flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-content-primary-light">{rp.name}</h3>
                    <span className="font-mono text-[10px] font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {rp.code} • {rp.meal_plan}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(rp)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-blue hover:bg-blue-50 transition"
                      title="Edit rate policy"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(rp.id, rp.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Deactivate rate policy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-content-secondary-light space-y-1.5 pt-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Rate Multiplier:</span>
                    <span className="font-bold text-content-primary-light">
                      {rp.price_multiplier}% of Base
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Nightly Surcharge:</span>
                    <span className="font-bold text-emerald-700">
                      {rp.surcharge_paise > 0 ? `+${formatINR(rp.surcharge_paise)} / night` : 'None'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span>Cancellation Terms:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        rp.is_non_refundable
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rp.is_non_refundable ? 'Non-Refundable' : 'Standard Flexible'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                <span>Active on Direct Engine</span>
                <button
                  onClick={() => handleOpenEdit(rp)}
                  className="text-brand-blue font-bold hover:underline"
                >
                  Edit Policy &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-plan-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <h3 id="meal-plan-modal-title" className="text-sm font-bold text-content-primary-light flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-brand-blue" />
                {modalMode === 'create' ? 'Create Meal Plan & Policy' : 'Edit Meal Plan & Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-content-primary-light mb-1">
                  Plan Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Continental Plan (Breakfast Included)"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">
                    Rate Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="CP"
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">
                    Meal Plan Type *
                  </label>
                  <select
                    value={formData.mealPlan}
                    onChange={(e) => setFormData({ ...formData, mealPlan: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                  >
                    <option value="EP">EP — Room Only</option>
                    <option value="CP">CP — Breakfast Included</option>
                    <option value="MAP">MAP — Half Board (B+D)</option>
                    <option value="AP">AP — Full Board (All Meals)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">
                    Rate Multiplier (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="50"
                      max="300"
                      required
                      value={formData.priceMultiplier}
                      onChange={(e) => setFormData({ ...formData, priceMultiplier: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-content-secondary-light mt-0.5">
                    100% = Base. 115% = Base + 15%.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-content-primary-light mb-1">
                    Fixed Surcharge (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.surchargeRupees}
                      onChange={(e) => setFormData({ ...formData, surchargeRupees: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-content-secondary-light mt-0.5">
                    Added per room night.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-content-primary-light mb-1">
                  Cancellation Policy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isNonRefundable: false })}
                    className={`p-2 rounded-lg border text-left transition ${
                      !formData.isNonRefundable
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>Standard Flexible</div>
                    <div className="text-[10px] text-slate-400 font-normal">Free cancellation</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isNonRefundable: true })}
                    className={`p-2 rounded-lg border text-left transition ${
                      formData.isNonRefundable
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>Non-Refundable</div>
                    <div className="text-[10px] text-slate-400 font-normal">No refund on cancel</div>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-brand-blue text-white font-bold hover:bg-brand-blue-hover disabled:opacity-50 flex items-center justify-center gap-1.5 shadow"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : modalMode === 'create' ? (
                    'Create Plan'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
