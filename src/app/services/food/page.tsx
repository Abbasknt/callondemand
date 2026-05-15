"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Utensils, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Loader2, 
  Wallet,
  X
} from "lucide-react"
import Image from "next/image"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, doc, limit } from "firebase/firestore"
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { PageTransition } from "@/components/page-transition"

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  locationUnit?: string;
}

export default function FoodServicePage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
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

  const menuQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'menuItems'), limit(100));
  }, [firestore]);
  const { data: menuItems, isLoading: isMenuLoading } = useCollection(menuQuery);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    const unit = profile?.assignedUnit || 'General';
    return menuItems.filter(i => 
      i.isAvailable !== false && 
      (i.locationUnit === 'General' || i.locationUnit === unit)
    );
  }, [menuItems, profile?.assignedUnit]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, imageUrl: item.imageUrl, locationUnit: item.locationUnit }];
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
    }).filter(item => item.quantity > 0));
  };

  const handleCheckout = async () => {
    if (!user || !firestore || !wallet || cart.length === 0) return;
    if (wallet.balance < cartTotal) {
      toast({ title: "Insufficient Balance", description: `Top up your wallet to clear ₦${cartTotal.toLocaleString()}.`, variant: "destructive" });
      return;
    }
    setIsCheckoutLoading(true);
    
    const newBalance = wallet.balance - cartTotal;
    setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });
    
    addDocumentNonBlocking(collection(firestore, 'deliveryTasks'), {
      status: 'Pending Approval',
      serviceType: 'Food Delivery',
      locationUnit: cart[0]?.locationUnit || profile?.assignedUnit || 'General',
      origin: 'Unit Kitchen',
      destination: 'Partner Residence',
      customerUserId: user.uid,
      requesterEmail: user.email,
      receiverName: `${profile?.firstName} ${profile?.lastName}`,
      receiverPhone: profile?.phoneNumber || '',
      createdAt: new Date().toISOString(),
      orderSummary: `${cart.reduce((s, i) => s + i.quantity, 0)} items • ₦${cartTotal.toLocaleString()}`,
      totalAmount: cartTotal,
      cartItems: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price }))
    }).then(() => {
      toast({ title: "Order Authorized!", description: "Fulfillment roadmap initialized." });
      setCart([]);
      setIsCartOpen(false);
    }).finally(() => setIsCheckoutLoading(false));
  };

  if (!mounted) return null;

  return (
    <PageTransition>
      <div className="space-y-6 pb-20 max-w-xl mx-auto px-2">
        <div className="relative h-40 rounded-[2.5rem] overflow-hidden group no-print shadow-xl">
          <Image src="https://picsum.photos/seed/food-hub/800/400" alt="Food hub" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center px-10">
            <div className="text-white space-y-1">
              <h1 className="text-2xl font-black tracking-tighter uppercase">Food Hub.</h1>
              <p className="text-[10px] opacity-90 font-black uppercase tracking-widest">Unit kitchens, instant dispatch.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-2 py-2 sticky top-4 z-10 bg-background/80 backdrop-blur-md rounded-[2rem] border shadow-sm no-print">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-black text-xs border border-primary/20">
            <Wallet className="h-3.5 w-3.5 opacity-40" /> ₦{(wallet?.balance || 0).toLocaleString()}
          </div>
          <Button variant="default" className="gap-2 bg-accent hover:bg-accent/90 relative h-10 px-5 rounded-lg transition-all active:scale-95" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag className="h-4 w-4" />
            {cart.length > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-primary text-[10px] rounded-full border-2 border-background shadow-lg">{cart.reduce((s, i) => s + i.quantity, 0)}</Badge>}
          </Button>
        </div>

        <div className="space-y-6 no-print px-2">
          {isMenuLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden rounded-[2rem] border-none shadow-lg group bg-card hover:scale-[1.02] transition-transform">
                  <div className="relative h-40">
                    <Image src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt={item.name} />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-black border-none font-black text-[9px] px-3 shadow-md">₦{item.price.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <CardHeader className="p-5 pb-0">
                    <CardTitle className="text-lg font-black truncate">{item.name}</CardTitle>
                    <CardDescription className="text-[10px] line-clamp-1 font-medium">{item.description || 'Unit Kitchen Special.'}</CardDescription>
                  </CardHeader>
                  <CardFooter className="p-5 pt-4">
                    <Button className="w-full h-11 font-black rounded-xl text-[10px] uppercase gap-2 bg-primary shadow-lg" onClick={() => addToCart(item)}>
                      <Plus className="h-3.5 w-3.5" /> Order Node
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border-4 border-dashed rounded-[3rem] opacity-30 font-black text-[10px] uppercase tracking-[0.3em]">
              No Hub Nodes Active
            </div>
          )}
        </div>

        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end no-print">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCartOpen(false)} />
            <Card className="relative w-full max-w-md h-full rounded-none flex flex-col shadow-2xl bg-white animate-in slide-in-from-right duration-500">
              <CardHeader className="border-b py-8 px-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tighter uppercase">Food Bag</CardTitle>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-1">Authorized Unit Fulfillment</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsCartOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-20 gap-4">
                    <Utensils className="h-16 w-16" />
                    <p className="font-black uppercase text-[10px] tracking-widest">Bag is Empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 border-2 rounded-2xl bg-card transition-all hover:border-primary/20">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-black text-xs truncate uppercase tracking-tight">{item.name}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => updateQuantity(item.id, -item.quantity)}>
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
    </PageTransition>
  )
}
