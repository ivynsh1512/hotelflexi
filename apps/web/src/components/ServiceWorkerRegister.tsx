'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[HotelFlexi PWA] Service worker active:', reg.scope);
          })
          .catch((err) => {
            console.warn('[HotelFlexi PWA] Service worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
