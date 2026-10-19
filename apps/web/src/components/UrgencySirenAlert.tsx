'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  X,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

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

export function UrgencySirenAlert({ propertyId, onRefreshNeeded }: UrgencySirenProps) {
  const [urgentTickets, setUrgentTickets] = useState<UrgentTicket[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [quickReportModalOpen, setQuickReportModalOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportingRoom, setReportingRoom] = useState('');
  const [reportingCategory, setReportingCategory] = useState('dirty_bedsheet');
  const [reportingNotes, setReportingNotes] = useState('');

  // Web Audio Context & Oscillator Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll or fetch active urgent tasks/complaints
  const fetchActiveUrgentTickets = useCallback(async () => {
    if (!propertyId) return;
    try {
      const [hData, cData] = await Promise.all([
        apiClient(`/operations/housekeeping?property_id=${propertyId}`).catch(() => ({ tasks: [] })),
        apiClient(`/operations/complaints?property_id=${propertyId}`).catch(() => ({ complaints: [] })),
      ]);

      const urgentList: UrgentTicket[] = [];

      // 1. Housekeeping urgent tasks
      for (const t of hData.tasks || []) {
        if (
          (t.priority === 'urgent' || t.task_type === 'urgent_sanitization') &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
        ) {
          urgentList.push({
            id: t.id,
            source: 'housekeeping',
            roomNumber: t.room_number || 'Room',
            category: t.task_type || 'Cleaning',
            title: t.notes || 'Urgent Room Cleaning Required',
            status: t.status === 'in_progress' ? 'in_progress' : 'pending',
            pickedByName: t.assigned_to_name,
            createdAt: t.created_at || Math.floor(Date.now() / 1000),
          });
        }
      }

      // 2. Urgent guest complaints (bedsheet, washroom, plumbing)
      for (const c of cData.complaints || []) {
        const descLower = (c.description || '').toLowerCase();
        const isUrgentGrievance =
          c.category === 'room_cleanliness' ||
          c.category === 'maintenance' ||
          descLower.includes('bedsheet') ||
          descLower.includes('washroom') ||
          descLower.includes('leak') ||
          descLower.includes('urgent');

        if (c.status !== 'resolved' && isUrgentGrievance) {
          urgentList.push({
            id: c.id,
            source: 'complaint',
            roomNumber: c.room_number ? `Room ${c.room_number}` : 'Room',
            category: c.category || 'Service Grievance',
            title: c.description || 'Guest urgent complaint',
            status: c.status === 'in_investigation' ? 'in_progress' : 'pending',
            pickedByName: c.assigned_staff_name,
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
    const timer = setInterval(fetchActiveUrgentTickets, 10000); // Poll every 10 seconds
    return () => clearInterval(timer);
  }, [fetchActiveUrgentTickets]);

  // Audio Siren Management (Web Audio API)
  const stopSirenSound = useCallback(() => {
    try {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (e) {
      console.warn('Error stopping siren audio:', e);
    }
    setIsSirenPlaying(false);
  }, []);

  const startSirenSound = useCallback(() => {
    if (isMuted || !soundEnabled || isSirenPlaying) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime); // Safe volume

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
      setIsSirenPlaying(true);

      // Pitch sweep simulation (750Hz <-> 1200Hz every 400ms)
      let high = false;
      intervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || !oscRef.current) return;
        high = !high;
        const targetFreq = high ? 1200 : 750;
        oscRef.current.frequency.exponentialRampToValueAtTime(
          targetFreq,
          audioCtxRef.current.currentTime + 0.35
        );
      }, 400);
    } catch (e) {
      console.warn('AudioContext autoplay policy prevented audio playback until user click:', e);
    }
  }, [isMuted, soundEnabled, isSirenPlaying]);

  // Trigger or stop siren based on pending unpicked tickets
  const pendingUrgentTickets = urgentTickets.filter((t) => t.status === 'pending');

  useEffect(() => {
    if (pendingUrgentTickets.length > 0 && !isMuted) {
      startSirenSound();
    } else {
      stopSirenSound();
    }
    return () => {
      stopSirenSound();
    };
  }, [pendingUrgentTickets.length, isMuted, startSirenSound, stopSirenSound]);

  // Handle Pick / Acknowledge Request (silences siren)
  const handlePickRequest = async (ticket: UrgentTicket) => {
    stopSirenSound();
    setIsMuted(true);
    try {
      if (ticket.source === 'housekeeping') {
        await apiClient(`/operations/housekeeping/${ticket.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        });
      } else {
        await apiClient(`/operations/complaints/${ticket.id}/acknowledge`, {
          method: 'PATCH',
        });
      }
      await fetchActiveUrgentTickets();
      if (onRefreshNeeded) onRefreshNeeded();
      alert(`Request for ${ticket.roomNumber} picked! Siren stopped.`);
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge request.');
    }
  };

  // Handle Resolve / Close Ticket
  const handleResolveTicket = async (ticket: UrgentTicket) => {
    const notes = prompt('Enter resolution notes:', 'Issue rectified to guest satisfaction.');
    if (!notes) return;
    try {
      if (ticket.source === 'housekeeping') {
        await apiClient(`/operations/housekeeping/${ticket.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' }),
        });
      } else {
        await apiClient(`/operations/complaints/${ticket.id}/resolve`, {
          method: 'PATCH',
          body: JSON.stringify({ resolutionNotes: notes }),
        });
      }
      await fetchActiveUrgentTickets();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve ticket.');
    }
  };

  // Dispatch Quick Urgent Issue
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

      // Create complaint / housekeeping urgent task
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
      setIsMuted(false);
      await fetchActiveUrgentTickets();
      if (onRefreshNeeded) onRefreshNeeded();
      alert(`🚨 Urgent siren dispatched for Room ${reportingRoom}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch ticket');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Active Siren Banner if any pending ticket */}
      {pendingUrgentTickets.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 shadow-xl border border-red-400 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white text-red-700 text-[10px] font-black uppercase tracking-wider">
                    🚨 URGENCY SIREN ACTIVE
                  </span>
                  <span className="text-xs font-semibold text-red-100">
                    {pendingUrgentTickets.length} Request(s) Sounding Alarm
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg mt-1 tracking-tight">
                  {pendingUrgentTickets[0].roomNumber}: {pendingUrgentTickets[0].title}
                </h3>
                <p className="text-xs text-red-100 mt-0.5">
                  Siren sounding across staff devices. Tap <strong>Pick Request</strong> to silence and take ownership.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                onClick={() => {
                  if (isMuted) {
                    setIsMuted(false);
                    startSirenSound();
                  } else {
                    setIsMuted(true);
                    stopSirenSound();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition border border-white/20"
                title={isMuted ? 'Unmute Siren Alarm' : 'Mute Siren Alarm'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
                {isMuted ? 'Muted' : 'Sound ON'}
              </button>

              <button
                onClick={() => handlePickRequest(pendingUrgentTickets[0])}
                className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <UserCheck className="w-4 h-4" />
                Pick Request (Silence)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Bar with Siren Status & Quick Dispatch Button */}
      <div className="p-3 bg-white rounded-2xl border border-border-light shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              pendingUrgentTickets.length > 0
                ? 'bg-red-100 text-red-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {pendingUrgentTickets.length > 0 ? (
              <Bell className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-primary-light">
                Housekeeping &amp; Guest Urgency Siren System
              </span>
              <span
                className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                  pendingUrgentTickets.length > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {pendingUrgentTickets.length > 0 ? 'Siren Active' : 'Standby'}
              </span>
            </div>
            <p className="text-[11px] text-content-secondary-light">
              Automatic siren sound across all staff devices for direct bedsheets, washroom leaks, and urgent room issues.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setQuickReportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Dispatch Urgent Siren Ticket
          </button>
        </div>
      </div>

      {/* In-Progress Urgent Tickets Card */}
      {urgentTickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="p-3.5 bg-surface-light border-b border-border-light font-bold text-xs text-content-primary-light flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Active Urgent Housekeeping &amp; Grievance Tickets ({urgentTickets.length})
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
                        ? 'bg-red-100 text-red-700 animate-pulse'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {t.roomNumber.replace('Room', '').trim()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-content-primary-light">{t.roomNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                        {t.category.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'pending'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {t.status === 'pending' ? 'Sounding Alarm' : 'In Progress (Siren Silenced)'}
                      </span>
                    </div>
                    <p className="text-xs text-content-primary-light mt-0.5 font-medium">{t.title}</p>
                    {t.pickedByName && (
                      <span className="text-[11px] text-content-secondary-light">
                        Picked by: <strong className="text-content-primary-light">{t.pickedByName}</strong>
                      </span>
                    )}
                  </div>
                </div>

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
                      Close &amp; Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK REPORT MODAL */}
      {quickReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-border-light shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-content-primary-light">
                    Dispatch Urgent Housekeeping Siren
                  </h3>
                  <span className="text-[10px] text-content-secondary-light">
                    Sounds alarm siren on all staff mobile &amp; desktop panels
                  </span>
                </div>
              </div>
              <button
                onClick={() => setQuickReportModalOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-light flex items-center justify-center text-content-secondary-light"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchUrgent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-content-primary-light mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 204"
                  value={reportingRoom}
                  onChange={(e) => setReportingRoom(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-bold"
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
                  Specific Details / Guest Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stained linen, guest requested immediate change"
                  value={reportingNotes}
                  onChange={(e) => setReportingNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border-light bg-surface-light font-medium"
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
                  Sound Urgent Siren Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
