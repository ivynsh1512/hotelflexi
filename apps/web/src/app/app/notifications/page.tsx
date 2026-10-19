'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { Bell, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function NotificationsPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const data = await apiClient('/operations/notifications');
      setNotifications(data.notifications || []);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentTenant]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient(`/operations/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-3 border-b border-border-light">
        <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary-light">
          Notifications Center
        </h1>
        <p className="text-xs text-content-secondary-light">
          Operational alerts, reservation updates, and system messages
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-border-light">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-border-light space-y-3">
          <Bell className="w-10 h-10 text-content-secondary-light mx-auto" />
          <h3 className="text-base font-bold text-content-primary-light">No New Notifications</h3>
          <p className="text-xs text-content-secondary-light">
            You're all caught up! New operational events and reservation alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isRead = n.is_read === 1;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl bg-white border border-border-light shadow-sm flex items-start gap-3 transition ${
                  isRead ? 'opacity-70' : 'border-l-4 border-l-brand-blue'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-content-primary-light">{n.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-content-secondary-light font-mono">
                        {new Date(n.created_at * 1000).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {!isRead && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-[10px] text-brand-blue hover:underline font-semibold"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-content-secondary-light mt-1">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
