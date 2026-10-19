'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient, formatINR } from '@/lib/api';
import { BarChart3, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);

  useEffect(() => {
    async function loadReports() {
      if (!currentTenant) return;
      try {
        const propData = await apiClient('/properties');
        const activeProp = propData.properties?.[0];
        if (activeProp) {
          const [mData, dData] = await Promise.all([
            apiClient(`/reports/monthly-summary?property_id=${activeProp.id}`),
            apiClient(`/reports/daily-collections?property_id=${activeProp.id}`),
          ]);
          setMonthlyData(mData);
          setDailyData(dData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [currentTenant]);

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Hotel Analytics & Revenue Reports
        </h1>
        <p className="text-xs text-content-secondary-light">
          Occupancy rates, ADR (Average Daily Rate), daily collections, and revenue performance
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm">
            <span className="text-[11px] font-bold uppercase text-content-secondary-light">ADR (Average Daily Rate)</span>
            <div className="text-2xl font-extrabold text-content-primary-light mt-1">
              {formatINR(monthlyData?.adrPaise || 0)}
            </div>
            <div className="text-[10px] text-content-secondary-light mt-0.5">Average revenue per booked room</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm">
            <span className="text-[11px] font-bold uppercase text-content-secondary-light">Occupancy Rate</span>
            <div className="text-2xl font-extrabold text-brand-blue mt-1">
              {monthlyData?.occupancyRate || 0}%
            </div>
            <div className="text-[10px] text-content-secondary-light mt-0.5">Current occupied rooms ratio</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm">
            <span className="text-[11px] font-bold uppercase text-content-secondary-light">Today's Collections</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              {formatINR(dailyData?.totalPaise || 0)}
            </div>
            <div className="text-[10px] text-content-secondary-light mt-0.5">Across all payment modes</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm">
            <span className="text-[11px] font-bold uppercase text-content-secondary-light">Total Revenue (30 Days)</span>
            <div className="text-2xl font-extrabold text-content-primary-light mt-1">
              {formatINR(monthlyData?.totalRevenuePaise || 0)}
            </div>
            <div className="text-[10px] text-content-secondary-light mt-0.5">Cumulative room stay folios</div>
          </div>
        </div>
      )}
    </div>
  );
}
