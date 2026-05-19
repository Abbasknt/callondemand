
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
  BellRing
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
  const [newPIN, setNewPIN] = useState("")
  const [confirmPIN, setConfirmPIN] = useState("")
  const [isUpdatingPIN, setIsUpdatingPIN] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

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
          <div className="flex items-center gap-2">
            {twoFactorEnabled && <Badge className="bg-primary text-white border-none px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><ShieldCheck className="h-3 w-3" /> 2FA Active</Badge>}
            {profile?.identityVerified ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>
            ) : (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1 gap-1.5 uppercase font-black text-[10px]"><ShieldAlert className="h-3 w-3" /> Unverified</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 px-2">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 bg-muted/50 p-1 rounded-2xl h-12 flex-wrap h-auto gap-1 w-full overflow-x-auto no-scrollbar">
            <TabsTrigger value="profile" className="flex-1 min-w-[100px] gap-2 rounded-xl h-10 font-bold"><User className="h-4 w-4" /> Personal</TabsTrigger>
            <TabsTrigger value="payout" className="flex-1 min-w-[100px] gap-2 rounded-xl h-10 font-bold"><Landmark className="h-4 w-4" /> Payouts</TabsTrigger>
            <TabsTrigger value="security" className="flex-1 min-w-[100px] gap-2 rounded-xl h-10 font-bold"><Lock className="h-4 w-4" /> Security</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 min-w-[100px] gap-2 rounded-xl h-10 font-bold"><Bell className="h-4 w-4" /> Alerts</TabsTrigger>
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
          </TabsContent>
        </Tabs>
        
        <div className="pt-4 border-t border-dashed">
          <Button variant="ghost" onClick={handleSignOut} className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-black uppercase text-[10px] tracking-widest">Terminate Account Session</Button>
        </div>
      </div>
    </div>
  )
}
