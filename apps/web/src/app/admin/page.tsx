'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, formatINR } from '@/lib/api';
import {
  Users,
  Hotel,
  BedDouble,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await apiClient('/admin/overview');
        setData(res);
      } catch (e) {
        console.error('Failed to load admin overview:', e);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-dark flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Platform Administration Dashboard
          </h1>
          <p className="text-xs text-content-secondary-dark">
            Real-time multi-tenant telemetry and platform financial metrics from Cloudflare D1
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-dark-surface border border-border-dark">
          <div className="flex items-center justify-between text-xs text-content-secondary-dark">
            <span>Total Registered Tenants</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{m.totalTenants || 0}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            {m.activeTenants || 0} Active • {m.trialTenants || 0} Trial
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-dark-surface border border-border-dark">
          <div className="flex items-center justify-between text-xs text-content-secondary-dark">
            <span>Monthly Recurring Revenue (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {formatINR(m.mrrPaise || 0)}
          </div>
          <div className="text-[11px] text-content-secondary-dark mt-0.5">
            ARR: {formatINR(m.arrPaise || 0)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-dark-surface border border-border-dark">
          <div className="flex items-center justify-between text-xs text-content-secondary-dark">
            <span>Total Properties</span>
            <Hotel className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{m.totalProperties || 0}</div>
          <div className="text-[11px] text-content-secondary-dark mt-0.5">
            Across Indian destinations
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-dark-surface border border-border-dark">
          <div className="flex items-center justify-between text-xs text-content-secondary-dark">
            <span>Total Managed Rooms</span>
            <BedDouble className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{m.totalRooms || 0}</div>
          <div className="text-[11px] text-content-secondary-dark mt-0.5">
            Under active SaaS distribution
          </div>
        </div>
      </div>

      {/* Recent Admin Audit Logs */}
      <div className="p-6 rounded-2xl bg-surface-dark-surface border border-border-dark space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Recent Administrative Audit Events</span>
          <Link href="/admin/audit-log" className="text-xs text-purple-400 hover:underline">
            View full log →
          </Link>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-dark text-[10px] uppercase font-bold text-content-secondary-dark">
              <tr>
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Actor</th>
                <th className="pb-2">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark text-content-secondary-dark">
              {data?.recentLogs?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-xs">
                    No recent platform administrative actions recorded.
                  </td>
                </tr>
              ) : (
                data?.recentLogs?.map((l: any) => (
                  <tr key={l.id} className="hover:bg-surface-dark-elevated">
                    <td className="py-2.5 font-mono text-[11px]">{new Date(l.created_at * 1000).toLocaleString()}</td>
                    <td className="py-2.5 font-bold text-white font-mono">{l.action}</td>
                    <td className="py-2.5 uppercase text-[10px]">{l.actor_type}</td>
                    <td className="py-2.5">{l.resource_type} ({l.resource_id?.slice(-6) || ''})</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
