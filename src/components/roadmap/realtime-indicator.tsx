"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface RealtimeIndicatorProps {
  isConnected: boolean
  isLoading?: boolean
  lastUpdate?: Date
  className?: string
}

export function RealtimeIndicator({
  isConnected,
  isLoading = false,
  lastUpdate,
  className,
}: RealtimeIndicatorProps) {
  const [showPulse, setShowPulse] = useState(false)

  // Show pulse animation when data updates
  const lastUpdateTime = lastUpdate?.getTime()
  useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true)
      const timer = setTimeout(() => setShowPulse(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [lastUpdate, lastUpdateTime])

  if (isLoading) {
    return (
      <Badge
        variant="outline"
        className={cn("gap-1.5 text-xs font-normal text-muted-foreground", className)}
      >
        <RefreshCw className="h-3 w-3 animate-spin" />
        Connecting...
      </Badge>
    )
  }

  if (!isConnected) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 text-xs font-normal text-destructive border-destructive/50",
          className
        )}
      >
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 text-xs font-normal text-emerald-600 border-emerald-500/50",
        showPulse && "animate-pulse bg-emerald-50 dark:bg-emerald-950",
        className
      )}
    >
      <Wifi className="h-3 w-3" />
      Live
    </Badge>
  )
}

/**
 * Hook to track connection state for real-time features
 */
export function useConnectionState() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Set initial state
    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
