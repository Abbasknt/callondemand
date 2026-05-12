"use client"

import { ErrorBoundary } from "@/components/error-boundary"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { 
  ShieldCheck, 
  Loader2, 
  Trash2,
  Utensils,
  Shirt,
  ShoppingBag,
  Home,
  CheckCircle2,
  Clock,
  ClipboardList,
  LayoutGrid,
  Edit3,
  Zap,
  History,
  ChevronRight,
  Truck,
  Activity,
  X,
  Search
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, limit } from "firebase/firestore"
import { updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { ImageUpload } from "@/components/ui/image-upload"

const PRIORITY_MAP: Record<string, number> = {
  'High': 3,
  'Medium': 2,
  'Low': 1
};

type CatalogType = 'menuItems' | 'productListings' | 'laundryServiceOptions' | 'shortletListings' | 'logisticsServiceOptions';

export default function OperationalManagerHub() {
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("approvals")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [activeCatalog, setActiveCatalog] = useState<CatalogType>('menuItems')

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const unit = profile?.assignedUnit || 'General';

  const unitTasksQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return query(
      collection(firestore, 'deliveryTasks'),
      where('locationUnit', '==', unit),
      limit(200)
    );
  }, [firestore, !!profile, unit]);
  const { data: tasks } = useCollection(unitTasksQuery);

  const catalogQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return query(collection(firestore, activeCatalog), where('locationUnit', 'in', [unit, 'General']));
  }, [firestore, !!profile, unit, activeCatalog]);
  const { data: catalogItems, isLoading: isCatalogLoading } = useCollection(catalogQuery);

  const filterTasks = useCallback((taskList: any[]) => {
    if (!taskList) return [];
    let filtered = taskList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = taskList.filter(t => 
        t.id.toLowerCase().includes(q) || 
        t.serviceType?.toLowerCase().includes(q) || 
        t.receiverName?.toLowerCase().includes(q)
      );
    }
    
    return filtered.sort((a, b) => {
      const pA = PRIORITY_MAP[a.priority || 'Medium'] || 2;
      const pB = PRIORITY_MAP[b.priority || 'Medium'] || 2;
      if (pA !== pB) return pB - pA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [searchQuery]);

  const pendingTasks = useMemo(() => filterTasks(tasks?.filter(t => t.status === 'Pending Approval') || []), [tasks, filterTasks]);
  const activeManifest = useMemo(() => filterTasks(tasks?.filter(t => t.status !== 'Pending Approval' && t.status !== 'Delivered' && t.status !== 'Rejected') || []), [tasks, filterTasks]);

  const handleSaveItem = () => {
    if (!firestore || !editingItem || !activeCatalog) return;
    
    const numericValue = Number(editingItem.price || editingItem.pricePerNight || editingItem.pricePerUnit || 0);
    const data: any = { 
      ...editingItem,
      locationUnit: editingItem.locationUnit || unit,
      isAvailable: editingItem.isAvailable ?? true,
      lastUpdatedAt: new Date().toISOString() 
    };

    if (data.id) delete data.id;

    if (activeCatalog === 'laundryServiceOptions') {
      data.pricePerUnit = numericValue;
      delete data.price;
      delete data.pricePerNight;
    } else if (activeCatalog === 'shortletListings') {
      data.pricePerNight = numericValue;
      delete data.price;
      delete data.pricePerUnit;
    } else {
      data.price = numericValue;
      delete data.pricePerNight;
      delete data.pricePerUnit;
    }

    if (editingItem.id) {
      updateDocumentNonBlocking(doc(firestore, activeCatalog, editingItem.id), data);
      toast({ title: "Node Updated" });
    } else {
      addDocumentNonBlocking(collection(firestore, activeCatalog), { ...data, createdAt: new Date().toISOString() });
      toast({ title: "Node Provisioned" });
    }
    setIsEditing(false);
  };

  const handleApproveTask = (task: any) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'deliveryTasks', task.id), { 
      status: 'Ready for Pickup', 
      approvedAt: new Date().toISOString(),
      agentId: user?.uid,
      agentName: `${profile?.firstName} ${profile?.lastName}`
    });
    toast({ title: "Task Authorized" });
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleAllTasks = () => {
    if (!pendingTasks) return;
    if (selectedTaskIds.length === pendingTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(pendingTasks.map(t => t.id));
    }
  };

  const handleBulkApprove = () => {
    if (!firestore || selectedTaskIds.length === 0) return;
    
    selectedTaskIds.forEach(id => {
      updateDocumentNonBlocking(doc(firestore, 'deliveryTasks', id), { 
        status: 'Ready for Pickup', 
        approvedAt: new Date().toISOString(),
        agentId: user?.uid,
        agentName: `${profile?.firstName} ${profile?.lastName}`
      });
    });

    toast({ 
      title: "Bulk Approval Initiated", 
      description: `Synchronizing ${selectedTaskIds.length} manifests for pickup.` 
    });
    setSelectedTaskIds([]);
  };

  const getServiceIcon = (type: string) => {
    if (type?.includes('Food')) return <Utensils className="h-5 w-5" />;
    if (type?.includes('Laundry')) return <Shirt className="h-5 w-5" />;
    if (type?.includes('Errand') || type?.includes('Logistic')) return <Zap className="h-5 w-5" />;
    if (type?.includes('Market')) return <ShoppingBag className="h-5 w-5" />;
    return <Truck className="h-5 w-5" />;
  };

  if (isProfileLoading || !mounted) {
    return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  if (profile?.role !== 'Agent' && profile?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 px-4">
        <div className="h-24 w-24 bg-muted rounded-[2rem] flex items-center justify-center opacity-20"><ShieldCheck className="h-12 w-12" /></div>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Administrative Authorization Required</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-24 max-w-xl mx-auto px-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-primary"><ClipboardList className="h-8 w-8" /> Agent Hub</h2>
            <div className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Unit:</span>
              <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[8px] px-3 h-5">{unit}</Badge>
            </div>
          </div>
          {selectedTaskIds.length > 0 && (
            <Button 
              onClick={handleBulkApprove}
              className="rounded-xl font-black h-10 px-6 uppercase text-[10px] bg-green-600 hover:bg-green-700 animate-in fade-in slide-in-from-right shadow-xl shadow-green-500/20"
            >
              Approve Selected ({selectedTaskIds.length})
            </Button>
          )}
        </div>

        <div className="px-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks, refs or partners..." className="h-12 pl-10 rounded-2xl border-2 font-bold text-sm bg-white shadow-sm focus:border-primary transition-all" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-2">
          <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-[2rem] p-6 h-32 flex flex-col justify-center">
            <CardTitle className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-2">Awaiting Approval</CardTitle>
            <div className="text-4xl font-black tracking-tighter">{pendingTasks.length}</div>
          </Card>
          <Card className="border-none shadow-lg rounded-[2rem] bg-card p-6 h-32 flex flex-col justify-center">
            <CardTitle className="text-[8px] font-black uppercase text-muted-foreground mb-2">Live Manifest</CardTitle>
            <div className="text-4xl font-black text-primary tracking-tighter">{activeManifest.length}</div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto rounded-2xl flex-wrap gap-1 border shadow-sm mx-2">
            <TabsTrigger value="approvals" className="flex-1 rounded-xl h-10 px-4 font-black gap-2 text-[10px] uppercase transition-all"><CheckCircle2 className="h-3.5 w-3.5" /> Approvals</TabsTrigger>
            <TabsTrigger value="catalogs" className="flex-1 rounded-xl h-10 px-4 font-black gap-2 text-[10px] uppercase transition-all"><LayoutGrid className="h-3.5 w-3.5" /> Catalog</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-6 px-2">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-tighter">Fulfillment Queue</CardTitle>
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Authorize incoming service manifests.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-black uppercase text-muted-foreground">Pending</p>
                    <p className="text-xl font-black text-primary leading-none">{pendingTasks.length}</p>
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/10 border-b">
                    <tr className="h-12">
                      <th className="pl-6 w-12">
                        <div className="flex items-center">
                          <Checkbox 
                            checked={pendingTasks.length > 0 && selectedTaskIds.length === pendingTasks.length}
                            onCheckedChange={toggleAllTasks}
                          />
                        </div>
                      </th>
                      <th className="text-[9px] font-black uppercase text-muted-foreground px-4">Ref</th>
                      <th className="text-[9px] font-black uppercase text-muted-foreground px-4">Service</th>
                      <th className="text-[9px] font-black uppercase text-muted-foreground px-4">Priority</th>
                      <th className="text-right pr-6 text-[9px] font-black uppercase text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/50">
                    {pendingTasks.length > 0 ? pendingTasks.map(task => (
                      <tr key={task.id} className={cn(selectedTaskIds.includes(task.id) ? "bg-primary/5" : "hover:bg-muted/20")}>
                        <td className="pl-6 py-4">
                          <div className="flex items-center">
                            <Checkbox 
                              checked={selectedTaskIds.includes(task.id)}
                              onCheckedChange={() => toggleTaskSelection(task.id)}
                            />
                          </div>
                        </td>
                        <td className="px-4 font-mono text-[10px] font-black tracking-tighter">{task.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <div className="opacity-40">{getServiceIcon(task.serviceType)}</div>
                            <span className="text-[10px] font-bold uppercase truncate max-w-[100px]">{task.serviceType}</span>
                          </div>
                        </td>
                        <td className="px-4">
                          <Badge className={
                            task.priority === 'High' ? "bg-red-600 text-white shadow-sm shadow-red-500/20" : 
                            task.priority === 'Low' ? "bg-blue-400 text-white shadow-sm shadow-blue-500/20" : "bg-gray-500 text-white"
                          }>
                            {task.priority || 'Medium'}
                          </Badge>
                        </td>
                        <td className="pr-6 text-right py-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleApproveTask(task)}
                            className="h-8 rounded-lg font-black text-[8px] uppercase border-2 hover:bg-primary hover:text-white transition-all"
                          >
                            Approve
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center opacity-30 font-black text-[10px] uppercase">No Pending Approvals</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <CardFooter className="p-4 bg-muted/5 flex justify-between items-center border-t">
                <span className="text-[8px] font-black uppercase text-muted-foreground">Unit Oversight Matrix</span>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                     {[1,2,3].map(i => <div key={i} className="h-5 w-5 rounded-full border-2 border-background bg-muted" />)}
                  </div>
                  <span className="text-[8px] font-black uppercase text-muted-foreground">+ Active Ops</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="catalogs" className="space-y-6 px-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button variant={activeCatalog === 'menuItems' ? 'default' : 'outline'} onClick={() => setActiveCatalog('menuItems')} className="h-10 rounded-xl font-black text-[8px] uppercase gap-1.5"><Utensils className="h-3.5 w-3.5" /> Food</Button>
              <Button variant={activeCatalog === 'productListings' ? 'default' : 'outline'} onClick={() => setActiveCatalog('productListings')} className="h-10 rounded-xl font-black text-[8px] uppercase gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Market</Button>
              <Button variant={activeCatalog === 'laundryServiceOptions' ? 'default' : 'outline'} onClick={() => setActiveCatalog('laundryServiceOptions')} className="h-10 rounded-xl font-black text-[8px] uppercase gap-1.5"><Shirt className="h-3.5 w-3.5" /> Laundry</Button>
              <Button variant={activeCatalog === 'shortletListings' ? 'default' : 'outline'} onClick={() => setActiveCatalog('shortletListings')} className="h-10 rounded-xl font-black text-[8px] uppercase gap-1.5"><Home className="h-3.5 w-3.5" /> Shortlet</Button>
              <Button variant={activeCatalog === 'logisticsServiceOptions' ? 'default' : 'outline'} onClick={() => setActiveCatalog('logisticsServiceOptions')} className="h-10 rounded-xl font-black text-[8px] uppercase gap-1.5"><Zap className="h-3.5 w-3.5" /> Logistics</Button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[120px]">Hub Node: {activeCatalog.replace(/([A-Z])/g, ' $1')}</h3>
              <Button onClick={() => { setEditingItem({ name: "", price: 0, locationUnit: unit, category: "General", description: "" }); setIsEditing(true); }} size="sm" className="h-9 px-4 rounded-lg font-black text-[9px] uppercase">+ Provision Node</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isCatalogLoading ? (
                <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : catalogItems && catalogItems.length > 0 ? (
                catalogItems.map(item => (
                  <Card key={item.id} className="overflow-hidden rounded-[1.5rem] border-none shadow-md bg-card">
                    <div className="relative h-32 bg-muted/20">
                      {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-cover" /> : <div className="flex items-center justify-center h-full opacity-20"><Activity className="h-10 w-10" /></div>}
                      <div className="absolute top-2 right-2"><Badge className="bg-white/90 text-black border-none font-black text-[8px]">₦{(item.price || item.pricePerNight || item.pricePerUnit || 0).toLocaleString()}</Badge></div>
                    </div>
                    <CardHeader className="p-4 pb-0"><CardTitle className="text-sm font-black truncate">{item.name}</CardTitle></CardHeader>
                    <CardFooter className="p-4 pt-2 flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingItem(item); setIsEditing(true); }}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteDocumentNonBlocking(doc(firestore!, activeCatalog, item.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </CardFooter>
                  </Card>
                ))
              ) : <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl opacity-30 font-black text-[10px] uppercase">No Hub Data</div>}
            </div>
          </TabsContent>
        </Tabs>

        <Sheet open={isEditing} onOpenChange={setIsEditing}>
          <SheetContent className="sm:max-w-md overflow-y-auto border-l-8 border-primary rounded-l-[2rem] p-0">
            <SheetHeader className="p-10 bg-muted/30 border-b"><SheetTitle className="text-3xl font-black tracking-tighter uppercase">Catalog Node</SheetTitle></SheetHeader>
            <div className="p-10 space-y-8">
              <div className="space-y-1.5"><Label className="text-[8px] font-black uppercase ml-1">Label</Label><Input value={editingItem?.name || ""} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="h-12 rounded-xl border-2 font-black text-lg" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5"><Label className="text-[8px] font-black uppercase ml-1">Value (₦)</Label><Input type="number" value={editingItem?.price || editingItem?.pricePerNight || editingItem?.pricePerUnit || 0} onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })} className="h-12 rounded-xl border-2 font-black text-primary text-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[8px] font-black uppercase ml-1">Jurisdiction</Label><Input value={editingItem?.locationUnit || unit} disabled className="h-12 rounded-xl border-2 font-black text-[10px] uppercase opacity-50" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[8px] font-black uppercase ml-1">Category / Tag</Label><Input value={editingItem?.category || ""} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="h-10 rounded-lg border-2 font-bold" /></div>
              <div className="space-y-4"><Label className="text-[8px] font-black uppercase ml-1">Media Manifest</Label><ImageUpload value={editingItem?.imageUrl || ""} onChange={(url) => setEditingItem({ ...editingItem, imageUrl: url })} label="Pick Hub Image" /></div>
            </div>
            <SheetFooter className="p-10 border-t bg-muted/10"><Button onClick={handleSaveItem} className="w-full h-16 rounded-2xl font-black text-xl bg-primary shadow-xl uppercase">Authorize Node</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </ErrorBoundary>
  );
}
