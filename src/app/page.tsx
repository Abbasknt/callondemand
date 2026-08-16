import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { 
  Smartphone, 
  Wallet, 
  ArrowRight, 
  Truck, 
  Utensils, 
  Zap, 
  ShieldCheck, 
  Shirt, 
  Home as HomeIcon, 
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  Lock,
  Headphones
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { MotionalAdsTicker } from "@/components/promotions/motional-ads-ticker"
import { MotionalAdsBanner } from "@/components/promotions/motional-ads-banner"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col overflow-x-hidden text-slate-800">
      {/* Motional Announcement Ticker */}
      <MotionalAdsTicker />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild className="font-medium text-slate-600 hover:text-slate-900">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-5 shadow-xs">
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 shadow-2xs">
              <Sparkles className="h-4 w-4 fill-primary" /> Everyday Convenience Across Nigeria
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Everything you need, <br className="hidden sm:inline" />
              <span className="text-primary underline decoration-primary/20 underline-offset-8">delivered on demand</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              One unified wallet for instant airtime top-ups, swift errands, meal delivery, laundry, shortlet stays, and national logistics.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-md shadow-primary/25 gap-2 group transition-all">
                <Link href="/dashboard">
                  Launch Dashboard <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold border-slate-200 hover:bg-slate-100 rounded-xl">
                <Link href="/services">
                  Explore Services
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-medium text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shrink-0">
                    <Image src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="User avatar" width={32} height={32} referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">★★★★★</div>
                <span>Trusted by happy active users in Nigeria</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Highlights / Stats Grid */}
        <section className="bg-white border-y border-slate-200/80 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">99.9%</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Wallet and payment uptime</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">&lt;15mins</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Average Dispatch Speed</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">Realtime</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Transaction process</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Verified Partners & Stays</p>
              </div>
            </div>
          </div>
        </section>

        {/* Motional Featured Offers & Live Deals */}
        <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Active Motional Promotions</h2>
            </div>
            <span className="text-xs font-semibold text-primary">Live Cashback &amp; Deals</span>
          </div>
          <MotionalAdsBanner />
        </section>

        {/* Services Showcase */}
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">All Your Essential Services in One Place</h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">Simplify your everyday logistics, bills, food, and stays without switching apps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link href="/services/utility" className="group p-4.5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">Airtime &amp; Bills Top-up</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                Recharge MTN, Airtel, Glo, 9mobile, electricity tokens, cable TV, and internet bundles with instant receipt generation.
              </p>
            </Link>

            <Link href="/logistics" className="group p-4.5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">Express Logistics &amp; Delivery</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                Book intra-city dispatch riders or inter-state haulage with live map tracking and delivery verification.
              </p>
            </Link>

            <Link href="/services/food" className="group p-4.5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <Utensils className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">Food &amp; Kitchens</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                Order freshly prepared meals, local delicacies, and executive catering directly to your home or office.
              </p>
            </Link>

            <Link href="/services/laundry" className="group p-4.5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <Shirt className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">Laundry &amp; Fabric Care</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                Schedule door-to-door garment pickup, dry cleaning, pressing, and express same-day return delivery.
              </p>
            </Link>

            <Link href="/services/shortlet" className="group p-4.5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <HomeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">Verified Shortlet Stays</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                Book fully serviced apartments, luxury vacation rentals, and corporate suites with 24/7 power and security.
              </p>
            </Link>

            <Link href="/services/shop" className="group p-4.5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">Essentials Marketplace</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                Shop curated groceries, office supplies, electronics, and daily essentials delivered right to your doorstep.
              </p>
            </Link>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-slate-900 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Designed for Peace of Mind</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-2">Built with security, speed, and reliability at its core.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <div className="h-10 w-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-4">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Secure COD Wallet</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Fund easily via virtual bank account transfer, USSD, or debit card. Protected by bank-grade security protocols.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Verified Field Operators</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Every driver, laundry partner, and property manager undergoes thorough KYC verification and background checks.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Headphones className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">24/7 Dedicated Support</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Get real-time assistance via live chat or phone for any order inquiry, refund, or service customisation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Ready to simplify your lifestyle?</h2>
              <p className="text-primary-foreground/80 text-sm sm:text-base">
                Join thousands of Nigerians using Call on Demand every day to manage their utility bills, errands, meals, and logistics.
              </p>
              <div className="pt-4">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-slate-100 font-bold px-8 h-12 rounded-xl shadow-md">
                  <Link href="/register">Create Your Account Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <BrandLogo />
            <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-600">
              <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
              <Link href="/support" className="hover:text-primary transition-colors">Support & Help</Link>
              <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            </div>
          </div>
          <div className="pt-6 text-center text-xs text-slate-400" suppressHydrationWarning>
            © {new Date().getFullYear()} Call on Demand. All rights reserved. Built for seamless everyday lifestyle across Nigeria.
          </div>
        </div>
      </footer>
    </div>
  )
}
