"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Gift, 
  Users, 
  Zap, 
  Trophy, 
  Share2, 
  ArrowUpRight, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Copy,
  TrendingUp,
  History,
  Star
} from "lucide-react"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function RewardsPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isCopying, setIsCopying] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'application_settings', 'global_settings');
  }, [firestore]);
  const { data: appSettings } = useDoc(settingsRef);

  const questsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reward_quests'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: dbQuests } = useCollection(questsQuery);

  const referralBonusAmount = appSettings?.referralBonusAmount ?? 500;
  const nextTierPoints = appSettings?.goldTierPointsThreshold ?? 1000;
  
  const activeQuests = useMemo(() => {
    if (dbQuests && dbQuests.length > 0) {
      return dbQuests.filter(q => q.status !== 'Disabled');
    }
    return [
      { id: 'q1', title: "First Wallet Top-up", reward: "₦ 200 Bonus", icon: "TrendingUp" },
      { id: 'q2', title: "Weekly Laundry Booking", reward: "100 Points", icon: "Star" },
      { id: 'q3', title: "Marketplace Feedback", reward: "50 Points", icon: "CheckCircle2" },
    ];
  }, [dbQuests]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const rewardsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'rewards'), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: rewards, isLoading: isRewardsLoading } = useCollection(rewardsQuery);

  const referralsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'referrals'), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: referrals, isLoading: isRefsLoading } = useCollection(referralsQuery);

  const stats = useMemo(() => {
    if (!rewards) return { totalPoints: 0, totalCashback: 0, bonusBalance: 0 };
    return rewards.reduce((acc, r) => {
      acc.totalPoints += (r.points || 0);
      if (r.status === 'Available') {
        acc.totalCashback += (r.amount || 0);
        acc.bonusBalance += (r.amount || 0);
      }
      return acc;
    }, { totalPoints: 0, totalCashback: 0, bonusBalance: 0 });
  }, [rewards]);

  const copyReferralCode = () => {
    if (!profile?.referralCode) return;
    navigator.clipboard.writeText(profile.referralCode);
    setIsCopying(true);
    toast({ title: "Referral Code Copied", description: "Share this with your friends to earn bonuses!" });
    setTimeout(() => setIsCopying(false), 2000);
  };

  const progress = Math.min(100, (stats.totalPoints / nextTierPoints) * 100);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" /> Rewards Hub
          </h2>
          <p className="text-muted-foreground">Track your points, claim bonuses, and invite friends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative group rounded-[2.5rem]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <Zap className="h-24 w-24 fill-current" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Available Bonus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black mb-1">₦ {stats.totalCashback.toLocaleString()}</div>
            <p className="text-xs opacity-70">Redeemable for platform services</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-none text-white font-bold h-10 rounded-xl">
              Redeem Now
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-4 border-muted rounded-[2.5rem] shadow-sm bg-card transition-all hover:border-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Loyalty Points
              <Star className="h-4 w-4 text-accent fill-accent" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-black text-accent">{stats.totalPoints.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">COD Partner Member</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Progress to Gold</span>
                <span>{stats.totalPoints} / {nextTierPoints}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-muted rounded-[2.5rem] shadow-sm bg-card transition-all hover:border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Referral Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500">{referrals?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Successful referrals this month</p>
            <div className="mt-4 flex gap-2">
              <Badge variant="outline" className="bg-green-50/50 text-green-600 border-green-200 uppercase font-black text-[9px] tracking-widest">
                Impact Driven
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[3rem] border-4 border-dashed bg-muted/5 border-primary/20 overflow-hidden">
            <CardHeader className="p-8">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Users className="h-8 w-8" />
                <CardTitle className="text-2xl font-black">Invite & Earn</CardTitle>
              </div>
              <CardDescription className="text-base font-medium">
                Invite a friend to join Call on Demand.com and you&apos;ll both get a <strong>₦ {referralBonusAmount.toLocaleString()}</strong> bonus after their first successful transaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-white dark:bg-card border-2 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Your Unique Code</p>
                    <p className="text-2xl font-black font-mono tracking-tighter text-primary">
                      {profile?.referralCode || 'COD-SYNCING'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={copyReferralCode} className="h-12 w-12 rounded-xl border-2 border-primary/10 hover:bg-primary/5">
                    {isCopying ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-primary" />}
                  </Button>
                </div>
                <Button className="h-auto px-10 font-black gap-2 text-lg py-4 rounded-2xl shadow-xl shadow-primary/20">
                  <Share2 className="h-5 w-5" /> Share Link
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/30 p-10 border-b">
              <div>
                <CardTitle className="text-2xl font-black">Recent Earnings</CardTitle>
                <CardDescription className="font-medium">Audit log of your bonuses and loyalty point handshakes.</CardDescription>
              </div>
              <History className="h-7 w-7 text-muted-foreground opacity-30" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {isRewardsLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : rewards && rewards.length > 0 ? (
                  rewards.map(r => (
                    <div key={r.id} className="p-8 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner",
                          r.type === 'Cashback' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                        )}>
                          <Sparkles className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="font-black text-lg">{r.description || r.type}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                            {mounted ? new Date(r.date).toLocaleDateString() : '...'} • {r.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {r.amount > 0 && <p className="font-black text-2xl text-green-600">+ ₦{r.amount.toLocaleString()}</p>}
                        {r.points > 0 && <p className="text-[11px] font-black text-accent uppercase tracking-widest flex items-center justify-end gap-1"><Star className="h-3 w-3 fill-current" />+{r.points} Points</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-32 text-center text-muted-foreground space-y-4">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                      <Gift className="h-10 w-10" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-[10px]">No rewards recorded yet in this cycle</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-accent text-accent-foreground border-none rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">
              <Zap className="h-40 w-42 fill-current" />
            </div>
            <CardHeader className="p-0 mb-8 relative z-10">
              <CardTitle className="flex items-center gap-3 font-black text-2xl">
                <Zap className="h-6 w-6 fill-accent-foreground" />
                Partner Quests
              </CardTitle>
              <CardDescription className="text-accent-foreground/80 font-medium">Complete tasks to unlock instant bonuses.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4 relative z-10">
              {activeQuests.map((quest: any, i: number) => (
                <div key={quest.id || i} className="flex items-center gap-4 p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/20 transition-all cursor-default">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{quest.title}</p>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-0.5">{quest.reward}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-0 mt-8 relative z-10">
              <Button variant="ghost" className="w-full text-[10px] hover:bg-white/10 text-white font-black gap-2 uppercase tracking-[0.2em]">
                View All Active Quests <ArrowUpRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b p-6">
              <CardTitle className="text-[10px] uppercase tracking-[0.25em] font-black text-muted-foreground flex items-center gap-2">
                <Users className="h-3 w-3" /> Referral Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y px-6 pb-6">
                {isRefsLoading ? (
                  <div className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                ) : referrals && referrals.length > 0 ? (
                  referrals.map(ref => (
                    <div key={ref.id} className="py-5 flex items-center justify-between group">
                      <div>
                        <p className="text-sm font-black truncate w-32 group-hover:text-primary transition-colors">{ref.referredUserName || 'Partner User'}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-black mt-0.5 tracking-tighter">{ref.status}</p>
                      </div>
                      <Badge variant={ref.status === 'RewardClaimed' ? 'default' : 'outline'} className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        ref.status === 'RewardClaimed' ? "bg-green-500 text-white border-none" : "border-muted-foreground/20"
                      )}>
                        {ref.status === 'RewardClaimed' ? 'SETTLED' : 'PENDING'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-3 opacity-30">
                    <Users className="h-12 w-12 mx-auto" />
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Network Growth Status: Empty</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
