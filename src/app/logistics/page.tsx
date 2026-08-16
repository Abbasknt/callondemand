"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Truck, 
  Package, 
  MapPin, 
  Search, 
  ChevronRight, 
  Loader2, 
  Zap, 
  History, 
  Map,
  Wallet,
  Printer,
  Share2,
  X,
  Clock,
  Navigation,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Mail,
  Link2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WalletBalanceDisplay } from "@/components/wallet-balance-display"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, doc, limit, orderBy } from "firebase/firestore"
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { triggerReceiptPrint, shareReceipt } from "@/lib/export-utils"
import { BrandLogo } from "@/components/brand-logo"
import { RealMap, resolveCoordinates } from "@/components/real-map"
import { ConsignmentStepTracker } from "@/components/consignment-step-tracker"
import { DateRangePicker, DateRange, isShipmentInDateRange } from "@/components/date-range-picker"

/**
 * @fileOverview Logistics Hub for tracking and initializing dispatches.
 * Hardened for Next.js 15 production stability.
 */

const PRIORITY_MAP: Record<string, number> = {
  'High': 3,
  'Medium': 2,
  'Low': 1
};

const STATE_DISTRICTS: Record<string, string[]> = {
  "Lagos": ["Ikeja", "Lekki Phase 1", "Victoria Island", "Ikoyi", "Yaba", "Surulere", "Ikorodu", "Festac Town", "Alaba", "Maryland", "Ajah", "Oshodi", "Agege"],
  "Abuja": ["Central Business District", "Maitama", "Wuse 2", "Garki", "Jabi", "Utako", "Gwarinpa", "Asokoro", "Kubwa", "Lugbe", "Apo"],
  "Rivers": ["Port Harcourt GRA", "Trans-Amadi", "Diobu", "Rumuokoro", "Woji", "Eleme", "Choba", "Borokiri"],
  "Oyo": ["Bodija", "Dugbe", "Ring Road", "Iwo Road", "UI / Agbowo", "Jericho", "Oluyole", "Moniya"],
  "Kano": ["Kano Municipal", "Nassarawa", "Fagge", "Dala", "Tarauni", "Sabon Gari"],
  "Enugu": ["Independence Layout", "New Haven", "GRA Enugu", "Ogui", "Abakpa", "Emene"],
  "Anambra": ["Onitsha Main Market", "Awka GRA", "Nnewi", "Fegge", "Nkpor"],
  "Edo": ["GRA Benin", "Ugbowo", "Ring Road Benin", "Ikpoba Hill", "Aduwawa"],
  "Ogun": ["Abeokuta GRA", "Ibara", "Sagamu", "Ota / Sango", "Ijebu Ode", "Mowe / Ibafo"],
  "Delta": ["Warri GRA", "Asaba Central", "Effurun", "Sapele", "Ughelli"],
  "Kaduna": ["Kaduna North", "Barnawa", "Kakuri", "Tudun Wada", "Ungwan Rimi"]
};

const NIGERIAN_STATES = [
  "Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Enugu", "Delta", "Kaduna", "Anambra", "Edo", 
  "Ogun", "Plateau", "Akwa Ibom", "Imo", "Bauchi", "Benue", "Borno", "Cross River", "Ebonyi", 
  "Ekiti", "Gombe", "Jigawa", "Katsina", "Kebbi", "Kogi", "Kwara", "Nasarawa", "Niger", 
  "Ondo", "Osun", "Sokoto", "Taraba", "Yobe", "Zamfara", "Abia", "Adamawa", "Bayelsa"
].sort();

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function ConsignmentStatusBadge({ status, className }: { status: string; className?: string }) {
  let badgeStyle = "bg-slate-100 text-slate-800 border-slate-200";
  let Icon = Package;
  let isPulse = false;

  switch (status) {
    case 'Pending Approval':
      badgeStyle = "bg-amber-100 text-amber-900 border-amber-300";
      Icon = Clock;
      break;
    case 'Processing':
    case 'Claimed':
      badgeStyle = "bg-sky-100 text-sky-900 border-sky-300";
      Icon = Loader2;
      isPulse = true;
      break;
    case 'Ready for Pickup':
      badgeStyle = "bg-cyan-100 text-cyan-900 border-cyan-300";
      Icon = PackageCheck;
      break;
    case 'In Transit':
      badgeStyle = "bg-indigo-100 text-indigo-900 border-indigo-300";
      Icon = Truck;
      isPulse = true;
      break;
    case 'Out for Delivery':
      badgeStyle = "bg-emerald-100 text-emerald-900 border-emerald-400 font-black";
      Icon = Navigation;
      isPulse = true;
      break;
    case 'Delivered':
      badgeStyle = "bg-emerald-600 text-white border-none font-black";
      Icon = CheckCircle2;
      break;
    case 'Cancelled':
    case 'Rejected':
      badgeStyle = "bg-red-100 text-red-900 border-red-300";
      Icon = XCircle;
      break;
    default:
      badgeStyle = "bg-slate-100 text-slate-800 border-slate-200";
      Icon = Package;
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[8px] font-black uppercase h-5 px-2 gap-1 border shrink-0 flex items-center transition-all",
        badgeStyle,
        isPulse && "animate-pulse shadow-xs",
        className
      )}
    >
      <Icon className={cn("h-3 w-3", (status === 'Processing' || status === 'Claimed') && "animate-spin")} />
      <span>{status}</span>
    </Badge>
  );
}

