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
  Sparkles
} from "lucide-react"

const POPULAR_DESTINATIONS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, desc: "Your personal overview", color: "text-blue-500 bg-blue-500/10" },
  { name: "Logistics & Delivery", href: "/logistics", icon: Truck, desc: "Shipments & live corridor tracking", color: "text-emerald-500 bg-emerald-500/10" },
  { name: "Top-up Hub", href: "/services/utility", icon: Zap, desc: "Airtime, data & utility bills", color: "text-amber-500 bg-amber-500/10" },
  { name: "COD Wallet", href: "/wallet", icon: Wallet, desc: "Balances, funding & virtual accounts", color: "text-purple-500 bg-purple-500/10" },
  { name: "Food & Kitchens", href: "/services/food", icon: Utensils, desc: "Fresh orders & meal delivery", color: "text-orange-500 bg-orange-500/10" },
  { name: "Marketplace", href: "/services/shop", icon: ShoppingBag, desc: "Curated shopping & essentials", color: "text-indigo-500 bg-indigo-500/10" },
  { name: "All Services", href: "/services", icon: Grid, desc: "Full lifestyle directory", color: "text-primary bg-primary/10" },
  { name: "Help & Support", href: "/support", icon: Headphones, desc: "24/7 customer assistance", color: "text-rose-500 bg-rose-500/10" }
];

export function NotFoundClient() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPath, setCurrentPath] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname)
    }
  }, [pathname])

  const suggestedDestination = useMemo(() => {
    const p = currentPath.toLowerCase()
    if (p.includes("ship") || p.includes("track") || p.includes("errand") || p.includes("courier") || p.includes("deliver")) {
      return { name: "Logistics & Errand Hub", href: "/logistics" }
    }
    if (p.includes("airtime") || p.includes("bill") || p.includes("power") || p.includes("data") || p.includes("cable") || p.includes("electric")) {
      return { name: "Top-up & Utilities", href: "/services/utility" }
    }
    if (p.includes("pay") || p.includes("fund") || p.includes("money") || p.includes("bank") || p.includes("transact")) {
      return { name: "COD Wallet", href: "/wallet" }
    }
    if (p.includes("food") || p.includes("meal") || p.includes("kitchen") || p.includes("eat") || p.includes("dish")) {
      return { name: "Food Hub", href: "/services/food" }
    }
    if (p.includes("shop") || p.includes("buy") || p.includes("store") || p.includes("market") || p.includes("item")) {
      return { name: "Essentials Marketplace", href: "/services/shop" }
    }
    if (p.includes("stay") || p.includes("hotel") || p.includes("shortlet") || p.includes("house") || p.includes("flat")) {
      return { name: "Shortlet Stays", href: "/services/shortlet" }
    }
    return null
  }, [currentPath])

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

      <div className="relative w-full max-w-2xl flex flex-col items-center z-10 py-10 transition-all">
        {/* Floating icon */}
        <div className="h-20 w-20 bg-primary/10 dark:bg-primary/20 border-2 border-primary/30 rounded-3xl flex items-center justify-center mb-5 shadow-xl shadow-primary/10">
          <Compass className="h-10 w-10 text-primary animate-pulse" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">
          <span>Error 404</span>
          <span>•</span>
          <span>Page Not Found</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Looking for something specific?
        </h1>

        {/* Paragraph */}
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-md mt-2 mb-6 leading-relaxed">
          The requested page <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-primary">{currentPath || "route"}</code> could not be found or has moved.
        </p>

        {/* Suggested Route Auto-Detector */}
        {suggestedDestination && (
          <div className="w-full max-w-md p-3.5 mb-6 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Were you looking for?</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{suggestedDestination.name}</p>
              </div>
            </div>
            <Button asChild size="sm" className="font-bold rounded-xl shadow-sm">
              <Link href={suggestedDestination.href}>Go There</Link>
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full max-w-md mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search any service, feature, or page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm shadow-xs font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md mb-8">
          <Button 
            onClick={() => router.back()} 
            size="default" 
            variant="outline" 
            className="h-10 gap-2 font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button asChild size="default" variant="default" className="h-10 gap-2 shadow-md shadow-primary/20 font-bold rounded-xl">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Launch Dashboard
            </Link>
          </Button>
          <Button asChild size="default" variant="secondary" className="h-10 gap-2 font-bold rounded-xl bg-slate-200 dark:bg-slate-800">
            <Link href="/logistics">
              <Truck className="h-4 w-4 text-emerald-600" />
              Logistics
            </Link>
          </Button>
          <Button asChild size="default" variant="outline" className="h-10 gap-2 font-bold rounded-xl bg-white dark:bg-slate-900">
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



