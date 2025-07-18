"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@stackframe/stack'
import { useCurriculumCache } from '@/lib/curriculum-cache'
import { CurriculumData, ModuleCompletion } from '@/lib/database'
import { DailyModule, BookResource, OtherResource } from '@/lib/actions'

/**
 * Hook for accessing user's curricula with caching
 */
export function useCachedUserCurricula(forceRefresh = false) {
  const user = useUser()
  const cache = useCurriculumCache()
  const [curricula, setCurricula] = useState<CurriculumData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)
  const lastDataHashRef = useRef<string>('')
  const cacheRef = useRef(cache)

  // Update cache ref when cache changes
  useEffect(() => {
    cacheRef.current = cache
  }, [cache])

  // Helper function to safely update curricula only if data changed
  const updateCurricula = useCallback((data: CurriculumData[]) => {
    // Create hash inline to avoid dependency issues
    const dataHash = JSON.stringify(data.map(c => ({ id: c.id, title: c.title, updated_at: c.updated_at })))
    if (dataHash !== lastDataHashRef.current) {
      console.log('📝 Setting curricula in hook:', data.length, 'curricula (data changed)')
      setCurricula(data)
      lastDataHashRef.current = dataHash
    } else {
      console.log('🔄 Skipping curricula update (data unchanged)', data.length, 'curricula')
    }
  }, [])

  const refresh = useCallback(() => {
    if (!user?.id) return
    
    setLoading(true)
    loadingRef.current = true
    
    const load = async () => {
             try {
         setError(null)
         const data = await cacheRef.current.getCachedUserCurricula(user.id, true)
         updateCurricula(data)
       } catch (err) {
        console.log('💥 Error in refresh:', err)
        setError(err instanceof Error ? err.message : 'Failed to load curricula')
        console.error('Error refreshing curricula:', err)
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    }
    
    load()
  }, [user?.id, updateCurricula])

  const invalidate = useCallback(() => {
    if (user?.id) {
      cacheRef.current.invalidateUserCurricula(user.id)
    }
  }, [user?.id])

  // Only load curricula when user changes or on mount/forceRefresh
  useEffect(() => {
    if (user?.id && (user.id !== lastUserIdRef.current || forceRefresh)) {
      console.log('🔄 useCachedUserCurricula effect triggered:', { 
        forceRefresh, 
        userChanged: user.id !== lastUserIdRef.current 
      })
      lastUserIdRef.current = user.id
      
      // Call loadCurricula directly to avoid dependency issues
      const load = async () => {
        if (loadingRef.current && !forceRefresh) {
          console.log('🚫 Already loading curricula, skipping duplicate request')
          return
        }

        console.log('🚀 loadCurricula called:', { userId: user.id, refresh: forceRefresh })
        loadingRef.current = true
        
                 try {
           setError(null)
           const data = await cacheRef.current.getCachedUserCurricula(user.id, forceRefresh)
           updateCurricula(data)
         } catch (err) {
          console.log('💥 Error in loadCurricula:', err)
          setError(err instanceof Error ? err.message : 'Failed to load curricula')
          console.error('Error loading curricula:', err)
        } finally {
          console.log('🏁 Setting loading to false in hook')
          setLoading(false)
          loadingRef.current = false
        }
      }
      
      load()
    }
  }, [user?.id, forceRefresh, updateCurricula]) // Only run when user or forceRefresh changes

  // Reset when user changes
  useEffect(() => {
    if (!user?.id) {
      setCurricula([])
      setLoading(false)
      setError(null)
      lastUserIdRef.current = null
      loadingRef.current = false
      lastDataHashRef.current = ''
    }
  }, [user?.id])

  // Get loading state from cache
  const cacheLoading = user?.id ? cacheRef.current.isLoadingUserCurricula(user.id) : false

  const finalLoading = loading || cacheLoading
  console.log('📊 useCachedUserCurricula returning:', { 
    curriculaLength: curricula.length, 
    loading, 
    cacheLoading, 
    finalLoading,
    error: !!error
  })
  
  return {
    curricula,
    loading: finalLoading,
    error,
    refresh,
    invalidate
  }
}

/**
 * Hook for accessing a single curriculum with caching
 */
export function useCachedCurriculum(id: number, forceRefresh = false) {
  const cache = useCurriculumCache()
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCurriculum = useCallback(async (refresh = false) => {
    if (!id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const data = await cache.getCachedCurriculum(id, refresh)
      setCurriculum(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curriculum')
      console.error('Error loading curriculum:', err)
    } finally {
      setLoading(false)
    }
  }, [id, cache])

  const refresh = useCallback(() => {
    setLoading(true)
    loadCurriculum(true)
  }, [loadCurriculum])

  const invalidate = useCallback(() => {
    cache.invalidateCurriculum(id)
  }, [id, cache])

  useEffect(() => {
    loadCurriculum(forceRefresh)
  }, [loadCurriculum, forceRefresh])

  // Get loading state from cache
  const cacheLoading = cache.isLoadingCurriculum(id)

  return {
    curriculum,
    loading: loading || cacheLoading,
    error,
    refresh,
    invalidate
  }
}

/**
 * Hook for accessing dashboard data with caching
 */
export function useCachedDashboardData(forceRefresh = false) {
  const user = useUser()
  const cache = useCurriculumCache()
  const [dashboardData, setDashboardData] = useState<{
    curricula: CurriculumData[]
    dailyModules: DailyModule[]
    bookResources: BookResource[]
    otherResources: OtherResource[]
    moduleCompletions: ModuleCompletion[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = useCallback(async (refresh = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const data = await cache.getCachedDashboardData(user.id, refresh)
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, cache])

  const refresh = useCallback(() => {
    setLoading(true)
    loadDashboardData(true)
  }, [loadDashboardData])

  const invalidate = useCallback(() => {
    if (user?.id) {
      cache.invalidateUserCurricula(user.id)
    }
  }, [user?.id, cache])

  useEffect(() => {
    loadDashboardData(forceRefresh)
  }, [loadDashboardData, forceRefresh])

  // Get loading state from cache
  const cacheLoading = user?.id ? cache.isLoadingDashboardData(user.id) : false

  return {
    dashboardData,
    loading: loading || cacheLoading,
    error,
    refresh,
    invalidate
  }
} 