export default function LogisticsHub() {
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()
  
  const [selectedShipment, setSelectedShipment] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "all" })
  const [directTrackId, setDirectTrackId] = useState("")
  const [activeTab, setActiveTab] = useState("tracking")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("")
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const prevStatusesRef = useRef<Record<string, string>>({})
  const isInitialLoadRef = useRef<boolean>(true)

  const [receiverName, setReceiverName] = useState("")
  const [receiverPhone, setReceiverPhone] = useState("")
  const [receiverAddress, setReceiverAddress] = useState("")
  const [originState, setOriginState] = useState("Lagos")
  const [originArea, setOriginArea] = useState("Ikeja")
  const [destState, setDestState] = useState("Lagos")
  const [destArea, setDestArea] = useState("Lekki Phase 1")
  const [packageType, setPackageType] = useState("")
  const [weight, setWeight] = useState("2.5")
  const [serviceLevel, setServiceLevel] = useState<"Intra-State" | "Inter-State">("Intra-State")
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium")

  // Errand Dispatch States
  const [errandCategory, setErrandCategory] = useState<string>("Personal Runner")
  const [errandServiceLevel, setErrandServiceLevel] = useState<"Intra-State" | "Inter-State">("Intra-State")
  const [errandOriginState, setErrandOriginState] = useState("Lagos")
  const [errandDestState, setErrandDestState] = useState("Lagos")
  const [errandPickupArea, setErrandPickupArea] = useState("Ikeja")
  const [errandDropoffArea, setErrandDropoffArea] = useState("Victoria Island")
  const [errandPickupAddress, setErrandPickupAddress] = useState("")
  const [errandDropoffAddress, setErrandDropoffAddress] = useState("")
  const [errandInstructions, setErrandInstructions] = useState("")
  const [errandRecipientName, setErrandRecipientName] = useState("")
  const [errandRecipientPhone, setErrandRecipientPhone] = useState("")
  const [errandUrgency, setErrandUrgency] = useState<"Standard" | "Express">("Standard")

  const [copiedTrackId, setCopiedTrackId] = useState<string | null>(null)
  const [origin, setOrigin] = useState<string>("")

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
    setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    
    // Auto-extract deep tracking link or tab if present in URL (?track=... or ?id=... or ?tab=...)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const urlTrackId = params.get("track") || params.get("id") || params.get("trackId")
      if (urlTrackId && urlTrackId.trim()) {
        setDirectTrackId(urlTrackId.trim())
        setActiveTab("tracking")
      }
      const urlTab = params.get("tab")
      if (urlTab) {
        if (urlTab === "shipping" || urlTab === "new-shipment") {
          setActiveTab("new-shipment")
        } else if (urlTab === "errand" || urlTab === "errands") {
          setActiveTab("errand")
        } else if (urlTab === "tracking" || urlTab === "track") {
          setActiveTab("tracking")
        }
      }
    }

    const interval = setInterval(() => {
      setIsSyncing(true)
      setTimeout(() => {
        setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        setIsSyncing(false)
      }, 400)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleCopyTrackingLink = async (shipmentId: string) => {
    if (typeof window === "undefined") return
    const deepLink = `${window.location.origin}/logistics?track=${shipmentId}`
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopiedTrackId(shipmentId)
      setTimeout(() => setCopiedTrackId(null), 2500)
      toast({
        title: "Tracking Link Copied!",
        description: "Recipients can open this link to view live progress without logging in.",
      })
    } catch {
      toast({
        title: "Tracking Deep Link",
        description: deepLink,
      })
    }
  }

  const handleShareTrackingLink = async (shipment: any) => {
    if (typeof window === "undefined") return
    const deepLink = `${window.location.origin}/logistics?track=${shipment.id}`
    const shareData = {
      title: `Consignment Progress: #${shipment.id.slice(0, 8)}`,
      text: `View live location & progress map for consignment #${shipment.id.slice(0, 8)}:`,
      url: deepLink,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // Fallback to clipboard if share cancelled or unavailable
      }
    }
    handleCopyTrackingLink(shipment.id)
  }

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

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'deliveryTasks'), 
      where('customerUserId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user]);
  const { data: shipments, isLoading } = useCollection(tasksQuery);

  // Live document listener for selected consignment so drawer & map update immediately
  const selectedShipmentDocRef = useMemoFirebase(() => {
    if (!firestore || !selectedShipment?.id) return null;
    return doc(firestore, 'deliveryTasks', selectedShipment.id);
  }, [firestore, selectedShipment?.id]);
  const { data: liveSelectedShipment } = useDoc(selectedShipmentDocRef);

  const activeSelectedShipment = useMemo(() => {
    if (!selectedShipment) return null;
    if (liveSelectedShipment) return { ...liveSelectedShipment, id: selectedShipment.id };
    const fromList = shipments?.find(s => s.id === selectedShipment.id);
    return fromList || selectedShipment;
  }, [selectedShipment, liveSelectedShipment, shipments]);

  // Real-time status change detection & toast notifications
  useEffect(() => {
    if (!shipments || shipments.length === 0) return;

    if (isInitialLoadRef.current) {
      const initialMap: Record<string, string> = {};
      shipments.forEach(s => { initialMap[s.id] = s.status; });
      prevStatusesRef.current = initialMap;
      isInitialLoadRef.current = false;
      return;
    }

    shipments.forEach(s => {
      const prevStatus = prevStatusesRef.current[s.id];
      if (prevStatus && prevStatus !== s.status) {
        toast({
          title: "⚡ Real-Time Status Update",
          description: `Consignment #${s.id.slice(0, 8)} status updated to "${s.status}".`,
          className: "border-primary bg-primary/5 font-black text-xs"
        });
      }
      prevStatusesRef.current[s.id] = s.status;
    });
  }, [shipments, toast]);

  const handleManualRefresh = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setIsSyncing(false)
      toast({ 
        title: "Consignments Synchronized", 
        description: `Snapshot listener active. Refreshed at ${new Date().toLocaleTimeString()}` 
      })
    }, 500)
  }

  const directTaskRef = useMemoFirebase(() => {
    if (!firestore || !directTrackId || directTrackId.length < 5) return null;
    return doc(firestore, 'deliveryTasks', directTrackId);
  }, [firestore, directTrackId]);
  const { data: directTask, isLoading: isLookingUp, error: lookupError } = useDoc(directTaskRef);

  useEffect(() => {
    if (!isLookingUp && directTrackId) {
      if (directTask) {
        setSelectedShipment({ ...directTask, id: directTrackId });
        setDirectTrackId("");
      } else if (directTrackId.length > 5) {
        toast({ 
          title: "Tracking ID Not Found", 
          description: "This consignment ID does not exist or you lack authorization.", 
          variant: "destructive" 
        });
        setDirectTrackId("");
      }
    }
  }, [directTask, directTrackId, isLookingUp, toast]);

  const filteredShipments = useMemo(() => {
    if (!shipments) return [];
    return shipments
      .filter(s => {
        const matchesSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
          s.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.receiverName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "All" || s.status === statusFilter;
        const matchesType = typeFilter === "All" || s.serviceType === typeFilter;
        const matchesDate = isShipmentInDateRange(s.createdAt, dateRange);
        
        return matchesSearch && matchesStatus && matchesType && matchesDate;
      })
      .sort((a, b) => {
        const pA = PRIORITY_MAP[a.priority || 'Medium'] || 2;
        const pB = PRIORITY_MAP[b.priority || 'Medium'] || 2;
        if (pA !== pB) return pB - pA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [shipments, searchQuery, statusFilter, typeFilter, dateRange]);

  const estimatedShippingCost = useMemo(() => {
    const isIntra = serviceLevel === "Intra-State";
    const base = isIntra ? 2500 : 5000;
    const perKgRate = isIntra ? 150 : 350;
    const weightFactor = (Number(weight) || 0) * perKgRate;
    const prioritySurcharge = priority === "High" ? 1500 : priority === "Low" ? -300 : 0;
    return Math.max(1500, Math.round(base + weightFactor + prioritySurcharge));
  }, [serviceLevel, weight, priority]);

  const estimatedErrandCost = useMemo(() => {
    const isIntra = errandServiceLevel === "Intra-State";
    const base = isIntra ? 2500 : 6500;
    const urgencyFee = errandUrgency === "Express" ? (isIntra ? 1500 : 2500) : 0;
    return base + urgencyFee;
  }, [errandServiceLevel, errandUrgency]);

  const nigerianStates = NIGERIAN_STATES;

  // Sync state for intra-state mode
  const handleServiceLevelChange = (level: "Intra-State" | "Inter-State") => {
    setServiceLevel(level);
    if (level === "Intra-State") {
      setDestState(originState);
    } else {
      if (destState === originState) {
        setDestState(originState === "Abuja" ? "Lagos" : "Abuja");
      }
    }
  };

  const handleOriginStateChange = (state: string) => {
    setOriginState(state);
    if (serviceLevel === "Intra-State") {
      setDestState(state);
      const districts = STATE_DISTRICTS[state] || [];
      if (districts.length > 0) {
        setOriginArea(districts[0]);
        setDestArea(districts[1] || districts[0]);
      }
    }
  };

  const handleErrandServiceLevelChange = (level: "Intra-State" | "Inter-State") => {
    setErrandServiceLevel(level);
    if (level === "Intra-State") {
      setErrandDestState(errandOriginState);
    } else {
      if (errandDestState === errandOriginState) {
        setErrandDestState(errandOriginState === "Abuja" ? "Lagos" : "Abuja");
      }
    }
  };

  const handleErrandOriginStateChange = (state: string) => {
    setErrandOriginState(state);
    if (errandServiceLevel === "Intra-State") {
      setErrandDestState(state);
      const districts = STATE_DISTRICTS[state] || [];
      if (districts.length > 0) {
        setErrandPickupArea(districts[0]);
        setErrandDropoffArea(districts[1] || districts[0]);
      }
    }
  };

  const handleRequestErrand = () => {
    const isIntra = errandServiceLevel === "Intra-State";
    const effectiveDestState = isIntra ? errandOriginState : errandDestState;

    if (!user || !firestore || !errandOriginState || !effectiveDestState || !wallet || !errandRecipientName || !errandRecipientPhone || !errandPickupAddress || !errandDropoffAddress || !errandInstructions) {
      toast({ title: "Incomplete Errand Details", description: "Please provide pickup/dropoff addresses, instructions, and recipient contact.", variant: "destructive" });
      return;
    }
    if (wallet.balance < estimatedErrandCost) {
      toast({ title: "Insufficient Balance", description: "Please top up your wallet to authorize this errand runner.", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    const newBalance = wallet.balance - estimatedErrandCost;
    setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });

    // Derive explicit origin and destination coordinates
    const pickupLocString = isIntra && errandPickupArea ? `${errandPickupAddress}, ${errandPickupArea}, ${errandOriginState}` : `${errandPickupAddress}, ${errandOriginState}`;
    const dropoffLocString = isIntra && errandDropoffArea ? `${errandDropoffAddress}, ${errandDropoffArea}, ${effectiveDestState}` : `${errandDropoffAddress}, ${effectiveDestState}`;

    const originCoords = resolveCoordinates(null, pickupLocString, { lat: 6.5244, lng: 3.3792 });
    const destinationCoords = resolveCoordinates(null, dropoffLocString, { lat: 9.0765, lng: 7.3986 });
    
    const errandData: any = { 
      status: 'Pending Approval', 
      serviceType: isIntra ? 'State Errand' : 'National Errand', 
      serviceScope: errandServiceLevel,
      locationUnit: profile?.assignedUnit || 'General', 
      origin: pickupLocString, 
      originState: errandOriginState,
      originArea: errandPickupArea || '',
      destination: dropoffLocString, 
      destState: effectiveDestState,
      destArea: errandDropoffArea || '',
      originCoords,
      destinationCoords,
      originLat: originCoords.lat,
      originLng: originCoords.lng,
      destLat: destinationCoords.lat,
      destLng: destinationCoords.lng,
      customerUserId: user.uid, 
      requesterEmail: user.email,
      receiverName: errandRecipientName, 
      receiverPhone: errandRecipientPhone, 
      receiverAddress: errandDropoffAddress, 
      createdAt: new Date().toISOString(), 
      orderSummary: `${errandCategory}: ${errandInstructions.slice(0, 40)}... [${errandServiceLevel.toUpperCase()}]`,
      notes: errandInstructions,
      priority: errandUrgency === 'Express' ? 'High' : 'Medium',
      estimatedCost: estimatedErrandCost,
      totalAmount: estimatedErrandCost,
      estimatedDeliveryWindow: isIntra ? '1 – 4 Hours (Local Intra-State Runner)' : '24 – 48 Hours (Inter-State Courier)',
      statusHistory: [
        {
          status: 'Request Initialized',
          timestamp: new Date().toISOString(),
          note: `Errand Runner dispatched (${errandCategory} - ${errandServiceLevel} ${errandUrgency}).`,
          operator: 'System'
        }
      ]
    };
    
    addDocumentNonBlocking(collection(firestore, 'deliveryTasks'), errandData).then(() => {
      toast({ title: "Errand Runner Dispatched!", description: `${errandServiceLevel} fulfillment confirmed.` });
      setActiveTab("tracking");
      // Reset errand form
      setErrandPickupAddress("");
      setErrandDropoffAddress("");
      setErrandInstructions("");
      setErrandRecipientName("");
      setErrandRecipientPhone("");
    }).finally(() => setLoading(false));
  };

  const handleRequestShipping = () => {
    const isIntra = serviceLevel === "Intra-State";
    const effectiveDestState = isIntra ? originState : destState;

    if (!user || !firestore || !originState || !effectiveDestState || !weight || !wallet || !receiverName || !receiverPhone || !receiverAddress) {
      toast({ title: "Incomplete details", description: "Please fill in weight, recipient details, and delivery address.", variant: "destructive" });
      return;
    }
    if (wallet.balance < estimatedShippingCost) {
      toast({ title: "Insufficient Balance", description: "Please top up your wallet to authorize consignment fulfillment.", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    const newBalance = wallet.balance - estimatedShippingCost;
    setDocumentNonBlocking(walletRef!, { balance: newBalance }, { merge: true });

    // Derive explicit origin and destination coordinates
    const originLocString = isIntra && originArea ? `${originArea}, ${originState}` : originState;
    const destLocString = isIntra && destArea ? `${receiverAddress}, ${destArea}, ${effectiveDestState}` : `${receiverAddress}, ${effectiveDestState}`;

    const originCoords = resolveCoordinates(null, originLocString, { lat: 6.5244, lng: 3.3792 });
    const destinationCoords = resolveCoordinates(null, destLocString, { lat: 9.0765, lng: 7.3986 });
    
    const shipmentData: any = { 
      status: 'Pending Approval', 
      serviceType: isIntra ? 'State Shipping' : 'National Shipping', 
      serviceScope: serviceLevel,
      locationUnit: profile?.assignedUnit || 'General', 
      origin: originLocString, 
      originState: originState,
      originArea: originArea || '',
      destination: destLocString, 
      destState: effectiveDestState,
      destArea: destArea || '',
      originCoords,
      destinationCoords,
      originLat: originCoords.lat,
      originLng: originCoords.lng,
      destLat: destinationCoords.lat,
      destLng: destinationCoords.lng,
      customerUserId: user.uid, 
      requesterEmail: user.email,
      receiverName, 
      receiverPhone, 
      receiverAddress, 
      createdAt: new Date().toISOString(), 
      orderSummary: `${packageType || 'Goods'} (${weight}kg) • [${serviceLevel.toUpperCase()}]`,
      estimatedCost: estimatedShippingCost,
      totalAmount: estimatedShippingCost,
      estimatedDeliveryWindow: isIntra ? '4 – 12 Hours (Same-Day Express)' : '24 – 48 Hours (Interstate Corridor)',
      statusHistory: [
        {
          status: 'Request Initialized',
          timestamp: new Date().toISOString(),
          note: `Consignment authorized for ${serviceLevel} fulfillment (${isIntra ? 'Same-Day / Local' : 'Interstate Network'}).`,
          operator: 'System'
        }
      ]
    };

    if (profile?.role === 'Admin') {
      shipmentData.priority = priority;
    }
    
    addDocumentNonBlocking(collection(firestore, 'deliveryTasks'), shipmentData).then(() => {
      toast({ title: "Consignment Fulfillment Authorized!", description: `${serviceLevel} dispatch registered. Awaiting agent assignment.` });
      setActiveTab("tracking");
      // Reset form
      setWeight("");
      setReceiverName("");
      setReceiverPhone("");
      setReceiverAddress("");
    }).finally(() => setLoading(false));
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto px-2">
      <div className="flex justify-between items-center px-2 py-2 no-print">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Logistics Hub
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleManualRefresh}
            className="h-6 px-2 text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full flex items-center gap-1.5 shadow-2xs"
            title="Real-time Firestore Snapshot Listener & Polling Active"
          >
            <span className={cn("h-2 w-2 rounded-full bg-emerald-500", isSyncing ? "animate-spin" : "animate-ping")} />
            <span>Live Sync</span>
            <RefreshCw className={cn("h-2.5 w-2.5 opacity-70", isSyncing && "animate-spin")} />
          </Button>
        </div>
        <WalletBalanceDisplay balance={wallet?.balance} badgeStyle className="bg-white border shadow-sm text-primary" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 no-print">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap gap-1 rounded-2xl w-full border shadow-sm">
          <TabsTrigger value="tracking" className="flex-1 rounded-xl h-10 font-black text-[10px] uppercase gap-1.5 transition-all">
            <History className="h-3.5 w-3.5" /> Track
          </TabsTrigger>
          <TabsTrigger value="new-shipment" className="flex-1 rounded-xl h-10 font-black text-[10px] uppercase gap-1.5 transition-all">
            <Map className="h-3.5 w-3.5" /> Shipping
          </TabsTrigger>
          <TabsTrigger value="errand" className="flex-1 rounded-xl h-10 font-black text-[10px] uppercase gap-1.5 transition-all">
            <Zap className="h-3.5 w-3.5" /> Errand
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50 group-focus-within:text-primary transition-colors" />
                <Input 
                  className="pl-9 pr-9 bg-white rounded-xl h-11 text-xs border-2 font-bold focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm" 
                  placeholder="Filter by ID, Service, or Receiver..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.length > 5) {
                      setDirectTrackId(searchQuery);
                    }
                  }}
                />
                {searchQuery && (
                   <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                   >
                     <X className="h-3 w-3 text-muted-foreground" />
                   </button>
                )}
              </div>
              {searchQuery.length > 5 && (
                <Button 
                  variant="default" 
                  className="h-11 rounded-xl px-4 font-black text-[10px] uppercase gap-2 shrink-0 shadow-lg shadow-primary/20"
                  onClick={() => setDirectTrackId(searchQuery)}
                  disabled={isLookingUp}
                >
                  {isLookingUp ? <Loader2 className="h-3 w-3 animate-spin" /> : "Track ID"}
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                Showing {filteredShipments.length} {filteredShipments.length === 1 ? 'Consignment' : 'Consignments'}
              </p>
              {searchQuery && (
                <p className="text-[9px] font-black uppercase text-primary animate-pulse">Filtering Active</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white rounded-xl h-10 text-[9px] border-2 font-black uppercase flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["All", "Pending Approval", "Processing", "In Transit", "Out for Delivery", "Delivered", "Cancelled"].map(s => (
                      <SelectItem key={s} value={s} className="text-[9px] font-black uppercase">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-white rounded-xl h-10 text-[9px] border-2 font-black uppercase flex-1">
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["All", "State Shipping", "National Shipping", "State Errand", "National Errand", "Errand Runner", "Marketplace", "Food", "Laundry"].map(t => (
                      <SelectItem key={t} value={t} className="text-[9px] font-black uppercase">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          {activeSelectedShipment && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 mb-4"
            >
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                  <Map className="h-3.5 w-3.5 animate-pulse" /> Selected Consignment Route ({activeSelectedShipment.id.slice(0, 8)})
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 rounded-lg px-2"
                  onClick={() => setSelectedShipment(null)}
                >
                  Hide Map
                </Button>
              </div>
              <RealMap 
                origin={activeSelectedShipment.origin || "Lagos"} 
                destination={activeSelectedShipment.destination || "Abuja"} 
                status={activeSelectedShipment.status} 
                originCoords={activeSelectedShipment.originCoords || activeSelectedShipment.originCoordinates}
                destinationCoords={activeSelectedShipment.destinationCoords || activeSelectedShipment.destinationCoordinates}
                consignmentId={activeSelectedShipment.id}
              />
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 gap-3">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredShipments.length > 0 ? (
              filteredShipments.map(shipment => {
                const isIntra = shipment.serviceScope === "Intra-State" || 
                  shipment.serviceType === "State Shipping" || 
                  shipment.serviceType === "State Errand" ||
                  (shipment.origin && shipment.destination && (
                    shipment.origin.toLowerCase().includes("lagos") && shipment.destination.toLowerCase().includes("lagos") ||
                    shipment.origin.toLowerCase().includes("abuja") && shipment.destination.toLowerCase().includes("abuja") ||
                    shipment.origin.toLowerCase().includes("rivers") && shipment.destination.toLowerCase().includes("rivers") ||
                    shipment.origin.toLowerCase().includes("kano") && shipment.destination.toLowerCase().includes("kano") ||
                    shipment.origin.toLowerCase().includes("oyo") && shipment.destination.toLowerCase().includes("oyo")
                  ));

                return (
                  <Card key={shipment.id} className="p-4 border-none shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl bg-white" onClick={() => setSelectedShipment(shipment)}>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-inner", shipment.status === 'Delivered' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary")}>
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-xs uppercase tracking-tight">{shipment.id.slice(0, 8)}</p>
                            <ConsignmentStatusBadge status={shipment.status} />
                            <Badge className={cn(
                              "text-[7px] font-black uppercase h-4 px-1.5 border-none",
                              isIntra ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                            )}>
                              {isIntra ? "Intra-State" : "Inter-State"}
                            </Badge>
                            <Badge className={cn(
                              "text-[7px] font-black uppercase h-4 px-1.5 border-none",
                              shipment.priority === 'High' ? "bg-red-600 text-white" : 
                              shipment.priority === 'Low' ? "bg-blue-400 text-white" : "bg-gray-500 text-white"
                            )}>
                              {shipment.priority || 'Medium'}
                            </Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[240px] font-medium">
                            <span className="font-bold text-slate-700">{shipment.origin || 'Node'}</span> ➔ <span className="font-bold text-primary">{shipment.destination || 'Hub Target'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 transition-all bg-muted/30 hover:bg-primary/10 hover:text-primary shrink-0" 
                          title="Share Tracking Link"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShareTrackingLink(shipment)
                          }}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full opacity-40 hover:opacity-100 transition-opacity bg-muted/30 shrink-0" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-5 rounded-[2rem] border-2 shadow-2xl z-[100]" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-5">
                              <div className="flex items-center justify-between border-b pb-3 border-dashed">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Dispatch Log</h4>
                                <p className="text-[8px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{shipment.id.slice(0, 8)}</p>
                              </div>
                              <div className="space-y-5 relative pl-4 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-[2px] before:bg-muted-foreground/10 before:rounded-full">
                                {(shipment.statusHistory || []).slice().reverse().map((log: any, lidx: number) => (
                                  <div key={lidx} className="relative group/log">
                                    <div className={cn(
                                      "absolute -left-[17.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 bg-white transition-all", 
                                      lidx === 0 ? "border-primary bg-primary scale-110" : "border-muted-foreground/30"
                                    )} />
                                    <p className={cn("text-[10px] font-black uppercase leading-none mb-1", lidx === 0 ? "text-primary" : "text-foreground")}>
                                      {log.status}
                                    </p>
                                    <div className="flex items-center gap-2 opacity-60">
                                      <Clock className="h-2 w-2" />
                                      <p className="text-[8px] text-muted-foreground font-black uppercase">
                                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                      </p>
                                    </div>
                                    {log.note && (
                                      <p className="text-[10px] text-muted-foreground/70 font-medium italic mt-1.5 leading-tight bg-muted/30 p-2 rounded-lg border border-muted/20">
                                        &quot;{log.note}&quot;
                                      </p>
                                    )}
                                    <p className="text-[7px] font-black uppercase text-muted-foreground/40 mt-1 tracking-tighter">Verified by {log.operator || "Auto-Dispatch"}</p>
                                  </div>
                                ))}
                                {(!shipment.statusHistory || shipment.statusHistory.length === 0) && (
                                  <div className="py-4 text-center">
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase opacity-30">No Logs Recorded</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30" />
                      </div>
                    </div>

                    {/* Compact Step-based Tracker */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <ConsignmentStepTracker 
                        status={shipment.status} 
                        statusHistory={shipment.statusHistory} 
                        compact 
                        className="p-3 bg-slate-50/50 rounded-xl"
                      />
                    </div>

                    {/* Activity Preview Section */}
                    {shipment.statusHistory && shipment.statusHistory.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-dashed flex items-center gap-2 overflow-hidden">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                        <p className="text-[9px] font-black uppercase text-muted-foreground truncate tracking-tight">
                          Last Activity: <span className="text-foreground">{shipment.statusHistory[shipment.statusHistory.length - 1].status}</span>
                          <span className="mx-2 opacity-20">|</span>
                          <span className="font-medium italic opacity-70">&quot;{shipment.statusHistory[shipment.statusHistory.length - 1].note || 'Processing...'}&quot;</span>
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-24 border-2 border-dashed rounded-[2rem] opacity-30 font-black uppercase text-[10px]">Manifest Empty</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="new-shipment">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Consignment Dispatch Protocol
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Intra-State Municipal &amp; Inter-State Regional Logistics Handshake
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              {/* Corridor Scope Selector */}
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                  Logistics Service Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleServiceLevelChange("Intra-State")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between",
                      serviceLevel === "Intra-State"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black uppercase text-emerald-700 tracking-tight">Intra-State</span>
                      <Badge className="bg-emerald-600 text-white text-[7px] font-black uppercase h-4 px-1.5 border-none">Local</Badge>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Within same state • 4-12h Express</p>
                    <p className="text-[10px] font-black text-emerald-800 mt-1">From ₦2,500</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleServiceLevelChange("Inter-State")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between",
                      serviceLevel === "Inter-State"
                        ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black uppercase text-blue-700 tracking-tight">Inter-State</span>
                      <Badge className="bg-blue-600 text-white text-[7px] font-black uppercase h-4 px-1.5 border-none">Transit</Badge>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Cross-country corridor • 24-48h</p>
                    <p className="text-[10px] font-black text-blue-800 mt-1">From ₦5,000</p>
                  </button>
                </div>
              </div>

              {/* Package & Weight info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">Package Type</label>
                  <Input 
                    placeholder="e.g. Documents, Electronics, Apparel..." 
                    value={packageType} 
                    onChange={(e) => setPackageType(e.target.value)} 
                    className="h-10 rounded-xl border-2 text-xs font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">Weight (KG)</label>
                  <Input 
                    type="number" 
                    step="0.5"
                    min="0.1"
                    value={weight} 
                    onChange={(e) => setWeight(e.target.value)} 
                    placeholder="2.5" 
                    className="h-10 rounded-xl border-2 text-xs font-black" 
                  />
                </div>
              </div>

              {profile?.role === 'Admin' && (
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">Priority SLA</label>
                  <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                    <SelectTrigger className="h-10 rounded-xl border-2 text-xs font-black"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Low" className="text-xs font-black">Low Priority (-₦300)</SelectItem>
                      <SelectItem value="Medium" className="text-xs font-black">Standard Priority</SelectItem>
                      <SelectItem value="High" className="text-xs font-black text-red-600">High / Express (+₦1,500)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* State & Corridor routing logic */}
              {serviceLevel === "Intra-State" ? (
                <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-black uppercase text-emerald-800 tracking-widest ml-1">State Location (Local Corridor)</label>
                      <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Within Same State</span>
                    </div>
                    <Select value={originState} onValueChange={handleOriginStateChange}>
                      <SelectTrigger className="h-10 rounded-xl border-2 border-emerald-300 bg-white text-xs font-bold"><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent className="max-h-60 rounded-xl">{nigerianStates.map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  {/* Intra-State District selections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Pickup Area / Municipal District</label>
                      <Input 
                        placeholder="e.g. Ikeja, Central Business District..." 
                        value={originArea} 
                        onChange={(e) => setOriginArea(e.target.value)} 
                        className="h-10 rounded-xl border-2 bg-white text-xs font-bold" 
                      />
                      {STATE_DISTRICTS[originState] && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {STATE_DISTRICTS[originState].slice(0, 4).map(d => (
                            <button 
                              key={d} 
                              type="button" 
                              onClick={() => setOriginArea(d)} 
                              className={cn(
                                "text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md border transition-all",
                                originArea === d ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Dropoff Area / Municipal District</label>
                      <Input 
                        placeholder="e.g. Lekki Phase 1, Garki, Bodija..." 
                        value={destArea} 
                        onChange={(e) => setDestArea(e.target.value)} 
                        className="h-10 rounded-xl border-2 bg-white text-xs font-bold" 
                      />
                      {STATE_DISTRICTS[originState] && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {STATE_DISTRICTS[originState].slice(0, 4).map(d => (
                            <button 
                              key={d} 
                              type="button" 
                              onClick={() => setDestArea(d)} 
                              className={cn(
                                "text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md border transition-all",
                                destArea === d ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-2xl bg-blue-50/40 border border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-blue-800 ml-1">Origin State</label>
                      <Select value={originState} onValueChange={setOriginState}>
                        <SelectTrigger className="h-10 rounded-xl border-2 border-blue-300 bg-white text-xs font-bold"><SelectValue placeholder="Origin" /></SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl">{nigerianStates.map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-blue-800 ml-1">Destination State</label>
                      <Select value={destState} onValueChange={setDestState}>
                        <SelectTrigger className="h-10 rounded-xl border-2 border-blue-300 bg-white text-xs font-bold"><SelectValue placeholder="Target" /></SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl">{nigerianStates.map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  {originState === destState && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                      <span className="text-[9px] text-amber-800 font-bold">
                        Notice: Origin and destination are the same. Switch to Intra-State mode for discounted local rates!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Live Route Corridor Map Preview */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Live Corridor Route Preview
                  </label>
                  <span className="text-[9px] text-muted-foreground font-mono font-bold">
                    {serviceLevel === "Intra-State" ? "Intra-State Local Corridor" : "Inter-State Transit Network"}
                  </span>
                </div>
                <RealMap 
                  origin={serviceLevel === "Intra-State" && originArea ? `${originArea}, ${originState}` : originState} 
                  destination={serviceLevel === "Intra-State" && destArea ? `${destArea}, ${destState}` : destState} 
                  status="Route Planning" 
                  height="240px"
                  title={serviceLevel === "Intra-State" ? `Local Corridor: ${originArea || originState} ➔ ${destArea || destState}` : `Interstate Corridor: ${originState} ➔ ${destState}`}
                />
              </div>

              {/* Receiver Info */}
              <div className="space-y-5 pt-6 border-t border-dashed">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Receiver Name</label>
                    <Input placeholder="John Doe" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="h-10 rounded-xl border-2 text-xs font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Phone Number</label>
                    <Input placeholder="080..." value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} className="h-10 rounded-xl border-2 text-xs font-black tracking-widest" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Full Delivery Address &amp; Landmarks</label>
                  <Textarea placeholder="House / Office number, street name, landmark, gate instructions..." value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} className="min-h-[80px] rounded-2xl border-2 text-xs font-medium" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 p-8 flex flex-col gap-4 border-t">
              {/* Transparent Cost Breakdown */}
              <div className="w-full bg-white p-4 rounded-2xl border space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-600">Base {serviceLevel} Fare</span>
                  <span className="font-black text-slate-800">₦{serviceLevel === "Intra-State" ? "2,500" : "5,000"}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-600">Weight Surcharge ({weight || 0}kg @ ₦{serviceLevel === "Intra-State" ? "150" : "350"}/kg)</span>
                  <span className="font-black text-slate-800">₦{Math.round((Number(weight) || 0) * (serviceLevel === "Intra-State" ? 150 : 350)).toLocaleString()}</span>
                </div>
                {priority !== "Medium" && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-600">Priority Surcharge ({priority})</span>
                    <span className="font-black text-slate-800">{priority === "High" ? "+₦1,500" : "-₦300"}</span>
                  </div>
                )}
                <div className="pt-2 border-t flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Estimated Delivery SLA</p>
                    <p className="text-[10px] font-black text-emerald-700">{serviceLevel === "Intra-State" ? "4 – 12 Hours (Same-Day Express)" : "24 – 48 Hours (Interstate Highway)"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Total Cost</p>
                    <p className="text-2xl font-black text-primary tracking-tighter">₦{estimatedShippingCost.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full h-16 font-black rounded-2xl shadow-xl uppercase text-sm bg-primary hover:bg-primary/90 transition-all" onClick={handleRequestShipping} disabled={loading || !weight || !originState || !receiverName || !receiverAddress}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `Authorize ${serviceLevel} Fulfillment`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="errand">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" /> On-Demand Errand Runner
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Point-to-Point Task, Shopping &amp; Parcel Dispatch Service
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              {/* Errand Scope Selector */}
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                  Errand Service Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleErrandServiceLevelChange("Intra-State")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between",
                      errandServiceLevel === "Intra-State"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black uppercase text-emerald-700 tracking-tight">Intra-State Runner</span>
                      <Badge className="bg-emerald-600 text-white text-[7px] font-black uppercase h-4 px-1.5 border-none">Local</Badge>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">City-wide runner • 1-4h SLA</p>
                    <p className="text-[10px] font-black text-emerald-800 mt-1">From ₦2,500</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleErrandServiceLevelChange("Inter-State")}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between",
                      errandServiceLevel === "Inter-State"
                        ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black uppercase text-blue-700 tracking-tight">Inter-State Courier</span>
                      <Badge className="bg-blue-600 text-white text-[7px] font-black uppercase h-4 px-1.5 border-none">Transit</Badge>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Cross-state handover • 24-48h</p>
                    <p className="text-[10px] font-black text-blue-800 mt-1">From ₦6,500</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">Errand Category</label>
                  <Select value={errandCategory} onValueChange={setErrandCategory}>
                    <SelectTrigger className="h-10 rounded-xl border-2 text-xs font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Personal Runner" className="text-xs font-bold">Personal Runner</SelectItem>
                      <SelectItem value="Document Delivery" className="text-xs font-bold">Document &amp; File Handover</SelectItem>
                      <SelectItem value="Market / Grocery" className="text-xs font-bold">Market / Grocery Shopping</SelectItem>
                      <SelectItem value="Pharmacy & Meds" className="text-xs font-bold">Pharmacy &amp; Prescription</SelectItem>
                      <SelectItem value="Custom Pickup" className="text-xs font-bold">Custom Item Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">Speed / Urgency</label>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant={errandUrgency === "Standard" ? "default" : "outline"} className="flex-1 rounded-xl h-10 text-[9px] font-black uppercase" onClick={() => setErrandUrgency("Standard")}>Standard</Button>
                    <Button size="sm" variant={errandUrgency === "Express" ? "default" : "outline"} className="flex-1 rounded-xl h-10 text-[9px] font-black uppercase text-red-600 border-red-200" onClick={() => setErrandUrgency("Express")}>⚡ Express</Button>
                  </div>
                </div>
              </div>

              {/* Errand Geographic Inputs */}
              {errandServiceLevel === "Intra-State" ? (
                <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-emerald-800 ml-1">State Location</label>
                    <Select value={errandOriginState} onValueChange={handleErrandOriginStateChange}>
                      <SelectTrigger className="h-10 rounded-xl border-2 border-emerald-300 bg-white text-xs font-bold"><SelectValue placeholder="Pickup State" /></SelectTrigger>
                      <SelectContent className="max-h-60 rounded-xl">{nigerianStates.map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Pickup Area / LGA</label>
                      <Input placeholder="e.g. Ikeja, Victoria Island..." value={errandPickupArea} onChange={(e) => setErrandPickupArea(e.target.value)} className="h-10 rounded-xl border-2 bg-white text-xs font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Dropoff Area / LGA</label>
                      <Input placeholder="e.g. Lekki, Yaba, Garki..." value={errandDropoffArea} onChange={(e) => setErrandDropoffArea(e.target.value)} className="h-10 rounded-xl border-2 bg-white text-xs font-bold" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-2xl bg-blue-50/40 border border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-blue-800 ml-1">Pickup State</label>
                      <Select value={errandOriginState} onValueChange={setErrandOriginState}>
                        <SelectTrigger className="h-10 rounded-xl border-2 border-blue-300 bg-white text-xs font-bold"><SelectValue placeholder="Pickup State" /></SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl">{nigerianStates.map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-blue-800 ml-1">Dropoff State</label>
                      <Select value={errandDestState} onValueChange={setErrandDestState}>
                        <SelectTrigger className="h-10 rounded-xl border-2 border-blue-300 bg-white text-xs font-bold"><SelectValue placeholder="Dropoff State" /></SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl">{nigerianStates.map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Pickup Address / Landmark</label>
                  <Input placeholder="Shop 4, Balogun Market or Home Address..." value={errandPickupAddress} onChange={(e) => setErrandPickupAddress(e.target.value)} className="h-10 rounded-xl border-2 text-xs font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Dropoff Address / Landmark</label>
                  <Input placeholder="Plot 12, Victoria Island or Office..." value={errandDropoffAddress} onChange={(e) => setErrandDropoffAddress(e.target.value)} className="h-10 rounded-xl border-2 text-xs font-bold" />
                </div>
              </div>

              {/* Errand Live Route Corridor Map Preview */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Live Errand Runner Corridor Map
                  </label>
                  <span className="text-[9px] text-muted-foreground font-mono font-bold">
                    {errandServiceLevel === "Intra-State" ? "Intra-State Runner" : "Inter-State Transit Corridor"}
                  </span>
                </div>
                <RealMap 
                  origin={errandServiceLevel === "Intra-State" && errandPickupArea ? `${errandPickupArea}, ${errandOriginState}` : (errandPickupAddress ? `${errandPickupAddress}, ${errandOriginState}` : errandOriginState)} 
                  destination={errandServiceLevel === "Intra-State" && errandDropoffArea ? `${errandDropoffArea}, ${errandDestState}` : (errandDropoffAddress ? `${errandDropoffAddress}, ${errandDestState}` : errandDestState)} 
                  status="Errand Corridor" 
                  height="240px"
                  title={`Runner Route: ${errandOriginState} ➔ ${errandDestState}`}
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Detailed Task Instructions for Runner</label>
                <Textarea placeholder="Describe what the runner should purchase, collect, verify, or deliver in detail..." value={errandInstructions} onChange={(e) => setErrandInstructions(e.target.value)} className="min-h-[80px] rounded-2xl border-2 text-xs font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Recipient / Contact Name</label>
                  <Input placeholder="Jane Doe" value={errandRecipientName} onChange={(e) => setErrandRecipientName(e.target.value)} className="h-10 rounded-xl border-2 text-xs font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Recipient / Contact Phone</label>
                  <Input placeholder="080..." value={errandRecipientPhone} onChange={(e) => setErrandRecipientPhone(e.target.value)} className="h-10 rounded-xl border-2 text-xs font-black tracking-widest" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 p-8 flex flex-col gap-4 border-t">
              <div className="flex justify-between w-full items-center">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Errand Service Fee ({errandServiceLevel})</p>
                  <p className="text-[9px] text-muted-foreground">{errandServiceLevel === "Intra-State" ? "1-4 Hours Local Runner SLA" : "24-48 Hours Cross-State Transit SLA"}</p>
                </div>
                <p className="text-3xl font-black text-primary tracking-tighter">₦{estimatedErrandCost.toLocaleString()}</p>
              </div>
              <Button size="lg" className="w-full h-16 font-black rounded-2xl shadow-xl uppercase text-sm bg-primary hover:bg-primary/90 transition-all" onClick={handleRequestErrand} disabled={loading || !errandOriginState || !errandPickupAddress || !errandDropoffAddress || !errandInstructions || !errandRecipientName || !errandRecipientPhone}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `Authorize ${errandServiceLevel} Runner Dispatch`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!activeSelectedShipment} onOpenChange={(open) => !open && setSelectedShipment(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l-8 border-primary p-0 bg-white rounded-l-[3rem]">
          {activeSelectedShipment && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-10 bg-muted/20 border-b">
                <div className="flex justify-between items-start mb-4">
                  <SheetTitle className="text-3xl font-black uppercase tracking-tighter">{activeSelectedShipment.id.slice(0, 8)}</SheetTitle>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedShipment(null)}><X className="h-6 w-6" /></Button>
                </div>
                <SheetDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{activeSelectedShipment.serviceType}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 p-10 space-y-10">
                <RealMap 
                  origin={activeSelectedShipment.origin || "Lagos"} 
                  destination={activeSelectedShipment.destination || "Abuja"} 
                  status={activeSelectedShipment.status} 
                  originCoords={activeSelectedShipment.originCoords || activeSelectedShipment.originCoordinates}
                  destinationCoords={activeSelectedShipment.destinationCoords || activeSelectedShipment.destinationCoordinates}
                  consignmentId={activeSelectedShipment.id}
                />

                {/* Step-based Status Tracker */}
                <ConsignmentStepTracker 
                  status={activeSelectedShipment.status} 
                  statusHistory={activeSelectedShipment.statusHistory} 
                />

                {/* Sheet Shipment History Date Range Filter Bar */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">History Filter</p>
                        <p className="text-xs font-black text-slate-800">Timeframe Filter</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-300">
                      {dateRange.preset === "all" ? "All Time" : dateRange.preset}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-slate-500 font-medium">Filter consignment records &amp; logs:</p>
                    <DateRangePicker value={dateRange} onChange={setDateRange} compact />
                  </div>
                </div>

                {/* Deep Tracking Link Sharing Module */}
                <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl space-y-4 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Share2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient Deep Link</p>
                        <p className="text-xs font-black text-white">Share Tracking Link</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[8px] font-black uppercase px-2">
                      Public Access
                    </Badge>
                  </div>

                  <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                    Allow non-registered recipients or third parties to view live location map &amp; step progress without logging in.
                  </p>

                  {/* Copy Link Input Bar */}
                  <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-1.5 px-2 text-slate-400 min-w-0 flex-1">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-[10px] font-mono font-medium truncate text-slate-300">
                        {origin ? `${origin}/logistics?track=${activeSelectedShipment.id}` : `/logistics?track=${activeSelectedShipment.id}`}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      className={cn(
                        "h-8 px-3 rounded-xl font-black text-[10px] uppercase gap-1 shrink-0 transition-all",
                        copiedTrackId === activeSelectedShipment.id ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-primary text-white hover:bg-primary/90"
                      )}
                      onClick={() => handleCopyTrackingLink(activeSelectedShipment.id)}
                    >
                      {copiedTrackId === activeSelectedShipment.id ? (
                        <>
                          <Check className="h-3 w-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Channel Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 bg-slate-800/80 border-slate-700 hover:bg-emerald-950 hover:border-emerald-700 hover:text-emerald-300 text-slate-200 text-[9px] font-black uppercase rounded-xl gap-1.5"
                      asChild
                    >
                      <a 
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Track live consignment progress map for shipment #${activeSelectedShipment.id.slice(0, 8)}: ${origin}/logistics?track=${activeSelectedShipment.id}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageSquare className="h-3 w-3 text-emerald-400" /> WhatsApp
                      </a>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 bg-slate-800/80 border-slate-700 hover:bg-blue-950 hover:border-blue-700 hover:text-blue-300 text-slate-200 text-[9px] font-black uppercase rounded-xl gap-1.5"
                      asChild
                    >
                      <a 
                        href={`mailto:?subject=${encodeURIComponent(`Consignment Tracking #${activeSelectedShipment.id.slice(0, 8)}`)}&body=${encodeURIComponent(`View the live progress map for consignment #${activeSelectedShipment.id.slice(0, 8)}:\n\n${origin}/logistics?track=${activeSelectedShipment.id}`)}`}
                      >
                        <Mail className="h-3 w-3 text-blue-400" /> Email
                      </a>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 bg-slate-800/80 border-slate-700 hover:bg-primary/20 hover:border-primary/60 text-slate-200 text-[9px] font-black uppercase rounded-xl gap-1.5"
                      onClick={() => handleShareTrackingLink(activeSelectedShipment)}
                    >
                      <ExternalLink className="h-3 w-3 text-primary" /> Native
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/30 p-8 rounded-[2.5rem] border-4 border-dashed space-y-6 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Scope</p>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase px-2.5 py-1 border-none",
                        activeSelectedShipment.serviceScope === "Intra-State" || activeSelectedShipment.serviceType?.includes("State") 
                          ? "bg-emerald-600 text-white" 
                          : "bg-blue-600 text-white"
                      )}>
                        {activeSelectedShipment.serviceScope || (activeSelectedShipment.serviceType?.includes("National") ? "Inter-State" : "Intra-State")} Corridor
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Priority</p>
                      <Badge className={cn(
                        "text-[10px] font-black uppercase h-6 px-3 rounded-lg border-none",
                        activeSelectedShipment.priority === 'High' ? "bg-red-600 text-white" : 
                        activeSelectedShipment.priority === 'Low' ? "bg-blue-400 text-white" : "bg-gray-500 text-white"
                      )}>
                        {activeSelectedShipment.priority || 'Medium'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Origin Point</p>
                    <p className="text-sm font-bold leading-tight">{activeSelectedShipment.origin || "Processing Node"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Target Endpoint</p>
                    <p className="text-sm font-bold leading-tight">{activeSelectedShipment.destination}</p>
                  </div>
                  {activeSelectedShipment.estimatedDeliveryWindow && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Transit SLA Window</p>
                      <p className="text-xs font-black text-emerald-700">{activeSelectedShipment.estimatedDeliveryWindow}</p>
                    </div>
                  )}
                  {activeSelectedShipment.packageImageUrl && (
                    <div className="space-y-1.5 pt-2">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Manifest Image</p>
                       <div className="relative aspect-video rounded-2xl overflow-hidden border-2 bg-muted/50">
                         <Image src={activeSelectedShipment.packageImageUrl} alt="Package" fill unoptimized referrerPolicy="no-referrer" className="object-cover" />
                       </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status Phase</p>
                    <ConsignmentStatusBadge status={activeSelectedShipment.status} className="h-7 text-xs px-3" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Status Timeline</h4>
                  </div>
                  
                  <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted-foreground/10 before:rounded-full">
                    {activeSelectedShipment.statusHistory && activeSelectedShipment.statusHistory.length > 0 ? (
                      [...activeSelectedShipment.statusHistory].reverse().map((entry: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className={cn(
                            "absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 bg-white",
                            idx === 0 ? "border-primary shadow-[0_0_8px_rgba(0,102,255,0.4)]" : "border-muted-foreground/30"
                          )} />
                          <div className="space-y-1">
                            <p className={cn("text-[11px] font-black uppercase tracking-tight leading-none", idx === 0 ? "text-primary" : "text-foreground")}>
                              {entry.status}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase opacity-60">
                              {new Date(entry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} • {entry.operator || 'System'}
                            </p>
                            {entry.note && (
                              <p className="text-[11px] font-medium text-muted-foreground/80 leading-snug italic max-w-[240px]">
                                &quot;{entry.note}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="relative">
                        <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-white" />
                        <div className="space-y-1">
                          <p className="text-[11px] font-black uppercase text-primary tracking-tight leading-none">Manifest Initialized</p>
                          <p className="text-[9px] text-muted-foreground font-black uppercase opacity-60">
                            {new Date(activeSelectedShipment.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                          <p className="text-[11px] font-medium text-muted-foreground/80 leading-snug italic">&quot;Initial tracking entry placeholder.&quot;</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorized Date</span>
                    <span className="text-xs font-bold">{new Date(activeSelectedShipment.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Est. Delivery</span>
                    <span className="text-xs font-bold text-green-600">
                      {activeSelectedShipment.status === 'Delivered' 
                        ? 'Delivered' 
                        : new Date(new Date(activeSelectedShipment.createdAt).getTime() + 48 * 60 * 60 * 1000).toLocaleDateString() + ' (Approx.)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partner Recipient</span>
                    <span className="text-xs font-bold uppercase">{activeSelectedShipment.receiverName || "Authorized Unit"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Settlement Value</span>
                    <span className="text-xl font-black text-primary">₦{(activeSelectedShipment.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-muted/10 border-t space-y-3 mt-auto no-print pb-10">
                <Button 
                  className="w-full h-14 font-black gap-2.5 rounded-2xl text-xs uppercase shadow-xl bg-primary hover:bg-primary/90 text-white transition-all" 
                  onClick={() => handleShareTrackingLink(activeSelectedShipment)}
                >
                  <Share2 className="h-4 w-4" /> Share Tracking Link
                </Button>
                <Button className="w-full h-12 font-black gap-2.5 rounded-2xl text-xs uppercase shadow-sm" variant="outline" onClick={() => triggerReceiptPrint()}>
                  <Printer className="h-4 w-4" /> Thermal Receipt
                </Button>
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:bg-transparent h-8" onClick={() => setSelectedShipment(null)}>Close Manifest</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}