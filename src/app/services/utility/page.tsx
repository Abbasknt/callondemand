"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  Wallet, 
  PhoneCall,
  ShieldCheck,
  Printer,
  Share2,
  Radio,
  ChevronRight,
  ChevronLeft,
  Search,
  Activity,
  Smartphone,
  RefreshCw,
  History,
  Timer,
  ZapOff,
  Navigation,
  X,
  Check,
  Tv,
  MapPin,
  Sparkles,
  SlidersHorizontal
} from "lucide-react"
import { buildBillerSearchIndex, searchIndexedBillers } from "@/lib/indexed-biller-search"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, limit, orderBy, query } from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { WalletBalanceDisplay } from "@/components/wallet-balance-display"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  getBillersByCategory, 
  getBillerProducts, 
  vendBillPayment,
  initMonnifyTransaction,
  searchNetworkBundles,
  initiateBundleCheckout
} from "@/actions/monnify"
import { triggerReceiptPrint, shareReceipt } from "@/lib/export-utils"
import { PageTransition } from "@/components/page-transition"
import { MotionalDealCard } from "@/components/promotions/motional-deal-card"

type Step = 'category' | 'config' | 'payment' | 'processing' | 'result';
type Category = 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'TV';

const CATEGORY_MAP: Record<Category, string> = {
  'AIRTIME': 'AIRTIME',
  'DATA': 'DATA_BUNDLE',
  'ELECTRICITY': 'ELECTRICITY_BILL',
  'TV': 'CABLE_TV'
};

const NETWORKS = [
  { id: "mtn", name: "MTN", color: "bg-[#FFCC00]", text: "text-black" },
  { id: "airtel", name: "Airtel", color: "bg-[#E30613]", text: "text-white" },
  { id: "glo", name: "Glo", color: "bg-[#00953A]", text: "text-white" },
  { id: "9mobile", name: "9mobile / 9ja", color: "bg-[#006838]", text: "text-white" },
];

const PREFIXES: Record<string, string> = {
  '0803': 'mtn', '0806': 'mtn', '0813': 'mtn', '0810': 'mtn', '0814': 'mtn', '0816': 'mtn', '0703': 'mtn', '0706': 'mtn', '0903': 'mtn', '0906': 'mtn', '0913': 'mtn', '0916': 'mtn', '0702': 'mtn', '0704': 'mtn',
  '0802': 'airtel', '0808': 'airtel', '0812': 'airtel', '0701': 'airtel', '0708': 'airtel', '0902': 'airtel', '0907': 'airtel', '0901': 'airtel', '0904': 'airtel', '0912': 'airtel', '0911': 'airtel',
  '0805': 'glo', '0807': 'glo', '0811': 'glo', '0815': 'glo', '0705': 'glo', '0905': 'glo', '0915': 'glo',
  '0809': '9mobile', '0817': '9mobile', '0818': '9mobile', '0909': '9mobile', '0908': '9mobile'
};

const QUICK_AMOUNTS = [200, 500, 1000, 2000, 5000];

