'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { Receipt, Search, Printer, CheckCircle2, Loader2, AlertCircle, X, Calendar, Filter, RotateCcw } from 'lucide-react';

export default function BillingInvoicesPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceDetailsLoading, setInvoiceDetailsLoading] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadInvoices = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      let url = '/billing/invoices';
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const data = await apiClient(url);
      setInvoices(data.invoices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [currentTenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedInvoice) {
        setSelectedInvoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvoice]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
  };

  // Instant client-side filtering over retrieved invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (fromDate && inv.issue_date < fromDate) return false;
      if (toDate && inv.issue_date > toDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInv = inv.invoice_number?.toLowerCase().includes(q);
        const matchGuest = inv.guest_name?.toLowerCase().includes(q);
        const matchPhone = inv.guest_phone?.includes(q);
        const matchEmail = inv.guest_email?.toLowerCase().includes(q);
        if (!matchInv && !matchGuest && !matchPhone && !matchEmail) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, fromDate, toDate, searchQuery]);

  const handleViewInvoice = async (invoiceId: string) => {
    setInvoiceDetailsLoading(true);
    try {
      const data = await apiClient(`/billing/invoices/${invoiceId}`);
      setSelectedInvoice(data);
    } catch (e: any) {
      alert(e.message || 'Failed to load invoice details');
    } finally {
      setInvoiceDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="pb-3 border-b border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            GST Invoices &amp; Tax Billing
          </h1>
          <p className="text-xs text-content-secondary-light">
            Tax-compliant guest folios, CGST/SGST breakdowns, and printable tax receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-brand-blue rounded-xl border border-blue-100">
            {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Invoice' : 'Invoices'} Found
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-border-light shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search guest name, invoice #, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') loadInvoices(); }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border-light bg-surface-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date From */}
          <div className="relative">
            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              onBlur={() => loadInvoices()}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border-light bg-surface-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-medium"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">To Date</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              onBlur={() => loadInvoices()}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border-light bg-surface-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-medium"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border-light bg-surface-light focus:outline-none focus:ring-1 focus:ring-brand-blue font-bold"
            >
              <option value="all">All Invoices</option>
              <option value="paid">Paid</option>
              <option value="issued">Issued / Unpaid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={loadInvoices}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-brand-blue-hover transition"
          >
            <Search className="w-3.5 h-3.5" /> Apply Filters
          </button>
          {(searchQuery || statusFilter !== 'all' || fromDate || toDate) && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Filters active. Showing {filteredInvoices.length} result(s).
              </span>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <Receipt className="w-10 h-10 text-content-secondary-light mx-auto" />
          <h3 className="text-base font-bold text-content-primary-light">No Invoices Found</h3>
          <p className="text-xs text-content-secondary-light">
            {invoices.length > 0
              ? 'No invoices match your current search and date filters. Try clearing filters.'
              : 'Tax invoices are generated automatically whenever a reservation is confirmed.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || fromDate || toDate) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Guest Name</th>
                  <th className="p-3.5">Issue Date</th>
                  <th className="p-3.5">Subtotal</th>
                  <th className="p-3.5">GST Tax</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-light/40 transition">
                    <td className="p-3.5 font-mono font-bold text-brand-blue">{inv.invoice_number}</td>
                    <td className="p-3.5 font-bold text-content-primary-light">
                      <div>{inv.guest_name}</div>
                      {inv.guest_phone && (
                        <div className="text-[10px] font-normal text-slate-400">{inv.guest_phone}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-content-secondary-light">{inv.issue_date}</td>
                    <td className="p-3.5 text-content-secondary-light">{formatINR(inv.subtotal_paise)}</td>
                    <td className="p-3.5 text-content-secondary-light">{formatINR(inv.total_tax_paise)}</td>
                    <td className="p-3.5 font-extrabold text-content-primary-light">{formatINR(inv.total_amount_paise)}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleViewInvoice(inv.id)}
                        className="px-2.5 py-1 rounded bg-blue-50 text-brand-blue font-semibold text-[11px] hover:bg-blue-100 transition"
                      >
                        View &amp; Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div
          onClick={() => setSelectedInvoice(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 print:p-0 print:bg-white print:static print:inset-auto"
        >
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #invoice-print-container, #invoice-print-container * {
                visibility: visible !important;
              }
              #invoice-print-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 32px !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
              }
            }
          `}</style>
          <div
            id="invoice-print-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-print-title"
            className="relative bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-border-light max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none"
          >
            {/* Top-Right Cross Button */}
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors print:hidden"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex justify-between items-start pb-6 border-b border-border-light pr-8">
              <div>
                <h2 className="text-xl font-extrabold text-content-primary-light">
                  {selectedInvoice.invoice.property_name}
                </h2>
                <p className="text-xs text-content-secondary-light">
                  {selectedInvoice.invoice.property_address || 'India'}
                </p>
                {selectedInvoice.invoice.gst_number && (
                  <p className="text-xs font-mono font-semibold text-content-primary-light mt-1">
                    GSTIN: {selectedInvoice.invoice.gst_number}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-brand-blue uppercase font-mono">
                  TAX INVOICE
                </span>
                <div className="text-xs font-mono font-bold text-content-primary-light mt-1">
                  #{selectedInvoice.invoice.invoice_number}
                </div>
                <div className="text-[11px] text-content-secondary-light">
                  Date: {selectedInvoice.invoice.issue_date}
                </div>
              </div>
            </div>

            {/* Billed To */}
            <div className="py-4 border-b border-border-light text-xs grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-content-secondary-light">Billed To:</span>
                <div className="font-bold text-content-primary-light text-sm mt-0.5">
                  {selectedInvoice.invoice.guest_name}
                </div>
                <div className="text-content-secondary-light">{selectedInvoice.invoice.guest_phone || ''}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-content-secondary-light">Status:</span>
                <div className="font-extrabold text-sm uppercase text-emerald-700 mt-0.5">
                  {selectedInvoice.invoice.status}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-4">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border-light font-bold text-content-secondary-light text-[10px] uppercase">
                  <tr>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">HSN/SAC</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Tax</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border-light">
                  {selectedInvoice.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium">{item.description}</td>
                      <td className="py-2.5 text-center font-mono text-[11px] text-slate-500">{item.hsn_code || '996311'}</td>
                      <td className="py-2.5 text-right">{formatINR(item.unit_price_paise)}</td>
                      <td className="py-2.5 text-right text-content-secondary-light">{formatINR(item.tax_amount_paise)}</td>
                      <td className="py-2.5 text-right font-bold">{formatINR(item.amount_paise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-border-light text-xs space-y-1.5 max-w-xs ml-auto">
              <div className="flex justify-between text-content-secondary-light">
                <span>Subtotal:</span>
                <span className="font-medium text-content-primary-light">{formatINR(selectedInvoice.invoice.subtotal_paise)}</span>
              </div>
              <div className="flex justify-between text-content-secondary-light">
                <span>CGST (Central):</span>
                <span>{formatINR(selectedInvoice.invoice.cgst_paise)}</span>
              </div>
              <div className="flex justify-between text-content-secondary-light">
                <span>SGST (State):</span>
                <span>{formatINR(selectedInvoice.invoice.sgst_paise)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base text-content-primary-light pt-2 border-t border-border-light">
                <span>Total:</span>
                <span className="text-brand-blue">{formatINR(selectedInvoice.invoice.total_amount_paise)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-4 border-t border-border-light flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Tax Folio
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-6 py-2.5 rounded-lg border border-border-light font-semibold text-xs hover:bg-surface-light"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

