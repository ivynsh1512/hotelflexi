'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Layers,
  ArrowRight,
  Calendar,
  Save,
  Server,
  Key,
} from 'lucide-react';

interface LedgerMapping {
  systemLedgerKey: string;
  tallyLedgerName: string;
  tallyParentGroup: string;
}

interface ConnectorData {
  syncToken: string;
  isLive: boolean;
  lastSyncAt: number | null;
  companyName: string;
  enabled: boolean;
}

const DEFAULT_MAPPINGS: LedgerMapping[] = [
  { systemLedgerKey: 'room_revenue', tallyLedgerName: 'Room Sales A/c', tallyParentGroup: 'Sales Accounts' },
  { systemLedgerKey: 'food_revenue', tallyLedgerName: 'Restaurant & F&B Sales', tallyParentGroup: 'Sales Accounts' },
  { systemLedgerKey: 'gst_cgst_6', tallyLedgerName: 'CGST 6% Output', tallyParentGroup: 'Duties & Taxes' },
  { systemLedgerKey: 'gst_sgst_6', tallyLedgerName: 'SGST 6% Output', tallyParentGroup: 'Duties & Taxes' },
  { systemLedgerKey: 'gst_cgst_9', tallyLedgerName: 'CGST 9% Output', tallyParentGroup: 'Duties & Taxes' },
  { systemLedgerKey: 'gst_sgst_9', tallyLedgerName: 'SGST 9% Output', tallyParentGroup: 'Duties & Taxes' },
  { systemLedgerKey: 'cash', tallyLedgerName: 'Cash in Hand (Front Desk)', tallyParentGroup: 'Cash-in-Hand' },
  { systemLedgerKey: 'bank', tallyLedgerName: 'Bank / UPI / Razorpay A/c', tallyParentGroup: 'Bank Accounts' },
  { systemLedgerKey: 'ota_receivable', tallyLedgerName: 'OTA Clearing Account', tallyParentGroup: 'Current Assets' },
];

export default function TallyPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [connector, setConnector] = useState<ConnectorData | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [mappings, setMappings] = useState<LedgerMapping[]>(DEFAULT_MAPPINGS);
  const [queue, setQueue] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState(false);
  const [savingLedgers, setSavingLedgers] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Date filters for XML export
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);

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

      const [connRes, ledgersRes, queueRes] = await Promise.all([
        apiClient(`/tally/connector?propertyId=${activeProp.id}`).catch(() => ({ connector: null })),
        apiClient(`/tally/ledgers?propertyId=${activeProp.id}`).catch(() => ({ mappings: [] })),
        apiClient(`/tally/queue?propertyId=${activeProp.id}`).catch(() => ({ queue: [] })),
      ]);

      if (connRes.connector) {
        setConnector(connRes.connector);
        setCompanyName(connRes.connector.companyName || '');
      }

      if (ledgersRes.mappings && ledgersRes.mappings.length > 0) {
        setMappings(ledgersRes.mappings);
      } else {
        setMappings(DEFAULT_MAPPINGS);
      }

      setQueue(queueRes.queue || []);
    } catch (e) {
      console.error('Failed to load Tally integration data:', e);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyToken = () => {
    if (!connector?.syncToken) return;
    navigator.clipboard.writeText(connector.syncToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSaveLedgers = async () => {
    if (!propertyId) return;
    setSavingLedgers(true);
    try {
      await apiClient('/tally/ledgers', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          mappings,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save ledger mappings');
    } finally {
      setSavingLedgers(false);
    }
  };

  const handleRotateToken = async () => {
    if (!confirm('Are you sure you want to rotate the Tally connector token? The existing token in your local Tally utility will stop working.')) {
      return;
    }
    try {
      const res = await apiClient('/tally/connector/rotate-token', {
        method: 'POST',
        body: JSON.stringify({ propertyId }),
      });
      if (res.syncToken && connector) {
        setConnector({ ...connector, syncToken: res.syncToken });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to rotate token');
    }
  };

  const handleDownloadXml = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://hotelflexi.divyansh-shukla.workers.dev/api/v1';
    const exportUrl = `${apiBase}/tally/export/vouchers.xml?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`;
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              TallyPrime Connector
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Export GST invoices, room revenue, F&amp;B sales, and payment vouchers formatted for TallyPrime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Direct XML Export & Connector Settings */}
        <div className="space-y-6">
          {/* Card 1: One-Click Tally XML Export */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Download className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Direct Tally XML Export</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Export complete Sales and Receipt vouchers for your accountant to import via TallyPrime&apos;s <strong>&ldquo;Import Data &gt; Vouchers&rdquo;</strong> menu.
            </p>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadXml}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 mt-2"
              >
                <Download className="w-4 h-4" /> Download Tally Vouchers XML
              </button>
            </div>
          </div>

          {/* Card 2: Live Local Connector Bridge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-blue" />
                <h3 className="font-bold text-sm text-slate-900">Live Connector Bridge</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                connector?.isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {connector?.isLive ? 'Live Sync Active' : 'Standby / Manual XML'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Tally Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hotel Grand Royal 2026-27"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Connector Secret Token</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="password"
                    readOnly
                    value={connector?.syncToken || 'Loading token...'}
                    className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700"
                  />
                  <button
                    onClick={handleCopyToken}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                    title="Copy Token"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px]">
                <button
                  type="button"
                  onClick={handleRotateToken}
                  className="text-slate-500 hover:text-rose-600 font-semibold"
                >
                  Rotate Secret Token
                </button>
                <span className="text-slate-400">TallyPrime Release 3.0+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Ledger Mapping Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Chart of Accounts &amp; Ledger Mappings
                </h3>
                <p className="text-[11px] text-slate-500">
                  Customize ledger names so they match your hotel&apos;s existing TallyPrime ledger accounts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveLedgers}
                disabled={savingLedgers}
                className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                {savingLedgers ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Ledger Map
                  </>
                )}
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Ledger mappings successfully updated! Future voucher exports will use these names.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">System Ledger Account</th>
                    <th className="py-2.5 px-3">Your Exact Tally Ledger Name</th>
                    <th className="py-2.5 px-3">Parent Group in Tally</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappings.map((m, idx) => (
                    <tr key={m.systemLedgerKey} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-700 capitalize">
                        {m.systemLedgerKey.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={m.tallyLedgerName}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[idx].tallyLedgerName = e.target.value;
                            setMappings(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={m.tallyParentGroup}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[idx].tallyParentGroup = e.target.value;
                            setMappings(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800">💡 Tally GST Compliance Tip:</span>
              <p>
                Ensure your CGST and SGST ledgers in Tally have the Type of Duty set to <code>GST</code>. HotelFlexi generates fully balanced multi-line double-entry accounting XML with separate tax heads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
