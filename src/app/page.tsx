import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Smartphone, Wallet, ArrowRight, Truck, Utensils, Zap, Stars } from "lucide-react"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] mb-10 border border-primary/20 shadow-sm animate-in fade-in slide-in-from-bottom duration-1000">
            <Stars className="h-4 w-4 fill-primary animate-pulse" /> The Unified Lifestyle Protocol
          </div>
          <h1 className="text-4xl md:text-8xl font-black mb-10 text-foreground tracking-tighter leading-[0.85] max-w-5xl mx-auto uppercase">
            Life, Exactly as <span className="text-primary italic underline decoration-accent/20 underline-offset-8">Demanded</span> in Nigeria.
          </h1>
          <p className="text-sm md:text-xl text-muted-foreground max-w-3xl mx-auto mb-16 font-bold leading-relaxed px-6 opacity-80">
            One platform. One wallet. Infinite convenience. Seamlessly scaling across Nigeria for the modern high-performance lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center px-6 items-center">
            <Button asChild size="lg" className="h-20 px-12 text-xl font-black bg-primary hover:bg-primary/90 rounded-[2.5rem] shadow-2xl shadow-primary/40 gap-4 group transition-all hover:scale-105 active:scale-95">
              <Link href="/login">
                Launch Dashboard <ArrowRight className="h-7 w-7 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <div className="flex -space-x-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="h-12 w-12 rounded-full border-4 border-background bg-muted overflow-hidden">
                   <Image src={`https://i.pravatar.cc/150?u=${i+10}`} alt="User" width={48} height={48} referrerPolicy="no-referrer" />
                 </div>
               ))}
               <div className="h-12 w-12 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-[10px] font-black text-secondary-foreground">+12k</div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-1000">
             <div className="flex flex-col items-center gap-1">
               <span className="text-3xl font-black">24/7</span>
               <span className="text-[10px] font-bold uppercase tracking-widest">Uptime</span>
             </div>
             <div className="flex flex-col items-center gap-1">
               <span className="text-3xl font-black">15min</span>
               <span className="text-[10px] font-bold uppercase tracking-widest">Laundry Turnaround</span>
             </div>
             <div className="flex flex-col items-center gap-1">
               <span className="text-3xl font-black">₦5B+</span>
               <span className="text-[10px] font-bold uppercase tracking-widest">Processed</span>
             </div>
             <div className="flex flex-col items-center gap-1">
               <span className="text-3xl font-black">100%</span>
               <span className="text-[10px] font-bold uppercase tracking-widest">Verified Stays</span>
             </div>
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