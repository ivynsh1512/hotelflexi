'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { FileText, Shield, Loader2 } from 'lucide-react';

export default function AppAuditLogPage() {
  const { currentTenant } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      if (!currentTenant) return;
      try {
        const data = await apiClient('/operations/audit-logs').catch(() => ({ auditLogs: [] }));
        setLogs(data.auditLogs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [currentTenant]);

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Hotel Audit Log & Security Trail
        </h1>
        <p className="text-xs text-content-secondary-light">
          Immutable log of operational events, room blocks, rate modifications, and financial actions
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light text-xs text-content-secondary-light">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Actor Type</th>
                  <th className="p-3.5">Resource</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-light/40">
                    <td className="p-3.5 font-mono text-content-secondary-light">
                      {new Date(log.created_at * 1000).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-brand-blue font-mono">{log.action}</td>
                    <td className="p-3.5 uppercase text-[10px] font-semibold">{log.actor_type}</td>
                    <td className="p-3.5 font-medium">{log.resource_type} ({log.resource_id?.slice(-6) || ''})</td>
                    <td className="p-3.5 text-content-secondary-light font-mono text-[11px] max-w-xs truncate">
                      {log.new_values_json || log.old_values_json || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
