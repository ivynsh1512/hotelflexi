'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Volume2, X, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { requestPushNotificationPermission, showLocalNotification } from '@/lib/fcm';
import { setupAudioUnlock, testSiren } from '@/lib/sound';

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    // Only run on browser
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Set up audio unlock on first user gesture anywhere
    setupAudioUnlock();

    // Check if user has already granted or dismissed previously
    const isDismissed = sessionStorage.getItem('hotelflexi_notif_prompt_dismissed');
    if (Notification.permission === 'default' && !isDismissed) {
      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const res = await requestPushNotificationPermission();
      if (res.success) {
        setSuccessMessage(true);
        await showLocalNotification('HotelFlexi Alerts Enabled', {
          body: 'Real-time push notifications & staff sirens are now active on this device!',
          icon: '/icon-192.png',
          soundType: 'chime',
        });
        setTimeout(() => {
          setShowPrompt(false);
        }, 2200);
      } else if (res.permission === 'denied') {
        alert(
          'Notifications are blocked in your browser. To enable them, click the lock/settings icon in your browser address bar and switch Notifications to Allow.'
        );
        setShowPrompt(false);
      } else {
        setShowPrompt(false);
      }
    } catch (err: any) {
      console.warn('Notification prompt request err:', err);
      setShowPrompt(false);
    } finally {
      setRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('hotelflexi_notif_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-blue-500/30 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center shrink-0 text-blue-400">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                Enable Instant App Notifications
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Receive booking alerts, dine-out tables, and urgent staff sirens on this device.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMessage ? (
          <div className="flex items-center gap-2 py-1 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Alerts and sound active! You are all set.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleEnable}
              disabled={requesting}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {requesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Enable Notifications</span>
            </button>

            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
