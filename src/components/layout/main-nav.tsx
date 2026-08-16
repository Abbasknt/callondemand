"use client"

import { useState, useMemo, useEffect, useContext } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { FirebaseContext, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import {
  LayoutDashboard,
  Wallet,
  Zap,
  Settings,
  ShieldCheck,
  Gift,
  Truck,
  Utensils,
  ShoppingBag,
  Home,
  TrendingUp,
  Megaphone,
  Shirt,
  Menu,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Crown,
  ClipboardList,
  Globe,
  Grid,
  Smartphone,
  History
} from "lucide-react"
import LinkNext from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { InstallAppDialog } from "@/components/mobile-app-install-prompt"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const MASTER_ADMIN_EMAILS = [
  'tatatradeandinnovation@gmail.com',
  'altamam02@gmail.com'
];

const BASE_NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "COD Wallet", href: "/wallet", icon: Wallet },
  { name: "Transactions", href: "/transactions", icon: History },
  { name: "Top-up", href: "/services/utility", icon: Zap },
  { name: "Logistics", href: "/logistics", icon: Truck },
  { name: "Laundry", href: "/services/laundry", icon: Shirt },
  { name: "Food", href: "/services/food", icon: Utensils },
  { name: "Market", href: "/services/shop", icon: ShoppingBag },
  { name: "Shortlets", href: "/services/shortlet", icon: Home },
  { name: "Growth", href: "/investments", icon: TrendingUp },
  { name: "Impact", href: "/crowdfunding", icon: Megaphone },
  { name: "Rewards", href: "/rewards", icon: Gift },
];

