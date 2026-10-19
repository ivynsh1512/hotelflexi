'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Users, Shield, CheckCircle2, Lock } from 'lucide-react';

export default function TeamPage() {
  const { user, currentTenant } = useAuth();

  const matrix = [
    { module: 'Room Calendar & Check-in', owner: true, manager: true, receptionist: true, accountant: false, housekeeping: false },
    { module: 'Create & Modify Reservations', owner: true, manager: true, receptionist: true, accountant: false, housekeeping: false },
    { module: 'Room Blocking & Maintenance', owner: true, manager: true, receptionist: true, accountant: false, housekeeping: false },
    { module: 'Issue GST Invoices & Receipts', owner: true, manager: true, receptionist: true, accountant: true, housekeeping: false },
    { module: 'Housekeeping Task Assignment', owner: true, manager: true, receptionist: true, accountant: false, housekeeping: true },
    { module: 'Operational Expenses Entry', owner: true, manager: true, receptionist: false, accountant: true, housekeeping: false },
    { module: 'Financial Statements & P&L', owner: true, manager: true, receptionist: false, accountant: true, housekeeping: false },
    { module: 'Channel Manager Connectivity', owner: true, manager: true, receptionist: false, accountant: false, housekeeping: false },
    { module: 'Subscription & Plan Changes', owner: true, manager: false, receptionist: false, accountant: false, housekeeping: false },
    { module: 'Platform Super-Admin Access', owner: false, manager: false, receptionist: false, accountant: false, housekeeping: false, note: 'Strictly restricted to ADMIN_EMAILS allowlist' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Staff Members & Role Permissions
        </h1>
        <p className="text-xs text-content-secondary-light">
          Enforced server-side permission matrix for hotel operations
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-sm">
            {user?.displayName?.[0] || 'O'}
          </div>
          <div>
            <div className="font-bold text-sm text-content-primary-light">{user?.displayName || 'Owner'}</div>
            <div className="text-xs text-content-secondary-light">{user?.email}</div>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-50 text-brand-blue">
          {currentTenant?.role || 'Owner'}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light font-bold text-sm text-content-primary-light flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-blue" />
          Server-Side Role Permission Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-light border-b border-border-light font-bold text-content-primary-light uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Operation / Capability</th>
                <th className="p-3.5 text-center">Owner</th>
                <th className="p-3.5 text-center">Manager</th>
                <th className="p-3.5 text-center">Receptionist</th>
                <th className="p-3.5 text-center">Accountant</th>
                <th className="p-3.5 text-center">Housekeeping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {matrix.map((row) => (
                <tr key={row.module} className="hover:bg-surface-light/40">
                  <td className="p-3.5 font-medium text-content-primary-light">
                    {row.module}
                    {row.note && <span className="block text-[10px] text-red-600 font-semibold">{row.note}</span>}
                  </td>
                  <td className="p-3.5 text-center">{row.owner ? <CheckCircle2 className="w-4 h-4 text-status-success mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="p-3.5 text-center">{row.manager ? <CheckCircle2 className="w-4 h-4 text-status-success mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="p-3.5 text-center">{row.receptionist ? <CheckCircle2 className="w-4 h-4 text-status-success mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="p-3.5 text-center">{row.accountant ? <CheckCircle2 className="w-4 h-4 text-status-success mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="p-3.5 text-center">{row.housekeeping ? <CheckCircle2 className="w-4 h-4 text-status-success mx-auto" /> : <Lock className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
