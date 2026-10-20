'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api';
import { requestPushNotificationPermission, showLocalNotification } from '@/lib/fcm';
import { testSiren } from '@/lib/sound';
import {
  Bell,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building,
  Smartphone,
  Loader2,
  Radio,
  Zap,
  Volume2,
} from 'lucide-react';

export default function AdminPushBroadcastPage() {
  const [target, setTarget] = useState<'all' | 'tenant'>('all');
  const [hotelCode, setHotelCode] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [actionUrl, setActionUrl] = useState('/app');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Testing on current device
  const [testingDevice, setTestingDevice] = useState(false);
  const [testingSiren, setTestingSiren] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  const handleTestDevice = async () => {
    setTestingDevice(true);
    try {
      const res = await requestPushNotificationPermission();
      if (res.success) {
        if (res.token) setDeviceToken(res.token);
        await showLocalNotification('HotelFlexi Push Test', {
          body: 'Firebase Cloud Messaging & Web Push integration is active! Your device is ready to receive instant alerts.',
          icon: '/icon-192.png',
          soundType: priority === 'urgent' ? 'siren' : 'chime',
        });
        alert('Push notification test sent! Check your system notification popups.');
      } else {
        alert(res.error || 'Could not enable push notifications. Check browser notification permissions.');
      }
    } catch (e: any) {
      alert(`Error testing notification: ${e.message}`);
    } finally {
      setTestingDevice(false);
    }
  };

  const handleTestSiren = async () => {
    setTestingSiren(true);
    try {
      await testSiren();
    } catch (e: any) {
      alert(`Could not play siren: ${e.message}`);
    } finally {
      setTestingSiren(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setSending(true);
    setResult(null);

    try {
      const res = await apiClient('/push/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          target,
          hotel_code: target === 'tenant' ? hotelCode : undefined,
          title,
          message,
          priority,
          action_url: actionUrl,
        }),
      });
      setResult(res);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="pb-4 border-b border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-400" />
            Firebase Cloud Messaging (FCM) Push Broadcast
          </h1>
          <p className="text-xs text-content-secondary-dark mt-1">
            Dispatch real-time Web Push alerts to staff and hotel owners. Broadcast to all or target specific properties by 5-digit code.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleTestSiren}
            disabled={testingSiren}
            className="px-4 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 font-bold text-xs transition flex items-center gap-2"
          >
            {testingSiren ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
            {testingSiren ? 'Playing Siren...' : 'Test Siren Sound'}
          </button>

          <button
            type="button"
            onClick={handleTestDevice}
            disabled={testingDevice}
            className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold text-xs transition flex items-center gap-2"
          >
            {testingDevice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
            Test Push on This Browser
          </button>
        </div>
      </div>

      {deviceToken && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>This device is successfully subscribed with FCM VAPID key!</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-500 truncate max-w-xs">
            {deviceToken.substring(0, 24)}...
          </span>
        </div>
      )}

      {result && (
        <div className="p-5 rounded-2xl bg-purple-950/60 border border-purple-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-purple-300">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            Broadcast Dispatched Successfully!
          </div>
          <div className="text-xs text-purple-200">
            Push alert delivered to registered device tokens. In-app notifications logged.
          </div>
        </div>
      )}

      {/* Broadcast Form */}
      <form onSubmit={handleBroadcast} className="bg-surface-dark-surface rounded-3xl p-6 sm:p-8 border border-border-dark shadow-xl space-y-5">
        <h2 className="text-base font-black text-white pb-3 border-b border-border-dark flex items-center gap-2">
          <Send className="w-4 h-4 text-purple-400" />
          Compose Push Broadcast
        </h2>

        {/* Target Audience */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-content-secondary-dark">Target Recipients</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTarget('all')}
              className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                target === 'all'
                  ? 'border-purple-500 bg-purple-950/40 text-white shadow-lg'
                  : 'border-border-dark bg-surface-dark-elevated text-content-secondary-dark hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-white">Broadcast to All Properties</div>
                <div className="text-[11px] text-content-secondary-dark mt-0.5">
                  Reaches all hotel owners, managers, and front desk staff across the entire platform.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTarget('tenant')}
              className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                target === 'tenant'
                  ? 'border-purple-500 bg-purple-950/40 text-white shadow-lg'
                  : 'border-border-dark bg-surface-dark-elevated text-content-secondary-dark hover:text-white'
              }`}
            >
              <Building className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-white">Specific Property (By 5-Digit Code)</div>
                <div className="text-[11px] text-content-secondary-dark mt-0.5">
                  Sends targeted push notifications strictly to staff of a single property.
                </div>
              </div>
            </button>
          </div>
        </div>

        {target === 'tenant' && (
          <div>
            <label className="block text-xs font-bold text-content-secondary-dark mb-1.5">
              Enter 5-Digit Hotel Code (e.g. 58291)
            </label>
            <input
              type="text"
              placeholder="e.g. 58291"
              value={hotelCode}
              onChange={(e) => setHotelCode(e.target.value)}
              className="w-full max-w-xs text-xs font-mono font-bold p-3 rounded-xl bg-surface-dark-elevated border border-border-dark text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
          </div>
        )}

        {/* Priority */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-content-secondary-dark">Urgency Level</label>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setPriority('normal')}
              className={`p-3 rounded-xl border text-left font-semibold transition ${
                priority === 'normal'
                  ? 'border-purple-500 bg-purple-950/30 text-purple-200'
                  : 'border-border-dark text-content-secondary-dark hover:text-white'
              }`}
            >
              <div>Standard Notification</div>
              <div className="text-[10px] text-content-secondary-dark font-normal">Silent or standard alert tone</div>
            </button>
            <button
              type="button"
              onClick={() => setPriority('urgent')}
              className={`p-3 rounded-xl border text-left font-semibold transition ${
                priority === 'urgent'
                  ? 'border-red-500 bg-red-950/40 text-red-200'
                  : 'border-border-dark text-content-secondary-dark hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Urgent Siren Trigger
              </div>
              <div className="text-[10px] text-content-secondary-dark font-normal">Vibration and loud audible tone</div>
            </button>
          </div>
        </div>

        {/* Notification Title & Body */}
        <div>
          <label className="block text-xs font-bold text-content-secondary-dark mb-1.5">
            Push Notification Title
          </label>
          <input
            type="text"
            placeholder="e.g. Critical Update: IngoMMT OTA Live Synchronization"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs font-bold p-3 rounded-xl bg-surface-dark-elevated border border-border-dark text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-content-secondary-dark mb-1.5">
            Notification Message
          </label>
          <textarea
            placeholder="Enter the push message text displayed on phone locks and desktop popups..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full text-xs font-medium p-3 rounded-xl bg-surface-dark-elevated border border-border-dark text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-content-secondary-dark mb-1.5">
            Action Click URL
          </label>
          <input
            type="text"
            placeholder="/app/calendar or /app/dining"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            className="w-full text-xs font-mono p-2.5 rounded-xl bg-surface-dark-elevated border border-border-dark text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Dispatching Push Tokens...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Send Push Notification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
