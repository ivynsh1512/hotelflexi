'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { FileText, Shield, Loader2 } from 'lucide-react';

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await apiClient('/admin/audit-logs');
        setLogs(data.auditLogs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-dark flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Platform Administrative Audit Trail
          </h1>
          <p className="text-xs text-content-secondary-dark">
            Server-side immutable record of super-admin overrides, tenant suspensions, plan edits, and financial events
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-surface-dark-surface rounded-2xl border border-border-dark">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-surface-dark-surface rounded-2xl border border-border-dark text-xs text-content-secondary-dark">
          No administrative actions recorded yet.
        </div>
      ) : (
        <div className="bg-surface-dark-surface rounded-2xl border border-border-dark overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-dark text-[10px] uppercase font-bold text-content-secondary-dark">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Target Resource</th>
                <th className="p-3.5">Audit Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark text-content-secondary-dark">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-dark-elevated">
                  <td className="p-3.5 font-mono text-[11px] text-white">
                    {new Date(log.created_at * 1000).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-purple-400">{log.action}</td>
                  <td className="p-3.5 uppercase text-[10px] text-content-secondary-dark">{log.actor_type}</td>
                  <td className="p-3.5 font-medium text-white">{log.resource_type} ({log.resource_id?.slice(-8) || ''})</td>
                  <td className="p-3.5 font-mono text-[11px] max-w-xs truncate text-content-secondary-dark">
                    {log.new_values_json || log.old_values_json || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
