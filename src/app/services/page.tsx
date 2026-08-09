"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Zap, 
  Utensils, 
  Shirt, 
  Home, 
  Truck, 
  ClipboardList, 
  ShoppingBag, 
  Sparkles, 
  Globe, 
  Search,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sliders,
  Play
} from "lucide-react"
import { PageTransition } from "@/components/page-transition"

const ALL_SERVICES = [
  // Lifestyle Services
  {
    id: "utility",
    name: "Top-up Hub",
    category: "Lifestyle",
    desc: "Recharge airtime, mobile data, pay electricity bills, and renew cable TV subscriptions instantly.",
    href: "/services/utility",
    icon: Zap,
    badge: "Most Popular",
    status: "Operational"
  },
  {
    id: "food",
    name: "Food Hub",
    category: "Lifestyle",
    desc: "Order exquisite meals and custom delicacies prepared by verified professional kitchens.",
    href: "/services/food",
    icon: Utensils,
    badge: "Trending",
    status: "Operational"
  },
  {
    id: "laundry",
    name: "Laundry Hub",
    category: "Lifestyle",
    desc: "Schedule premium laundry and dry cleaning with automated tracking and door-to-door delivery.",
    href: "/services/laundry",
    icon: Shirt,
    status: "Operational"
  },
  {
    id: "shortlet",
    name: "Luxury Shortlets",
    category: "Lifestyle",
    desc: "Book and manage premium, fully verified, high-performance stays and secure apartments.",
    href: "/services/shortlet",
    icon: Home,
    badge: "Exclusive",
    status: "Operational"
  },
  
  // Logistics & Commerce
  {
    id: "logistics",
    name: "Unified Logistics",
    category: "Fulfillment",
    desc: "Dispatch shipments, manage route delivery, and track transit in real-time across Nigeria.",
    href: "/logistics",
    icon: Truck,
    badge: "Core Service",
    status: "Operational"
  },
  {
    id: "errands",
    name: "Personal Errands",
    category: "Fulfillment",
    desc: "Delegate your tasks. Hire a verified personal runner for shopping, pick-ups, or bill payment.",
    href: "/services/errands",
    icon: ClipboardList,
    status: "Operational"
  },
  {
    id: "shipping",
    name: "Cargo Shipping",
    category: "Fulfillment",
    desc: "Book large-scale freight, interstate cargo, and express shipping with reliable coverage.",
    href: "/services/shipping",
    icon: Globe,
    status: "Operational"
  },
  {
    id: "shop",
    name: "Marketplace",
    category: "Fulfillment",
    desc: "Shop essentials, fresh provisions, and daily high-quality groceries directly to your doorstep.",
    href: "/services/shop",
    icon: ShoppingBag,
    status: "Operational"
  },

  // Advanced Utilities
  {
    id: "campaign",
    name: "Campaign Generator",
    category: "Business",
    desc: "AI-powered automated marketing, promotional campaigns, and custom content drafting.",
    href: "/services/campaign-generator",
    icon: Sparkles,
    badge: "AI Powered",
    status: "Operational"
  }
]

export default function ServicesHubPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"All" | "Lifestyle" | "Fulfillment" | "Business">("All")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredServices = ALL_SERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.desc.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "All" || service.category === activeTab
    return matchesSearch && matchesTab
  })

  if (!mounted) return null

  return (
    <PageTransition>
      <div className="space-y-6 pb-24 px-2">
        
        {/* Page Header */}
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" /> Premium Services Directory
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
            Lifestyle Terminal
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-xl">
            Access COD&apos;s full fleet of automated utility and high-performance lifestyle protocols instantly from your unified command center.
          </p>
        </div>

        {/* Search & Tabs Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search services, utilities, or fulfillment tools..."
              className="pl-10 h-11 rounded-xl bg-white border-2 border-muted focus-visible:ring-primary focus-visible:border-primary text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl overflow-x-auto no-scrollbar border">
            {(["All", "Lifestyle", "Fulfillment", "Business"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => {
              const IconComp = service.icon
              return (
                <Card 
                  key={service.id} 
                  className="bg-card hover:shadow-md border-2 border-muted hover:border-primary/30 transition-all rounded-[1.75rem] overflow-hidden flex flex-col h-full group"
                >
                  <CardHeader className="p-6 pb-2 shrink-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-green-500/20 text-green-600 bg-green-500/5 gap-1 py-0.5 px-2">
                          <CheckCircle2 className="h-2.5 w-2.5 fill-green-500 text-white" /> {service.status}
                        </Badge>
                        {service.badge && (
                          <Badge className="bg-accent text-accent-foreground text-[8px] font-black uppercase tracking-widest px-2 h-4">
                            {service.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-primary tracking-widest">{service.category}</p>
                      <CardTitle className="text-lg font-black tracking-tight">{service.name}</CardTitle>
                      <CardDescription className="text-xs font-medium leading-relaxed text-muted-foreground">
                        {service.desc}
                      </CardDescription>
                    </div>

                    <Button asChild size="sm" className="w-full h-10 rounded-xl font-black text-[9px] uppercase tracking-wider bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground group-hover:bg-primary group-hover:text-primary-foreground group/btn transition-all duration-300">
                      <Link href={service.href} className="flex items-center justify-center gap-2">
                        Initialize Protocol 
                        <Play className="h-3 w-3 fill-current transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="col-span-1 md:col-span-2 text-center py-16 bg-white border-2 border-dashed rounded-[2rem] space-y-4 p-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase">No active protocols found</h3>
                <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
                  Try adjusting your search criteria or filter tabs to discover other lifestyle nodes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Global Node Telemetry Block */}
        <div className="bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 justify-center sm:justify-start">
              <Globe className="h-4 w-4" /> Global Platform Synchronization
            </h4>
            <p className="text-[10px] text-muted-foreground font-medium">
              All COD platform servers, local logistics dispatch hubs, and restaurant kitchens are fully online.
            </p>
          </div>
          <div className="flex gap-4 shrink-0 text-center">
            <div>
              <div className="text-sm font-black text-primary">LAG-01</div>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Active</p>
            </div>
            <div className="border-l border-muted pl-4">
              <div className="text-sm font-black text-accent">ABJ-02</div>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Active</p>
            </div>
            <div className="border-l border-muted pl-4">
              <div className="text-sm font-black text-green-600">PHC-01</div>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Active</p>
            </div>
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
