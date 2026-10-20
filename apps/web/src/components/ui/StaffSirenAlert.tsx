'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Volume2, VolumeX, CheckCircle, Bell, PhoneCall } from 'lucide-react';
import { playSiren, stopSiren, setupAudioUnlock } from '@/lib/sound';
import Link from 'next/link';

interface UrgentSiren {
  id: string;
  guest_name: string;
  room_number: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  created_at: number;
}

/**
 * StaffSirenAlert — shown ONLY to staff roles (housekeeping, receptionist, manager, staff).
 * Owners / admins see a calm informational banner instead (handled in UrgencySirenAlert).
 *
 * Behaviour:
 * - Fills the screen with a red overlay when an urgent alert is pending
 * - Loops siren audio + hardware vibration until the staff picks the task
 * - Once picked (status transitions to in_progress), siren stops on ALL devices
 * - Staff sees ONLY "Pick & Accept" (not Close). Close appears only after picking.
 */
export function StaffSirenAlert() {
  const { currentTenant, user, isPlatformAdmin } = useAuth();
  const [activeSirens, setActiveSirens] = useState<UrgentSiren[]>([]);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hotelflexi_siren_muted') === 'true';
    }
    return false;
  });
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const userRole = (currentTenant?.role || 'owner').toLowerCase();

  // Only staff roles get the fullscreen siren overlay
  const isOperatingStaff =
    userRole === 'housekeeping' ||
    userRole === 'receptionist' ||
    userRole === 'manager' ||
    userRole === 'staff';

  // Poll for active urgent sirens
  const checkSirens = useCallback(async () => {
    if (!currentTenant?.tenant_id || !user) return;
    try {
      const data = await apiClient('/operations/complaints/active-sirens');
      const sirens = (data.sirens || []) as UrgentSiren[];
      setActiveSirens(sirens);

      // Browser push notification for new sirens
      if (sirens.length > 0 && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          for (const s of sirens) {
            if (!notifiedIdsRef.current.has(s.id)) {
              notifiedIdsRef.current.add(s.id);
              try {
                new Notification(`🚨 Urgent Alert: Room ${s.room_number || 'Duty'}`, {
                  body: `${s.category?.toUpperCase() || 'REQUEST'}: ${s.description}`,
                  icon: '/icon-192.png',
                  badge: '/icon-192.png',
                  tag: `siren_${s.id}`,
                  requireInteraction: true,
                } as any);
              } catch {}
            }
          }
        }
      }
    } catch {
      // Quiet fail on network glitch
    }
  }, [currentTenant?.tenant_id, user]);

  // Setup listeners and polling
  useEffect(() => {
    setupAudioUnlock();
    if (!currentTenant?.tenant_id || !user) return;

    checkSirens();

    const handleImmediateUpdate = () => checkSirens();
    window.addEventListener('hotelflexi:housekeeping-updated', handleImmediateUpdate);
    window.addEventListener('hotelflexi:siren-check', handleImmediateUpdate);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkSirens();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleImmediateUpdate);

    // Fast polling: 3 seconds for staff, 8 seconds for owners (passive monitoring)
    const interval = isOperatingStaff ? 3000 : 8000;
    const timer = setInterval(checkSirens, interval);

    return () => {
      clearInterval(timer);
      window.removeEventListener('hotelflexi:housekeeping-updated', handleImmediateUpdate);
      window.removeEventListener('hotelflexi:siren-check', handleImmediateUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleImmediateUpdate);
    };
  }, [currentTenant?.tenant_id, user, checkSirens, isOperatingStaff]);

  // Siren audio + continuous vibration whenever there are PENDING sirens on staff devices
  const pendingSirens = activeSirens.filter((s) => s.status === 'pending');

  useEffect(() => {
    if (!isOperatingStaff) return; // no audio/vibration on admin/owner

    if (pendingSirens.length > 0 && !muted) {
      playSiren();
    } else {
      stopSiren();
    }
    return () => {
      stopSiren();
    };
  }, [pendingSirens.length, muted, isOperatingStaff]);

  // Mute toggle
  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotelflexi_siren_muted', String(nextMuted));
    }
    if (nextMuted) {
      stopSiren();
    } else if (pendingSirens.length > 0) {
      playSiren();
    }
  };

  // Pick / Accept — only staff can call this, stops siren on all devices
  const handleAcknowledge = async (siren: UrgentSiren) => {
    try {
      setAcknowledgingId(siren.id);
      const staffName = user?.displayName || user?.email?.split('@')[0] || 'Staff Member';
      await apiClient(`/operations/complaints/${siren.id}/acknowledge`, {
        method: 'PATCH',
        body: JSON.stringify({ staffName }),
      });
      stopSiren();
      setActiveSirens((prev) => prev.filter((s) => s.id !== siren.id));
      await checkSirens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept the request');
    } finally {
      setAcknowledgingId(null);
    }
  };

  // Close / Mark Done — only visible after staff has picked (status = in_progress)
  const handleClose = async (siren: UrgentSiren) => {
    try {
      setClosingId(siren.id);
      await apiClient(`/operations/complaints/${siren.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes: 'Resolved by staff on duty.' }),
      });
      setActiveSirens((prev) => prev.filter((s) => s.id !== siren.id));
      await checkSirens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to close the ticket');
    } finally {
      setClosingId(null);
    }
  };

  // Nothing to show
  if (activeSirens.length === 0) return null;

  // Don't render on super-admin portal
  if (
    isPlatformAdmin &&
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/central-command') || window.location.pathname.startsWith('/admin'))
  ) {
    return null;
  }

  // ── OWNER / ADMIN VIEW ──────────────────────────────────────────────────────
  // Owners see a calm informational strip — NO buttons, NO siren, just "X staff picked it" info
  if (!isOperatingStaff) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          <span className="text-amber-800 font-semibold truncate">
            <span className="font-extrabold">Housekeeping Siren Active</span> — {pendingSirens.length} pending
            {activeSirens.find(s => s.status === 'in_progress') && (
              <span className="ml-2 text-emerald-700">
                · Picked by staff
              </span>
            )}
          </span>
        </div>
        <Link href="/app/housekeeping" className="text-amber-700 font-bold shrink-0 hover:underline">
          View All →
        </Link>
      </div>
    );
  }

  // ── STAFF VIEW ─────────────────────────────────────────────────────────────
  // Pending: fullscreen urgent overlay with Pick button + siren + vibration
  const topPending = pendingSirens[0];
  const inProgressSirens = activeSirens.filter(s => s.status === 'in_progress');

  return (
    <>
      {/* Fullscreen overlay for pending urgent alert — stays until picked */}
      {topPending && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-600 text-white p-6 animate-pulse">
          <div className="max-w-sm w-full bg-red-700 rounded-3xl p-6 shadow-2xl border-2 border-red-400 space-y-5 text-center">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-white flex items-center justify-center animate-bounce">
              <PhoneCall className="w-10 h-10 text-red-600" />
            </div>

            {/* Title */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-red-200 mb-1">
                🚨 Urgent Room Alert
              </p>
              <h2 className="text-2xl font-black tracking-tight">
                Room {topPending.room_number || '—'}
              </h2>
              <p className="text-sm font-bold text-red-100 mt-1 capitalize">
                {topPending.category?.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-red-200 mt-1 leading-relaxed">
                {topPending.description}
              </p>
            </div>

            {/* Pick button — ONLY action until picked */}
            <button
              onClick={() => handleAcknowledge(topPending)}
              disabled={acknowledgingId === topPending.id}
              className="w-full py-4 rounded-2xl bg-white text-red-700 font-black text-base shadow-2xl hover:bg-red-50 active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {acknowledgingId === topPending.id ? 'Accepting…' : 'Pick & Accept Request'}
            </button>

            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="text-xs text-red-200 font-semibold flex items-center justify-center gap-1.5 mx-auto hover:text-white transition"
            >
              {muted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {muted ? 'Unmute Siren' : 'Mute Siren Sound'}
            </button>

            {/* Queue indicator */}
            {pendingSirens.length > 1 && (
              <p className="text-[11px] text-red-300">
                +{pendingSirens.length - 1} more urgent alert(s) in queue
              </p>
            )}
          </div>
        </div>
      )}

      {/* Non-blocking banner for in-progress sirens the staff has already picked */}
      {!topPending && inProgressSirens.length > 0 && (
        <div className="bg-amber-600 text-white px-4 py-2 border-b-2 border-amber-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            {inProgressSirens.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white text-amber-700 flex items-center justify-center font-black text-xs shrink-0">
                    {s.room_number}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold">
                      Room {s.room_number} — {s.category?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-amber-100 truncate">{s.description}</p>
                  </div>
                </div>
                {/* Close only shows after picking */}
                <button
                  onClick={() => handleClose(s)}
                  disabled={closingId === s.id}
                  className="px-3 py-1.5 rounded-lg bg-white text-amber-700 font-black text-[11px] hover:bg-amber-50 active:scale-95 transition disabled:opacity-60 shrink-0"
                >
                  {closingId === s.id ? 'Closing…' : '✓ Mark Done'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
