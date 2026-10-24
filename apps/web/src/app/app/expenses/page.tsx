'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  PieChart,
  PlusCircle,
  Loader2,
  X,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  Receipt,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Building,
  Filter,
} from 'lucide-react';

interface Staff {
  id: string;
  staff_name: string;
  designation: string;
  department: string;
  monthly_salary_paise: number;
  joining_date: string;
  phone: string | null;
  email: string | null;
  is_active: number;
  notes: string | null;
}

interface SalaryPayment {
  id: string;
  staff_salary_id: string;
  staff_name: string;
  designation?: string;
  department?: string;
  payment_month: string;
  amount_paise: number;
  bonus_paise: number;
  deduction_paise: number;
  net_paise: number;
  payment_date: string;
  payment_mode: string;
  notes: string | null;
}

interface Expense {
  id: string;
  category: string;
  title: string;
  description: string;
  amount_paise: number;
  expense_type: 'one_time' | 'monthly_recurring';
  expense_date: string;
  vendor_name: string | null;
  payment_mode: string;
  receipt_url: string | null;
}

const EXPENSE_CATEGORIES = [
  'Kitchen & Groceries',
  'Housekeeping & Linen',
  'Electricity & Utilities',
  'Fuel & Genset Diesel',
  'Repairs & Maintenance',
  'Marketing & OTAs',
  'Internet & Telecom',
  'Licenses & Software',
  'Guest Amenities',
  'General Operational',
];

