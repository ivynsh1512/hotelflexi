'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import {
  BarChart3, TrendingUp, Calendar, Loader2, DollarSign,
  Users, BedDouble, CreditCard, RefreshCw, Download,
  ArrowUpRight, ArrowDownRight, Percent, Clock,
} from 'lucide-react';

export default function ReportsPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [dailyCollections, setDailyCollections] = useState<any>(null);
  const [revenueSeries, setRevenueSeries] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [reservationStats, setReservationStats] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (!activeProp) return;
      setPropertyId(activeProp.id);
      const pid = activeProp.id;
      const [ms, dc, rs, pb, rstats] = await Promise.all([
        apiClient(`/reports/monthly-summary?property_id=${pid}`),
        apiClient(`/reports/daily-collections?property_id=${pid}`),
        apiClient(`/reports/revenue-by-date?property_id=${pid}&from_date=${fromDate}&to_date=${toDate}`),
        apiClient(`/reports/payment-breakdown?property_id=${pid}&from_date=${fromDate}&to_date=${toDate}`),
        apiClient(`/reports/reservation-stats?property_id=${pid}&from_date=${fromDate}&to_date=${toDate}`),
      ]);
      setMonthlySummary(ms);
      setDailyCollections(dc);
      setRevenueSeries(rs?.series || []);
      setPaymentBreakdown(pb?.breakdown || []);
      setReservationStats(rstats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, fromDate, toDate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Bar chart: find max value for scaling
  const maxRevenue = Math.max(...revenueSeries.map((s: any) => s.totalPaise || 0), 1);

  const PAYMENT_COLORS: Record<string, string> = {
    cash: 'bg-emerald-500',
    upi: 'bg-blue-500',
    card: 'bg-purple-500',
    razorpay: 'bg-indigo-500',
    bank_transfer: 'bg-amber-500',
    complimentary: 'bg-gray-400',
  };

  const totalPaymentPaise = paymentBreakdown.reduce((s: number, r: any) => s + (r.totalPaise || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">Hotel Analytics & Reports</h1>
          <p className="text-xs text-content-secondary-light mt-0.5">Revenue, occupancy, and booking performance overview</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-border-light bg-surface-light font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue" />
          <span className="text-xs text-content-secondary-light">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-border-light bg-surface-light font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue" />
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover transition">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Revenue', value: formatINR(monthlySummary?.totalRevenuePaise || 0), sub: 'Last 30 days', icon: DollarSign, color: 'text-emerald-600' },
              { label: "Today's Collections", value: formatINR(dailyCollections?.totalPaise || 0), sub: 'All payment modes', icon: CreditCard, color: 'text-blue-600' },
              { label: 'Occupancy Rate', value: `${monthlySummary?.occupancyRate || 0}%`, sub: `${monthlySummary?.occupiedRooms || 0}/${monthlySummary?.totalRooms || 0} rooms`, icon: BedDouble, color: 'text-brand-blue' },
              { label: 'ADR', value: formatINR(monthlySummary?.adrPaise || 0), sub: 'Avg. daily rate per booking', icon: TrendingUp, color: 'text-purple-600' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-content-secondary-light">{label}</p>
                    <p className={`text-xl font-extrabold mt-1 ${color}`}>{value}</p>
                    <p className="text-[10px] text-content-secondary-light mt-0.5">{sub}</p>
                  </div>
                  <Icon className={`w-5 h-5 ${color} opacity-70`} />
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Bar Chart */}
          <div className="bg-white rounded-2xl border border-border-light p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-extrabold text-content-primary-light">Revenue Trend</h2>
                <p className="text-[10px] text-content-secondary-light">Daily collections (₹) — {fromDate} to {toDate}</p>
              </div>
              <BarChart3 className="w-4 h-4 text-brand-blue" />
            </div>
            {revenueSeries.length === 0 ? (
              <div className="py-10 text-center text-xs text-content-secondary-light">No payment data in this period</div>
            ) : (
              <div className="flex items-end gap-1 h-36 overflow-x-auto pb-1">
                {revenueSeries.map((s: any) => {
                  const pct = Math.max(4, Math.round(((s.totalPaise || 0) / maxRevenue) * 100));
                  return (
                    <div key={s.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: '28px' }}>
                      <div
                        className="w-5 bg-brand-blue rounded-t hover:bg-brand-blue-hover transition-all cursor-default"
                        style={{ height: `${pct}%` }}
                        title={`${s.date}: ${formatINR(s.totalPaise)}`}
                      />
                      <span className="text-[8px] text-content-secondary-light rotate-45 origin-top-left" style={{ marginLeft: 4 }}>
                        {s.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Breakdown + Reservation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Mode Breakdown */}
            <div className="bg-white rounded-2xl border border-border-light p-5">
              <h2 className="text-sm font-extrabold text-content-primary-light mb-1">Payment Mode Split</h2>
              <p className="text-[10px] text-content-secondary-light mb-4">{fromDate} to {toDate}</p>
              {paymentBreakdown.length === 0 ? (
                <div className="py-6 text-center text-xs text-content-secondary-light">No payments in this period</div>
              ) : (
                <div className="space-y-3">
                  {paymentBreakdown.map((row: any) => {
                    const pct = totalPaymentPaise > 0 ? Math.round((row.totalPaise / totalPaymentPaise) * 100) : 0;
                    const barColor = PAYMENT_COLORS[row.method] || 'bg-gray-400';
                    return (
                      <div key={row.method}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold capitalize text-content-primary-light">{row.method?.replace('_', ' ')}</span>
                          <span className="text-xs text-content-secondary-light">{formatINR(row.totalPaise)} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border-light flex justify-between text-xs font-bold text-content-primary-light">
                    <span>Total Collected</span>
                    <span>{formatINR(totalPaymentPaise)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reservation Stats */}
            <div className="bg-white rounded-2xl border border-border-light p-5">
              <h2 className="text-sm font-extrabold text-content-primary-light mb-1">Reservation Statistics</h2>
              <p className="text-[10px] text-content-secondary-light mb-4">{fromDate} to {toDate}</p>
              {!reservationStats ? (
                <div className="py-6 text-center text-xs text-content-secondary-light">No data</div>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { label: 'Total Reservations', value: reservationStats.totalReservations ?? 0 },
                    { label: 'Checked In', value: reservationStats.checkedIn ?? 0 },
                    { label: 'Checked Out', value: reservationStats.checkedOut ?? 0 },
                    { label: 'Cancelled', value: reservationStats.cancelled ?? 0 },
                    { label: 'Avg. Length of Stay', value: `${(reservationStats.avgLengthOfStay ?? 0).toFixed(1)} nights` },
                    { label: 'Direct Bookings', value: reservationStats.directBookings ?? 0 },
                    { label: 'OTA Bookings', value: reservationStats.otaBookings ?? 0 },
                    { label: 'Total Revenue', value: formatINR(reservationStats.totalRevenuePaise ?? 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-xs">
                      <span className="text-content-secondary-light">{label}</span>
                      <span className="font-bold text-content-primary-light">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Outstanding & Monthly breakdown row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-content-secondary-light">Outstanding Balance</p>
              <p className="text-xl font-extrabold text-red-600 mt-1">{formatINR(monthlySummary?.totalOutstandingPaise || 0)}</p>
              <p className="text-[10px] text-content-secondary-light mt-0.5">Unpaid from last 30-day reservations</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-content-secondary-light">Total Reservations (30d)</p>
              <p className="text-xl font-extrabold text-content-primary-light mt-1">{monthlySummary?.totalReservations || 0}</p>
              <p className="text-[10px] text-content-secondary-light mt-0.5">Excluding cancelled bookings</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-border-light shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-content-secondary-light">RevPAR</p>
              <p className="text-xl font-extrabold text-amber-600 mt-1">
                {formatINR(
                  (monthlySummary?.totalRooms || 0) > 0
                    ? Math.round((monthlySummary?.totalRevenuePaise || 0) / ((monthlySummary?.totalRooms || 1) * 30))
                    : 0
                )}
              </p>
              <p className="text-[10px] text-content-secondary-light mt-0.5">Revenue per available room/day</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
