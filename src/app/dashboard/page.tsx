'use client';

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  Plus, 
  Loader2, 
  ArrowRight, 
  Zap, 
  Eye, 
  EyeOff, 
  Truck,
  Utensils,
  ShoppingBag,
  Home,
  Sparkles,
  ShieldCheck,
  Shirt,
  BrainCircuit,
  Stars,
  RefreshCw,
  BellRing,
  Globe,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { GoogleGenAI } from "@google/genai"
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, where, limit, orderBy } from "firebase/firestore"
import { PromotionPopup } from "@/components/promotions/promotion-popup"
import { getLifestyleRecommendation } from "@/actions/lifestyle"
import type { LifestyleRecommenderOutput } from "@/ai/flows/lifestyle-recommender-flow"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/page-transition"

const LIFESTYLE_SERVICES = [
  { id: 'topup', name: "Top-up Hub", href: "/services/utility", icon: Zap, desc: "Airtime & data" },
  { id: 'food', name: "Food Hub", href: "/services/food", icon: Utensils, desc: "Unit kitchens" },
  { id: 'laundry', name: "Laundry Hub", href: "/services/laundry", icon: Shirt, desc: "Fabric care" },
  { id: 'shop', name: "Marketplace", href: "/services/shop", icon: ShoppingBag, desc: "Essentials" },
  { id: 'logistics', name: "Logistics", href: "/logistics", icon: Truck, desc: "Fulfillment" },
  { id: 'shortlet', name: "Shortlets", href: "/services/shortlet", icon: Home, desc: "Verified stays" },
];

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // AI States & Refresh Logic
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [smartRec, setSmartRec] = useState<LifestyleRecommenderOutput | null>(null);
  const [isSmartRecLoading, setIsSmartRecLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);
  const currentRegion = 'Africa';

  const isProfileMissing = !isProfileLoading && !profile && !!user;

  const handleInitializeProfile = async () => {
    if (!user || !firestore) return;
    const [firstName = '', lastName = ''] = (user.displayName || '').split(' ');
    
    const userDocRef = doc(firestore, 'users', user.uid);
    setDocumentNonBlocking(userDocRef, {
      id: user.uid,
      firstName,
      lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: "Customer",
      assignedUnit: 'General',
      status: "Active",
      createdAt: new Date().toISOString(),
      referralCode: `COD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    }, { merge: true });

    toast({ title: "Profile Initialized", description: "Your partner nodes have been synchronized." });
  };

  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user?.uid]);
  const { data: wallet, isLoading: isWalletLoading } = useDoc(walletRef);

  const surveyRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'onboarding', 'survey');
  }, [firestore, user?.uid]);
  const { data: survey } = useDoc(surveyRef);

  const adsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'campaigns'), where('status', '==', 'Active'), orderBy('createdAt', 'desc'), limit(5));
  }, [firestore, refreshKey]);
  const { data: campaigns } = useCollection(adsQuery);

  const bannerAd = useMemo(() => campaigns?.find(c => c.type === 'Ad' || c.type === 'Promo'), [campaigns]);
  const popupPromo = useMemo(() => campaigns?.find(c => c.type === 'Promo'), [campaigns]);
  const announcements = useMemo(() => campaigns?.filter(c => c.type === 'Notification').slice(0, 2) || [], [campaigns]);

  const recommendations = useMemo(() => {
    if (!survey?.primaryInterests || survey.primaryInterests.length === 0) return LIFESTYLE_SERVICES.slice(0, 3);
    const primary = LIFESTYLE_SERVICES.filter(s => survey.primaryInterests.includes(s.id));
    const secondary = LIFESTYLE_SERVICES.filter(s => !survey.primaryInterests.includes(s.id));
    return [...primary, ...secondary].slice(0, 3);
  }, [survey]);

  // Sync AI Insight
  useEffect(() => {
    async function fetchAiTip() {
      if (!user || !mounted) return;
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");
        
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Give a very short (max 10 words) helpful lifestyle tip for a user in Nigeria (Africa Hub) named ${user.displayName?.split(' ')[0] || 'Partner'}. Focus on speed or convenience.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });

        setAiTip(response.text || "Top-up your wallet for faster checkout sharp-sharp!");
      } catch (e) {
        console.error(e);
        setAiTip("Top-up your wallet for faster checkout sharp-sharp!");
      }
    }
    if (mounted) fetchAiTip();
  }, [user, currentRegion, mounted, refreshKey]);

  // Sync Smart Recommendation
  useEffect(() => {
    async function fetchSmartRec() {
      if (!user || !survey || !mounted || isSmartRecLoading) return;
      setIsSmartRecLoading(true);
      try {
        const hour = new Date().getHours();
        const timeContext = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        const result = await getLifestyleRecommendation({
          interests: survey?.primaryInterests || ['topup', 'food'],
          timeOfDay: timeContext,
          userName: user?.displayName?.split(' ')[0]
        });
        setSmartRec(result);
      } catch (e) {
        console.error("AI Recommendation Handshake Failed", e);
      } finally {
        setIsSmartRecLoading(false);
      }
    }
    if (mounted && survey) fetchSmartRec();
  }, [user, survey, isSmartRecLoading, mounted, refreshKey]);

  const handleRefresh = () => {
    setAiTip(null);
    setSmartRec(null);
    setRefreshKey(prev => prev + 1);
    toast({ title: "Syncing Platform", description: "Updating your personalized ecosystem nodes..." });
  };

  const handleClearRoleNotif = () => {
    if (!profileRef) return;
    updateDocumentNonBlocking(profileRef, { roleUpdateNotification: null });
    toast({ title: "Authorized", description: "Status acknowledged." });
  };

  if (isUserLoading || !mounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-5 pb-24 max-w-xl mx-auto px-2">
        {popupPromo && <PromotionPopup campaign={popupPromo} />}
        
        {isProfileMissing && (
          <div className="bg-primary/10 border-2 border-primary/20 rounded-[2rem] p-6 space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Profile Sync Required</p>
                <h3 className="text-xl font-black tracking-tight">Access Restricted</h3>
              </div>
            </div>
            <p className="text-xs font-bold leading-relaxed text-muted-foreground">
              Your identity nodes are not currently synchronized with the COD global ecosystem. Synchronize now to unlock full platform functionality.
            </p>
            <Button onClick={handleInitializeProfile} className="w-full h-12 rounded-xl font-black text-[10px] uppercase bg-primary text-white hover:bg-primary/90">
              Synchronize Identity
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center px-1">
          <div className="space-y-0.5">
            <h2 className="text-xl md:text-2xl font-black tracking-tighter">
              Hi, {user?.displayName?.split(' ')[0] || 'Partner'}
            </h2>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Nigeria Hub Live</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh} 
              className="h-8 w-8 rounded-xl border-2 flex items-center justify-center text-muted-foreground hover:text-primary transition-all bg-white shadow-sm"
              disabled={isSmartRecLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSmartRecLoading && "animate-spin")} />
            </button>
            {profile?.role && (
              <Badge variant="outline" className={cn(
                "uppercase font-black text-[8px] h-5",
                profile.role === 'Admin' ? "border-red-600/30 text-red-600 bg-red-600/5" :
                profile.role === 'Operator' ? "border-blue-600/30 text-blue-600 bg-blue-600/5" :
                profile.role === 'Agent' ? "border-green-600/30 text-green-600 bg-green-600/5" :
                "border-primary/20 text-primary bg-primary/5"
              )}>
                {profile.role}
              </Badge>
            )}
          </div>
        </div>

        {profile?.roleUpdateNotification && (
          <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-[2rem] p-5 space-y-4 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck className="h-20 w-20" /></div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-500 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-yellow-700 tracking-widest leading-none mb-1">Authorization Status Changed</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold opacity-50 uppercase">New Access:</span>
                  <Badge className="bg-yellow-600 text-white border-none font-black text-[8px] uppercase">{profile.role}</Badge>
                </div>
              </div>
            </div>
            <p className="text-xs font-bold leading-relaxed text-yellow-900/80 italic">
              &quot;{profile.roleUpdateNotification}&quot;
            </p>
            <Button onClick={handleClearRoleNotif} variant="secondary" className="w-full h-10 rounded-xl font-black text-[9px] uppercase bg-yellow-500 text-white hover:bg-yellow-600 border-none">
              Acknowledge New Status
            </Button>
          </div>
        )}

        {aiTip && (
          <div className="bg-accent/5 border-2 border-dashed border-accent/20 rounded-2xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-700">
            <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold text-accent-foreground leading-tight italic opacity-80">
              &quot;{aiTip.trim()}&quot;
            </p>
          </div>
        )}

        {announcements.map((ann) => (
          <div key={ann.id} className="bg-primary/5 border-l-4 border-primary p-3 rounded-r-xl flex items-center gap-3 animate-in slide-in-from-left">
            <BellRing className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black tracking-tight truncate uppercase">{ann.title}</p>
              <p className="text-[9px] text-muted-foreground font-medium line-clamp-1 truncate">{ann.description}</p>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-[2rem] overflow-hidden relative group h-40">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Wallet className="h-20 w-20" />
            </div>
            <CardHeader className="pb-1 p-6">
              <div className="flex items-center justify-between">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                  Unified Wallet <ShieldCheck className="h-2.5 w-2.5" />
                </div>
                <button onClick={() => setShowBalance(!showBalance)} className="text-white opacity-60 hover:opacity-100">
                  {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-6">
              <div className="text-2xl md:text-3xl font-black tracking-tighter mb-4">
                {isWalletLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : showBalance ? `₦ ${(wallet?.balance || 0).toLocaleString()}` : `₦ ••••••••`}
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white font-black rounded-lg h-8 px-4 text-[8px] uppercase tracking-widest">
                  <Link href="/wallet"><Plus className="mr-1.5 h-3 w-3" /> Deposit</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/20 hover:bg-white/5 text-white font-black rounded-lg h-8 px-4 text-[8px] uppercase tracking-widest">
                  <Link href="/services/utility"><Zap className="mr-1.5 h-3 w-3" /> Top-up</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent text-accent-foreground border-none shadow-xl rounded-[2rem] overflow-hidden relative group h-40">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Stars className="h-20 w-20" />
            </div>
            <CardHeader className="pb-1 p-6">
              <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                Demand Insight <Sparkles className="h-2.5 w-2.5" />
              </div>
            </CardHeader>
            <CardContent className="px-6">
              {isSmartRecLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mt-2" />
              ) : smartRec ? (
                <>
                  <div className="text-lg md:text-xl font-black tracking-tighter line-clamp-1 mb-1">{smartRec.headline}</div>
                  <p className="text-[9px] font-medium opacity-80 line-clamp-2 leading-tight mb-3 max-w-[180px]">{smartRec.recommendation}</p>
                  <Button asChild size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white font-black rounded-lg h-8 px-4 text-[8px] uppercase tracking-widest">
                    <Link href={LIFESTYLE_SERVICES.find(s => s.id === smartRec.suggestedService)?.href || '/dashboard'}>{smartRec.callToAction}</Link>
                  </Button>
                </>
              ) : (
                <div className="text-lg font-black tracking-tighter">Partner Member</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-[9px] font-black flex items-center gap-2 uppercase tracking-widest text-muted-foreground/60 px-1">
            <Sparkles className="h-3 w-3 text-accent" /> Lifestyle Hubs
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recommendations.map((service) => (
              <Link key={service.id} href={service.href} className="group">
                <Card className="border-2 border-muted hover:border-accent transition-all rounded-2xl cursor-pointer bg-card overflow-hidden shadow-sm h-24 flex flex-col justify-center px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <service.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[11px] truncate tracking-tight">{service.name}</p>
                      <p className="text-[7px] text-muted-foreground uppercase font-bold tracking-widest">{service.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Nigeria Platform Insights - Scaling Up */}
        <div className="space-y-4 pt-6">
           <div className="flex items-center justify-between px-1">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
               <Globe className="h-4 w-4" /> Nigeria Platform Status
             </h3>
             <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-green-500/20 text-green-600 bg-green-500/5">
                All Nodes Live
             </Badge>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Volume', value: '₦8.4B', trend: '+12%', color: 'text-primary' },
                { label: 'Active Agents', value: '1,240', trend: '+45', color: 'text-accent' },
                { label: 'Logistics Hubs', value: '18', trend: 'Nigeria', color: 'text-primary' },
                { label: 'System Uptime', value: '99.9%', trend: 'Stable', color: 'text-green-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white border-2 border-muted hover:border-primary/20 transition-all rounded-2xl p-4 shadow-sm group">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.label}</p>
                  <div className={cn("text-lg font-black tracking-tighter truncate", stat.color)}>{stat.value}</div>
                  <div className="text-[7px] font-bold opacity-50 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-2 w-2" /> {stat.trend}
                  </div>
                </div>
              ))}
           </div>

           <Button asChild variant="outline" className="w-full h-12 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 text-[9px] font-black uppercase tracking-widest text-primary gap-2 bg-primary/5">
             <Link href="/services">
               Explore COD Pro Features <Stars className="h-4 w-4" />
             </Link>
           </Button>
        </div>

        {bannerAd && (
          <div className="relative h-32 md:h-44 rounded-[2.5rem] overflow-hidden shadow-lg group border-2 border-white mt-4">
            <Image src={bannerAd.imageUrl || "https://picsum.photos/seed/promo/800/300"} alt="Ad" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent flex items-center p-6">
              <div className="max-w-[200px] space-y-1.5 text-white">
                <Badge className="bg-accent text-white border-none uppercase tracking-widest text-[7px] font-black px-2 h-4 mb-1">Featured</Badge>
                <h3 className="text-base md:text-xl font-black leading-tight tracking-tighter line-clamp-1">{bannerAd.title}</h3>
                <p className="text-[8px] md:text-[10px] opacity-90 line-clamp-2 leading-relaxed font-medium">{bannerAd.description}</p>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-black rounded-lg h-7 px-4 text-[8px] uppercase tracking-widest mt-2">
                  <Link href={bannerAd.type === 'Crowdfunding' ? '/crowdfunding' : '/dashboard'}>Explore <ArrowRight className="ml-1 h-2.5 w-2.5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
