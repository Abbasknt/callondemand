"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Shirt, 
  Truck, 
  Loader2, 
  Wallet, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  History,
  MapPin,
  Clock,
  Sparkles
} from "lucide-react"
import Image from "next/image"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, doc, limit } from "firebase/firestore"
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { WalletBalanceDisplay } from "@/components/wallet-balance-display"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface LaundryCartItem {
  id: string;
  name: string;
  pricePerUnit: number;
  unitType: string;
  quantity: number;
  locationUnit?: string;
}

/**
 * @fileOverview Hardened Laundry Hub for Call on Demand.
 * Optimized for mobile fit and Next.js 15 production stability.
 */

export default function LaundryPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [cart, setCart] = useState<LaundryCartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
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

  const optionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'laundryServiceOptions'), where('isAvailable', '==', true), limit(50));
  }, [firestore]);
  const { data: options, isLoading: isOptionsLoading } = useCollection(optionsQuery);

  const filteredOptions = useMemo(() => {
    if (!options) return [];
    return options.filter(o => o.locationUnit === 'General' || o.locationUnit === (profile?.assignedUnit || 'General'));
  }, [options, profile?.assignedUnit]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0), [cart]);

  const addToCart = (option: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === option.id);
      if (existing) return prev.map(i => i.id === option.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: option.id, name: option.name, pricePerUnit: option.pricePerUnit, unitType: option.unitType || 'Item', quantity: 1, locationUnit: option.locationUnit }];
    });
    toast({ title: "Added to Hub Bag", duration: 2000 });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
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
      serviceType: 'Laundry Pickup',
      locationUnit: cart[0]?.locationUnit || profile?.assignedUnit || 'General',
      origin: 'User Residence',
      destination: 'Laundry Hub',
      customerUserId: user.uid,
      requesterEmail: user.email,
      receiverName: `${profile?.firstName} ${profile?.lastName}`,
      receiverPhone: profile?.phoneNumber || '',
      createdAt: new Date().toISOString(),
      orderSummary: `${cart.reduce((s, i) => s + i.quantity, 0)} items • ₦${cartTotal.toLocaleString()}`,
      totalAmount: cartTotal
    }).then(() => {
      toast({ title: "Pickup Authorized!", description: "Hub agent notified for collection." });
      setCart([]);
      setIsCartOpen(false);
    }).finally(() => setIsCheckoutLoading(false));
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto px-2">
      <div className="relative h-40 rounded-[2.5rem] overflow-hidden group no-print">
        <Image src="https://picsum.photos/seed/laundry-hub/800/400" alt="Laundry hub" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center px-10">
          <div className="text-white space-y-1">
            <h1 className="text-2xl font-black tracking-tighter uppercase">Laundry Hub.</h1>
            <p className="text-[10px] opacity-90 font-black uppercase tracking-widest">Fabric care, exactly as demanded.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-2 py-2 sticky top-4 z-10 bg-background/80 backdrop-blur-md rounded-[2rem] border shadow-sm no-print">
        <WalletBalanceDisplay balance={wallet?.balance} badgeStyle />
        <Button variant="default" className="gap-2 bg-accent hover:bg-accent/90 relative h-10 px-5 rounded-lg" onClick={() => setIsCartOpen(true)}>
          <ShoppingBag className="h-4 w-4" />
          {cart.length > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-primary text-[10px] rounded-full border-2 border-background">{cart.reduce((s, i) => s + i.quantity, 0)}</Badge>}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
        {isOptionsLoading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredOptions.length > 0 ? (
          filteredOptions.map(option => (
            <Card key={option.id} className="rounded-[2rem] border-none shadow-lg bg-card group transition-all hover:scale-[1.02]">
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Shirt className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20">{option.locationUnit || 'General'}</Badge>
                </div>
                <CardTitle className="text-lg font-black">{option.name}</CardTitle>
                <CardDescription className="text-[10px] font-medium line-clamp-2">{option.description || "Premium fabric care protocol."}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-2">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-primary">₦{option.pricePerUnit.toLocaleString()}</span>
                  <span className="text-[8px] font-black uppercase text-muted-foreground mb-1">/ {option.unitType || 'Item'}</span>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-2">
                <Button className="w-full h-11 font-black rounded-xl text-[10px] uppercase gap-2" onClick={() => addToCart(option)}>
                  <Plus className="h-3.5 w-3.5" /> Authorize Hub
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl opacity-30 font-black text-[10px] uppercase">No Hub Nodes Active</div>
        )}
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end no-print">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCartOpen(false)} />
          <Card className="relative w-full max-w-md h-full rounded-none flex flex-col shadow-2xl bg-white animate-in slide-in-from-right duration-500">
            <CardHeader className="border-b py-8 px-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter uppercase">Laundry Bag</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary">Fulfillment authorized via Unit Hub</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsCartOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                  <Shirt className="h-16 w-16" />
                  <p className="font-black uppercase text-[10px] tracking-widest">Bag is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 border-2 rounded-2xl bg-card group relative">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-xs truncate">{item.name}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-lg font-black text-primary">₦{item.pricePerUnit.toLocaleString()}</p>
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
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase text-[9px] text-muted-foreground">Unit Dispatch</span>
                  <span className="text-[10px] font-bold text-accent uppercase">Calculated in Real-time</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-dashed">
                  <span className="font-black uppercase text-[10px] text-muted-foreground">Settlement</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">₦{cartTotal.toLocaleString()}</span>
                </div>
              </div>
              <Button className="w-full h-16 rounded-xl font-black text-lg shadow-xl uppercase bg-primary hover:bg-primary/90" disabled={cart.length === 0 || isCheckoutLoading} onClick={handleCheckout}>
                {isCheckoutLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Authorize Pickup"}
              </Button>
              <p className="text-[8px] font-black uppercase text-center text-muted-foreground opacity-60 flex items-center justify-center gap-2">
                <Shield className="h-2 w-2" /> Handshake Secure via Monnify Wallet Protocol
              </p>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

function Shield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}