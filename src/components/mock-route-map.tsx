"use client"

import { useMemo, useState, useEffect } from "react"
import { motion } from "motion/react"
import { MapPin, Navigation, Compass, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Coordinate mappings for major Nigerian states
const STATE_COORDINATES: Record<string, { x: number; y: number }> = {
  "Lagos": { x: 70, y: 175 },
  "Ogun": { x: 65, y: 160 },
  "Oyo": { x: 75, y: 145 },
  "Osun": { x: 90, y: 150 },
  "Ondo": { x: 110, y: 155 },
  "Edo": { x: 130, y: 160 },
  "Delta": { x: 135, y: 180 },
  "Rivers": { x: 160, y: 195 },
  "Anambra": { x: 150, y: 170 },
  "Enugu": { x: 170, y: 160 },
  "Abuja": { x: 170, y: 105 },
  "Kogi": { x: 155, y: 135 },
  "Kwara": { x: 100, y: 120 },
  "Kaduna": { x: 180, y: 75 },
  "Kano": { x: 200, y: 45 },
  "Plateau": { x: 210, y: 105 },
  "Cross River": { x: 200, y: 185 },
  "Akwa Ibom": { x: 180, y: 195 },
  "Imo": { x: 155, y: 180 },
  "Abia": { x: 165, y: 180 },
  "Borno": { x: 300, y: 35 },
  "Bauchi": { x: 235, y: 70 },
  "Sokoto": { x: 90, y: 30 },
  "Katsina": { x: 165, y: 25 },
  "Kebbi": { x: 60, y: 50 },
  "Zamfara": { x: 125, y: 40 },
  "Niger": { x: 110, y: 90 },
  "Nasarawa": { x: 195, y: 120 },
  "Taraba": { x: 255, y: 135 },
  "Adamawa": { x: 295, y: 100 },
  "Yobe": { x: 265, y: 35 },
  "Gombe": { x: 255, y: 70 },
  "Jigawa": { x: 215, y: 30 },
  "Benue": { x: 205, y: 145 },
  "Ebonyi": { x: 180, y: 170 },
  "Ekiti": { x: 100, y: 145 },
  "Bayelsa": { x: 140, y: 200 }
};

interface MockRouteMapProps {
  origin: string
  destination: string
  status?: string
  shipmentId?: string
}

export function MockRouteMap({ origin, destination, status = "Processing", shipmentId }: MockRouteMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse state name out of destination string (e.g. "123 Main St, Abuja" -> "Abuja")
  const parsedDestination = useMemo(() => {
    if (!destination) return "Abuja";
    const parts = destination.split(",");
    const lastPart = parts[parts.length - 1].trim();
    return lastPart;
  }, [destination]);

  const parsedOrigin = useMemo(() => {
    if (!origin) return "Lagos";
    return origin.trim();
  }, [origin]);

  // Helper to retrieve or generate deterministic coordinates
  const getCoordinates = (stateName: string) => {
    const cleanName = stateName.toLowerCase();
    const match = Object.keys(STATE_COORDINATES).find(
      key => cleanName.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanName)
    );
    if (match) {
      return STATE_COORDINATES[match];
    }

    // Deterministic fallback based on string hashing
    let hash = 0;
    for (let i = 0; i < stateName.length; i++) {
      hash = stateName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const x = 60 + Math.abs(hash % 220); // range 60 - 280
    const y = 40 + Math.abs((hash >> 8) % 150); // range 40 - 190
    return { x, y };
  };

  const originCoords = useMemo(() => getCoordinates(parsedOrigin), [parsedOrigin]);
  const rawDestCoords = useMemo(() => getCoordinates(parsedDestination), [parsedDestination]);

  // Check if this is an intra-state route
  const isIntraState = useMemo(() => {
    const o = parsedOrigin.toLowerCase().trim();
    const d = parsedDestination.toLowerCase().trim();
    return o === d || o.includes(d) || d.includes(o) || (origin.toLowerCase().includes(destination.toLowerCase()));
  }, [parsedOrigin, parsedDestination, origin, destination]);

  // Apply a local municipal offset if intra-state so the route displays a local corridor
  const destCoords = useMemo(() => {
    if (isIntraState) {
      return {
        x: Math.min(290, originCoords.x + 32),
        y: Math.max(25, originCoords.y - 24)
      };
    }
    return rawDestCoords;
  }, [isIntraState, originCoords, rawDestCoords]);

  // Compute Bezier Curve Control Point
  const midX = (originCoords.x + destCoords.x) / 2;
  const midY = isIntraState 
    ? Math.min(originCoords.y, destCoords.y) - 20
    : Math.min(originCoords.y, destCoords.y) - 45; // arc upward
  const routePath = `M ${originCoords.x} ${originCoords.y} Q ${midX} ${midY} ${destCoords.x} ${destCoords.y}`;

  // Generate realistic distance in km
  const calculatedDistance = useMemo(() => {
    if (isIntraState) {
      // Intra-state distance typically 15 - 45 km
      let hash = 0;
      for (let i = 0; i < (origin + destination).length; i++) {
        hash = (origin + destination).charCodeAt(i) + ((hash << 5) - hash);
      }
      return 15 + Math.abs(hash % 30);
    }
    const dx = originCoords.x - destCoords.x;
    const dy = originCoords.y - destCoords.y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    // Scale factor: roughly 3.8km per pixel coordinate
    return Math.round(pixelDist * 3.8 + 120);
  }, [isIntraState, origin, destination, originCoords, destCoords]);

  // Status visual configurations
  const statusColors = useMemo(() => {
    const s = status.toLowerCase();
    if (s.includes("delivered")) {
      return {
        stroke: "#22c55e",
        glow: "rgba(34, 197, 94, 0.4)",
        badgeBg: "bg-green-500/10 text-green-500 border-green-500/20",
        label: "Fulfillment Completed",
        pulse: "bg-green-500",
        icon: CheckCircle2,
      };
    }
    if (s.includes("transit") || s.includes("delivery") || s.includes("processing")) {
      return {
        stroke: "#3b82f6",
        glow: "rgba(59, 130, 246, 0.4)",
        badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        label: "Live Active Transit",
        pulse: "bg-blue-500",
        icon: Navigation,
      };
    }
    return {
      stroke: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.4)",
      badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      label: "Awaiting Dispatch",
      pulse: "bg-amber-500",
      icon: AlertCircle,
    };
  }, [status]);

  if (!mounted) {
    return (
      <div className="w-full aspect-[16/10] bg-slate-950 rounded-[2rem] border-2 border-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-6 w-32 bg-slate-800 rounded-full" />
          <div className="h-3 w-48 bg-slate-900 rounded-full" />
        </div>
      </div>
    );
  }

  const StatusIcon = statusColors.icon;

  return (
    <div className="w-full relative group/map overflow-hidden rounded-[2rem] bg-slate-950 border-2 border-slate-900 p-1 select-none">
      {/* Visual map container with subtle dots pattern */}
      <div className="w-full aspect-[16/10] relative rounded-[1.8rem] overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        
        {/* Subtle grid pattern backdrop */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        {/* Radar concentric sweep overlay in the corner */}
        <div className="absolute top-4 left-4 h-24 w-24 rounded-full border border-slate-800/40 pointer-events-none flex items-center justify-center animate-[ping_8s_infinite_linear]">
          <div className="h-12 w-12 rounded-full border border-slate-800/20" />
        </div>

        {/* Faint major hub indicators to populate the terrain */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <g opacity="0.15">
            {Object.entries(STATE_COORDINATES).map(([name, coords]) => {
              // Only draw if not identical to active origin or destination
              const isOrigin = name.toLowerCase() === parsedOrigin.toLowerCase();
              const isDest = name.toLowerCase() === parsedDestination.toLowerCase();
              if (isOrigin || isDest) return null;
              
              return (
                <g key={name} className="transition-all hover:opacity-100">
                  <circle cx={coords.x} cy={coords.y} r="2" fill="#94a3b8" />
                  <text x={coords.x + 5} y={coords.y + 2} fill="#94a3b8" className="font-mono text-[7px] tracking-widest uppercase font-bold" pointerEvents="none">
                    {name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* SVG Active route layer */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid meet">
          {/* Base path shadow/glow */}
          <path
            d={routePath}
            fill="none"
            stroke={statusColors.stroke}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.12"
            className="blur-[4px]"
          />

          {/* Active path segment */}
          <path
            d={routePath}
            fill="none"
            stroke={statusColors.stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={status.toLowerCase().includes("delivered") ? "none" : "5 5"}
            className={cn(
              status.toLowerCase().includes("delivered") ? "" : "animate-[dash_35s_linear_infinite]"
            )}
            style={{ strokeDashoffset: 100 }}
          />

          {/* GPU Accelerated Moving Indicator along the arc */}
          {!status.toLowerCase().includes("delivered") && (
            <g>
              {/* Pulsating cursor background */}
              <circle r="6" fill={statusColors.stroke} opacity="0.3" className="animate-ping" />
              <circle r="3" fill="#ffffff" />
              {/* Move element along path natively */}
              <animateMotion
                dur="4.5s"
                repeatCount="indefinite"
                path={routePath}
                rotate="auto"
              />
            </g>
          )}

          {/* Origin Marker */}
          <g transform={`translate(${originCoords.x}, ${originCoords.y})`}>
            {/* Soft backdrop glow */}
            <circle r="12" fill="#22c55e" opacity="0.12" className="animate-pulse" />
            <circle r="5" fill="#22c55e" opacity="0.25" />
            <circle r="2.5" fill="#22c55e" />
          </g>

          {/* Destination Marker */}
          <g transform={`translate(${destCoords.x}, ${destCoords.y})`}>
            <circle r="12" fill={statusColors.stroke} opacity="0.12" className="animate-pulse" />
            <circle r="5" fill={statusColors.stroke} opacity="0.25" />
            <circle r="2.5" fill={statusColors.stroke} />
          </g>
        </svg>

        {/* Floating labels overlay */}
        <div 
          className="absolute text-[8px] font-black uppercase text-green-400 bg-green-950/80 border border-green-500/20 px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5 backdrop-blur-sm transition-transform hover:scale-105"
          style={{ 
            left: `${(originCoords.x / 360) * 100}%`, 
            top: `${(originCoords.y / 220) * 100}%`,
            transform: 'translate(-50%, -130%)'
          }}
        >
          <span className="h-1 w-1 rounded-full bg-green-400 animate-pulse" />
          {parsedOrigin}
        </div>

        <div 
          className={cn(
            "absolute text-[8px] font-black uppercase bg-slate-900/90 border px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5 backdrop-blur-sm transition-transform hover:scale-105",
            status.toLowerCase().includes("delivered") ? "border-green-500/20 text-green-400" : "border-blue-500/20 text-blue-400"
          )}
          style={{ 
            left: `${(destCoords.x / 360) * 100}%`, 
            top: `${(destCoords.y / 220) * 100}%`,
            transform: 'translate(-50%, -130%)'
          }}
        >
          <span className={cn("h-1 w-1 rounded-full animate-pulse", status.toLowerCase().includes("delivered") ? "bg-green-400" : "bg-blue-400")} />
          {parsedDestination}
        </div>

        {/* UI Overlay HUD panels */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end pointer-events-none">
          <div className={cn("border px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md backdrop-blur-sm", statusColors.badgeBg)}>
            <StatusIcon className="h-3 w-3" />
            {statusColors.label}
          </div>
        </div>

        {/* Bottom telemetry overlay bar */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-slate-950/80 backdrop-blur-md border border-slate-800/60 p-3 rounded-2xl shadow-xl pointer-events-none">
          <div className="space-y-0.5">
            <p className="text-[7px] font-black uppercase text-slate-500 tracking-wider">Estimated Distance</p>
            <p className="text-[11px] font-black text-slate-200 tracking-tight font-mono">{calculatedDistance} KM</p>
          </div>
          
          <div className="h-6 w-[1px] bg-slate-800/80" />

          <div className="space-y-0.5">
            <p className="text-[7px] font-black uppercase text-slate-500 tracking-wider">Service Corridor</p>
            <p className="text-[11px] font-black text-slate-200 tracking-tight">
              {isIntraState ? "INTRA-STATE (LOCAL)" : "INTER-STATE (TRANSIT)"}
            </p>
          </div>

          <div className="h-6 w-[1px] bg-slate-800/80" />

          <div className="space-y-0.5 text-right">
            <p className="text-[7px] font-black uppercase text-slate-500 tracking-wider">CORRIDOR ETA</p>
            <p className="text-[11px] font-black text-blue-400 font-mono tracking-tighter uppercase">
              {status.toLowerCase().includes("delivered") ? "ARRIVED" : (isIntraState ? "4-8 HRS" : "24-48 HRS")}
            </p>
          </div>
        </div>

        {/* Compass indicator decorative */}
        <div className="absolute bottom-16 right-3 h-7 w-7 rounded-full bg-slate-950/60 border border-slate-800/40 flex items-center justify-center text-slate-500 shadow-md backdrop-blur-sm">
          <Compass className="h-4 w-4 animate-[spin_20s_infinite_linear]" />
        </div>
      </div>
      
      {/* Styles for SVG dash animation */}
      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}
