"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Zap, 
  Utensils, 
  ShoppingBag, 
  Truck, 
  Home, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  Star,
  Shirt
} from "lucide-react"
import { useUser, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const INTERESTS = [
  { id: 'food', label: 'Food Hub', icon: Utensils, color: 'text-orange-500' },
  { id: 'topup', label: 'Top-up Hub', icon: Zap, color: 'text-primary' },
  { id: 'laundry', label: 'Laundry Hub', icon: Shirt, color: 'text-blue-400' },
  { id: 'shop', label: 'Marketplace', icon: ShoppingBag, color: 'text-accent' },
  { id: 'logistics', label: 'Logistics', icon: Truck, color: 'text-blue-500' },
  { id: 'shortlet', label: 'Shortlets', icon: Home, color: 'text-purple-500' },
]

const FREQUENCIES = ["Daily", "Weekly", "Occasionally"]
const FOCUSES = ["Speed & Convenience", "Premium Quality", "Best Deals & Discounts"]

export default function OnboardingSurveyPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [frequency, setFrequency] = useState("")
  const [lifestyleFocus, setLifestyleFocus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!user || !firestore) return
    if (selectedInterests.length === 0 || !frequency || !lifestyleFocus) {
      toast({ title: "Almost there!", description: "Please complete all fields to tailor your experience.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    
    // Store user lifestyle preferences for personalized dashboard recommendations
    const surveyRef = doc(firestore, 'users', user.uid, 'onboarding', 'survey')
    setDocumentNonBlocking(surveyRef, {
      primaryInterests: selectedInterests,
      topupFrequency: frequency,
      lifestyleFocus: lifestyleFocus,
      submittedAt: new Date().toISOString()
    }, { merge: true })

    toast({ 
      title: "Preferences Saved!", 
      description: "Welcome to the future of lifestyle management." 
    })
    
    // Redirect to personalized dashboard
    router.push("/dashboard")
  }

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8 animate-in fade-in duration-700">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-inner">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Tailor Your Experience</h1>
          <p className="text-muted-foreground font-medium">Help us prioritize what matters most to you.</p>
        </div>

        <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-card">
          <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardHeader className="p-10 pb-0">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              What are your primary interests?
            </CardTitle>
            <CardDescription className="font-medium">Select all that apply to your lifestyle.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {INTERESTS.map(item => (
                <div 
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className={cn(
                    "cursor-pointer transition-all p-4 rounded-3xl border-2 flex flex-col items-center gap-3 text-center relative",
                    selectedInterests.includes(item.id) 
                      ? "border-primary bg-primary/5 shadow-lg scale-105" 
                      : "hover:border-primary/20 border-transparent bg-muted/20"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                    selectedInterests.includes(item.id) ? "bg-primary text-white" : "bg-white " + item.color
                  )}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                  {selectedInterests.includes(item.id) && <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">How often do you Top-up Airtime/Data?</label>
              <div className="flex flex-wrap gap-3">
                {FREQUENCIES.map(f => (
                  <Button 
                    key={f} 
                    variant={frequency === f ? "default" : "outline"}
                    onClick={() => setFrequency(f)}
                    className="rounded-full px-6 font-bold h-11 transition-all"
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">What is your primary lifestyle focus?</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {FOCUSES.map(focus => (
                  <Button 
                    key={focus} 
                    variant={lifestyleFocus === focus ? "default" : "outline"}
                    onClick={() => setLifestyleFocus(focus)}
                    className="rounded-2xl h-14 font-black text-xs px-4 text-center leading-tight transition-all"
                  >
                    {focus}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-10 bg-muted/10 border-t">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || selectedInterests.length === 0 || !frequency || !lifestyleFocus}
              className="w-full h-16 text-xl font-black rounded-2xl shadow-xl gap-3 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ArrowRight className="h-6 w-6" /> Start Living on Demand</>}
            </Button>
          </CardFooter>
        </Card>
        
        <p className="text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          Your data is secured with COD AES-256 encryption protocol.
        </p>
      </div>
    </div>
  )
}
