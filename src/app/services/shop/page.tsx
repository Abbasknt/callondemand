"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ShoppingBag, 
  Search, 
  Star, 
  Loader2, 
  Wallet, 
  Plus, 
  Minus, 
  Trash2, 
  X,
  CheckCircle2
} from "lucide-react"
import Image from "next/image"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  locationUnit?: string;
}

/**
 * @fileOverview Hardened Marketplace Hub.
 * Optimized for high-density mobile fit and production build stability.
 */

export default function ShopPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user?.uid]);
  const { data: wallet } = useDoc(walletRef);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'productListings'), where('isAvailable', '==', true));
  }, [firestore]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const categories = useMemo(() => {
    if (!products) return ["All"];
    return ["All", ...new Set(products.map(p => p.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const unit = profile?.assignedUnit || 'General';
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesUnit = p.locationUnit === 'General' || p.locationUnit === unit;
      return matchesSearch && matchesCategory && matchesUnit;
    });
  }, [products, searchQuery, activeCategory, profile?.assignedUnit]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.imageUrl, locationUnit: product.locationUnit }];
    });
    toast({ title: "Added to Bag", duration: 2000 });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (!user || !firestore || !wallet || cart.length === 0) return;
    if (wallet.balance < cartTotal) {
      toast({ title: "Insufficient Balance", variant: "destructive" });
      return;
    }
    setIsCheckoutLoading(true);

    const newBalance = wallet.balance - cartTotal;
    setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });

    addDocumentNonBlocking(collection(firestore, 'deliveryTasks'), {
      status: 'Pending Approval',
      serviceType: 'Marketplace Delivery',
      locationUnit: cart[0]?.locationUnit || profile?.assignedUnit || 'General',
      origin: 'Fulfillment Hub',
      destination: 'Partner Residence',
      customerUserId: user.uid,
      requesterEmail: user.email,
      receiverName: `${profile?.firstName} ${profile?.lastName}`,
      receiverPhone: profile?.phoneNumber || '',
      createdAt: new Date().toISOString(),
      orderSummary: `${cart.reduce((s, i) => s + i.quantity, 0)} items • ₦${cartTotal.toLocaleString()}`,
      totalAmount: cartTotal
    }).then(() => {
      toast({ title: "Order Confirmed!", description: "Fulfillment session initialized." });
      setCart([]);
      setIsCartOpen(false);
    }).finally(() => setIsCheckoutLoading(false));
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <ShoppingBag className="h-7 w-7 text-primary" /> Marketplace
          </h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Verified Hub Goods</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-black text-xs border border-primary/20">
            <Wallet className="h-3.5 w-3.5 opacity-40" /> ₦{(wallet?.balance || 0).toLocaleString()}
          </div>
          <Button variant="default" className="gap-2 bg-accent hover:bg-accent/90 relative h-10 px-5 rounded-lg" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag className="h-4 w-4" />
            {cart.length > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-primary text-[10px] rounded-full border-2 border-background">{cart.reduce((s, i) => s + i.quantity, 0)}</Badge>}
          </Button>
        </div>
      </div>

      <div className="space-y-4 sticky top-4 z-10 bg-background/80 backdrop-blur-md p-2 rounded-[2rem] border shadow-sm mx-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
          <Input className="pl-10 bg-white rounded-xl h-11 text-xs border-2 font-bold" placeholder="Search Marketplace..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} size="sm" className="rounded-full px-4 h-8 font-black text-[9px] uppercase transition-all" onClick={() => setActiveCategory(cat)}>{cat}</Button>
          ))}
        </div>
      </div>

      <div className="px-2">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredProducts.map(p => (
              <Card key={p.id} className="overflow-hidden rounded-[2rem] border-none shadow-lg group bg-card hover:scale-[1.02] transition-transform">
                <div className="relative h-48">
                  <Image src={p.imageUrl || `https://picsum.photos/seed/${p.id}/400/300`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                  <div className="absolute top-3 right-3"><Badge className="bg-white/90 text-black border-none font-black text-[9px] px-3 shadow-md">₦{p.price.toLocaleString()}</Badge></div>
                </div>
                <CardHeader className="p-5 pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <CardTitle className="text-lg font-black truncate max-w-[140px]">{p.name}</CardTitle>
                    <Badge variant="outline" className="text-[7px] font-black uppercase border-accent/20 text-accent">IN STOCK</Badge>
                  </div>
                  <CardDescription className="text-[10px] line-clamp-1 font-medium">{p.category} Hub Special.</CardDescription>
                </CardHeader>
                <CardFooter className="p-5 pt-4">
                  <Button className="w-full h-11 font-black rounded-xl text-[10px] uppercase gap-2 bg-primary shadow-lg" onClick={() => addToCart(p)}>
                    <Plus className="h-3.5 w-3.5" /> Authorize Bag
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border-4 border-dashed rounded-[3rem] opacity-30 font-black text-[10px] uppercase">No Hub Listings Active</div>
        )}
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end no-print">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCartOpen(false)} />
          <Card className="relative w-full max-w-md h-full rounded-none flex flex-col shadow-2xl bg-white animate-in slide-in-from-right duration-500">
            <CardHeader className="border-b py-8 px-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter uppercase">Market Bag</CardTitle>
                <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-1">Authorized Fulfillment</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsCartOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                  <ShoppingBag className="h-16 w-16" />
                  <p className="font-black uppercase text-[10px] tracking-widest">Bag is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 border-2 rounded-2xl bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-xs truncate uppercase tracking-tight">{item.name}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-lg font-black text-primary">₦{item.price.toLocaleString()}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter className="p-8 bg-muted/10 border-t flex flex-col gap-4">
              <div className="w-full space-y-2">
                <div className="flex justify-between items-end border-b border-dashed pb-2">
                  <span className="font-black uppercase text-[10px] text-muted-foreground">Settlement</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">₦{cartTotal.toLocaleString()}</span>
                </div>
              </div>
              <Button className="w-full h-16 rounded-xl font-black text-lg shadow-xl uppercase bg-primary hover:bg-primary/90" disabled={cart.length === 0 || isCheckoutLoading} onClick={handleCheckout}>
                {isCheckoutLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Confirm & Pay"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}