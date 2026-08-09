'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, ArrowDownLeft, ArrowUpRight, Search, Download, 
  Printer, ShieldCheck, RefreshCw, Wallet, CreditCard, Loader2, Plus, 
  Filter, CheckCircle2, AlertCircle, ExternalLink
} from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { queryMonnifyTransactionStatus, initMonnifyTransaction } from "@/actions/monnify";
import { exportToCsv, triggerReceiptPrint } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function TransactionsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Deposit' | 'Payment' | 'Withdrawal'>('ALL');
  const [verifyingRef, setVerifyingRef] = useState<string | null>(null);
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<any>(null);
  
  // Top-Up modal state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isInitializingTopUp, setIsInitializingTopUp] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user?.uid]);

  const { data: wallet } = useDoc(walletRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'wallet', 'default', 'transactions'),
      orderBy('transactionDate', 'desc'),
      limit(100)
    );
  }, [firestore, user?.uid]);

  const { data: transactions, isLoading: isTxLoading } = useCollection(transactionsQuery);

  // Filtered transactions
  const filteredTransactions = (transactions || []).filter((tx) => {
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (tx.description && tx.description.toLowerCase().includes(searchLower)) ||
      (tx.reference && tx.reference.toLowerCase().includes(searchLower)) ||
      (tx.id && tx.id.toLowerCase().includes(searchLower)) ||
      (tx.amount && String(tx.amount).includes(searchLower));
    return matchesType && matchesSearch;
  });

  // Calculate summary metrics
  const totalDeposits = (transactions || [])
    .filter(t => t.type === 'Deposit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalOutflow = (transactions || [])
    .filter(t => t.type === 'Payment' || t.type === 'Withdrawal')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleVerifyMonnifyStatus = async (tx: any) => {
    const ref = tx.reference || tx.gatewayId || tx.id;
    if (!ref) {
      toast({ title: "Reference Missing", description: "No gateway reference associated with this record.", variant: "destructive" });
      return;
    }

    setVerifyingRef(tx.id);
    const res = await queryMonnifyTransactionStatus({ paymentReference: ref, transactionReference: ref });
    setVerifyingRef(null);

    if (res && res.success && res.response) {
      const resp = res.response;
      toast({
        title: "Monnify Settlement Verified",
        description: `Status: ${resp.paymentStatus || 'PAID'} • Method: ${resp.paymentMethod || 'Monnify'} • Amount: ₦${Number(resp.amountPaid || resp.amount || tx.amount).toLocaleString()}`,
      });
    } else {
      toast({
        title: "Monnify Lookup Complete",
        description: res?.error || "Transaction recorded locally.",
      });
    }
  };

  const handleExportCSV = () => {
    if (!filteredTransactions.length) return;
    const exportData = filteredTransactions.map(tx => ({
      ID: tx.id,
      Type: tx.type,
      Description: tx.description,
      Amount: tx.amount,
      Status: tx.status || 'Completed',
      Reference: tx.reference || 'N/A',
      Date: new Date(tx.transactionDate).toLocaleString()
    }));
    exportToCsv(`Monnify_Transactions_${new Date().toISOString().split('T')[0]}.csv`, exportData);
    toast({ title: "Audit Log Exported", description: "CSV file generated successfully." });
  };

  const handlePrintReceipt = (tx: any) => {
    setSelectedTxForPrint(tx);
    setTimeout(() => triggerReceiptPrint(), 100);
  };

  const handleTopUpSubmit = async () => {
    const amountNum = Number(topUpAmount);
    if (isNaN(amountNum) || amountNum < 100) {
      toast({ title: "Minimum ₦100 required", variant: "destructive" });
      return;
    }

    setIsInitializingTopUp(true);
    const reference = `COD-TOPUP-${Date.now()}`;
    const redirectUrl = `${window.location.origin}/wallet/callback?amount=${amountNum}`;

    const result = await initMonnifyTransaction({
      amount: amountNum,
      customerEmail: user?.email || 'customer@call-on-demand.com',
      customerName: user?.displayName || 'COD Partner',
      paymentReference: reference,
      paymentDescription: `Wallet Funding: ${reference}`,
      redirectUrl
    });

    if (result && result.success && result.response?.checkoutUrl) {
      toast({ title: "Authorizing Session", description: "Redirecting to Monnify gateway..." });
      window.location.href = result.response.checkoutUrl;
    } else {
      setIsInitializingTopUp(false);
      toast({
        title: "Top-Up Gateway Error",
        description: result?.error || "Could not start Monnify wallet funding.",
        variant: "destructive"
      });
    }
  };

  if (isUserLoading || !mounted) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 no-print">
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <History className="h-7 w-7 text-primary" /> Transactions & Monnify Ledger
          </h1>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">
            Real-Time Payment Settlement & Audit Logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none uppercase font-black text-[9px] px-3 h-6">
            <ShieldCheck className="h-3 w-3 mr-1" /> Monnify Handshake Live
          </Badge>
          <Button
            onClick={() => setShowTopUpModal(true)}
            className="h-9 text-xs font-black bg-primary hover:bg-primary/90 rounded-xl uppercase tracking-widest gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Top Up via Monnify
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <Card className="rounded-3xl border-none shadow-md bg-card p-5">
          <div className="flex justify-between items-center text-muted-foreground mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest">Available Balance</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-primary tracking-tight">₦{(wallet?.balance || 0).toLocaleString()}</p>
        </Card>

        <Card className="rounded-3xl border-none shadow-md bg-card p-5">
          <div className="flex justify-between items-center text-muted-foreground mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest">Total Inflow (Deposits)</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">₦{totalDeposits.toLocaleString()}</p>
        </Card>

        <Card className="rounded-3xl border-none shadow-md bg-card p-5">
          <div className="flex justify-between items-center text-muted-foreground mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest">Total Outflow (Services)</span>
            <ArrowUpRight className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 tracking-tight">₦{totalOutflow.toLocaleString()}</p>
        </Card>
      </div>

      {/* Controls: Search, Filter, Export */}
      <Card className="rounded-[2.5rem] border-none shadow-lg bg-card overflow-hidden">
        <CardHeader className="bg-muted/30 p-6 border-b space-y-4 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reference, description, amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-11 text-xs font-semibold rounded-2xl border-2 bg-background"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!filteredTransactions.length}
              className="h-11 rounded-2xl text-xs font-black uppercase gap-2 border-2"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Tabs value={typeFilter} onValueChange={(val) => setTypeFilter(val as any)} className="w-full sm:w-auto">
              <TabsList className="bg-muted/80 p-1 rounded-xl h-10">
                <TabsTrigger value="ALL" className="text-[10px] font-black uppercase px-3 rounded-lg">All ({transactions?.length || 0})</TabsTrigger>
                <TabsTrigger value="Deposit" className="text-[10px] font-black uppercase px-3 rounded-lg text-emerald-600">Deposits</TabsTrigger>
                <TabsTrigger value="Payment" className="text-[10px] font-black uppercase px-3 rounded-lg text-primary">Services</TabsTrigger>
                <TabsTrigger value="Withdrawal" className="text-[10px] font-black uppercase px-3 rounded-lg text-amber-600">Withdrawals</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
              Showing {filteredTransactions.length} Record{filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardHeader>

        {/* Transaction List */}
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {isTxLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => {
                const isDeposit = tx.type === 'Deposit';
                const isWithdrawal = tx.type === 'Withdrawal';
                const isVerifying = verifyingRef === tx.id;

                return (
                  <div key={tx.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className={cn(
                        "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                        isDeposit ? "bg-emerald-500/10 text-emerald-600" : isWithdrawal ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                      )}>
                        {isDeposit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black uppercase truncate">{tx.description || 'Transaction'}</p>
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-black uppercase px-2 py-0 border-none",
                            isDeposit ? "bg-emerald-500/10 text-emerald-600" : isWithdrawal ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                          )}>
                            {tx.type}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground font-semibold uppercase">
                          <span>Ref: <code className="font-mono text-foreground font-bold">{tx.reference || tx.id}</code></span>
                          <span>•</span>
                          <span>{mounted ? new Date(tx.transactionDate).toLocaleString() : '...'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                      <div className="text-left sm:text-right">
                        <p className={cn(
                          "text-sm font-black",
                          isDeposit ? "text-emerald-600" : "text-primary"
                        )}>
                          {isDeposit ? '+' : '-'} ₦{(Number(tx.amount) || 0).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="bg-muted text-[8px] font-black uppercase px-1.5 py-0 border-none text-emerald-700">
                          {tx.status || 'Completed'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyMonnifyStatus(tx)}
                          disabled={isVerifying}
                          title="Verify Monnify Gateway Status"
                          className="h-8 text-[9px] font-black uppercase px-2.5 rounded-lg border-2 gap-1"
                        >
                          {isVerifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          <span className="hidden md:inline">Verify</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintReceipt(tx)}
                          title="Print Thermal Receipt"
                          className="h-8 w-8 rounded-lg"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center text-muted-foreground px-6 space-y-3">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="text-xs font-black uppercase tracking-widest">No matching transaction records found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top-Up Dialog */}
      <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
        <DialogContent className="sm:max-w-sm rounded-[2.5rem] border-none shadow-2xl p-6 bg-card">
          <DialogHeader className="text-center">
            <div className="h-14 w-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">Monnify Wallet Funding</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Enter deposit amount to launch Monnify card, transfer, or USSD checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">₦</span>
                <Input
                  type="number"
                  placeholder="1000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="pl-9 h-12 text-lg font-black rounded-xl border-2"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            <Button
              onClick={handleTopUpSubmit}
              disabled={isInitializingTopUp || !topUpAmount}
              className="w-full h-12 rounded-xl text-xs font-black bg-primary hover:bg-primary/90 uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              {isInitializingTopUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Proceed to Monnify"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowTopUpModal(false)}
              className="w-full h-10 rounded-xl text-xs font-black uppercase text-muted-foreground"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Receipt Node */}
      {selectedTxForPrint && (
        <div className="hidden print:block w-full max-w-md mx-auto p-10 space-y-8 border-4 border-dashed border-black receipt-view">
          <div className="receipt-header text-center">
            <BrandLogo iconOnly className="h-16 w-16 mx-auto mb-2" />
            <h2 className="text-2xl font-black uppercase mt-4 tracking-tighter">Call On Demand Receipt</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Monnify Settlement Verified</p>
          </div>
          <div className="space-y-3 pt-6 text-left">
            <div className="flex justify-between border-b pb-2">
              <span className="font-black uppercase text-[10px]">Reference</span>
              <span className="font-mono text-xs uppercase">{selectedTxForPrint.reference || selectedTxForPrint.id}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-black uppercase text-[10px]">Type</span>
              <span className="font-bold text-xs uppercase">{selectedTxForPrint.type}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-black uppercase text-[10px]">Narration</span>
              <span className="font-bold text-xs">{selectedTxForPrint.description}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-black uppercase text-[10px]">Timestamp</span>
              <span className="text-xs">{mounted ? new Date(selectedTxForPrint.transactionDate).toLocaleString() : ''}</span>
            </div>
            <div className="flex justify-between items-end pt-8">
              <span className="font-black uppercase text-[10px]">Amount Paid</span>
              <span className="text-3xl font-black">₦{(Number(selectedTxForPrint.amount) || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="receipt-footer mt-16 text-center border-t pt-6">
            <p className="text-[10px] font-black uppercase">Life, Exactly as Demanded.</p>
            <p className="text-[8px] text-muted-foreground uppercase mt-1">© {new Date().getFullYear()} Call On Demand Hub</p>
          </div>
        </div>
      )}
    </div>
  );
}
