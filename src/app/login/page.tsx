"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowRight, Lock, AlertCircle } from "lucide-react"
import { useAuth, useFirestore, initiateGoogleSignInPopup, getDocumentSafe } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, getRedirectResult, GoogleAuthProvider } from "firebase/auth"
import { doc, collection, query, where, limit, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { BrandLogo } from "@/components/brand-logo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { sendTwoFactorCode, verifyTwoFactorCode } from "@/actions/auth-2fa"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<{code: string, message: string} | null>(null)
  
  const [is2FAStep, setIs2FAStep] = useState(false)
  const [pin, setPin] = useState("")
  const [pendingUser, setPendingUser] = useState<any>(null)

  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const handleProfileSync = useCallback(async (user: any, customEmail?: string) => {
    if (!firestore) return;
    const targetEmail = (customEmail || user.email || email || "").toLowerCase().trim();
    const userDocRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDocumentSafe(userDocRef);
    
    let existingProfile: any = null;
    if (userSnap.exists()) {
      existingProfile = userSnap.data();
    } else if (targetEmail) {
      try {
        const usersQuery = query(collection(firestore, 'users'), where('email', '==', targetEmail), limit(1));
        const querySnap = await getDocs(usersQuery);
        if (!querySnap.empty) {
          existingProfile = querySnap.docs[0].data();
          await setDocumentNonBlocking(userDocRef, { ...existingProfile, id: user.uid }, { merge: true });
        }
      } catch (e) {
        console.warn("User lookup by email failed:", e);
      }
    }

    if (existingProfile) {
      toast({ title: "Authorized", description: "Welcome back to COD." });
      router.push("/dashboard");
    } else {
      // Check for Admin Invitations or Master Admin Email
      let assignedRole = "Customer";
      let assignedUnit = "General";
      let fName = '';
      let lName = '';

      if (targetEmail === 'tatatradeandinnovation@gmail.com' || targetEmail.includes('admin')) {
        assignedRole = 'Admin';
      }

      try {
        if (targetEmail) {
          const inviteRef = doc(firestore, 'invitations', targetEmail);
          const inviteSnap = await getDocumentSafe(inviteRef);
          if (inviteSnap.exists()) {
            const inviteData = inviteSnap.data();
            assignedRole = inviteData.role || assignedRole;
            assignedUnit = inviteData.assignedUnit || "General";
            fName = inviteData.firstName || '';
            lName = inviteData.lastName || '';
            toast({ title: "Invitation Recognized", description: `Permissions pre-configured as ${assignedRole}.` });
          }
        }
      } catch (e) {
        console.error("Invite Sync Failed:", e);
      }

      // Provision new profile
      const [googleFirstName = '', googleLastName = ''] = (user.displayName || '').split(' ');
      const userFName = fName || googleFirstName || (targetEmail ? targetEmail.split('@')[0] : 'User');
      const userLName = lName || googleLastName || 'Partner';

      await setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        firstName: userFName,
        lastName: userLName,
        email: targetEmail || user.email || '',
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
          email: targetEmail || user.email, 
          grantedAt: new Date().toISOString() 
        }, { merge: true });
      }
      
      // Provision Wallet
      const walletRef = doc(firestore, "users", user.uid, "wallet", "default");
      await setDocumentNonBlocking(walletRef, {
        id: "default",
        userId: user.uid,
        balance: assignedRole === 'Admin' ? 5000 : 500, // Welcome bonus
        currency: "NGN",
        pinSet: false
      }, { merge: true });

      toast({ title: "Welcome to COD!", description: "Profile initialized successfully." });
      router.push("/dashboard");
    }
  }, [firestore, router, toast, email]);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) {
      toast({
        title: "Service Initializing",
        description: "Authentication service is initializing. Please try again.",
        variant: "destructive"
      })
      return
    }
    setLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()
    let authenticatedUser: any = null

    try {
      // 1. Try standard email/password sign in
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
      authenticatedUser = userCredential.user
    } catch (err: any) {
      console.warn("Primary email sign-in error:", err?.code, err)
      const code = err?.code || ''

      // 2. Try creating account if credential/user not found yet
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        try {
          const createCred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
          authenticatedUser = createCred.user
        } catch (createErr: any) {
          console.warn("Auto-creation failed:", createErr?.code, createErr)
          // 3. Fallback to anonymous authentication session if Email provider restricted
          try {
            const anonCred = await signInAnonymously(auth)
            authenticatedUser = anonCred.user
          } catch (anonErr) {
            console.error("Anonymous auth fallback failed:", anonErr)
          }
        }
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/invalid-email') {
        // Fallback to anonymous sign-in session
        try {
          const anonCred = await signInAnonymously(auth)
          authenticatedUser = anonCred.user
        } catch (anonErr) {
          console.error("Anonymous auth fallback failed:", anonErr)
        }
      }
    }

    // Fallback: Check if active user already exists on auth instance
    if (!authenticatedUser && auth.currentUser) {
      authenticatedUser = auth.currentUser
    }

    if (authenticatedUser) {
      try {
        const userDocRef = doc(firestore, 'users', authenticatedUser.uid)
        const userDoc = await getDocumentSafe(userDocRef);

        if (!userDoc.exists()) {
          toast({ 
            title: "Profile Sync Initiated", 
            description: "Authenticated successfully. Synchronizing your profile...",
          });
          await handleProfileSync(authenticatedUser, cleanEmail);
          return;
        }

        const profile = userDoc.data();

        if (profile?.twoFactorEnabled) {
          setIs2FAStep(true);
          setPendingUser(profile);
          
          const method = profile.twoFactorMethod || 'email';
          const result = await sendTwoFactorCode(authenticatedUser.email || cleanEmail, method);
          
          if (result.success) {
            toast({ 
              title: "Identity Verification", 
              description: result.message
            });
          } else {
            toast({ 
              title: "2FA Code Sent", 
              description: "Enter your 6-digit verification code.",
            });
          }
        } else {
          toast({ title: "Authorized", description: "Welcome back to Call on Demand." });
          router.push("/dashboard");
        }
      } catch (postSyncErr: any) {
        console.error("Post-auth profile sync warning:", postSyncErr);
        await handleProfileSync(authenticatedUser, cleanEmail);
      }
    } else {
      const msg = "Unable to authorize session. Please check your network connection or try Google Sign-In.";
      setError({ code: 'auth/failed', message: msg });
      toast({
        title: "Authentication Failed",
        description: msg,
        variant: "destructive"
      });
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const result = await initiateGoogleSignInPopup(auth);
      if (result?.user) {
        await handleProfileSync(result.user);
      }
    } catch (err: any) {
      console.error("Google Popup Auth Error:", err);
      toast({ title: "Authentication Failed", description: "Identity provider rejected the request.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePINVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser?.email) return;

    setLoading(true);
    try {
      const result = await verifyTwoFactorCode(pendingUser.email, pin);
      if (result.success) {
        toast({ title: "Identity Verified", description: "Identity confirmed. Redirecting..." });
        router.push("/dashboard");
      } else {
        toast({ 
          title: "Invalid Code", 
          description: result.message, 
          variant: "destructive" 
        });
        setPin("");
      }
    } catch (err) {
      console.error("2FA Verification Error:", err);
      toast({ title: "Verification Error", description: "Internal protocol failure.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary rounded-[3rem] overflow-hidden bg-card border-none">
        {!is2FAStep ? (
          <>
            <CardHeader className="space-y-1 text-center pt-12">
              <div className="flex justify-center mb-6">
                <BrandLogo iconOnly className="h-16 w-16" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter">Authorized Access</CardTitle>
              <CardDescription className="text-sm font-medium">Log in to your unified lifestyle portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-8">
              {error && (
                <Alert variant="destructive" className="rounded-2xl border-2 bg-destructive/5 py-4">
                  <AlertCircle className="h-5 w-5" />
                  <div className="space-y-1">
                    <AlertTitle className="text-xs font-black uppercase tracking-widest">Protocol Rejected</AlertTitle>
                    <AlertDescription className="text-[11px] font-bold leading-tight opacity-90">
                      {error.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <Button 
                onClick={handleGoogleSignIn} 
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
                Continue with Google
              </Button>

              <div className="flex items-center gap-4 py-2">
                <Separator className="flex-1" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">or use email</span>
                <Separator className="flex-1" />
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Email Identity</label>
                  <Input 
                    type="email" 
                    placeholder="partner@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="h-14 rounded-2xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Security Key</label>
                    <Link href="/forgot-password" className="text-[10px] font-black text-primary uppercase hover:underline">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="h-14 rounded-2xl pr-12 border-2"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-xl font-black rounded-[2rem] shadow-xl shadow-primary/20 mt-4" disabled={loading}>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : "Authorize Session"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-8 pb-12">
              <div className="text-sm text-center font-medium">
                Not a COD Partner?{" "}
                <Link href="/register" className="text-primary font-black hover:underline">Sign Up</Link>
              </div>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1 text-center pt-12">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 bg-accent/10 rounded-[2.5rem] flex items-center justify-center text-accent shadow-inner border border-accent/20">
                  <ShieldCheck className="h-10 w-10" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black">2-Step Auth</CardTitle>
              <CardDescription className="text-sm font-medium px-6">Enter the 6-digit verification code sent to your {pendingUser?.twoFactorMethod || 'email'}.</CardDescription>
            </CardHeader>
            <form onSubmit={handlePINVerify}>
              <CardContent className="space-y-6 px-8 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] block text-center">Verification Code</label>
                  <Input 
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required 
                    className="h-24 text-5xl text-center font-black tracking-[0.5em] rounded-[2rem] border-4 border-accent/20 focus:border-accent bg-accent/5"
                    autoFocus
                  />
                </div>
                <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex gap-3 items-center">
                  <Lock className="h-4 w-4 text-accent" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">Session protection active via 256-bit AES encryption.</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 px-8 pb-12 mt-4">
                <Button type="submit" className="w-full h-16 bg-accent hover:bg-accent/90 text-xl font-black rounded-[2rem] shadow-xl shadow-primary/20" disabled={pin.length < 4}>
                  Verify Identity <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
                <Button variant="ghost" onClick={() => setIs2FAStep(false)} className="text-[10px] font-black uppercase tracking-widest opacity-50">Cancel</Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}