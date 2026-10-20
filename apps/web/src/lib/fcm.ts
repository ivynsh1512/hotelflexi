import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';
import { apiClient } from './api';
import { playNotificationChime, playSiren, setupAudioUnlock } from './sound';

export const FCM_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  'BNkmJ26zt6jpufYPVahFbdsz_Z0YHzA-U9K1zHMkOic3H2ospNM4in2ceE7lwOKxm8OVluHYsNuG_MxyJwT1Y8M';

let messaging: Messaging | null = null;

export function getFCM(): Messaging | null {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    if (!messaging) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn('Firebase Messaging init skipped or not supported:', e);
      }
    }
  }
  return messaging;
}

export interface PushPermissionResult {
  success: boolean;
  permission: NotificationPermission;
  token?: string;
  error?: string;
}

export async function requestPushNotificationPermission(): Promise<PushPermissionResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      success: false,
      permission: 'denied',
      error: 'Push notifications are not supported by this browser.',
    };
  }

  // Auto unlock Web Audio for sirens during this user interaction
  setupAudioUnlock();

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error:
          permission === 'denied'
            ? 'Notifications are blocked. Please click the site settings/lock icon in your browser address bar to allow notifications.'
            : 'Notification permission was dismissed.',
      };
    }

    // Permission is granted! Ensure Service Worker is registered
    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        registration = await navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      }
    }

    let token: string | null = null;

    // Try FCM Token first
    const m = getFCM();
    if (m && registration) {
      try {
        token = await getToken(m, {
          vapidKey: FCM_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
      } catch (fcmErr: any) {
        console.warn('FCM token generation warning (falling back to native web push):', fcmErr?.message || fcmErr);
      }
    }

    // Fallback: If FCM token couldn't be generated, generate a stable client device ID
    if (!token) {
      let storedDeviceId = localStorage.getItem('hotelflexi_device_push_id');
      if (!storedDeviceId) {
        storedDeviceId = `web_device_${crypto.randomUUID()}`;
        localStorage.setItem('hotelflexi_device_push_id', storedDeviceId);
      }
      token = storedDeviceId;
    }

    // Register token with HotelFlexi Cloudflare Worker backend
    if (token) {
      await apiClient('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          token,
          device_info: `${navigator.userAgent} (${navigator.platform})`,
        }),
      }).catch((err) => console.warn('Push registration sync note:', err));
    }

    return {
      success: true,
      permission: 'granted',
      token,
    };
  } catch (error: any) {
    console.error('Error in requestPushNotificationPermission:', error);
    return {
      success: false,
      permission: Notification.permission || 'denied',
      error: error?.message || 'Failed to request notification permission.',
    };
  }
}

// Display an immediate notification (with sound & vibration)
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions & { soundType?: 'chime' | 'siren' | 'none' }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const soundType = options?.soundType || 'chime';
  if (soundType === 'siren') {
    playSiren();
  } else if (soundType === 'chime') {
    playNotificationChime();
  }

  const defaultOptions: any = {
    icon: '/icon-192.png',
    badge: '/favicon.png',
    vibrate: soundType === 'siren' ? [400, 200, 400, 200, 600] : [150],
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, defaultOptions);
      return true;
    } else {
      new Notification(title, defaultOptions);
      return true;
    }
  } catch {
    try {
      new Notification(title, defaultOptions);
      return true;
    } catch (e) {
      console.warn('Local notification dispatch failed:', e);
      return false;
    }
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  const m = getFCM();
  if (!m) return () => {};
  return onMessage(m, (payload) => {
    callback(payload);
  });
}
