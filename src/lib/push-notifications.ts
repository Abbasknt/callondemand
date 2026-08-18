'use client';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export interface PushNotificationOptions {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/**
 * Checks if the current client is running on iOS (iPhone, iPad, iPod)
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isTouchMac = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/.test(ua) || isTouchMac;
}

/**
 * Checks if the web app is running in Standalone (installed PWA) mode
 */
export function isAppStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Checks if Web Push is available or if iOS Home Screen installation is required first
 */
export function getPushSupportInfo(): {
  supported: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  needsHomeInstall: boolean;
  permission: NotificationPermission;
} {
  if (typeof window === 'undefined') {
    return { supported: false, isIOS: false, isStandalone: false, needsHomeInstall: false, permission: 'default' };
  }

  const isIOS = isIOSDevice();
  const isStandalone = isAppStandalone();
  const hasNotificationAPI = 'Notification' in window;
  const hasServiceWorker = 'serviceWorker' in navigator;

  // On iOS, Web Push is ONLY supported when installed to the Home Screen (iOS 16.4+)
  const needsHomeInstall = isIOS && !isStandalone;
  const supported = (hasNotificationAPI && hasServiceWorker) || needsHomeInstall;
  const permission = hasNotificationAPI ? Notification.permission : 'default';

  return {
    supported,
    isIOS,
    isStandalone,
    needsHomeInstall,
    permission,
  };
}

/**
 * Requests browser Push Notification permission and registers the device.
 */
export async function requestPushNotificationPermission(userId?: string): Promise<{
  granted: boolean;
  permission: NotificationPermission;
  needsHomeInstall?: boolean;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { granted: false, permission: 'denied', error: 'Window is not defined' };
  }

  const { isIOS, isStandalone, needsHomeInstall } = getPushSupportInfo();

  if (needsHomeInstall) {
    return {
      granted: false,
      permission: 'default',
      needsHomeInstall: true,
      error: 'On iOS, please add Call on Demand to your Home Screen first to enable push notifications.',
    };
  }

  if (!('Notification' in window)) {
    return { 
      granted: false, 
      permission: 'denied', 
      error: isIOS 
        ? 'Push notifications on iOS require adding this app to your Home Screen.' 
        : 'Notifications are not supported in this browser' 
    };
  }

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';

    if (granted) {
      // Register Service Worker if not already active
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready.catch(() => 
            navigator.serviceWorker.register('/sw.js')
          );
        } catch (swErr) {
          console.warn('Service Worker registration check error:', swErr);
        }

        // Store active push state & token on user profile if logged in
        if (userId && db) {
          try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              'notificationPreferences.push': true,
              'notificationPreferences.lastUpdated': new Date().toISOString(),
              'notificationPreferences.fcmToken': `web-push-${userId}-${Date.now()}`
            });
          } catch (err) {
            console.warn('Failed to persist push preference to Firestore:', err);
          }
        }

        // Display immediate confirmation test notification
        showLocalPushNotification({
          title: 'Push Notifications Active 🔔',
          body: 'Call on Demand is ready! You will receive real-time updates for orders, transfers, and wallet activity.',
          url: '/dashboard'
        });
      }
    }

    return { granted, permission };
  } catch (err: any) {
    console.error('Error requesting push notification permission:', err);
    return { granted: false, permission: 'denied', error: err.message || 'Permission request failed' };
  }
}

/**
 * Triggers a push notification via ServiceWorker or fallback browser Notification.
 */
export async function showLocalPushNotification(options: PushNotificationOptions): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/logo.png',
          badge: '/favicon.ico',
          data: { url: options.url || '/dashboard' },
          vibrate: [100, 50, 100],
        } as any);
        return true;
      }
    }

    // Fallback if ServiceWorker is not fully ready
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.png',
      data: { url: options.url || '/dashboard' }
    });

    notification.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('Failed to display push notification:', err);
    return false;
  }
}

