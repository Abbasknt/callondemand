'use client';

import { useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, X, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * @fileOverview Global automated Wallet Balance Monitoring Guard.
 * Monitors the current user's balance and triggers alerts if it falls below their set threshold.
 */
export function WalletBalanceGuard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [hasToasted, setHasToasted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(profileRef);

  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user]);

  const { data: wallet } = useDoc(walletRef);

  const thresholdEnabled = !!profile?.walletThresholdEnabled;
  const threshold = profile?.walletThreshold !== undefined ? Number(profile.walletThreshold) : 1000;
  const balance = wallet?.balance !== undefined ? Number(wallet.balance) : null;

  const isLowBalance = thresholdEnabled && balance !== null && balance < threshold;

  useEffect(() => {
    if (isLowBalance) {
      if (!hasToasted) {
        toast({
          title: "Wallet Balance Low",
          description: `Your balance is ₦${balance.toLocaleString()}, which is below your set threshold of ₦${threshold.toLocaleString()}.`,
          variant: "destructive",
        });
        setHasToasted(true);
      }
    } else {
      setHasToasted(false);
      setDismissed(false);
    }
  }, [isLowBalance, balance, threshold, toast, hasToasted]);

  if (!isLowBalance || dismissed) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 left-6 md:left-auto md:w-96 bg-red-600 text-white px-5 py-4 rounded-[1.5rem] shadow-2xl border border-red-500 flex flex-col gap-3 z-[101] animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-white">
          <AlertTriangle className="h-5 w-5 animate-pulse" />
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="font-black text-sm uppercase tracking-wide">Wallet Limit Warning</p>
          <p className="text-[11px] opacity-90 leading-relaxed font-semibold">
            Your balance of <span className="font-black text-white underline">₦{balance?.toLocaleString()}</span> is below your low-balance alert limit of ₦{threshold.toLocaleString()}.
          </p>
        </div>
        <button 
          onClick={() => setDismissed(true)} 
          className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          title="Dismiss Alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 pt-2.5">
        <Link href="/wallet" className="flex-1">
          <Button variant="secondary" size="sm" className="w-full h-9 rounded-lg font-black uppercase text-[10px] tracking-wider text-red-600 hover:bg-white bg-white">
            <Wallet className="h-3.5 w-3.5 mr-1.5" /> Fund Wallet
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg font-bold text-[10px] text-white hover:bg-white/10">
            Adjust Limit
          </Button>
        </Link>
      </div>
    </div>
  );
}
