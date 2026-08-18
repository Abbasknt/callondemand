"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { BrandLogo } from "@/components/brand-logo"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  
  const auth = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    try {
      if (!auth) {
        throw new Error("Authentication service is initializing. Please try again in a moment.");
      }
      await sendPasswordResetEmail(auth, email)
      setSubmitted(true)
      toast({ title: "Email Sent", description: "Check your inbox for recovery instructions." })
    } catch (err: any) {
      console.error(err);
      toast({ title: "Reset Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary rounded-[3rem] overflow-hidden border-none bg-card">
        <CardHeader className="space-y-1 text-center pt-12">
          <div className="flex justify-center mb-6">
            {submitted ? (
              <div className="h-20 w-20 bg-green-100 rounded-[2.5rem] flex items-center justify-center text-green-600 border border-green-200 shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            ) : (
              <BrandLogo iconOnly className="h-16 w-16" />
            )}
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter">
            {submitted ? "Check Your Mail" : "Forgot Password?"}
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            {submitted 
              ? "We've sent recovery instructions to your email address." 
              : "Enter your registered email to reset your COD access."}
          </CardDescription>
        </CardHeader>
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 px-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="h-14 rounded-2xl pl-10 border-2"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-8 pb-12 mt-4">
              <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-xl font-black rounded-[2rem] shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : "Send Reset Link"}
              </Button>
              <Link href="/login" className="text-sm font-black text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="px-8 pb-12 pt-4">
            <div className="bg-muted/30 p-8 rounded-[2.5rem] border-2 border-dashed text-center space-y-6">
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                If an account exists for <strong>{email}</strong>, you will receive a reset link shortly. Please check your spam folder if you don&apos;t see it.
              </p>
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={() => setSubmitted(false)}>
                Try another email
              </Button>
            </div>
            <div className="mt-10 text-center">
              <Link href="/login" className="text-sm font-black text-primary hover:underline flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Return to Login
              </Link>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
