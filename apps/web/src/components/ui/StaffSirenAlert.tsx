'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Volume2,
  VolumeX,
  CheckCircle,
  Bell,
  PhoneCall,
  Mic,
  Settings,
  Sparkles,
  UtensilsCrossed,
  Layers,
  ChevronDown,
} from 'lucide-react';
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

type DepartmentChannel = 'auto' | 'all' | 'kitchen' | 'housekeeping';

export function StaffSirenAlert() {
  const { currentTenant, user, isPlatformAdmin } = useAuth();
  const [activeSirens, setActiveSirens] = useState<UrgentSiren[]>([]);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hotelflexi_siren_muted') === 'true';
    }
    return false;
  });

  const [deviceChannel, setDeviceChannel] = useState<DepartmentChannel>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('hotelflexi_siren_channel') as DepartmentChannel) || 'auto';
    }
    return 'auto';
  });

  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hotelflexi_voice_alert_enabled') !== 'false';
    }
    return true;
  });

  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [showChannelMenu, setShowChannelMenu] = useState(false);

  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const lastSpokenTimeRef = useRef<number>(0);

  const userRole = (currentTenant?.role || 'owner').toLowerCase();

  // Role categorization
  const isHousekeepingRole = userRole === 'housekeeping';
  const isKitchenRole = userRole === 'cook' || userRole === 'kitchen';
  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager' || userRole === 'admin';
  const isOperatingStaff = isHousekeepingRole || isKitchenRole || userRole === 'receptionist' || userRole === 'staff';

  // Speak voice announcement aloud in Hindi / Hinglish
  const speakVoiceAlert = useCallback((siren: UrgentSiren) => {
    if (!voiceEnabled || muted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Prevent spamming speech within 5 seconds
    const now = Date.now();
    if (now - lastSpokenTimeRef.current < 5000) return;
    lastSpokenTimeRef.current = now;

    try {
      window.speechSynthesis.cancel();

      const room = siren.room_number ? `Room number ${siren.room_number}` : 'Ek kamre';
      const cat = (siren.category || '').toLowerCase();
      const desc = (siren.description || '').toLowerCase();

      let speechText = '';
      if (cat === 'self_checkin' || desc.includes('self check-in') || desc.includes('self-checkin')) {
        speechText = `${siren.guest_name || 'Guest'} ne ${room} ke liye online self check-in poora kar liya hai. Front desk team key card aur swagat taiyaar rakhein.`;
      } else if (cat === 'room_service' || cat.includes('food') || cat.includes('dining') || desc.includes('plate') || desc.includes('maggi') || desc.includes('chai') || desc.includes('khana') || desc.includes('order')) {
        let foodSummary = siren.description;
        const match = siren.description.match(/In-Stay Dining Order:\s*([^-]+)/i);
        if (match) {
          foodSummary = match[1].replace(/\[.*?\]|\(.*?\)/g, '').trim();
        }
        speechText = `${room} se ${foodSummary} ka order aaya hai. Kitchen team jaldi taiyaar kariye.`;
      } else if (cat === 'housekeeping' || desc.includes('bedsheet') || desc.includes('towel') || desc.includes('safai') || desc.includes('cleaning') || desc.includes('pillow')) {
        if (desc.includes('bedsheet')) {
          speechText = `${room} mein bedsheet change kariye. Housekeeping staff turant dhyan dein.`;
        } else if (desc.includes('towel')) {
          speechText = `${room} mein fresh towel pahunchaiye. Housekeeping team dhyan dein.`;
        } else if (desc.includes('water') || desc.includes('paani')) {
          speechText = `${room} mein drinking water pahunchaiye. Room service attend karein.`;
        } else {
          speechText = `${room} mein safai aur housekeeping request aayi hai: ${siren.description}. Housekeeping staff turant attend kariye.`;
        }
      } else {
        speechText = `${room} se emergency request aayi hai: ${siren.description}. Staff kripya attend karein.`;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
    }
  }, [voiceEnabled, muted]);

  // Determine if a siren matches the current device's routing channel
  const shouldDeviceReceiveSiren = useCallback(
    (siren: UrgentSiren): boolean => {
      const cat = (siren.category || '').toLowerCase();
      const desc = (siren.description || '').toLowerCase();
      const isFood = cat === 'room_service' || cat.includes('food') || cat.includes('dining') || desc.includes('plate') || desc.includes('maggi');
      const isHousekeeping = cat === 'housekeeping' || desc.includes('bedsheet') || desc.includes('towel') || desc.includes('cleaning') || desc.includes('safai');

      if (deviceChannel === 'kitchen') return isFood;
      if (deviceChannel === 'housekeeping') return isHousekeeping;
      if (deviceChannel === 'all') return true;

      // Auto Mode:
      if (isKitchenRole) return isFood;
      if (isHousekeepingRole) return isHousekeeping;
      // If owner/manager or receptionist: receive all requests (especially when staff is not on shift)
      return true;
    },
    [deviceChannel, isKitchenRole, isHousekeepingRole]
  );

  // Poll for active sirens
  const checkSirens = useCallback(async () => {
    if (!currentTenant?.tenant_id || !user) return;
    try {
      const data = await apiClient('/operations/complaints/active-sirens');
      const rawSirens = (data.sirens || []) as UrgentSiren[];

      // Filter by intelligent department routing
      const filteredSirens = rawSirens.filter(shouldDeviceReceiveSiren);
      setActiveSirens(filteredSirens);

      // Check for pending siren to speak aloud (both pending tasks and open complaints)
      const pending = filteredSirens.filter((s) => s.status === 'pending' || s.status === 'open');
      if (pending.length > 0) {
        const top = pending[0];
        if (!spokenIdsRef.current.has(top.id)) {
          spokenIdsRef.current.add(top.id);
          speakVoiceAlert(top);
        }

        // Browser push notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          if (!notifiedIdsRef.current.has(top.id)) {
            notifiedIdsRef.current.add(top.id);
            try {
              new Notification(`🚨 Room ${top.room_number || 'Alert'}: ${top.category?.toUpperCase() || 'REQUEST'}`, {
                body: `${top.description}`,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: `siren_${top.id}`,
                requireInteraction: true,
              } as any);
            } catch {}
          }
        }
      }
    } catch {
      // Quiet fail on network glitch
    }
  }, [currentTenant?.tenant_id, user, shouldDeviceReceiveSiren, speakVoiceAlert]);

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

    // Fast polling: 3s on operational devices, 6s on admin devices
    const interval = isOperatingStaff ? 3000 : 6000;
    const timer = setInterval(checkSirens, interval);

    return () => {
      clearInterval(timer);
      window.removeEventListener('hotelflexi:housekeeping-updated', handleImmediateUpdate);
      window.removeEventListener('hotelflexi:siren-check', handleImmediateUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleImmediateUpdate);
    };
  }, [currentTenant?.tenant_id, user, checkSirens, isOperatingStaff]);

  const pendingSirens = activeSirens.filter((s) => s.status === 'pending' || s.status === 'open');

  // Trigger siren sound when pending alerts exist (for staff OR when admin has alerts enabled)
  useEffect(() => {
    if (pendingSirens.length > 0 && !muted) {
      playSiren();
    } else {
      stopSiren();
    }
    return () => {
      stopSiren();
    };
  }, [pendingSirens.length, muted]);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotelflexi_siren_muted', String(nextMuted));
    }
    if (nextMuted) {
      stopSiren();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else if (pendingSirens.length > 0) {
      playSiren();
      speakVoiceAlert(pendingSirens[0]);
    }
  };

  const setChannel = (chan: DepartmentChannel) => {
    setDeviceChannel(chan);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotelflexi_siren_channel', chan);
    }
    setShowChannelMenu(false);
  };

  const handleAcknowledge = async (siren: UrgentSiren) => {
    try {
      setAcknowledgingId(siren.id);
      const staffName = user?.displayName || user?.email?.split('@')[0] || (isOwnerOrManager ? 'Hotel Admin' : 'Duty Staff');
      await apiClient(`/operations/complaints/${siren.id}/acknowledge`, {
        method: 'PATCH',
        body: JSON.stringify({ staffName }),
      });
      stopSiren();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
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

  const handleClose = async (siren: UrgentSiren) => {
    try {
      setClosingId(siren.id);
      await apiClient(`/operations/complaints/${siren.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes: 'Resolved by duty staff/admin.' }),
      });
      setActiveSirens((prev) => prev.filter((s) => s.id !== siren.id));
      await checkSirens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:housekeeping-updated'));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to close ticket');
    } finally {
      setClosingId(null);
    }
  };

  // Don't render on super-admin portal
  if (
    isPlatformAdmin &&
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/central-command') || window.location.pathname.startsWith('/admin'))
  ) {
    return null;
  }

  if (activeSirens.length === 0 || pendingSirens.length === 0) return null;

  const topPending = pendingSirens[0];
  const inProgressSirens = activeSirens.filter((s) => s.status === 'in_progress');

  return (
    <>
      {/* FULLSCREEN URGENT OVERLAY WITH SPOKEN VOICE & PICK CONTROLS */}
      {topPending && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-600 text-white p-6 animate-pulse">
          <div className="max-w-md w-full bg-red-700 rounded-3xl p-6 shadow-2xl border-2 border-red-400 space-y-4 text-center">
            {/* Pulsing Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center animate-bounce shadow-lg">
              <PhoneCall className="w-8 h-8 text-red-600" />
            </div>

            {/* Alert Header */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-red-200 mb-1 flex items-center justify-center gap-1">
                <span>🚨 Urgent Guest Siren</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px]">
                  {topPending.category?.replace(/_/g, ' ')}
                </span>
              </p>
              <h2 className="text-3xl font-black tracking-tight">
                Room {topPending.room_number || '—'}
              </h2>
              <p className="text-sm font-bold text-red-100 mt-1">
                &ldquo;{topPending.description}&rdquo;
              </p>
              <p className="text-[11px] text-red-200 mt-1">
                Guest: <span className="font-semibold text-white">{topPending.guest_name || 'Checked-in Guest'}</span>
              </p>
            </div>

            {/* Action Button: Pick & Accept Request */}
            <button
              onClick={() => handleAcknowledge(topPending)}
              disabled={acknowledgingId === topPending.id}
              className="w-full py-4 rounded-2xl bg-white text-red-700 font-black text-base shadow-2xl hover:bg-red-50 active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {acknowledgingId === topPending.id ? 'Accepting…' : 'Pick & Accept Request'}
            </button>

            {/* Replay Spoken Voice Button */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => speakVoiceAlert(topPending)}
                className="px-3 py-1.5 rounded-xl bg-red-800/80 hover:bg-red-800 text-red-100 font-bold text-xs flex items-center gap-1.5 transition border border-red-500/50"
              >
                <Mic className="w-3.5 h-3.5 text-red-200" />
                Speak Aloud (Hindi)
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="px-3 py-1.5 rounded-xl bg-red-800/80 hover:bg-red-800 text-red-100 font-bold text-xs flex items-center gap-1.5 transition border border-red-500/50"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
            </div>

            {/* Department Channel Switcher */}
            <div className="pt-2 border-t border-red-600/60 flex items-center justify-between text-[11px] text-red-200">
              <span className="font-semibold">Device Alert Channel:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowChannelMenu(!showChannelMenu)}
                  className="px-2.5 py-1 rounded-lg bg-black/30 text-white font-bold flex items-center gap-1 hover:bg-black/40"
                >
                  <span className="capitalize">{deviceChannel}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showChannelMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-44 bg-white text-slate-900 rounded-xl shadow-2xl p-1.5 border border-slate-200 text-left z-50">
                    <button
                      onClick={() => setChannel('auto')}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left block ${
                        deviceChannel === 'auto' ? 'bg-brand-blue text-white' : 'hover:bg-slate-100'
                      }`}
                    >
                      Auto (By Staff Role)
                    </button>
                    <button
                      onClick={() => setChannel('all')}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left block ${
                        deviceChannel === 'all' ? 'bg-brand-blue text-white' : 'hover:bg-slate-100'
                      }`}
                    >
                      All Departments (Admin)
                    </button>
                    <button
                      onClick={() => setChannel('kitchen')}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left block ${
                        deviceChannel === 'kitchen' ? 'bg-brand-blue text-white' : 'hover:bg-slate-100'
                      }`}
                    >
                      Kitchen &amp; Cook Only
                    </button>
                    <button
                      onClick={() => setChannel('housekeeping')}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left block ${
                        deviceChannel === 'housekeeping' ? 'bg-brand-blue text-white' : 'hover:bg-slate-100'
                      }`}
                    >
                      Housekeeping Only
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Queue count */}
            {pendingSirens.length > 1 && (
              <p className="text-[10px] text-red-300">
                +{pendingSirens.length - 1} more alert(s) in queue
              </p>
            )}
          </div>
        </div>
      )}

      {/* Non-blocking banner for picked / in-progress tasks */}
      {!topPending && inProgressSirens.length > 0 && (
        <div className="bg-amber-600 text-white px-4 py-2 border-b-2 border-amber-700 sticky top-0 z-50 shadow-md">
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