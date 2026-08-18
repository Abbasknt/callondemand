"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Zap, 
  Home, 
  Wallet, 
  Grid, 
  ArrowLeft, 
  LayoutDashboard, 
  Truck, 
  Utensils, 
  ShoppingBag, 
  Search,
  Compass,
  Headphones,
  Settings,
  Sparkles,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  Shirt
} from "lucide-react"

const POPULAR_DESTINATIONS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, desc: "Personal overview & quick shortcuts", color: "text-blue-500 bg-blue-500/10" },
  { name: "Logistics & Delivery", href: "/logistics", icon: Truck, desc: "Shipments & live corridor tracking", color: "text-emerald-500 bg-emerald-500/10" },
  { name: "Top-up & Utilities", href: "/services/utility", icon: Zap, desc: "Airtime, data & utility bills", color: "text-amber-500 bg-amber-500/10" },
  { name: "COD Wallet", href: "/wallet", icon: Wallet, desc: "Balances, funding & virtual accounts", color: "text-purple-500 bg-purple-500/10" },
  { name: "Food & Kitchens", href: "/services/food", icon: Utensils, desc: "Fresh orders & meal delivery", color: "text-orange-500 bg-orange-500/10" },
  { name: "Laundry & Fabric Care", href: "/services/laundry", icon: Shirt, desc: "Pickup, washing & dry cleaning", color: "text-violet-500 bg-violet-500/10" },
  { name: "Marketplace", href: "/services/shop", icon: ShoppingBag, desc: "Curated shopping & essentials", color: "text-indigo-500 bg-indigo-500/10" },
  { name: "Verified Shortlet Stays", href: "/services/shortlet", icon: Home, desc: "Luxury apartments & serviced suites", color: "text-rose-500 bg-rose-500/10" },
  { name: "All Services Directory", href: "/services", icon: Grid, desc: "Complete lifestyle & terminal directory", color: "text-primary bg-primary/10" },
  { name: "Support & Help Center", href: "/support", icon: Headphones, desc: "24/7 customer assistance & tickets", color: "text-teal-500 bg-teal-500/10" },
  { name: "Account Settings", href: "/settings", icon: Settings, desc: "Security, profile & payouts", color: "text-slate-500 bg-slate-500/10" }
];

