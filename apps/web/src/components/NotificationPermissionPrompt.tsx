'use client';

import { useEffect, useRef } from 'react';
import { setupAudioUnlock } from '@/lib/sound';
import { requestPushNotificationPermission, showLocalNotification } from '@/lib/fcm';

/**
 * Clean Official Browser Notification Handler
 * Uses standard browser-native Notification.requestPermission() without custom HTML popups.
 * Triggers upon meaningful user interaction following strict browser autoplay/permission requirements.
 */
export function NotificationPermissionPrompt() {
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // 1. Pre-unlock Web Audio API context on first user gesture
    setupAudioUnlock();

    // 2. Only request if state is 'default' (not already granted or denied)
    if (Notification.permission !== 'default') return;

    const requestOfficialBrowserPermission = async () => {
      if (hasRequestedRef.current) return;
      hasRequestedRef.current = true;

      // Clean up gesture listeners
      window.removeEventListener('click', requestOfficialBrowserPermission);
      window.removeEventListener('keydown', requestOfficialBrowserPermission);
      window.removeEventListener('touchstart', requestOfficialBrowserPermission);

      try {
        // Trigger the official OS / browser native permission dialog
        const res = await requestPushNotificationPermission();
        if (res.success && res.permission === 'granted') {
          await showLocalNotification('HotelFlexi Alerts Enabled', {
            body: 'Real-time booking alerts and staff notifications are active on this device!',
            icon: '/icon-192.png',
            soundType: 'chime',
          });
        }
      } catch (err) {
        console.warn('Native notification request error:', err);
      }
    };

    // Listen for next user interaction to trigger native browser prompt
    const interactionTimer = setTimeout(() => {
      window.addEventListener('click', requestOfficialBrowserPermission, { once: true, passive: true });
      window.addEventListener('keydown', requestOfficialBrowserPermission, { once: true, passive: true });
      window.addEventListener('touchstart', requestOfficialBrowserPermission, { once: true, passive: true });
    }, 1500);

    return () => {
      clearTimeout(interactionTimer);
      window.removeEventListener('click', requestOfficialBrowserPermission);
      window.removeEventListener('keydown', requestOfficialBrowserPermission);
      window.removeEventListener('touchstart', requestOfficialBrowserPermission);
    };
  }, []);

  // Strictly returns null so NO custom popup or modal is rendered
  return null;
}
