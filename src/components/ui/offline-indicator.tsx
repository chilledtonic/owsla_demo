"use client"

import { useCurriculumCache } from "@/lib/curriculum-cache"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WifiOff, Clock } from "lucide-react"

export function OfflineIndicator() {
  const { isOnline, lastSyncTime } = useCurriculumCache()

  if (isOnline) {
    return null
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "unknown"
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>You&apos;re offline. Showing cached data.</span>
        {lastSyncTime && (
          <span className="flex items-center text-xs text-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Last sync: {formatLastSync(lastSyncTime)}
          </span>
        )}
      </AlertDescription>
    </Alert>
  )
} 