export function NotFoundClient() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPath, setCurrentPath] = useState("")
  const [countdown, setCountdown] = useState<number | null>(6)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname)
    }
  }, [pathname])

  const suggestedDestination = useMemo(() => {
    const p = (currentPath || pathname || "").toLowerCase()
    if (p.includes("ship") || p.includes("track") || p.includes("errand") || p.includes("courier") || p.includes("deliver") || p.includes("freight")) {
      return { name: "Logistics & Errand Hub", href: "/logistics", desc: "Access dispatch riders, courier shipments, and live tracking" }
    }
    if (p.includes("airtime") || p.includes("bill") || p.includes("power") || p.includes("cable") || p.includes("electric") || p.includes("utility") || p.includes("recharge")) {
      return { name: "Top-up & Utilities Hub", href: "/services/utility", desc: "Instant recharge for airtime, power tokens, and TV" }
    }
    if (p.includes("data") || p.includes("bundle") || p.includes("gig") || p.includes("internet")) {
      return { name: "Data Bundles VAS", href: "/services/data", desc: "Buy MTN, Airtel, Glo & 9mobile data bundles" }
    }
    if (p.includes("pay") || p.includes("fund") || p.includes("money") || p.includes("bank") || p.includes("transact") || p.includes("wallet") || p.includes("balance")) {
      return { name: "COD Wallet Hub", href: "/wallet", desc: "Manage your funds, deposits, and virtual accounts" }
    }
    if (p.includes("food") || p.includes("meal") || p.includes("kitchen") || p.includes("eat") || p.includes("dish") || p.includes("restaurant") || p.includes("jollof")) {
      return { name: "Food & Unit Kitchens", href: "/services/food", desc: "Order freshly made meals with express delivery" }
    }
    if (p.includes("laundry") || p.includes("wash") || p.includes("cloth") || p.includes("dryclean") || p.includes("iron")) {
      return { name: "Laundry Hub", href: "/services/laundry", desc: "Schedule fabric care with doorstep pickup" }
    }
    if (p.includes("shop") || p.includes("buy") || p.includes("store") || p.includes("market") || p.includes("item") || p.includes("cart") || p.includes("checkout")) {
      return { name: "Essentials Marketplace", href: "/services/shop", desc: "Shop groceries and daily essentials" }
    }
    if (p.includes("stay") || p.includes("hotel") || p.includes("shortlet") || p.includes("house") || p.includes("flat") || p.includes("lodge") || p.includes("apartment")) {
      return { name: "Shortlet Stays", href: "/services/shortlet", desc: "Book luxury serviced apartments with 24/7 power" }
    }
    if (p.includes("history") || p.includes("order") || p.includes("record") || p.includes("log")) {
      return { name: "Transactions & History", href: "/transactions", desc: "View all previous payments and service orders" }
    }
    if (p.includes("invest") || p.includes("growth") || p.includes("roi") || p.includes("yield")) {
      return { name: "Growth & Liquidity Pool", href: "/investments", desc: "Explore verified high-yield investment options" }
    }
    if (p.includes("crowd") || p.includes("impact") || p.includes("campaign") || p.includes("donat")) {
      return { name: "Crowdfunding & Impact", href: "/crowdfunding", desc: "Community projects and business funding" }
    }
    if (p.includes("help") || p.includes("faq") || p.includes("support") || p.includes("contact") || p.includes("issue")) {
      return { name: "Support Hub", href: "/support", desc: "24/7 live assistance and issue resolution" }
    }
    if (p.includes("setting") || p.includes("profile") || p.includes("notif") || p.includes("account") || p.includes("security")) {
      return { name: "Account Settings", href: "/settings", desc: "Profile details, passwords, and preferences" }
    }
    return { name: "Main Dashboard", href: "/dashboard", desc: "Your primary command overview and services" }
  }, [currentPath, pathname])

  // Countdown timer for automatic redirection to recommended safe route
  useEffect(() => {
    if (countdown === null || isPaused) return
    if (countdown <= 0) {
      router.push(suggestedDestination.href)
      return
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown, isPaused, suggestedDestination.href, router])

  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_DESTINATIONS
    const q = searchQuery.toLowerCase()
    return POPULAR_DESTINATIONS.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.desc.toLowerCase().includes(q) || 
      d.href.toLowerCase().includes(q)
    )
  }, [searchQuery])

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-x-hidden">
      {/* Decorative ambient glow background element */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl flex flex-col items-center z-10 py-8 transition-all">
        {/* Floating icon */}
        <div className="h-20 w-20 bg-primary/10 dark:bg-primary/20 border-2 border-primary/30 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-primary/10">
          <Compass className="h-10 w-10 text-primary animate-pulse" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
          <span>Error 404</span>
          <span>•</span>
          <span>Page Not Found</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Looking for something specific?
        </h1>

        {/* Paragraph */}
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-md mt-2 mb-4 leading-relaxed">
          The requested page <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-primary font-bold">{currentPath || "path"}</code> could not be found or has moved.
        </p>

        {/* Auto Redirect Banner */}
        {countdown !== null && countdown > 0 && (
          <div className="w-full max-w-md p-3 mb-5 bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/30 rounded-2xl flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="h-4 w-4 text-amber-500 shrink-0 animate-spin" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Redirecting to <span className="text-primary underline">{suggestedDestination.name}</span> in <span className="font-extrabold text-amber-600 dark:text-amber-400">{countdown}s</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsPaused(!isPaused)} 
                className="h-7 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setCountdown(null)} 
                className="h-7 px-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Suggested Route Auto-Detector */}
        {suggestedDestination && (
          <div className="w-full max-w-md p-4 mb-6 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-between gap-3 text-left shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recommended Safe Route</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{suggestedDestination.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{suggestedDestination.desc}</p>
              </div>
            </div>
            <Button asChild size="sm" className="font-bold rounded-xl shadow-sm shrink-0 gap-1">
              <Link href={suggestedDestination.href}>
                Go Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full max-w-md mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search any service, hub, or feature..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCountdown(null)
            }}
            className="pl-10 h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm shadow-xs font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md mb-8">
          <Button 
            onClick={() => router.back()} 
            size="default" 
            variant="outline" 
            className="h-10 min-h-[44px] gap-2 font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button asChild size="default" variant="default" className="h-10 min-h-[44px] gap-2 shadow-md shadow-primary/20 font-bold rounded-xl">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Launch Dashboard
            </Link>
          </Button>
          <Button asChild size="default" variant="secondary" className="h-10 min-h-[44px] gap-2 font-bold rounded-xl bg-slate-200 dark:bg-slate-800">
            <Link href="/logistics">
              <Truck className="h-4 w-4 text-emerald-600" />
              Logistics
            </Link>
          </Button>
          <Button asChild size="default" variant="outline" className="h-10 min-h-[44px] gap-2 font-bold rounded-xl bg-white dark:bg-slate-900">
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>

        {/* Popular Destinations Grid */}
        <div className="w-full text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
            Quick Navigation Directory
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            {filteredDestinations.map((dest) => (
              <Link
                key={dest.name}
                href={dest.href}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${dest.color} group-hover:scale-105 transition-transform`}>
                  <dest.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                    {dest.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {dest.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}




