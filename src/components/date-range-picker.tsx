"use client"

import { useState } from "react"
import { Calendar as CalendarIcon, Clock, X, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type DateRangePreset = "all" | "today" | "7days" | "30days" | "90days" | "custom"

export interface DateRange {
  preset: DateRangePreset
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
  compact?: boolean
}

export function isShipmentInDateRange(createdAt: any, range: DateRange): boolean {
  if (!createdAt || range.preset === "all") return true
  
  const createdDate = new Date(createdAt)
  if (isNaN(createdDate.getTime())) return true

  const now = new Date()

  if (range.preset === "today") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    return createdDate >= startOfToday
  }

  if (range.preset === "7days") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return createdDate >= sevenDaysAgo
  }

  if (range.preset === "30days") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return createdDate >= thirtyDaysAgo
  }

  if (range.preset === "90days") {
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    return createdDate >= ninetyDaysAgo
  }

  if (range.preset === "custom") {
    if (range.startDate) {
      const start = new Date(range.startDate + "T00:00:00")
      if (!isNaN(start.getTime()) && createdDate < start) return false
    }
    if (range.endDate) {
      const end = new Date(range.endDate + "T23:59:59")
      if (!isNaN(end.getTime()) && createdDate > end) return false
    }
    return true
  }

  return true
}

export function DateRangePicker({ value, onChange, className, compact = false }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  
  const presets: { id: DateRangePreset; label: string; description: string }[] = [
    { id: "all", label: "All Time", description: "Entire consignment history" },
    { id: "today", label: "Today", description: "Consignments created today" },
    { id: "7days", label: "Last 7 Days", description: "Past 1 week" },
    { id: "30days", label: "Last 30 Days", description: "Past 1 month" },
    { id: "90days", label: "Last 90 Days", description: "Past quarter" },
    { id: "custom", label: "Custom Range", description: "Pick start & end date" },
  ]

  const getLabel = () => {
    if (value.preset === "all") return "All Time"
    if (value.preset === "today") return "Today"
    if (value.preset === "7days") return "Last 7 Days"
    if (value.preset === "30days") return "Last 30 Days"
    if (value.preset === "90days") return "Last 90 Days"
    if (value.preset === "custom") {
      if (value.startDate && value.endDate) {
        return `${value.startDate} - ${value.endDate}`
      }
      if (value.startDate) return `From ${value.startDate}`
      if (value.endDate) return `Until ${value.endDate}`
      return "Custom Range"
    }
    return "Timeframe"
  }

  const handleSelectPreset = (p: DateRangePreset) => {
    if (p === "custom") {
      onChange({ ...value, preset: "custom" })
    } else {
      onChange({ preset: p, startDate: undefined, endDate: undefined })
      setOpen(false)
    }
  }

  const isFiltered = value.preset !== "all"

  return (
    <div className={cn("relative inline-flex items-center gap-1.5 flex-wrap", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 rounded-xl border-2 font-black text-[9px] uppercase gap-1.5 bg-white transition-all shadow-xs",
              isFiltered ? "border-primary text-primary bg-primary/5 ring-2 ring-primary/10" : "border-slate-200 text-slate-700 hover:bg-slate-50",
              compact ? "h-9 px-2.5" : "px-3"
            )}
          >
            <CalendarIcon className={cn("h-3.5 w-3.5 shrink-0", isFiltered ? "text-primary animate-pulse" : "text-muted-foreground")} />
            <span className="truncate max-w-[120px] sm:max-w-none">{getLabel()}</span>
            <ChevronDown className="h-3 w-3 opacity-50 shrink-0 ml-auto" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-3 rounded-2xl border-2 shadow-2xl space-y-3 z-50 bg-white" align="start">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Filter Timeframe</span>
            </div>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[8px] font-black uppercase text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg gap-1"
                onClick={() => {
                  onChange({ preset: "all" })
                  setOpen(false)
                }}
              >
                <X className="h-3 w-3" /> Reset
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => {
              const selected = value.preset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={cn(
                    "flex flex-col text-left p-2 rounded-xl border transition-all relative",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-[1.02]"
                      : "bg-slate-50/80 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black uppercase leading-tight">{p.label}</span>
                    {selected && <Check className="h-3 w-3 text-white shrink-0" />}
                  </div>
                  <span className={cn("text-[8px] mt-0.5 font-medium leading-tight", selected ? "text-white/80" : "text-slate-400")}>
                    {p.description}
                  </span>
                </button>
              )
            })}
          </div>

          {value.preset === "custom" && (
            <div className="pt-2 border-t space-y-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Custom Date Span</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400">Start Date</label>
                  <Input
                    type="date"
                    className="h-8 text-[10px] font-bold rounded-lg border-slate-300 bg-white"
                    value={value.startDate || ""}
                    onChange={(e) => onChange({ ...value, preset: "custom", startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400">End Date</label>
                  <Input
                    type="date"
                    className="h-8 text-[10px] font-bold rounded-lg border-slate-300 bg-white"
                    value={value.endDate || ""}
                    onChange={(e) => onChange({ ...value, preset: "custom", endDate: e.target.value })}
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="w-full h-8 rounded-lg text-[9px] font-black uppercase mt-1"
                onClick={() => setOpen(false)}
              >
                Apply Custom Range
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {isFiltered && (
        <Badge
          variant="secondary"
          className="h-6 text-[8px] font-black uppercase tracking-wider px-2 gap-1 border border-primary/20 bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-all"
          onClick={() => onChange({ preset: "all" })}
        >
          <span>{getLabel()}</span>
          <X className="h-2.5 w-2.5 opacity-70 hover:opacity-100" />
        </Badge>
      )}
    </div>
  )
}
