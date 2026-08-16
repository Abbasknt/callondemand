"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  Wallet, 
  ShieldCheck, 
  Printer, 
  Share2, 
  Radio, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  RefreshCw, 
  ZapOff, 
  CreditCard,
  Phone,
  Sparkles,
  Check,
  Flame,
  Clock,
  Layers,
  ArrowRight
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, limit } from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { WalletBalanceDisplay } from "@/components/wallet-balance-display"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  searchNetworkBundles, 
  initiateBundleCheckout, 
  vendBillPayment, 
  initMonnifyTransaction,
  fulfillDataBundlePayment 
} from "@/actions/monnify"
import { triggerReceiptPrint, shareReceipt } from "@/lib/export-utils"
import { PageTransition } from "@/components/page-transition"
import { MotionalDealCard } from "@/components/promotions/motional-deal-card"

type NetworkId = 'mtn' | 'airtel' | 'glo' | '9mobile';

interface NetworkOption {
  id: NetworkId;
  name: string;
  billerCode: string;
  color: string;
  activeColor: string;
  textColor: string;
  badgeBg: string;
  description: string;
}

const NETWORKS: NetworkOption[] = [
  { 
    id: "mtn", 
    name: "MTN Nigeria", 
    billerCode: "BIL001",
    color: "border-yellow-400/30 hover:border-yellow-400 bg-yellow-500/5", 
    activeColor: "bg-yellow-400 text-black border-yellow-500 ring-2 ring-yellow-400/50",
    textColor: "text-yellow-600",
    badgeBg: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Everywhere you go • High-speed 4G/5G" 
  },
  { 
    id: "airtel", 
    name: "Airtel Nigeria", 
    billerCode: "BIL002",
    color: "border-red-500/30 hover:border-red-500 bg-red-500/5", 
    activeColor: "bg-red-600 text-white border-red-600 ring-2 ring-red-500/50",
    textColor: "text-red-600",
    badgeBg: "bg-red-100 text-red-800 border-red-200",
    description: "A reason to imagine • Superfast data" 
  },
  { 
    id: "glo", 
    name: "Glo Nigeria", 
    billerCode: "BIL003",
    color: "border-green-500/30 hover:border-green-500 bg-green-500/5", 
    activeColor: "bg-green-600 text-white border-green-600 ring-2 ring-green-500/50",
    textColor: "text-green-600",
    badgeBg: "bg-green-100 text-green-800 border-green-200",
    description: "Grandmasters of data • Huge volume" 
  },
  { 
    id: "9mobile", 
    name: "9mobile / 9ja", 
    billerCode: "BIL004",
    color: "border-emerald-600/30 hover:border-emerald-600 bg-emerald-600/5", 
    activeColor: "bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-600/50",
    textColor: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Here for you • 9ja reliable low latency" 
  },
];

const PREFIXES: Record<string, NetworkId> = {
  '0803': 'mtn', '0806': 'mtn', '0813': 'mtn', '0810': 'mtn', '0814': 'mtn', '0816': 'mtn', '0703': 'mtn', '0706': 'mtn', '0903': 'mtn', '0906': 'mtn', '0913': 'mtn', '0916': 'mtn', '0702': 'mtn', '0704': 'mtn',
  '0802': 'airtel', '0808': 'airtel', '0812': 'airtel', '0701': 'airtel', '0708': 'airtel', '0902': 'airtel', '0907': 'airtel', '0901': 'airtel', '0904': 'airtel', '0912': 'airtel', '0911': 'airtel',
  '0805': 'glo', '0807': 'glo', '0811': 'glo', '0815': 'glo', '0705': 'glo', '0905': 'glo', '0915': 'glo',
  '0809': '9mobile', '0817': '9mobile', '0818': '9mobile', '0909': '9mobile', '0908': '9mobile'
};

