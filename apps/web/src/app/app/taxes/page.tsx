'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Percent,
  Plus,
  RefreshCw,
  Save,
  CheckCircle2,
  Trash2,
  Edit3,
  Calculator,
  Shield,
  FileText,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';

interface TaxRule {
  id: string;
  name: string;
  tax_type: 'percentage' | 'fixed';
  rate_basis_points: number;
  fixed_amount_paise: number;
  scope: 'room' | 'fnb' | 'all';
  frequency: 'per_night' | 'per_stay' | 'per_guest';
  is_inclusive: number;
  is_active: number;
}

export default function TaxesPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [standardGstPercent, setStandardGstPercent] = useState('12');
  const [luxuryGstPercent, setLuxuryGstPercent] = useState('18');
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [savingGst, setSavingGst] = useState(false);
  const [gstSuccess, setGstSuccess] = useState(false);

  // Modal for new/edit rule
  const [showModal, setShowModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<'percentage' | 'fixed'>('percentage');
  const [rulePercent, setRulePercent] = useState('5');
  const [ruleFixedRs, setRuleFixedRs] = useState('100');
  const [ruleScope, setRuleScope] = useState<'room' | 'fnb' | 'all'>('room');
  const [ruleFrequency, setRuleFrequency] = useState<'per_night' | 'per_stay' | 'per_guest'>('per_night');
  const [ruleInclusive, setRuleInclusive] = useState(false);
  const [submittingRule, setSubmittingRule] = useState(false);

  // Live calculator preview states
  const [calcTariffRs, setCalcTariffRs] = useState(3500);
  const [calcNights, setCalcNights] = useState(2);
  const [calcGuests, setCalcGuests] = useState(2);
  const [previewResult, setPreviewResult] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (!activeProp) {
        setLoading(false);
        return;
      }
      setPropertyId(activeProp.id);

      const res = await apiClient(`/tax-rules?property_id=${activeProp.id}`);
      if (res.gst) {
        setGstNumber(res.gst.gstNumber || '');
        setStandardGstPercent(String(res.gst.standardRateBasisPoints / 100));
        setLuxuryGstPercent(String(res.gst.luxuryRateBasisPoints / 100));
      }
      setRules(res.rules || []);
    } catch (e) {
      console.error('Failed to load tax rules:', e);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate preview
  const updatePreview = useCallback(async () => {
    try {
      const res = await apiClient('/tax-rules/preview', {
        method: 'POST',
        body: JSON.stringify({
          roomRatePaise: calcTariffRs * 100,
          nights: calcNights,
          guests: calcGuests,
          customRules: rules,
          includeGst: true,
        }),
      });
      setPreviewResult(res);
    } catch {}
  }, [calcTariffRs, calcNights, calcGuests, rules]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Modal ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;
    setSavingGst(true);
    try {
      await apiClient('/tax-rules/gst-settings', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          gstNumber: gstNumber.trim(),
          standardRatePercent: parseFloat(standardGstPercent) || 12,
          luxuryRatePercent: parseFloat(luxuryGstPercent) || 18,
        }),
      });
      setGstSuccess(true);
      window.dispatchEvent(new CustomEvent('hotelflexi:onboarding-updated'));
      setTimeout(() => setGstSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update GST settings');
    } finally {
      setSavingGst(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !ruleName.trim()) return;
    setSubmittingRule(true);
    try {
      const payload = {
        propertyId,
        name: ruleName.trim(),
        taxType: ruleType,
        ratePercentage: ruleType === 'percentage' ? parseFloat(rulePercent) || 0 : undefined,
        fixedAmountRupees: ruleType === 'fixed' ? parseFloat(ruleFixedRs) || 0 : undefined,
        scope: ruleScope,
        frequency: ruleFrequency,
        isInclusive: ruleInclusive,
      };

      if (editingRuleId) {
        await apiClient(`/tax-rules/${editingRuleId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/tax-rules', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      setEditingRuleId(null);
      setRuleName('');
      window.dispatchEvent(new CustomEvent('hotelflexi:onboarding-updated'));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save tax rule');
    } finally {
      setSubmittingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this tax rule?')) return;
    try {
      await apiClient(`/tax-rules/${id}`, { method: 'DELETE' });
      setRules((prev) => prev.filter((r) => r.id !== id));
      window.dispatchEvent(new CustomEvent('hotelflexi:onboarding-updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate tax rule');
    }
  };

  const openEditModal = (rule: TaxRule) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRuleType(rule.tax_type);
    setRulePercent(String(rule.rate_basis_points / 100));
    setRuleFixedRs(String(rule.fixed_amount_paise / 100));
    setRuleScope(rule.scope);
    setRuleFrequency(rule.frequency);
    setRuleInclusive(Boolean(rule.is_inclusive));
    setShowModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Taxes, GST &amp; Custom Surcharges
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Configure Indian GST 12%/18% tax brackets and custom percentage or fixed fees with live invoice previews.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingRuleId(null);
              setRuleName('');
              setRuleType('percentage');
              setRulePercent('5');
              setRuleFixedRs('100');
              setRuleScope('room');
              setRuleFrequency('per_night');
              setRuleInclusive(false);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom Tax / Fee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: GST & Custom Tax Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Indian GST Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Indian GST Compliance (SAC 9963)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Official GST Standard
              </span>
            </div>

            {gstSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                GST settings saved! Real folios and invoices will use this GSTIN.
              </div>
            )}

            <form onSubmit={handleSaveGst} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hotel GSTIN Number (15-character alphanumeric)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 08ABCDE1234F1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue uppercase"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave blank if your hotel is exempt under the ₹20L/₹40L GST threshold.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Standard Tariff GST Rate (≤ ₹7,500/night)
                  </span>
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="number"
                      step="0.1"
                      value={standardGstPercent}
                      onChange={(e) => setStandardGstPercent(e.target.value)}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                    />
                    <span className="text-slate-600 font-bold">%</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      (CGST {(parseFloat(standardGstPercent) / 2 || 6).toFixed(1)}% + SGST {(parseFloat(standardGstPercent) / 2 || 6).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Luxury Tariff GST Rate (&gt; ₹7,500/night)
                  </span>
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="number"
                      step="0.1"
                      value={luxuryGstPercent}
                      onChange={(e) => setLuxuryGstPercent(e.target.value)}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                    />
                    <span className="text-slate-600 font-bold">%</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      (CGST {(parseFloat(luxuryGstPercent) / 2 || 9).toFixed(1)}% + SGST {(parseFloat(luxuryGstPercent) / 2 || 9).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingGst}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingGst ? 'Saving...' : 'Save GST Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Custom Tax & Fee Rules List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Custom Surcharges &amp; Fee Rules
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure local green cess, resort maintenance fees, or service charges.
                </p>
              </div>
            </div>

            {rules.length === 0 ? (
              <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl">
                <Percent className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No custom taxes or surcharges created yet.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-3 py-1.5 bg-blue-50 text-brand-blue font-bold text-xs rounded-lg hover:bg-blue-100 transition"
                >
                  + Add First Tax Rule
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Rule Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Rate / Amount</th>
                      <th className="py-2.5 px-3">Scope &amp; Frequency</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-900">{rule.name}</td>
                        <td className="py-3 px-3 capitalize text-slate-600">{rule.tax_type}</td>
                        <td className="py-3 px-3 font-bold text-brand-blue">
                          {rule.tax_type === 'percentage'
                            ? `${(rule.rate_basis_points / 100).toFixed(2)}%`
                            : `₹${(rule.fixed_amount_paise / 100).toFixed(2)}`}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          <span className="capitalize">{rule.scope}</span> •{' '}
                          <span className="capitalize">{rule.frequency.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rule.is_inclusive ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rule.is_inclusive ? 'Inclusive' : 'Added to Bill'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-1 hover:text-brand-blue text-slate-500 transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 hover:text-rose-600 text-slate-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Live Invoice Calculation Preview */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Live Invoice Tax Preview</h3>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Adjust sample parameters below to preview the exact itemized invoice generated for guests.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  Room Rate (₹ per night)
                </label>
                <input
                  type="number"
                  step="100"
                  value={calcTariffRs}
                  onChange={(e) => setCalcTariffRs(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Nights</label>
                  <input
                    type="number"
                    min="1"
                    value={calcNights}
                    onChange={(e) => setCalcNights(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={calcGuests}
                    onChange={(e) => setCalcGuests(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Simulated Invoice Bill */}
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Room Tariff ({calcNights} night{calcNights > 1 ? 's' : ''}):</span>
                <span className="font-mono">{previewResult?.roomSubtotalRupees || '—'}</span>
              </div>

              {previewResult?.appliedLines?.map((line: any, idx: number) => (
                <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                  <span>{line.name}:</span>
                  <span className="font-mono text-emerald-400">
                    {line.isInclusive ? `(Incl.) ${line.amountRupees}` : `+${line.amountRupees}`}
                  </span>
                </div>
              ))}

              <div className="pt-2 border-t border-white/20 flex justify-between font-extrabold text-sm text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-300">
                  {previewResult?.grandTotalRupees || '—'}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              🔒 Preserves 100% SAC 9963 compliance and historical folio integrity.
            </p>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT TAX RULE MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingRuleId ? 'Edit Tax / Surcharge Rule' : 'Add Tax or Surcharge Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tax / Surcharge Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resort Maintenance Fee, Green Cess, Service Charge"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calculation Type</label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {ruleType === 'percentage' ? 'Rate Percentage (%)' : 'Fixed Amount (₹)'}
                  </label>
                  {ruleType === 'percentage' ? (
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={rulePercent}
                      onChange={(e) => setRulePercent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                  ) : (
                    <input
                      type="number"
                      step="1"
                      required
                      value={ruleFixedRs}
                      onChange={(e) => setRuleFixedRs(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scope</label>
                  <select
                    value={ruleScope}
                    onChange={(e) => setRuleScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="room">Room Tariff</option>
                    <option value="fnb">Restaurant / F&amp;B</option>
                    <option value="all">All Folio Charges</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={ruleFrequency}
                    onChange={(e) => setRuleFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="per_night">Per Night</option>
                    <option value="per_stay">Per Stay</option>
                    <option value="per_guest">Per Guest</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleInclusive}
                    onChange={(e) => setRuleInclusive(e.target.checked)}
                    className="w-4 h-4 text-brand-blue rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Inclusive in Base Tariff</span>
                    <span className="text-[10px] text-slate-500">
                      If checked, fee is already included in published room price rather than added on top.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRule}
                  className="px-4 py-2 bg-brand-blue text-white rounded-xl font-bold shadow-xs hover:bg-brand-blue-hover transition"
                >
                  {submittingRule ? 'Saving...' : editingRuleId ? 'Update Rule' : 'Create Tax Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