export default function ExpensesPage() {
  const { currentTenant } = useAuth();
  const [activeTab, setActiveTab] = useState<'expenses' | 'salaries' | 'pnl'>('expenses');
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');

  // Expenses Tab State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseFilterCategory, setExpenseFilterCategory] = useState('all');
  const [expenseFilterType, setExpenseFilterType] = useState('all');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expAmountRupees, setExpAmountRupees] = useState('');
  const [expType, setExpType] = useState<'one_time' | 'monthly_recurring'>('one_time');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expVendor, setExpVendor] = useState('');
  const [expPaymentMode, setExpPaymentMode] = useState('upi');
  const [expDescription, setExpDescription] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  // Staff & Salary Tab State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffDesignation, setStaffDesignation] = useState('Front Desk Executive');
  const [staffDepartment, setStaffDepartment] = useState('front_desk');
  const [staffSalaryRupees, setStaffSalaryRupees] = useState('18000');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffJoiningDate, setStaffJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingStaff, setSavingStaff] = useState(false);

  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [payoutMonth, setPayoutMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payoutBaseRupees, setPayoutBaseRupees] = useState('');
  const [payoutBonusRupees, setPayoutBonusRupees] = useState('0');
  const [payoutDeductionRupees, setPayoutDeductionRupees] = useState('0');
  const [payoutMode, setPayoutMode] = useState('bank_transfer');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [savingPayout, setSavingPayout] = useState(false);

  // P&L Summary State
  const [pnlData, setPnlData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);

        const [expRes, staffRes, payRes, pnlRes] = await Promise.all([
          apiClient(`/expenses?property_id=${activeProp.id}`),
          apiClient(`/salary/staff?property_id=${activeProp.id}`),
          apiClient('/salary/salary-payments'),
          apiClient(`/expenses/pnl-summary?property_id=${activeProp.id}`),
        ]);

        setExpenses(expRes.expenses || []);
        setStaffList(staffRes.staff || []);
        setSalaryPayments(payRes.payments || []);
        setPnlData(pnlRes || null);
      }
    } catch (e) {
      console.error('Failed to load expenses/salary data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) {
      loadData();
    }
  }, [currentTenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expenseModalOpen) setExpenseModalOpen(false);
        if (staffModalOpen) setStaffModalOpen(false);
        if (payoutModalOpen) setPayoutModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expenseModalOpen, staffModalOpen, payoutModalOpen]);

  // Create Expense Handler
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmountRupees) {
      alert('Please provide expense title and amount');
      return;
    }

    setSavingExpense(true);
    try {
      await apiClient('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          title: expTitle.trim(),
          category: expCategory,
          amountPaise: Math.round((parseFloat(expAmountRupees) || 0) * 100),
          expenseType: expType,
          expenseDate: expDate,
          vendorName: expVendor.trim(),
          paymentMode: expPaymentMode,
          description: expDescription.trim(),
        }),
      });

      setExpenseModalOpen(false);
      setExpTitle('');
      setExpAmountRupees('');
      setExpVendor('');
      setExpDescription('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    } finally {
      setSavingExpense(false);
    }
  };

  // Delete Expense Handler
  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await apiClient(`/expenses/${id}`, { method: 'DELETE' });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  // Create Staff Member Handler
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      alert('Please enter staff name');
      return;
    }

    setSavingStaff(true);
    try {
      await apiClient('/salary/staff', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          staffName: staffName.trim(),
          designation: staffDesignation.trim(),
          department: staffDepartment,
          monthlySalaryPaise: Math.round((parseFloat(staffSalaryRupees) || 0) * 100),
          joiningDate: staffJoiningDate,
          phone: staffPhone.trim() || null,
        }),
      });

      setStaffModalOpen(false);
      setStaffName('');
      setStaffPhone('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member');
    } finally {
      setSavingStaff(false);
    }
  };

  // Open Payout Modal for Staff
  const openPayoutModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setPayoutMonth(new Date().toISOString().slice(0, 7));
    setPayoutBaseRupees(String(staff.monthly_salary_paise / 100));
    setPayoutBonusRupees('0');
    setPayoutDeductionRupees('0');
    setPayoutMode('bank_transfer');
    setPayoutNotes('');
    setPayoutModalOpen(true);
  };

  // Record Salary Payout Handler
  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setSavingPayout(true);
    try {
      const basePaise = Math.round((parseFloat(payoutBaseRupees) || 0) * 100);
      const bonusPaise = Math.round((parseFloat(payoutBonusRupees) || 0) * 100);
      const deductionPaise = Math.round((parseFloat(payoutDeductionRupees) || 0) * 100);
      const netPaise = Math.max(0, basePaise + bonusPaise - deductionPaise);

      await apiClient('/salary/salary-payments', {
        method: 'POST',
        body: JSON.stringify({
          staffSalaryId: selectedStaff.id,
          staffName: selectedStaff.staff_name,
          paymentMonth: payoutMonth,
          amountPaise: basePaise,
          bonusPaise,
          deductionPaise,
          netPaise,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: payoutMode,
          notes: payoutNotes.trim(),
        }),
      });

      setPayoutModalOpen(false);
      await loadData();
      alert(`Salary payment of ${formatINR(netPaise)} recorded for ${selectedStaff.staff_name}`);
    } catch (err: any) {
      alert(err.message || 'Failed to record salary payout');
    } finally {
      setSavingPayout(false);
    }
  };

  // Filtered Expenses
  const filteredExpenses = expenses.filter((e) => {
    if (expenseFilterCategory !== 'all' && e.category !== expenseFilterCategory) return false;
    if (expenseFilterType !== 'all' && e.expense_type !== expenseFilterType) return false;
    return true;
  });

  const totalExpensePaise = filteredExpenses.reduce((sum, e) => sum + e.amount_paise, 0);
  const totalSalariesPaise = salaryPayments.reduce((sum, p) => sum + p.net_paise, 0);

  // Current Month Financials (from P&L summary)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const curRevenue = pnlData?.revenueByMonth?.find((r: any) => r.month === currentMonthStr)?.total_revenue_paise || 0;
  const curExpenses = pnlData?.expensesByMonth?.find((e: any) => e.month === currentMonthStr)?.total_expenses_paise || 0;
  const curSalaries = pnlData?.salariesByMonth?.find((s: any) => s.month === currentMonthStr)?.total_salaries_paise || 0;
  const curNetProfit = curRevenue - curExpenses - curSalaries;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-content-primary-light flex items-center gap-2">
            <PieChart className="w-6 h-6 text-brand-blue" />
            Hotel Expenses, Staff Salary &amp; P&amp;L
          </h1>
          <p className="text-xs text-content-secondary-light mt-1">
            Track daily operating bills, manage staff payroll disbursements, and monitor net operational profit.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-light rounded-xl border border-border-light text-xs font-bold">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'expenses'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-content-secondary-light hover:text-content-primary-light'
            }`}
          >
            Hotel Expenses
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'salaries'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-content-secondary-light hover:text-content-primary-light'
            }`}
          >
            Staff Payroll ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'pnl'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-content-secondary-light hover:text-content-primary-light'
            }`}
          >
            P&amp;L Summary
          </button>
        </div>
      </div>

      {/* TAB 1: HOTEL OPERATIONAL EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={expenseFilterCategory}
                onChange={(e) => setExpenseFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border-light bg-white text-content-primary-light font-semibold"
              >
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={expenseFilterType}
                onChange={(e) => setExpenseFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border-light bg-white text-content-primary-light font-semibold"
              >
                <option value="all">All Expense Types</option>
                <option value="one_time">One-Time Only</option>
                <option value="monthly_recurring">Monthly Recurring</option>
              </select>

              <div className="text-xs text-content-secondary-light font-semibold pl-2">
                Total: <span className="text-content-primary-light font-extrabold">{formatINR(totalExpensePaise)}</span>
              </div>
            </div>

            <button
              onClick={() => setExpenseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover shadow-xs transition shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Log Hotel Expense
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-content-primary-light">No Expenses Found</h3>
              <p className="text-xs text-content-secondary-light">
                Log groceries, electricity bills, linen cleaning, repairs, or OTA marketing costs.
              </p>
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold"
              >
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-border-light font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Expense Title</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Vendor / Payee</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5 text-right">Amount</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3.5 text-slate-500 font-mono">{exp.expense_date}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {exp.title}
                          {exp.description && (
                            <div className="text-[10px] text-slate-400 font-normal line-clamp-1">
                              {exp.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-brand-blue font-semibold text-[10px] border border-blue-100">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              exp.expense_type === 'monthly_recurring'
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {exp.expense_type === 'monthly_recurring' ? 'Monthly' : 'One-Time'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{exp.vendor_name || '—'}</td>
                        <td className="p-3.5 uppercase text-[10px] font-bold text-slate-500">
                          {exp.payment_mode}
                        </td>
                        <td className="p-3.5 font-extrabold text-right text-slate-900">
                          {formatINR(exp.amount_paise)}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY & PAYROLL */}
      {activeTab === 'salaries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Staff Payroll &amp; Directory</h3>
              <p className="text-xs text-slate-500">Manage hotel staff directory and disburse monthly salary vouchers.</p>
            </div>
            <button
              onClick={() => setStaffModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover shadow-xs transition shrink-0"
            >
              <Users className="w-4 h-4" /> Add Staff Member
            </button>
          </div>

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((st) => (
              <div
                key={st.id}
                className="bg-white rounded-2xl border border-border-light p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{st.staff_name}</h4>
                      <p className="text-xs text-brand-blue font-semibold">{st.designation}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-semibold capitalize text-slate-700">{st.department.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Base Salary:</span>
                      <span className="font-extrabold text-slate-900">{formatINR(st.monthly_salary_paise)}</span>
                    </div>
                    {st.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contact:</span>
                        <span className="font-mono">{st.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openPayoutModal(st)}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Disburse Monthly Salary
                </button>
              </div>
            ))}
          </div>

          {/* Past Salary Payments Ledger */}
          <div className="space-y-3 pt-4 border-t border-border-light">
            <h4 className="font-extrabold text-sm text-slate-900">Salary Disbursement History</h4>
            {salaryPayments.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-border-light text-xs text-slate-500">
                No salary disbursements recorded yet.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-border-light font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Month</th>
                        <th className="p-3.5">Staff Name</th>
                        <th className="p-3.5">Disbursed Date</th>
                        <th className="p-3.5">Base</th>
                        <th className="p-3.5">Bonus / OT</th>
                        <th className="p-3.5">Deduction</th>
                        <th className="p-3.5">Net Paid</th>
                        <th className="p-3.5">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salaryPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3.5 font-mono font-bold text-brand-blue">{p.payment_month}</td>
                          <td className="p-3.5 font-bold text-slate-900">{p.staff_name}</td>
                          <td className="p-3.5 text-slate-500 font-mono">{p.payment_date}</td>
                          <td className="p-3.5 text-slate-600">{formatINR(p.amount_paise)}</td>
                          <td className="p-3.5 text-emerald-600 font-semibold">+{formatINR(p.bonus_paise)}</td>
                          <td className="p-3.5 text-red-600 font-semibold">-{formatINR(p.deduction_paise)}</td>
                          <td className="p-3.5 font-extrabold text-slate-900">{formatINR(p.net_paise)}</td>
                          <td className="p-3.5 uppercase font-bold text-[10px] text-slate-500">{p.payment_mode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: P&L SUMMARY */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-border-light shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Current Month Revenue</span>
              <div className="text-xl font-extrabold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                {formatINR(curRevenue)}
              </div>
              <p className="text-[11px] text-slate-400">Total bookings &amp; dining income</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border-light shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Operating Expenses</span>
              <div className="text-xl font-extrabold text-amber-600 flex items-center gap-1">
                <Receipt className="w-5 h-5 text-amber-500" />
                {formatINR(curExpenses)}
              </div>
              <p className="text-[11px] text-slate-400">Utilities, supplies, food items</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-border-light shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Staff Payroll</span>
              <div className="text-xl font-extrabold text-purple-600 flex items-center gap-1">
                <Users className="w-5 h-5 text-purple-500" />
                {formatINR(curSalaries)}
              </div>
              <p className="text-[11px] text-slate-400">Net salary vouchers disbursed</p>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-xs space-y-1 ${
                curNetProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
              }`}
            >
              <span className="text-xs font-semibold text-slate-700">Net Operational Profit</span>
              <div
                className={`text-xl font-extrabold flex items-center gap-1 ${
                  curNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {curNetProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {formatINR(curNetProfit)}
              </div>
              <p className="text-[11px] text-slate-500">Revenue minus total costs</p>
            </div>
          </div>

          {/* Historical Month-by-Month Breakdown */}
          <div className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden space-y-3 p-4">
            <h3 className="font-extrabold text-sm text-slate-900">Past 6 Months Financial Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-border-light font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3">Booking Revenue</th>
                    <th className="p-3">Hotel Expenses</th>
                    <th className="p-3">Staff Payroll</th>
                    <th className="p-3 text-right">Net Profit / Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(pnlData?.revenueByMonth || []).map((rm: any) => {
                    const month = rm.month;
                    const rev = rm.total_revenue_paise || 0;
                    const exp = pnlData?.expensesByMonth?.find((e: any) => e.month === month)?.total_expenses_paise || 0;
                    const sal = pnlData?.salariesByMonth?.find((s: any) => s.month === month)?.total_salaries_paise || 0;
                    const net = rev - exp - sal;

                    return (
                      <tr key={month} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-800">{month}</td>
                        <td className="p-3 text-emerald-600 font-bold">{formatINR(rev)}</td>
                        <td className="p-3 text-amber-600 font-semibold">{formatINR(exp)}</td>
                        <td className="p-3 text-purple-600 font-semibold">{formatINR(sal)}</td>
                        <td
                          className={`p-3 font-extrabold text-right ${
                            net >= 0 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {formatINR(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG HOTEL EXPENSE */}
      {expenseModalOpen && (
        <div
          onClick={() => setExpenseModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <h3 id="expense-modal-title" className="text-sm font-bold text-content-primary-light flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-blue" />
                Record Hotel Expense
              </h3>
              <button
                type="button"
                onClick={() => setExpenseModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Breakfast milk & vegetables, Genset diesel"
                  className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={expType}
                    onChange={(e: any) => setExpType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  >
                    <option value="one_time">One-Time</option>
                    <option value="monthly_recurring">Monthly Recurring</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount in INR (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={expAmountRupees}
                    onChange={(e) => setExpAmountRupees(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    value={expVendor}
                    onChange={(e) => setExpVendor(e.target.value)}
                    placeholder="Vendor Name"
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={expPaymentMode}
                    onChange={(e) => setExpPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  >
                    <option value="upi">UPI / QR</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="cash">Cash</option>
                    <option value="card">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="Optional details or invoice reference number..."
                  className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-light font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  {savingExpense ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF MEMBER */}
      {staffModalOpen && (
        <div
          onClick={() => setStaffModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <h3 id="staff-modal-title" className="text-sm font-bold text-content-primary-light flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-blue" />
                Add Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  >
                    <option value="front_desk">Front Desk / Reception</option>
                    <option value="kitchen">Kitchen / Chef / Cook</option>
                    <option value="housekeeping">Housekeeping / Cleaning</option>
                    <option value="maintenance">Maintenance / Electrician</option>
                    <option value="security">Security / Guard</option>
                    <option value="management">Manager / Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={staffDesignation}
                    onChange={(e) => setStaffDesignation(e.target.value)}
                    placeholder="Head Cook, Room Boy"
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={staffSalaryRupees}
                    onChange={(e) => setStaffSalaryRupees(e.target.value)}
                    placeholder="18000"
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={staffJoiningDate}
                  onChange={(e) => setStaffJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-light font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  {savingStaff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISBURSE SALARY PAYOUT */}
      {payoutModalOpen && selectedStaff && (
        <div
          onClick={() => setPayoutModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payout-modal-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <h3 id="payout-modal-title" className="text-sm font-bold text-content-primary-light flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-blue" />
                Salary Payout Voucher: {selectedStaff.staff_name}
              </h3>
              <button
                type="button"
                onClick={() => setPayoutModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary Month *</label>
                  <input
                    type="month"
                    required
                    value={payoutMonth}
                    onChange={(e) => setPayoutMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={payoutBaseRupees}
                    onChange={(e) => setPayoutBaseRupees(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-light font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bonus / Overtime (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={payoutBonusRupees}
                    onChange={(e) => setPayoutBonusRupees(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-emerald-800 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deductions / Advance (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={payoutDeductionRupees}
                    onChange={(e) => setPayoutDeductionRupees(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-red-300 text-red-800 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Net Payout Calculated Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Net Payable Amount</span>
                  <span className="font-extrabold text-base text-brand-blue">
                    {formatINR(
                      Math.max(
                        0,
                        Math.round(
                          ((parseFloat(payoutBaseRupees) || 0) +
                            (parseFloat(payoutBonusRupees) || 0) -
                            (parseFloat(payoutDeductionRupees) || 0)) *
                            100
                        )
                      )
                    )}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Auto calculated</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Disbursement Mode</label>
                <select
                  value={payoutMode}
                  onChange={(e) => setPayoutMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue text-xs font-semibold"
                >
                  <option value="bank_transfer">Direct Bank Transfer (IMPS/NEFT)</option>
                  <option value="upi">UPI / Google Pay / PhonePe</option>
                  <option value="cash">Cash Voucher</option>
                  <option value="cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Voucher Reference</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Paid via ICICI Bank UTR #123456"
                  className="w-full px-3 py-2 rounded-xl border border-border-light text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-light font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayout}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  {savingPayout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}