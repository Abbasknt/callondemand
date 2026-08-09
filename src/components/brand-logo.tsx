"use client"

import { useState, useEffect, useContext } from "react"
import Image from "next/image"
import { PhoneCall } from "lucide-react"
import { cn } from "@/lib/utils"
import { FirebaseContext, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

interface BrandLogoProps {
  className?: string
  iconOnly?: boolean
  light?: boolean
}

export function BrandLogo({ className, iconOnly = false, light = false }: BrandLogoProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const firebase = useContext(FirebaseContext);
  const firestore = (mounted && firebase) ? firebase.firestore : null;
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'application_settings', 'global_settings');
  }, [firestore]);
  
  const { data: appSettings } = useDoc(settingsRef);

  const logoUrl = appSettings?.logoUrl || "/logo.png";
  const appName = appSettings?.appName || "Call on Demand";

  return (
    <div className={cn("flex items-center gap-3 select-none group", className)}>
      <div className={cn(
        "relative h-10 w-10 rounded-full flex items-center justify-center p-0.5 shadow-sm transition-transform group-hover:scale-105 overflow-hidden shrink-0 bg-white border border-slate-200/60",
        light 
          ? "bg-white/90 text-slate-900 backdrop-blur-md border-white/40" 
          : "bg-white text-slate-900"
      )}>
        {logoUrl ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
              src={logoUrl}
              alt={appName}
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>
        ) : (
          <PhoneCall className="h-5 w-5 stroke-[2.5]" />
        )}
      </div>
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span className={cn(
            "font-bold text-lg tracking-tight",
            light ? "text-white" : "text-slate-900"
          )}>
            Call on <span className="text-primary font-extrabold">Demand</span>
          </span>
          <span className={cn(
            "text-[10px] font-medium tracking-wider uppercase opacity-75",
            light ? "text-white/80" : "text-slate-500"
          )}>
            Lifestyle Services
          </span>
        </div>
      )}
    </div>
  )
}

