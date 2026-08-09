
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Bell, 
  LogOut, 
  Loader2, 
  Landmark, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  ShieldAlert,
  Mail,
  Smartphone,
  KeyRound,
  BellRing,
  Wallet,
  Building2,
  Briefcase,
  FileCheck,
  Upload,
  Clock,
  AlertCircle,
  FileText
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { useAuth } from "@/firebase"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { validateBankAccount, getBanks } from "@/actions/monnify"
import { sendTwoFactorCode, verifyTwoFactorCode } from "@/actions/auth-2fa"

/**
 * @fileOverview Hardened Settings Hub for Call on Demand.
 * Optimized for Next.js 15 build stability and high-density mobile fit.
 */

export default function SettingsPage() {
  const { user, isUserLoading: isAuthLoading } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  
  // Bank details
  const [banks, setBanks] = useState<any[]>([])
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isAccountVerified, setIsAccountVerified] = useState(false)
  const [isTesting2FA, setIsTesting2FA] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")

  // 2FA & Notification State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'email' | 'sms'>('email')
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [walletThresholdEnabled, setWalletThresholdEnabled] = useState(false)
  const [walletThreshold, setWalletThreshold] = useState("1000")
  const [newPIN, setNewPIN] = useState("")
  const [confirmPIN, setConfirmPIN] = useState("")
  const [isUpdatingPIN, setIsUpdatingPIN] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  // Company KYC State
  const [businessName, setBusinessName] = useState("CALL ON DEMAND.COM LTD")
  const [registrationType, setRegistrationType] = useState("Limited Liability Company (RC)")
  const [rcNumber, setRcNumber] = useState("")
  const [tin, setTin] = useState("")
  const [incorporationDate, setIncorporationDate] = useState("")
  const [sector, setSector] = useState("E-Commerce, Agency & Multi-Services")
  const [companyAddress, setCompanyAddress] = useState("C5 Ikon Allah Plaza Along MIS Wushishi, Western Bye-Pass Minna Niger State, Nigeria")
  const [directorName, setDirectorName] = useState("")
  const [directorPosition, setDirectorPosition] = useState("Managing Director")
  const [directorBvnNin, setDirectorBvnNin] = useState("")
  const [officialEmail, setOfficialEmail] = useState("altamambcs@callondemandbiz.com")
  const [officialPhone, setOfficialPhone] = useState("")
  const [cacCertificateUrl, setCacCertificateUrl] = useState("")
  const [statusReportUrl, setStatusReportUrl] = useState("")
  const [utilityBillUrl, setUtilityBillUrl] = useState("")
  const [directorIdUrl, setDirectorIdUrl] = useState("")
  const [isSavingCompanyKyc, setIsSavingCompanyKyc] = useState(false)

  useEffect(() => {
    const fetchBanks = async () => {
      const result = await getBanks();
      if (result && result.success) setBanks(result.response || []);
    };
    fetchBanks();
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "")
      setLastName(profile.lastName || "")
      setPhone(profile.phoneNumber || "")
      setBankName(profile.bankName || "")
      setAccountNumber(profile.accountNumber || "")
      setAccountName(profile.accountName || "")
      setTwoFactorEnabled(!!profile.twoFactorEnabled)
      setTwoFactorMethod(profile.twoFactorMethod || 'email')
      setIsAccountVerified(!!profile.bankAccountVerified)
      setPushEnabled(profile.notificationPreferences?.push ?? true)
      setEmailEnabled(profile.notificationPreferences?.email ?? true)
      setWalletThresholdEnabled(!!profile.walletThresholdEnabled)
      setWalletThreshold(profile.walletThreshold !== undefined ? profile.walletThreshold.toString() : "1000")

      if (profile.companyKyc) {
        setBusinessName(profile.companyKyc.businessName || "CALL ON DEMAND.COM LTD")
        setRegistrationType(profile.companyKyc.registrationType || "Limited Liability Company (RC)")
        setRcNumber(profile.companyKyc.rcNumber || "")
        setTin(profile.companyKyc.tin || "")
        setIncorporationDate(profile.companyKyc.incorporationDate || "")
        setSector(profile.companyKyc.sector || "E-Commerce, Agency & Multi-Services")
        setCompanyAddress(profile.companyKyc.address || "C5 Ikon Allah Plaza Along MIS Wushishi, Western Bye-Pass Minna Niger State, Nigeria")
        setDirectorName(profile.companyKyc.directorName || "")
        setDirectorPosition(profile.companyKyc.directorPosition || "Managing Director")
        setDirectorBvnNin(profile.companyKyc.directorBvnNin || "")
        setOfficialEmail(profile.companyKyc.officialEmail || "altamambcs@callondemandbiz.com")
        setOfficialPhone(profile.companyKyc.officialPhone || "")
        setCacCertificateUrl(profile.companyKyc.cacCertificateUrl || "")
        setStatusReportUrl(profile.companyKyc.statusReportUrl || "")
        setUtilityBillUrl(profile.companyKyc.utilityBillUrl || "")
        setDirectorIdUrl(profile.companyKyc.directorIdUrl || "")
      }
    }
  }, [profile]);

  const handleRequestPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      handleNotificationUpdate('push', true);
      toast({ title: "Alerts Authorized" });
    }
  };

  const handleVerifyAccount = async () => {
    if (!accountNumber || accountNumber.length !== 10 || !bankName) {
      toast({ title: "Incomplete Details", variant: "destructive" });
      return;
    }
    const selectedBank = banks.find(b => b.name === bankName);
    if (!selectedBank) return;
    setIsVerifying(true);
    try {
      const result = await validateBankAccount(accountNumber, selectedBank.code);
      if (result.success && result.response) {
        const resolvedName = result.response.accountName;
        setAccountName(resolvedName);
        setIsAccountVerified(true);
        if (profileRef) {
          updateDocumentNonBlocking(profileRef, {
            bankName,
            accountNumber,
            accountName: resolvedName,
            bankAccountVerified: true,
            bankAccountVerifiedAt: new Date().toISOString()
          });
        }
        toast({ title: "Account Verified", description: `Resolved to: ${resolvedName}` });
      } else {
        toast({ title: "Verification Failed", description: result?.error || 'Bank lookup failed.', variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Gateway Error", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggle2FA = (val: boolean) => {
    setTwoFactorEnabled(val);
    if (profileRef) {
      updateDocumentNonBlocking(profileRef, { twoFactorEnabled: val });
      toast({ 
        title: val ? "2FA Enabled" : "2FA Disabled", 
        description: val ? `You will now receive verification codes via ${twoFactorMethod}.` : "Login security reduced." 
      });
    }
  };

  const handleTest2FA = async () => {
    if (!user?.email) return;
    setIsTesting2FA(true);
    const result = await sendTwoFactorCode(user.email, twoFactorMethod);
    if (result.success) {
      toast({ title: "Test Code Sent", description: result.message });
    } else {
      toast({ title: "Test Failed", description: result.message, variant: "destructive" });
    }
    setIsTesting2FA(false);
  };

  const handleVerifyTestCode = async () => {
    if (!user?.email) return;
    setIsVerifyingCode(true);
    const result = await verifyTwoFactorCode(user.email, verificationCode);
    if (result.success) {
      toast({ title: "Verification Successful", description: "2FA method verified." });
      setVerificationCode("");
    } else {
      toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
    }
    setIsVerifyingCode(false);
  };

  const handleUpdate2FAMethod = (val: 'email' | 'sms') => {
    setTwoFactorMethod(val);
    if (profileRef) {
      updateDocumentNonBlocking(profileRef, { twoFactorMethod: val });
      toast({ title: "2FA Protocol Updated", description: `Verification codes will be sent via ${val.toUpperCase()}.` });
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth || !auth.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords Mismatch", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Weak Security Key", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Note: Re-authentication might be required for sensitive operations in Firebase
      // For now, we attempt direct update. If it fails, we inform the user to re-log.
      await (auth.currentUser as any).updatePassword(newPassword);
      toast({ title: "Security Key Updated", description: "Your login credentials have been refreshed." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        toast({ 
          title: "Session Expired", 
          description: "Please sign out and sign back in to change your password for security.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Update Failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateProfile = () => {
    if (!profileRef) return;
    updateDocumentNonBlocking(profileRef, { firstName, lastName, phoneNumber: phone });
    toast({ title: "Profile Updated" });
  };

  const handleNotificationUpdate = (type: 'push' | 'email', value: boolean) => {
    if (!profileRef) return;
    const prefs = {
      push: type === 'push' ? value : pushEnabled,
      email: type === 'email' ? value : emailEnabled,
    };
    if (type === 'push') setPushEnabled(value);
    if (type === 'email') setEmailEnabled(value);
    updateDocumentNonBlocking(profileRef, { notificationPreferences: prefs });
    toast({ title: "Alerts Updated" });
  };

  const handleWalletThresholdToggle = (val: boolean) => {
    setWalletThresholdEnabled(val);
    if (profileRef) {
      updateDocumentNonBlocking(profileRef, { walletThresholdEnabled: val });
      toast({ 
        title: val ? "Balance Alerts Activated" : "Balance Alerts Deactivated",
        description: val ? `You'll be alerted when your wallet balance goes below ₦${Number(walletThreshold).toLocaleString()}.` : "Wallet balance threshold alerts are now disabled."
      });
    }
  };

  const handleSaveWalletThreshold = () => {
    if (!profileRef) return;
    const thresholdNum = Number(walletThreshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      toast({ title: "Invalid Limit", description: "Threshold must be a valid positive number.", variant: "destructive" });
      return;
    }
    updateDocumentNonBlocking(profileRef, { walletThreshold: thresholdNum });
    toast({ 
      title: "Threshold Updated", 
      description: `You will be alerted if your wallet balance drops below ₦${thresholdNum.toLocaleString()}` 
    });
  };

  const handleSaveCompanyKyc = () => {
    if (!profileRef) return;
    if (!businessName.trim() || !rcNumber.trim()) {
      toast({ title: "Incomplete Corporate Records", description: "Business Legal Name and RC/BN Registration Number are required.", variant: "destructive" });
      return;
    }

    setIsSavingCompanyKyc(true);
    const companyKycData = {
      businessName,
      registrationType,
      rcNumber,
      tin,
      incorporationDate,
      sector,
      address: companyAddress,
      directorName,
      directorPosition,
      directorBvnNin,
      officialEmail,
      officialPhone,
      cacCertificateUrl,
      statusReportUrl,
      utilityBillUrl,
      directorIdUrl,
      status: profile?.companyKyc?.status === 'Verified' ? 'Verified' : 'Pending',
      submittedAt: new Date().toISOString()
    };

    updateDocumentNonBlocking(profileRef, { companyKyc: companyKycData });
    toast({
      title: "Company Verification Updated",
      description: "Your corporate compliance filing has been submitted for review."
    });
    setIsSavingCompanyKyc(false);
  };

  const handleSignOut = async () => {
    await signOut(auth!);
    router.push("/login");
  };

  if (isAuthLoading || isProfileLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto px-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tighter">Account Settings</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {twoFactorEnabled && <Badge className="bg-primary text-white border-none px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><ShieldCheck className="h-3 w-3" /> 2FA Active</Badge>}
            {profile?.identityVerified ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>
            ) : (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><ShieldAlert className="h-3 w-3" /> Unverified</Badge>
            )}
            {profile?.companyKyc?.status === 'Verified' ? (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><Building2 className="h-3 w-3" /> Corporate Verified</Badge>
            ) : profile?.companyKyc?.status === 'Pending' ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><Clock className="h-3 w-3" /> Company KYC Review</Badge>
            ) : profile?.companyKyc?.status === 'Rejected' ? (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><AlertCircle className="h-3 w-3" /> Company KYC Action Needed</Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 px-2">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 bg-muted/50 p-1 rounded-2xl h-12 flex-wrap h-auto gap-1 w-full overflow-x-auto no-scrollbar">
            <TabsTrigger value="profile" className="flex-1 min-w-[90px] gap-2 rounded-xl h-10 font-bold"><User className="h-4 w-4" /> Personal</TabsTrigger>
            <TabsTrigger value="company" className="flex-1 min-w-[120px] gap-2 rounded-xl h-10 font-bold"><Building2 className="h-4 w-4" /> Company KYC</TabsTrigger>
            <TabsTrigger value="payout" className="flex-1 min-w-[90px] gap-2 rounded-xl h-10 font-bold"><Landmark className="h-4 w-4" /> Payouts</TabsTrigger>
            <TabsTrigger value="security" className="flex-1 min-w-[90px] gap-2 rounded-xl h-10 font-bold"><Lock className="h-4 w-4" /> Security</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 min-w-[90px] gap-2 rounded-xl h-10 font-bold"><Bell className="h-4 w-4" /> Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 p-6 border-b">
                <CardTitle className="text-lg font-black uppercase tracking-tighter">Identity Baseline</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">First Name</label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11 rounded-xl border-2 font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Last Name</label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11 rounded-xl border-2 font-bold" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Recipient ID (Phone)</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl border-2 font-black tracking-widest" /></div>
                <Button onClick={handleUpdateProfile} className="h-11 font-black px-10 rounded-xl bg-primary w-full sm:w-auto">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Corporate Identity & KYC
                  </CardTitle>
                  <CardDescription className="text-xs font-medium mt-1">
                    Provide legal entity registration and tax details to unlock corporate partner features.
                  </CardDescription>
                </div>
                {profile?.companyKyc?.status === 'Verified' && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1.5 font-black uppercase text-[9px] gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Compliance Verified
                  </Badge>
                )}
                {profile?.companyKyc?.status === 'Pending' && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1.5 font-black uppercase text-[9px] gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Review Pending
                  </Badge>
                )}
                {profile?.companyKyc?.status === 'Rejected' && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1.5 font-black uppercase text-[9px] gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Action Required
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {profile?.companyKyc?.status === 'Rejected' && profile?.companyKyc?.rejectionReason && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black uppercase tracking-wider text-[10px] text-red-600">Compliance Officer Feedback</div>
                      <p className="mt-1">{profile.companyKyc.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Section 1: Business Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> 1. Business Legal Entity
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Company / Business Name *</label>
                      <Input 
                        value={businessName} 
                        onChange={(e) => setBusinessName(e.target.value)} 
                        placeholder="e.g. Call On Demand Logistics Ltd" 
                        className="h-11 rounded-xl border-2 font-bold text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Registration Structure *</label>
                      <Select value={registrationType} onValueChange={setRegistrationType}>
                        <SelectTrigger className="h-11 rounded-xl border-2 font-bold text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Limited Liability Company (RC)" className="text-xs font-bold">Limited Liability Company (RC)</SelectItem>
                          <SelectItem value="Business Name (BN)" className="text-xs font-bold">Business Name / Enterprise (BN)</SelectItem>
                          <SelectItem value="Incorporated Trustee (IT)" className="text-xs font-bold">Incorporated Trustee (IT)</SelectItem>
                          <SelectItem value="Sole Proprietorship" className="text-xs font-bold">Sole Proprietorship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">RC / BN Number *</label>
                      <Input 
                        value={rcNumber} 
                        onChange={(e) => setRcNumber(e.target.value)} 
                        placeholder="e.g. RC-1928374" 
                        className="h-11 rounded-xl border-2 font-black text-xs uppercase" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Tax ID Number (TIN)</label>
                      <Input 
                        value={tin} 
                        onChange={(e) => setTin(e.target.value)} 
                        placeholder="e.g. 29384756-0001" 
                        className="h-11 rounded-xl border-2 font-black text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Incorporation Date</label>
                      <Input 
                        type="date" 
                        value={incorporationDate} 
                        onChange={(e) => setIncorporationDate(e.target.value)} 
                        className="h-11 rounded-xl border-2 font-bold text-xs" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Industry Sector</label>
                    <Select value={sector} onValueChange={setSector}>
                      <SelectTrigger className="h-11 rounded-xl border-2 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="E-Commerce, Agency & Multi-Services" className="text-xs font-bold">E-Commerce, Agency & Multi-Services (Mobile Food, Laundry, Logistics, Utility Bills, Airtime/Data)</SelectItem>
                        <SelectItem value="Logistics & Freight" className="text-xs font-bold">Logistics & Freight</SelectItem>
                        <SelectItem value="E-Commerce & Retail" className="text-xs font-bold">E-Commerce & Retail</SelectItem>
                        <SelectItem value="Hospitality & Real Estate" className="text-xs font-bold">Hospitality & Real Estate</SelectItem>
                        <SelectItem value="Financial Services" className="text-xs font-bold">Financial Services</SelectItem>
                        <SelectItem value="General Commerce" className="text-xs font-bold">General Commerce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Section 2: Contact & Address */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> 2. Corporate Contact & Address
                  </h4>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Registered Address</label>
                    <Input 
                      value={companyAddress} 
                      onChange={(e) => setCompanyAddress(e.target.value)} 
                      placeholder="Street, City, State" 
                      className="h-11 rounded-xl border-2 font-bold text-xs" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Official Corporate Email</label>
                      <Input 
                        type="email" 
                        value={officialEmail} 
                        onChange={(e) => setOfficialEmail(e.target.value)} 
                        placeholder="corporate@company.com" 
                        className="h-11 rounded-xl border-2 font-bold text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Official Phone Number</label>
                      <Input 
                        value={officialPhone} 
                        onChange={(e) => setOfficialPhone(e.target.value)} 
                        placeholder="+234 800 000 0000" 
                        className="h-11 rounded-xl border-2 font-bold text-xs" 
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Executive Director / Representative */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <User className="h-4 w-4" /> 3. Principal Director / Representative
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Director Full Name</label>
                      <Input 
                        value={directorName} 
                        onChange={(e) => setDirectorName(e.target.value)} 
                        placeholder="Full Name" 
                        className="h-11 rounded-xl border-2 font-bold text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Executive Title</label>
                      <Input 
                        value={directorPosition} 
                        onChange={(e) => setDirectorPosition(e.target.value)} 
                        placeholder="e.g. Managing Director" 
                        className="h-11 rounded-xl border-2 font-bold text-xs" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Director BVN / NIN</label>
                      <Input 
                        value={directorBvnNin} 
                        onChange={(e) => setDirectorBvnNin(e.target.value)} 
                        placeholder="11-Digit Identity No." 
                        maxLength={11}
                        className="h-11 rounded-xl border-2 font-black text-xs tracking-widest" 
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Compliance Verification Documents */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4" /> 4. Corporate Records & Document Links
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">CAC Certificate URL / Document Link</label>
                      <Input 
                        value={cacCertificateUrl} 
                        onChange={(e) => setCacCertificateUrl(e.target.value)} 
                        placeholder="https://drive.google.com/..." 
                        className="h-11 rounded-xl border-2 font-mono text-[11px]" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">CAC Status Report / Form CAC 1.1</label>
                      <Input 
                        value={statusReportUrl} 
                        onChange={(e) => setStatusReportUrl(e.target.value)} 
                        placeholder="https://drive.google.com/..." 
                        className="h-11 rounded-xl border-2 font-mono text-[11px]" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Proof of Business Address (Utility Bill)</label>
                      <Input 
                        value={utilityBillUrl} 
                        onChange={(e) => setUtilityBillUrl(e.target.value)} 
                        placeholder="https://drive.google.com/..." 
                        className="h-11 rounded-xl border-2 font-mono text-[11px]" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Director Government ID</label>
                      <Input 
                        value={directorIdUrl} 
                        onChange={(e) => setDirectorIdUrl(e.target.value)} 
                        placeholder="https://drive.google.com/..." 
                        className="h-11 rounded-xl border-2 font-mono text-[11px]" 
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveCompanyKyc} 
                  disabled={isSavingCompanyKyc} 
                  className="h-12 font-black px-10 rounded-xl bg-primary w-full sm:w-auto uppercase text-xs gap-2"
                >
                  {isSavingCompanyKyc ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                  Submit Company Verification
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payout" className="space-y-6">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-accent/5 p-6 border-b">
                <CardTitle className="text-lg font-black flex items-center gap-2 text-accent uppercase tracking-tighter"><Landmark className="h-5 w-5" /> Bank Payouts</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Financial Institution</label><Select value={bankName} onValueChange={(v) => { setBankName(v); setIsAccountVerified(false); }}><SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue placeholder="Select Bank" /></SelectTrigger><SelectContent className="rounded-xl max-h-60">{banks.map(bank => <SelectItem key={bank.code} value={bank.name} className="font-bold py-2.5">{bank.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Number (10 Digits)</label><div className="flex gap-2"><Input value={accountNumber} maxLength={10} onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '')); setIsAccountVerified(false); }} className="h-12 rounded-xl border-2 font-black text-xl tracking-widest flex-1" /><Button variant="secondary" onClick={handleVerifyAccount} disabled={isVerifying || accountNumber.length !== 10 || !bankName} className="h-12 px-6 rounded-xl font-black">{isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}</Button></div></div>
                  {accountName && (
                    <div className="bg-accent/5 p-4 rounded-xl border-2 border-dashed border-accent/20 animate-in zoom-in-95">
                      <p className="text-[8px] font-black uppercase text-accent tracking-widest">Verified Beneficiary</p>
                      <p className="font-black text-lg text-foreground mt-1 uppercase">{accountName}</p>
                      {isAccountVerified && <div className="flex items-center gap-1.5 mt-2 text-green-600 font-black text-[9px] uppercase"><CheckCircle2 className="h-3.5 w-3.5" /> Handshake Secure</div>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 p-6 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter"><KeyRound className="h-5 w-5 text-primary" /> Multi-Factor Auth</CardTitle>
                  <Switch checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} />
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Protect your account with a secondary verification layer. When enabled, a 6-digit code will be required during login.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Verification Method</label>
                    <Select value={twoFactorMethod} onValueChange={(v: any) => handleUpdate2FAMethod(v)}>
                      <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="email" className="font-bold py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>Email Verification</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="sms" className="font-bold py-3">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            <span>SMS Verification</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex gap-3 text-xs">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-black uppercase text-[10px]">Method Verification</p>
                      <p className="text-muted-foreground mt-1 font-medium leading-relaxed">
                        Test your chosen 2FA method by sending a verification code.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={handleTest2FA} disabled={isTesting2FA}>
                          {isTesting2FA ? <Loader2 className="h-3 w-3 animate-spin"/> : "Send Test Code"}
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Enter Code" className="h-9 rounded-lg" />
                        <Button size="sm" onClick={handleVerifyTestCode} disabled={isVerifyingCode || !verificationCode}>
                          {isVerifyingCode ? <Loader2 className="h-3 w-3 animate-spin"/> : "Verify Code"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 p-6 border-b">
                <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter"><Lock className="h-5 w-5" /> Security Key</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">New Password</label>
                     <Input 
                       type="password" 
                       value={newPassword} 
                       onChange={(e) => setNewPassword(e.target.value)} 
                       className="h-11 rounded-xl border-2 font-bold" 
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Confirm New Password</label>
                     <Input 
                       type="password" 
                       value={confirmPassword} 
                       onChange={(e) => setConfirmPassword(e.target.value)} 
                       className="h-11 rounded-xl border-2 font-bold" 
                     />
                   </div>
                </div>
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={isUpdatingPassword || !newPassword} 
                  className="w-full h-12 bg-card hover:bg-muted border-2 font-black rounded-xl uppercase text-[10px] border-primary/20 text-primary"
                >
                  {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Refresh Security Key"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 p-6 border-b">
                <CardTitle className="text-lg font-black flex items-center gap-2 text-accent uppercase tracking-tighter"><BellRing className="h-5 w-5" /> Hub Alerts</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-2xl bg-accent/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Smartphone className="h-5 w-5" /></div>
                    <div className="space-y-0.5">
                      <div className="font-black text-sm uppercase">Push Notifications</div>
                      <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">OS Status: {notificationPermission}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch checked={pushEnabled} onCheckedChange={(val) => handleNotificationUpdate('push', val)} />
                    {notificationPermission !== 'granted' && <Button size="sm" variant="outline" onClick={handleRequestPush} className="h-7 rounded-lg text-[8px] font-black uppercase">Authorize</Button>}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-2xl bg-accent/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Mail className="h-5 w-5" /></div>
                    <div className="space-y-0.5">
                      <div className="font-black text-sm uppercase">Email Reports</div>
                      <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Weekly audit handshake</div>
                    </div>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={(val) => handleNotificationUpdate('email', val)} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 p-6 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-black flex items-center gap-2 text-primary uppercase tracking-tighter">
                  <Wallet className="h-5 w-5 text-primary" /> Wallet Guard
                </CardTitle>
                <Switch checked={walletThresholdEnabled} onCheckedChange={handleWalletThresholdToggle} />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  Set a minimum balance threshold. If your active wallet balance drops below this amount, we will alert you dynamically across the application.
                </p>
                {walletThresholdEnabled && (
                  <div className="space-y-3 pt-2 animate-in fade-in-50 duration-200">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Minimum Balance Threshold (₦)</label>
                    <div className="flex gap-2">
                      <Input 
                        value={walletThreshold} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setWalletThreshold(val);
                        }} 
                        placeholder="1000" 
                        className="h-12 rounded-xl border-2 font-black text-lg tracking-widest flex-1" 
                      />
                      <Button onClick={handleSaveWalletThreshold} className="h-12 px-6 rounded-xl font-black bg-primary text-white hover:bg-primary/90">
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="pt-4 border-t border-dashed">
          <Button variant="ghost" onClick={handleSignOut} className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-black uppercase text-[10px] tracking-widest">Terminate Account Session</Button>
        </div>
      </div>
    </div>
  )
}
