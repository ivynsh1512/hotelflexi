'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Volume2, VolumeX, CheckCircle, Bell, X } from 'lucide-react';
import { playSiren, stopSiren, setupAudioUnlock, testSiren } from '@/lib/sound';
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

export function StaffSirenAlert() {
  const { currentTenant, user, isPlatformAdmin } = useAuth();
  const [activeSirens, setActiveSirens] = useState<UrgentSiren[]>([]);
  
  // Preserve user's configured mute preference across app restarts
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hotelflexi_siren_muted') === 'true';
    }
    return false;
  });

  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const userRole = (currentTenant?.role || 'owner').toLowerCase();
  const isOperatingStaff =
    userRole === 'housekeeping' ||
    userRole === 'receptionist' ||
    userRole === 'manager' ||
    userRole === 'staff';

  // Poll and check active urgent complaints, urgent housekeeping, and emergency alerts
  const checkSirens = useCallback(async () => {
    if (!currentTenant?.tenant_id || !user) return;
    try {
      const data = await apiClient('/operations/complaints/active-sirens');
      const sirens = (data.sirens || []) as UrgentSiren[];
      setActiveSirens(sirens);

      // Trigger native browser notification for newly arrived alerts
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
                });
              } catch {}
            }
          }
        }
      }
    } catch {
      // Quiet fail if network glitch or permissions
    }
  }, [currentTenant?.tenant_id, user]);

  // Initial mount & event listeners for instantaneous synchronization
  useEffect(() => {
    setupAudioUnlock();
    if (!currentTenant?.tenant_id || !user) return;

    // Check immediately on mount
    checkSirens();

    // 1. Listen for immediate local and cross-component housekeeping/room status events
    const handleImmediateUpdate = () => {
      checkSirens();
    };

    window.addEventListener('hotelflexi:housekeeping-updated', handleImmediateUpdate);
    window.addEventListener('hotelflexi:siren-check', handleImmediateUpdate);

    // 2. Handle foreground/background transitions (resume immediately upon returning)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSirens();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleImmediateUpdate);

    // 3. Periodic fallback polling every 4 seconds for remote device alerts
    const timer = setInterval(checkSirens, 4000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('hotelflexi:housekeeping-updated', handleImmediateUpdate);
      window.removeEventListener('hotelflexi:siren-check', handleImmediateUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleImmediateUpdate);
    };
  }, [currentTenant?.tenant_id, user, checkSirens]);

  // Siren audio synchronization with state & configured settings
  useEffect(() => {
    // Only activate audible siren if there are active urgent tickets AND siren is not configured as muted
    if (activeSirens.length > 0 && !muted) {
      playSiren();
    } else {
      stopSiren();
    }
    return () => {
      stopSiren();
    };
  }, [activeSirens.length, muted]);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotelflexi_siren_muted', String(nextMuted));
    }
    if (nextMuted) {
      stopSiren();
    } else if (activeSirens.length > 0) {
      playSiren();
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      setAcknowledgingId(id);
      const staffName = user?.displayName || user?.email?.split('@')[0] || 'Staff Member';
      await apiClient(`/operations/complaints/${id}/acknowledge`, {
        method: 'PATCH',
        body: JSON.stringify({ staffName }),
      });
      stopSiren();
      // Remove locally immediately for zero-latency response
      setActiveSirens((prev) => prev.filter((s) => s.id !== id));
      await checkSirens();
      // Broadcast event so other components update their views
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge request');
    } finally {
      setAcknowledgingId(null);
    }
  };

  // Do not render anything if no active urgent alerts
  if (activeSirens.length === 0) return null;

  // Never render in Super Admin portal (it has its own broadcast monitor)
  if (isPlatformAdmin && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return null;
  }

  const currentSiren = activeSirens[0];
  const isHkCurrent =
    (currentSiren.category || '').toLowerCase().includes('housekeeping') ||
    (currentSiren.description || '').toLowerCase().includes('housekeeping') ||
    (currentSiren.description || '').toLowerCase().includes('bedsheet') ||
    (currentSiren.description || '').toLowerCase().includes('dirty');

  return (
    <div className="bg-red-600 text-white shadow-2xl px-4 py-3 border-b-2 border-red-700 animate-pulse sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center font-extrabold shrink-0 shadow animate-bounce">
            {isHkCurrent ? '🧹' : '🚨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm uppercase tracking-wide">
                {isHkCurrent ? 'Urgent Housekeeping Dispatch: Room ' : 'Guest Emergency Alert: Room '}
                {currentSiren.room_number || 'Room'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase">
                {currentSiren.category.replace('_', ' ')}
              </span>
              {isOperatingStaff && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-900 uppercase">
                  Staff Device Active
                </span>
              )}
            </div>
            <p className="text-xs text-red-100 font-medium">
              &quot;{currentSiren.description}&quot; — {currentSiren.guest_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <button
            onClick={toggleMute}
            title={muted ? 'Unmute Siren Alarm' : 'Mute Siren Alarm'}
            className="p-2 rounded-lg bg-red-700/80 hover:bg-red-800 text-white transition text-xs flex items-center gap-1 font-semibold"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
            <span className="text-[11px]">{muted ? 'Unmute' : 'Mute Siren'}</span>
          </button>

          <button
            onClick={() => handleAcknowledge(currentSiren.id)}
            disabled={acknowledgingId === currentSiren.id}
            className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{acknowledgingId === currentSiren.id ? 'Picking...' : 'Pick & Silence Siren'}</span>
          </button>

          <Link
            href={isHkCurrent ? '/app/housekeeping' : '/app/complaints'}
            className="px-3 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white font-bold text-xs transition"
          >
            All Tickets ({activeSirens.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
