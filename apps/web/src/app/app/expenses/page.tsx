'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { PieChart, PlusCircle, Loader2, X } from 'lucide-react';

export default function ExpensesPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const data = await apiClient(`/billing/expenses?property_id=${activeProp.id}`);
        setExpenses(data.expenses || []);
        setCategories(data.categories || []);
        if (data.categories?.length > 0) setCategoryId(data.categories[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) fetchExpenses();
  }, [currentTenant]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/billing/expenses', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          categoryId,
          vendorName,
          description,
          amountPaise: Math.round((parseFloat(amountRupees) || 0) * 100),
          expenseDate: new Date().toISOString().split('T')[0],
        }),
      });
      setModalOpen(false);
      setDescription('');
      setAmountRupees('');
      await fetchExpenses();
    } catch (e: any) {
      alert(e.message || 'Failed to save expense');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Hotel Operational Expenses
          </h1>
          <p className="text-xs text-content-secondary-light">
            Record groceries, kitchen supplies, electricity bills, linen laundry, and staff payouts
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <PieChart className="w-10 h-10 text-content-secondary-light mx-auto" />
          <h3 className="text-base font-bold text-content-primary-light">No Expenses Recorded Yet</h3>
          <p className="text-xs text-content-secondary-light">
            Keep track of operational expenses to maintain accurate profit and loss statements.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-surface-light/40 transition">
                    <td className="p-3.5 text-content-secondary-light">{exp.expense_date}</td>
                    <td className="p-3.5 font-bold text-content-primary-light">{exp.category_name}</td>
                    <td className="p-3.5 text-content-secondary-light">{exp.vendor_name || '—'}</td>
                    <td className="p-3.5 font-medium max-w-sm truncate">{exp.description}</td>
                    <td className="p-3.5 uppercase text-[10px] text-content-secondary-light">{exp.payment_method}</td>
                    <td className="p-3.5 font-extrabold text-right text-content-primary-light">
                      {formatINR(exp.amount_paise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 className="text-sm font-bold text-content-primary-light">Record Operational Expense</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Expense Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Amount in Rupees (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="1450"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Vendor / Payee Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Shree Krishna Provisions"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breakfast milk, bread, butter, vegetables..."
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border-light font-semibold hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
