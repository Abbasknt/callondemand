"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Home, 
  MapPin, 
  Loader2, 
  Wallet,
  Search,
  CheckCircle2,
  History,
  Calendar,
  Activity,
  Printer
} from "lucide-react"
import Image from "next/image"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, doc, orderBy, limit } from "firebase/firestore"
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { format, addDays } from "date-fns"
import { triggerReceiptPrint } from "@/lib/export-utils"
import { BrandLogo } from "@/components/brand-logo"

/**
 * @fileOverview Premium Shortlet Hub.
 * Optimized for production with Next.js 15 hydration guards.
 */

export default function ShortletPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("listings")
  const [bookingLoading, setBookingLoading] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Hydration safety: Initialize dates as empty strings, set in useEffect
  const [selectedDates, setSelectedDates] = useState({ 
    checkIn: "",
    checkOut: ""
  })

  useEffect(() => {
    setMounted(true)
    const today = new Date()
    setSelectedDates({ 
      checkIn: format(today, 'yyyy-MM-dd'),
      checkOut: format(addDays(today, 2), 'yyyy-MM-dd')
    })
  }, [])

  const walletRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'wallet', 'default');
  }, [firestore, user?.uid]);
  const { data: wallet } = useDoc(walletRef);

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'shortletListings'), where('isAvailable', '==', true));
  }, [firestore]);
  const { data: listings, isLoading: isListingsLoading } = useCollection(listingsQuery);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'shortletBookings'), orderBy('bookingDate', 'desc'), limit(20));
  }, [firestore, user?.uid]);
  const { data: myBookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    return listings.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.locationUnit?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [listings, searchQuery]);

  const handleBookNow = (listing: any) => {
    if (!user || !firestore || !wallet || !selectedDates.checkIn || !selectedDates.checkOut) return;
    
    const checkInDate = new Date(selectedDates.checkIn);
    const checkOutDate = new Date(selectedDates.checkOut);
    
    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalCost = (listing.price || listing.pricePerNight || 0) * nights;
    
    if (wallet.balance < totalCost) {
      toast({ title: "Insufficient Balance", description: `You need ₦${(totalCost - wallet.balance).toLocaleString()} more.`, variant: "destructive" });
      return;
    }
    
    setBookingLoading(listing.id);
    const newBalance = wallet.balance - totalCost;
    setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });
    
    addDocumentNonBlocking(collection(walletRef!, 'transactions'), { 
      type: 'Payment', 
      amount: totalCost, 
      description: `Shortlet Stay: ${listing.name}`, 
      transactionDate: new Date().toISOString(), 
      status: 'Completed' 
    });

    const bookingData = { 
      userId: user.uid, 
      shortletId: listing.id, 
      shortletName: listing.name, 
      checkInDate: selectedDates.checkIn, 
      checkOutDate: selectedDates.checkOut, 
      totalAmount: totalCost, 
      status: "Confirmed", 
      bookingDate: new Date().toISOString(),
      location: listing.location || 'Verified Residence',
      unit: listing.locationUnit || 'General'
    };
    
    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'shortletBookings'), bookingData).then(() => {
      toast({ title: "Booking Confirmed!", description: "Production stay secured." });
      setActiveTab("my-stays");
    }).finally(() => setBookingLoading(null));
  };

  if (!mounted) return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground animate-pulse">Syncing Hub...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto px-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3"><Home className="h-8 w-8 text-primary" /> Premium Shortlets</h2>
          <p className="text-muted-foreground">Verified luxury apartments for elite stays in Nigeria.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary font-bold border border-primary/20"><Wallet className="h-4 w-4" /> ₦{(wallet?.balance || 0).toLocaleString()}</div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between sticky top-4 z-10 bg-background/80 backdrop-blur-md p-4 rounded-[2rem] border shadow-sm gap-4 no-print">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-12">
            <TabsTrigger value="listings" className="rounded-xl h-10"><Search className="h-4 w-4" /> Discover</TabsTrigger>
            <TabsTrigger value="my-stays" className="rounded-xl h-10"><History className="h-4 w-4" /> My Stays</TabsTrigger>
          </TabsList>
        </Tabs>
        {activeTab === 'listings' && (
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <Input className="rounded-xl bg-white h-11" placeholder="Search city or live location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        )}
      </div>

      <Tabs value={activeTab}>
        <TabsContent value="listings" className="space-y-8 no-print">
          {isListingsLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {filteredListings.map(listing => (
                <Card key={listing.id} className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-card group">
                  <div className="relative h-72">
                    <Image 
                      src={listing.imageUrl || `https://picsum.photos/seed/${listing.id}/800/500`} 
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700" 
                      alt={listing.name}
                      data-ai-hint="luxury apartment"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <Badge className="bg-white/90 text-black border-none font-black text-[10px] uppercase w-fit">{listing.category || 'Apartment'}</Badge>
                      <Badge className="bg-accent text-white border-none font-black uppercase text-[8px] tracking-widest flex items-center gap-1 w-fit px-3">
                        <Activity className="h-2 w-2" /> Live: {listing.locationUnit || 'General'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-white">
                      <p className="text-xs uppercase font-black tracking-widest opacity-70">Rate</p>
                      <p className="text-xl font-black">₦{(listing.price || listing.pricePerNight || 0).toLocaleString()} <span className="text-xs font-normal">/ night</span></p>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-2xl font-black group-hover:text-primary transition-colors">{listing.name}</CardTitle>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest">VERIFIED</Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm mb-6">
                      <MapPin className="h-4 w-4 text-primary" /> {listing.location || 'Nigerian Jurisdiction'} 
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Check-in</p>
                        <Input type="date" value={selectedDates.checkIn} onChange={(e) => setSelectedDates({...selectedDates, checkIn: e.target.value})} className="rounded-xl border-2 font-bold" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Check-out</p>
                        <Input type="date" value={selectedDates.checkOut} onChange={(e) => setSelectedDates({...selectedDates, checkOut: e.target.value})} className="rounded-xl border-2 font-bold" />
                      </div>
                    </div>
                    <Button className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 rounded-2xl shadow-lg gap-2" onClick={() => handleBookNow(listing)} disabled={bookingLoading === listing.id}>
                      {bookingLoading === listing.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Book Stay Now</>}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-stays" className="space-y-6">
          {isBookingsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : myBookings && myBookings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {myBookings.map(booking => (
                <Card key={booking.id} className="rounded-[2.5rem] border-none shadow-lg overflow-hidden bg-card group">
                  <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <Home className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-xl tracking-tighter uppercase truncate max-w-[200px]">{booking.shortletName}</p>
                          <Badge className="bg-green-500 text-white border-none text-[9px] uppercase font-black px-2">{booking.status}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> {booking.checkInDate} to {booking.checkOutDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right mr-4">
                        <p className="text-2xl font-black text-primary">₦{booking.totalAmount?.toLocaleString()}</p>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Stay Settlement</p>
                      </div>
                      <Button variant="outline" className="rounded-xl font-black gap-2 h-12 no-print" onClick={() => triggerReceiptPrint()}>
                        <Printer className="h-4 w-4" /> Receipt
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 border-4 border-dashed rounded-[3rem] bg-muted/20">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <p className="text-muted-foreground font-black uppercase text-xs">No active bookings found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}