"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { 
  ShieldCheck, 
  Loader2, 
  Lock, 
  Activity,
  Users,
  History,
  RefreshCw,
  Globe,
  Settings2,
  Search,
  UserX,
  Download,
  Database,
  Plus,
  Trash2,
  Crown,
  MapPin,
  Building2,
  TrendingUp,
  Landmark,
  ClipboardList,
  Truck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, limit, orderBy } from "firebase/firestore"
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { getMerchantBalance, getMerchantTransactions } from "@/actions/monnify"
import { exportToCsv } from "@/lib/export-utils"
import { cn } from "@/lib/utils"
import { administratorRegisterUser } from "@/ai/flows/administrator-register-user-flow"
import { logAuditAction, AuditAction } from "@/lib/audit"

const MASTER_ADMIN_EMAILS = ['altamambcs@callondemandbiz.com', 'tatatradeandinnovation@gmail.com', 'altamam02@gmail.com'];

const PRIORITY_MAP: Record<string, number> = {
  'High': 3,
  'Medium': 2,
  'Low': 1
};

export default function SuperAdminPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()
  const [activeTab, setActiveTab] = useState("overview")
  const [mounted, setMounted] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [taskStatusFilter, setTaskStatusFilter] = useState("All")
  const [taskTypeFilter, setTaskTypeFilter] = useState("All")
  
  // Role Update State
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [targetUser, setTargetUser] = useState<any>(null)
  const [newRole, setNewRole] = useState("")
  const [roleChangeReason, setRoleChangeReason] = useState("")
  
  const [systemBalance, setSystemBalance] = useState<any>(null)
  const [systemTransactions, setSystemTransactions] = useState<any[]>([])
  const [isFinLoading, setIsFinLoading] = useState(false)

  // Editing State
  const [isEditingUnit, setIsEditingUnit] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  // Registration Flow State
  const [isRegisteringUser, setIsRegisteringUser] = useState(false)
  const [isRegistrationLoading, setIsRegistrationLoading] = useState(false)
  const [regForm, setRegForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "Customer",
    assignedUnit: "General"
  })

  const auditLogsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'system_logs'), orderBy('timestamp', 'desc'), limit(100));
  }, [firestore]);
  const { data: auditLogs } = useCollection(auditLogsQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSystemRoot = useMemo(() => 
    (user?.email && MASTER_ADMIN_EMAILS.includes(user.email.toLowerCase())) ||
    user?.uid === 'h9GHzdXjjtcVrDLRgFteGDWRY433' ||
    user?.uid === 'HWHgYBsQEIafGj731chLSE200Y13', 
    [user?.email, user?.uid]
  );

  const isMasterAdmin = isSystemRoot; // For backwards compatibility if any other useMemo uses it

  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'super_admins', user.uid);
  }, [firestore, user?.uid]);
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminDocRef);

  const isPrivilegedAdmin = useMemo(() => isSystemRoot || !!adminDoc, [isSystemRoot, adminDoc]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'application_settings', 'global_settings');
  }, [firestore]);
  const { data: appSettings } = useDoc(settingsRef);

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'operational_units'));
  }, [firestore]);
  const { data: units } = useCollection(unitsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isAdminDocLoading) return null;
    if (!adminDoc && !isMasterAdmin) return null;
    return query(collection(firestore, 'users'), limit(500));
  }, [firestore, user?.uid, adminDoc, isMasterAdmin, isAdminDocLoading]);
  const { data: platformUsers } = useCollection(usersQuery);

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'investmentPlans'), limit(50));
  }, [firestore]);
  const { data: plans } = useCollection(plansQuery);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isAdminDocLoading) return null;
    if (!adminDoc && !isMasterAdmin) return null;
    return query(collection(firestore, 'deliveryTasks'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, user?.uid, adminDoc, isMasterAdmin, isAdminDocLoading]);
  const { data: globalTasks } = useCollection(tasksQuery);

  const filteredTasks = useMemo(() => {
    if (!globalTasks) return [];
    return globalTasks
      .filter(t => {
        const matchesStatus = taskStatusFilter === "All" || t.status === taskStatusFilter;
        const matchesType = taskTypeFilter === "All" || t.serviceType === taskTypeFilter;
        return matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const pA = PRIORITY_MAP[a.priority || 'Medium'] || 2;
        const pB = PRIORITY_MAP[b.priority || 'Medium'] || 2;
        if (pA !== pB) return pB - pA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [globalTasks, taskStatusFilter, taskTypeFilter]);

  useEffect(() => {
    if ((adminDoc || isMasterAdmin) && activeTab === 'overview' && mounted) {
      fetchSystemFinancials();
    }
  }, [!!adminDoc, isMasterAdmin, activeTab, mounted]);

  const filteredUsers = useMemo(() => {
    if (!platformUsers) return [];
    if (!userSearch) return platformUsers;
    const queryStr = userSearch.toLowerCase();
    return platformUsers.filter(u => 
      u.firstName?.toLowerCase().includes(queryStr) || 
      u.lastName?.toLowerCase().includes(queryStr) || 
      u.email?.toLowerCase().includes(queryStr) ||
      u.role?.toLowerCase().includes(queryStr)
    );
  }, [platformUsers, userSearch]);

  const fetchSystemFinancials = async () => {
    setIsFinLoading(true);
    try {
      const balanceResult = await getMerchantBalance();
      const txResult = await getMerchantTransactions();
      if (balanceResult && balanceResult.success) setSystemBalance(balanceResult.response);
      if (txResult && txResult.success) setSystemTransactions(txResult.response || []);
    } catch (e) {
      console.error(e);
      toast({ title: "Ledger Sync Failed", variant: "destructive" });
    } finally {
      setIsFinLoading(false);
    }
  };

  const handleUpdateSetting = (field: string, value: any) => {
    if (!settingsRef) return;
    setDocumentNonBlocking(settingsRef, { [field]: value, lastUpdatedAt: new Date().toISOString() }, { merge: true });
    logAuditAction(AuditAction.CONFIG_UPDATE, { field, newValue: value });
    toast({ title: "Configuration Synced" });
  };

  const handleUpdateUserKYC = (userId: string, updates: any) => {
    if (!firestore) return;
    
    // Security Guard: Only System Root can promote to Admin
    if (updates.role === 'Admin' && !isSystemRoot) {
      toast({ title: "Authority Required", description: "Only foundational root accounts can provision administrators.", variant: "destructive" });
      logAuditAction(AuditAction.ACCESS_DENIED, { userId, attemptedRole: 'Admin', reason: 'Insufficient privileges' });
      return;
    }

    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, { 
      ...updates, 
      lastRoleUpdateAt: new Date().toISOString(),
      roleUpdateNotification: updates.roleReason || "Your account permissions have been synchronized."
    });

    if (updates.role === 'Admin') {
      setDocumentNonBlocking(doc(firestore, 'super_admins', userId), { id: userId, email: updates.email || 'N/A', grantedAt: new Date().toISOString() }, { merge: true });
      logAuditAction(AuditAction.USER_PROMOTION, { userId, role: 'Admin', reason: updates.roleReason });
    } else if (updates.role && updates.role !== 'Admin') {
      // Remove from super_admins if role is downgraded
      deleteDocumentNonBlocking(doc(firestore, 'super_admins', userId));
      logAuditAction(AuditAction.USER_DEMOTION, { userId, role: updates.role, reason: updates.roleReason });
    }
    
    toast({ 
      title: "Role Hierarchy Updated", 
      description: `User permissions shifted to ${updates.role || 'selected level'}.` 
    });
    setIsUpdatingRole(false);
    setTargetUser(null);
    setRoleChangeReason("");
  };

  const initiateRoleChange = (user: any, role: string) => {
    if (user.role === role) return;
    setTargetUser(user);
    setNewRole(role);
    setIsUpdatingRole(true);
  };

  const handleSaveUnit = () => {
    if (!firestore || !editingUnit) return;
    if (editingUnit.id) {
      updateDocumentNonBlocking(doc(firestore, 'operational_units', editingUnit.id), editingUnit);
      logAuditAction(AuditAction.UNIT_MODIFICATION, { unitId: editingUnit.id, name: editingUnit.name });
    } else {
      addDocumentNonBlocking(collection(firestore, 'operational_units'), { ...editingUnit, createdAt: new Date().toISOString() });
      logAuditAction(AuditAction.UNIT_MODIFICATION, { action: 'CREATE', name: editingUnit.name });
    }
    setIsEditingUnit(false);
    toast({ title: "Operational Unit Synced" });
  };

  const handleSavePlan = () => {
    if (!firestore || !editingPlan) return;
    const planData = { ...editingPlan, interestRate: Number(editingPlan.interestRate), minAmount: Number(editingPlan.minAmount), durationMonths: Number(editingPlan.durationMonths), isAvailable: true };
    if (editingPlan.id) {
      updateDocumentNonBlocking(doc(firestore, 'investmentPlans', editingPlan.id), planData);
      logAuditAction(AuditAction.PLAN_MODIFICATION, { planId: editingPlan.id, name: editingPlan.name });
    } else {
      addDocumentNonBlocking(collection(firestore, 'investmentPlans'), { ...planData, createdAt: new Date().toISOString() });
      logAuditAction(AuditAction.PLAN_MODIFICATION, { action: 'CREATE', name: editingPlan.name });
    }
    setIsEditingPlan(false);
    toast({ title: "Growth Plan Synced" });
  };

  const handleSaveTask = () => {
    if (!firestore || !editingTask) return;
    const taskData = { 
      ...editingTask, 
      priority: editingTask.priority || 'Medium',
      updatedAt: new Date().toISOString() 
    };

    if (editingTask.id) {
      updateDocumentNonBlocking(doc(firestore, 'deliveryTasks', editingTask.id), taskData);
      logAuditAction(AuditAction.TASK_MODIFICATION, { taskId: editingTask.id, changes: 'MANUAL_EDIT' });
      toast({ title: "Task Synchronized", description: `Manifest ${editingTask.id.slice(0, 8)} updated.` });
    } else {
      addDocumentNonBlocking(collection(firestore, 'deliveryTasks'), { 
        ...taskData, 
        createdAt: new Date().toISOString(),
        status: taskData.status || 'Pending Approval'
      });
      logAuditAction(AuditAction.TASK_MODIFICATION, { action: 'CREATE', type: taskData.serviceType });
      toast({ title: "Task Initialized", description: "New delivery manifest created." });
    }
    setIsEditingTask(false);
  };
  
  const handleRegisterUser = async () => {
    if (!user?.uid) return;
    if (!regForm.email || !regForm.firstName || !regForm.lastName) {
      toast({ title: "Validation Failed", description: "All fields are required for access node creation.", variant: "destructive" });
      return;
    }

    setIsRegistrationLoading(true);
    try {
      const result = await administratorRegisterUser({
        adminId: user.uid,
        ...regForm as any
      });

      if (result.success) {
        toast({ title: "Flow Completed", description: result.message, className: "bg-green-600 text-white" });
        setIsRegisteringUser(false);
        setRegForm({
          email: "",
          firstName: "",
          lastName: "",
          role: "Customer",
          assignedUnit: "General"
        });
      } else {
        toast({ title: "Flow Error", description: result.message, variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Flow Synchronization Failed", description: "Check gateway logs for details.", variant: "destructive" });
    } finally {
      setIsRegistrationLoading(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleAllTasks = () => {
    if (!filteredTasks) return;
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const handleBulkTaskStatus = (status: string) => {
    if (!firestore || selectedTaskIds.length === 0) return;
    
    selectedTaskIds.forEach(id => {
      updateDocumentNonBlocking(doc(firestore, 'deliveryTasks', id), { 
        status, 
        updatedAt: new Date().toISOString() 
      });
    });

    logAuditAction(AuditAction.TASK_BULK_UPDATE, { count: selectedTaskIds.length, targetStatus: status });
    toast({ 
      title: "Bulk Operation Initialized", 
      description: `Updating ${selectedTaskIds.length} tasks to ${status}` 
    });
    setSelectedTaskIds([]);
  };

  const handleBulkTaskDelete = () => {
    if (!firestore || selectedTaskIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks? This cannot be undone.`)) return;

    selectedTaskIds.forEach(id => {
      deleteDocumentNonBlocking(doc(firestore, 'deliveryTasks', id));
    });

    logAuditAction(AuditAction.TASK_DELETION, { count: selectedTaskIds.length });
    toast({ 
      title: "Bulk Deletion Completed", 
      description: `${selectedTaskIds.length} manifests purged from the hub.` 
    });
    setSelectedTaskIds([]);
  }

  if (isAdminDocLoading || !mounted) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  if (!adminDoc && !isSystemRoot) {
     return (
       <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 px-4">
         <div className="h-32 w-32 bg-yellow-500/10 rounded-[3rem] flex items-center justify-center border-4 border-yellow-500/20 shadow-2xl">
           <Lock className="h-16 w-16 text-yellow-500" />
         </div>
         <h2 className="text-4xl font-black tracking-tighter">Access Restricted</h2>
         <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Administrative Authorization Required</p>
         <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="rounded-xl h-12 font-black px-8">Return to Dashboard</Button>
       </div>
     );
  }

  return (
    <div className="space-y-10 pb-20 max-w-2xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-4 uppercase">
            {isSystemRoot ? <Crown className="h-10 w-10 text-yellow-500" /> : <ShieldCheck className="h-10 w-10 text-primary" />} 
            Master Hub
          </h2>
          <div className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest">{isSystemRoot ? 'System Root Core' : 'Production Integrity Layer'}</span>
            <Badge className={cn(
              "text-white border-none uppercase font-black text-[9px] px-2 tracking-widest",
              isSystemRoot ? "bg-red-600" : "bg-yellow-500"
            )}>Verified</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSystemFinancials} className="rounded-xl h-10 gap-2 font-black shadow-sm text-[10px] uppercase">
            {isFinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync Ledger
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap gap-1 rounded-[1.5rem] border shadow-sm w-full">
          <TabsTrigger value="overview" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><Activity className="h-4 w-4" /> Stats</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><ClipboardList className="h-4 w-4" /> Tasks</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><Users className="h-4 w-4" /> KYC</TabsTrigger>
          <TabsTrigger value="units" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><Building2 className="h-4 w-4" /> Units</TabsTrigger>
          <TabsTrigger value="audit" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase text-red-600"><Lock className="h-4 w-4 text-red-600" /> Audit</TabsTrigger>
          <TabsTrigger value="investments" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><TrendingUp className="h-4 w-4" /> Growth</TabsTrigger>
          <TabsTrigger value="system" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><Settings2 className="h-4 w-4" /> Config</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-primary-foreground border-none rounded-[2.5rem] shadow-xl p-8 relative overflow-hidden group h-40">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700"><Database className="h-32 w-32" /></div>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-4">Settled Liquidity</CardTitle>
              <div className="text-4xl font-black mb-4 tracking-tighter">₦{(systemBalance?.availableBalance || 0).toLocaleString()}</div>
            </Card>
            <Card className="border-4 border-muted rounded-[2.5rem] bg-card p-8 h-40 flex flex-col justify-center">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground mb-4">Total Partners</CardTitle>
              <div className="text-4xl font-black text-primary tracking-tighter">{platformUsers?.length || 0}</div>
            </Card>
            <Card className="border-4 border-muted rounded-[2.5rem] bg-card p-8 h-40 flex flex-col justify-center">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground mb-4">Active Units</CardTitle>
              <div className="text-4xl font-black text-accent tracking-tighter">{units?.filter(u => u.status === 'Active').length || 0}</div>
            </Card>
          </div>

          <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 p-8 border-b flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-black flex items-center gap-3"><History className="h-6 w-6 text-primary" /> Audit Trail</CardTitle>
              <Button variant="ghost" onClick={() => exportToCsv(`COD_Ledger.csv`, systemTransactions)} className="font-black text-[9px] uppercase gap-2"><Download className="h-4 w-4" /> Export</Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="pl-8 font-black uppercase text-[9px]">Timestamp</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Narration</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Value</TableHead>
                    <TableHead className="pr-8 text-right font-black uppercase text-[9px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemTransactions.map((tx: any) => (
                    <TableRow key={tx.monnifyTransactionReference}>
                      <TableCell className="pl-8 py-4 font-bold text-[11px]">{new Date(tx.transactionDate).toLocaleString()}</TableCell>
                      <TableCell className="text-[11px] font-medium max-w-xs truncate">{tx.narration}</TableCell>
                      <TableCell className="font-black text-sm">₦{tx.amount?.toLocaleString()}</TableCell>
                      <TableCell className="pr-8 text-right"><Badge className="bg-green-500 text-white border-none font-black uppercase text-[8px]">{tx.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
            <div className="flex gap-2 w-full md:w-auto">
              {selectedTaskIds.length > 0 ? (
                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={() => handleBulkTaskStatus('Ready for Pickup')}
                    className="rounded-xl h-9 px-4 font-black text-[9px] uppercase bg-green-600 hover:bg-green-700"
                  >
                    Approve ({selectedTaskIds.length})
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={handleBulkTaskDelete}
                    className="rounded-xl h-9 px-4 font-black text-[9px] uppercase"
                  >
                    Delete ({selectedTaskIds.length})
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logistics Management</h3>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-xl border-2 font-black uppercase text-[8px] bg-card">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["All", "Pending Approval", "Ready for Pickup", "Processing", "In Transit", "Out for Delivery", "Delivered", "Cancelled"].map(s => (
                    <SelectItem key={s} value={s} className="text-[9px] font-black uppercase">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-xl border-2 font-black uppercase text-[8px] bg-card">
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

          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 p-8 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Global Task Hub</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Cross-unit operational roadmap.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">Showing</p>
                    <p className="text-lg font-black text-primary leading-none">{filteredTasks.length}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingTask({ 
                        serviceType: "State Shipping", 
                        status: "Pending Approval", 
                        priority: "Medium",
                        locationUnit: "General" 
                      });
                      setIsEditingTask(true);
                    }} 
                    className="rounded-xl font-black h-10 px-4 uppercase text-[9px] gap-2 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" /> New Task
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 h-14">
                  <TableRow>
                    <TableHead className="pl-6 w-12">
                      <Checkbox 
                        checked={filteredTasks.length > 0 && filteredTasks.every(t => selectedTaskIds.includes(t.id))} 
                        onCheckedChange={toggleAllTasks}
                      />
                    </TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Ref</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Type</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Unit</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Priority</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Phase</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Operator</TableHead>
                    <TableHead className="pr-8 text-right font-black uppercase text-[9px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length > 0 ? filteredTasks.map(task => (
                    <TableRow key={task.id} className={cn(selectedTaskIds.includes(task.id) && "bg-primary/5")}>
                      <TableCell className="pl-6">
                        <Checkbox 
                          checked={selectedTaskIds.includes(task.id)} 
                          onCheckedChange={() => toggleTaskSelection(task.id)}
                        />
                      </TableCell>
                      <TableCell className="py-4 font-mono text-[10px] font-black">{task.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="text-[10px] font-bold uppercase">{task.serviceType}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[8px] font-black uppercase px-2">{task.locationUnit}</Badge></TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-none text-[8px] font-black uppercase px-2 h-5",
                          task.priority === 'High' ? "bg-red-600 text-white" : 
                          task.priority === 'Low' ? "bg-blue-400 text-white" : "bg-gray-500 text-white"
                        )}>
                          {task.priority || 'Medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-none text-[8px] font-black uppercase px-2 h-5",
                          task.status === 'Delivered' ? "bg-green-500 text-white" : 
                          task.status === 'Pending Approval' ? "bg-orange-500 text-white" : "bg-primary text-white"
                        )}>{task.status}</Badge>
                      </TableCell>
                      <TableCell className="font-black text-[10px] text-muted-foreground uppercase">{task.operatorName || 'Unassigned'}</TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => {
                            setEditingTask(task);
                            setIsEditingTask(true);
                          }}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-black uppercase text-[10px] opacity-30">No tasks match selected filters</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-8">
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 p-8 border-b">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Partner KYC</CardTitle>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search..." className="h-10 pl-9 rounded-xl border-2 text-xs" />
                  </div>
                  <Button size="sm" onClick={() => setIsRegisteringUser(true)} className="rounded-xl font-black h-10 px-4 uppercase text-[9px] gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" /> Register New
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 h-14">
                  <TableRow>
                    <TableHead className="pl-8 font-black uppercase text-[9px]">Identity</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Role</TableHead>
                    <TableHead className="font-black uppercase text-[9px]">Hub</TableHead>
                    <TableHead className="pr-8 text-right font-black uppercase text-[9px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-[10px] uppercase shadow-sm transition-transform hover:scale-105",
                            u.role === 'Admin' ? "bg-red-600" : 
                            u.role === 'Operator' ? "bg-blue-600" :
                            u.role === 'Agent' ? "bg-green-600" : "bg-primary"
                          )}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-black text-[11px] leading-tight flex items-center gap-2">
                              {u.firstName} {u.lastName}
                              {u.role === 'Admin' && <Crown className="h-3 w-3 text-red-600" />}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-bold opacity-70">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={u.role || 'Customer'} onValueChange={(val) => initiateRoleChange(u, val)}>
                          <SelectTrigger className={cn(
                            "h-9 w-28 rounded-xl border-2 font-black uppercase text-[8px] transition-colors",
                            u.role === 'Admin' ? "border-red-600/30 text-red-600" :
                            u.role === 'Operator' ? "border-blue-600/30 text-blue-600" :
                            u.role === 'Agent' ? "border-green-600/30 text-green-600" : "border-primary/30"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl border-2">
                            <SelectItem value="Customer" className="text-[10px] font-black uppercase">Customer</SelectItem>
                            <SelectItem value="Agent" className="text-[10px] font-black uppercase">Agent</SelectItem>
                            <SelectItem value="Operator" className="text-[10px] font-black uppercase">Operator</SelectItem>
                            <SelectItem value="Admin" className="text-[10px] font-black uppercase text-red-600">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={u.assignedUnit || 'General'} onValueChange={(val) => handleUpdateUserKYC(u.id, { assignedUnit: val })}>
                          <SelectTrigger className="h-8 w-32 rounded-lg border-2 font-black text-[8px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl">
                            <SelectItem value="General" className="text-[10px] font-bold">General</SelectItem>
                            {units?.map(unit => <SelectItem key={unit.id} value={unit.name} className="text-[10px] font-bold">{unit.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500" onClick={() => handleUpdateUserKYC(u.id, { status: 'Restricted' })}><UserX className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest"><Building2 className="h-5 w-5 text-primary" /> Units</h3>
            <Button size="sm" onClick={() => { setEditingUnit({ name: "", description: "", status: "Active" }); setIsEditingUnit(true); }} className="rounded-xl font-black h-10 px-6 uppercase text-[9px]">Add Unit</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {units?.map(u => (
              <Card key={u.id} className="rounded-[2rem] border-none shadow-md bg-card group relative">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform"><MapPin className="h-5 w-5" /></div>
                    <Badge className="rounded-full text-[7px] font-black uppercase h-4 px-2">{u.status}</Badge>
                  </div>
                  <CardTitle className="text-lg font-black">{u.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-[10px] font-medium mt-1">{u.description || "No description provided."}</CardDescription>
                </CardHeader>
                <CardFooter className="p-6 pt-2 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingUnit(u); setIsEditingUnit(true); }}><Settings2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'operational_units', u.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-card border-l-4 border-red-600">
            <CardHeader className="bg-red-600/5 p-8 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter text-red-600">System Log Hub</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Immutable administrative oversight records.</p>
                </div>
                <Badge variant="destructive" className="font-black text-[9px] uppercase px-3">Restricted</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              {auditLogs && auditLogs.length > 0 ? (
                <div className="divide-y">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-black text-white text-[8px] font-black uppercase px-2 h-5 tracking-tighter">
                          {log.action}
                        </Badge>
                        <span className="text-[9px] font-bold text-muted-foreground">
                          {log.timestamp?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-6 rounded-full bg-red-600/10 flex items-center justify-center">
                          <Users className="h-3 w-3 text-red-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase">{log.performerEmail}</span>
                      </div>
                      <pre className="text-[9px] bg-muted p-4 rounded-xl font-mono overflow-x-auto border-2 border-dashed">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-30 font-black text-[10px] uppercase">No logs recorded in this cycle</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest"><TrendingUp className="h-5 w-5 text-primary" /> Growth</h3>
            <Button size="sm" onClick={() => { setEditingPlan({ name: "", description: "", interestRate: 10, minAmount: 10000, durationMonths: 12, isAvailable: true }); setIsEditingPlan(true); }} className="rounded-xl font-black h-10 px-6 uppercase text-[9px]">Add Plan</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans?.map(p => (
              <Card key={p.id} className="rounded-[2rem] border-none shadow-md bg-card">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Landmark className="h-5 w-5" /></div>
                    <Badge variant={p.isAvailable ? 'default' : 'outline'} className="text-[7px] font-black uppercase h-4">{p.isAvailable ? 'Active' : 'Archived'}</Badge>
                  </div>
                  <CardTitle className="text-lg font-black">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-2">
                  <div className="flex justify-between items-end">
                    <div><p className="text-[8px] font-black text-muted-foreground uppercase">Yield</p><p className="text-xl font-black text-primary">{p.interestRate}% APY</p></div>
                    <div className="text-right"><p className="text-[8px] font-black text-muted-foreground uppercase">Min Entry</p><p className="text-lg font-black">₦{p.minAmount?.toLocaleString()}</p></div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-2 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPlan(p); setIsEditingPlan(true); }}><Settings2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'investmentPlans', p.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-card">
            <CardHeader className="bg-primary/5 p-8 border-b">
              <CardTitle className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter"><Settings2 className="h-6 w-6 text-primary" /> Application Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Platform Identity</Label><Input value={appSettings?.appName || ""} onChange={(e) => handleUpdateSetting('appName', e.target.value)} className="h-12 rounded-xl border-2 font-black" /></div>
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Service Fee (%)</Label><Input type="number" value={appSettings?.globalServiceFeePercentage || 0} onChange={(e) => handleUpdateSetting('globalServiceFeePercentage', Number(e.target.value))} className="h-12 rounded-xl border-2 font-black" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Confirmation Sheet */}
      <Sheet open={isUpdatingRole} onOpenChange={setIsUpdatingRole}>
        <SheetContent className="sm:max-w-md border-l-4 border-yellow-500 rounded-l-[2rem] p-0">
          <SheetHeader className="p-10 bg-yellow-500/5 border-b">
            <SheetTitle className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-yellow-600" />
              Role Shift
            </SheetTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Elevating or synchronizing user permissions.</p>
          </SheetHeader>
          <div className="p-10 space-y-8">
            <div className="bg-muted/30 p-6 rounded-2xl border-2 border-dashed border-black/5">
              <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Target User</p>
              <p className="text-xl font-black">{targetUser?.firstName} {targetUser?.lastName}</p>
              <p className="text-[10px] font-bold text-muted-foreground opacity-60">{targetUser?.email}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/5 p-4 rounded-xl">
                <span className="text-[10px] font-black uppercase opacity-40">Current Path</span>
                <Badge variant="outline" className="font-black text-[9px] uppercase">{targetUser?.role || 'Customer'}</Badge>
              </div>
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                <span className="text-[10px] font-black uppercase text-primary">New Destination</span>
                <Badge className={cn(
                  "font-black text-[9px] uppercase border-none",
                  newRole === 'Admin' ? "bg-red-600" : 
                  newRole === 'Operator' ? "bg-blue-600" :
                  newRole === 'Agent' ? "bg-green-600" : "bg-primary"
                )}>{newRole}</Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Communication Message</Label>
              <Textarea 
                placeholder="Explain the reason for this permission shift..."
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                className="min-h-[120px] rounded-2xl border-2 font-medium bg-muted/20"
              />
              <p className="text-[8px] font-bold text-muted-foreground px-1">This message will be visible in the user&apos;s alert hub.</p>
            </div>
          </div>
          <SheetFooter className="p-10 border-t bg-muted/5 flex flex-col gap-3">
            <Button 
              onClick={() => handleUpdateUserKYC(targetUser.id, { role: newRole, roleReason: roleChangeReason, email: targetUser.email })} 
              className="w-full h-16 rounded-2xl font-black text-lg bg-black text-white hover:bg-black/90 uppercase shadow-2xl"
            >
              Confirm Authority Update
            </Button>
            <Button variant="ghost" onClick={() => setIsUpdatingRole(false)} className="w-full h-12 font-black text-[10px] uppercase opacity-40">Abort Selection</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Plan Modification Sheet */}
      <Sheet open={isEditingPlan} onOpenChange={setIsEditingPlan}>
        <SheetContent className="sm:max-w-md overflow-y-auto border-l-4 border-primary rounded-l-[2rem] p-0">
          <SheetHeader className="p-10 bg-muted/20 border-b"><SheetTitle className="text-3xl font-black tracking-tighter uppercase">Growth Hub</SheetTitle></SheetHeader>
          <div className="p-10 space-y-8">
            <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Plan Headline</Label><Input value={editingPlan?.name || ""} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} className="h-12 rounded-xl border-2 font-black" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Yield (APY%)</Label><Input type="number" value={editingPlan?.interestRate || 0} onChange={(e) => setEditingPlan({ ...editingPlan, interestRate: e.target.value })} className="h-12 rounded-xl border-2 font-black" /></div>
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Min Entry (₦)</Label><Input type="number" value={editingPlan?.minAmount || 0} onChange={(e) => setEditingPlan({ ...editingPlan, minAmount: e.target.value })} className="h-12 rounded-xl border-2 font-black" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Description</Label><Textarea value={editingPlan?.description || ""} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} className="min-h-[100px] rounded-xl border-2" /></div>
          </div>
          <SheetFooter className="p-10 border-t bg-muted/5"><Button onClick={handleSavePlan} className="w-full h-16 rounded-2xl font-black text-lg bg-primary uppercase">Authorize Plan</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      {/* User Registration Sheet */}
      <Sheet open={isRegisteringUser} onOpenChange={setIsRegisteringUser}>
        <SheetContent className="sm:max-w-md overflow-y-auto border-l-4 border-primary rounded-l-[2rem] p-0">
          <SheetHeader className="p-10 bg-primary/5 border-b">
            <SheetTitle className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Provision User
            </SheetTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Initializing new platform access nodes.</p>
          </SheetHeader>
          <div className="p-10 space-y-6">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Email Identity</Label>
              <Input 
                type="email" 
                value={regForm.email} 
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} 
                placeholder="user@example.com"
                className="h-12 rounded-xl border-2 font-black" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase ml-1">First Name</Label>
                <Input value={regForm.firstName} onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })} className="h-12 rounded-xl border-2 font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase ml-1">Last Name</Label>
                <Input value={regForm.lastName} onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })} className="h-12 rounded-xl border-2 font-bold" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Authority Level</Label>
              <Select value={regForm.role} onValueChange={(val) => setRegForm({ ...regForm, role: val })}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-black uppercase text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Customer" className="text-xs font-black uppercase">Customer (Partner)</SelectItem>
                  <SelectItem value="Agent" className="text-xs font-black uppercase">Agent (Merchant)</SelectItem>
                  <SelectItem value="Operator" className="text-xs font-black uppercase">Operator (Logistics)</SelectItem>
                  <SelectItem value="Admin" className="text-xs font-black uppercase text-red-600">Admin (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Assigned Operational Hub</Label>
              <Select value={regForm.assignedUnit} onValueChange={(val) => setRegForm({ ...regForm, assignedUnit: val })}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-black text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="General" className="text-xs font-bold">General Hub</SelectItem>
                  {units?.map(unit => (
                    <SelectItem key={unit.id} value={unit.name} className="text-xs font-bold">{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-xl border-2 border-dashed">
              <p className="text-[8px] font-black uppercase text-muted-foreground leading-tight">
                PROVISIONING PROTOCOL: This will create a platform identity. The user must sign up with this email to activate the node.
              </p>
            </div>
          </div>
          <SheetFooter className="p-10 border-t bg-muted/5">
            <Button 
              onClick={handleRegisterUser} 
              disabled={isRegistrationLoading}
              className="w-full h-16 rounded-2xl font-black text-lg bg-primary uppercase shadow-lg shadow-primary/20"
            >
              {isRegistrationLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Authorize Node Creation"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Task Modification Sheet */}
      <Sheet open={isEditingTask} onOpenChange={setIsEditingTask}>
        <SheetContent className="sm:max-w-md overflow-y-auto border-l-4 border-primary rounded-l-[2rem] p-0">
          <SheetHeader className="p-10 bg-primary/5 border-b">
            <SheetTitle className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              {editingTask?.id ? "Edit Manifest" : "New Manifest"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-10 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase ml-1">Service Type</Label>
                <Select value={editingTask?.serviceType} onValueChange={(val) => setEditingTask({ ...editingTask, serviceType: val })}>
                  <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["State Shipping", "National Shipping", "Marketplace", "Errand", "Food", "Laundry"].map(t => (
                      <SelectItem key={t} value={t} className="text-xs font-black uppercase">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase ml-1 text-red-600">Priority Level</Label>
                <Select value={editingTask?.priority || 'Medium'} onValueChange={(val) => setEditingTask({ ...editingTask, priority: val })}>
                  <SelectTrigger className="h-11 rounded-xl border-2 border-red-600/20 font-black text-xs text-red-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Low" className="text-xs font-black uppercase">Low Priority</SelectItem>
                    <SelectItem value="Medium" className="text-xs font-black uppercase">Medium Priority</SelectItem>
                    <SelectItem value="High" className="text-xs font-black uppercase text-red-600">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Current Status</Label>
              <Select value={editingTask?.status} onValueChange={(val) => setEditingTask({ ...editingTask, status: val })}>
                <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["Pending Approval", "Processing", "In Transit", "Out for Delivery", "Delivered", "Cancelled"].map(s => (
                    <SelectItem key={s} value={s} className="text-xs font-black uppercase">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Operational Hub</Label>
              <Select value={editingTask?.locationUnit} onValueChange={(val) => setEditingTask({ ...editingTask, locationUnit: val })}>
                <SelectTrigger className="h-11 rounded-xl border-2 font-black text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="General" className="text-xs font-bold">General Hub</SelectItem>
                  {units?.map(unit => (
                    <SelectItem key={unit.id} value={unit.name} className="text-xs font-bold">{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Origin</Label>
              <Input value={editingTask?.origin || ""} onChange={(e) => setEditingTask({ ...editingTask, origin: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Destination</Label>
              <Input value={editingTask?.destination || ""} onChange={(e) => setEditingTask({ ...editingTask, destination: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">Order Details</Label>
              <Textarea value={editingTask?.orderSummary || ""} onChange={(e) => setEditingTask({ ...editingTask, orderSummary: e.target.value })} className="min-h-[80px] rounded-xl border-2" />
            </div>
          </div>
          <SheetFooter className="p-10 border-t bg-muted/5">
            <Button onClick={handleSaveTask} className="w-full h-16 rounded-2xl font-black text-lg bg-primary uppercase shadow-lg shadow-primary/20">
              Authorize Manifest
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}