const MOBILE_BOTTOM_ITEMS = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Services", href: "/services", icon: Grid },
  { name: "Logistics", href: "/logistics", icon: Truck },
];

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showInstallDialog, setShowInstallDialog] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const firebase = useContext(FirebaseContext)
  const auth = (mounted && firebase) ? firebase.auth : null
  const firestore = (mounted && firebase) ? firebase.firestore : null
  const user = (mounted && firebase) ? firebase.user : null

  const isMasterAdmin = useMemo(() => 
    user?.email && MASTER_ADMIN_EMAILS.includes(user.email.toLowerCase()), 
    [user?.email]
  );

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const professionalItems = useMemo(() => {
    const items = [];
    if (profile?.role === 'Admin' || isMasterAdmin) {
      items.push({ 
        name: isMasterAdmin ? "Master Hub" : "Admin Hub", 
        href: "/admin", 
        icon: isMasterAdmin ? Crown : ShieldCheck 
      });
    }
    if (profile?.role === 'Agent' || profile?.role === 'Admin') {
      items.push({ name: "Agent Hub", href: "/agent", icon: ClipboardList });
    }
    if (profile?.role === 'Operator' || profile?.role === 'Fleet Operator') {
      items.push({ name: "Operator Hub", href: "/operator", icon: Truck });
    }
    return items;
  }, [profile?.role, isMasterAdmin]);

  const allItems = useMemo(() => [...professionalItems, ...BASE_NAV_ITEMS], [professionalItems]);

  const handleSignOut = async () => {
    if (auth) {
      setIsDrawerOpen(false);
      await signOut(auth);
      router.push("/login");
    }
  };

  const NavLink = ({ item, onClick, className }: { item: any, onClick?: () => void, className?: string }) => (
    <LinkNext
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
        pathname === item.href
          ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/30"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white",
        className
      )}
    >
      <item.icon className={cn("h-4.5 w-4.5 shrink-0", isMasterAdmin && item.href === '/admin' && pathname !== '/admin' && "text-amber-500")} />
      <span>{item.name}</span>
      {pathname === item.href && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
    </LinkNext>
  )

  if (!mounted) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="flex flex-col gap-2 p-4 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 hidden md:flex shadow-sm overflow-hidden z-30 transition-colors duration-200">
        <div className="mb-4 px-1 pt-1 flex items-center justify-between">
          <LinkNext href="/dashboard">
            <BrandLogo />
          </LinkNext>
        </div>

        <div className="px-3 py-2.5 mb-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">System Online</span>
           </div>
           <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">Nigeria Node</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar pb-6">
          {professionalItems.length > 0 && (
            <div className="mb-4">
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Management</p>
              {professionalItems.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
              <div className="my-3 border-t border-slate-100 dark:border-slate-800 mx-2" />
            </div>
          )}

          <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Services & Features</p>
          {BASE_NAV_ITEMS.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto flex flex-col gap-2">
          <ThemeToggle variant="full" />
          
          <Button
            variant="ghost"
            onClick={() => setShowInstallDialog(true)}
            className="justify-start gap-3 px-3.5 py-2.5 h-auto text-primary hover:text-primary hover:bg-primary/10 rounded-xl font-semibold transition-colors border border-primary/20 bg-primary/5 dark:bg-primary/10"
          >
            <Smartphone className="h-4.5 w-4.5 text-primary" />
            Install Mobile App
          </Button>
          <NavLink item={{ name: "Settings", href: "/settings", icon: Settings }} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="justify-start gap-3 px-3.5 py-2.5 h-auto text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-medium transition-colors"
              >
                <LogOut className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Sign out of Call on Demand?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                  You will need to log back in to access your wallet, orders, and services.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
                <AlertDialogCancel className="rounded-xl font-medium border-slate-200 dark:border-slate-700">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold">Sign Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </nav>

      {/* Top Header */}
      <header className="fixed top-0 left-0 md:left-64 right-0 pt-safe h-[calc(4rem+env(safe-area-inset-top,0px))] md:h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 z-40 shadow-2xs transition-colors duration-200">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95" onClick={() => router.back()} title="Go Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />
          <Button variant="ghost" size="icon" className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95 hidden md:flex" onClick={() => router.forward()} title="Go Forward">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide truncate max-w-[160px] md:max-w-[240px]">
            {allItems.find(i => i.href === pathname)?.name || "Call On Demand"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="dropdown" />
          
          <Button variant="ghost" size="icon" className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95 md:hidden" onClick={() => router.forward()} title="Go Forward">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
             <div className="text-right flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">{user?.displayName || "Guest User"}</span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-1">{profile?.role || "Member"}</span>
             </div>
             <div className="h-8 w-8 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {(user?.displayName || "U").charAt(0).toUpperCase()}
             </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around px-2 md:hidden z-40 shadow-lg select-none transition-colors duration-200">
        {MOBILE_BOTTOM_ITEMS.map((item) => {
          const isActive = item.href === "/dashboard"
            ? (pathname === "/dashboard" || pathname === "/")
            : pathname.startsWith(item.href);
          return (
            <LinkNext
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] transition-all active:scale-95 touch-manipulation",
                isActive ? "text-primary font-semibold" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-primary/10 dark:bg-primary/20 scale-105" : "bg-transparent"
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.2px]" : "stroke-[1.8px]")} />
              </div>
              <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
            </LinkNext>
          );
        })}
        
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] transition-all active:scale-95 touch-manipulation text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              <div className="p-1.5 rounded-xl bg-transparent">
                <Menu className="h-5 w-5 stroke-[1.8px]" />
              </div>
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85%] sm:max-w-md p-0 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden bg-white dark:bg-slate-900 pt-safe pb-safe">
            <SheetHeader className="p-6 border-b border-slate-100 dark:border-slate-800 text-left shrink-0 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
              <BrandLogo />
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
              {professionalItems.length > 0 && (
                <div className="space-y-1 mb-4">
                  <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Management Hubs</p>
                  {professionalItems.map(item => (
                    <NavLink key={item.name} item={item} onClick={() => setIsDrawerOpen(false)} />
                  ))}
                  <Separator className="my-3 dark:bg-slate-800" />
                </div>
              )}
              
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Explore Services</p>
                {BASE_NAV_ITEMS.map(item => (
                  <NavLink key={item.name} item={item} onClick={() => setIsDrawerOpen(false)} />
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 mt-auto shrink-0 pb-safe pb-8 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="px-1">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Appearance Mode</p>
                <ThemeToggle variant="full" />
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setShowInstallDialog(true);
                }}
                className="w-full justify-start gap-3 px-3.5 py-2.5 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl font-bold min-h-[44px]"
              >
                <Smartphone className="h-4.5 w-4.5 text-primary" /> Install Mobile App
              </Button>

              <NavLink item={{ name: "Settings", href: "/settings", icon: Settings }} onClick={() => setIsDrawerOpen(false)} className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs" />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 px-3.5 py-2.5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-medium min-h-[44px]">
                    <LogOut className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" /> Sign Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Sign out?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400">You will need to log back in to access your account.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
                    <AlertDialogCancel className="rounded-xl font-medium border-slate-200 dark:border-slate-700 min-h-[44px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold min-h-[44px]">Sign Out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      <InstallAppDialog open={showInstallDialog} onOpenChange={setShowInstallDialog} />
    </>
  )
}
