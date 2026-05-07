"use client"

import { useState, useEffect, useMemo } from "react"
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
  Navigation
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, limit, orderBy, query } from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  getBillersByCategory, 
  getBillerProducts, 
  vendBillPayment 
} from "@/actions/monnify"
import { triggerReceiptPrint, shareReceipt } from "@/lib/export-utils"
import { PageTransition } from "@/components/page-transition"

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
  { id: "9mobile", name: "9mobile", color: "bg-[#006838]", text: "text-white" },
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
  
  const [vendResult, setVendResult] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

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

  useEffect(() => {
    if (profile?.phoneNumber && !customerId) {
      setCustomerId(profile.phoneNumber);
    }
  }, [profile]);

  useEffect(() => {
    async function syncBillers() {
      if (currentStep === 'config' || currentStep === 'category') {
        const result = await getBillersByCategory(CATEGORY_MAP[activeCategory]);
        if (result && result.success) setBillers(result.response);
      }
    }
    syncBillers();
  }, [activeCategory, currentStep]);

  useEffect(() => {
    if (activeCategory !== 'AIRTIME' && activeCategory !== 'DATA') return;
    if (customerId.length >= 4) {
      const prefix = customerId.slice(0, 4);
      const detected = PREFIXES[prefix];
      if (detected && detected !== selectedNetwork) {
        syncVariationsForNetwork(detected);
      }
    }
  }, [customerId, activeCategory]);

  const syncVariationsForBiller = async (biller: any) => {
    setSelectedNetwork(biller.name);
    setSelectedProduct(null);
    if (activeCategory === 'AIRTIME') setAmount("");
    
    setIsVerifying(true);
    try {
      const result = await getBillerProducts(biller.billerCode);
      if (result && result.success) {
        setVariations(result.response);
      } else {
        toast({ title: "Sync Protocol Failed", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Gateway Handshake Error", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const syncVariationsForNetwork = async (networkId: string) => {
    setSelectedNetwork(networkId);
    setSelectedProduct(null);
    if (activeCategory === 'AIRTIME') setAmount("");
    
    const targetBiller = billers.find(b => 
      b.name.toLowerCase().includes(networkId.toLowerCase()) || 
      (networkId === '9mobile' && b.name.toLowerCase().includes('9mobile'))
    );
    
    if ((activeCategory === 'DATA' || activeCategory === 'AIRTIME') && targetBiller) {
      setIsVerifying(true);
      try {
        const result = await getBillerProducts(targetBiller.billerCode);
        if (result && result.success) {
          setVariations(result.response);
          // Auto-select for Airtime since we don't show a list
          if (activeCategory === 'AIRTIME' && result.response.length > 0) {
            setSelectedProduct(result.response[0]);
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
    }
  };

  const filteredVariations = useMemo(() => {
    if (!productSearch) return variations;
    const q = productSearch.toLowerCase();
    return variations.filter(v => v.name.toLowerCase().includes(q));
  }, [variations, productSearch]);

  const handleProceedToPayment = () => {
    if (!customerId || (activeCategory === 'AIRTIME' && !amount) || (activeCategory === 'DATA' && !selectedProduct)) return;
    setCurrentStep('payment');
  };

  const handleFinalVend = async () => {
    if (!user || !wallet || !selectedNetwork) return;
    const finalAmount = activeCategory === 'DATA' ? Number(selectedProduct.price || selectedProduct.amount) : Number(amount);
    
    if (wallet.balance < finalAmount) {
      toast({ title: "Insufficient Balance", variant: "destructive" });
      return;
    }

    setCurrentStep('processing');
    
    const targetBiller = billers.find(b => 
      b.name.toLowerCase().includes(selectedNetwork.toLowerCase()) ||
      (selectedNetwork === '9mobile' && b.name.toLowerCase().includes('9mobile'))
    );

    if (!targetBiller) {
      toast({ title: "Operator Mapping Error", variant: "destructive" });
      setCurrentStep('payment');
      return;
    }

    const reference = `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const result = await vendBillPayment({
      productCode: (selectedProduct?.code || selectedProduct?.productCode || targetBiller.billerCode),
      customerId: customerId,
      amount: finalAmount,
      paymentReference: reference,
      billerCode: targetBiller.billerCode,
      emailAddress: user.email || ''
    });

    if (result && result.success) {
      const body = result.response;
      const finalRef = body.transactionReference || reference;
      const newBalance = wallet.balance - finalAmount;
      
      setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });
      
      addDocumentNonBlocking(collection(walletRef!, 'transactions'), {
        type: 'Payment', 
        amount: finalAmount, 
        description: `Top-up: ${selectedNetwork.toUpperCase()} ${activeCategory}`, 
        transactionDate: new Date().toISOString(), 
        status: 'Completed', 
        reference: finalRef,
        vendReference: body.vendReference
      });

      setVendResult({ 
        ...body, 
        finalAmount, 
        reference: finalRef
      });
      setCurrentStep('result');
    } else {
      toast({ title: "Fulfillment Error", description: result.error, variant: "destructive" });
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border shadow-sm rounded-full text-primary font-black text-xs">
              ₦{(wallet?.balance || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {currentStep === 'category' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => { setActiveCategory("AIRTIME"); setCurrentStep('config'); }}>
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
              
              <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => { setActiveCategory("DATA"); setCurrentStep('config'); }}>
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

              <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => { setActiveCategory("ELECTRICITY"); setCurrentStep('config'); }}>
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

              <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => { setActiveCategory("TV"); setCurrentStep('config'); }}>
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
                          // Extract info from description if possible
                          const isData = tx.description.toLowerCase().includes('data');
                          setActiveCategory(isData ? 'DATA' : 'AIRTIME');
                          // We don't have the phone number in description usually, but we could add it to metadata in the future
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
                  <div className="grid grid-cols-2 gap-3">
                    {billers.map(biller => (
                      <Button 
                        key={biller.billerCode}
                        variant="outline"
                        onClick={() => syncVariationsForBiller(biller)}
                        className={cn(
                          "h-20 rounded-2xl border-2 font-black text-[9px] uppercase px-4 leading-tight flex flex-col items-center justify-center gap-2 transition-all text-center",
                          selectedNetwork === biller.name ? 
                            "bg-primary text-white border-transparent shadow-lg scale-[1.05]" : 
                            "bg-white hover:border-primary/30"
                        )}
                      >
                        <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", selectedNetwork === biller.name ? "bg-white/20" : "bg-muted")}>
                           {activeCategory === 'ELECTRICITY' ? <Activity className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                        </div>
                        <span className="truncate w-full">{biller.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {selectedNetwork && (
                <div className="space-y-4 animate-in fade-in">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                    {activeCategory === 'AIRTIME' ? '3. Recharge Value' : '3. Select Data Plan'}
                  </label>
                  
                  {activeCategory === 'AIRTIME' ? (
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
                      
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                        {isVerifying ? (
                          <div className="py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
                            <RefreshCw className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gateway Handshake...</p>
                          </div>
                        ) : filteredVariations.length > 0 ? (
                          filteredVariations.map((v: any, vIdx: number) => (
                            <button
                              key={v.code || v.productCode || `v-${vIdx}`}
                              onClick={() => setSelectedProduct(v)}
                              className={cn(
                                "w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group",
                                (selectedProduct?.code || selectedProduct?.productCode) === (v.code || v.productCode)
                                  ? "border-primary bg-primary/5 shadow-md"
                                  : "border-muted bg-white hover:border-primary/30"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs",
                                  (selectedProduct?.code || selectedProduct?.productCode) === (v.code || v.productCode) ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                )}>
                                  <Zap className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                  <p className="text-[11px] font-black uppercase tracking-tight leading-tight">{v.name}</p>
                                  {v.metadata && (
                                    <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60">
                                      {v.metadata.volume ? `${v.metadata.volume}MB` : ''} {v.metadata.durationUnit || ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-primary">₦{(v.price || v.amount)?.toLocaleString()}</p>
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full ml-auto mt-1",
                                  (selectedProduct?.code || selectedProduct?.productCode) === (v.code || v.productCode) ? "bg-primary animate-ping" : "bg-transparent"
                                )} />
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="py-10 text-center space-y-2 grayscale opacity-40">
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
                disabled={!selectedNetwork || isVerifying || !customerId || (activeCategory === 'DATA' && !selectedProduct) || (activeCategory === 'AIRTIME' && !amount)}
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
                    ₦{(activeCategory === 'DATA' ? Number(selectedProduct.price || selectedProduct.amount) : Number(amount)).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-10 bg-muted/5 border-t flex flex-col gap-4">
              <Button 
                onClick={handleFinalVend} 
                disabled={!wallet || wallet.balance < (activeCategory === 'DATA' ? Number(selectedProduct.price || selectedProduct.amount) : Number(amount))}
                className="w-full h-16 rounded-xl font-black text-xl bg-primary shadow-xl"
              >
                Confirm & Pay Now
              </Button>
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
