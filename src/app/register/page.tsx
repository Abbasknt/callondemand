"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, Mail, User, Phone, Lock, ShieldCheck, AlertCircle } from "lucide-react"
import { useAuth, useFirestore, initiateGoogleSignInPopup, getDocumentSafe } from "@/firebase"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, getRedirectResult } from "firebase/auth"
import { doc, collection } from "firebase/firestore"
import { setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { BrandLogo } from "@/components/brand-logo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

const MASTER_ADMIN_EMAIL = 'tatatradeandinnovation@gmail.com';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const handleProfileSync = useCallback(async (user: any) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDocumentSafe(userDocRef);
    
    if (userSnap.exists()) {
      toast({ title: "Welcome back!", description: "Profile recognized via Google." });
      router.push("/dashboard");
    } else {
      // Check for Admin Invitations
      let assignedRole = "Customer";
      let assignedUnit = "General";
      let fName = '';
      let lName = '';

      try {
        const inviteRef = doc(firestore, 'invitations', user.email.toLowerCase());
        const inviteSnap = await getDocumentSafe(inviteRef);
        if (inviteSnap.exists()) {
          const inviteData = inviteSnap.data();
          assignedRole = inviteData.role || "Customer";
          assignedUnit = inviteData.assignedUnit || "General";
          fName = inviteData.firstName || '';
          lName = inviteData.lastName || '';
          toast({ title: "Invitation Recognized", description: `Permissions pre-configured as ${assignedRole}.` });
        }
      } catch (e) {
        console.error("Invite Sync Failed:", e);
      }

      // Provision new profile
      const [googleFName = '', googleLName = ''] = (user.displayName || '').split(' ');
      await setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        firstName: fName || googleFName,
        lastName: lName || googleLName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        role: assignedRole,
        assignedUnit: assignedUnit,
        status: "Active",
        createdAt: new Date().toISOString(),
        referralCode: `COD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      }, { merge: true });

      // If they are admin, sync super_admins
      if (assignedRole === 'Admin') {
        const superAdminRef = doc(firestore, 'super_admins', user.uid);
        await setDocumentNonBlocking(superAdminRef, { 
          id: user.uid, 
          email: user.email, 
          grantedAt: new Date().toISOString() 
        }, { merge: true });
      }
      
      // Provision Wallet
      const walletRef = doc(firestore, "users", user.uid, "wallet", "default");
      await setDocumentNonBlocking(walletRef, {
        id: "default",
        userId: user.uid,
        balance: 500, // Welcome bonus
        currency: "NGN",
        pinSet: false
      }, { merge: true });

      toast({ title: "Partner Account Secured", description: "Provisioned via Google authorization." });
      router.push("/onboarding/survey");
    }
  }, [firestore, router, toast]);

  // Handle Google Sign-In Redirect Result (Fallback)
  useEffect(() => {
    if (!auth || !firestore) return;
    
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        setLoading(true);
        await handleProfileSync(result.user);
      }
    }).catch((err) => {
      console.error("Google Auth Error:", err);
    }).finally(() => setLoading(false));
  }, [auth, firestore, router, toast, handleProfileSync]);

  const handleGoogleSignUp = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const result = await initiateGoogleSignInPopup(auth);
      if (result?.user) {
        await handleProfileSync(result.user);
      }
    } catch (err: any) {
      console.error("Google Popup Auth Error:", err);
      toast({ title: "Registration Failed", description: "Google authorization was rejected.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!auth) {
      toast({ 
        title: "Service Initializing", 
        description: "Authentication service is initializing. Please try again or sign up with Google.", 
        variant: "destructive" 
      });
      return;
    }

    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      toast({ title: "Incomplete Details", description: "All fields are required.", variant: "destructive" });
      return;
    }

    const phoneRegex = /^0\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast({ title: "Invalid Phone ID", description: "Enter a valid 11-digit Nigerian number.", variant: "destructive" });
      return;
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await sendEmailVerification(user);
      await updateProfile(user, { displayName: `${firstName} ${lastName}` });

      const isMasterEmail = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
      
      // Check for Admin Invitations
      let assignedRole = isMasterEmail ? "Admin" : "Customer";
      let assignedUnit = "General";

      try {
        const inviteRef = doc(firestore, 'invitations', email.toLowerCase());
        const inviteSnap = await getDocumentSafe(inviteRef);
        if (inviteSnap.exists()) {
          const inviteData = inviteSnap.data();
          assignedRole = inviteData.role || assignedRole;
          assignedUnit = inviteData.assignedUnit || "General";
          toast({ title: "Authority Recognized", description: `Permissions synchronized for ${assignedRole} status.` });
        }
      } catch (e) {
        console.error("Invite Sync Failed:", e);
      }

      const userDocRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        firstName,
        lastName,
        email,
        phoneNumber,
        role: assignedRole,
        assignedUnit: assignedUnit,
        status: "Active",
        identityVerified: isMasterEmail || assignedRole === 'Admin', 
        createdAt: new Date().toISOString(),
        referralCode: `COD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      }, { merge: true });

      // Auto-provision Super Admin doc if admin
      if (assignedRole === 'Admin') {
        setDocumentNonBlocking(doc(firestore, 'super_admins', user.uid), {
          id: user.uid,
          email: user.email,
          grantedAt: new Date().toISOString(),
          role: 'SuperAdmin'
        }, { merge: true });
      }

      const welcomeBonus = isMasterEmail ? 5000 : 500;
      const walletRef = doc(firestore, "users", user.uid, "wallet", "default");
      setDocumentNonBlocking(walletRef, {
        id: "default",
        userId: user.uid,
        balance: welcomeBonus,
        currency: "NGN",
        pinSet: false
      }, { merge: true });

      addDocumentNonBlocking(collection(walletRef, 'transactions'), {
        type: 'Deposit',
        amount: welcomeBonus,
        description: isMasterEmail ? 'Master Admin Allocation' : 'New Partner Welcome Bonus',
        transactionDate: new Date().toISOString(),
        status: 'Completed',
        reference: `WELCOME-${user.uid.slice(0, 6).toUpperCase()}`
      });

      toast({ 
        title: isMasterEmail ? "Master Authorized" : "Welcome to COD!", 
        description: `Account secured with a ₦${welcomeBonus.toLocaleString()} bonus.` 
      });
      router.push("/onboarding/survey")
    } catch (err: any) {
      console.error("Registration Auth Error:", err);
      const code = err?.code || 'unknown';
      let message = err.message || "Registration failed.";
      
      if (code === 'auth/email-already-in-use') {
        message = "This email is already registered. Try logging in or use a different account.";
      } else if (code === 'auth/weak-password') {
        message = "Security risk: Password too weak. Use at least 6 characters with mixed symbols.";
      } else if (code === 'auth/invalid-credential' || code === 'auth/operation-not-allowed') {
        message = "Identity validation failed. If using Email/Password registration, please ensure Email/Password provider is enabled in your Firebase Console (Authentication > Sign-in method). Alternatively, you can register using 'Sign up with Google'.";
      }

      setError(message);
      toast({ title: "Registration Rejected", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary rounded-[3rem] overflow-hidden bg-card border-none">
        <CardHeader className="space-y-1 text-center pt-12">
          <div className="flex justify-center mb-6">
            <BrandLogo iconOnly className="h-16 w-16" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter">Join the Ecosystem</CardTitle>
          <CardDescription className="text-sm font-medium">Create your unified COD lifestyle profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8">
          {error && (
            <Alert variant="destructive" className="rounded-2xl border-2 bg-destructive/5 py-4">
              <AlertCircle className="h-5 w-5" />
              <div className="space-y-1">
                <AlertTitle className="text-xs font-black uppercase tracking-widest">Protocol Rejected</AlertTitle>
                <AlertDescription className="text-[11px] font-bold leading-tight opacity-90">{error}</AlertDescription>
              </div>
            </Alert>
          )}

          <Button 
            onClick={handleGoogleSignUp} 
            variant="outline" 
            className="w-full h-14 rounded-2xl border-2 gap-3 font-black text-sm uppercase transition-all active:scale-95"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c1.08-1.45 2.71-3.5 3.08-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Sign up with Google
          </Button>

          <div className="flex items-center gap-4 py-2">
            <Separator className="flex-1" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">or use email</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">First Name</label>
                <input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="flex h-12 w-full rounded-2xl border-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none bg-background transition-all font-bold" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Last Name</label>
                <input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} className="flex h-12 w-full rounded-2xl border-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none bg-background transition-all font-bold" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Primary Email</label>
              <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex h-12 w-full rounded-2xl border-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none bg-background transition-all" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Recipient ID (Phone)</label>
              <input type="tel" placeholder="080..." value={phoneNumber} maxLength={11} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} className="flex h-12 w-full rounded-2xl border-2 px-3 text-sm font-black tracking-widest focus:ring-2 focus:ring-primary outline-none bg-background transition-all" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Security Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="flex h-12 w-full rounded-2xl border-2 px-3 pr-10 text-sm focus:ring-2 focus:ring-primary outline-none bg-background transition-all font-bold" required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-xl font-black rounded-[2rem] shadow-xl shadow-primary/20 gap-2 mt-4" disabled={loading}>
              {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <><ShieldCheck className="h-6 w-6" /> Start Living on Demand</>}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 px-8 pb-12 mt-4">
          <div className="text-sm text-center font-medium">
            Already a COD Partner?{" "}
            <Link href="/login" className="text-primary font-black hover:underline">Sign In</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}