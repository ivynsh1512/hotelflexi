'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Bell,
  CheckCircle2,
  Loader2,
  Volume2,
  Inbox,
  Archive,
  CheckCheck,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function NotificationsPage() {
  const { currentTenant } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = useState(false);
  const [markingAll, setMarkAll] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    } else {
      setBrowserPerm('unsupported');
    }
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const res = await Notification.requestPermission();
      setBrowserPerm(res);
      if (res === 'granted') {
        new Notification('HotelFlexi Notifications Active', {
          body: 'You will receive real-time updates for guest check-ins, reservations, and housekeeping sirens.',
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e);
    }
  };

  const sendTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('HotelFlexi Test Alert', {
        body: 'Real-time operational alerts are working properly on your device.',
        icon: '/favicon.ico',
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const data = await apiClient(`/operations/notifications?view=${activeTab}`);
      setNotifications(data.notifications || []);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, activeTab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Immediately remove from active list in UI and synchronize read status with backend
  const handleMarkRead = async (id: string) => {
    try {
      // Optimistically remove immediately from active view without requiring refresh
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      await apiClient(`/operations/notifications/${id}/read`, { method: 'PATCH' });

      // Notify layout to update bell badge
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:notification-read', { detail: { id } }));
      }
    } catch (e) {
      console.error('Failed to mark notification read:', e);
      // Re-fetch on unexpected network failure
      fetchNotifications();
    }
  };

  // Mark all active notifications as read at once
  const handleMarkAllRead = async () => {
    try {
      setMarkAll(true);
      setNotifications([]);
      await apiClient('/operations/notifications/read-all', { method: 'PATCH' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hotelflexi:notification-read'));
      }
    } catch (e) {
      console.error('Failed to mark all read:', e);
      fetchNotifications();
    } finally {
      setMarkAll(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
            Notifications Center
          </h1>
          <p className="text-xs text-content-secondary-light">
            Operational alerts, reservation updates, and system broadcasts
          </p>
        </div>

        {activeTab === 'active' && notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-light bg-surface-light text-content-primary-light font-bold text-xs hover:bg-white transition self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-brand-blue" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Official Browser Notification Permission Card */}
      <div className="p-5 rounded-2xl bg-white border border-border-light shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-content-primary-light">Device &amp; Browser Push Alerts</h2>
              {browserPerm === 'granted' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              )}
              {browserPerm === 'denied' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                  Blocked
                </span>
              )}
            </div>
            <p className="text-xs text-content-secondary-light mt-0.5">
              {browserPerm === 'granted'
                ? 'Your device is configured to receive instant native push alerts for incoming bookings and room requests.'
                : browserPerm === 'denied'
                ? 'Notifications are blocked in your browser. Click the lock icon next to your URL bar to allow notifications.'
                : 'Enable official native notifications to receive audible and visual alerts even when you are on another tab.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
          {browserPerm === 'default' && (
            <button
              onClick={requestBrowserPermission}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition"
            >
              Enable Browser Alerts
            </button>
          )}
          {browserPerm === 'granted' && (
            <button
              onClick={sendTestNotification}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-border-light bg-surface-light text-content-primary-light font-bold text-xs hover:bg-white transition flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-brand-blue" />
              {testSent ? 'Alert Dispatched!' : 'Send Test Alert'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Active vs Notification History */}
      <div className="flex items-center gap-2 border-b border-border-light pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'active'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:text-content-primary-light bg-surface-light'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Active Notifications</span>
          {activeTab === 'active' && notifications.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-black">
              {notifications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'history'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-content-secondary-light hover:text-content-primary-light bg-surface-light'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Archived History</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            {activeTab === 'active' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Archive className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-bold text-content-primary-light">
            {activeTab === 'active' ? 'No Active Notifications' : 'Archive is Empty'}
          </h3>
          <p className="text-xs text-content-secondary-light max-w-sm mx-auto">
            {activeTab === 'active'
              ? 'You are completely caught up! Read notifications have been automatically cleared from your active list.'
              : 'Past notifications will be preserved here for your historical records.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isRead = n.is_read === 1;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl bg-white border border-border-light shadow-sm flex items-start justify-between gap-3 transition-all duration-200 ${
                  isRead ? 'opacity-75 bg-slate-50/50' : 'border-l-4 border-l-brand-blue'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-brand-blue'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-content-primary-light">{n.title}</h3>
                      {n.category && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                          {n.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-content-secondary-light mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-content-secondary-light font-mono">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(n.created_at * 1000).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {!isRead && activeTab === 'active' && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Dismiss and mark as read"
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-border-light bg-surface-light text-brand-blue text-xs font-bold hover:bg-blue-50 hover:border-brand-blue transition flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
