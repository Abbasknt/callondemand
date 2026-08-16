'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share, PlusSquare, Download, Smartphone, CheckCircle2, Bell, Sparkles, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { requestPushNotificationPermission, showLocalPushNotification, getPushSupportInfo } from '@/lib/push-notifications';
import { useUser } from '@/firebase';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useMobileInstall() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const info = getPushSupportInfo();
    setIsIOS(info.isIOS);
    setIsStandalone(info.isStandalone);
    setNotificationStatus(info.permission);

    // Detect Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const androidDevice = /android/.test(userAgent);
    setIsAndroid(androidDevice);

    // Capture Android PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerAndroidInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return {
    isIOS,
    isAndroid,
    isStandalone,
    notificationStatus,
    canPromptAndroid: !!deferredPrompt,
    triggerAndroidInstall,
  };
}

export function InstallAppDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { isIOS, isAndroid, isStandalone, notificationStatus, canPromptAndroid, triggerAndroidInstall } = useMobileInstall();
  const { user } = useUser();
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);

  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    const result = await requestPushNotificationPermission(user?.uid);
    setIsEnablingPush(false);
    if (result.granted) {
      setPushSuccess(true);
      await showLocalPushNotification({
        title: 'Call on Demand Push Active 🔔',
        body: 'You are now ready to receive instant order, logistics & wallet alerts.',
        url: '/dashboard',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              <Bell className="h-3 w-3" />
              <span>iOS & Android Push Ready</span>
            </div>
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            Install App & Enable Push Alerts
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Install Call on Demand to your device for instant launch, offline caching, and real-time push alerts for wallet deposits, food deliveries, and order updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {isIOS ? (
            <div className="bg-muted/40 p-4 rounded-2xl border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  iOS Web Push Installation Steps:
                </p>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent">
                  iOS 16.4+
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Apple requires Call on Demand to be added to your Home Screen before Push Notifications can be authorized.
              </p>
              <ol className="text-xs text-foreground/90 space-y-2.5 pt-1">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white mt-0.5">1</span>
                  <span>Tap the <strong className="text-foreground font-bold inline-flex items-center gap-1"><Share className="h-3.5 w-3.5 text-primary" /> Share icon</strong> at the bottom of Safari.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white mt-0.5">2</span>
                  <span>Scroll down and select <strong className="text-foreground font-bold inline-flex items-center gap-1"><PlusSquare className="h-3.5 w-3.5 text-primary" /> Add to Home Screen</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white mt-0.5">3</span>
                  <span>Open the app from your Home Screen and tap <strong className="text-primary font-bold">Enable Notifications</strong> when prompted.</span>
                </li>
              </ol>

              {isStandalone && (
                <div className="pt-2 border-t border-border">
                  <Button
                    onClick={handleEnablePush}
                    disabled={isEnablingPush || pushSuccess}
                    className="w-full bg-primary text-primary-foreground font-bold h-10 rounded-xl gap-2 shadow-md hover:bg-primary/90"
                  >
                    <Bell className="h-4 w-4" />
                    {pushSuccess ? 'Push Alerts Active ✓' : isEnablingPush ? 'Enabling Push...' : 'Authorize iOS Push Alerts Now'}
                  </Button>
                </div>
              )}
            </div>
          ) : canPromptAndroid ? (
            <div className="space-y-3">
              <Button
                onClick={() => {
                  triggerAndroidInstall();
                  onOpenChange(false);
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-2xl gap-2 shadow-lg shadow-primary/25"
              >
                <Download className="h-5 w-5" /> Install App Now
              </Button>
            </div>
          ) : (
            <div className="bg-muted/40 p-4 rounded-2xl border border-border space-y-2 text-xs text-foreground/90">
              <p className="font-bold text-foreground">How to install on Android / Desktop Web:</p>
              <p className="text-muted-foreground">Tap your browser menu (3 dots) and select <strong className="text-foreground font-bold">&quot;Install Call on Demand&quot;</strong> or <strong className="text-foreground font-bold">&quot;Add to Home screen&quot;</strong>.</p>
              
              <div className="pt-2">
                <Button
                  onClick={handleEnablePush}
                  disabled={isEnablingPush || pushSuccess}
                  className="w-full bg-primary text-primary-foreground font-bold h-10 rounded-xl gap-2"
                >
                  <Bell className="h-4 w-4" />
                  {pushSuccess ? 'Push Alerts Active ✓' : isEnablingPush ? 'Activating...' : 'Enable Instant Push Alerts'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl border border-emerald-500/20 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>End-to-end encrypted alerts with instant wallet balance update tracking.</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full rounded-xl text-xs font-semibold"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

