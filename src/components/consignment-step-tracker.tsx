"use client"

import React from "react"
import { motion } from "motion/react"
import { 
  Clock, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Package,
  Navigation,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface StatusHistoryEntry {
  status: string
  timestamp: string
  note?: string
  operator?: string
}

interface ConsignmentStepTrackerProps {
  status: string
  statusHistory?: StatusHistoryEntry[]
  className?: string
  compact?: boolean
  showLegend?: boolean
}

export interface StatusLegendItem {
  key: string
  label: string
  colorName: string
  bgDot: string
  textClass: string
  borderClass: string
  description: string
  matchingStatuses: string[]
}

export const STATUS_LEGEND: StatusLegendItem[] = [
  {
    key: "pending",
    label: "Pending",
    colorName: "Amber",
    bgDot: "bg-amber-500 ring-amber-300/60",
    textClass: "text-amber-800 bg-amber-50/80 border-amber-200",
    borderClass: "border-amber-300",
    description: "Awaiting approval / initialization",
    matchingStatuses: ["Pending Approval", "Processing", "Claimed", "Request Initialized"]
  },
  {
    key: "ready",
    label: "Ready for Pickup",
    colorName: "Sky / Cyan",
    bgDot: "bg-cyan-500 ring-cyan-300/60",
    textClass: "text-cyan-800 bg-cyan-50/80 border-cyan-200",
    borderClass: "border-cyan-300",
    description: "Packaged & ready at logistics node",
    matchingStatuses: ["Ready for Pickup", "Prepared", "Packed"]
  },
  {
    key: "in_transit",
    label: "In Transit",
    colorName: "Indigo",
    bgDot: "bg-indigo-600 ring-indigo-300/60",
    textClass: "text-indigo-800 bg-indigo-50/80 border-indigo-200",
    borderClass: "border-indigo-300",
    description: "En route with dispatch courier",
    matchingStatuses: ["In Transit", "Out for Delivery", "Dispatched"]
  },
  {
    key: "delivered",
    label: "Delivered",
    colorName: "Emerald",
    bgDot: "bg-emerald-600 ring-emerald-300/60",
    textClass: "text-emerald-800 bg-emerald-50/80 border-emerald-200",
    borderClass: "border-emerald-300",
    description: "Handed over to recipient",
    matchingStatuses: ["Delivered", "Completed"]
  },
  {
    key: "cancelled",
    label: "Cancelled",
    colorName: "Red",
    bgDot: "bg-red-500 ring-red-300/60",
    textClass: "text-red-800 bg-red-50/80 border-red-200",
    borderClass: "border-red-300",
    description: "Terminated or rejected dispatch",
    matchingStatuses: ["Cancelled", "Rejected", "Failed"]
  }
]

export interface StepDefinition {
  id: string
  label: string
  shortLabel: string
  description: string
  icon: React.ElementType
  matchingStatuses: string[]
}

const STEPS: StepDefinition[] = [
  {
    id: "pending",
    label: "Pending",
    shortLabel: "Pending",
    description: "Consignment logged & awaiting node authorization",
    icon: Clock,
    matchingStatuses: ["Pending Approval", "Processing", "Claimed", "Request Initialized"]
  },
  {
    id: "prepared",
    label: "Ready for Pickup",
    shortLabel: "Ready",
    description: "Manifest verified & packaged at logistics hub",
    icon: PackageCheck,
    matchingStatuses: ["Ready for Pickup", "Prepared", "Packed"]
  },
  {
    id: "in_transit",
    label: "In Transit",
    shortLabel: "Transit",
    description: "Package en route with dispatch courier",
    icon: Truck,
    matchingStatuses: ["In Transit", "Out for Delivery", "Dispatched"]
  },
  {
    id: "delivered",
    label: "Delivered",
    shortLabel: "Delivered",
    description: "Successfully handed over to recipient",
    icon: CheckCircle2,
    matchingStatuses: ["Delivered", "Completed"]
  }
]

export function getStepIndexFromStatus(status: string): number {
  if (!status) return 0
  const normalized = status.trim().toLowerCase()

  if (["cancelled", "rejected", "failed"].includes(normalized)) {
    return -1 // Special handling for cancelled
  }

  if (["delivered", "completed"].includes(normalized)) {
    return 3
  }

  if (["in transit", "out for delivery", "dispatched"].includes(normalized)) {
    return 2
  }

  if (["ready for pickup", "prepared", "packed"].includes(normalized)) {
    return 1
  }

  return 0 // Default to pending / processing
}

export function ConsignmentStepTracker({
  status,
  statusHistory = [],
  className,
  compact = false,
  showLegend = true
}: ConsignmentStepTrackerProps) {
  const isCancelled = ["cancelled", "rejected", "failed"].includes((status || "").trim().toLowerCase())
  const activeStepIndex = getStepIndexFromStatus(status)

  // Calculate progress percentage for connector bar
  let progressPercentage = 0
  if (isCancelled) {
    progressPercentage = 0
  } else if (activeStepIndex === 3) {
    progressPercentage = 100
  } else if (activeStepIndex === 2) {
    progressPercentage = status === "Out for Delivery" ? 82 : 66
  } else if (activeStepIndex === 1) {
    progressPercentage = 33
  } else {
    progressPercentage = 12
  }

  // Find latest log entry for each step if available
  const getStepTimestamp = (step: StepDefinition): string | null => {
    if (!statusHistory || statusHistory.length === 0) return null
    
    // Reverse search to find the latest log for matching statuses
    const foundLog = [...statusHistory].reverse().find(entry => 
      step.matchingStatuses.some(s => entry.status?.toLowerCase().includes(s.toLowerCase()))
    )

    if (foundLog?.timestamp) {
      try {
        const date = new Date(foundLog.timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch {
        return null
      }
    }
    return null
  }

  if (isCancelled) {
    return (
      <div className={cn("p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2", className)}>
        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-tight text-red-700">
          <XCircle className="h-4 w-4 shrink-0 text-red-600 animate-pulse" />
          <span>Consignment Dispatch Terminated</span>
        </div>
        <p className="text-[11px] text-red-700/90 font-medium">
          This shipment was marked as <span className="font-bold uppercase">{status}</span>. Delivery workflow has been halted.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4 rounded-3xl bg-slate-50/80 p-5 border border-slate-200/80 shadow-xs", className)}>
      {/* Header phase badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Fulfillment Progress
          </span>
        </div>
        <Badge variant="outline" className="bg-white text-[9px] font-black uppercase px-2 py-0.5 border-primary/30 text-primary">
          Step {activeStepIndex + 1} of 4
        </Badge>
      </div>

      {/* Visual Step Nodes Container */}
      <div className="relative pt-2 pb-1 px-2">
        {/* Background track line */}
        <div className="absolute top-[22px] left-[24px] right-[24px] h-[3px] bg-slate-200 rounded-full" />

        {/* Animated progress fill line */}
        <motion.div 
          className="absolute top-[22px] left-[24px] h-[3px] bg-gradient-to-r from-primary via-indigo-600 to-emerald-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `calc((100% - 48px) * ${progressPercentage / 100})` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Step Nodes */}
        <div className="relative flex justify-between items-start z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIndex || (idx === 3 && activeStepIndex === 3)
            const isCurrent = idx === activeStepIndex && activeStepIndex !== 3
            const StepIcon = step.icon
            const timestamp = getStepTimestamp(step)

            return (
              <div key={step.id} className="flex flex-col items-center text-center w-16 group">
                {/* Node Bubble */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xs relative",
                    isCompleted && "bg-emerald-600 border-emerald-600 text-white shadow-emerald-200",
                    isCurrent && "bg-primary border-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20 scale-110",
                    !isCompleted && !isCurrent && "bg-white border-slate-300 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <StepIcon className={cn("h-4 w-4", (step.id === 'in_transit' || step.id === 'pending') && "animate-pulse")} />
                  ) : (
                    <StepIcon className="h-4 w-4 opacity-70" />
                  )}

                  {/* Pulsing aura for current step */}
                  {isCurrent && (
                    <span className="absolute -inset-1 rounded-full bg-primary/20 animate-ping -z-10" />
                  )}
                </motion.div>

                {/* Step Labels */}
                <div className="mt-2 space-y-0.5">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-tight leading-tight",
                    isCurrent && "text-primary font-black scale-105",
                    isCompleted && "text-slate-800 font-extrabold",
                    !isCompleted && !isCurrent && "text-slate-400"
                  )}>
                    {compact ? step.shortLabel : step.label}
                  </p>

                  {/* Step timestamp if captured */}
                  {timestamp && (
                    <p className="text-[8px] font-bold text-slate-500 tracking-tighter" suppressHydrationWarning>
                      {timestamp}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Phase Description Banner */}
      {!compact && (
        <div className="mt-2 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs bg-white p-3 rounded-2xl border">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "h-7 w-7 rounded-xl flex items-center justify-center shrink-0",
              activeStepIndex === 3 ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
            )}>
              {activeStepIndex === 3 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : activeStepIndex === 2 ? (
                <Truck className="h-4 w-4 animate-bounce" />
              ) : activeStepIndex === 1 ? (
                <PackageCheck className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">
                {STEPS[activeStepIndex]?.label || "Status Update"}
              </p>
              <p className="text-[9px] font-medium text-slate-500 leading-snug">
                {STEPS[activeStepIndex]?.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Status Color Legend */}
      {(!compact || showLegend) && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
              Status Color Key
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">
              Protocol Indicators
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5">
            {STATUS_LEGEND.map((item) => {
              const isActive = item.matchingStatuses.some(s => 
                (status || "").toLowerCase().includes(s.toLowerCase())
              )

              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-xl border text-[10px] transition-all",
                    isActive 
                      ? `${item.textClass} shadow-xs ring-2 ring-slate-900/10 font-bold scale-[1.02]` 
                      : "bg-white/90 border-slate-200/80 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 ring-2", item.bgDot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 leading-tight">
                      <span className="font-extrabold truncate">{item.label}</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                      {item.colorName}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