const PLAN_FILTERS = [
  { id: 'ALL', label: 'All Bundles' },
  { id: 'DAILY', label: 'Daily (1-3 Days)' },
  { id: 'WEEKLY', label: 'Weekly (7-14 Days)' },
  { id: 'MONTHLY', label: 'Monthly (30 Days)' },
  { id: 'MEGA', label: 'Mega Plans (40GB+)' },
  { id: 'SME', label: 'SME / Corporate' },
  { id: 'SOCIAL', label: 'Social & Video' },
];

const QUICK_SEARCH_CHIPS = ['1GB', '2GB', '3GB', '5GB', '10GB', '20GB', 'Monthly', 'Daily'];

function SearchDataBundlePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('mtn')
  const [bundles, setBundles] = useState<any[]>([])
  const [isLoadingBundles, setIsLoadingBundles] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<'MONNIFY' | 'WALLET'>('MONNIFY')
  
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [vendResult, setVendResult] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<'SELECT' | 'CONFIRM' | 'PROCESSING' | 'SUCCESS'>('SELECT')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check URL params for post-payment verification & automatic telco data fulfillment
  useEffect(() => {
    if (!searchParams) return;
    const status = searchParams.get('status');
    const ref = searchParams.get('ref') || searchParams.get('paymentReference') || searchParams.get('transactionReference');
    const phone = searchParams.get('phone');
    const bundleName = searchParams.get('bundle');
    const amountParam = Number(searchParams.get('amount') || 0);
    const networkParam = searchParams.get('network');
    const productCodeParam = searchParams.get('productCode');

    if (ref) {
      let isCancelled = false;

      const processReturnFulfillment = async () => {
        setCurrentStep('PROCESSING');
        try {
          const fulfillment = await fulfillDataBundlePayment({
            paymentReference: ref,
            network: networkParam || selectedNetwork,
            productCode: productCodeParam || undefined,
            productName: bundleName || undefined,
            customerPhone: phone || undefined,
            amount: amountParam || undefined,
            userId: user?.uid || undefined
          });

          if (isCancelled) return;

          if (fulfillment && fulfillment.success && fulfillment.response) {
            setVendResult(fulfillment.response);
            setCurrentStep('SUCCESS');
            toast({
              title: "Data Bundle Fulfilled",
              description: `Successfully activated ${fulfillment.response.bundleName || bundleName || 'Data Plan'} for ${fulfillment.response.recipient || phone}.`
            });
          } else {
            setVendResult({
              reference: ref,
              finalAmount: amountParam,
              recipient: phone || 'Recipient',
              bundleName: bundleName || 'Data Bundle',
              status: 'VERIFIED'
            });
            setCurrentStep('SUCCESS');
          }
        } catch (err: any) {
          if (!isCancelled) {
            console.error("Fulfillment verification error:", err);
            setVendResult({
              reference: ref,
              finalAmount: amountParam,
              recipient: phone || 'Recipient',
              bundleName: bundleName || 'Data Bundle',
              status: 'PROCESSED'
            });
            setCurrentStep('SUCCESS');
          }
        }
      };

      processReturnFulfillment();

      return () => {
        isCancelled = true;
      };
    }
  }, [searchParams, user, selectedNetwork, toast]);

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

  useEffect(() => {
    if (profile?.phoneNumber && !recipientPhone) {
      setRecipientPhone(profile.phoneNumber);
    }
  }, [profile, recipientPhone]);

  // Auto-detect network from phone number
  useEffect(() => {
    if (recipientPhone.length >= 4) {
      const prefix = recipientPhone.slice(0, 4);
      const detected = PREFIXES[prefix];
      if (detected && detected !== selectedNetwork) {
        setSelectedNetwork(detected);
        toast({
          title: `Carrier Detected: ${detected.toUpperCase()}`,
          description: `Switched bundle search to ${detected.toUpperCase()} Nigeria for line ${recipientPhone}`
        });
      }
    }
  }, [recipientPhone, selectedNetwork, toast]);

  // Fetch bundles whenever network changes
  const fetchBundles = useCallback(async (network: NetworkId) => {
    setIsLoadingBundles(true);
    setSelectedBundle(null);
    try {
      const res = await searchNetworkBundles({ network });
      if (res && res.success && res.response) {
        setBundles(res.response);
      } else {
        setBundles([]);
      }
    } catch (e) {
      console.error("Bundle Fetch Error:", e);
      toast({
        title: "Gateway Synchronizing",
        description: "Loading fallback data bundle packages...",
        variant: "default"
      });
    } finally {
      setIsLoadingBundles(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBundles(selectedNetwork);
  }, [selectedNetwork, fetchBundles]);

  // Filtered bundles list
  const filteredBundles = useMemo(() => {
    let list = bundles;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b: any) => {
        const name = (b.name || '').toLowerCase();
        const volume = (b.volume || '').toLowerCase();
        const validity = (b.validity || '').toLowerCase();
        const planType = (b.planType || '').toLowerCase();
        const price = String(b.price || b.amount || '');
        return name.includes(q) || volume.includes(q) || validity.includes(q) || planType.includes(q) || price.includes(q);
      });
    }

    // Plan type filter
    if (activeFilter !== 'ALL') {
      const target = activeFilter.toUpperCase();
      list = list.filter((b: any) => {
        if (b.planType && b.planType.toUpperCase() === target) return true;
        const name = (b.name || '').toLowerCase();
        if (target === 'DAILY') return name.includes('day') || name.includes('daily') || name.includes('24 hour') || name.includes('48 hour');
        if (target === 'WEEKLY') return name.includes('week') || name.includes('7 day') || name.includes('14 day');
        if (target === 'MONTHLY') return name.includes('month') || name.includes('30 day');
        if (target === 'MEGA') return name.includes('max') || name.includes('ultra') || name.includes('broadband') || name.includes('40gb') || name.includes('75gb');
        if (target === 'SME') return name.includes('sme') || name.includes('corporate');
        if (target === 'SOCIAL') return name.includes('youtube') || name.includes('tiktok') || name.includes('social');
        return true;
      });
    }

    return list;
  }, [bundles, searchQuery, activeFilter]);

  const handleSelectNetwork = (netId: NetworkId) => {
    setSelectedNetwork(netId);
    setSearchQuery("");
    setActiveFilter("ALL");
  };

  const handleProceedToConfirm = () => {
    if (!selectedBundle) {
      toast({ title: "Please select a data bundle", variant: "destructive" });
      return;
    }
    if (!recipientPhone || recipientPhone.length < 10) {
      toast({ title: "Enter a valid recipient phone number", variant: "destructive" });
      return;
    }
    setCurrentStep('CONFIRM');
  };

  const handleCheckoutViaMonnify = async () => {
    if (!selectedBundle) return;
    setCheckoutLoading(true);

    try {
      const bundlePrice = Number(selectedBundle.price || selectedBundle.amount || 0);
      const productCode = selectedBundle.productCode || selectedBundle.code || 'DATA_BUNDLE';
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://callondemandbiz.com';
      
      const res = await initiateBundleCheckout({
        network: selectedNetwork,
        productCode: productCode,
        productName: selectedBundle.name,
        amount: bundlePrice,
        customerPhone: recipientPhone,
        customerEmail: user?.email || 'customer@callondemandbiz.com',
        userId: user?.uid || undefined,
        redirectUrl: `${origin}/services/data?status=verifying&phone=${encodeURIComponent(recipientPhone)}&bundle=${encodeURIComponent(selectedBundle.name)}&amount=${bundlePrice}&network=${encodeURIComponent(selectedNetwork)}&productCode=${encodeURIComponent(productCode)}`
      });

      if (res && res.success && res.checkoutUrl) {
        toast({
          title: "Opening Monnify Payment Gateway",
          description: "Authorizing secure checkout with Debit Card, USSD, or Bank Transfer..."
        });
        window.location.href = res.checkoutUrl;
      } else {
        toast({
          title: "Monnify Gateway Handshake Error",
          description: res?.error || "Could not initialize Monnify checkout.",
          variant: "destructive"
        });
        setCheckoutLoading(false);
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Payment Error",
        description: e?.message || "Failed to initialize payment.",
        variant: "destructive"
      });
      setCheckoutLoading(false);
    }
  };

  const handlePayViaWallet = async () => {
    if (!selectedBundle || !user || !wallet) return;
    const bundlePrice = Number(selectedBundle.price || selectedBundle.amount || 0);

    if (wallet.balance < bundlePrice) {
      toast({
        title: "Insufficient Balance",
        description: `Your balance is ₦${(wallet.balance || 0).toLocaleString()}. Please top up or pay directly via Monnify.`,
        variant: "destructive"
      });
      return;
    }

    setCurrentStep('PROCESSING');

    try {
      const ref = `DATA-${selectedNetwork.toUpperCase()}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const vendRes = await vendBillPayment({
        productCode: selectedBundle.productCode || selectedBundle.code || 'DATA_BUNDLE',
        customerId: recipientPhone,
        amount: bundlePrice,
        paymentReference: ref,
        billerCode: NETWORKS.find(n => n.id === selectedNetwork)?.billerCode || 'BIL001',
        emailAddress: user.email || 'billing@callondemandbiz.com'
      });

      if (vendRes && vendRes.success) {
        const newBalance = wallet.balance - bundlePrice;
        if (walletRef) {
          setDocumentNonBlocking(walletRef, { balance: newBalance }, { merge: true });
          addDocumentNonBlocking(collection(walletRef, 'transactions'), {
            type: 'Payment',
            category: 'data_bundle',
            serviceType: 'utility',
            amount: bundlePrice,
            description: `Data Top-up: ${selectedNetwork.toUpperCase()} ${selectedBundle.name} to ${recipientPhone}`,
            transactionDate: new Date().toISOString(),
            status: 'Completed',
            reference: ref,
            vendReference: vendRes.response?.vendReference || vendRes.response?.transactionReference || ref
          });
        }

        setVendResult({
          reference: ref,
          finalAmount: bundlePrice,
          recipient: recipientPhone,
          bundleName: selectedBundle.name,
          status: 'SUCCESS'
        });
        setCurrentStep('SUCCESS');
      } else {
        toast({
          title: "Vending Failed",
          description: vendRes?.error || "Could not complete data bundle activation.",
          variant: "destructive"
        });
        setCurrentStep('CONFIRM');
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Vending Exception",
        description: e?.message || "An error occurred while processing transaction.",
        variant: "destructive"
      });
      setCurrentStep('CONFIRM');
    }
  };

  if (!mounted) return null;

  const currentNetworkObj = NETWORKS.find(n => n.id === selectedNetwork) || NETWORKS[0];

  return (
    <PageTransition>
      <div className="space-y-6 pb-24 max-w-4xl mx-auto px-3 sm:px-4">
        
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
              <Zap className="h-3.5 w-3.5" /> Monnify VAS Payment Terminal
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
              Search Data Bundles
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Search, compare, and instantly vend high-speed mobile data via Monnify Gateway.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/services/utility')}
              className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-wider border-2"
            >
              <Radio className="h-3.5 w-3.5 mr-1.5 text-primary" /> Utility Hub
            </Button>
            <WalletBalanceDisplay balance={wallet?.balance} badgeStyle className="bg-white border-2 shadow-sm text-primary" />
          </div>
        </div>

        {currentStep === 'SELECT' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Motional Deal Flash Banner */}
            <MotionalDealCard network={selectedNetwork} />

            {/* Step 1: Network Selection Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">1</span>
                  Select Telecom Network
                </label>
                <Badge variant="outline" className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" /> Monnify VAS Live
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {NETWORKS.map((net) => {
                  const isSelected = selectedNetwork === net.id;
                  return (
                    <button
                      key={net.id}
                      onClick={() => handleSelectNetwork(net.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-start justify-between text-left gap-2 relative overflow-hidden",
                        isSelected
                          ? net.activeColor
                          : `${net.color} bg-white hover:shadow-md`
                      )}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="font-black text-sm uppercase tracking-tight">{net.name}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      </div>
                      <p className={cn("text-[9px] font-medium leading-tight opacity-80", isSelected ? "text-inherit" : "text-muted-foreground")}>
                        {net.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Recipient Phone Input */}
            <div className="space-y-2 bg-muted/20 p-4 sm:p-5 rounded-2xl border-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">2</span>
                Recipient Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="e.g. 08031234567"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                  className="pl-12 h-14 rounded-xl border-2 font-black text-lg sm:text-xl tracking-wider focus-visible:ring-primary"
                  maxLength={11}
                />
                <Badge className={cn("absolute right-3 top-1/2 -translate-y-1/2 font-black text-[10px] h-8 px-3 rounded-lg border", currentNetworkObj.badgeBg)}>
                  {currentNetworkObj.name.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Step 3: Bundle Search & Filtering */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">3</span>
                  Search Bundles for {currentNetworkObj.name}
                </label>
                <span className="text-[10px] font-black uppercase text-muted-foreground">
                  {filteredBundles.length} Bundles Found
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={`Search ${currentNetworkObj.name} data plans (e.g. 1GB, 2.5GB, Monthly, SME, ₦1200)...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-10 h-14 rounded-2xl border-2 text-sm sm:text-base font-bold bg-white focus-visible:ring-primary shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Search Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[9px] font-black uppercase text-muted-foreground shrink-0 mr-1">Quick:</span>
                {QUICK_SEARCH_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setSearchQuery(searchQuery === chip ? "" : chip)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-lg border transition-all whitespace-nowrap",
                      searchQuery === chip
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Plan Type Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b pb-3">
                {PLAN_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={cn(
                      "px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap",
                      activeFilter === f.id
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Bundles Grid */}
              {isLoadingBundles ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary opacity-40" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Querying Monnify VAS Gateway for {currentNetworkObj.name}...
                  </p>
                </div>
              ) : filteredBundles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
                  {filteredBundles.map((bundle: any, idx: number) => {
                    const isSelected = (selectedBundle?.productCode || selectedBundle?.code) === (bundle.productCode || bundle.code);
                    const price = bundle.price || bundle.amount || 0;
                    return (
                      <div
                        key={bundle.productCode || bundle.code || `bundle-${idx}`}
                        onClick={() => setSelectedBundle(bundle)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                            : "border-muted bg-white hover:border-primary/40 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs",
                              isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                            )}>
                              <Zap className="h-4 w-4" />
                            </div>
                            <div>
                              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0">
                                {bundle.planType || 'DATA'}
                              </Badge>
                              {bundle.validity && (
                                <p className="text-[9px] font-bold text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" /> {bundle.validity}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                            isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                          )}>
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-xs uppercase tracking-tight line-clamp-2 text-foreground">
                            {bundle.name}
                          </h4>
                          {bundle.volume && (
                            <p className="text-[10px] font-black text-primary uppercase mt-0.5">
                              {bundle.volume} Allowance
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t flex items-center justify-between">
                          <span className="text-[10px] font-black text-muted-foreground uppercase">Price</span>
                          <span className="text-base font-black text-primary tracking-tight">
                            ₦{Number(price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3 bg-muted/10 rounded-3xl border-2 border-dashed">
                  <ZapOff className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
                  <div>
                    <h3 className="font-black uppercase text-sm">No Bundles Matched</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try clearing search terms or selecting another category filter.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSearchQuery(""); setActiveFilter("ALL"); }}
                    className="rounded-xl font-black text-[10px] uppercase"
                  >
                    Reset Search
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom Proceed Button */}
            <div className="pt-4 sticky bottom-4 z-10">
              <Card className="rounded-2xl border-2 shadow-2xl bg-white/95 backdrop-blur-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  {selectedBundle ? (
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Selected Plan</p>
                      <p className="font-black text-sm text-foreground uppercase">{selectedBundle.name}</p>
                      <p className="text-base font-black text-primary">₦{Number(selectedBundle.price || selectedBundle.amount || 0).toLocaleString()}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">No Plan Selected</p>
                      <p className="text-xs text-muted-foreground">Select a bundle from the list above</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleProceedToConfirm}
                  disabled={!selectedBundle || !recipientPhone || recipientPhone.length < 10}
                  className="w-full sm:w-auto min-w-[220px] h-14 text-sm font-black rounded-xl bg-primary text-white shadow-lg uppercase tracking-wider gap-2"
                >
                  Continue to Payment <ChevronRight className="h-4 w-4" />
                </Button>
              </Card>
            </div>

          </div>
        )}

        {/* Step 2: Confirm & Choose Payment Method */}
        {currentStep === 'CONFIRM' && selectedBundle && (
          <Card className="rounded-[2rem] border-2 shadow-2xl overflow-hidden bg-card animate-in zoom-in-95 max-w-xl mx-auto">
            <CardHeader className="bg-muted/10 p-6 sm:p-8 border-b text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Checkout Order</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                Monnify Gateway Settlement
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Order Summary Box */}
              <div className="bg-muted/30 p-5 rounded-2xl border-2 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase">Network</span>
                  <Badge className={cn("font-black text-[10px]", currentNetworkObj.badgeBg)}>
                    {currentNetworkObj.name}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase">Recipient</span>
                  <span className="font-black text-sm tracking-wider">{recipientPhone}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase">Bundle Plan</span>
                  <span className="font-black text-xs text-right max-w-[220px] truncate uppercase">{selectedBundle.name}</span>
                </div>
                <div className="pt-3 border-t flex justify-between items-end">
                  <span className="font-black text-xs uppercase text-muted-foreground">Total Amount</span>
                  <span className="text-3xl font-black text-primary tracking-tight">
                    ₦{Number(selectedBundle.price || selectedBundle.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Select Payment Gateway Mode
                </label>

                {/* Option 1: Direct Monnify Gateway */}
                <div
                  onClick={() => setPaymentMethod('MONNIFY')}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3",
                    paymentMethod === 'MONNIFY'
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                      : "border-muted bg-white hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase">Pay via Monnify Gateway</h4>
                      <p className="text-[10px] text-muted-foreground">Debit Cards, Bank Transfer, USSD & Phone</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-black text-[9px] uppercase">Instant</Badge>
                </div>

                {/* Option 2: COD Wallet Balance */}
                <div
                  onClick={() => setPaymentMethod('WALLET')}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3",
                    paymentMethod === 'WALLET'
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                      : "border-muted bg-white hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase">Pay with COD Wallet</h4>
                      <p className="text-[10px] text-muted-foreground">
                        Available Balance: ₦{(wallet?.balance || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {wallet && wallet.balance >= Number(selectedBundle.price || selectedBundle.amount || 0) ? (
                    <Badge variant="outline" className="text-[9px] font-black text-emerald-600 border-emerald-300">Ready</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] font-black text-amber-600 border-amber-300">Low Balance</Badge>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-6 sm:p-8 bg-muted/5 border-t flex flex-col gap-3">
              {paymentMethod === 'MONNIFY' ? (
                <Button
                  onClick={handleCheckoutViaMonnify}
                  disabled={checkoutLoading}
                  className="w-full h-14 text-sm font-black rounded-xl bg-primary shadow-xl uppercase tracking-wider gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Authorizing Monnify...
                    </>
                  ) : (
                    <>
                      Pay ₦{Number(selectedBundle.price || selectedBundle.amount || 0).toLocaleString()} via Monnify <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {wallet && wallet.balance >= Number(selectedBundle.price || selectedBundle.amount || 0) ? (
                    <Button
                      onClick={handlePayViaWallet}
                      className="w-full h-14 text-sm font-black rounded-xl bg-primary shadow-xl uppercase tracking-wider"
                    >
                      Confirm ₦{Number(selectedBundle.price || selectedBundle.amount || 0).toLocaleString()} from Wallet
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCheckoutViaMonnify}
                      className="w-full h-14 text-sm font-black rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xl uppercase tracking-wider"
                    >
                      Top Up & Pay via Monnify
                    </Button>
                  )}
                </>
              )}

              <Button
                variant="ghost"
                onClick={() => setCurrentStep('SELECT')}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
              >
                Back to Bundle Selection
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Processing Screen */}
        {currentStep === 'PROCESSING' && (
          <Card className="rounded-[2.5rem] border-2 shadow-2xl py-20 text-center space-y-6 animate-pulse max-w-md mx-auto">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto opacity-30" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">Activating Bundle</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Communicating with Monnify VAS Gateway...
              </p>
            </div>
          </Card>
        )}

        {/* Step 4: Success Screen */}
        {currentStep === 'SUCCESS' && vendResult && (
          <Card className="border-2 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white max-w-lg mx-auto">
            <div className="h-3 bg-emerald-500" />
            <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xl">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Top-up Successful!</h3>
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[9px]">
                  Vended via Monnify Gateway
                </p>
              </div>

              <div className="w-full bg-muted/20 p-6 rounded-2xl border-2 space-y-3 text-left">
                <div className="flex justify-between border-b pb-2 text-xs">
                  <span className="font-bold text-muted-foreground uppercase">Reference</span>
                  <span className="font-mono font-black text-[10px]">{vendResult.reference}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-xs">
                  <span className="font-bold text-muted-foreground uppercase">Recipient</span>
                  <span className="font-black">{vendResult.recipient || recipientPhone}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-xs">
                  <span className="font-bold text-muted-foreground uppercase">Bundle</span>
                  <span className="font-black uppercase">{vendResult.bundleName}</span>
                </div>
                {vendResult.finalAmount > 0 && (
                  <div className="flex justify-between items-end pt-2">
                    <span className="font-black text-xs text-muted-foreground uppercase">Amount Paid</span>
                    <span className="text-2xl font-black text-primary">₦{vendResult.finalAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="w-full grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 font-black text-[10px] rounded-xl border-2 uppercase"
                  onClick={() => triggerReceiptPrint()}
                >
                  <Printer className="h-4 w-4 mr-1.5" /> Print
                </Button>
                <Button
                  variant="outline"
                  className="h-12 font-black text-[10px] rounded-xl border-2 uppercase"
                  onClick={() => {
                    shareReceipt({
                      title: 'COD Data Bundle Receipt',
                      text: `Call on Demand - Data Bundle Receipt\nRef: ${vendResult.reference}\nPlan: ${vendResult.bundleName}\nRecipient: ${vendResult.recipient || recipientPhone}\nStatus: Settled via Monnify Gateway`
                    });
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1.5" /> Share
                </Button>
              </div>

              <Button
                className="w-full h-14 font-black text-xs rounded-xl bg-primary uppercase tracking-wider"
                onClick={() => {
                  setSelectedBundle(null);
                  setCurrentStep('SELECT');
                  router.replace('/services/data');
                }}
              >
                Search Another Bundle
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </PageTransition>
  )
}

export default function SearchDataBundlePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading data bundles...</p>
        </div>
      }
    >
      <SearchDataBundlePageContent />
    </Suspense>
  )
}

