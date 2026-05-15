import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Smartphone, Wallet, ArrowRight, Truck, Utensils, Zap } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <BrandLogo />
        <nav className="hidden md:flex items-center gap-8">
          <Button variant="ghost" asChild className="font-bold">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 font-black rounded-xl px-8">
            <Link href="/register">Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-8 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest mb-8 border border-primary/20">
            <Zap className="h-3 w-3 fill-primary" /> Future-Proof Lifestyle Ecosystem
          </div>
          <h1 className="text-3xl md:text-6xl font-black mb-8 text-foreground tracking-tighter leading-[0.95] max-w-4xl mx-auto">
            Life, Exactly as <span className="text-primary italic underline decoration-accent/30 underline-offset-8">Demanded</span>.
          </h1>
          <p className="text-xs md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 font-medium leading-relaxed px-4">
            One platform for your wallet, food, laundry, logistics, and investments. Seamlessly integrated for the modern Nigerian lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center px-6">
            <Button asChild size="lg" className="h-16 px-10 text-lg font-black bg-primary hover:bg-primary/90 rounded-[2rem] shadow-2xl shadow-primary/30 gap-3">
              <Link href="/login">
                Get Started Now <ArrowRight className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="bg-white py-12 md:py-32 rounded-[3rem] md:rounded-[4rem] mx-4 shadow-sm">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
              <div className="space-y-4 text-center md:text-left">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mx-auto md:mx-0"><Smartphone className="h-7 w-7" /></div>
                <h3 className="text-xl font-black tracking-tight">Top-up Hub</h3>
                <p className="text-muted-foreground font-medium text-xs md:text-base">Recharge airtime, data, power, and TV in seconds from your unified wallet with automated carrier detection.</p>
              </div>
              <div className="space-y-4 text-center md:text-left">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner mx-auto md:mx-0"><Truck className="h-7 w-7" /></div>
                <h3 className="text-xl font-black tracking-tight">Unified Logistics</h3>
                <p className="text-muted-foreground font-medium text-xs md:text-base">Book local errands or national shipping with real-time tracking, visual evidence, and verified operators.</p>
              </div>
              <div className="space-y-4 text-center md:text-left">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mx-auto md:mx-0"><Utensils className="h-7 w-7" /></div>
                <h3 className="text-xl font-black tracking-tight">Lifestyle Hubs</h3>
                <p className="text-muted-foreground font-medium text-xs md:text-base">Order meals, schedule laundry, and find luxury shortlets all in one secure ecosystem designed for the elite.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-6 text-center space-y-6">
          <div className="flex justify-center opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <BrandLogo iconOnly />
          </div>
          <p className="text-muted-foreground text-[9px] md:text-sm font-bold uppercase tracking-widest">© {new Date().getFullYear()} Call on Demand.com. A Future-Proof Lifestyle Partner.</p>
          <div className="flex justify-center gap-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}