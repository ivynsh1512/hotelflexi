'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  TrendingUp,
  Calendar,
  Plus,
  Trash2,
  DollarSign,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function DailyRatesPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [dailyRates, setDailyRates] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [note, setNote] = useState('Peak date surcharge');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (activeProp) {
        setPropertyId(activeProp.id);
        const [rtData, drData] = await Promise.all([
          apiClient(`/rooms/types?property_id=${activeProp.id}`),
          apiClient(`/rooms/daily-rates?property_id=${activeProp.id}`),
        ]);
        const rts = rtData.roomTypes || [];
        setRoomTypes(rts);
        if (rts.length > 0 && !selectedRoomTypeId) {
          setSelectedRoomTypeId(rts[0].id);
        }
        setDailyRates(drData.dailyRates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !selectedRoomTypeId || !startDate || !priceRupees) {
      alert('Please fill in room category, start date, and custom price');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    try {
      const pricePaise = Math.round(parseFloat(priceRupees) * 100);
      const res = await apiClient('/rooms/daily-rates', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          roomTypeId: selectedRoomTypeId,
          startDate,
          endDate: endDate || startDate,
          pricePaise,
          note,
        }),
      });

      setSuccessMsg(res.message || 'Rates updated successfully!');
      setPriceRupees('');
      setEndDate('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update rates');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm('Remove this custom rate override?')) return;
    try {
      await apiClient(`/rooms/daily-rates/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Date-Specific Rates & Dynamic Pricing Overrides
        </h1>
        <p className="text-xs text-content-secondary-light">
          Override base prices for festivals, peak season weekends, or special event dates
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rate Override Form Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-border-light p-5 shadow-sm space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-3 border-b border-border-light font-bold text-sm text-content-primary-light">
              <TrendingUp className="w-4 h-4 text-brand-blue" />
              Set Custom Date Price
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleApplyOverride} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                  Room Category *
                </label>
                <select
                  value={selectedRoomTypeId}
                  onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} (Base: {formatINR(rt.base_price_paise)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                    From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                    To Date (Inclusive)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Same as start"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                  Custom Nightly Tariff (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full px-3 py-2 rounded-lg border border-border-light font-bold text-sm text-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-content-primary-light block mb-1">
                  Note / Reason
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Diwali Weekend / New Year Eve"
                  className="w-full px-3 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Date Overrides'}
              </button>
            </form>
          </div>

          {/* Active Overrides Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-blue" />
                Active Date Rate Overrides ({dailyRates.length})
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-light border-b border-border-light text-[10px] uppercase font-bold text-content-primary-light sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Room Category</th>
                    <th className="py-3 px-4">Custom Rate</th>
                    <th className="py-3 px-4">Standard Base</th>
                    <th className="py-3 px-4">Note</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {dailyRates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-content-secondary-light">
                        No custom date rates set. Your standard base and weekend rates are active.
                      </td>
                    </tr>
                  ) : (
                    dailyRates.map((dr) => (
                      <tr key={dr.id} className="hover:bg-surface-light transition">
                        <td className="py-3 px-4 font-mono font-bold text-content-primary-light">
                          {dr.date}
                        </td>
                        <td className="py-3 px-4 font-semibold text-content-primary-light">
                          {dr.room_type_name}
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-blue">
                          {formatINR(dr.price_paise)}
                        </td>
                        <td className="py-3 px-4 text-content-secondary-light">
                          {formatINR(dr.standard_base_price)}
                        </td>
                        <td className="py-3 px-4 text-content-secondary-light">
                          {dr.note || 'Custom override'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteOverride(dr.id)}
                            className="p-1.5 rounded-lg text-content-secondary-light hover:text-red-600 hover:bg-red-50 transition"
                            title="Remove override"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
