'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Settings, Save, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function HotelSettingsPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('HF-');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    async function loadSettings() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        if (activeProp) {
          setProperty(activeProp);
          setName(activeProp.name || '');
          setPhone(activeProp.phone || '');
          setEmail(activeProp.email || '');
          setAddress(activeProp.address_line1 || '');
          setGstNumber(activeProp.gst_number || '');
          setInvoicePrefix(activeProp.invoice_prefix || 'HF-');
          setUpiId(activeProp.upi_id || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [currentTenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    setSaved(false);

    try {
      await apiClient(`/properties/${property.id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          phone,
          email,
          address_line1: address,
          gst_number: gstNumber,
          invoice_prefix: invoicePrefix,
          upi_id: upiId,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Property Settings & GST
        </h1>
        <p className="text-xs text-content-secondary-light">
          Configure hotel profile, tax identification (GSTIN), invoice prefixes, and UPI payment IDs
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border-light shadow-sm">
        {saved && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Settings saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div>
            <label className="block font-semibold mb-1">Hotel / Property Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Front Desk Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Front Desk Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Property Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border-light">
            <div>
              <label className="block font-semibold mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="07AAAAA0000A1Z5"
                className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="HF-"
                className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">UPI ID for Guest QR</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="hotel@upi"
                className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-hover transition shadow-sm flex items-center justify-center gap-2 mt-4"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Property Settings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
