"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Heart, 
  Share2, 
  TrendingUp, 
  Sparkles, 
  Loader2, 
  Gift, 
  History, 
  Trophy,
  Target,
  Wallet
} from "lucide-react"
import Image from "next/image"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, doc, orderBy, limit } from "firebase/firestore"
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { WalletBalanceDisplay } from "@/components/wallet-balance-display"
import { useToast } from "@/hooks/use-toast"

export default function CrowdfundingPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("All")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wallet
  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user?.uid]);
  const { data: wallet } = useDoc(walletRef);

  // Campaigns
  const campaignsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'campaigns'), 
      where('status', '==', 'Active'),
      where('type', '==', 'Crowdfunding'),
      limit(50)
    );
  }, [firestore]);
  const { data: campaigns, isLoading } = useCollection(campaignsQuery);

  // My Contributions
  const contributionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'contributions'),
      orderBy('contributionDate', 'desc'),
      limit(10)
    );
  }, [firestore, user?.uid]);
  const { data: myContributions, isLoading: isContributionsLoading } = useCollection(contributionsQuery);

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    if (activeCategory === "All") return campaigns;
    return campaigns.filter(c => c.category === activeCategory);
  }, [campaigns, activeCategory]);

  const handleBackProject = (campaign: any) => {
    if (!user || !firestore || !wallet) return;

    const amount = 5000; 

    if (wallet.balance < amount) {
      toast({ 
        title: "Insufficient Balance", 
        description: `You need ₦${amount.toLocaleString()} in your COD Wallet.`, 
        variant: "destructive" 
      });
      return;
    }

    setLoadingId(campaign.id);

    // 1. Deduct from wallet
    const newBalance = wallet.balance - amount;
    setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });

    // 2. Add Wallet Transaction
    const txColRef = collection(walletRef!, 'transactions');
    addDocumentNonBlocking(txColRef, {
      walletId: 'default',
      type: 'Payment',
      category: 'crowdfunding',
      serviceType: 'crowdfunding',
      amount: amount,
      description: `Backing Project: ${campaign.title}`,
      transactionDate: new Date().toISOString(),
      status: 'Completed'
    });

    // 3. Create Contribution Record
    const contributionData = {
      userId: user.uid,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      amount: amount,
      contributionDate: new Date().toISOString(),
      paymentStatus: "Paid",
      walletTransactionId: `TXN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    };

    const contributionsRef = collection(firestore, 'users', user.uid, 'contributions');
    addDocumentNonBlocking(contributionsRef, contributionData).then(() => {
      // 4. Update Campaign currentAmount
      const campaignRef = doc(firestore, 'campaigns', campaign.id);
      setDocumentNonBlocking(campaignRef, { 
        currentAmount: (campaign.currentAmount || 0) + amount 
      }, { merge: true });

      toast({
        title: "Project Backed!",
        description: `Thank you for contributing ₦${amount.toLocaleString()} to ${campaign.title}.`,
      });
    }).finally(() => {
      setLoadingId(null);
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-20">
      <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group">
        <Image 
          src="https://picsum.photos/seed/impact/1200/500" 
          alt="Impact Banner" 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center p-8 md:p-12">
          <div className="max-w-2xl space-y-4 text-white">
            <Badge className="bg-primary hover:bg-primary/90 border-none uppercase tracking-widest text-[10px]">Community Impact</Badge>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">Support Local Dreams.</h2>
            <p className="text-sm md:text-lg opacity-90 max-w-lg leading-relaxed">Join forces with the Call on Demand.com community to fund campus innovations, student projects, and local infrastructure.</p>
            <div className="flex gap-4 pt-2">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold h-12 gap-2 shadow-lg shadow-accent/20">
                <Sparkles className="h-4 w-4" /> Start a Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between sticky top-4 z-10 bg-background/80 backdrop-blur-md p-4 rounded-[2rem] border shadow-sm gap-4">
        <Tabs value="projects" className="w-full md:w-auto">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-12">
            <TabsTrigger value="projects" className="rounded-xl gap-2 h-10 px-6"><Target className="h-4 w-4" /> Live Projects</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          <WalletBalanceDisplay balance={wallet?.balance} badgeStyle />
        </div>
      </div>

      <Tabs defaultValue="projects" className="space-y-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {["All", "Campus", "Innovation", "Community"].map(cat => (
            <Button 
              key={cat} 
              variant={activeCategory === cat ? "default" : "outline"} 
              size="sm" 
              className="rounded-full px-5 h-9 font-bold transition-all"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <TabsContent value="projects" className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : filteredCampaigns.length > 0 ? (
              filteredCampaigns.map(c => {
                const progress = Math.min(100, Math.round(((c.currentAmount || 0) / (c.targetAmount || 1)) * 100));
                return (
                  <Card key={c.id} className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col group">
                    <div className="relative h-64 shrink-0 overflow-hidden">
                      <Image 
                        src={c.imageUrl || `https://picsum.photos/seed/${c.id}/800/500`} 
                        alt={c.title} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                        data-ai-hint="crowdfunding project"
                      />
                      <div className="absolute top-4 left-4"><Badge className="bg-white/90 text-black border-none font-black uppercase tracking-widest text-[10px]">{c.category || 'GENERAL'}</Badge></div>
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <CardHeader className="relative -mt-8 mx-4 p-6 bg-card rounded-3xl shadow-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-2xl font-black group-hover:text-primary transition-colors">{c.title}</CardTitle>
                        <Badge variant="outline" className="border-primary text-primary font-bold h-6">Active</Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed">{c.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6 flex-1 flex flex-col">
                      <div className="space-y-3 mt-auto">
                        <div className="flex justify-between text-sm items-end">
                          <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Raised</p>
                            <span className="text-2xl font-black text-primary">₦{(c.currentAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Progress</p>
                            <span className="text-xl font-black">{progress}%</span>
                          </div>
                        </div>
                        <Progress value={progress} className="h-3 rounded-full bg-muted shadow-inner" />
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-1">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Community Backed</span>
                          <span>Target: ₦{(c.targetAmount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-8 pt-0 flex gap-3">
                      <Button 
                        className="flex-1 h-12 font-black text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl" 
                        onClick={() => handleBackProject(c)}
                        disabled={loadingId === c.id}
                      >
                        {loadingId === c.id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Back This Project"}
                      </Button>
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-2">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-32 text-center border-4 border-dashed rounded-[3rem] bg-muted/20">
                <Gift className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p className="text-xl font-bold text-muted-foreground">No active projects found.</p>
                <p className="text-sm text-muted-foreground italic mt-1">Check back soon for new community initiatives.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <Card className="bg-accent text-accent-foreground border-none rounded-[2.5rem] p-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform group-hover:scale-125 duration-700">
            <Sparkles className="h-32 w-32" />
          </div>
          <CardContent className="p-0 space-y-4">
            <h4 className="text-3xl font-black">Community Success</h4>
            <p className="text-lg opacity-90 max-w-md">Our users have raised over ₦50M for student projects, local innovations, and campus renovations.</p>
            <Button variant="secondary" className="bg-white text-accent hover:bg-white/90 font-bold px-8 h-12 rounded-xl">Read Success Stories</Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed rounded-[2.5rem] p-8 bg-muted/5 flex flex-col justify-center items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h4 className="text-2xl font-black">Verified Transparency</h4>
          <p className="text-sm text-muted-foreground max-w-sm">Every Naira is tracked and reported. We ensure funds reach the intended project leads with zero platform fees.</p>
          <Button variant="outline" className="rounded-xl font-bold">View Impact Report</Button>
        </Card>
      </div>
    </div>
  )
}