'use client';

import { useEffect, useRef } from 'react';
import { setupAudioUnlock } from '@/lib/sound';
import { requestPushNotificationPermission, showLocalNotification } from '@/lib/fcm';

/**
 * NotificationPermissionPrompt
 * - Uses the official browser/OS notification permission dialog (no custom popup)
 * - Triggers after the user's first interaction (click/tap/keydown) on the page
 * - Also sets up Web Audio API unlock for the siren
 * - For staff devices, requests permission promptly so sirens can deliver notifications
 */
export function NotificationPermissionPrompt() {
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // 1. Pre-unlock Web Audio API context on first user gesture
    setupAudioUnlock();

    // 2. Only request if permission state is 'default' (not already decided)
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
          // Confirmation notification only if we just got granted permission
          await showLocalNotification('HotelFlexi Alerts Enabled ✓', {
            body: 'You will now receive real-time booking, siren, and housekeeping alerts on this device.',
            icon: '/icon-192.png',
            soundType: 'chime',
          });
        }
      } catch (err) {
        // Silent — permission dialog errors should never surface to user as a crash
        console.warn('Native notification request error:', err);
      }
    };

    // Wait 1.5s after mount then attach to the next user interaction
    // This satisfies browser requirements: permission must be requested in response to a user gesture
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

  // Strictly returns null — NO custom popup or HTML modal is rendered
  return null;
}
