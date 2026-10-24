'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  Edit3,
  Building,
  BedDouble,
  DollarSign,
  FileText,
  Save,
  Check,
  X,
  MessageSquare,
  Package,
} from 'lucide-react';

export default function AiPropertySetupPage() {
  const { currentTenant } = useAuth();
  const [propertyId, setPropertyId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);

  // Input states
  const [rawTextChunk, setRawTextChunk] = useState('');
  const [chunks, setChunks] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedResult, setAppliedResult] = useState<any>(null);

  // Extracted draft data
  const [extractedDraft, setExtractedDraft] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [modelUsed, setModelUsed] = useState('openai/gpt-oss-120b');

  // Active view tab in draft
  const [activeTab, setActiveTab] = useState<'rooms' | 'rates' | 'profile' | 'taxes' | 'packages'>('rooms');

  const loadProperty = useCallback(async () => {
    if (!currentTenant) return;
    try {
      const propData = await apiClient('/properties');
      const active = propData.properties?.[0];
      if (active) {
        setPropertyId(active.id);
        setPropertyName(active.name);
      }
    } catch {}
  }, [currentTenant]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const handleProcessChunk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !rawTextChunk.trim()) return;

    setProcessing(true);
    setAppliedResult(null);
    try {
      const res = await apiClient('/property-setup/draft/chunk', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          draftId,
          chunkText: rawTextChunk.trim(),
          sessionTitle: `${propertyName} AI Setup`,
        }),
      });

      if (res.draftId) setDraftId(res.draftId);
      if (res.extractedDraft) setExtractedDraft(res.extractedDraft);
      if (res.comparison) setComparison(res.comparison);
      if (res.modelUsed) setModelUsed(res.modelUsed);
      setChunks((prev) => [...prev, rawTextChunk.trim()]);
      setRawTextChunk('');
    } catch (err: any) {
      alert(err.message || 'Failed to process property text');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyDraft = async () => {
    if (!draftId) return;
    if (!confirm('Are you sure you want to approve and apply this configuration to your hotel property?')) return;

    setApplying(true);
    try {
      const res = await apiClient(`/property-setup/draft/${draftId}/apply`, {
        method: 'POST',
      });

      setAppliedResult(res.appliedSummary);
      window.dispatchEvent(new CustomEvent('hotelflexi:onboarding-updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to apply configuration draft');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Flexi AI Natural-Language Property Setup
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Powered by Groq <strong>{modelUsed}</strong>. Paste room lists, WhatsApp rate cards, packages, or tax rules to auto-configure your hotel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/ai-agent"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ← Back to Chat Assistant
          </Link>
        </div>
      </div>

      {/* Applied Confirmation Banner */}
      {appliedResult && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Configuration Applied to {propertyName} Successfully! 🚀</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-emerald-800">
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Room Categories</span>
              <span className="text-lg font-black">{appliedResult.roomCategoriesCreated}</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Physical Rooms</span>
              <span className="text-lg font-black">{appliedResult.roomsCreated}</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rate Plans</span>
              <span className="text-lg font-black">{appliedResult.ratePlansCreated}</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Custom Tax Rules</span>
              <span className="text-lg font-black">{appliedResult.taxRulesCreated}</span>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Link
              href="/app/rooms"
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
            >
              View Room Inventory →
            </Link>
          </div>
        </div>
      )}

      {/* Main 2-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Natural-Language Chunk Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-brand-blue" />
                Paste Property Information
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                Chunk #{chunks.length + 1}
              </span>
            </div>

            <form onSubmit={handleProcessChunk} className="space-y-3 text-xs">
              <textarea
                rows={7}
                required
                value={rawTextChunk}
                onChange={(e) => setRawTextChunk(e.target.value)}
                placeholder="Paste your property details, room list, or WhatsApp rate card...
Example:
We have 3 room types:
1. Deluxe Room: ₹3,500/night for 2 guests, extra guest ₹1,000. Total 6 rooms: 101 to 106.
2. Executive Suite: ₹5,500/night for 2 guests, max 4 guests. Total 4 rooms: 201 to 204.
Breakfast is +₹300/guest (CP plan).
Indian GST is 12%, plus ₹100 resort maintenance fee per night."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  Multiple chunks supported without losing progress
                </span>
                <button
                  type="submit"
                  disabled={processing || !rawTextChunk.trim()}
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Structuring with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Parse with Flexi AI
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Chunk History Pills */}
            {chunks.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Processed Input Chunks ({chunks.length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {chunks.map((chk, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 truncate">
                      <span className="font-bold text-slate-900 mr-1.5">#{idx + 1}:</span>
                      {chk}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ambiguities / Missing Info Banner */}
          {comparison?.ambiguities && comparison.ambiguities.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Points for Clarification ({comparison.ambiguities.length})</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800">
                {comparison.ambiguities.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-[10px] text-amber-700 italic pt-1">
                You can paste another chunk on the left to clarify these points, or edit values directly on the right.
              </p>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Structured Review & Approval */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Structured Property Configuration Draft
                </h3>
                <p className="text-[11px] text-slate-500">
                  Review extracted entities. Edit any price or occupancy before applying.
                </p>
              </div>

              {extractedDraft && !appliedResult && (
                <button
                  type="button"
                  onClick={handleApplyDraft}
                  disabled={applying}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Applying to Database...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Approve &amp; Apply to Hotel
                    </>
                  )}
                </button>
              )}
            </div>

            {!extractedDraft ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">No Draft Generated Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Paste your property catalogue, room names, or rate lists on the left. Flexi AI will extract and preview them here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Draft Tabs */}
                <div className="flex border-b border-slate-200 gap-4 text-xs font-bold overflow-x-auto">
                  {[
                    { id: 'rooms', label: `Room Categories (${extractedDraft.roomCategories?.length || 0})` },
                    { id: 'rates', label: `Rate Plans (${extractedDraft.ratePlans?.length || 0})` },
                    { id: 'taxes', label: 'Taxes & GST' },
                    { id: 'packages', label: `Packages (${extractedDraft.packages?.length || 0})` },
                    { id: 'profile', label: 'Property Details' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-2.5 border-b-2 whitespace-nowrap transition ${
                        activeTab === tab.id
                          ? 'border-brand-blue text-brand-blue'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: ROOM CATEGORIES & INVENTORY */}
                {activeTab === 'rooms' && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Category Name</th>
                            <th className="py-2.5 px-3">Code</th>
                            <th className="py-2.5 px-3">Base Price</th>
                            <th className="py-2.5 px-3">Extra Adult</th>
                            <th className="py-2.5 px-3">Occupancy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(extractedDraft.roomCategories || []).map((cat: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  value={cat.name}
                                  onChange={(e) => {
                                    const updated = { ...extractedDraft };
                                    updated.roomCategories[idx].name = e.target.value;
                                    setExtractedDraft(updated);
                                  }}
                                  className="w-full px-2 py-1 rounded border border-slate-200 font-bold text-xs"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  value={cat.code}
                                  onChange={(e) => {
                                    const updated = { ...extractedDraft };
                                    updated.roomCategories[idx].code = e.target.value.toUpperCase();
                                    setExtractedDraft(updated);
                                  }}
                                  className="w-16 px-2 py-1 rounded border border-slate-200 font-mono text-xs uppercase"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  <span>₹</span>
                                  <input
                                    type="number"
                                    value={cat.basePriceRupees}
                                    onChange={(e) => {
                                      const updated = { ...extractedDraft };
                                      updated.roomCategories[idx].basePriceRupees = Number(e.target.value);
                                      setExtractedDraft(updated);
                                    }}
                                    className="w-20 px-2 py-1 rounded border border-slate-200 font-bold text-xs"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  <span>₹</span>
                                  <input
                                    type="number"
                                    value={cat.extraAdultPriceRupees || 0}
                                    onChange={(e) => {
                                      const updated = { ...extractedDraft };
                                      updated.roomCategories[idx].extraAdultPriceRupees = Number(e.target.value);
                                      setExtractedDraft(updated);
                                    }}
                                    className="w-16 px-2 py-1 rounded border border-slate-200 text-xs"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {cat.baseOccupancy} to {cat.maxOccupancy} guests
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Extracted Physical Rooms */}
                    {extractedDraft.physicalRooms?.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        <span className="font-bold text-xs text-slate-800">
                          Detected Physical Room Numbers ({extractedDraft.physicalRooms.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {extractedDraft.physicalRooms.map((rm: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
                              Room {rm.roomNumber} ({rm.roomCategoryName})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: RATE PLANS */}
                {activeTab === 'rates' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {(extractedDraft.ratePlans || []).map((rp: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">{rp.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-blue">
                              {rp.mealPlan}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Category: {rp.roomCategoryName || 'All Categories'}
                          </div>
                          <div className="text-[11px] text-slate-700">
                            Surcharge: +₹{rp.surchargeRupees || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: TAXES */}
                {activeTab === 'taxes' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block">GSTIN / Tax Configuration</span>
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Extracted GSTIN:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {extractedDraft.taxConfiguration?.gstNumber || 'None detected'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Standard GST:</span>
                          <span className="font-bold text-slate-800">
                            {extractedDraft.taxConfiguration?.standardGstPercent || 12}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {extractedDraft.taxConfiguration?.customRules?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-900 block">Custom Fee Rules:</span>
                        {extractedDraft.taxConfiguration.customRules.map((cr: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between">
                            <span className="font-bold text-slate-800">{cr.name}</span>
                            <span className="text-brand-blue font-bold">
                              {cr.taxType === 'percentage' ? `${cr.ratePercentage}%` : `₹${cr.fixedAmountRupees} ${cr.frequency}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PACKAGES */}
                {activeTab === 'packages' && (
                  <div className="space-y-3 text-xs">
                    {extractedDraft.packages?.length === 0 ? (
                      <p className="text-slate-500 py-4 text-center">No wedding or event packages mentioned in input.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {extractedDraft.packages.map((pkg: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900">{pkg.name}</span>
                              <span className="font-extrabold text-brand-blue">₹{pkg.priceRupees?.toLocaleString('en-IN')}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{pkg.type}</span>
                            {pkg.inclusions?.length > 0 && (
                              <div className="text-[11px] text-slate-600">
                                Inclusions: {pkg.inclusions.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: PROFILE */}
                {activeTab === 'profile' && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-900 block">Extracted Property Profile</span>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>Phone: <strong>{extractedDraft.propertyDetails?.phone || '—'}</strong></div>
                      <div>Email: <strong>{extractedDraft.propertyDetails?.email || '—'}</strong></div>
                      <div>City: <strong>{extractedDraft.propertyDetails?.city || '—'}</strong></div>
                      <div>Check-in / Out: <strong>{extractedDraft.propertyDetails?.checkInTime || '14:00'} / {extractedDraft.propertyDetails?.checkOutTime || '11:00'}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
