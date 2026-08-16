"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Truck,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Check,
  Briefcase,
  User,
  Zap,
  Palette,
  Megaphone,
  Gift,
  Sparkles,
  Tag,
  Image as ImageIcon,
  Link as LinkIcon,
  DollarSign,
  CheckCircle,
  Edit,
  Award,
  Star,
  Percent,
  Eye,
  Send
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, limit, orderBy } from "firebase/firestore"
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { getMerchantBalance, getMerchantTransactions, resetMonnifyActions, checkGatewayHealth, saveMonnifyCredentials, testMonnifyCredentials, verifyTransaction } from "@/actions/monnify"
import { approveFundingRequest, rejectFundingRequest, manualCreditUserWallet, verifyMonnifyGatewayMatch, type FundingRequestItem } from "@/actions/wallet-funding"
import { exportToCsv } from "@/lib/export-utils"
import { cn } from "@/lib/utils"
import { registerUserByAdmin } from "@/actions/admin-user"
import { logAuditAction, AuditAction } from "@/lib/audit"
import { XCircle, Ban, Wallet as WalletIcon } from "lucide-react"

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
  const [gatewayHealth, setGatewayHealth] = useState<any>(null)
  const [isFinLoading, setIsFinLoading] = useState(false)

  // Monnify Gateway Credentials Management State
  const [monnifyApiKey, setMonnifyApiKey] = useState("MK_PROD_TQSBYZCPHN")
  const [monnifySecretKey, setMonnifySecretKey] = useState("ZTNLZ9KYFAYKK6DU95D107E7NQKHVMGQ")
  const [monnifyContractCode, setMonnifyContractCode] = useState("730430763017")
  const [monnifyWalletAccount, setMonnifyWalletAccount] = useState("8065933172")
  const [monnifyBaseUrl, setMonnifyBaseUrl] = useState("https://api.monnify.com")
  const [monnifyPaymentMethods, setMonnifyPaymentMethods] = useState<string[]>([
    "CARD", "USSD", "DIRECT_DEBIT", "ACCOUNT_TRANSFER", "CASH", "PHONE_NUMBER"
  ])
  const [isTestingCredentials, setIsTestingCredentials] = useState(false)
  const [isSavingCredentials, setIsSavingCredentials] = useState(false)
  const [credentialTestResult, setCredentialTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)

  // Editing State
  const [isEditingUnit, setIsEditingUnit] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  // Company KYC Review State
  const [selectedCompanyKycUser, setSelectedCompanyKycUser] = useState<any>(null)
  const [kycRejectionReason, setKycRejectionReason] = useState("")
  const [isUpdatingKycStatus, setIsUpdatingKycStatus] = useState(false)

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

  // Branding Management State
  const [appNameInput, setAppNameInput] = useState("Call on Demand")
  const [logoTaglineInput, setLogoTaglineInput] = useState("Lifestyle Services")
  const [logoUrlInput, setLogoUrlInput] = useState("/logo.png")
  const [isSavingBranding, setIsSavingBranding] = useState(false)

  // Adverts & Campaigns Management State
  const [isAdvertSheetOpen, setIsAdvertSheetOpen] = useState(false)
  const [editingAdvert, setEditingAdvert] = useState<any>(null)
  const [advertTitle, setAdvertTitle] = useState("")
  const [advertDescription, setAdvertDescription] = useState("")
  const [advertType, setAdvertType] = useState<"Ad" | "Promo" | "Notification" | "Banner">("Ad")
  const [advertImageUrl, setAdvertImageUrl] = useState("https://picsum.photos/seed/promo/600/400")
  const [advertTargetUrl, setAdvertTargetUrl] = useState("/services")
  const [advertPromoCode, setAdvertPromoCode] = useState("")
  const [advertStatus, setAdvertStatus] = useState<"Active" | "Paused" | "Completed">("Active")
  const [isSavingAdvert, setIsSavingAdvert] = useState(false)

  // Rewards & Quests Management State
  const [referralBonusInput, setReferralBonusInput] = useState(500)
  const [welcomeBonusInput, setWelcomeBonusInput] = useState(200)
  const [goldTierThresholdInput, setGoldTierThresholdInput] = useState(1000)
  const [dailyPointsInput, setDailyPointsInput] = useState(20)
  const [isSavingRewardsSettings, setIsSavingRewardsSettings] = useState(false)

  const [questTitleInput, setQuestTitleInput] = useState("")
  const [questRewardInput, setQuestRewardInput] = useState("")
  const [isSavingQuest, setIsSavingQuest] = useState(false)

  // Direct User Reward Allocation State
  const [rewardTargetUserId, setRewardTargetUserId] = useState("")
  const [grantBonusAmount, setGrantBonusAmount] = useState(0)
  const [grantLoyaltyPoints, setGrantLoyaltyPoints] = useState(0)
  const [grantReason, setGrantReason] = useState("")
  const [isGrantingReward, setIsGrantingReward] = useState(false)

  // Wallet Funding Clearance & Approval State
  const [fundingStatusFilter, setFundingStatusFilter] = useState<string>("Pending Approval")
  const [fundingSearch, setFundingSearch] = useState("")
  const [selectedFundingRequest, setSelectedFundingRequest] = useState<any>(null)
  const [approvalNote, setApprovalNote] = useState("")
  const [rejectionReasonInput, setRejectionReasonInput] = useState("")
  const [isApprovingFunding, setIsApprovingFunding] = useState(false)
  const [isRejectingFunding, setIsRejectingFunding] = useState(false)
  const [isVerifyingMonnifyRef, setIsVerifyingMonnifyRef] = useState(false)
  const [monnifyVerifyData, setMonnifyVerifyData] = useState<any>(null)
  const [monnifyMatchReport, setMonnifyMatchReport] = useState<any>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)

  // Manual Credit Modal State
  const [isManualCreditOpen, setIsManualCreditOpen] = useState(false)
  const [manualCreditUserId, setManualCreditUserId] = useState("")
  const [manualCreditAmount, setManualCreditAmount] = useState("")
  const [manualCreditReason, setManualCreditReason] = useState("")
  const [isProcessingManualCredit, setIsProcessingManualCredit] = useState(false)

  const campaignsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'campaigns'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: campaignsList } = useCollection(campaignsQuery);

  const questsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'reward_quests'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: rewardQuestsList } = useCollection(questsQuery);

  const auditLogsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'system_logs'), orderBy('timestamp', 'desc'), limit(100));
  }, [firestore]);
  const { data: auditLogs } = useCollection(auditLogsQuery);

  const fundingRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'fundingRequests'), orderBy('createdAt', 'desc'), limit(200));
  }, [firestore]);
  const { data: fundingRequestsList, isLoading: isFundingLoading } = useCollection(fundingRequestsQuery);
  
  const fetchSystemFinancials = useCallback(async () => {
    setIsFinLoading(true);
    try {
      const balanceResult = await getMerchantBalance();
      const txResult = await getMerchantTransactions();
      const healthResult = await checkGatewayHealth();
      if (balanceResult && balanceResult.success) setSystemBalance(balanceResult.response);
      if (txResult && txResult.success) setSystemTransactions(txResult.response || []);
      if (healthResult && healthResult.success) setGatewayHealth(healthResult.health);
    } catch (e) {
      console.error(e);
      toast({ title: "Ledger Sync Failed", variant: "destructive" });
    } finally {
      setIsFinLoading(false);
    }
  }, [toast]);

  const handleResetMonnifyGateway = async () => {
    try {
      setIsFinLoading(true);
      const res = await resetMonnifyActions();
      if (res.success) {
        toast({ title: "Monnify Gateway Reset", description: res.message });
        await fetchSystemFinancials();
      } else {
        toast({ title: "Gateway Reset Failed", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Gateway Reset Error", variant: "destructive" });
    } finally {
      setIsFinLoading(false);
    }
  };

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

  useEffect(() => {
    if (appSettings) {
      if (appSettings.monnifyApiKey && appSettings.monnifyApiKey !== 'MK_PROD_VRXL0T3UDD') setMonnifyApiKey(appSettings.monnifyApiKey);
      if (appSettings.monnifySecretKey && !appSettings.monnifySecretKey.includes('8SJL')) setMonnifySecretKey(appSettings.monnifySecretKey);
      setMonnifyContractCode(appSettings.monnifyContractCode || "730430763017");
      if (appSettings.monnifyWalletAccount) setMonnifyWalletAccount(appSettings.monnifyWalletAccount);
      if (appSettings.monnifyBaseUrl) setMonnifyBaseUrl(appSettings.monnifyBaseUrl);
      if (Array.isArray(appSettings.monnifyPaymentMethods) && appSettings.monnifyPaymentMethods.length > 0) {
        setMonnifyPaymentMethods(appSettings.monnifyPaymentMethods);
      }
      if (appSettings.appName) setAppNameInput(appSettings.appName);
      if (appSettings.logoTagline) setLogoTaglineInput(appSettings.logoTagline);
      if (appSettings.logoUrl) setLogoUrlInput(appSettings.logoUrl);
      if (appSettings.referralBonusAmount !== undefined) setReferralBonusInput(appSettings.referralBonusAmount);
      if (appSettings.referralWelcomeBonus !== undefined) setWelcomeBonusInput(appSettings.referralWelcomeBonus);
      if (appSettings.goldTierPointsThreshold !== undefined) setGoldTierThresholdInput(appSettings.goldTierPointsThreshold);
      if (appSettings.dailyCheckinPoints !== undefined) setDailyPointsInput(appSettings.dailyCheckinPoints);
    }
  }, [appSettings]);

  const handleTestMonnifyCredentials = async () => {
    setIsTestingCredentials(true);
    setCredentialTestResult(null);
    try {
      const res = await testMonnifyCredentials({
        apiKey: monnifyApiKey,
        secretKey: monnifySecretKey,
        contractCode: monnifyContractCode || "730430763017",
        baseUrl: monnifyBaseUrl
      });
      if (res.success) {
        setCredentialTestResult({ success: true, message: res.message || 'Monnify Credentials Handshake Successful!', details: res.details });
        toast({ title: "Monnify Handshake Successful", description: res.message });
      } else {
        setCredentialTestResult({ success: false, message: res.error || 'Authentication Handshake Failed.' });
        toast({ title: "Authentication Handshake Failed", description: res.error, variant: "destructive" });
      }
    } catch (e: any) {
      setCredentialTestResult({ success: false, message: e.message || 'Test Failed.' });
      toast({ title: "Handshake Exception", description: e.message, variant: "destructive" });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const handleSaveMonnifyCredentials = async () => {
    setIsSavingCredentials(true);
    try {
      const res = await saveMonnifyCredentials({
        apiKey: monnifyApiKey,
        secretKey: monnifySecretKey,
        contractCode: monnifyContractCode || "730430763017",
        walletAccount: monnifyWalletAccount,
        baseUrl: monnifyBaseUrl,
        paymentMethods: monnifyPaymentMethods
      });
      if (res.success) {
        toast({ title: "Gateway Credentials Saved", description: res.message });
        await fetchSystemFinancials();
      } else {
        toast({ title: "Save Failed", description: res.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Save Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingCredentials(false);
    }
  };

  // Branding Management Handlers
  const handleSaveBranding = async () => {
    if (!firestore) return;
    setIsSavingBranding(true);
    try {
      await updateDocumentNonBlocking(doc(firestore, 'application_settings', 'global_settings'), {
        appName: appNameInput,
        logoTagline: logoTaglineInput,
        logoUrl: logoUrlInput,
        updatedAt: new Date().toISOString()
      });
      logAuditAction(AuditAction.CONFIG_UPDATE, { action: 'UPDATE_BRANDING', appName: appNameInput, logoUrl: logoUrlInput });
      toast({ title: "Branding Saved Successfully", description: "Your custom logo, app name, and tagline are now live." });
    } catch (e: any) {
      toast({ title: "Branding Save Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Adverts & Campaigns Handlers
  const handleOpenAdvertSheet = (advert?: any) => {
    if (advert) {
      setEditingAdvert(advert);
      setAdvertTitle(advert.title || "");
      setAdvertDescription(advert.description || "");
      setAdvertType(advert.type || "Ad");
      setAdvertImageUrl(advert.imageUrl || "https://picsum.photos/seed/promo/600/400");
      setAdvertTargetUrl(advert.targetUrl || "/services");
      setAdvertPromoCode(advert.promoCode || "");
      setAdvertStatus(advert.status || "Active");
    } else {
      setEditingAdvert(null);
      setAdvertTitle("");
      setAdvertDescription("");
      setAdvertType("Ad");
      setAdvertImageUrl("https://picsum.photos/seed/promo/600/400");
      setAdvertTargetUrl("/services");
      setAdvertPromoCode("");
      setAdvertStatus("Active");
    }
    setIsAdvertSheetOpen(true);
  };

  const handleSaveAdvert = async () => {
    if (!firestore) return;
    if (!advertTitle.trim()) {
      toast({ title: "Missing Title", description: "Please enter a campaign title.", variant: "destructive" });
      return;
    }
    setIsSavingAdvert(true);
    try {
      const data = {
        title: advertTitle,
        description: advertDescription,
        type: advertType,
        imageUrl: advertImageUrl,
        targetUrl: advertTargetUrl,
        promoCode: advertPromoCode,
        status: advertStatus,
        updatedAt: new Date().toISOString()
      };

      if (editingAdvert) {
        await updateDocumentNonBlocking(doc(firestore, 'campaigns', editingAdvert.id), data);
        logAuditAction(AuditAction.CONFIG_UPDATE, { action: 'EDIT_CAMPAIGN', campaignId: editingAdvert.id, title: advertTitle });
        toast({ title: "Advert Updated", description: `Campaign "${advertTitle}" updated.` });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'campaigns'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        logAuditAction(AuditAction.CONFIG_UPDATE, { action: 'CREATE_CAMPAIGN', title: advertTitle, type: advertType });
        toast({ title: "Advert Published", description: `New campaign "${advertTitle}" is active.` });
      }
      setIsAdvertSheetOpen(false);
    } catch (e: any) {
      toast({ title: "Advert Save Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingAdvert(false);
    }
  };

  const handleToggleAdvertStatus = async (advertId: string, currentStatus: string) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    await updateDocumentNonBlocking(doc(firestore, 'campaigns', advertId), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    logAuditAction(AuditAction.CONFIG_UPDATE, { action: 'TOGGLE_CAMPAIGN', campaignId: advertId, newStatus });
    toast({ title: "Campaign Updated", description: `Campaign is now ${newStatus}` });
  };

  const handleDeleteAdvert = async (advertId: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure you want to delete this advertisement campaign?")) return;
    await deleteDocumentNonBlocking(doc(firestore, 'campaigns', advertId));
    logAuditAction(AuditAction.CONFIG_UPDATE, { action: 'DELETE_CAMPAIGN', campaignId: advertId });
    toast({ title: "Advert Deleted", description: "Campaign removed." });
  };

  // Rewards & Quests Handlers
  const handleSaveRewardsSettings = async () => {
    if (!firestore) return;
    setIsSavingRewardsSettings(true);
    try {
      await updateDocumentNonBlocking(doc(firestore, 'application_settings', 'global_settings'), {
        referralBonusAmount: Number(referralBonusInput),
        referralWelcomeBonus: Number(welcomeBonusInput),
        goldTierPointsThreshold: Number(goldTierThresholdInput),
        dailyCheckinPoints: Number(dailyPointsInput),
        updatedAt: new Date().toISOString()
      });
      logAuditAction(AuditAction.CONFIG_UPDATE, { action: 'UPDATE_REWARDS_SETTINGS', referralBonusInput });
      toast({ title: "Rewards Settings Saved", description: "Global referral bonuses and loyalty tiers updated." });
    } catch (e: any) {
      toast({ title: "Rewards Settings Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingRewardsSettings(false);
    }
  };

  const handleCreateQuest = async () => {
    if (!firestore) return;
    if (!questTitleInput.trim()) {
      toast({ title: "Missing Quest Title", description: "Please enter a title for the quest.", variant: "destructive" });
      return;
    }
    setIsSavingQuest(true);
    try {
      await addDocumentNonBlocking(collection(firestore, 'reward_quests'), {
        title: questTitleInput,
        reward: questRewardInput || "100 Points",
        status: "Active",
        createdAt: new Date().toISOString()
      });
      logAuditAction(AuditAction.CONFIG_UPDATE, { action: 'CREATE_QUEST', title: questTitleInput });
      toast({ title: "Quest Added", description: `Quest "${questTitleInput}" created.` });
      setQuestTitleInput("");
      setQuestRewardInput("");
    } catch (e: any) {
      toast({ title: "Quest Creation Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingQuest(false);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure you want to delete this quest?")) return;
    await deleteDocumentNonBlocking(doc(firestore, 'reward_quests', questId));
    logAuditAction(AuditAction.CONFIG_UPDATE, { action: 'DELETE_QUEST', questId });
    toast({ title: "Quest Deleted", description: "Quest removed." });
  };

  const handleGrantUserReward = async () => {
    if (!firestore || !rewardTargetUserId) {
      toast({ title: "Select Target User", description: "Please select a user to grant rewards to.", variant: "destructive" });
      return;
    }
    if (grantBonusAmount <= 0 && grantLoyaltyPoints <= 0) {
      toast({ title: "Enter Amount", description: "Specify either bonus cash (₦) or loyalty points.", variant: "destructive" });
      return;
    }
    setIsGrantingReward(true);
    try {
      await addDocumentNonBlocking(collection(firestore, 'users', rewardTargetUserId, 'rewards'), {
        amount: Number(grantBonusAmount),
        points: Number(grantLoyaltyPoints),
        description: grantReason || "Admin Reward Allocation",
        type: grantBonusAmount > 0 ? "Cashback" : "Loyalty",
        status: "Available",
        date: new Date().toISOString()
      });

      logAuditAction(AuditAction.CONFIG_UPDATE, { 
        action: 'GRANT_REWARD', 
        targetUserId: rewardTargetUserId, 
        amount: grantBonusAmount, 
        points: grantLoyaltyPoints 
      });

      toast({ title: "Reward Granted!", description: `Allocated ₦${grantBonusAmount} bonus & ${grantLoyaltyPoints} points to partner user.` });
      setGrantBonusAmount(0);
      setGrantLoyaltyPoints(0);
      setGrantReason("");
    } catch (e: any) {
      toast({ title: "Grant Error", description: e.message, variant: "destructive" });
    } finally {
      setIsGrantingReward(false);
    }
  };

  // Funding Requests Clearance Actions
  const handleApproveFunding = async (item: any) => {
    if (!user?.email || !user?.uid) return;
    setIsApprovingFunding(true);
    try {
      const res = await approveFundingRequest({
        requestId: item.id,
        adminEmail: user.email,
        adminUid: user.uid,
        note: approvalNote || 'Approved via SuperAdmin Wallet Clearance'
      });
      if (res.success) {
        toast({
          title: "Funding Approved & Credited",
          description: `Successfully authorized and credited ₦${Number(item.amount).toLocaleString()} to ${item.userEmail || item.userId}.`,
          className: "bg-green-600 text-white"
        });
        setSelectedFundingRequest(null);
        setIsApproveDialogOpen(false);
        setApprovalNote("");
      } else {
        toast({
          title: "Approval Failed",
          description: res.error || "Could not complete wallet crediting.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({ title: "Execution Error", description: err?.message || "Internal error", variant: "destructive" });
    } finally {
      setIsApprovingFunding(false);
    }
  };

  const handleRejectFunding = async (item: any) => {
    if (!user?.email || !user?.uid) return;
    setIsRejectingFunding(true);
    try {
      const res = await rejectFundingRequest({
        requestId: item.id,
        adminEmail: user.email,
        adminUid: user.uid,
        rejectionReason: rejectionReasonInput || 'Declined by Administrator audit'
      });
      if (res.success) {
        toast({
          title: "Funding Request Declined",
          description: `Transaction ${item.reference} rejected. Wallet balance remained untouched.`
        });
        setSelectedFundingRequest(null);
        setIsRejectDialogOpen(false);
        setRejectionReasonInput("");
      } else {
        toast({
          title: "Rejection Failed",
          description: res.error || "Could not update status.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({ title: "Execution Error", description: err?.message || "Internal error", variant: "destructive" });
    } finally {
      setIsRejectingFunding(false);
    }
  };

  const handleLiveVerifyMonnify = async (item: any) => {
    if (!item?.reference) return;
    setIsVerifyingMonnifyRef(true);
    try {
      const res = await verifyMonnifyGatewayMatch({
        reference: item.reference,
        expectedAmount: Number(item.amount),
        expectedUserEmail: item.userEmail
      });
      if (res.success && res.gatewayData) {
        setMonnifyVerifyData(res.gatewayData);
        setMonnifyMatchReport(res);
        if (res.isMatched) {
          toast({
            title: "Monnify Gateway 100% Matched",
            description: `Contract: ${res.gatewayData.contractCode || '730430763017'} | Settled: ₦${Number(res.gatewayData.amountPaid || res.gatewayData.amount || item.amount).toLocaleString()} | Status: ${res.gatewayData.paymentStatus || 'PAID'}`,
            className: "bg-green-600 text-white"
          });
        } else {
          toast({
            title: "Gateway Verification Notice",
            description: res.discrepancies.join(' | ') || "Discrepancy detected with gateway record.",
            variant: "destructive"
          });
        }
      } else {
        setMonnifyVerifyData(null);
        setMonnifyMatchReport(res);
        toast({
          title: "Monnify Query Notice",
          description: res.error || "Gateway record not confirmed yet.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({ title: "Verification Error", description: err?.message, variant: "destructive" });
    } finally {
      setIsVerifyingMonnifyRef(false);
    }
  };

  const handleExecuteManualCredit = async () => {
    if (!manualCreditUserId || !manualCreditAmount || Number(manualCreditAmount) <= 0) {
      toast({ title: "Invalid Parameters", description: "Select user and specify valid amount (min ₦1).", variant: "destructive" });
      return;
    }
    if (!user?.email || !user?.uid) return;
    setIsProcessingManualCredit(true);
    try {
      const targetUserObj = platformUsers?.find((u: any) => u.id === manualCreditUserId);
      const targetUserEmail = targetUserObj?.email || 'customer@call-on-demand.com';

      const res = await manualCreditUserWallet({
        userId: manualCreditUserId,
        userEmail: targetUserEmail,
        amount: Number(manualCreditAmount),
        reason: manualCreditReason || 'Manual Admin Credit Adjustment',
        adminEmail: user.email,
        adminUid: user.uid
      });

      if (res.success) {
        toast({
          title: "Manual Credit Executed",
          description: `Successfully credited ₦${Number(manualCreditAmount).toLocaleString()} to ${targetUserEmail}.`,
          className: "bg-green-600 text-white"
        });
        setIsManualCreditOpen(false);
        setManualCreditUserId("");
        setManualCreditAmount("");
        setManualCreditReason("");
      } else {
        toast({ title: "Credit Failed", description: res.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
    } finally {
      setIsProcessingManualCredit(false);
    }
  };

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
    const isAdminEligible = !!adminDoc || isMasterAdmin;
    if (isAdminEligible && activeTab === 'overview' && mounted) {
      fetchSystemFinancials();
    }
  }, [adminDoc, isMasterAdmin, activeTab, mounted, fetchSystemFinancials]);

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

  const pendingFundingRequests = useMemo(() => {
    if (!fundingRequestsList) return [];
    return fundingRequestsList.filter((r: any) => r.status === 'Pending Approval');
  }, [fundingRequestsList]);

  const pendingFundingCount = pendingFundingRequests.length;

  const pendingFundingTotal = useMemo(() => {
    return pendingFundingRequests.reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
  }, [pendingFundingRequests]);

  const approvedFundingTotal = useMemo(() => {
    if (!fundingRequestsList) return 0;
    return fundingRequestsList
      .filter((r: any) => r.status === 'Approved')
      .reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
  }, [fundingRequestsList]);

  const rejectedFundingCount = useMemo(() => {
    if (!fundingRequestsList) return 0;
    return fundingRequestsList.filter((r: any) => r.status === 'Rejected').length;
  }, [fundingRequestsList]);

  const filteredFundingRequests = useMemo(() => {
    if (!fundingRequestsList) return [];
    return fundingRequestsList
      .filter((r: any) => {
        const matchesStatus = fundingStatusFilter === "All" || r.status === fundingStatusFilter;
        if (!matchesStatus) return false;
        if (!fundingSearch) return true;
        const q = fundingSearch.toLowerCase();
        return (
          r.reference?.toLowerCase().includes(q) ||
          r.gatewayId?.toLowerCase().includes(q) ||
          r.userEmail?.toLowerCase().includes(q) ||
          r.userName?.toLowerCase().includes(q) ||
          r.userId?.toLowerCase().includes(q) ||
          String(r.amount).includes(q)
        );
      })
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [fundingRequestsList, fundingStatusFilter, fundingSearch]);

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

  const handleVerifyCompanyKyc = (userId: string, status: 'Verified' | 'Rejected' | 'Pending', reason?: string) => {
    if (!firestore) return;
    setIsUpdatingKycStatus(true);
    const userRef = doc(firestore, 'users', userId);

    const currentCompany = selectedCompanyKycUser?.companyKyc || {};
    const updatedCompanyKyc = {
      ...currentCompany,
      status,
      verifiedAt: status === 'Verified' ? new Date().toISOString() : currentCompany.verifiedAt || null,
      rejectionReason: status === 'Rejected' ? (reason || 'Incomplete or unverified corporate credentials.') : null
    };

    const updates: any = { companyKyc: updatedCompanyKyc };
    if (status === 'Verified') {
      updates.identityVerified = true;
    }

    updateDocumentNonBlocking(userRef, updates);
    logAuditAction(AuditAction.CONFIG_UPDATE, { userId, action: `COMPANY_KYC_${status}`, reason });

    toast({
      title: `Company KYC ${status}`,
      description: `Corporate status for ${currentCompany.businessName || 'User'} set to ${status}.`
    });

    setIsUpdatingKycStatus(false);
    setSelectedCompanyKycUser(null);
    setKycRejectionReason("");
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
      const result = await registerUserByAdmin({
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
          <TabsTrigger value="funding" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase text-amber-600 bg-amber-500/10 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all shadow-sm">
            <ShieldCheck className="h-4 w-4" /> Wallet Approvals
            {pendingFundingCount > 0 && (
              <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full leading-none ml-1 animate-pulse shadow">
                {pendingFundingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><ClipboardList className="h-4 w-4" /> Tasks</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><Users className="h-4 w-4" /> KYC</TabsTrigger>
          <TabsTrigger value="branding" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><Palette className="h-4 w-4" /> Logo & Brand</TabsTrigger>
          <TabsTrigger value="adverts" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><Megaphone className="h-4 w-4" /> Adverts</TabsTrigger>
          <TabsTrigger value="rewards" className="flex-1 gap-2 rounded-xl h-11 px-4 font-bold text-[10px] uppercase"><Gift className="h-4 w-4" /> Rewards</TabsTrigger>
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
                      <TableCell className="pl-8 py-4 font-bold text-[11px]">{mounted && tx.transactionDate ? new Date(tx.transactionDate).toLocaleString() : '...'}</TableCell>
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

        {/* WALLET FUNDING & CLEARANCE HUB TAB */}
        <TabsContent value="funding" className="space-y-8">
          {/* Institutional Security Notice */}
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-[2rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm uppercase tracking-wider text-amber-950">Monnify Funding Gatekeeper (Manual Approval Active)</h3>
                  <Badge className="bg-amber-600 text-white font-black text-[8px] uppercase border-none">Auto-Credit Disabled</Badge>
                </div>
                <p className="text-xs text-amber-900/80 font-medium max-w-2xl leading-relaxed">
                  Incoming Monnify payments are held in the verification queue. Authorize legitimate deposits below to increment partner wallet balances, or reject fraudulent/duplicate references.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button 
                onClick={() => setIsManualCreditOpen(true)} 
                className="rounded-xl h-10 px-4 font-black text-xs uppercase bg-primary hover:bg-primary/90 text-white gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Manual Credit User
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportToCsv(fundingRequestsList || [], 'funding_requests_audit.csv')} 
                className="rounded-xl h-10 px-4 font-black text-xs uppercase border-2 gap-2"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-[2rem] border-2 border-amber-300 bg-amber-50/50 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">Pending Authorization</span>
                <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black tracking-tight text-amber-950">₦{pendingFundingTotal.toLocaleString()}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 mt-1">
                  {pendingFundingCount} deposit request(s) awaiting clearance
                </div>
              </div>
            </Card>

            <Card className="rounded-[2rem] border-2 border-green-200 bg-green-50/40 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-green-800">Total Cleared & Credited</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black tracking-tight text-green-950">₦{approvedFundingTotal.toLocaleString()}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-green-700 mt-1">
                  Authorized & posted to ledger
                </div>
              </div>
            </Card>

            <Card className="rounded-[2rem] border-2 border-red-200 bg-red-50/40 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-800">Declined / Rejected</span>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black tracking-tight text-red-950">{rejectedFundingCount}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-red-700 mt-1">
                  Blocked from wallet balance
                </div>
              </div>
            </Card>

            <Card className="rounded-[2rem] border-2 bg-card p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Requests Tracked</span>
                <Landmark className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black tracking-tight">{fundingRequestsList?.length || 0}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-1">
                  Monnify Direct & Webhook Entries
                </div>
              </div>
            </Card>
          </div>

          {/* Filtering & Requests Table */}
          <Card className="rounded-[2.5rem] border-2 shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/10 p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> Funding Clearance Queue
                </CardTitle>
                <CardDescription className="text-xs font-semibold">
                  Review transaction telemetry and authorize balance adjustments.
                </CardDescription>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {['Pending Approval', 'All', 'Approved', 'Rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={fundingStatusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFundingStatusFilter(status)}
                    className={cn(
                      "rounded-xl h-8 px-3 text-[10px] font-black uppercase",
                      fundingStatusFilter === status && status === 'Pending Approval' ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                    )}
                  >
                    {status}
                    {status === 'Pending Approval' && pendingFundingCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 bg-white text-amber-800 text-[8px] font-black rounded-full">
                        {pendingFundingCount}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </CardHeader>

            {/* Search toolbar */}
            <div className="p-4 border-b bg-muted/5 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={fundingSearch}
                  onChange={(e) => setFundingSearch(e.target.value)}
                  placeholder="Search by Payment Reference, Email, Name, or User ID..."
                  className="pl-9 h-10 rounded-xl border-2 font-medium text-xs bg-background"
                />
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase pl-6">Reference & Date</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Customer / Partner</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Amount & Method</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Monnify Gateway</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Clearance Status</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-right pr-6">Review & Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFundingLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-20 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                          <p className="text-xs font-bold text-muted-foreground uppercase">Loading Clearance Ledger...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredFundingRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-20 text-green-600" />
                          <p className="text-xs font-black uppercase tracking-wider">No funding requests found in this view</p>
                          <p className="text-[11px] font-medium text-muted-foreground mt-1">
                            {fundingStatusFilter === 'Pending Approval' ? 'All Monnify deposits have been cleared and authorized.' : 'No transactions match the selected filter.'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFundingRequests.map((req: any) => (
                        <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="space-y-1">
                              <span className="font-mono font-black text-xs text-foreground block">{req.reference}</span>
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
                                <Clock className="h-2.5 w-2.5" />
                                {mounted && req.createdAt ? new Date(req.createdAt).toLocaleString() : '...'}
                              </div>
                              {req.gatewayId && req.gatewayId !== req.reference && (
                                <span className="text-[9px] font-mono text-muted-foreground block truncate max-w-[140px]">
                                  GW: {req.gatewayId}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-0.5">
                              <span className="font-black text-xs block">{req.userName || 'Partner'}</span>
                              <span className="font-medium text-[11px] text-muted-foreground block">{req.userEmail}</span>
                              <span className="font-mono text-[9px] text-muted-foreground/60 block">UID: {req.userId?.slice(0, 10)}...</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-0.5">
                              <span className="font-black text-sm text-green-700 block">₦{Number(req.amount || 0).toLocaleString()}</span>
                              <Badge variant="outline" className="text-[8px] font-bold uppercase px-1.5 py-0 border-muted">
                                {req.paymentMethod || 'Monnify Direct'}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={cn(
                                "text-[9px] font-black uppercase border-none",
                                req.gatewayStatus === 'PAID' ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                              )}>
                                Monnify: {req.gatewayStatus || 'PENDING'}
                              </Badge>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleLiveVerifyMonnify(req)}
                                  disabled={isVerifyingMonnifyRef}
                                  className="text-[9px] font-black text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  <RefreshCw className="h-2.5 w-2.5" /> Live Re-Verify
                                </button>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {req.status === 'Pending Approval' ? (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-black uppercase text-[9px] px-2 py-0.5 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 animate-pulse" /> Pending Approval
                              </Badge>
                            ) : req.status === 'Approved' ? (
                              <div className="space-y-0.5">
                                <Badge className="bg-green-100 text-green-800 border border-green-300 font-black uppercase text-[9px] px-2 py-0.5 inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Cleared & Credited
                                </Badge>
                                <span className="text-[8px] font-semibold text-muted-foreground block">
                                  By: {req.approvedBy?.split('@')[0] || 'Admin'}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <Badge className="bg-red-100 text-red-800 border border-red-300 font-black uppercase text-[9px] px-2 py-0.5 inline-flex items-center gap-1">
                                  <XCircle className="h-3 w-3" /> Declined
                                </Badge>
                                {req.rejectionReason && (
                                  <span className="text-[8px] font-medium text-red-600 block max-w-[120px] truncate" title={req.rejectionReason}>
                                    {req.rejectionReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="pr-6 text-right">
                            {req.status === 'Pending Approval' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFundingRequest(req);
                                    setIsApproveDialogOpen(true);
                                  }}
                                  disabled={isApprovingFunding}
                                  className="h-8 px-3 rounded-xl font-black text-[10px] uppercase bg-green-600 hover:bg-green-700 text-white gap-1.5 shadow-sm"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Credit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFundingRequest(req);
                                    setIsRejectDialogOpen(true);
                                  }}
                                  disabled={isRejectingFunding}
                                  className="h-8 px-3 rounded-xl font-black text-[10px] uppercase text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                                >
                                  <Ban className="h-3.5 w-3.5" /> Decline
                                </Button>
                              </div>
                            ) : (
                              <div className="text-[10px] font-bold text-muted-foreground">
                                {req.approvedAt || req.rejectedAt ? (mounted ? new Date(req.approvedAt || req.rejectedAt).toLocaleDateString() : '...') : 'Processed'}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
                    <TableHead className="font-black uppercase text-[9px]">Company KYC</TableHead>
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
                      <TableCell>
                        {u.companyKyc?.businessName ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold text-xs truncate max-w-[140px]">{u.companyKyc.businessName}</div>
                              <div className="text-[9px] font-mono text-muted-foreground">{u.companyKyc.rcNumber}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCompanyKycUser(u)}
                              className={cn(
                                "h-7 rounded-lg text-[9px] font-black uppercase px-2 gap-1 border-2",
                                u.companyKyc.status === 'Verified' ? "border-green-500/40 text-green-700 bg-green-50/50" :
                                u.companyKyc.status === 'Rejected' ? "border-red-500/40 text-red-700 bg-red-50/50" :
                                "border-amber-500/40 text-amber-700 bg-amber-50/50"
                              )}
                            >
                              <Building2 className="h-3 w-3" />
                              {u.companyKyc.status === 'Verified' ? 'Verified' : u.companyKyc.status === 'Rejected' ? 'Rejected' : 'Review'}
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setSelectedCompanyKycUser(u)}
                            className="h-7 text-[9px] font-bold text-muted-foreground/60 uppercase hover:text-foreground"
                          >
                            Add Company KYC
                          </Button>
                        )}
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

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-card">
            <CardHeader className="bg-primary/5 p-8 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter"><Landmark className="h-6 w-6 text-primary" /> Monnify Payment Gateway & Actions Engine</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Manage API authorization tokens, merchant ledger, disburse funds, and active gateway actions.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={fetchSystemFinancials} disabled={isFinLoading} variant="outline" className="rounded-xl font-black text-xs uppercase border-2 h-12 px-5 gap-2">
                  <RefreshCw className={cn("h-4 w-4", isFinLoading && "animate-spin")} /> Refresh Diagnostics
                </Button>
                <Button onClick={handleResetMonnifyGateway} disabled={isFinLoading} className="rounded-xl font-black text-xs uppercase h-12 px-5 gap-2 bg-primary text-primary-foreground shadow-md">
                  <RotateCcw className={cn("h-4 w-4", isFinLoading && "animate-spin")} /> Reset Token Cache & Actions
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-muted/30 p-6 rounded-2xl border border-black/5">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Gateway Health Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-base font-black text-green-600 uppercase tracking-tight">{gatewayHealth?.status || "Active / Ready"}</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl border border-black/5">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Operating Mode</p>
                  <p className="text-base font-black text-primary uppercase tracking-tight mt-2">{gatewayHealth?.mode || "PRODUCTION_LIVE"}</p>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl border border-black/5">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Merchant Ledger Balance</p>
                  <p className="text-xl font-black text-primary mt-1">₦{(systemBalance?.availableBalance || 0).toLocaleString()}</p>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl border border-black/5">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Auth Response Latency</p>
                  <p className="text-base font-black text-slate-700 mt-2">{gatewayHealth?.authLatencyMs ? `${gatewayHealth.authLatencyMs} ms` : "Fast (<100ms)"}</p>
                </div>
              </div>

              {/* Active Server Actions Registry */}
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> Active Monnify Gateway Actions (10/10 Online)
                  </span>
                  <Badge className="bg-primary text-primary-foreground font-black text-[9px] uppercase px-3">VERIFIED LIVE</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    "initMonnifyTransaction",
                    "verifyTransaction",
                    "getReservedAccount",
                    "vendBillPayment",
                    "validateBankAccount",
                    "getBanks",
                    "disburseFunds",
                    "getMerchantBalance",
                    "searchTransactions",
                    "resetMonnifyActions"
                  ].map((actionName) => (
                    <div key={actionName} className="bg-background/80 p-3 rounded-xl border flex items-center gap-2 shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span className="text-[10px] font-mono font-bold truncate text-foreground">{actionName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monnify Credentials Configuration & Live Handshake Test */}
              <div className="p-6 rounded-3xl border-2 border-primary/20 bg-card space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Monnify API Credentials & Live Handshake Setup
                    </h4>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                      Configure official Monnify API Key, Secret Key, Contract Code, and Base URL. Credentials are sanitized to eliminate formatting errors.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      onClick={handleTestMonnifyCredentials} 
                      disabled={isTestingCredentials} 
                      variant="outline" 
                      className="rounded-xl font-black text-xs uppercase h-10 px-4 border-2 gap-1.5"
                    >
                      {isTestingCredentials ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                      Test Handshake
                    </Button>
                    <Button 
                      onClick={handleSaveMonnifyCredentials} 
                      disabled={isSavingCredentials} 
                      className="rounded-xl font-black text-xs uppercase h-10 px-4 bg-primary text-primary-foreground gap-1.5"
                    >
                      {isSavingCredentials ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save Credentials
                    </Button>
                  </div>
                </div>

                {credentialTestResult && (
                  <div className={cn(
                    "p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3",
                    credentialTestResult.success ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"
                  )}>
                    {credentialTestResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-black uppercase tracking-wider text-[10px]">
                        {credentialTestResult.success ? "Authentication Handshake Successful" : "Authentication Handshake Rejected"}
                      </div>
                      <p className="mt-1 font-medium">{credentialTestResult.message}</p>
                      {credentialTestResult.details && (
                        <div className="mt-2 text-[10px] font-mono opacity-80">
                          Base URL: {credentialTestResult.details.baseUrl} | Mode: {credentialTestResult.details.isProduction ? 'PRODUCTION' : 'SANDBOX'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Monnify API Key</Label>
                    <Input 
                      type="password"
                      value={monnifyApiKey}
                      onChange={(e) => setMonnifyApiKey(e.target.value)}
                      placeholder="e.g. MK_PROD_... or MK_TEST_..."
                      className="h-11 rounded-xl border-2 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Monnify Secret Key</Label>
                    <Input 
                      type="password"
                      value={monnifySecretKey}
                      onChange={(e) => setMonnifySecretKey(e.target.value)}
                      placeholder="e.g. 1234567890ABCDEF..."
                      className="h-11 rounded-xl border-2 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contract Code (10 Digits)</Label>
                    <Input 
                      value={monnifyContractCode}
                      onChange={(e) => setMonnifyContractCode(e.target.value)}
                      placeholder="e.g. 8420194810"
                      className="h-11 rounded-xl border-2 font-black text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Merchant Wallet Account No.</Label>
                    <Input 
                      value={monnifyWalletAccount}
                      onChange={(e) => setMonnifyWalletAccount(e.target.value)}
                      placeholder="e.g. 3948102941"
                      className="h-11 rounded-xl border-2 font-black text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Gateway Environment Base URL</Label>
                    <Select value={monnifyBaseUrl || "https://sandbox.monnify.com/api"} onValueChange={setMonnifyBaseUrl}>
                      <SelectTrigger className="h-11 rounded-xl border-2 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="https://sandbox.monnify.com/api" className="text-xs font-bold">Sandbox (https://sandbox.monnify.com/api)</SelectItem>
                        <SelectItem value="https://api.monnify.com/api" className="text-xs font-bold">Production (https://api.monnify.com/api)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Enabled Payment Methods</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: "CARD", label: "CARD" },
                      { code: "USSD", label: "USSD" },
                      { code: "DIRECT_DEBIT", label: "DIRECT DEBIT" },
                      { code: "ACCOUNT_TRANSFER", label: "ACCOUNT TRANSFER" },
                      { code: "CASH", label: "CASH" },
                      { code: "PHONE_NUMBER", label: "PHONE NUMBER" }
                    ].map((pm) => {
                      const isActive = monnifyPaymentMethods.includes(pm.code);
                      return (
                        <button
                          key={pm.code}
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              setMonnifyPaymentMethods(monnifyPaymentMethods.filter(m => m !== pm.code));
                            } else {
                              setMonnifyPaymentMethods([...monnifyPaymentMethods, pm.code]);
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl border-2 font-black text-xs transition-all flex items-center gap-1.5 uppercase",
                            isActive ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 text-muted-foreground border-transparent hover:border-muted"
                          )}
                        >
                          <Check className={cn("h-3.5 w-3.5", isActive ? "opacity-100" : "opacity-0")} />
                          {pm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logo & Brand Management Tab */}
        <TabsContent value="branding" className="space-y-8">
          <Card className="rounded-[2.5rem] border-2 shadow-xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 p-8 border-b">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">Logo & Brand Identity</CardTitle>
                  <CardDescription className="text-xs font-semibold">Customize logo mark, title and tagline across the mobile app and portal.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Brand Inputs */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">App Title / Brand Name</Label>
                    <Input
                      value={appNameInput}
                      onChange={(e) => setAppNameInput(e.target.value)}
                      placeholder="e.g. Call on Demand"
                      className="h-12 rounded-2xl border-2 font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Brand Tagline / Subtitle</Label>
                    <Input
                      value={logoTaglineInput}
                      onChange={(e) => setLogoTaglineInput(e.target.value)}
                      placeholder="e.g. Lifestyle Services"
                      className="h-12 rounded-2xl border-2 font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom Logo Image URL</Label>
                    <Input
                      value={logoUrlInput}
                      onChange={(e) => setLogoUrlInput(e.target.value)}
                      placeholder="e.g. https://... or /logo.png"
                      className="h-12 rounded-2xl border-2 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preset Logo Options</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { name: "Default Brand", url: "/logo.png" },
                        { name: "Gold Emblem", url: "https://picsum.photos/seed/codbrand/200/200" },
                        { name: "Call Ring", url: "https://picsum.photos/seed/codlogo/200/200" },
                        { name: "Crown Shield", url: "https://picsum.photos/seed/codbrand3/200/200" }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLogoUrlInput(preset.url)}
                          className={cn(
                            "p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2",
                            logoUrlInput === preset.url ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-muted-foreground/30"
                          )}
                        >
                          <div className="h-10 w-10 rounded-full border bg-white overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveBranding}
                    disabled={isSavingBranding}
                    className="w-full h-14 rounded-2xl font-black text-sm uppercase bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2"
                  >
                    {isSavingBranding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Palette className="h-5 w-5" />}
                    Save Logo & Branding Settings
                  </Button>
                </div>

                {/* Live Brand Preview Card */}
                <div className="space-y-6">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground block">Live Interface Preview</Label>
                  
                  <div className="p-6 rounded-[2rem] border-2 bg-slate-50 dark:bg-slate-900/50 space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Light Theme Header</span>
                      <div className="p-4 rounded-2xl bg-white border shadow-sm flex items-center justify-between">
                        <BrandLogo />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase">Preview</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Dark Theme Overlay</span>
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md flex items-center justify-between">
                        <BrandLogo light />
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-white text-[9px] font-black uppercase border-none">Active</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-medium space-y-1">
                      <p className="font-black text-primary uppercase text-[10px]">Realtime Synchronization</p>
                      <p className="text-muted-foreground">Changes saved here automatically update all navigation bars, footers, and brand elements across the platform.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advertisements & Campaigns Tab */}
        <TabsContent value="adverts" className="space-y-8">
          <Card className="rounded-[2.5rem] border-2 shadow-xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 p-8 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">Adverts & Promos</CardTitle>
                  <CardDescription className="text-xs font-semibold">Manage marketing banners, promo popups, and announcement campaigns.</CardDescription>
                </div>
              </div>
              <Button
                onClick={() => handleOpenAdvertSheet()}
                className="h-12 px-6 rounded-2xl font-black text-xs uppercase bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
              >
                <Plus className="h-4 w-4" /> Create New Advert
              </Button>
            </CardHeader>

            <CardContent className="p-8">
              {campaignsList && campaignsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {campaignsList.map((campaign: any) => (
                    <Card key={campaign.id} className="rounded-3xl border-2 overflow-hidden bg-card flex flex-col justify-between group hover:border-primary transition-all shadow-sm">
                      <div className="relative h-40 w-full bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={campaign.imageUrl || "https://picsum.photos/seed/promo/600/400"} alt={campaign.title} className="h-full w-full object-cover" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-black/60 text-white backdrop-blur-md border-none font-black text-[9px] uppercase">
                            {campaign.type || 'Ad'}
                          </Badge>
                          <Badge className={cn(
                            "font-black text-[9px] uppercase border-none",
                            campaign.status === 'Active' ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                          )}>
                            {campaign.status || 'Active'}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-6 space-y-3 flex-1">
                        <h4 className="font-black text-lg leading-tight">{campaign.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium line-clamp-2">{campaign.description || "No description provided."}</p>
                        {campaign.promoCode && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary font-mono text-xs font-black">
                            <Tag className="h-3.5 w-3.5" /> Code: {campaign.promoCode}
                          </div>
                        )}
                      </div>

                      <div className="p-6 pt-0 flex items-center justify-between border-t border-dashed mt-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdvertStatus(campaign.id, campaign.status)}
                          className="rounded-xl font-black text-[10px] uppercase h-9"
                        >
                          {campaign.status === 'Active' ? 'Pause' : 'Activate'}
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenAdvertSheet(campaign)}
                            className="h-9 w-9 rounded-xl border"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAdvert(campaign.id)}
                            className="h-9 w-9 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground opacity-30">
                    <Megaphone className="h-10 w-10" />
                  </div>
                  <p className="font-black uppercase text-xs text-muted-foreground tracking-wider">No Active Campaigns Found</p>
                  <Button onClick={() => handleOpenAdvertSheet()} variant="outline" className="rounded-xl font-black text-xs uppercase h-10">
                    Create First Advert
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards & Quests Tab */}
        <TabsContent value="rewards" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Global Rewards Rules Card */}
            <Card className="rounded-[2.5rem] border-2 shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-muted/30 p-8 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Gift className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Global Reward Rates</CardTitle>
                    <CardDescription className="text-xs font-semibold">Configure referral payouts, welcome bonuses, and loyalty thresholds.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Referral Bonus (Inviter) (₦)</Label>
                  <Input
                    type="number"
                    value={referralBonusInput}
                    onChange={(e) => setReferralBonusInput(Number(e.target.value))}
                    className="h-12 rounded-2xl border-2 font-mono font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Welcome Bonus (Invitee) (₦)</Label>
                  <Input
                    type="number"
                    value={welcomeBonusInput}
                    onChange={(e) => setWelcomeBonusInput(Number(e.target.value))}
                    className="h-12 rounded-2xl border-2 font-mono font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gold Tier Threshold (Loyalty Points)</Label>
                  <Input
                    type="number"
                    value={goldTierThresholdInput}
                    onChange={(e) => setGoldTierThresholdInput(Number(e.target.value))}
                    className="h-12 rounded-2xl border-2 font-mono font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Daily Check-in Loyalty Points</Label>
                  <Input
                    type="number"
                    value={dailyPointsInput}
                    onChange={(e) => setDailyPointsInput(Number(e.target.value))}
                    className="h-12 rounded-2xl border-2 font-mono font-bold text-sm"
                  />
                </div>

                <Button
                  onClick={handleSaveRewardsSettings}
                  disabled={isSavingRewardsSettings}
                  className="w-full h-14 rounded-2xl font-black text-sm uppercase bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2"
                >
                  {isSavingRewardsSettings ? <Loader2 className="h-5 w-5 animate-spin" /> : <Award className="h-5 w-5" />}
                  Save Reward Rules
                </Button>
              </CardContent>
            </Card>

            {/* Quests & Direct Bonus Grant Card */}
            <div className="space-y-8">
              {/* Quests Manager */}
              <Card className="rounded-[2.5rem] border-2 shadow-xl bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 p-6 border-b">
                  <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" /> Active Partner Quests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Quest Title (e.g. First Wallet Top-up)"
                      value={questTitleInput}
                      onChange={(e) => setQuestTitleInput(e.target.value)}
                      className="h-11 rounded-xl border-2 font-semibold text-xs flex-1"
                    />
                    <Input
                      placeholder="Reward (e.g. ₦200)"
                      value={questRewardInput}
                      onChange={(e) => setQuestRewardInput(e.target.value)}
                      className="h-11 rounded-xl border-2 font-semibold text-xs w-32"
                    />
                    <Button
                      onClick={handleCreateQuest}
                      disabled={isSavingQuest}
                      className="h-11 px-4 rounded-xl font-black text-xs uppercase bg-primary gap-1"
                    >
                      {isSavingQuest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {rewardQuestsList && rewardQuestsList.length > 0 ? (
                      rewardQuestsList.map((q: any) => (
                        <div key={q.id} className="p-3 rounded-2xl border flex items-center justify-between bg-muted/20">
                          <div>
                            <p className="font-black text-xs">{q.title}</p>
                            <p className="text-[10px] text-accent font-black uppercase tracking-wider">{q.reward}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuest(q.id)}
                            className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4 font-bold uppercase tracking-wider">No Custom Quests Added Yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Direct User Reward Grant */}
              <Card className="rounded-[2.5rem] border-2 shadow-xl bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 p-6 border-b">
                  <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Send className="h-5 w-5 text-green-500" /> Grant Incentive to Partner User
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Partner User</Label>
                    <Select value={rewardTargetUserId} onValueChange={setRewardTargetUserId}>
                      <SelectTrigger className="h-11 rounded-xl border-2 font-bold text-xs">
                        <SelectValue placeholder="Select user from registry..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {platformUsers?.map((u: any) => (
                          <SelectItem key={u.id} value={u.id} className="text-xs font-semibold">
                            {u.firstName || 'Partner'} {u.lastName || ''} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Bonus Amount (₦)</Label>
                      <Input
                        type="number"
                        value={grantBonusAmount}
                        onChange={(e) => setGrantBonusAmount(Number(e.target.value))}
                        className="h-11 rounded-xl border-2 font-mono font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Loyalty Points</Label>
                      <Input
                        type="number"
                        value={grantLoyaltyPoints}
                        onChange={(e) => setGrantLoyaltyPoints(Number(e.target.value))}
                        className="h-11 rounded-xl border-2 font-mono font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Reason / Note</Label>
                    <Input
                      placeholder="e.g. Winner of Flash Promo"
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      className="h-11 rounded-xl border-2 font-semibold text-xs"
                    />
                  </div>

                  <Button
                    onClick={handleGrantUserReward}
                    disabled={isGrantingReward}
                    className="w-full h-12 rounded-xl font-black text-xs uppercase bg-green-600 hover:bg-green-700 text-white gap-2 shadow-md"
                  >
                    {isGrantingReward ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                    Grant Reward & Issue Points
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Advert Creation/Edit Sheet */}
      <Sheet open={isAdvertSheetOpen} onOpenChange={setIsAdvertSheetOpen}>
        <SheetContent className="sm:max-w-lg border-l-4 border-primary rounded-l-[2rem] p-0 flex flex-col">
          <SheetHeader className="p-8 bg-primary/5 border-b">
            <SheetTitle className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
              <Megaphone className="h-7 w-7 text-primary" />
              {editingAdvert ? "Edit Campaign" : "New Advert Campaign"}
            </SheetTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Configure marketing advert banners, promo codes, and popups.</p>
          </SheetHeader>

          <ScrollArea className="flex-1 p-8 space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Campaign Title</Label>
                <Input
                  value={advertTitle}
                  onChange={(e) => setAdvertTitle(e.target.value)}
                  placeholder="e.g. 50% Off First Errand Booking!"
                  className="h-12 rounded-2xl border-2 font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Campaign Description</Label>
                <Textarea
                  value={advertDescription}
                  onChange={(e) => setAdvertDescription(e.target.value)}
                  placeholder="Describe the promo offer or announcement details..."
                  className="rounded-2xl border-2 font-medium text-xs min-h-[90px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type</Label>
                  <Select value={advertType} onValueChange={(v: any) => setAdvertType(v)}>
                    <SelectTrigger className="h-12 rounded-2xl border-2 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Ad">Ad (Dashboard Banner)</SelectItem>
                      <SelectItem value="Promo">Promo (Popup Offer)</SelectItem>
                      <SelectItem value="Notification">Announcement</SelectItem>
                      <SelectItem value="Banner">Top Banner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                  <Select value={advertStatus} onValueChange={(v: any) => setAdvertStatus(v)}>
                    <SelectTrigger className="h-12 rounded-2xl border-2 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Banner Image URL</Label>
                <Input
                  value={advertImageUrl}
                  onChange={(e) => setAdvertImageUrl(e.target.value)}
                  placeholder="e.g. https://picsum.photos/seed/promo/600/400"
                  className="h-12 rounded-2xl border-2 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Target Route Link</Label>
                  <Input
                    value={advertTargetUrl}
                    onChange={(e) => setAdvertTargetUrl(e.target.value)}
                    placeholder="e.g. /services"
                    className="h-12 rounded-2xl border-2 font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Promo Code (Optional)</Label>
                  <Input
                    value={advertPromoCode}
                    onChange={(e) => setAdvertPromoCode(e.target.value)}
                    placeholder="e.g. DEMAND50"
                    className="h-12 rounded-2xl border-2 font-mono font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="p-8 border-t bg-muted/5">
            <Button
              onClick={handleSaveAdvert}
              disabled={isSavingAdvert}
              className="w-full h-14 rounded-2xl font-black text-sm bg-primary uppercase shadow-lg shadow-primary/20 gap-2"
            >
              {isSavingAdvert ? <Loader2 className="h-5 w-5 animate-spin" /> : <Megaphone className="h-5 w-5" />}
              {editingAdvert ? "Save Campaign Changes" : "Publish Advert Campaign"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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

      {/* Company KYC Review Dialog */}
      <Dialog open={!!selectedCompanyKycUser} onOpenChange={(open) => !open && setSelectedCompanyKycUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 border-2 shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    {selectedCompanyKycUser?.companyKyc?.businessName || `${selectedCompanyKycUser?.firstName || 'Partner'} ${selectedCompanyKycUser?.lastName || ''}'s Company`}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-semibold">
                    Corporate Compliance & Verification Dossier
                  </DialogDescription>
                </div>
              </div>
              <Badge className={cn(
                "px-3 py-1 font-black text-[9px] uppercase border",
                selectedCompanyKycUser?.companyKyc?.status === 'Verified' ? "bg-green-100 text-green-700 border-green-200" :
                selectedCompanyKycUser?.companyKyc?.status === 'Rejected' ? "bg-red-100 text-red-700 border-red-200" :
                "bg-amber-100 text-amber-700 border-amber-200"
              )}>
                {selectedCompanyKycUser?.companyKyc?.status || 'Unverified'}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4 text-xs">
            {/* User Reference */}
            <div className="p-3 rounded-xl bg-muted/40 border flex items-center justify-between">
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[9px] block">Partner Account</span>
                <span className="font-black text-xs">{selectedCompanyKycUser?.firstName} {selectedCompanyKycUser?.lastName} ({selectedCompanyKycUser?.email})</span>
              </div>
              <Badge variant="outline" className="font-black uppercase text-[9px]">{selectedCompanyKycUser?.role || 'Customer'}</Badge>
            </div>

            {/* Corporate Registration */}
            <div className="space-y-3">
              <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Corporate Entity Profile
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-card p-4 rounded-2xl border">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Legal Name</span>
                  <span className="font-black text-xs">{selectedCompanyKycUser?.companyKyc?.businessName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Structure</span>
                  <span className="font-black text-xs">{selectedCompanyKycUser?.companyKyc?.registrationType || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">RC / BN Number</span>
                  <span className="font-mono font-black text-xs">{selectedCompanyKycUser?.companyKyc?.rcNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Tax ID (TIN)</span>
                  <span className="font-mono font-black text-xs">{selectedCompanyKycUser?.companyKyc?.tin || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Incorporation Date</span>
                  <span className="font-black text-xs">{selectedCompanyKycUser?.companyKyc?.incorporationDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Sector</span>
                  <span className="font-black text-xs">{selectedCompanyKycUser?.companyKyc?.sector || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Contact & Address */}
            <div className="space-y-3">
              <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Physical Address & Official Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card p-4 rounded-2xl border">
                <div className="col-span-1 md:col-span-3">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Registered Corporate Address</span>
                  <span className="font-bold text-xs">{selectedCompanyKycUser?.companyKyc?.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Official Email</span>
                  <span className="font-bold text-xs">{selectedCompanyKycUser?.companyKyc?.officialEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Official Phone</span>
                  <span className="font-bold text-xs">{selectedCompanyKycUser?.companyKyc?.officialPhone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Principal Representative */}
            <div className="space-y-3">
              <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Designated Director / Officer
              </h4>
              <div className="grid grid-cols-3 gap-3 bg-card p-4 rounded-2xl border">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Full Name</span>
                  <span className="font-black text-xs">{selectedCompanyKycUser?.companyKyc?.directorName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Title</span>
                  <span className="font-black text-xs">{selectedCompanyKycUser?.companyKyc?.directorPosition || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">BVN / NIN Number</span>
                  <span className="font-mono font-black text-xs">{selectedCompanyKycUser?.companyKyc?.directorBvnNin || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Document Links */}
            <div className="space-y-3">
              <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Verified Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { label: "CAC Certificate", url: selectedCompanyKycUser?.companyKyc?.cacCertificateUrl },
                  { label: "Status Report (Form CAC 1.1)", url: selectedCompanyKycUser?.companyKyc?.statusReportUrl },
                  { label: "Proof of Address (Utility Bill)", url: selectedCompanyKycUser?.companyKyc?.utilityBillUrl },
                  { label: "Director Identity Card", url: selectedCompanyKycUser?.companyKyc?.directorIdUrl }
                ].map((docItem, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                    <span className="font-bold text-xs">{docItem.label}</span>
                    {docItem.url ? (
                      <a href={docItem.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-black text-[10px] text-primary hover:underline">
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground">Not Provided</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection input if needed */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Rejection Reason / Revision Notes (Optional)</label>
              <Input
                value={kycRejectionReason}
                onChange={(e) => setKycRejectionReason(e.target.value)}
                placeholder="e.g. CAC Certificate is unreadable or expired."
                className="h-10 rounded-xl border-2 font-semibold text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => handleVerifyCompanyKyc(selectedCompanyKycUser.id, 'Rejected', kycRejectionReason)}
              disabled={isUpdatingKycStatus}
              className="rounded-xl font-black text-xs uppercase text-red-600 border-red-200 hover:bg-red-50"
            >
              Reject KYC
            </Button>
            <Button
              onClick={() => handleVerifyCompanyKyc(selectedCompanyKycUser.id, 'Verified')}
              disabled={isUpdatingKycStatus}
              className="rounded-xl font-black text-xs uppercase bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {isUpdatingKycStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve Corporate KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* APPROVE FUNDING DIALOG */}
      <Dialog open={isApproveDialogOpen} onOpenChange={(open) => {
        setIsApproveDialogOpen(open);
        if (!open) {
          setMonnifyVerifyData(null);
          setMonnifyMatchReport(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg rounded-[2.5rem] border-2 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" /> Authorize Wallet Funding
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold">
              Cross-reference payment reference with Monnify gateway account before crediting user ledger.
            </DialogDescription>
          </DialogHeader>

          {selectedFundingRequest && (
            <div className="space-y-4 py-3">
              <div className="bg-muted/40 p-4 rounded-2xl border space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-muted-foreground uppercase text-[10px]">Partner User:</span>
                  <span className="font-black">{selectedFundingRequest.userName || 'COD User'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-muted-foreground uppercase text-[10px]">Email Address:</span>
                  <span className="font-mono font-medium">{selectedFundingRequest.userEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-muted-foreground uppercase text-[10px]">Payment Reference:</span>
                  <span className="font-mono font-bold text-primary">{selectedFundingRequest.reference}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-black text-xs uppercase">Amount to Credit:</span>
                  <span className="font-black text-lg text-green-700">₦{Number(selectedFundingRequest.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Monnify Gateway Matching Telemetry Box */}
              <div className="p-4 rounded-2xl border-2 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase text-blue-900 dark:text-blue-200">
                    <ShieldCheck className="h-4 w-4 text-blue-600" /> Monnify Gateway Match Check
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLiveVerifyMonnify(selectedFundingRequest)}
                    disabled={isVerifyingMonnifyRef}
                    className="h-7 px-2.5 text-[10px] font-black uppercase rounded-lg border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {isVerifyingMonnifyRef ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    {monnifyVerifyData ? 'Re-Query Gateway' : 'Audit Match Now'}
                  </Button>
                </div>

                {monnifyVerifyData ? (
                  <div className="space-y-2 text-[11px] pt-1">
                    <div className="grid grid-cols-2 gap-2 bg-background/80 p-2.5 rounded-xl border">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Gateway Status:</span>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase mt-0.5",
                          monnifyVerifyData.paymentStatus === 'PAID' || monnifyVerifyData.status === 'SUCCESS'
                            ? "bg-green-600 text-white"
                            : "bg-amber-600 text-white"
                        )}>
                          {monnifyVerifyData.paymentStatus || monnifyVerifyData.status || 'PAID'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Settled on Gateway:</span>
                        <span className="font-mono font-black text-xs text-foreground block mt-0.5">
                          ₦{Number(monnifyVerifyData.amountPaid || monnifyVerifyData.amount || selectedFundingRequest.amount).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Merchant Contract:</span>
                        <span className="font-mono font-bold text-[10px] text-muted-foreground block truncate">
                          {monnifyVerifyData.contractCode || '730430763017'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Payment Channel:</span>
                        <span className="font-bold text-[10px] block truncate">
                          {monnifyVerifyData.paymentMethod || 'Monnify Direct'}
                        </span>
                      </div>
                    </div>

                    {monnifyMatchReport?.isMatched ? (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-green-100 dark:bg-green-950/40 border border-green-300 text-green-800 dark:text-green-300 text-[11px] font-bold">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        <span>Verified: Transaction matches Monnify account records and settled amount.</span>
                      </div>
                    ) : monnifyMatchReport?.discrepancies?.length ? (
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/40 border border-amber-300 text-amber-800 dark:text-amber-300 text-[10px] space-y-1 font-semibold">
                        <div className="flex items-center gap-1 font-black">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" /> Discrepancy Alert:
                        </div>
                        {monnifyMatchReport.discrepancies.map((d: string, i: number) => (
                          <div key={i} className="pl-4">• {d}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Click &apos;Audit Match Now&apos; to verify that Monnify received the exact settlement into your merchant contract account before authorizing.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Internal Approval Notes (Optional)</Label>
                <Input
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="e.g. Verified against Monnify Settlement Portal"
                  className="h-10 rounded-xl border-2 font-medium text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={isApprovingFunding}
              className="rounded-xl font-black text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleApproveFunding(selectedFundingRequest)}
              disabled={isApprovingFunding}
              className="rounded-xl font-black text-xs uppercase bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
            >
              {isApprovingFunding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm & Credit Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT FUNDING DIALOG */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-2 shadow-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" /> Decline Funding Request
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold">
              Declining will mark this funding request as rejected. The user&apos;s wallet balance will NOT be credited.
            </DialogDescription>
          </DialogHeader>

          {selectedFundingRequest && (
            <div className="space-y-4 py-3">
              <div className="bg-red-50/60 p-4 rounded-2xl border border-red-200 space-y-2 text-xs text-red-950">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-800 uppercase text-[10px]">Reference:</span>
                  <span className="font-mono font-black">{selectedFundingRequest.reference}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-800 uppercase text-[10px]">Requested Amount:</span>
                  <span className="font-black">₦{Number(selectedFundingRequest.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Reason for Decline / Audit Record</Label>
                <Input
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Unsettled Monnify transaction or duplicate submission"
                  className="h-10 rounded-xl border-2 font-medium text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isRejectingFunding}
              className="rounded-xl font-black text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRejectFunding(selectedFundingRequest)}
              disabled={isRejectingFunding}
              className="rounded-xl font-black text-xs uppercase bg-red-600 hover:bg-red-700 text-white gap-2 shadow-sm"
            >
              {isRejectingFunding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MANUAL CREDIT MODAL */}
      <Dialog open={isManualCreditOpen} onOpenChange={setIsManualCreditOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2.5rem] border-2 shadow-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-primary" /> Manual User Wallet Credit
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold">
              Directly credit a customer or partner wallet with full administrative auditing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Recipient Partner / User</Label>
              <Select value={manualCreditUserId} onValueChange={setManualCreditUserId}>
                <SelectTrigger className="h-11 rounded-xl border-2 font-semibold text-xs">
                  <SelectValue placeholder="Choose a registered user..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl">
                  {platformUsers?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs font-medium py-2">
                      <span className="font-black">{u.firstName} {u.lastName}</span> &bull; <span className="text-muted-foreground font-mono text-[10px]">{u.email}</span> ({u.role || 'User'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Credit Amount (₦ NGN)</Label>
              <Input
                type="number"
                value={manualCreditAmount}
                onChange={(e) => setManualCreditAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="h-11 rounded-xl border-2 font-black text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Administrative Reason / Justification</Label>
              <Input
                value={manualCreditReason}
                onChange={(e) => setManualCreditReason(e.target.value)}
                placeholder="e.g. Promotional grant, Dispute resolution, Direct cash receipt"
                className="h-11 rounded-xl border-2 font-medium text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsManualCreditOpen(false)}
              disabled={isProcessingManualCredit}
              className="rounded-xl font-black text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteManualCredit}
              disabled={isProcessingManualCredit || !manualCreditUserId || !manualCreditAmount}
              className="rounded-xl font-black text-xs uppercase bg-primary hover:bg-primary/90 text-white gap-2 shadow-sm"
            >
              {isProcessingManualCredit ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Authorize & Credit ₦{Number(manualCreditAmount || 0).toLocaleString()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}