
'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA Service Worker for background push and offline support.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('COD ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('COD ServiceWorker registration failed:', error);
        });
    }
  }, []);

  return null;
}
