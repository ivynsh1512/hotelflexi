'use client';

import React, { useEffect, useState } from 'react';
import { apiClient, formatINR } from '@/lib/api';
import { DollarSign, PlusCircle, Loader2 } from 'lucide-react';

export default function AdminPlatformExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState('cloud_infrastructure');
  const [amountRupees, setAmountRupees] = useState('');
  const [notes, setNotes] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/admin/finance/expenses');
      setExpenses(data.expenses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/admin/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({
          vendorName,
          category,
          amountPaise: Math.round((parseFloat(amountRupees) || 0) * 100),
          notes,
          expenseDate: new Date().toISOString().split('T')[0],
        }),
      });
      setModalOpen(false);
      setVendorName('');
      setAmountRupees('');
      await fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-dark flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            NovaX AI Platform Vendor Expenses
          </h1>
          <p className="text-xs text-content-secondary-dark">
            Track Cloudflare Workers, AI API tokens, payment gateway fees, and infrastructure overhead
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Record Platform Expense
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-surface-dark-surface rounded-2xl border border-border-dark">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-12 text-center bg-surface-dark-surface rounded-2xl border border-border-dark text-xs text-content-secondary-dark">
          No platform vendor expenses logged yet.
        </div>
      ) : (
        <div className="bg-surface-dark-surface rounded-2xl border border-border-dark overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-dark text-[10px] uppercase font-bold text-content-secondary-dark">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark text-content-secondary-dark">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-surface-dark-elevated">
                  <td className="p-3.5 text-content-secondary-dark">{exp.expense_date}</td>
                  <td className="p-3.5 font-bold text-white">{exp.vendor_name}</td>
                  <td className="p-3.5 uppercase text-[10px]">{exp.category?.replace('_', ' ')}</td>
                  <td className="p-3.5 max-w-sm truncate">{exp.notes || '—'}</td>
                  <td className="p-3.5 font-bold text-white text-right">{formatINR(exp.amount_paise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-dark-surface rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-dark text-white text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark mb-4">
              <h3 className="text-sm font-bold">Record Platform Expense</h3>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Cloudflare / OpenAI / Groq"
                  className="w-full px-3 py-2 rounded-lg bg-surface-dark-elevated border border-border-dark text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-dark-elevated border border-border-dark text-white focus:outline-none"
                >
                  <option value="cloud_infrastructure">Cloud Infrastructure (Cloudflare)</option>
                  <option value="ai_api_usage">AI API Token Usage</option>
                  <option value="payment_fees">Payment Gateway Fees</option>
                  <option value="software_subscriptions">Software Tools & Subscriptions</option>
                  <option value="salaries">Contractors & Engineering</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="3500"
                  className="w-full px-3 py-2 rounded-lg bg-surface-dark-elevated border border-border-dark text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Monthly Workers Paid subscription..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-dark-elevated border border-border-dark text-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border-dark font-semibold hover:bg-surface-dark-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700"
                >
                  Save Platform Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
