'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share, PlusSquare, Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useMobileInstall() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid flash
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(inStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Detect Android
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
    canPromptAndroid: !!deferredPrompt,
    triggerAndroidInstall,
  };
}

export function InstallAppDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { isIOS, isAndroid, canPromptAndroid, triggerAndroidInstall } = useMobileInstall();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
        <DialogHeader className="text-left space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
            <Smartphone className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Install Call on Demand App
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            Get fast 1-tap access to your wallet, logistics, laundry, food, and services directly from your home screen on Android & iOS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {isIOS ? (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
              <p className="text-xs font-semibold text-slate-800">
                How to install on iOS (iPhone / iPad):
              </p>
              <ol className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">1</span>
                  <span>Tap the <strong className="text-slate-900 font-bold inline-flex items-center gap-1"><Share className="h-3.5 w-3.5 text-primary" /> Share button</strong> in Safari menu bar</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">2</span>
                  <span>Scroll down and tap <strong className="text-slate-900 font-bold inline-flex items-center gap-1"><PlusSquare className="h-3.5 w-3.5 text-primary" /> Add to Home Screen</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">3</span>
                  <span>Tap <strong className="text-slate-900 font-bold">Add</strong> at top right to complete installation</span>
                </li>
              </ol>
            </div>
          ) : canPromptAndroid ? (
            <Button
              onClick={() => {
                triggerAndroidInstall();
                onOpenChange(false);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-2xl gap-2 shadow-lg shadow-primary/25"
            >
              <Download className="h-5 w-5" /> Install App Now
            </Button>
          ) : (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">How to install on Android / Web:</p>
              <p>Tap your browser&apos;s menu icon (3 dots) and select <strong className="text-slate-900 font-bold">&quot;Install App&quot;</strong> or <strong className="text-slate-900 font-bold">&quot;Add to Home screen&quot;</strong>.</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200/60 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Full offline mode, high-speed cached assets, and instant launch enabled.</span>
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
