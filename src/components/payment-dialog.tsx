'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Wallet, CreditCard, Landmark, Loader2, CheckCircle2, Shield, ArrowRight, PlusCircle } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { initMonnifyTransaction } from "@/actions/monnify";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  title: string;
  description: string;
  serviceName: string;
  onWalletPayment: () => Promise<void>;
  isLoading?: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  amount,
  title,
  description,
  serviceName,
  onWalletPayment,
  isLoading = false,
}: PaymentDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'monnify'>('wallet');
  const [isInitializingMonnify, setIsInitializingMonnify] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [showTopUpInput, setShowTopUpInput] = useState(false);

  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user?.uid]);

  const { data: wallet, isLoading: isWalletLoading } = useDoc(walletRef);
  const balance = wallet?.balance ?? 0;
  const isBalanceSufficient = balance >= amount;

  const handleMonnifyDirectPayment = async () => {
    if (!user) return;
    setIsInitializingMonnify(true);

    const reference = `COD-${serviceName.slice(0, 3).toUpperCase()}-${Date.now()}`;
    const redirectUrl = `${window.location.origin}/wallet/callback?service=${encodeURIComponent(serviceName)}&amount=${amount}`;

    const result = await initMonnifyTransaction({
      amount,
      customerEmail: user.email || 'customer@call-on-demand.com',
      customerName: user.displayName || 'COD Partner',
      paymentReference: reference,
      paymentDescription: `${title}: ${reference}`,
      redirectUrl
    });

    if (result && result.success && result.response?.checkoutUrl) {
      toast({ title: "Redirecting to Monnify Gateway", description: "Authorizing secure payment session..." });
      window.location.href = result.response.checkoutUrl;
    } else {
      setIsInitializingMonnify(false);
      toast({ 
        title: "Monnify Gateway Error", 
        description: result?.error || "Unable to initialize Monnify payment.", 
        variant: "destructive" 
      });
    }
  };

  const handleMonnifyTopUp = async () => {
    const needed = amount > balance ? amount - balance : 1000;
    const finalTopUp = topUpAmount ? Number(topUpAmount) : Math.max(needed, 500);

    if (isNaN(finalTopUp) || finalTopUp < 100) {
      toast({ title: "Minimum ₦100 required", variant: "destructive" });
      return;
    }

    setIsInitializingMonnify(true);
    const reference = `COD-TOPUP-${Date.now()}`;
    const redirectUrl = `${window.location.origin}/wallet/callback?amount=${finalTopUp}`;

    const result = await initMonnifyTransaction({
      amount: finalTopUp,
      customerEmail: user?.email || 'customer@call-on-demand.com',
      customerName: user?.displayName || 'COD Partner',
      paymentReference: reference,
      paymentDescription: `Wallet Top Up: ${reference}`,
      redirectUrl
    });

    if (result && result.success && result.response?.checkoutUrl) {
      toast({ title: "Redirecting to Monnify Gateway", description: "Authorizing wallet top-up..." });
      window.location.href = result.response.checkoutUrl;
    } else {
      setIsInitializingMonnify(false);
      toast({ 
        title: "Top-Up Gateway Error", 
        description: result?.error || "Could not start Monnify wallet funding.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-6 bg-card">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5">
              Secure Checkout
            </Badge>
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-muted-foreground">
              <Shield className="h-3 w-3 text-emerald-600" /> Monnify Handshake
            </div>
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter pt-2">{title}</DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Summary Box */}
          <div className="bg-muted/40 p-4 rounded-2xl border flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Total Payable</p>
              <p className="text-2xl font-black text-primary tracking-tight">₦{amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Wallet Balance</p>
              <p className={cn("text-sm font-black", isBalanceSufficient ? "text-emerald-600" : "text-amber-600")}>
                {isWalletLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `₦${balance.toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block ml-1">
              Select Settlement Method
            </label>

            {/* Method 1: Wallet */}
            <div
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3",
                selectedMethod === 'wallet' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:bg-muted/30",
                !isBalanceSufficient && "opacity-80"
              )}
              onClick={() => setSelectedMethod('wallet')}
            >
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", selectedMethod === 'wallet' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight">COD Wallet Balance</p>
                  <p className="text-[9px] text-muted-foreground font-medium">
                    {isBalanceSufficient ? "Instant deduction from your account balance" : "Insufficient balance for this transaction"}
                  </p>
                </div>
              </div>
              {selectedMethod === 'wallet' && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
            </div>

            {/* Method 2: Monnify Direct */}
            <div
              className={cn(
                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3",
                selectedMethod === 'monnify' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:bg-muted/30"
              )}
              onClick={() => setSelectedMethod('monnify')}
            >
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", selectedMethod === 'monnify' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight">Monnify Gateway</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Card, Bank Transfer, USSD & Virtual Account</p>
                </div>
              </div>
              {selectedMethod === 'monnify' && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
            </div>
          </div>

          {/* Inline Wallet Top-Up Option if Insufficient Balance */}
          {!isBalanceSufficient && selectedMethod === 'wallet' && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-3">
              <div className="flex items-start gap-2">
                <PlusCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-700">Top Up Required</p>
                  <p className="text-[9px] text-amber-600/90 font-medium">
                    You need ₦{(amount - balance).toLocaleString()} more to pay via wallet.
                  </p>
                </div>
              </div>

              {!showTopUpInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTopUpAmount(String(Math.max(amount - balance, 500)));
                    setShowTopUpInput(true);
                  }}
                  className="w-full text-[10px] font-black uppercase h-9 rounded-xl border-amber-500/30 text-amber-700 bg-white"
                >
                  Fund Wallet via Monnify
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Top Up Amount"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="h-9 text-xs font-bold rounded-xl"
                  />
                  <Button
                    size="sm"
                    onClick={handleMonnifyTopUp}
                    disabled={isInitializingMonnify}
                    className="h-9 px-4 text-[10px] font-black uppercase bg-amber-600 text-white rounded-xl"
                  >
                    {isInitializingMonnify ? <Loader2 className="h-3 w-3 animate-spin" /> : "Top Up"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || isInitializingMonnify}
            className="w-full sm:w-auto h-12 rounded-xl text-xs font-black uppercase"
          >
            Cancel
          </Button>

          {selectedMethod === 'wallet' ? (
            <Button
              onClick={onWalletPayment}
              disabled={isLoading || !isBalanceSufficient}
              className="w-full sm:flex-1 h-12 rounded-xl text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground uppercase shadow-lg shadow-primary/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Wallet Payment"}
            </Button>
          ) : (
            <Button
              onClick={handleMonnifyDirectPayment}
              disabled={isInitializingMonnify}
              className="w-full sm:flex-1 h-12 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white uppercase shadow-lg shadow-emerald-600/20"
            >
              {isInitializingMonnify ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Proceed to Monnify <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
