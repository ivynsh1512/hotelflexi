// HotelFlexi Firebase Cloud Messaging Background Service Worker
// Automatically handles background Web Push & Firebase messages

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyCeUG4AhkqO0aDwq4l88eo2JVobzfSdUL0',
  authDomain: 'hotelflexi.firebaseapp.com',
  projectId: 'hotelflexi',
  storageBucket: 'hotelflexi.firebasestorage.app',
  messagingSenderId: '184564812597',
  appId: '1:184564812597:web:af9864147d4f8411d69a7c',
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || payload.data?.title || 'HotelFlexi Alert';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'New operational update received.',
      icon: payload.notification?.icon || '/icon-192.png',
      badge: '/favicon.png',
      data: payload.data || { url: '/app' },
      vibrate: [300, 150, 300, 150, 600],
      tag: 'hotelflexi-fcm-alert',
      renotify: true,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[FCM SW] Background messaging init:', e);
}

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/app';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
