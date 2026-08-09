"use client"

import React from "react"
import { useBalanceVisibility } from "@/hooks/use-balance-visibility"
import { Eye, EyeOff, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

interface WalletBalanceDisplayProps {
  balance: number | undefined | null;
  className?: string;
  showIcon?: boolean;
  showToggle?: boolean;
  badgeStyle?: boolean;
  size?: "sm" | "md" | "lg";
}

export function WalletBalanceDisplay({
  balance = 0,
  className,
  showIcon = true,
  showToggle = true,
  badgeStyle = false,
  size = "md",
}: WalletBalanceDisplayProps) {
  const { showBalance, toggleShowBalance, formatBalance } = useBalanceVisibility();

  if (badgeStyle) {
    return (
      <button
        onClick={toggleShowBalance}
        type="button"
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-xs transition-all active:scale-95 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer select-none",
          size === "sm" && "px-2.5 py-1 text-[11px]",
          size === "lg" && "px-4 py-2 text-sm",
          className
        )}
        title={showBalance ? "Hide wallet balance" : "View wallet balance"}
      >
        {showIcon && <Wallet className={cn("shrink-0", size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5", "opacity-70")} />}
        <span>{formatBalance(balance)}</span>
        {showToggle && (
          <span className="opacity-70 hover:opacity-100 ml-0.5 shrink-0">
            {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span>{formatBalance(balance)}</span>
      {showToggle && (
        <button
          onClick={toggleShowBalance}
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md active:scale-95 cursor-pointer"
          title={showBalance ? "Hide wallet balance" : "View wallet balance"}
        >
          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
