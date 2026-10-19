import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';
import { apiClient } from './api';

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
        console.warn('Firebase Messaging init failed:', e);
      }
    }
  }
  return messaging;
}

export async function requestPushNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Push notifications are not supported in this environment.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied by user.');
      return null;
    }

    const m = getFCM();
    if (!m) return null;

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(m, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      // Register token with HotelFlexi Cloudflare Worker backend
      await apiClient('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          token,
          device_info: `${navigator.userAgent} (${navigator.platform})`,
        }),
      }).catch((err) => console.warn('Failed to register FCM token with backend:', err));

      return token;
    }
  } catch (error) {
    console.error('Error obtaining FCM push token:', error);
  }

  return null;
}

export function onForegroundMessage(callback: (payload: any) => void) {
  const m = getFCM();
  if (!m) return () => {};
  return onMessage(m, (payload) => {
    callback(payload);
  });
}