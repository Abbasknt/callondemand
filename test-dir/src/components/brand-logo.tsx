"use client"

import { useState, useEffect, useContext } from "react"
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
  // Safe extraction for SSR/Early boot
  const firestore = (mounted && firebase) ? firebase.firestore : null;
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'application_settings', 'global_settings');
  }, [firestore]);
  
  const { data: appSettings } = useDoc(settingsRef);

  const logoUrl = appSettings?.logoUrl;
  const appName = appSettings?.appName || "Call on Demand";
  const nameParts = appName.split(" ");
  const firstPart = nameParts.slice(0, -1).join(" ") || "Call on";
  const lastPart = nameParts[nameParts.length - 1] || "Demand";

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className={cn(
        "relative h-10 w-10 rounded-full flex items-center justify-center p-1 border-2 transition-transform hover:scale-105 overflow-hidden",
        light ? "border-white/20 bg-white/10" : "border-primary/20 bg-primary/5"
      )}>
        {logoUrl ? (
          <div className="relative w-full h-full">
            <img
              src={logoUrl}
              alt={appName}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <svg
            viewBox="0 0 100 100"
            className={cn("w-full h-full", light ? "fill-white" : "fill-primary")}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M50 15 C65 15 80 25 85 45 C70 40 55 40 40 45 C35 30 40 20 50 15 Z" />
            <path d="M30 65 L70 65 L70 75 L30 75 Z" opacity="0.5" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        )}
      </div>
      {!iconOnly && (
        <span className={cn(
          "font-black tracking-tighter text-xl uppercase",
          light ? "text-white" : "text-foreground"
        )}>
          {firstPart} <span className="text-primary italic">{lastPart}</span>
        </span>
      )}
    </div>
  )
}
