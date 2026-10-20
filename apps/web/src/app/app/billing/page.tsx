'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { Receipt, Search, Printer, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';

export default function BillingInvoicesPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceDetailsLoading, setInvoiceDetailsLoading] = useState(false);

  useEffect(() => {
    async function loadInvoices() {
      if (!currentTenant) return;
      try {
        const data = await apiClient('/billing/invoices');
        setInvoices(data.invoices || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [currentTenant]);

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
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          GST Invoices & Tax Billing
        </h1>
        <p className="text-xs text-content-secondary-light">
          Tax-compliant guest folios, CGST/SGST breakdowns, and printable tax receipts
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <Receipt className="w-10 h-10 text-content-secondary-light mx-auto" />
          <h3 className="text-base font-bold text-content-primary-light">No Invoices Issued Yet</h3>
          <p className="text-xs text-content-secondary-light">
            Tax invoices are generated automatically whenever a reservation is confirmed.
          </p>
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
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-light/40 transition">
                    <td className="p-3.5 font-mono font-bold text-brand-blue">{inv.invoice_number}</td>
                    <td className="p-3.5 font-bold text-content-primary-light">{inv.guest_name}</td>
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
                        View & Print
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-border-light max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none"
          >
            {/* Top-Right Cross Button */}
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors print:hidden"
              aria-label="Close invoice"
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
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Tax</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {selectedInvoice.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium">{item.description}</td>
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
