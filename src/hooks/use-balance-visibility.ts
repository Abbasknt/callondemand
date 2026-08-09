"use client"

import { useState, useEffect } from "react"

const BALANCE_VISIBILITY_KEY = "cod_show_balance"

export function useBalanceVisibility(defaultVisible: boolean = false) {
  const [showBalance, setShowBalance] = useState<boolean>(defaultVisible)

  useEffect(() => {
    // Read initial preference from localStorage
    const stored = typeof window !== "undefined" ? localStorage.getItem(BALANCE_VISIBILITY_KEY) : null;
    if (stored !== null) {
      setShowBalance(stored === "true")
    }

    // Listener for intra-app broadcast events
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ visible: boolean }>
      if (customEvent.detail && typeof customEvent.detail.visible === "boolean") {
        setShowBalance(customEvent.detail.visible)
      }
    }

    // Listener for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === BALANCE_VISIBILITY_KEY && e.newValue !== null) {
        setShowBalance(e.newValue === "true")
      }
    }

    window.addEventListener("cod_balance_visibility_change", handleSync)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("cod_balance_visibility_change", handleSync)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const toggleShowBalance = () => {
    const nextValue = !showBalance
    setShowBalance(nextValue)
    if (typeof window !== "undefined") {
      localStorage.setItem(BALANCE_VISIBILITY_KEY, String(nextValue))
      window.dispatchEvent(
        new CustomEvent("cod_balance_visibility_change", { detail: { visible: nextValue } })
      )
    }
  }

  const formatBalance = (amount: number | undefined | null) => {
    const val = amount ?? 0
    return showBalance ? `₦ ${val.toLocaleString()}` : "₦ ••••••••"
  }

  return {
    showBalance,
    setShowBalance,
    toggleShowBalance,
    formatBalance
  }
}
