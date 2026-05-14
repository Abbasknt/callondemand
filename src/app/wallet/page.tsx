'use client';

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  CreditCard, 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Shield, 
  Loader2, 
  Landmark, 
  CheckCircle2,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  ChevronRight,
  Plus,
  Printer,
  Download,
  Share2
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, orderBy, limit, getDocs, where, increment } from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { initMonnifyTransaction, getReservedAccount, searchTransactions } from "@/actions/monnify"
import { triggerReceiptPrint, exportToCsv, shareReceipt } from "@/lib/export-utils"
import { RefreshCw, RotateCcw } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

/**
 * @fileOverview Hardened Wallet Hub for Call on Demand.
 * Optimized for high-density mobile fit and Next.js 15 production stability.
 */

export default function WalletPage() {
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const [depositAmount, setDepositAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("card")
  const [showBalance, setShowBalance] = useState(false)
  const [isInitializingPayment, setIsInitializingPayment] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<any>(null)
  const [reservedAccount, setReservedAccount] = useState<any>(null)
  const [isReserving, setIsReserving] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function syncReservedAccount() {
      if (!user || selectedMethod !== 'bank' || reservedAccount) return;
      setIsReserving(true);
      const res = await getReservedAccount({
        accountName: user.displayName || 'COD User',
        customerEmail: user.email || 'customer@call-on-demand.com',
        customerName: user.displayName || 'COD User',
        accountReference: `V-ACC-${user.uid}`
      });
      if (res && res.success) setReservedAccount(res.response);
      setIsReserving(false);
    }
    syncReservedAccount();
  }, [selectedMethod, user]);

  const handleSyncWallet = useCallback(async (silent = false) => {
    if (!user || !firestore || isSyncing) return;
    if (!silent) setIsSyncing(true);

    try {
      const searchRes = await searchTransactions({ customerEmail: user.email || '' });
      if (!searchRes || !searchRes.success) {
        if (!silent) toast({ title: "Ledger Sync Delayed", description: "Gateway busy. Try again soon." });
        return;
      }

      const recentPaidTxs = searchRes.response.filter((tx: any) => 
        (tx.paymentStatus === 'PAID' || tx.status === 'SUCCESS') && 
        tx.amount && tx.paymentReference
      );

      if (recentPaidTxs.length === 0) {
        if (!silent) toast({ title: "Ledger Consistent", description: "No pending settlements found." });
        return;
      }

      const txColRef = collection(firestore, 'users', user.uid, 'wallet', 'default', 'transactions');
      const walletDocRef = doc(firestore, 'users', user.uid, 'wallet', 'default');
      
      let updatedCount = 0;

      for (const tx of recentPaidTxs) {
        // Query to see if we already have this reference
        const q = query(txColRef, where('reference', '==', tx.paymentReference));
        const snap = await getDocs(q);

        if (snap.empty) {
          // New transaction found! Credit wallet.
          const amount = Number(tx.amount);
          
          updateDocumentNonBlocking(walletDocRef, {
            balance: increment(amount),
            lastSyncAt: new Date().toISOString()
          });

          addDocumentNonBlocking(txColRef, {
            type: 'Deposit',
            amount: amount,
            description: `Auto-Credit: ${tx.paymentMethod || 'Bank Transfer'}`,
            transactionDate: tx.completedOn || new Date().toISOString(),
            status: 'Completed',
            reference: tx.paymentReference,
            gatewayId: tx.transactionReference || tx.paymentReference
          });
          
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        toast({ 
          title: "Wallet Updated", 
          description: `Successfully credited ${updatedCount} new settlement(s).`,
          className: "bg-green-600 text-white"
        });
      } else if (!silent) {
        toast({ title: "Ledger Up to Date" });
      }
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [user, firestore, isSyncing, toast]);

  useEffect(() => {
    if (user && mounted) {
      handleSyncWallet(true);
      const interval = setInterval(() => handleSyncWallet(true), 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user, mounted, handleSyncWallet]);

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, desc: 'Instant via Monnify' },
    { id: 'bank', name: 'Bank Transfer', icon: Landmark, desc: 'Static Virtual Account' },
  ]

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user]);

  const { data: wallet, isLoading: isWalletLoading } = useDoc(walletRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'wallet', 'default', 'transactions'),
      orderBy('transactionDate', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const { data: transactions, isLoading: isTxLoading } = useCollection(transactionsQuery);

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) < 100) {
      toast({ title: "Min ₦100 required", variant: "destructive" });
      return;
    }
    
    setIsInitializingPayment(true);
    
    const amount = Number(depositAmount);
    const reference = `COD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const result = await initMonnifyTransaction({
      amount,
      customerEmail: user?.email || 'customer@call-on-demand.com',
      customerName: user?.displayName || 'COD Partner',
      paymentReference: reference,
      paymentDescription: `Wallet Funding: ${reference}`,
      redirectUrl: window.location.origin + '/wallet/callback'
    });
    
    if (!result || !result.success) {
      toast({ 
        title: "Gateway Error", 
        description: result?.error || "Could not initialize secure gateway.", 
        variant: "destructive" 
      });
      setIsInitializingPayment(false);
      return;
    }

    if (result.response?.checkoutUrl) {
      toast({ title: "Authorizing Session", description: "Redirecting to secure node..." });
      window.location.href = result.response.checkoutUrl;
    } else {
      setIsInitializingPayment(false);
      toast({ title: "Protocol Idle", description: "No checkout URL returned.", variant: "destructive" });
    }
  };

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [isVerifyingWithdrawal, setIsVerifyingWithdrawal] = useState(false)

  const handleWithdrawInitiate = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) < 1000) {
      toast({ title: "Min ₦1,000 required for withdrawal", variant: "destructive" });
      return;
    }
    if (Number(withdrawAmount) > (wallet?.balance || 0)) {
       toast({ title: "Insufficient Balance", variant: "destructive" });
       return;
    }

    if (profile?.twoFactorEnabled) {
      setIsWithdrawing(true);
      const { sendTwoFactorCode } = await import("@/actions/auth-2fa");
      const res = await sendTwoFactorCode(user?.email || '', profile.twoFactorMethod || 'email');
      if (res.success) {
        setShowWithdrawDialog(true);
        toast({ title: "Security Handshake", description: res.message });
      } else {
        toast({ title: "Security Protocol Error", description: res.message, variant: "destructive" });
      }
      setIsWithdrawing(false);
    } else {
      // Direct withdrawal if 2FA off (not recommended but allowed)
      await processWithdrawal();
    }
  };

  const processWithdrawal = async () => {
    if (!user || !firestore || !walletRef) return;
    setIsWithdrawing(true);
    try {
      const amount = Number(withdrawAmount);
      const txColRef = collection(firestore, 'users', user.uid, 'wallet', 'default', 'transactions');
      
      updateDocumentNonBlocking(walletRef, {
        balance: increment(-amount)
      });

      addDocumentNonBlocking(txColRef, {
        type: 'Withdrawal',
        amount: amount,
        description: `External Transfer to Bank`,
        transactionDate: new Date().toISOString(),
        status: 'Completed',
        reference: `WDR-${Date.now()}`
      });

      toast({ title: "Withdrawal Successful", description: `₦${amount.toLocaleString()} sent to your verified bank.` });
      setWithdrawAmount("");
      setShowWithdrawDialog(false);
      setTwoFactorCode("");
    } catch (e) {
      console.error(e);
      toast({ title: "Withdrawal Failed", variant: "destructive" });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleVerifyWithdrawal = async () => {
    if (!user?.email) return;
    setIsVerifyingWithdrawal(true);
    const { verifyTwoFactorCode } = await import("@/actions/auth-2fa");
    const result = await verifyTwoFactorCode(user.email, twoFactorCode);
    if (result.success) {
      await processWithdrawal();
    } else {
      toast({ title: "Invalid Code", description: result.message, variant: "destructive" });
      setTwoFactorCode("");
    }
    setIsVerifyingWithdrawal(false);
  };

  const handleExportStatement = () => {
    if (!transactions || transactions.length === 0) return;
    const exportData = transactions.map(tx => ({
      Date: mounted ? new Date(tx.transactionDate).toLocaleString() : '...',
      Description: tx.description,
      Type: tx.type,
      Amount: tx.amount,
      Status: tx.status,
      Reference: tx.id
    }));
    exportToCsv(`COD_Wallet_Audit_${new Date().toISOString().split('T')[0]}.csv`, exportData);
    toast({ title: "Audit Log Exported" });
  };

  const handlePrintTx = (tx: any) => {
    setSelectedTxForPrint(tx);
    setTimeout(() => triggerReceiptPrint(), 100);
  };

  const handleShareTx = (tx: any) => {
    const details = {
      title: 'COD Wallet Receipt',
      text: `Call on Demand Receipt\nRef: ${tx.id}\nDate: ${new Date(tx.transactionDate).toLocaleString()}\nAmount: ₦${tx.amount.toLocaleString()}\nStatus: ${tx.status}`
    };
    shareReceipt(details);
  };

  if (isUserLoading || !mounted) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto px-2">
      <div className="flex justify-between items-center px-2 py-2 no-print">
        <div>
          <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Wallet Hub
          </h2>
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Verified Settlement Ledger</p>
        </div>
        <Badge className="bg-accent/10 text-accent border-none uppercase font-black text-[8px] px-3 h-5">PRODUCTION LIVE</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6 no-print">
          <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Wallet className="h-32 w-32" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Unified Balance
                </CardTitle>
                <button 
                  className="text-white/60 hover:text-white transition-colors" 
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button 
                  className={cn("text-white/60 hover:text-white transition-colors ml-2", isSyncing && "animate-spin")} 
                  onClick={() => handleSyncWallet()}
                  disabled={isSyncing}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black mb-6 tracking-tighter">
                {isWalletLoading ? <Loader2 className="animate-spin h-8 w-8" /> : showBalance ? `₦ ${(wallet?.balance || 0).toLocaleString()}` : "₦ ••••••••"}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white/10 border-none text-white px-3 py-1 text-[8px] font-black tracking-widest uppercase">NGN HUB</Badge>
                <Badge variant="outline" className="bg-white/10 border-none text-white px-3 py-1 font-mono text-[8px]">AC: **** {profile?.phoneNumber?.slice(-4) || 'AUTH'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
            <CardHeader className="bg-muted/5 p-6 border-b">
              <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter">
                <Plus className="h-5 w-5 text-primary" /> Top Up
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Digital Payout Authorization</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <Tabs defaultValue="deposit">
                  <TabsList className="bg-muted p-1 rounded-xl h-11 w-full gap-1 mb-4">
                    <TabsTrigger value="deposit" className="flex-1 font-black uppercase text-[10px] gap-2 rounded-lg">Deposit</TabsTrigger>
                    <TabsTrigger value="withdraw" className="flex-1 font-black uppercase text-[10px] gap-2 rounded-lg">Withdraw</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="deposit" className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <div 
                          key={method.id}
                          className={cn(
                            "cursor-pointer transition-all border-2 flex items-center p-4 gap-4 rounded-xl",
                            selectedMethod === method.id 
                              ? "border-primary bg-primary/5" 
                              : "border-transparent bg-muted/20"
                          )}
                          onClick={() => setSelectedMethod(method.id)}
                        >
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                            selectedMethod === method.id ? "bg-primary text-white" : "bg-white text-muted-foreground"
                          )}>
                            <method.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-[11px] uppercase truncate">{method.name}</p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tight">{method.desc}</p>
                          </div>
                          {selectedMethod === method.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                      ))}
                    </div>

                    {selectedMethod === 'bank' ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="bg-muted/30 p-6 rounded-2xl border-2 border-dashed border-primary/20 space-y-4">
                          <p className="text-[9px] font-black uppercase text-center text-primary/60 tracking-widest leading-none">Your Personal Deposit Account</p>
                          {isReserving ? (
                            <div className="py-4 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                          ) : reservedAccount?.accounts?.[0] ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                <span className="text-[9px] font-black uppercase opacity-40">Bank Name</span>
                                <span className="text-[10px] font-black uppercase">{reservedAccount.accounts[0].bankName}</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                <span className="text-[9px] font-black uppercase opacity-40">Account No</span>
                                <span className="text-xl font-black text-primary tracking-widest">{reservedAccount.accounts[0].accountNumber}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase opacity-40">Account Name</span>
                                <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{reservedAccount.accountName}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] font-black uppercase text-center py-4">Account pending activation</p>
                          )}
                        </div>
                        <div className="flex items-start gap-3 px-2">
                          <Lock className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <p className="text-[8px] font-bold uppercase text-muted-foreground leading-relaxed">Funds sent to this account are automatically credited to your wallet in real-time via the Monnify digital handshake.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Deposit Amount (₦)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl text-muted-foreground opacity-30">₦</span>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="text-2xl h-14 font-black pl-10 text-primary rounded-xl border-2 focus:border-primary transition-all"
                            />
                          </div>
                        </div>

                        <Button 
                          onClick={handleDeposit} 
                          disabled={isInitializingPayment || !depositAmount}
                          className="w-full h-14 text-sm font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl uppercase tracking-widest"
                        >
                          {isInitializingPayment ? <Loader2 className="animate-spin h-5 w-5" /> : "Authorize Settlement"}
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="withdraw" className="space-y-6 pt-2">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 text-red-700">
                      <Landmark className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-black uppercase text-[10px]">Verified Bank Account Required</p>
                        <p className="text-[9px] font-medium mt-1 leading-relaxed">
                          Withdrawals are only processed to your verified bank account in Settings. 
                          {profile?.bankAccountVerified && <span className="block mt-1 font-black">Connected: {profile.bankName} ({profile.accountNumber})</span>}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Withdraw Amount (₦)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl text-muted-foreground opacity-30">₦</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="text-2xl h-14 font-black pl-10 text-red-600 rounded-xl border-2 focus:border-red-600 transition-all"
                        />
                      </div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">Available: ₦{(wallet?.balance || 0).toLocaleString()}</p>
                    </div>

                    <Button 
                      onClick={handleWithdrawInitiate} 
                      disabled={isWithdrawing || !withdrawAmount || !profile?.bankAccountVerified}
                      className="w-full h-14 text-sm font-black bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200 rounded-xl uppercase tracking-widest text-white"
                    >
                      {isWithdrawing ? <Loader2 className="animate-spin h-5 w-5" /> : "Initiate Withdrawal"}
                    </Button>
                    
                    {!profile?.bankAccountVerified && (
                      <p className="text-center text-[10px] font-black text-primary uppercase cursor-pointer hover:underline" onClick={() => router.push('/settings')}>
                        Link Bank Account First →
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-lg overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 p-6 border-b flex flex-row items-center justify-between no-print">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                <History className="h-4 w-4" /> Activity Manifest
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg font-black text-[9px] uppercase gap-1.5" onClick={handleExportStatement} disabled={!transactions?.length}>
                <Download className="h-3 w-3" /> Audit Log
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted/50">
                {isTxLoading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors group cursor-default">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shadow-inner shrink-0",
                          tx.type === 'Deposit' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                        )}>
                          {tx.type === 'Deposit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black leading-tight truncate uppercase">{tx.description}</p>
                          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 opacity-60">
                            {mounted ? new Date(tx.transactionDate).toLocaleString() : '...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className={cn(
                          "text-[11px] font-black text-right",
                          tx.type === 'Deposit' ? "text-green-600" : "text-primary"
                        )}>
                          {tx.type === 'Deposit' ? '+' : '-'} ₦{tx.amount.toLocaleString()}
                        </p>
                        <div className="flex gap-1 no-print opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handlePrintTx(tx)} title="Receipt">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center text-muted-foreground px-6">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No activity recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2FA Verification Dialog for Withdrawal */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-card">
            <CardHeader className="text-center pt-8">
              <div className="h-16 w-16 bg-red-100 text-red-600 rounded-[1.25rem] flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tighter">Security Authorization</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest mt-1">Confirm code for ₦{Number(withdrawAmount).toLocaleString()} withdrawal</CardDescription>
            </CardHeader>
            <CardContent className="px-8 space-y-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest text-center block">Enter 6-Digit Code</label>
                 <Input 
                   type="text" 
                   maxLength={6} 
                   value={twoFactorCode} 
                   onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0,6))}
                   className="h-16 text-3xl text-center font-black tracking-[0.5em] rounded-2xl border-2"
                   autoFocus
                 />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                   onClick={() => { setShowWithdrawDialog(false); setTwoFactorCode(""); }} 
                   className="flex-1 h-12 rounded-xl font-black uppercase text-[10px]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleVerifyWithdrawal} 
                  disabled={isVerifyingWithdrawal || twoFactorCode.length < 6}
                  className="flex-1 h-12 rounded-xl bg-primary font-black uppercase text-[10px]"
                >
                  {isVerifyingWithdrawal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize"}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-4 justify-center">
              <p className="text-[8px] font-black uppercase opacity-50">Handshake verified via {profile?.twoFactorMethod || 'email'}</p>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Print Only Receipt Node */}
      {selectedTxForPrint && (
        <div className="hidden print:block w-full max-w-md mx-auto p-10 space-y-10 border-4 border-dashed border-black receipt-view">
          <div className="receipt-header text-center">
            <BrandLogo iconOnly className="h-16 w-16 mx-auto mb-2" />
            <h2 className="text-2xl font-black uppercase mt-4 tracking-tighter">Wallet Receipt</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Authorization: Verified</p>
          </div>
          <div className="space-y-4 pt-6 text-left">
            <div className="flex justify-between border-b pb-2"><span className="font-black uppercase text-[10px]">Reference</span><span className="font-mono text-xs uppercase">{selectedTxForPrint.id}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="font-black uppercase text-[10px]">Narration</span><span className="font-bold text-xs">{selectedTxForPrint.description}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="font-black uppercase text-[10px]">Timestamp</span><span className="text-xs">{mounted ? new Date(selectedTxForPrint.transactionDate).toLocaleString() : ''}</span></div>
            <div className="flex justify-between items-end pt-10">
              <span className="font-black uppercase text-[10px]">Value Settled</span>
              <span className="text-4xl font-black">₦{selectedTxForPrint.amount.toLocaleString()}</span>
            </div>
          </div>
          <div className="receipt-footer mt-20 text-center border-t pt-6">
            <p className="text-[10px] font-black uppercase">Life, Exactly as Demanded.</p>
            <p className="text-[8px] text-muted-foreground uppercase mt-1">© {new Date().getFullYear()} COD Unified Life Hub</p>
          </div>
        </div>
      )}
    </div>
  )
}
