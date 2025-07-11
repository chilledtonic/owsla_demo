"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { fetchActiveJobs, revalidateCurriculumCache } from '@/lib/actions'
import { ActiveJobData } from '@/lib/database'
import { useCurriculumCache } from '@/lib/curriculum-cache'
import { Card, CardContent } from "@/components/ui/card"

interface JobQueueProps {
  userId: string
}

export const JobQueue = React.memo(function JobQueue({ userId }: JobQueueProps) {
  const [jobs, setJobs] = useState<ActiveJobData[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const previousJobsRef = useRef<ActiveJobData[]>([])
  const cache = useCurriculumCache()

  const fetchJobs = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      const result = await fetchActiveJobs(userId)
      if (result.success && mountedRef.current) {
        const jobData = result.data || []
        
        // Check for jobs that completed since last fetch
        const previousJobs = previousJobsRef.current
        const completedJobs = previousJobs.filter(prevJob => {
          const currentJob = jobData.find(job => job.id === prevJob.id)
          return (
            (prevJob.status === "true" || prevJob.status === "pending") &&
            currentJob &&
            (currentJob.status === "completed" || currentJob.status === "false")
          )
        })
        
        // If any jobs completed, invalidate the cache
        if (completedJobs.length > 0) {
          console.log('Jobs completed, invalidating cache for user:', userId)
          
          // 1. Client-side cache invalidation
          cache.invalidateUserCurricula(userId)
          
          // 2. Server-side cache revalidation (CRITICAL for Next.js server cache)
          try {
            await revalidateCurriculumCache(userId)
            console.log('Server cache revalidated after job completion')
          } catch (error) {
            console.error('Failed to revalidate server cache:', error)
          }
          
          // 3. Service worker cache invalidation
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_INVALIDATE',
              cacheKey: 'user-curricula',
              userId: userId
            })
            console.log('Invalidated service worker caches after job completion')
          }
        }
        
        // Update state and refs
        setJobs(jobData)
        previousJobsRef.current = jobData
        
        // If no jobs are running or pending, stop polling
        const hasActiveJobs = jobData.some(job => 
          job.status === "true" || job.status === "pending"
        )
        
        if (!hasActiveJobs && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Error fetching jobs:', error)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [userId, cache])

  const startPolling = useCallback(() => {
    // Don't start multiple intervals
    if (intervalRef.current) return
    
    // Only poll if there are active jobs or we're initially loading
    const hasActiveJobs = jobs.some(job => 
      job.status === "true" || job.status === "pending"
    )
    
    if (hasActiveJobs || loading) {
      intervalRef.current = setInterval(fetchJobs, 15000) // Reduced from 10s to 15s
    }
  }, [fetchJobs, jobs, loading])

  useEffect(() => {
    mountedRef.current = true
    fetchJobs()
    
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchJobs])

  useEffect(() => {
    startPolling()
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [startPolling])

  const getStatusIcon = useCallback((status: string | null) => {
    switch (status) {
      case "true":
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-500" />
      case "completed":
      case "false":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      default:
        return <XCircle className="h-3 w-3 text-red-500" />
    }
  }, [])

  const getStatusText = useCallback((status: string | null) => {
    switch (status) {
      case "true":
        return "Running"
      case "pending":
        return "Pending"
      case "completed":
      case "false":
        return "Completed"
      default:
        return "Unknown"
    }
  }, [])

  const getStatusVariant = useCallback((status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "true":
        return "default"
      case "pending":
        return "secondary"
      case "completed":
      case "false":
        return "outline"
      default:
        return "destructive"
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading jobs...</span>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">No active jobs</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <Card key={job.id} className="border-none shadow-none bg-background/50">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {job.topic || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.job_type || "curriculum_generation"}
                </p>
                {job.created_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  {getStatusIcon(job.status)}
                  <Badge 
                    variant={getStatusVariant(job.status)} 
                    className="text-xs"
                  >
                    {getStatusText(job.status)}
                  </Badge>
                </div>
                {job.progress !== null && job.progress !== 100 && (
                  <span className="text-xs text-muted-foreground">
                    {job.progress}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}) 