export default function TopUpHub() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()
  
  const [currentStep, setCurrentStep] = useState<Step>('category')
  const [activeCategory, setActiveCategory] = useState<Category>("AIRTIME")
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
  
  const [billers, setBillers] = useState<any[]>([])
  const [variations, setVariations] = useState<any[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [customerId, setCustomerId] = useState("")
  const [amount, setAmount] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [dataFilter, setDataFilter] = useState("ALL")
  const [billerSearch, setBillerSearch] = useState("")
  const [billerTypeFilter, setBillerTypeFilter] = useState("ALL")
  
  const [vendResult, setVendResult] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  // Pre-computed indexed lookup table for instant sub-millisecond biller search
  const billerSearchIndex = useMemo(() => {
    return buildBillerSearchIndex(billers);
  }, [billers]);

  // Scored indexed results
  const filteredBillers = useMemo(() => {
    return searchIndexedBillers(billerSearchIndex, {
      query: billerSearch,
      typeFilter: billerTypeFilter,
    });
  }, [billerSearchIndex, billerSearch, billerTypeFilter]);

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const recentTxsRef = useMemoFirebase(() => {
    if (!walletRef) return null;
    return query(
      collection(walletRef, 'transactions'),
      orderBy('transactionDate', 'desc'),
      limit(5)
    );
  }, [walletRef]);
  const { data: recentTxs } = useCollection(recentTxsRef);

  const topUpTxs = useMemo(() => {
    if (!recentTxs) return [];
    return recentTxs.filter(tx => tx.description?.toLowerCase().includes('top-up'));
  }, [recentTxs]);

  const handleSelectCategory = useCallback((cat: Category) => {
    setActiveCategory(cat);
    setSelectedNetwork(null);
    setSelectedProduct(null);
    setVariations([]);
    setBillerSearch("");
    setBillerTypeFilter("ALL");
    setAmount("");
    setCurrentStep('config');
  }, []);

  const syncVariationsForBiller = useCallback(async (biller: any) => {
    const billerName = biller.name || biller.billerName || biller.billerCode || '';
    const billerCode = biller.billerCode || biller.code || '';
    setSelectedNetwork(billerName);
    setSelectedProduct(null);
    if (activeCategory === 'AIRTIME') setAmount("");
    
    setIsVerifying(true);
    try {
      const result = await getBillerProducts(billerCode);
      if (result && result.success) {
        const filtered = result.response.filter((p: any) => {
          const pCatCode = p.category?.code || '';
          const pCatName = p.category?.name || '';
          const targetCat = CATEGORY_MAP[activeCategory];
          const pBillerName = (p.biller?.name || p.biller?.billerName || '').toLowerCase();
          const pBillerCode = (p.biller?.code || p.biller?.billerCode || '').toLowerCase();
          
          return (pCatCode === targetCat || pCatName === targetCat || pCatCode === 'DATA_BUNDLE' || pCatCode === 'DATA' || pCatName === 'DATA') &&
                 (pBillerName.includes(billerName.toLowerCase()) || pBillerCode === billerCode.toLowerCase() || p.billerCode === billerCode);
        });
        setVariations(filtered.length > 0 ? filtered : result.response);
        
        if (activeCategory === 'ELECTRICITY' && filtered.length > 0) {
          setSelectedProduct(filtered[0]);
        }
      } else {
        toast({ title: "Sync Protocol Failed", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Gateway Handshake Error", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  }, [activeCategory, toast]);

  const syncVariationsForNetwork = useCallback(async (networkId: string) => {
    setSelectedNetwork(networkId);
    setSelectedProduct(null);
    setVariations([]);
    if (activeCategory === 'AIRTIME') setAmount("");
    
    const targetBillers = billers.filter(b => {
      const name = (b.name || b.billerName || "").toLowerCase();
      const code = (b.billerCode || b.code || "").toLowerCase();
      const net = networkId.toLowerCase();
      if (name.includes(net) || code.includes(net)) return true;
      if (net === '9mobile' && (name.includes('9mobile') || name.includes('etisalat') || name.includes('emts'))) return true;
      if (net === 'airtel' && name.includes('airtel')) return true;
      if (net === 'mtn' && name.includes('mtn')) return true;
      if (net === 'glo' && (name.includes('glo') || name.includes('globacom'))) return true;
      return false;
    });
    
    const defaultBillerCode = networkId === 'glo' ? 'BIL003' : networkId === 'airtel' ? 'BIL002' : networkId === '9mobile' ? 'BIL004' : 'BIL001';
    const effectiveBillers = targetBillers.length > 0 ? targetBillers : [{ billerCode: defaultBillerCode, billerName: `${networkId.toUpperCase()} Nigeria`, name: `${networkId.toUpperCase()} Nigeria`, code: defaultBillerCode }];

    if (activeCategory === 'DATA' || activeCategory === 'AIRTIME') {
      setIsVerifying(true);
      try {
        let allProducts: any[] = [];
        
        if (activeCategory === 'DATA') {
          const bundleRes = await searchNetworkBundles({ network: networkId });
          if (bundleRes && bundleRes.success && bundleRes.response && bundleRes.response.length > 0) {
            allProducts = bundleRes.response;
          }
        }

        if (allProducts.length === 0) {
          await Promise.all(effectiveBillers.map(async (targetBiller) => {
            const result = await getBillerProducts(targetBiller.code || targetBiller.billerCode);
            if (result && result.success) {
              const categoryProducts = result.response.filter((p: any) => {
                const pCatCode = p.category?.code || '';
                const pCatName = p.category?.name || '';
                const targetCat = CATEGORY_MAP[activeCategory];
                
                const isCatMatch = pCatCode === targetCat || pCatName === targetCat || 
                                 (activeCategory === 'DATA' && (pCatCode === 'DATA' || pCatCode === 'DATA_BUNDLE' || pCatName === 'DATA'));
                
                const isNetworkMatch = (p.biller?.name || '').toLowerCase().includes((targetBiller.name || '').toLowerCase()) || 
                                     (p.biller?.code || '').toLowerCase() === (targetBiller.code || targetBiller.billerCode)?.toLowerCase() || 
                                     (p.name || '').toLowerCase().includes((targetBiller.name || '').toLowerCase());
                return isCatMatch && isNetworkMatch;
              });
              allProducts = [...allProducts, ...(categoryProducts.length > 0 ? categoryProducts : result.response)];
            }
          }));
        }

        setVariations(allProducts);
        // Auto-select for Airtime since we don't show a list for it in network mode
        if (activeCategory === 'AIRTIME' && allProducts.length > 0) {
          setSelectedProduct(allProducts[0]);
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Gateway Handshake Error", variant: "destructive" });
      } finally {
        setIsVerifying(false);
      }
    }
  }, [activeCategory, billers, toast]);

  useEffect(() => {
    if (profile?.phoneNumber && !customerId) {
      setCustomerId(profile.phoneNumber);
    }
  }, [profile, customerId]);

  useEffect(() => {
    let isSubscribed = true;

    async function syncBillers() {
      if (currentStep === 'config' || currentStep === 'category') {
        const categoriesToFetch = activeCategory === 'DATA' ? ['DATA_BUNDLE', 'DATA'] : [CATEGORY_MAP[activeCategory]];
        let allBillers: any[] = [];
        
        try {
          const results = await Promise.all(categoriesToFetch.map(async (cat) => {
            return await getBillersByCategory(cat);
          }));
          
          results.forEach(result => {
             if (result && result.success) {
               allBillers = [...allBillers, ...result.response];
             }
          });
          
          if (!isSubscribed) return;

          // De-duplicate by code
          const uniqueBillers = Array.from(new Map(allBillers.map(b => [b.billerCode || b.code, b])).values());
          setBillers(uniqueBillers);

          if (selectedNetwork && (activeCategory === 'DATA' || activeCategory === 'AIRTIME')) {
              if (activeCategory === 'DATA') {
                const bundleRes = await searchNetworkBundles({ network: selectedNetwork });
                if (bundleRes && bundleRes.success && bundleRes.response && bundleRes.response.length > 0) {
                  if (!isSubscribed) return;
                  setVariations(bundleRes.response);
                  setSelectedProduct(null);
                  return;
                }
              }

              const targetBillers = uniqueBillers.filter((b: any) => {
                const name = (b.name || b.billerName || '').toLowerCase();
                const code = (b.billerCode || b.code || '').toLowerCase();
                const net = selectedNetwork.toLowerCase();
                if (name.includes(net) || code.includes(net)) return true;
                if (net === '9mobile' && (name.includes('9mobile') || name.includes('etisalat') || name.includes('emts'))) return true;
                if (net === 'airtel' && name.includes('airtel')) return true;
                if (net === 'mtn' && name.includes('mtn')) return true;
                if (net === 'glo' && (name.includes('glo') || name.includes('globacom'))) return true;
                return false;
              });
              
              if (targetBillers.length > 0) {
                setIsVerifying(true);
                try {
                  let allProducts: any[] = [];
                  await Promise.all(targetBillers.map(async (targetBiller: any) => {
                    const prodResult = await getBillerProducts(targetBiller.code || targetBiller.billerCode);
                    if (prodResult && prodResult.success) {
                      const categoryProducts = prodResult.response.filter((p: any) => {
                        const pCatCode = p.category?.code || '';
                        const pCatName = p.category?.name || '';
                        const targetCat = CATEGORY_MAP[activeCategory];
                        
                        const isCatMatch = pCatCode === targetCat || pCatName === targetCat || 
                                         (activeCategory === 'DATA' && (pCatCode === 'DATA' || pCatCode === 'DATA_BUNDLE' || pCatName === 'DATA'));
                        
                        const isNetworkMatch = p.biller?.name?.toLowerCase().includes(targetBiller.name.toLowerCase()) || 
                                             p.biller?.code?.toLowerCase() === (targetBiller.code || targetBiller.billerCode)?.toLowerCase() || 
                                             p.name?.toLowerCase().includes(targetBiller.name.toLowerCase());
                        return isCatMatch && isNetworkMatch;
                      });
                      allProducts = [...allProducts, ...categoryProducts];
                    }
                  }));
                  if (!isSubscribed) return;
                  setVariations(allProducts);
                  if (activeCategory === 'AIRTIME' && allProducts.length > 0) {
                    setSelectedProduct(allProducts[0]);
                  } else {
                    setSelectedProduct(null);
                  }
                } catch (e) {
                  console.error(e);
                  if (isSubscribed) setVariations([]);
                } finally {
                  if (isSubscribed) setIsVerifying(false);
                }
              }
           }
        } catch (e) {
          console.error("Biller Sync Error:", e);
        }
      }
    }
    syncBillers();
    return () => { isSubscribed = false; };
  }, [activeCategory, currentStep, selectedNetwork]);

  useEffect(() => {
    if (activeCategory !== 'AIRTIME' && activeCategory !== 'DATA') return;
    const currentCustomerId = customerId;
    if (currentCustomerId.length >= 4) {
      const prefix = currentCustomerId.slice(0, 4);
      const detected = PREFIXES[prefix];
      if (detected && detected !== selectedNetwork) {
        syncVariationsForNetwork(detected);
      }
    }
  }, [customerId, activeCategory, selectedNetwork, syncVariationsForNetwork]);

  const filteredVariations = useMemo(() => {
    let result = variations;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(q));
    }
    
    if (activeCategory === 'DATA' && dataFilter !== 'ALL') {
      const q = dataFilter.toLowerCase();
      result = result.filter(v => {
        const name = (v.name || '').toLowerCase();
        const duration = (v.metadata?.durationUnit || '').toLowerCase();
        
        const textToMatch = `${name} ${duration}`;
        
        if (q === 'daily') {
          return textToMatch.match(/\b(daily|1 day|2 days?|day|3 days?)\b/i) && !textToMatch.match(/\b(7 days?|30 days?|14 days?|week|weekly|month|monthly)\b/i);
        }
        if (q === 'weekly') {
          return textToMatch.match(/\b(weekly|week|7 days?|14 days?)\b/i);
        }
        if (q === 'monthly') {
          return textToMatch.match(/\b(monthly|months?|30 days?)\b/i);
        }
        return true;
      });
    }
    return result;
  }, [variations, productSearch, activeCategory, dataFilter]);

  const handleProceedToPayment = () => {
    if (!customerId || 
        ((activeCategory === 'AIRTIME' || activeCategory === 'ELECTRICITY') && !amount) || 
        ((activeCategory === 'DATA' || activeCategory === 'TV') && !selectedProduct)
    ) return;
    setCurrentStep('payment');
  };

  const handleFinalVend = async () => {
    if (!user || !wallet || !selectedNetwork) return;
    
    // Anti-crash guard for product selection
    if ((activeCategory === 'DATA' || activeCategory === 'TV') && !selectedProduct) {
      toast({ title: "Selection Missing", description: "Please select a plan before proceeding.", variant: "destructive" });
      setCurrentStep('config');
      return;
    }

    const finalAmount = (activeCategory === 'DATA' || activeCategory === 'TV') ? Number(selectedProduct.price || selectedProduct.amount) : Number(amount);
    
    if (wallet.balance < finalAmount) {
      toast({ title: "Insufficient Balance", variant: "destructive" });
      return;
    }

    setCurrentStep('processing');
    
    let targetBiller = billers.find(b => {
      const name = (b.name || b.billerName || "").toLowerCase();
      const code = (b.billerCode || b.code || "").toLowerCase();
      const net = selectedNetwork.toLowerCase();
      if (name.includes(net) || code.includes(net)) return true;
      if (net === '9mobile' && (name.includes('9mobile') || name.includes('etisalat') || name.includes('emts'))) return true;
      if (net === 'airtel' && name.includes('airtel')) return true;
      if (net === 'mtn' && name.includes('mtn')) return true;
      if (net === 'glo' && (name.includes('glo') || name.includes('globacom'))) return true;
      return false;
    });

    if (!targetBiller) {
      const netLower = selectedNetwork.toLowerCase();
      let defaultCode = 'BIL001';
      let defaultName = `${selectedNetwork.toUpperCase()} Nigeria`;

      if (netLower.includes('mtn')) {
        defaultCode = 'BIL001';
        defaultName = 'MTN Nigeria';
      } else if (netLower.includes('airtel')) {
        defaultCode = 'BIL002';
        defaultName = 'Airtel Nigeria';
      } else if (netLower.includes('glo')) {
        defaultCode = 'BIL003';
        defaultName = 'Glo Nigeria';
      } else if (netLower.includes('9mobile') || netLower.includes('etisalat') || netLower.includes('emts')) {
        defaultCode = 'BIL004';
        defaultName = '9mobile';
      } else if (activeCategory === 'TV') {
        defaultCode = 'BIL005';
        defaultName = 'DSTV Nigeria';
      } else if (activeCategory === 'ELECTRICITY') {
        defaultCode = 'BIL006';
        defaultName = 'IKEDC Electricity';
      }

      targetBiller = {
        billerCode: defaultCode,
        code: defaultCode,
        billerName: defaultName,
        name: defaultName
      };
    }

    const reference = `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const result = await vendBillPayment({
      productCode: (selectedProduct?.code || selectedProduct?.productCode || targetBiller.billerCode || targetBiller.code || 'PRD100'),
      customerId: customerId,
      amount: finalAmount,
      paymentReference: reference,
      billerCode: targetBiller.billerCode || targetBiller.code || 'BIL001',
      emailAddress: user.email || ''
    });

    if (result && result.success) {
      const body = result.response;
      const finalRef = body.transactionReference || reference;
      const newBalance = wallet.balance - finalAmount;
      
      setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });
      
      addDocumentNonBlocking(collection(walletRef!, 'transactions'), {
        type: 'Payment', 
        category: activeCategory.toLowerCase(),
        serviceType: 'utility',
        amount: finalAmount, 
        description: `Top-up: ${selectedNetwork.toUpperCase()} ${activeCategory} to ${customerId}`, 
        transactionDate: new Date().toISOString(), 
        status: 'Completed', 
        reference: finalRef,
        vendReference: body?.vendReference ?? body?.transactionReference ?? null
      });

      setVendResult({ 
        ...body, 
        finalAmount, 
        reference: finalRef
      });
      setCurrentStep('result');
    } else {
      toast({ title: "Fulfillment Error", description: result?.error || "An unknown error occurred.", variant: "destructive" });
      setCurrentStep('payment');
    }
  };

  if (!mounted) return null;

  return (
    <PageTransition>
      <div className="space-y-4 pb-20 max-w-xl mx-auto px-2">
        <div className="flex justify-between items-center px-2 py-2 no-print">
          <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" /> Top-up Hub
          </h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full h-9 px-4 text-[9px] font-black uppercase border-primary/20 hover:bg-primary/5 transition-colors gap-2"
              onClick={() => router.push('/wallet')}
            >
              <Wallet className="h-3.5 w-3.5 text-primary" /> Fund
            </Button>
            <WalletBalanceDisplay balance={wallet?.balance} badgeStyle className="bg-white border shadow-sm text-primary" />
          </div>
        </div>

        {currentStep === 'category' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Motional Live Deal Card */}
            <MotionalDealCard />

            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => handleSelectCategory("AIRTIME")}>
                <div className="h-1.5 bg-primary" />
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <PhoneCall className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-black tracking-tighter uppercase text-primary leading-tight">Airtime</h3>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none opacity-60">Instant Recharge</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => handleSelectCategory("DATA")}>
                <div className="h-1.5 bg-accent" />
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-black tracking-tighter uppercase text-accent leading-tight">Data</h3>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none opacity-60">High-Speed</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => handleSelectCategory("ELECTRICITY")}>
                <div className="h-1.5 bg-yellow-500" />
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-black tracking-tighter uppercase text-yellow-600 leading-tight">Electricity</h3>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none opacity-60">Meter Top-up</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => handleSelectCategory("TV")}>
                <div className="h-1.5 bg-purple-500" />
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-black tracking-tighter uppercase text-purple-600 leading-tight">Cable TV</h3>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none opacity-60">Subscription</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {topUpTxs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Activity</h4>
                  <History className="h-3.5 w-3.5 text-muted-foreground opacity-30" />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-2">
                  {topUpTxs.map((tx: any, idx: number) => {
                    const networkName = tx.description.match(/mtn|airtel|glo|9mobile/i)?.[0]?.toLowerCase();
                    const network = NETWORKS.find(n => n.id === networkName);
                    const txId = tx.id || `recent-tx-${idx}`;
                    return (
                      <Card 
                        key={txId} 
                        className="min-w-[140px] p-4 rounded-2xl border-none shadow-lg bg-card/50 flex flex-col items-center text-center gap-2 cursor-pointer hover:bg-card transition-colors"
                        onClick={() => {
                          const isData = tx.description.toLowerCase().includes('data');
                          setActiveCategory(isData ? 'DATA' : 'AIRTIME');
                          const phoneMatch = tx.description.match(/\b\d{10,14}\b/);
                          if (phoneMatch) setCustomerId(phoneMatch[0]);
                          setCurrentStep('config');
                        }}
                      >
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-black text-xs", network?.color, network?.text)}>
                          {networkName?.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[100px]">{tx.description.split(':')[1] || 'Utility'}</p>
                          <p className="text-[9px] font-bold text-primary">₦{tx.amount.toLocaleString()}</p>
                        </div>
                        <p className="text-[7px] font-black uppercase text-muted-foreground/40">{new Date(tx.transactionDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'config' && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-card">
            <div className={cn("h-2", activeCategory === 'DATA' ? "bg-accent" : "bg-primary")} />
            <CardHeader className="bg-muted/5 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter">{activeCategory}</CardTitle>
                <p className="text-[10px] font-black uppercase tracking-widest">Production Hub Session</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep('category')} className="rounded-xl h-9 px-4 uppercase text-[10px] font-black gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                  {activeCategory === 'ELECTRICITY' ? '1. Meter Number' : activeCategory === 'TV' ? '1. Smart Card Number' : '1. Recipient Line'}
                </label>
                <div className="relative">
                  <Input 
                    value={customerId} 
                    onChange={(e) => setCustomerId(e.target.value.replace(/\D/g, ''))} 
                    placeholder={activeCategory === 'AIRTIME' || activeCategory === 'DATA' ? "080..." : "Enter ID..."}
                    className="h-16 pl-6 rounded-2xl border-2 font-black text-2xl tracking-[0.15em] focus:border-primary"
                  />
                  {selectedNetwork && (activeCategory === 'AIRTIME' || activeCategory === 'DATA') && (
                    <Badge className={cn("absolute right-4 top-1/2 -translate-y-1/2 border-none font-black text-[10px] h-8 px-4 rounded-xl shadow-lg", NETWORKS.find(n => n.id === selectedNetwork)?.color, NETWORKS.find(n => n.id === selectedNetwork)?.text)}>
                      {selectedNetwork.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1 text-primary">2. Select Provider</label>
                {(activeCategory === 'AIRTIME' || activeCategory === 'DATA') ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {NETWORKS.map(net => (
                      <Button 
                        key={net.id}
                        variant="outline"
                        onClick={() => syncVariationsForNetwork(net.id)}
                        className={cn(
                          "h-16 rounded-2xl border-2 font-black text-xs uppercase flex flex-col gap-1 transition-all",
                          selectedNetwork === net.id ? 
                            `${net.color} ${net.text} border-transparent shadow-lg scale-[1.05]` : 
                            "bg-white hover:border-primary/50"
                        )}
                      >
                        <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border", selectedNetwork === net.id ? "border-white/20" : "bg-muted")}>
                           {net.name.slice(0,1)}
                        </div>
                        {net.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Indexed Client-Side Search Bar & Count Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          {activeCategory === 'ELECTRICITY' ? 'Electricity Distribution Companies (DisCos)' : 'Cable & TV Service Providers'}
                        </span>
                      </div>
                      {billers.length > 0 && (
                        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>
                            {filteredBillers.length === billers.length
                              ? `${billers.length} Providers Available`
                              : `Showing ${filteredBillers.length} of ${billers.length}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Instant Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                      <Input 
                        id="biller-search-input"
                        type="text" 
                        placeholder={
                          activeCategory === 'ELECTRICITY' 
                            ? "Search DisCos (e.g. Ikeja, Eko, Abuja, Kano, IBEDC, Prepaid, Lagos)..." 
                            : activeCategory === 'TV' 
                            ? "Search TV billers (e.g. DStv, GOtv, StarTimes, Showmax)..." 
                            : "Search utility billers by name, state, or code..."
                        }
                        value={billerSearch} 
                        onChange={(e) => setBillerSearch(e.target.value)} 
                        className="h-13 pl-11 pr-10 rounded-2xl border-2 text-xs font-semibold focus:border-primary bg-background shadow-xs transition-all"
                      />
                      {billerSearch && (
                        <button
                          type="button"
                          onClick={() => setBillerSearch("")}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground flex items-center justify-center transition-colors"
                          title="Clear search"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Quick Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      {activeCategory === 'ELECTRICITY' && [
                        { id: 'ALL', label: 'All DisCos' },
                        { id: 'POPULAR', label: 'Popular' },
                        { id: 'PREPAID', label: 'Prepaid Token' },
                        { id: 'POSTPAID', label: 'Postpaid' },
                      ].map(tab => (
                        <Button
                          key={tab.id}
                          type="button"
                          size="sm"
                          variant={billerTypeFilter === tab.id ? "default" : "outline"}
                          onClick={() => setBillerTypeFilter(tab.id)}
                          className={cn(
                            "h-7 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0 transition-all",
                            billerTypeFilter === tab.id ? "shadow-xs" : "bg-card hover:bg-muted"
                          )}
                        >
                          {tab.label}
                        </Button>
                      ))}

                      {activeCategory === 'TV' && [
                        { id: 'ALL', label: 'All TV Services' },
                        { id: 'POPULAR', label: 'Popular' },
                        { id: 'CABLE', label: 'Satellite & Cable' },
                        { id: 'STREAMING', label: 'Streaming' },
                      ].map(tab => (
                        <Button
                          key={tab.id}
                          type="button"
                          size="sm"
                          variant={billerTypeFilter === tab.id ? "default" : "outline"}
                          onClick={() => setBillerTypeFilter(tab.id)}
                          className={cn(
                            "h-7 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0 transition-all",
                            billerTypeFilter === tab.id ? "shadow-xs" : "bg-card hover:bg-muted"
                          )}
                        >
                          {tab.label}
                        </Button>
                      ))}
                    </div>

                    {/* Fast Filtered Biller Grid */}
                    {filteredBillers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                        {filteredBillers.map(biller => {
                          const isSelected = selectedNetwork === biller.name || selectedNetwork === biller.billerName;
                          return (
                            <button
                              key={biller.billerCode || biller.code}
                              type="button"
                              onClick={() => syncVariationsForBiller(biller)}
                              className={cn(
                                "relative p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 group",
                                isSelected 
                                  ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20 scale-[1.01]" 
                                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/5 hover:shadow-xs"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 w-full">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                    isSelected 
                                      ? "bg-primary text-white shadow-xs" 
                                      : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                  )}>
                                    {activeCategory === 'ELECTRICITY' ? (
                                      <Activity className="h-5 w-5" />
                                    ) : activeCategory === 'TV' ? (
                                      <Tv className="h-5 w-5" />
                                    ) : (
                                      <Smartphone className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-black text-foreground tracking-tight leading-snug line-clamp-1">
                                      {biller.name || biller.billerName}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {biller.billerCode && (
                                        <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase bg-muted/80 px-1.5 py-0.5 rounded">
                                          {biller.billerCode}
                                        </span>
                                      )}
                                      {biller.popular && (
                                        <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                          Popular
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>

                              {biller.region && (
                                <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground/80 truncate">
                                  <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
                                  <span className="truncate">{biller.region}</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl border-2 border-dashed border-muted-foreground/20 text-center space-y-3 bg-muted/5">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Search className="h-5 w-5 opacity-40" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">No matching billers found</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            No provider matched &quot;{billerSearch}&quot;.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBillerSearch("");
                            setBillerTypeFilter("ALL");
                          }}
                          className="rounded-xl text-[10px] font-black uppercase h-8 px-4"
                        >
                          Clear Filter
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedNetwork && (
                <div className="space-y-4 animate-in fade-in">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                    {activeCategory === 'AIRTIME' ? '3. Recharge Value' : activeCategory === 'ELECTRICITY' ? '3. Purchase Amount' : activeCategory === 'TV' ? '3. Select TV Bouquet' : '3. Select Data Plan'}
                  </label>
                  
                  {(activeCategory === 'AIRTIME' || activeCategory === 'ELECTRICITY') ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl text-muted-foreground opacity-30">₦</span>
                        <Input 
                          type="number" 
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)} 
                          placeholder="0.00" 
                          className="h-16 pl-10 text-xl font-black rounded-xl border-2"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {QUICK_AMOUNTS.map(amt => (
                          <Button key={amt} variant="outline" size="sm" onClick={() => setAmount(amt.toString())} className="h-10 rounded-lg text-[9px] font-black">₦{amt}</Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
                        <Input placeholder="Search bundles (e.g. 1GB, Monthly)..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="h-14 pl-12 rounded-2xl border-2 text-sm font-black uppercase tracking-tight" />
                      </div>
                      
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-4">
                        {['ALL', 'DAILY', 'WEEKLY', 'MONTHLY'].map(f => (
                          <Button
                            key={f}
                            variant={dataFilter === f ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDataFilter(f)}
                            className={cn("h-8 rounded-full text-[9px] font-black uppercase min-w-[70px]", dataFilter === f ? "bg-primary text-white" : "text-muted-foreground")}
                          >
                            {f}
                          </Button>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {isVerifying ? (
                          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
                            <RefreshCw className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gateway Handshake...</p>
                          </div>
                        ) : filteredVariations.length > 0 ? (
                          filteredVariations.map((v: any, vIdx: number) => (
                            <button
                              key={v.code || v.productCode || `v-${vIdx}`}
                              onClick={() => setSelectedProduct(v)}
                              className={cn(
                                "w-full p-4 rounded-2xl border-2 transition-all flex flex-col items-start justify-between gap-3 group text-left",
                                (selectedProduct?.code || selectedProduct?.productCode) === (v.code || v.productCode)
                                  ? "border-primary bg-primary/5 shadow-md"
                                  : "border-muted bg-white hover:border-primary/30"
                              )}
                            >
                              <div className="w-full flex items-center justify-between">
                                <div className={cn(
                                  "h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs",
                                  (selectedProduct?.code || selectedProduct?.productCode) === (v.code || v.productCode) ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                )}>
                                  <Zap className="h-4 w-4" />
                                </div>
                                <div className={cn(
                                  "h-2 w-2 rounded-full",
                                  (selectedProduct?.code || selectedProduct?.productCode) === (v.code || v.productCode) ? "bg-primary animate-ping" : "bg-transparent"
                                )} />
                              </div>
                              <div className="w-full space-y-1">
                                <p className="text-[11px] font-black uppercase tracking-tight leading-[1.2] line-clamp-2">{v.name}</p>
                                {v.metadata && (
                                  <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60">
                                    {v.metadata.volume ? `${v.metadata.volume}MB` : ''} {v.metadata.durationUnit || ''}
                                  </p>
                                )}
                                <p className="text-sm font-black text-primary pt-1">₦{(v.price || v.amount)?.toLocaleString()}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="col-span-full py-10 text-center space-y-2 grayscale opacity-40">
                             <ZapOff className="h-10 w-10 mx-auto" />
                             <p className="text-[10px] font-black uppercase">No Bundles Found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-8 bg-muted/5 border-t">
              <Button 
                onClick={handleProceedToPayment} 
                disabled={!selectedNetwork || isVerifying || !customerId || ((activeCategory === 'DATA' || activeCategory === 'TV') && !selectedProduct) || ((activeCategory === 'AIRTIME' || activeCategory === 'ELECTRICITY') && !amount)}
                className="w-full h-16 text-lg font-black rounded-2xl bg-primary shadow-xl uppercase gap-2"
              >
                Verify Session <ChevronRight className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'payment' && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-card animate-in zoom-in-95">
            <CardHeader className="bg-muted/5 p-10 text-center border-b">
              <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-4 shadow-inner">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <CardTitle className="text-3xl font-black uppercase tracking-tighter">Settlement</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest mt-2">Authorized Handshake</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="bg-muted/30 p-8 rounded-[2rem] border-4 border-dashed space-y-6">
                <div className="flex justify-between items-center border-b border-black/5 pb-4">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Hub Protocol</span>
                  <span className="text-xs font-black uppercase">{selectedNetwork?.toUpperCase()} {activeCategory}</span>
                </div>
                <div className="flex justify-between items-center border-b border-black/5 pb-4">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Target Line</span>
                  <span className="text-sm font-black tracking-widest text-primary">{customerId}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Settlement Value</span>
                  <span className="text-4xl font-black text-primary tracking-tighter">
                    ₦{((activeCategory === 'DATA' || activeCategory === 'TV') ? Number(selectedProduct.price || selectedProduct.amount) : Number(amount)).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-10 bg-muted/5 border-t flex flex-col gap-4">
              {wallet && wallet.balance < ((activeCategory === 'DATA' || activeCategory === 'TV') ? Number(selectedProduct.price || selectedProduct.amount) : Number(amount)) ? (
                <div className="w-full space-y-3">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left">
                    <p className="text-[10px] font-black uppercase text-amber-800">Insufficient Wallet Balance</p>
                    <p className="text-[9px] font-medium text-amber-700 mt-0.5">
                      Your funded wallet balance is ₦{(wallet.balance || 0).toLocaleString()}. You need ₦{(((activeCategory === 'DATA' || activeCategory === 'TV') ? Number(selectedProduct.price || selectedProduct.amount) : Number(amount)) - (wallet.balance || 0)).toLocaleString()} more to settle this transaction.
                    </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      const finalVal = (activeCategory === 'DATA' || activeCategory === 'TV') ? Number(selectedProduct.price || selectedProduct.amount) : Number(amount);
                      const topUpVal = Math.max(finalVal - wallet.balance, 500);
                      const ref = `COD-TOPUP-${Date.now()}`;
                      const res = await initMonnifyTransaction({
                        amount: topUpVal,
                        customerEmail: user?.email || '',
                        customerName: user?.displayName || 'COD Partner',
                        paymentReference: ref,
                        paymentDescription: `Wallet Top-Up for ${activeCategory}`,
                        redirectUrl: `${window.location.origin}/wallet/callback?amount=${topUpVal}`
                      });
                      if (res && res.success && res.response?.checkoutUrl) {
                        toast({ title: "Redirecting to Monnify", description: "Authorizing wallet top-up..." });
                        window.location.href = res.response.checkoutUrl;
                      } else {
                        toast({ title: "Gateway Error", description: res?.error || "Could not initialize Monnify funding.", variant: "destructive" });
                      }
                    }}
                    className="w-full h-16 rounded-xl font-black text-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xl uppercase tracking-wider"
                  >
                    Fund Wallet via Monnify
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleFinalVend} 
                  disabled={!wallet}
                  className="w-full h-16 rounded-xl font-black text-xl bg-primary shadow-xl"
                >
                  Confirm & Pay via Wallet
                </Button>
              )}
              <Button variant="ghost" onClick={() => setCurrentStep('config')} className="text-[10px] font-black uppercase tracking-widest opacity-40">Cancel</Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 'processing' && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl py-24 text-center space-y-8 animate-pulse">
            <Loader2 className="h-20 w-20 animate-spin text-primary mx-auto opacity-20" />
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Synchronizing</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vending via Monnify Gateway...</p>
            </div>
          </Card>
        )}

        {currentStep === 'result' && (
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white no-print">
            <div className="h-3 bg-green-500" />
            <CardContent className="p-10 flex flex-col items-center text-center space-y-8">
              <div className="h-20 w-20 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center shadow-xl">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Success</h3>
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[9px]">Handshake Complete</p>
              </div>
              <div className="w-full bg-muted/5 p-8 rounded-[2rem] border-4 border-dashed text-left space-y-4">
                <div className="flex justify-between border-b border-black/5 pb-3">
                  <span className="text-[9px] uppercase font-black opacity-40">Ref</span>
                  <span className="font-mono text-[10px] font-black uppercase">{vendResult?.reference}</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <div>
                    <span className="text-[9px] uppercase font-black opacity-40">Hub</span>
                    <p className="font-black text-xs uppercase">{selectedNetwork?.toUpperCase()} {activeCategory}</p>
                  </div>
                  <span className="text-3xl font-black text-primary">₦{vendResult?.finalAmount?.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-full grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-14 font-black text-[10px] rounded-xl border-2 uppercase" onClick={() => triggerReceiptPrint()}>
                  <Printer className="h-4 w-4 mr-2" /> Receipt
                </Button>
                <Button variant="outline" className="h-14 font-black text-[10px] rounded-xl border-2 uppercase" onClick={() => {
                  shareReceipt({
                    title: 'COD Top-up Receipt',
                    text: `Call on Demand - Top-up Hub\nRef: ${vendResult.reference}\nValue: ₦${vendResult.finalAmount.toLocaleString()}\nStatus: Settled`
                  });
                }}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
              <Button className="w-full h-14 font-black text-[10px] rounded-xl bg-primary uppercase tracking-widest" onClick={() => setCurrentStep('category')}>New Top-up</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
