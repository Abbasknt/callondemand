"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Landmark, ShieldCheck, Loader2, Wallet, ArrowRight } from "lucide-react"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { WalletBalanceDisplay } from "@/components/wallet-balance-display"
import { useToast } from "@/hooks/use-toast"

/**
 * @fileOverview Hardened Growth & Investment Hub for Call on Demand.
 * Optimized for mobile fit and production build stability.
 */

export default function InvestmentsPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wallet Linkage
  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user?.uid]);
  const { data: wallet } = useDoc(walletRef);

  // Investment Plans Registry
  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'investmentPlans'), where('isAvailable', '==', true));
  }, [firestore]);
  const { data: plans, isLoading: isPlansLoading } = useCollection(plansQuery);

  // Active User Stake Audit
  const myInvestmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'investmentAccounts'));
  }, [firestore, user?.uid]);
  const { data: myInvestments } = useCollection(myInvestmentsQuery);

  const totalPortfolio = myInvestments?.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) || 0;

  const handleInvest = (plan: any) => {
    if (!user || !firestore || !wallet) return;

    if (wallet.balance < plan.minAmount) {
      toast({ 
        title: "Insufficient Balance", 
        description: `Minimum investment for this plan is ₦${plan.minAmount.toLocaleString()}.`, 
        variant: "destructive" 
      });
      return;
    }

    setLoadingId(plan.id);

    // 1. Authorize Wallet Deduction
    const newBalance = wallet.balance - plan.minAmount;
    setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });

    // 2. Provision Audit Trail Entry
    const txColRef = collection(walletRef!, 'transactions');
    addDocumentNonBlocking(txColRef, {
      walletId: 'default',
      type: 'Payment',
      category: 'investment',
      serviceType: 'investments',
      amount: plan.minAmount,
      description: `Growth Plan Stake: ${plan.name}`,
      transactionDate: new Date().toISOString(),
      status: 'Completed'
    });

    // 3. Initialize Growth Account
    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(startDate.getMonth() + (plan.durationMonths || 12));

    const investmentData = {
      userId: user.uid,
      investmentPlanId: plan.id,
      investmentPlanName: plan.name,
      investedAmount: plan.minAmount,
      startDate: startDate.toISOString().split('T')[0],
      maturityDate: maturityDate.toISOString().split('T')[0],
      currentValue: plan.minAmount,
      interestRate: plan.interestRate,
      status: "Active",
      lastUpdatedAt: new Date().toISOString()
    };

    const investmentsRef = collection(firestore, 'users', user.uid, 'investmentAccounts');
    addDocumentNonBlocking(investmentsRef, investmentData).then(() => {
      toast({
        title: "Growth Stake Authorized",
        description: `You have successfully invested ₦${plan.minAmount.toLocaleString()} in ${plan.name}.`,
      });
    }).finally(() => {
      setLoadingId(null);
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto px-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" /> Growth Hub
          </h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Verified Asset Management</p>
        </div>
        <WalletBalanceDisplay balance={wallet?.balance} badgeStyle className="bg-white border shadow-sm text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-[2rem] p-6 h-32 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700"><Landmark className="h-20 w-20" /></div>
          <CardTitle className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-2">Portfolio Value</CardTitle>
          <div className="text-3xl font-black tracking-tighter">₦{totalPortfolio.toLocaleString()}</div>
        </Card>
        
        <Card className="border-none shadow-lg rounded-[2rem] bg-card p-6 h-32 flex flex-col justify-center">
          <CardTitle className="text-[8px] font-black uppercase text-muted-foreground mb-2">Active Stakes</CardTitle>
          <div className="text-3xl font-black text-primary tracking-tighter">{myInvestments?.length || 0}</div>
        </Card>

        <Card className="border-none shadow-lg rounded-[2rem] bg-card p-6 h-32 flex flex-col justify-center">
          <CardTitle className="text-[8px] font-black uppercase text-muted-foreground mb-2">Risk Status</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-accent text-white border-none rounded-lg font-black text-[10px] h-6 px-3">STABLE</Badge>
          </div>
        </Card>
      </div>

      <div className="px-2 pt-4">
        <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest mb-6">
          <Landmark className="h-5 w-5 text-primary" /> Market Plans
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {isPlansLoading ? (
            <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : plans && plans.length > 0 ? (
            plans.map(plan => (
              <Card key={plan.id} className="rounded-[2.5rem] border-none shadow-lg bg-card group transition-all hover:scale-[1.02]">
                <CardHeader className="p-8 pb-2">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">Live Node</Badge>
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight">{plan.name}</CardTitle>
                  <CardDescription className="text-xs font-medium line-clamp-2 mt-1">{plan.description || "Capital growth protocol via verified unit operations."}</CardDescription>
                </CardHeader>
                <CardContent className="p-8 py-4">
                  <div className="flex justify-between items-end border-t border-dashed pt-4">
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Target Yield</p>
                      <p className="text-3xl font-black text-primary">{plan.interestRate}% <span className="text-[10px] font-bold">APY</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Min Entry</p>
                      <p className="font-black text-lg">₦{plan.minAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-2">
                  <Button 
                    className="w-full h-14 font-black rounded-2xl text-sm uppercase bg-primary shadow-xl shadow-primary/20 gap-2" 
                    onClick={() => handleInvest(plan)}
                    disabled={loadingId === plan.id}
                  >
                    {loadingId === plan.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Stake Now <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-24 text-center border-4 border-dashed rounded-[3rem] opacity-30 font-black text-[10px] uppercase">
              No Growth Nodes Active
            </div>
          )}
        </div>
      </div>

      <div className="mx-2 bg-primary/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-dashed border-primary/10 mt-8">
        <div className="flex items-start gap-4 text-center md:text-left">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mx-auto md:mx-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-black text-lg">Regulated Protection</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-1 max-w-xs leading-relaxed">All growth stakes are secured via the COD high-density liquidity pool and verified by unit agents.</p>
          </div>
        </div>
        <Button variant="link" className="text-primary font-black uppercase text-[10px] tracking-widest">Compliance Roadmap</Button>
      </div>
    </div>
  )
}