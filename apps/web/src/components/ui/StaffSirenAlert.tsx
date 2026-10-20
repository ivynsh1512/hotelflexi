'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { AlertCircle, Volume2, VolumeX, CheckCircle, ArrowRight } from 'lucide-react';
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
  const { currentTenant, user } = useAuth();
  const [activeSirens, setActiveSirens] = useState<UrgentSiren[]>([]);
  const [muted, setMuted] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // Poll for active urgent complaints and urgent alerts
  const checkSirens = async () => {
    if (!currentTenant?.tenant_id || !user) return;
    try {
      const data = await apiClient('/operations/complaints/active-sirens');
      const sirens = (data.sirens || []) as UrgentSiren[];
      setActiveSirens(sirens);
    } catch {
      // Quiet fail if network glitch or permissions
    }
  };

  useEffect(() => {
    setupAudioUnlock();
    if (!currentTenant?.tenant_id) return;
    checkSirens();
    const timer = setInterval(checkSirens, 8000);
    return () => clearInterval(timer);
  }, [currentTenant?.tenant_id, user]);

  useEffect(() => {
    if (activeSirens.length > 0 && !muted) {
      playSiren();
    } else {
      stopSiren();
    }
    return () => stopSiren();
  }, [activeSirens, muted]);

  const handleAcknowledge = async (id: string) => {
    try {
      setAcknowledgingId(id);
      await apiClient(`/operations/complaints/${id}/acknowledge`, { method: 'PATCH' });
      stopSiren();
      await checkSirens();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge request');
    } finally {
      setAcknowledgingId(null);
    }
  };

  if (activeSirens.length === 0) return null;

  const currentSiren = activeSirens[0];

  return (
    <div className="bg-red-600 text-white shadow-2xl px-4 py-3 border-b-2 border-red-700 animate-pulse sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center font-extrabold shrink-0 shadow">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm uppercase tracking-wide">
                Urgent In-Stay Guest Alert: Room {currentSiren.room_number || 'Room'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase">
                {currentSiren.category.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-red-100 font-medium">
              &quot;{currentSiren.description}&quot; — Guest: {currentSiren.guest_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <button
            onClick={() => {
              if (muted) {
                setMuted(false);
                playSiren();
              } else {
                setMuted(true);
                stopSiren();
              }
            }}
            title={muted ? 'Unmute Siren Alarm' : 'Mute Siren Alarm'}
            className="p-2 rounded-lg bg-red-700/80 hover:bg-red-800 text-white transition text-xs flex items-center gap-1 font-semibold"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
            <span className="text-[11px]">{muted ? 'Unmute' : 'Mute Sound'}</span>
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
            href="/app/complaints"
            className="px-3 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white font-bold text-xs transition"
          >
            All Tickets ({activeSirens.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
