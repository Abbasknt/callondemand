
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { requestPushNotificationPermission, getPushSupportInfo } from '@/lib/push-notifications';
import { Bell, X, CheckCircle2, Share, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstallAppDialog } from '@/components/mobile-app-install-prompt';

/**
 * Registers the PWA Service Worker for background push and offline support,
 * and provides intelligent, platform-adaptive prompts for iOS and Android installation & push alerts.
 */
export function ServiceWorkerRegistration() {
  const { user } = useUser();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [pushInfo, setPushInfo] = useState({
    supported: false,
    isIOS: false,
    isStandalone: false,
    needsHomeInstall: false,
    permission: 'default' as NotificationPermission,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('COD ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('COD ServiceWorker registration notice:', error);
          });
      } else {
        // In development, ensure stale service worker caches do not conflict with on-demand dev chunks
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        }).catch(() => {});
      }

      const info = getPushSupportInfo();
      setPushInfo(info);

      // Check if dismissed recently
      const dismissedUntil = localStorage.getItem('cod-push-prompt-dismissed');
      const isDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

      if (!isDismissed) {
        if (info.needsHomeInstall || info.permission === 'default') {
          // Delay prompt slightly so user gets initial view first
          const timer = setTimeout(() => setShowPrompt(true), 3500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const handleAction = async () => {
    if (pushInfo.needsHomeInstall) {
      setShowInstallModal(true);
      setShowPrompt(false);
      return;
    }

    setIsActivating(true);
    const result = await requestPushNotificationPermission(user?.uid);
    setIsActivating(false);
    if (result.granted) {
      setShowPrompt(false);
    } else if (result.needsHomeInstall) {
      setShowInstallModal(true);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Dismiss for 24 hours
    try {
      localStorage.setItem('cod-push-prompt-dismissed', (Date.now() + 86400000).toString());
    } catch {}
  };

  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-md border border-primary/20 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {pushInfo.needsHomeInstall ? (
                <Smartphone className="h-5 w-5 text-primary" />
              ) : (
                <Bell className="h-5 w-5 animate-pulse text-primary" />
              )}
            </div>
            <div className="space-y-1 flex-1 pr-2">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-primary tracking-wider">
                <Sparkles className="h-3 w-3" />
                {pushInfo.needsHomeInstall ? 'iOS App & Push Alerts' : 'Push Alerts Inactive'}
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {pushInfo.needsHomeInstall
                  ? 'Add Call on Demand to your iPhone Home Screen to receive instant order, logistics & wallet alerts.'
                  : 'Enable instant notifications for real-time order updates, transfer alerts & wallet deposits.'}
              </p>
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={handleAction}
                  disabled={isActivating}
                  className="h-8 text-xs font-bold rounded-xl gap-1.5 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                >
                  {pushInfo.needsHomeInstall ? (
                    <>
                      <Share className="h-3.5 w-3.5" />
                      Install iOS Guide
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isActivating ? 'Activating...' : 'Enable Push Alerts'}
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground"
                >
                  Later
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <InstallAppDialog open={showInstallModal} onOpenChange={setShowInstallModal} />
    </>
  );
}


