'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Package,
  Loader2,
  RefreshCw,
  Edit3,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface LinenItem {
  id: string;
  item_name: string;
  category?: string;
  total_stock: number;
  in_rooms: number;
  clean_stock: number;
  at_laundry: number;
  damaged: number;
  unit: string;
}

interface LaundryTransaction {
  id: string;
  transaction_type: string;
  item_name: string;
  quantity: number;
  vendor_name: string | null;
  notes: string | null;
  performed_by_name: string | null;
  created_at: number;
}

export default function LaundryPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<LinenItem[]>([]);
  const [transactions, setTransactions] = useState<LaundryTransaction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<LinenItem>>({});
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [batchCounts, setBatchCounts] = useState<Record<string, number>>({});
  const [vendorName, setVendorName] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    setSaveError(null);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (!activeProp) return;
      setPropertyId(activeProp.id);
      const [inv, txns] = await Promise.all([
        apiClient(`/laundry/inventory?property_id=${activeProp.id}`),
        apiClient(`/laundry/transactions?property_id=${activeProp.id}&limit=50`),
      ]);
      const rawItems = inv?.items || [];
      const normalizedItems: LinenItem[] = rawItems.map((it: any) => ({
        id: it.id,
        item_name: it.item_name,
        category: it.category || 'bedding',
        total_stock: Number(it.total_stock) || 0,
        in_rooms: Number(it.in_rooms) || 0,
        clean_stock: Number(it.in_stock_clean ?? it.clean_stock) || 0,
        at_laundry: Number(it.in_laundry ?? it.at_laundry) || 0,
        damaged: Number(it.discarded ?? it.damaged) || 0,
        unit: it.unit || 'pcs',
      }));
      setInventory(normalizedItems);
      setTransactions(txns?.transactions || []);
    } catch (e) {
      console.error(e);
      setSaveError('Failed to load laundry data');
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sendModalOpen) setSendModalOpen(false);
        if (receiveModalOpen) setReceiveModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendModalOpen, receiveModalOpen]);

  const saveEdit = async (item: LinenItem) => {
    try {
      const payload = {
        property_id: propertyId,
        totalStock: editValues.total_stock !== undefined ? editValues.total_stock : item.total_stock,
        inRooms: editValues.in_rooms !== undefined ? editValues.in_rooms : item.in_rooms,
        inStockClean: editValues.clean_stock !== undefined ? editValues.clean_stock : item.clean_stock,
        inLaundry: editValues.at_laundry !== undefined ? editValues.at_laundry : item.at_laundry,
        discarded: editValues.damaged !== undefined ? editValues.damaged : item.damaged,
      };
      await apiClient(`/laundry/inventory/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEditingId(null);
      loadData();
    } catch {
      alert('Failed to update item');
    }
  };

  const handleSendToLaundry = async () => {
    setSubmitting(true);
    try {
      const items = Object.entries(batchCounts)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, quantity]) => ({ itemId, quantity }));
      if (items.length === 0) { alert('Add at least one item'); setSubmitting(false); return; }
      await apiClient('/laundry/send', {
        method: 'POST',
        body: JSON.stringify({ property_id: propertyId, items, vendor_name: vendorName, notes: batchNotes }),
      });
      setSendModalOpen(false);
      setBatchCounts({});
      setVendorName('');
      setBatchNotes('');
      loadData();
    } catch {
      alert('Failed to send to laundry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveFromLaundry = async () => {
    setSubmitting(true);
    try {
      const items = Object.entries(batchCounts)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, quantity]) => ({ itemId, quantity }));
      if (items.length === 0) { alert('Add at least one item'); setSubmitting(false); return; }
      await apiClient('/laundry/receive', {
        method: 'POST',
        body: JSON.stringify({ property_id: propertyId, items, vendor_name: vendorName, notes: batchNotes }),
      });
      setReceiveModalOpen(false);
      setBatchCounts({});
      setVendorName('');
      setBatchNotes('');
      loadData();
    } catch {
      alert('Failed to receive from laundry');
    } finally {
      setSubmitting(false);
    }
  };

  const totalStock = inventory.reduce((s, i) => s + (Number(i.total_stock) || 0), 0);
  const inRooms = inventory.reduce((s, i) => s + (Number(i.in_rooms) || 0), 0);
  const cleanStock = inventory.reduce((s, i) => s + (Number(i.clean_stock) || 0), 0);
  const atLaundry = inventory.reduce((s, i) => s + (Number(i.at_laundry) || 0), 0);

  const txTypeLabel: Record<string, string> = {
    checkout_laundry: '🧺 Checkout → Laundry',
    checkout_reuse: '♻️ Checkout → Reuse',
    send_to_laundry: '📤 Sent to Laundry',
    receive_from_laundry: '📥 Received Clean',
    manual_adjustment: '✏️ Manual Adjustment',
  };

  const openSendModal = () => {
    const counts: Record<string, number> = {};
    inventory.forEach(i => { counts[i.id] = 0; });
    setBatchCounts(counts);
    setVendorName('');
    setBatchNotes('');
    setSendModalOpen(true);
  };

  const openReceiveModal = () => {
    const counts: Record<string, number> = {};
    inventory.forEach(i => { counts[i.id] = 0; });
    setBatchCounts(counts);
    setVendorName('');
    setBatchNotes('');
    setReceiveModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-blue" /> Laundry &amp; Room Supplies
          </h1>
          <p className="text-xs text-content-secondary-light mt-0.5">
            Track bed sheets, towels, bedding inventory, laundry cycles, and clean stock levels
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={openSendModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition">
            <ArrowUpRight className="w-3.5 h-3.5" /> Send to Laundry
          </button>
          <button onClick={openReceiveModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition">
            <ArrowDownRight className="w-3.5 h-3.5" /> Receive Clean
          </button>
          <button onClick={loadData} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border-light text-xs font-bold text-content-primary-light hover:bg-surface-light transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{saveError}</div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-border-light gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand-blue" />
          <p className="text-xs text-content-secondary-light">Loading inventory...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Stock', value: totalStock, color: 'text-content-primary-light', bg: 'bg-white' },
              { label: 'In Rooms', value: inRooms, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Clean Stock', value: cleanStock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'At Laundry', value: atLaundry, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`p-4 rounded-2xl border border-border-light shadow-sm ${bg}`}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-content-secondary-light">{label}</p>
                <p className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</p>
                <p className="text-[10px] text-content-secondary-light mt-0.5">total items</p>
              </div>
            ))}
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <div className="p-4 border-b border-border-light">
              <h2 className="text-sm font-extrabold text-content-primary-light">Inventory Items</h2>
              <p className="text-[10px] text-content-secondary-light">Click the edit icon to adjust counts manually</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-light bg-surface-light">
                    {['Item', 'Total', 'In Rooms', 'Clean', 'At Laundry', 'Damaged', 'Unit', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold text-content-secondary-light">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-b border-border-light hover:bg-surface-light/50 transition">
                      <td className="px-4 py-3 font-semibold text-content-primary-light">{item.item_name}</td>
                      {editingId === item.id ? (
                        <>
                          {(['total_stock', 'in_rooms', 'clean_stock', 'at_laundry', 'damaged'] as const).map(field => (
                            <td key={field} className="px-2 py-2">
                              <input
                                type="number" min={0}
                                value={editValues[field] ?? item[field]}
                                onChange={e => setEditValues(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }))}
                                className="w-16 px-2 py-1 border border-brand-blue rounded-lg focus:outline-none text-xs"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-content-secondary-light">{item.unit}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => saveEdit(item)} className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingId(null)} className="p-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-bold text-content-primary-light">{item.total_stock ?? 0}</td>
                          <td className="px-4 py-3 text-blue-600 font-semibold">{item.in_rooms ?? 0}</td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">{item.clean_stock ?? 0}</td>
                          <td className="px-4 py-3 text-amber-600 font-semibold">{item.at_laundry ?? 0}</td>
                          <td className="px-4 py-3 text-red-500 font-semibold">{item.damaged ?? 0}</td>
                          <td className="px-4 py-3 text-content-secondary-light">{item.unit || 'pcs'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { setEditingId(item.id); setEditValues({}); }}
                              className="p-1 rounded-lg hover:bg-surface-light transition text-content-secondary-light"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-content-secondary-light">No inventory items found. Send to Laundry or Receive Clean to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <div className="p-4 border-b border-border-light">
              <h2 className="text-sm font-extrabold text-content-primary-light">Transaction History</h2>
              <p className="text-[10px] text-content-secondary-light">Audit log of all laundry &amp; linen actions</p>
            </div>
            <div className="divide-y divide-border-light">
              {transactions.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-content-secondary-light">No transactions yet. Linen actions from guest checkouts will appear here.</div>
              )}
              {transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-content-primary-light">
                        {txTypeLabel[tx.transaction_type] || tx.transaction_type}
                      </span>
                      {tx.vendor_name && (
                        <span className="text-[10px] bg-surface-light border border-border-light px-1.5 py-0.5 rounded-md text-content-secondary-light">
                          {tx.vendor_name}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-content-secondary-light mt-0.5">
                      {tx.item_name} · Qty: {tx.quantity}
                      {tx.notes && ` · ${tx.notes}`}
                      {tx.performed_by_name && ` · by ${tx.performed_by_name}`}
                    </div>
                  </div>
                  <div className="text-[10px] text-content-secondary-light ml-3 flex-shrink-0">
                    {new Date(tx.created_at * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Send to Laundry Modal */}
      {sendModalOpen && (
        <div
          onClick={() => setSendModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-laundry-title"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-light">
              <h2 id="send-laundry-title" className="text-base font-extrabold text-content-primary-light">📤 Send to Laundry</h2>
              <button
                type="button"
                onClick={() => setSendModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content-secondary-light uppercase tracking-wide">Vendor Name (optional)</label>
              <input value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. City Laundry Services"
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-content-secondary-light uppercase tracking-wide">Items &amp; Quantities</p>
              {inventory.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-content-primary-light">{item.item_name}</span>
                    <span className="text-[10px] text-emerald-600 ml-1">({item.clean_stock} clean available)</span>
                  </div>
                  <input type="number" min={0} max={item.clean_stock}
                    value={batchCounts[item.id] || 0}
                    onChange={e => setBatchCounts(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 0 }))}
                    className="w-20 px-2 py-1 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue text-center"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[10px] font-bold text-content-secondary-light uppercase tracking-wide">Notes (optional)</label>
              <textarea value={batchNotes} onChange={e => setBatchNotes(e.target.value)} rows={2}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSendModalOpen(false)} className="flex-1 py-2 rounded-xl border border-border-light text-xs font-bold hover:bg-surface-light transition" disabled={submitting}>Cancel</button>
              <button onClick={handleSendToLaundry} disabled={submitting}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-1">
                {submitting ? <><Loader2 className="w-3 h-3 animate-spin" /> Sending...</> : 'Send to Laundry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive from Laundry Modal */}
      {receiveModalOpen && (
        <div
          onClick={() => setReceiveModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="receive-laundry-title"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-light">
              <h2 id="receive-laundry-title" className="text-base font-extrabold text-content-primary-light">📥 Receive Clean Linen</h2>
              <button
                type="button"
                onClick={() => setReceiveModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-content-secondary-light uppercase tracking-wide">Vendor Name (optional)</label>
              <input value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. City Laundry Services"
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-content-secondary-light uppercase tracking-wide">Items Received</p>
              {inventory.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-content-primary-light">{item.item_name}</span>
                    <span className="text-[10px] text-amber-600 ml-1">({item.at_laundry} at laundry)</span>
                  </div>
                  <input type="number" min={0} max={item.at_laundry}
                    value={batchCounts[item.id] || 0}
                    onChange={e => setBatchCounts(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 0 }))}
                    className="w-20 px-2 py-1 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue text-center"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[10px] font-bold text-content-secondary-light uppercase tracking-wide">Notes (optional)</label>
              <textarea value={batchNotes} onChange={e => setBatchNotes(e.target.value)} rows={2}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setReceiveModalOpen(false)} className="flex-1 py-2 rounded-xl border border-border-light text-xs font-bold hover:bg-surface-light transition" disabled={submitting}>Cancel</button>
              <button onClick={handleReceiveFromLaundry} disabled={submitting}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1">
                {submitting ? <><Loader2 className="w-3 h-3 animate-spin" /> Receiving...</> : 'Confirm Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
