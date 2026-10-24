'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  X,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export interface UrgentTicket {
  id: string;
  source: 'housekeeping' | 'complaint';
  roomNumber: string;
  category: string;
  title: string;
  status: 'pending' | 'in_progress' | 'resolved';
  pickedByName?: string;
  createdAt: number;
}

interface UrgencySirenProps {
  propertyId: string;
  onRefreshNeeded?: () => void;
}

/**
 * UrgencySirenAlert — displayed on admin/owner Housekeeping & Complaints pages.
 * Shows a read-only dispatch status panel.
 * Staff actions (Pick / Close) are handled in StaffSirenAlert (shown to staff only).
 * Test buttons have been removed for production.
 */
export function UrgencySirenAlert({ propertyId, onRefreshNeeded }: UrgencySirenProps) {
  const { currentTenant, user } = useAuth();
  const userRole = (currentTenant?.role || 'owner').toLowerCase();
  const isOperatingStaff =
    userRole === 'housekeeping' ||
    userRole === 'receptionist' ||
    userRole === 'manager' ||
    userRole === 'staff';

  const [urgentTickets, setUrgentTickets] = useState<UrgentTicket[]>([]);
  const [quickReportModalOpen, setQuickReportModalOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportingRoom, setReportingRoom] = useState('');
  const [reportingCategory, setReportingCategory] = useState('dirty_bedsheet');
  const [reportingNotes, setReportingNotes] = useState('');

  // Fetch active urgent tickets (housekeeping + complaints)
  const fetchActiveUrgentTickets = useCallback(async () => {
    if (!propertyId) return;
    try {
      const [hData, cData] = await Promise.all([
        apiClient(`/operations/housekeeping?property_id=${propertyId}`).catch(() => ({ tasks: [] })),
        apiClient(`/operations/complaints?property_id=${propertyId}`).catch(() => ({ complaints: [] })),
      ]);

      const urgentList: UrgentTicket[] = [];

      for (const t of hData.tasks || []) {
        if (
          (t.priority === 'urgent' || t.task_type === 'urgent_sanitization') &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
        ) {
          urgentList.push({
            id: t.id,
            source: 'housekeeping',
            roomNumber: t.room_number ? `Room ${t.room_number}` : 'Room',
            category: t.task_type || 'Cleaning',
            title: t.notes || 'Urgent Room Cleaning Required',
            status: t.status === 'in_progress' ? 'in_progress' : 'pending',
            pickedByName:
              t.assigned_to_name ||
              (t.notes?.includes('Taken by ')
                ? t.notes.split('Taken by ')[1]?.replace(')', '')
                : undefined),
            createdAt: t.created_at || Math.floor(Date.now() / 1000),
          });
        }
      }

      for (const c of cData.complaints || []) {
        const descLower = (c.description || '').toLowerCase();
        const isUrgent =
          c.priority === 'urgent' || descLower.includes('[urgent siren dispatch]');

        if (c.status !== 'resolved' && isUrgent) {
          const pickedName =
            c.resolution_notes?.startsWith('Taken by ')
              ? c.resolution_notes.replace('Taken by ', '')
              : c.resolved_by_name || c.resolved_by_email || c.assigned_staff_name;

          urgentList.push({
            id: c.id,
            source: 'complaint',
            roomNumber: c.room_number ? `Room ${c.room_number}` : 'Room',
            category: c.category || 'Service Grievance',
            title: c.description || 'Guest urgent complaint',
            status: c.status === 'investigating' ? 'in_progress' : 'pending',
            pickedByName: pickedName,
            createdAt: c.created_at || Math.floor(Date.now() / 1000),
          });
        }
      }

      setUrgentTickets(urgentList);
    } catch (e) {
      console.warn('Error fetching urgent tickets:', e);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchActiveUrgentTickets();
    const timer = setInterval(fetchActiveUrgentTickets, 8000);
    return () => clearInterval(timer);
  }, [fetchActiveUrgentTickets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && quickReportModalOpen) {
        setQuickReportModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickReportModalOpen]);

  // Staff-only: Pick a pending request
  const handlePickRequest = async (ticket: UrgentTicket) => {
    try {
      const staffName = user?.displayName || user?.email?.split('@')[0] || 'Staff Member';
      if (ticket.source === 'housekeeping') {
        await apiClient(`/operations/housekeeping/${ticket.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        });
      } else {
        await apiClient(`/operations/complaints/${ticket.id}/acknowledge`, {
          method: 'PATCH',
          body: JSON.stringify({ staffName }),
        });
      }
      await fetchActiveUrgentTickets();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      alert(err.message || 'Failed to pick request.');
    }
  };

  // Staff-only: Close / Mark Done (only after picking)
  const handleResolveTicket = async (ticket: UrgentTicket) => {
    try {
      if (ticket.source === 'housekeeping') {
        await apiClient(`/operations/housekeeping/${ticket.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' }),
        });
      } else {
        await apiClient(`/operations/complaints/${ticket.id}/resolve`, {
          method: 'PATCH',
          body: JSON.stringify({ resolutionNotes: 'Issue rectified to guest satisfaction.' }),
        });
      }
      await fetchActiveUrgentTickets();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      alert(err.message || 'Failed to close ticket.');
    }
  };

  // Dispatch new urgent housekeeping siren (all roles can raise an issue)
  const handleDispatchUrgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingRoom) {
      alert('Please specify the room number.');
      return;
    }
    setReporting(true);
    try {
      let title = reportingNotes;
      if (!title) {
        if (reportingCategory === 'dirty_bedsheet') title = 'Dirty / Stained bedsheet replacement';
        else if (reportingCategory === 'washroom') title = 'Washroom flush / plumbing leakage';
        else if (reportingCategory === 'ac_failure') title = 'AC not cooling / electrical issue';
        else title = 'Urgent room sanitation';
      }

      await apiClient('/operations/complaints', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          guestName: 'Guest (Urgent Request)',
          roomNumber: reportingRoom,
          category: 'room_cleanliness',
          description: `[URGENT SIREN DISPATCH] ${title}`,
        }),
      });

      setQuickReportModalOpen(false);
      setReportingRoom('');
      setReportingNotes('');
      await fetchActiveUrgentTickets();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch ticket');
    } finally {
      setReporting(false);
    }
  };

  const pendingUrgentTickets = urgentTickets.filter((t) => t.status === 'pending');

  if (urgentTickets.length === 0 && !isOperatingStaff) return null;

  return (
    <div className="space-y-3">
      {/* ── STATUS BANNER (visible to all roles) ── */}
      {pendingUrgentTickets.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 shadow-lg border border-indigo-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center text-amber-300 shrink-0 border border-indigo-400/30">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider">
                    📡 STAFF DISPATCH ACTIVE
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Priority dispatch active on staff devices ({pendingUrgentTickets.length} pending)
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg mt-1 tracking-tight text-white">
                  {pendingUrgentTickets[0].roomNumber}: {pendingUrgentTickets[0].title}
                </h3>
                {isOperatingStaff ? (
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tap <strong>Pick Request</strong> below to take ownership and resolve the request.
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 mt-0.5">
                    Request dispatched to floor staff. Awaiting staff pickup.
                  </p>
                )}
              </div>
            </div>

            {/* Staff-only: Quick pick from banner */}
            {isOperatingStaff && (
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={() => handlePickRequest(pendingUrgentTickets[0])}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <UserCheck className="w-4 h-4" />
                  Pick Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DISPATCH CONTROL BAR ── */}
      <div className="p-3 bg-white rounded-2xl border border-border-light shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              pendingUrgentTickets.length > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {pendingUrgentTickets.length > 0 ? (
              <Bell className="w-4 h-4 animate-spin text-amber-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-primary-light">
                Housekeeping & Staff Urgency Dispatch
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  pendingUrgentTickets.length > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {pendingUrgentTickets.length > 0 ? 'Staff Alert Active' : 'All Clear'}
              </span>
            </div>
            <p className="text-[11px] text-content-secondary-light">
              Emergency alarm rings on all staff mobile devices for urgent room issues.
            </p>
          </div>
        </div>

        {/* Raise urgent siren (all roles) */}
        <button
          onClick={() => setQuickReportModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-center"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Raise Urgent Siren
        </button>
      </div>

      {/* ── ACTIVE TICKET LIST ── */}
      {urgentTickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="p-3.5 bg-surface-light border-b border-border-light font-bold text-xs text-content-primary-light flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Active Urgent Housekeeping & Grievance Tickets ({urgentTickets.length})
            </span>
          </div>
          <div className="divide-y divide-border-light text-xs">
            {urgentTickets.map((t) => (
              <div
                key={t.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      t.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {t.roomNumber.replace('Room', '').trim()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-content-primary-light">{t.roomNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                        {t.category.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {t.status === 'pending'
                          ? 'Sounding on Staff Phones'
                          : `Picked by ${t.pickedByName || 'Staff'} — In Progress`}
                      </span>
                    </div>
                    <p className="text-xs text-content-primary-light mt-0.5 font-medium">{t.title}</p>
                    {t.pickedByName && (
                      <span className="text-[11px] text-content-secondary-light">
                        Assigned: <strong className="text-content-primary-light">{t.pickedByName}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* ── ACTION BUTTONS ──
                    Staff: pending → Pick only. in_progress → Close only.
                    Admin/Owner: read-only, no buttons shown.
                */}
                {isOperatingStaff && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {t.status === 'pending' ? (
                      <button
                        onClick={() => handlePickRequest(t)}
                        className="px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Pick Request
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResolveTicket(t)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark as Closed
                      </button>
                    )}
                  </div>
                )}

                {/* Admin/Owner: show who picked it */}
                {!isOperatingStaff && t.status === 'in_progress' && t.pickedByName && (
                  <span className="text-[11px] text-emerald-700 font-semibold self-end sm:self-center flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Taken by {t.pickedByName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QUICK RAISE URGENT SIREN MODAL ── */}
      {quickReportModalOpen && (
        <div
          onClick={() => setQuickReportModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-raise-siren-title"
            className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="quick-raise-siren-title" className="font-extrabold text-sm text-content-primary-light">
                    Raise Urgent Housekeeping Siren
                  </h3>
                  <span className="text-[10px] text-content-secondary-light">
                    Sounds alarm on all staff mobile devices instantly
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickReportModalOpen(false)}
                aria-label="Close dialog"
                className="w-7 h-7 rounded-full bg-surface-light flex items-center justify-center text-content-secondary-light hover:text-content-primary-light transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchUrgent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 204"
                  value={reportingRoom}
                  onChange={(e) => setReportingRoom(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Urgent Issue Type
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'dirty_bedsheet', label: 'Dirty Bedsheet / Fresh Linen' },
                    { id: 'washroom', label: 'Washroom / Plumbing Leak' },
                    { id: 'ac_failure', label: 'AC / Power Breakdown' },
                    { id: 'sanitization', label: 'Spill / Urgent Sanitization' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setReportingCategory(cat.id)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-left transition ${
                        reportingCategory === cat.id
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-border-light text-content-secondary-light hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Additional Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stained linen, guest requested immediate change"
                  value={reportingNotes}
                  onChange={(e) => setReportingNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {reporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Dispatch Urgent Request Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
