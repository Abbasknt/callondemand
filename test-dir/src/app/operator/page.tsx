
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { 
  Truck, 
  MapPin, 
  Loader2, 
  Navigation, 
  Package, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  UserCircle,
  Activity,
  Zap,
  Target,
  History,
  AlertCircle,
  Utensils,
  Shirt,
  ShieldCheck,
  Timer,
  Power,
  PhoneCall,
  Printer,
  Share2,
  X,
  Search,
  Download
} from "lucide-react"
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit, doc, orderBy } from "firebase/firestore"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { triggerReceiptPrint, exportToCsv } from "@/lib/export-utils"

import { useCallback } from "react"

const PRIORITY_MAP: Record<string, number> = {
  'High': 3,
  'Medium': 2,
  'Low': 1
};

/**
 * @fileOverview Operator Hub for physical fulfillment.
 * Hardened for Next.js 15 production build stability.
 */

export default function OperatorHub() {
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const router = useRouter()
  
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const myTasksQuery = useMemoFirebase(() => {
    if (!firestore || !user || !profile) return null;
    return query(
      collection(firestore, 'deliveryTasks'), 
      where('operatorId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
  }, [firestore, user, !!profile]);
  const { data: myTasks } = useCollection(myTasksQuery);

  const availablePoolQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    const unit = profile.assignedUnit || 'General';
    return query(
      collection(firestore, 'deliveryTasks'),
      where('locationUnit', '==', unit),
      where('status', '==', 'Ready for Pickup'),
      limit(50)
    );
  }, [firestore, !!profile, profile?.assignedUnit]);
  const { data: poolDeliveries } = useCollection(availablePoolQuery);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login');
    if (profile && !['Operator', 'Admin', 'Fleet Operator'].includes(profile.role)) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, profile, router]);

  const filterTasks = useCallback((taskList: any[]) => {
    if (!taskList) return [];
    return taskList
      .filter(t => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
          t.id.toLowerCase().includes(q) || 
          t.serviceType?.toLowerCase().includes(q) || 
          t.receiverName?.toLowerCase().includes(q);
        
        const matchesStatus = statusFilter === "All" || t.status === statusFilter;
        const matchesType = typeFilter === "All" || t.serviceType === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const pA = PRIORITY_MAP[a.priority || 'Medium'] || 2;
        const pB = PRIORITY_MAP[b.priority || 'Medium'] || 2;
        if (pA !== pB) return pB - pA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [searchQuery, statusFilter, typeFilter]);

  const activeDeliveries = useMemo(() => filterTasks(myTasks?.filter(t => t.status !== 'Delivered' && t.status !== 'Rejected') || []), [myTasks, filterTasks]);
  const historyDeliveries = useMemo(() => filterTasks(myTasks?.filter(t => t.status === 'Delivered') || []), [myTasks, filterTasks]);
  const filteredPool = useMemo(() => filterTasks(poolDeliveries || []), [poolDeliveries, filterTasks]);

  const handleExportHistory = () => {
    if (!historyDeliveries.length) return;
    const data = historyDeliveries.map(t => ({
      Reference: t.id,
      CompletedAt: new Date(t.lastUpdatedAt).toLocaleString(),
      Service: t.serviceType,
      Partner: t.receiverName,
      Amount: t.totalAmount || 0,
      Status: t.status
    }));
    exportToCsv(`Operator_Dispatch_History_${new Date().toISOString().split('T')[0]}.csv`, data);
    toast({ title: "History Exported" });
  };

  const handleUpdateStatus = (taskId: string, newStatus: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'deliveryTasks', taskId), { 
      status: newStatus,
      lastUpdatedAt: new Date().toISOString(),
      [`${newStatus.replace(/\s/g, '')}At`]: new Date().toISOString()
    });
    toast({ title: "Manifest Updated", description: `Task set to ${newStatus}.` });
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  const handleClaimTask = (taskId: string) => {
    if (!firestore || !user) return;
    updateDocumentNonBlocking(doc(firestore, 'deliveryTasks', taskId), {
      operatorId: user.uid,
      operatorName: user.displayName || 'COD Operator',
      status: 'Claimed',
      claimedAt: new Date().toISOString()
    });
    toast({ title: "Manifest Bound", description: "This task is now in your active load." });
    setActiveTab("active");
  };

  const getServiceIcon = (type: string = "") => {
    if (type.includes('Food')) return <Utensils className="h-7 w-7" />;
    if (type.includes('Laundry')) return <Shirt className="h-7 w-7" />;
    if (type.includes('Errand') || type.includes('Shipping')) return <Zap className="h-7 w-7" />;
    return <Truck className="h-7 w-7" />;
  };

  if (isUserLoading || isProfileLoading || !mounted) {
    return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-accent">
            <ShieldCheck className="h-7 w-7 text-accent" /> Dispatch Hub
          </h2>
          <Badge className="bg-accent/10 text-accent border-none uppercase font-black text-[8px] h-5">{profile?.assignedUnit || 'General'}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isOnline ? "default" : "outline"} size="sm" className={cn("rounded-full px-4 gap-2 font-black h-9 text-[10px] uppercase", isOnline ? "bg-green-500 hover:bg-green-600 shadow-lg" : "text-muted-foreground")} onClick={() => setIsOnline(!isOnline)}>
            <Power className="h-3 w-3" /> {isOnline ? "Online" : "Offline"}
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-full text-accent font-black text-xs"><Timer className="h-3.5 w-3.5 text-accent/40" /> {currentTime}</div>
        </div>
      </div>

      <div className="px-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatches or partners..." 
            className="h-12 pl-10 rounded-2xl border-2 font-bold text-sm bg-white shadow-sm focus:border-accent transition-all"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white rounded-xl h-10 text-[9px] border-2 font-black uppercase flex-1 shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {["All", "Pending Approval", "Ready for Pickup", "Claimed", "Picked Up", "In Transit", "Out for Delivery", "Delivered", "Cancelled"].map(s => (
                <SelectItem key={s} value={s} className="text-[9px] font-black uppercase">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white rounded-xl h-10 text-[9px] border-2 font-black uppercase flex-1 shadow-sm">
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {["All", "State Shipping", "National Shipping", "Marketplace", "Errand", "Food", "Laundry"].map(t => (
                <SelectItem key={t} value={t} className="text-[9px] font-black uppercase">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-2">
        <Card className="bg-accent text-accent-foreground border-none shadow-xl rounded-[2rem] p-6 h-32 flex flex-col justify-center">
          <CardTitle className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-2">My Active Load</CardTitle>
          <div className="text-4xl font-black tracking-tighter">{activeDeliveries.length}</div>
        </Card>
        <Card className="border-none shadow-lg rounded-[2rem] bg-card p-6 h-32 flex flex-col justify-center">
          <CardTitle className="text-[8px] font-black uppercase text-muted-foreground mb-2">Unit Shared Pool</CardTitle>
          <div className="text-4xl font-black text-primary tracking-tighter">{poolDeliveries?.length || 0}</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto rounded-2xl flex-wrap gap-1 border shadow-sm mx-2">
          <TabsTrigger value="active" className="flex-1 rounded-xl h-10 px-6 font-black gap-2 text-[10px] uppercase transition-all"><Navigation className="h-3.5 w-3.5" /> Manifest</TabsTrigger>
          <TabsTrigger value="pool" className="flex-1 rounded-xl h-10 px-6 font-black gap-2 text-[10px] uppercase transition-all relative">
            <Zap className="h-3.5 w-3.5" /> Shared Pool
            {(poolDeliveries?.length || 0) > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-black border-2 border-background">{poolDeliveries?.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 rounded-xl h-10 px-6 font-black gap-2 text-[10px] uppercase transition-all"><History className="h-3.5 w-3.5" /> History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 px-2">
          {activeDeliveries.length > 0 ? activeDeliveries.map(task => (
            <Card key={task.id} className="overflow-hidden border-none hover:shadow-xl transition-all rounded-[2rem] bg-card shadow-md animate-in fade-in">
              <div className="bg-accent/5 px-6 py-5 flex items-center justify-between gap-4 border-b border-accent/10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">{getServiceIcon(task.serviceType)}</div>
                  <div>
                    <p className="font-black text-sm tracking-tighter uppercase">{task.id.slice(0, 8)}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      <Badge className="bg-accent text-white border-none text-[7px] font-black uppercase px-2 h-4">{task.status}</Badge>
                      <Badge className={cn(
                        "text-[7px] font-black uppercase px-2 h-4 border-none",
                        task.priority === 'High' ? "bg-red-600 text-white" : 
                        task.priority === 'Low' ? "bg-blue-400 text-white" : "bg-gray-500 text-white"
                      )}>
                        {task.priority || 'Medium'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-lg gap-1 font-black text-[9px] uppercase h-8" onClick={() => setSelectedTask(task)}>Details <ChevronRight className="h-3 w-3" /></Button>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4 border-l-2 border-dashed pl-6 ml-2">
                  <div><p className="text-[8px] font-black text-muted-foreground uppercase">Collection</p><p className="font-bold text-xs">{task.origin || 'Unit Hub'}</p></div>
                  <div><p className="text-[8px] font-black text-muted-foreground uppercase">Target</p><p className="font-bold text-xs truncate">{task.receiverAddress || task.destination || 'Partner'}</p></div>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0 flex gap-2">
                {task.status === 'Claimed' && <Button className="flex-1 font-black h-11 bg-accent uppercase text-[10px]" onClick={() => handleUpdateStatus(task.id, 'Picked Up')}>Mark Picked Up</Button>}
                {task.status === 'Picked Up' && <Button className="flex-1 font-black h-11 bg-blue-500 text-white uppercase text-[10px]" onClick={() => handleUpdateStatus(task.id, 'In Transit')}>Commence Transit</Button>}
                {task.status === 'In Transit' && <Button className="flex-1 font-black h-11 bg-green-600 text-white uppercase text-[10px]" onClick={() => handleUpdateStatus(task.id, 'Delivered')}>Resolve Handshake</Button>}
              </CardFooter>
            </Card>
          )) : (
            <div className="text-center py-24 border-2 border-dashed rounded-[2rem] opacity-30 font-black uppercase text-[10px]">
              {searchQuery ? "No matching dispatches" : "Manifest Empty"}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pool" className="space-y-4 px-2">
          {filteredPool && filteredPool.length > 0 ? filteredPool.map(task => (
            <Card key={task.id} className="overflow-hidden border-none shadow-lg rounded-[2rem] bg-card animate-in zoom-in-95">
              <CardHeader className="bg-primary/5 p-6 border-b border-primary/10 flex flex-row justify-between items-start">
                <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">{getServiceIcon(task.serviceType)}</div><CardTitle className="text-lg font-black">{task.serviceType}</CardTitle></div>
                <Zap className="h-5 w-5 text-primary opacity-20" />
              </CardHeader>
              <CardContent className="p-6"><p className="text-[8px] font-black text-muted-foreground uppercase">Operational Route</p><p className="text-xs font-bold">{task.origin || 'Node Hub'} → {task.destination || 'Partner'}</p></CardContent>
              <CardFooter className="px-6 pb-6 pt-0"><Button className="w-full h-12 bg-primary hover:bg-primary/90 text-sm font-black rounded-xl shadow-xl" onClick={() => handleClaimTask(task.id)}>Claim Dispatch</Button></CardFooter>
            </Card>
          )) : (
            <div className="text-center py-20 border-2 border-dashed rounded-[2rem] opacity-30 font-black uppercase text-[10px]">
              {searchQuery ? "No matching available dispatches" : "Pool Empty"}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="px-2 space-y-4">
          <div className="flex justify-end px-1">
            <Button variant="outline" size="sm" onClick={handleExportHistory} className="rounded-xl font-black text-[9px] uppercase gap-2 h-9 border-2" disabled={!historyDeliveries.length}>
              <Download className="h-3 w-3" /> Export Logs
            </Button>
          </div>
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-card">
            <div className="divide-y divide-muted/50">
              {historyDeliveries.length > 0 ? historyDeliveries.map(task => (
                <div key={task.id} className="p-6 flex items-center justify-between group cursor-pointer hover:bg-muted/30 transition-all" onClick={() => setSelectedTask(task)}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shadow-inner group-hover:scale-110 transition-transform">{getServiceIcon(task.serviceType)}</div>
                    <div><p className="font-black text-xs uppercase">{task.id.slice(0, 8)}</p><p className="text-[8px] text-muted-foreground font-black uppercase mt-0.5">{task.serviceType} • {new Date(task.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <Badge className="bg-green-500 text-white border-none font-black uppercase text-[7px] h-4 px-2">Settled</Badge>
                </div>
              )) : (
                <div className="py-24 text-center opacity-30 font-black uppercase text-[10px]">
                  {searchQuery ? "No results found" : "Log Empty"}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-l-4 border-accent rounded-l-[2rem] p-0 bg-white">
          {selectedTask && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-8 bg-muted/20 border-b">
                <div className="flex justify-between items-start mb-4"><SheetTitle className="text-3xl font-black tracking-tighter uppercase">{selectedTask.id.slice(0, 8)}</SheetTitle><Badge className="bg-accent text-white border-none font-black uppercase px-3 h-6 text-[8px]">{selectedTask.status}</Badge></div>
                <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{selectedTask.serviceType}</p>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4 bg-muted/30 p-6 rounded-[2rem] border shadow-inner">
                  <div className="flex justify-between items-end"><p className="font-black text-accent uppercase text-[8px] tracking-widest">Protocol Phase</p><p className="text-xl font-black tracking-tighter">LIVE SYNC</p></div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden border-2 border-white">
                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: selectedTask.status === 'Delivered' ? '100%' : selectedTask.status === 'In Transit' ? '75%' : selectedTask.status === 'Picked Up' ? '50%' : selectedTask.status === 'Claimed' ? '25%' : '10%' }} />
                  </div>
                </div>
                <div className="bg-accent/5 p-6 rounded-[2rem] border-2 border-dashed border-accent/20 flex flex-col gap-4">
                  <div>
                    <p className="text-[8px] font-black text-accent uppercase tracking-widest">Partner Identity</p>
                    <p className="font-black text-xl mt-0.5">{selectedTask.receiverName || 'COD Partner'}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1 bg-white/50 inline-block px-2 py-0.5 rounded-lg">{selectedTask.orderSummary}</p>
                  </div>
                  {selectedTask.receiverPhone && selectedTask.status !== 'Delivered' && (
                    <Button size="lg" className="w-full h-12 rounded-xl bg-white text-accent border-2 border-accent/20 font-black gap-2" asChild><a href={`tel:${selectedTask.receiverPhone}`}><PhoneCall className="h-4 w-4" /> Call Partner</a></Button>
                  )}
                </div>
                <div className="space-y-6">
                  <h4 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" /> Roadmap</h4>
                  <div className="space-y-6 pl-4 border-l-2 border-dashed">
                    <div className="relative">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Collection</p>
                      <p className="text-xs font-bold mt-0.5">{selectedTask.origin || 'Unit Hub'}</p>
                    </div>
                    <div className="relative">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Endpoint</p>
                      <p className="text-xs font-bold mt-0.5">{selectedTask.receiverAddress || selectedTask.destination || 'Verified Residence'}</p>
                    </div>
                  </div>
                </div>
                
                {selectedTask.status === 'Delivered' && (
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100 space-y-2">
                    <p className="text-[8px] font-black text-green-600 uppercase">Settlement Metadata</p>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-mono">{selectedTask.id}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Handshake Complete</span>
                      <span className="font-bold">{new Date(selectedTask.lastUpdatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 bg-muted/10 border-t space-y-3 mt-auto no-print">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-black gap-2 text-[10px] uppercase" onClick={() => triggerReceiptPrint()}><Printer className="h-4 w-4" /> Receipt</Button>
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-black gap-2 text-[10px] uppercase"><Share2 className="h-4 w-4" /> Share</Button>
                </div>
                <Button variant="ghost" className="w-full text-[8px] font-black uppercase tracking-widest opacity-40 h-10 hover:bg-transparent" onClick={() => setSelectedTask(null)}>CLOSE MANIFEST</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
