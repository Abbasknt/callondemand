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
  TrendingUp,
  FileText
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, where, limit, orderBy } from "firebase/firestore"
import { PromotionPopup } from "@/components/promotions/promotion-popup"
import { getLifestyleRecommendation, type LifestyleRecommenderOutput } from "@/actions/lifestyle"
import { useToast } from "@/hooks/use-toast"
import { useBalanceVisibility } from "@/hooks/use-balance-visibility"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/page-transition"

const LIFESTYLE_SERVICES = [
  { id: 'topup', name: "Top-up Hub", href: "/services/utility", icon: Zap, desc: "Airtime & data" },
  { id: 'food', name: "Food Hub", href: "/services/food", icon: Utensils, desc: "Unit kitchens" },
  { id: 'laundry', name: "Laundry Hub", href: "/services/laundry", icon: Shirt, desc: "Fabric care" },
  { id: 'shop', name: "Marketplace", href: "/services/shop", icon: ShoppingBag, desc: "Essentials" },
  { id: 'logistics', name: "Logistics", href: "/logistics", icon: Truck, desc: "Fulfillment" },
  { id: 'shortlet', name: "Shortlets", href: "/services/shortlet", icon: Home, desc: "Verified stays" },
  { id: 'drive', name: "Google Drive", href: "/dashboard/drive", icon: FileText, desc: "Files & Documents" },
];

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { showBalance, toggleShowBalance, formatBalance } = useBalanceVisibility(false);
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
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              message: `Give a very short (max 10 words) helpful lifestyle tip for a user in Nigeria (Africa Hub) named ${user.displayName?.split(' ')[0] || 'Partner'}. Focus on speed or convenience.`, 
              history: [],
              systemInstruction: "You are a concise assistant providing lifestyle tips."
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed loading tip");
        
        setAiTip(data.text || "Top-up your wallet for faster checkout sharp-sharp!");
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
      <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 sm:px-6">
        {popupPromo && <PromotionPopup campaign={popupPromo} />}
        
        {isProfileMissing && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 space-y-3 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Profile Setup Needed</h3>
                <p className="text-xs text-slate-600">Complete your profile setup to unlock your wallet, rewards, and order tracking.</p>
              </div>
            </div>
            <Button onClick={handleInitializeProfile} className="w-full sm:w-auto h-10 rounded-xl font-semibold text-xs bg-amber-600 hover:bg-amber-700 text-white px-5">
              Complete Setup
            </Button>
          </div>
        )}

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Member'} 👋
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">What would you like to request today?</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefresh} 
              className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 gap-1.5 text-xs font-medium"
              disabled={isSmartRecLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSmartRecLoading && "animate-spin")} />
              Sync
            </Button>
            {profile?.role && (
              <Badge variant="secondary" className={cn(
                "font-semibold text-xs px-2.5 py-1 rounded-lg border",
                profile.role === 'Admin' ? "border-red-200 text-red-700 bg-red-50" :
                profile.role === 'Operator' ? "border-blue-200 text-blue-700 bg-blue-50" :
                profile.role === 'Agent' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                "border-slate-200 text-slate-700 bg-slate-100"
              )}>
                {profile.role}
              </Badge>
            )}
          </div>
        </div>

        {profile?.roleUpdateNotification && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Role Status Updated: {profile.role}</p>
                <p className="text-xs text-slate-600 italic">&quot;{profile.roleUpdateNotification}&quot;</p>
              </div>
            </div>
            <Button onClick={handleClearRoleNotif} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0">
              Acknowledge
            </Button>
          </div>
        )}

        {aiTip && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              <span className="font-semibold text-primary">Smart Tip:</span> &quot;{aiTip.trim()}&quot;
            </p>
          </div>
        )}

        {announcements.map((ann) => (
          <div key={ann.id} className="bg-blue-50 border border-blue-200/60 p-3.5 rounded-xl flex items-center gap-3">
            <BellRing className="h-4.5 w-4.5 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{ann.title}</p>
              <p className="text-xs text-slate-600 line-clamp-1">{ann.description}</p>
            </div>
          </div>
        ))}

        {/* Primary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-primary text-primary-foreground border-none shadow-md rounded-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-105 transition-transform">
              <Wallet className="h-24 w-24" />
            </div>
            <CardHeader className="pb-1 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary-foreground/80 flex items-center gap-1.5">
                  Main Wallet Balance <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <button 
                  onClick={toggleShowBalance} 
                  className="text-primary-foreground/70 hover:text-white transition-colors p-1 rounded"
                  title={showBalance ? "Hide balance" : "View balance"}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                {isWalletLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatBalance(wallet?.balance)}
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" className="bg-white text-primary hover:bg-slate-100 font-semibold rounded-xl h-9 px-4 text-xs">
                  <Link href="/wallet"><Plus className="mr-1.5 h-3.5 w-3.5" /> Deposit Funds</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold rounded-xl h-9 px-4 text-xs">
                  <Link href="/services/utility"><Zap className="mr-1.5 h-3.5 w-3.5" /> Quick Top-up</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-none shadow-md rounded-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-105 transition-transform">
              <Sparkles className="h-24 w-24" />
            </div>
            <CardHeader className="pb-1 p-5">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                AI Smart Recommendation <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </span>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {isSmartRecLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mt-2 text-slate-400" />
              ) : smartRec ? (
                <>
                  <div className="text-base font-bold text-white mb-1 line-clamp-1">{smartRec.headline}</div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">{smartRec.recommendation}</p>
                  <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl h-9 px-4 text-xs">
                    <Link href={LIFESTYLE_SERVICES.find(s => s.id === smartRec.suggestedService)?.href || '/dashboard'}>{smartRec.callToAction}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-base font-bold text-white mb-1">Tailored for You</div>
                  <p className="text-xs text-slate-300 mb-3">Recharge bills, order food, or dispatch packages instantly.</p>
                  <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl h-9 px-4 text-xs">
                    <Link href="/services">Browse Services</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Essential Services Grid */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
            Everyday Services
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {LIFESTYLE_SERVICES.map((service) => (
              <Link key={service.id} href={service.href} className="group">
                <Card className="border border-slate-200/80 hover:border-primary/50 hover:shadow-xs transition-all rounded-xl cursor-pointer bg-white p-4 flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <service.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors">{service.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{service.desc}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Platform Stats */}
        <div className="space-y-3 pt-4">
           <div className="flex items-center justify-between px-1">
             <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
               <Globe className="h-4 w-4 text-emerald-600" /> System Network Status
             </h2>
             <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5">
                All Systems Operational
             </Badge>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Active Volume', value: '₦8.4B', trend: '+12% month', color: 'text-slate-900' },
                { label: 'Verified Dispatchers', value: '1,240+', trend: 'Lagos & Abuja', color: 'text-slate-900' },
                { label: 'Logistics Hubs', value: '18 Hubs', trend: 'Nigeria wide', color: 'text-slate-900' },
                { label: 'System Uptime', value: '99.9%', trend: 'Real-time', color: 'text-emerald-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <p className="text-[11px] font-medium text-slate-500 mb-0.5">{stat.label}</p>
                  <div className={cn("text-base font-extrabold tracking-tight", stat.color)}>{stat.value}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">{stat.trend}</div>
                </div>
              ))}
           </div>
        </div>

        {bannerAd && (
          <div className="relative h-36 sm:h-40 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 group mt-4">
            <Image src={bannerAd.imageUrl || "https://picsum.photos/seed/promo/800/300"} alt="Ad" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent flex items-center p-6">
              <div className="max-w-[260px] space-y-1.5 text-white">
                <Badge className="bg-emerald-500 text-white border-none text-[10px] font-bold px-2 py-0.5">Special Promo</Badge>
                <h3 className="text-base sm:text-lg font-extrabold leading-tight line-clamp-1">{bannerAd.title}</h3>
                <p className="text-xs opacity-90 line-clamp-2 leading-relaxed font-normal">{bannerAd.description}</p>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-semibold rounded-lg h-8 px-3 text-xs mt-1">
                  <Link href={bannerAd.type === 'Crowdfunding' ? '/crowdfunding' : '/dashboard'}>Learn More <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
