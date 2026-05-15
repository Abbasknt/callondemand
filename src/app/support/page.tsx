
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  MessageSquare, 
  PhoneCall, 
  Mail, 
  Zap, 
  Loader2, 
  LifeBuoy,
  Activity,
  Globe,
  ShieldCheck,
  ChevronRight
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export default function SupportHub() {
  const { user } = useUser()
  const firestore = useFirestore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const faqs = [
    {
      q: "How do I fund my COD Wallet?",
      a: "Navigate to the Wallet Hub, enter your desired amount, and select 'Authorize Settlement'. We use Monnify's secure gateway for instant funding via Card or Bank Transfer."
    },
    {
      q: "What is the delivery turnaround time?",
      a: "Food orders typically arrive within 30-45 minutes. Logistics and laundry pickups are scheduled based on unit operator availability, usually within 60 minutes of authorization."
    },
    {
      q: "Are my investments secured?",
      a: "Yes. All growth plans are secured via the COD high-density liquidity pool and verified by certified unit agents. Payouts are only permitted to your verified bank account."
    },
    {
      q: "How do I verify my bank account?",
      a: "Go to Account Settings > Payouts. Select your bank, enter your 10-digit account number, and click 'Verify'. The system will resolve your name via the secure gateway handshake."
    }
  ];

  if (!mounted) return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground animate-pulse">Syncing Support Hub...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto px-2 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <LifeBuoy className="h-8 w-8 text-primary" /> Support Hub
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Protocol Version:</span>
            <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[8px] px-3 h-5">2024.Q1</Badge>
          </div>
        </div>
      </div>

      <Card className="bg-primary text-primary-foreground border-none shadow-2xl rounded-[3rem] overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <MessageSquare className="h-32 w-32" />
        </div>
        <CardHeader className="p-10 pb-6 text-center md:text-left">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">Instant Resolution</CardTitle>
          <CardDescription className="text-white/70 font-medium text-sm">Connect with a verified unit agent for real-time assistance and fulfillment tracking.</CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-0 flex flex-col sm:flex-row gap-4">
          <Button className="flex-1 h-16 rounded-2xl bg-white text-primary hover:bg-white/90 font-black gap-2 uppercase text-[11px] shadow-xl shadow-black/10">
            <Zap className="h-5 w-5" /> Start Live Chat
          </Button>
          <Button variant="outline" className="flex-1 h-16 rounded-2xl border-2 border-white/20 bg-white/10 hover:bg-white/20 text-white font-black gap-2 uppercase text-[11px]">
            <PhoneCall className="h-5 w-5" /> Request Call
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 px-2 pt-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">System Knowledge Hub</h3>
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-card overflow-hidden">
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0 border-muted/50">
                  <AccordionTrigger className="hover:no-underline py-5 text-left group">
                    <span className="text-base font-black tracking-tight leading-tight group-hover:text-primary transition-colors">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground font-medium pb-6 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
        <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-8 flex flex-col gap-6 group hover:shadow-xl transition-all">
          <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Mail className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-black text-lg uppercase tracking-tight">Email Node</p>
            <p className="text-[11px] text-muted-foreground font-medium truncate">support@callondemandbiz.com</p>
          </div>
          <Button variant="link" className="p-0 h-auto w-fit text-primary font-black uppercase text-[10px] tracking-widest gap-2">
            Send Ticket <ChevronRight className="h-3 w-3" />
          </Button>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-lg bg-card p-8 flex flex-col gap-6 group hover:shadow-xl transition-all">
          <div className="h-12 w-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Globe className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-black text-lg uppercase tracking-tight">WhatsApp Hub</p>
            <p className="text-[11px] text-muted-foreground font-medium">Instant status updates via mobile.</p>
          </div>
          <Button variant="link" className="p-0 h-auto w-fit text-green-600 font-black uppercase text-[10px] tracking-widest gap-2">
            Connect Hub <ChevronRight className="h-3 w-3" />
          </Button>
        </Card>
      </div>

      <div className="mx-2 bg-muted/30 p-8 rounded-[3rem] flex flex-col sm:flex-row items-center justify-between gap-6 border shadow-inner">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center text-accent shadow-sm">
            <Activity className="h-7 w-7 animate-pulse" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[11px] font-black uppercase tracking-widest">Protocol Status</p>
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-tighter mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start">
              <ShieldCheck className="h-3 w-3" /> Production Handshake: Stable
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] font-black uppercase border-muted-foreground/20 px-4 py-1.5 rounded-full">V1.29.0-LIVE</Badge>
      </div>
    </div>
  )
}
