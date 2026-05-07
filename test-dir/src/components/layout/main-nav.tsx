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
  ClipboardList
} from "lucide-react"
import LinkNext from "next/link"
import { BrandLogo } from "@/components/brand-logo"
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
  { name: "Wallet", href: "/wallet", icon: Wallet },
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
  { name: "Utility", href: "/services/utility", icon: Zap },
  { name: "Track", href: "/logistics", icon: Truck },
];

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

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
        "flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all",
        pathname === item.href
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
          : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
        className
      )}
    >
      <item.icon className={cn("h-5 w-5", isMasterAdmin && item.href === '/admin' && pathname !== '/admin' && "text-yellow-500")} />
      <span>{item.name}</span>
      {pathname === item.href && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
    </LinkNext>
  )

  if (!mounted) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="flex flex-col gap-2 p-4 w-64 bg-card border-r h-screen sticky top-0 hidden md:flex shadow-sm">
        <div className="mb-10 px-2 pt-2">
          <LinkNext href="/dashboard">
            <BrandLogo />
          </LinkNext>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar pb-10">
          {allItems.map((item, idx) => (
            <div key={item.name}>
              {idx === professionalItems.length && professionalItems.length > 0 && (
                <div className="my-4 border-t border-muted mx-2" />
              )}
              <NavLink item={item} />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t mt-auto flex flex-col gap-1">
          <NavLink item={{ name: "Settings", href: "/settings", icon: Settings }} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="justify-start gap-3 px-4 py-6 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl font-bold"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black uppercase">Terminate Session?</AlertDialogTitle>
                <AlertDialogDescription className="text-base font-medium">Your active demand sessions will be closed.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel className="rounded-xl font-bold h-12">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 rounded-xl font-black h-12">Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </nav>

      {/* Top Header - Back/Front Navigator (Now Global) */}
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-background/80 backdrop-blur-xl border-b flex items-center justify-between px-4 z-[100] shadow-sm">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all active:scale-95" onClick={() => router.back()} title="Navigate Back">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="w-px h-4 bg-muted mx-1 hidden md:block" />
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all active:scale-95 hidden md:flex" onClick={() => router.forward()} title="Navigate Forward">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-primary truncate max-w-[120px] md:max-w-[200px]">
            {allItems.find(i => i.href === pathname)?.name || pathname.split('/').pop()?.toUpperCase() || "HUB"}
          </span>
          <div className="h-1 w-1 rounded-full bg-primary mt-0.5" />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all md:hidden" onClick={() => router.forward()} title="Navigate Forward">
            <ChevronRight className="h-6 w-6" />
          </Button>
          <div className="hidden md:flex items-center gap-3">
             <div className="text-right flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase leading-none">{user?.displayName || "Guest Partner"}</span>
                <span className="text-[8px] font-bold text-muted-foreground leading-none mt-1 opacity-70">{profile?.role || "Synchronizing..."}</span>
             </div>
             <div className="h-10 w-10 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black shadow-inner">
                {(user?.displayName || "G").charAt(0).toUpperCase()}
             </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Persistent Hardened State */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t flex items-center justify-around px-2 pb-safe md:hidden z-[100] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {MOBILE_BOTTOM_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <LinkNext
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300",
                isActive ? "text-primary scale-105" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                isActive ? "bg-primary/10" : "bg-transparent"
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
            </LinkNext>
          );
        })}
        
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 w-full h-full transition-all text-muted-foreground hover:text-primary active:scale-95">
              <div className="p-2 rounded-xl bg-transparent">
                <Menu className="h-5 w-5" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85%] sm:max-w-md p-0 border-l-4 border-primary rounded-l-[3.5rem] flex flex-col overflow-hidden">
            <SheetHeader className="p-8 bg-primary/5 text-left shrink-0">
              <BrandLogo />
              <SheetTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-4">Command Center</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-1 no-scrollbar">
              {professionalItems.length > 0 && (
                <div className="space-y-1 mb-6">
                  <p className="px-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-2">Professional Hubs</p>
                  {professionalItems.map(item => (
                    <NavLink key={item.name} item={item} onClick={() => setIsDrawerOpen(false)} />
                  ))}
                  <Separator className="my-4" />
                </div>
              )}
              
              <div className="space-y-1">
                <p className="px-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-2">Lifestyle Services</p>
                {BASE_NAV_ITEMS.map(item => (
                  <NavLink key={item.name} item={item} onClick={() => setIsDrawerOpen(false)} />
                ))}
              </div>
            </div>

            <div className="p-6 border-t bg-muted/10 mt-auto shrink-0 pb-10 space-y-3">
              <NavLink item={{ name: "Settings", href: "/settings", icon: Settings }} onClick={() => setIsDrawerOpen(false)} className="bg-white shadow-sm" />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-6 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl font-bold">
                    <LogOut className="h-5 w-5" /> Terminate Session
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black uppercase">Sign Out?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base font-medium">You will need to re-verify your identity to access your wallet.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-3">
                    <AlertDialogCancel className="rounded-xl font-bold h-12">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 rounded-xl font-black h-12">Confirm Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  )
}
