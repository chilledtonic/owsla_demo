"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { CurriculumData } from './database'
import { fetchUserCurricula, fetchCurriculumById, fetchAllModuleCompletions, DailyModule, BookResource, OtherResource } from './actions'
import { ModuleCompletion } from './utils'

interface CachedCurriculumData {
  data: CurriculumData[]
  timestamp: number
  loading: boolean
  isOfflineData?: boolean
}

interface CachedIndividualCurriculum {
  data: CurriculumData
  timestamp: number
  loading: boolean
  isOfflineData?: boolean
}

interface CachedDashboardData {
  curricula: CurriculumData[]
  dailyModules: DailyModule[]
  bookResources: BookResource[]
  otherResources: OtherResource[]
  moduleCompletions: ModuleCompletion[]
  timestamp: number
  loading: boolean
  isOfflineData?: boolean
}

interface CurriculumCacheContextType {
  // User curricula cache
  getCachedUserCurricula: (userId: string, forceRefresh?: boolean) => Promise<CurriculumData[]>
  getCachedCurriculum: (id: number, forceRefresh?: boolean) => Promise<CurriculumData | null>
  getCachedDashboardData: (userId: string, forceRefresh?: boolean) => Promise<{
    curricula: CurriculumData[]
    dailyModules: DailyModule[]
    bookResources: BookResource[]
    otherResources: OtherResource[]
    moduleCompletions: ModuleCompletion[]
    isOfflineData?: boolean
  }>
  
  // Cache management - simplified
  invalidateUserCurricula: (userId: string) => void
  invalidateCurriculum: (id: number) => void
  invalidateAllCaches: () => void
  
  // Loading states
  isLoadingUserCurricula: (userId: string) => boolean
  isLoadingCurriculum: (id: number) => boolean
  isLoadingDashboardData: (userId: string) => boolean
  
  // Online/offline state
  isOnline: boolean
  lastSyncTime: number | null
}

const CurriculumCacheContext = createContext<CurriculumCacheContextType | undefined>(undefined)

// Cache TTL in milliseconds (5 minutes for curriculum data since it doesn't change often)
const CACHE_TTL = 5 * 60 * 1000

interface CurriculumCacheProviderProps {
  children: React.ReactNode
}

export function CurriculumCacheProvider({ children }: CurriculumCacheProviderProps) {
  // Cache storage
  const userCurriculaCache = useRef<Map<string, CachedCurriculumData>>(new Map())
  const individualCurriculumCache = useRef<Map<number, CachedIndividualCurriculum>>(new Map())
  const dashboardDataCache = useRef<Map<string, CachedDashboardData>>(new Map())
  
  // Online/offline state
  const [isOnline, setIsOnline] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  
  // Force re-render when cache updates
  const [, forceUpdate] = useState({})
  const triggerUpdate = useCallback(() => {
    console.log('🔔 triggerUpdate called - forcing re-render')
    forceUpdate({})
  }, [])

  // Service worker communication
  const sendMessageToSW = useCallback((message: Record<string, unknown>) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
      console.log('Sent message to service worker:', message);
    } else {
      console.log('Service worker not available, skipping message:', message);
    }
  }, [])

  // Helper function to check if cache is valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_TTL
  }

  // Cache invalidation functions - define these first to avoid temporal dead zone issues
  const invalidateUserCurricula = useCallback((userId: string) => {
    // Mark cache as stale instead of deleting it
    const userCache = userCurriculaCache.current.get(userId)
    if (userCache) {
      userCurriculaCache.current.set(userId, {
        ...userCache,
        timestamp: 0 // Mark as expired
      })
    }
    
    const dashboardCache = dashboardDataCache.current.get(userId)
    if (dashboardCache) {
      dashboardDataCache.current.set(userId, {
        ...dashboardCache,
        timestamp: 0 // Mark as expired
      })
    }
    
    // Tell service worker to invalidate related cache
    sendMessageToSW({
      type: 'CACHE_INVALIDATE',
      cacheKey: 'user-curricula',
      userId: userId
    })
    
    triggerUpdate()
  }, [triggerUpdate, sendMessageToSW])

  const invalidateCurriculum = useCallback((id: number) => {
    // Remove the specific curriculum from individual cache
    individualCurriculumCache.current.delete(id)
    
    // For user curricula and dashboard caches, mark them as stale instead of clearing
    // This preserves the data while forcing a refresh on next access
    for (const [userId, userCache] of userCurriculaCache.current.entries()) {
      userCurriculaCache.current.set(userId, {
        ...userCache,
        timestamp: 0 // Mark as expired but keep the data
      })
    }
    
    for (const [userId, dashboardCache] of dashboardDataCache.current.entries()) {
      dashboardDataCache.current.set(userId, {
        ...dashboardCache,
        timestamp: 0 // Mark as expired but keep the data
      })
    }
    
    // Tell service worker to invalidate caches
    sendMessageToSW({
      type: 'CACHE_INVALIDATE',
      cacheKey: 'all'
    })
    
    triggerUpdate()
  }, [triggerUpdate, sendMessageToSW])

  // Cache invalidation function - define after individual functions
  const invalidateAllCaches = useCallback(() => {
    userCurriculaCache.current.clear()
    individualCurriculumCache.current.clear()
    dashboardDataCache.current.clear()
    
    // Tell service worker to invalidate all caches
    sendMessageToSW({
      type: 'CACHE_INVALIDATE',
      cacheKey: 'all'
    })
    
    triggerUpdate()
  }, [triggerUpdate, sendMessageToSW])

  // Helper function to process dashboard data from curricula
  const processDashboardData = useCallback((curricula: CurriculumData[], moduleCompletions: ModuleCompletion[] = [], isOfflineData = false) => {
    const dailyModules: DailyModule[] = []
    const bookResources: BookResource[] = []
    const otherResources: OtherResource[] = []

    curricula.forEach(curriculum => {
      // Add primary book resource if available (only for text curricula)
      if (curriculum.curriculum_type === 'text' && curriculum.primary_resource_title) {
        bookResources.push({
          curriculumId: curriculum.id,
          curriculumTitle: curriculum.title,
          title: curriculum.primary_resource_title,
          author: curriculum.primary_resource_author,
          year: curriculum.primary_resource_year,
          isbn: curriculum.primary_resource_isbn,
          type: 'primary'
        })
      }

      // Extract daily modules and resources from full_curriculum_data
      if (curriculum.full_curriculum_data?.daily_modules && Array.isArray(curriculum.full_curriculum_data.daily_modules)) {
        console.log(`📚 Processing ${curriculum.full_curriculum_data.daily_modules.length} modules for curriculum ${curriculum.id}: ${curriculum.title}`)
        curriculum.full_curriculum_data.daily_modules.forEach((module: {
          day: number
          date: string
          title: string
          time_allocation?: {
            total?: string
            // Text curriculum fields
            primary_text?: string
            supplementary_materials?: string
            // Video curriculum fields
            video_viewing?: string
            preparation?: string
            synthesis?: string
          }
          supplementary_readings?: Array<{
            title: string
            author: string
            year?: number
            isbn?: string
            doi?: string
            journal?: string
            publisher?: string
            reading_time?: string
          }>
        }) => {
          // Determine the correct time allocation fields based on curriculum type
          let primaryTime = '42 minutes'
          let supplementaryTime = '18 minutes'
          
          if (curriculum.curriculum_type === 'video') {
            // For video curricula, use video-specific time allocations
            primaryTime = module.time_allocation?.video_viewing || '25 minutes'
            supplementaryTime = (module.time_allocation?.preparation || '20 minutes') + ' + ' + 
                              (module.time_allocation?.synthesis || '30 minutes')
          } else {
            // For text curricula, use traditional book-based time allocations
            primaryTime = module.time_allocation?.primary_text || '42 minutes'
            supplementaryTime = module.time_allocation?.supplementary_materials || '18 minutes'
          }

          // Add daily module with curriculum type information
          dailyModules.push({
            curriculumId: curriculum.id,
            curriculumTitle: curriculum.title,
            curriculumType: curriculum.curriculum_type, // Add curriculum type
            day: module.day,
            date: module.date,
            title: module.title,
            totalTime: module.time_allocation?.total || '60 minutes',
            primaryReadingTime: primaryTime,
            supplementaryTime: supplementaryTime
          })

          // Add supplementary resources
          if (module.supplementary_readings) {
            module.supplementary_readings.forEach((reading: {
              title: string
              author: string
              year?: number
              isbn?: string
              doi?: string
              journal?: string
              publisher?: string
              reading_time?: string
            }) => {
              if (reading.isbn && reading.isbn !== 'N/A') {
                // This is a book
                bookResources.push({
                  curriculumId: curriculum.id,
                  curriculumTitle: curriculum.title,
                  title: reading.title,
                  author: reading.author,
                  year: reading.year ?? null,
                  isbn: reading.isbn,
                  type: 'supplementary'
                })
              } else {
                // This is a paper or other resource
                otherResources.push({
                  curriculumId: curriculum.id,
                  curriculumTitle: curriculum.title,
                  title: reading.title,
                  author: reading.author,
                  year: reading.year ?? 0,
                  journal: reading.journal || reading.publisher || 'Unknown',
                  doi: reading.doi && reading.doi !== 'N/A' ? reading.doi : null,
                  type: reading.journal ? 'Paper' : 'Resource',
                  readingTime: reading.reading_time || '18 minutes',
                  day: module.day,
                  moduleTitle: module.title
                })
              }
            })
          }
        })
      } else {
        console.warn(`⚠️ Curriculum ${curriculum.id} (${curriculum.title}) has no valid daily modules data:`, {
          hasFullData: !!curriculum.full_curriculum_data,
          hasDailyModules: !!curriculum.full_curriculum_data?.daily_modules,
          isArray: Array.isArray(curriculum.full_curriculum_data?.daily_modules),
          dataType: typeof curriculum.full_curriculum_data?.daily_modules
        })
      }
    })

    // Sort daily modules by date
    dailyModules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      curricula,
      dailyModules,
      bookResources,
      otherResources,
      moduleCompletions,
      isOfflineData
    }
  }, [])



  const getCachedUserCurricula = useCallback(async (userId: string, forceRefresh = false): Promise<CurriculumData[]> => {
    const cached = userCurriculaCache.current.get(userId)
    console.log('🔍 getCachedUserCurricula called:', { 
      userId, 
      forceRefresh, 
      hasCached: !!cached, 
      cachedDataLength: cached?.data?.length || 0,
      isLoading: cached?.loading,
      cacheTimestamp: cached?.timestamp,
      isValid: cached ? isCacheValid(cached.timestamp) : false
    })
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && isCacheValid(cached.timestamp) && !cached.loading) {
      console.log('✅ Returning valid cached data:', cached.data.length, 'curricula')
      return cached.data
    }

    // Return cached data if currently loading (prevent duplicate requests)
    if (cached?.loading) {
      console.log('⏳ Already loading, returning existing data:', cached.data?.length || 0, 'curricula')
      return cached.data || []
    }

    // If offline and we have cached data, use it regardless of TTL
    if (!isOnline && cached?.data) {
      console.log('📴 Offline mode, using cached data:', cached.data.length, 'curricula')
      return cached.data
    }

    // Set loading state while preserving existing data to prevent flickering
    console.log('🔄 Setting loading state for user curricula:', {
      userId,
      existingDataLength: cached?.data?.length || 0,
      willTriggerUpdate: !cached?.data || cached.data.length === 0
    })
    userCurriculaCache.current.set(userId, {
      data: cached?.data || [],
      timestamp: cached?.timestamp || 0,
      loading: true,
      isOfflineData: cached?.isOfflineData
    })
    // Only trigger update if we don't have existing data to prevent flicker
    if (!cached?.data || cached.data.length === 0) {
      console.log('🔔 Triggering update due to no existing data')
      triggerUpdate()
    } else {
      console.log('🛡️ Skipping update to prevent flicker (have existing data)')
    }

    try {
      console.log('🌐 Fetching user curricula from server...', userId)
      const result = await fetchUserCurricula(userId)
      if (result.success && result.data) {
        console.log('✅ Successfully fetched curricula:', result.data.length, 'curricula')
        const newCacheEntry: CachedCurriculumData = {
          data: result.data,
          timestamp: Date.now(),
          loading: false,
          isOfflineData: false
        }
        userCurriculaCache.current.set(userId, newCacheEntry)
        setLastSyncTime(Date.now())
        
        // Also update dashboard cache if it exists
        const dashboardCached = dashboardDataCache.current.get(userId)
        if (dashboardCached) {
          console.log('🔄 Updating dashboard cache with new curricula data')
          const dashboardData = processDashboardData(result.data, [], false)
          dashboardDataCache.current.set(userId, {
            ...dashboardData,
            timestamp: Date.now(),
            loading: false
          })
        }
        
        console.log('🔔 Triggering update after successful fetch')
        triggerUpdate()
        return result.data
      } else {
        console.log('❌ Failed to fetch curricula:', result.error)
        // If we have cached data on error, use it
        if (cached?.data) {
          console.log('🔄 Using cached data on error:', cached.data.length, 'curricula')
          userCurriculaCache.current.set(userId, {
            ...cached,
            loading: false,
            isOfflineData: true
          })
          triggerUpdate()
          return cached.data
        }
        
        console.log('🗑️ Clearing cache on error (no cached data available)')
        // Clear loading state on error
        userCurriculaCache.current.set(userId, {
          data: [],
          timestamp: 0,
          loading: false,
          isOfflineData: false
        })
        triggerUpdate()
        throw new Error(result.error || 'Failed to fetch curricula')
      }
    } catch (error) {
      // If we have cached data on network error, use it
      if (cached?.data) {
        userCurriculaCache.current.set(userId, {
          ...cached,
          loading: false,
          isOfflineData: true
        })
        triggerUpdate()
        return cached.data
      }
      
      // Clear loading state on error
      userCurriculaCache.current.set(userId, {
        data: [],
        timestamp: 0,
        loading: false,
        isOfflineData: false
      })
      triggerUpdate()
      throw error
    }
  }, [processDashboardData, triggerUpdate, isOnline])

  const getCachedCurriculum = useCallback(async (id: number, forceRefresh = false): Promise<CurriculumData | null> => {
    const cached = individualCurriculumCache.current.get(id)
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && isCacheValid(cached.timestamp) && !cached.loading) {
      return cached.data
    }

    // Return cached data if currently loading (prevent duplicate requests)
    if (cached?.loading) {
      return cached.data || null
    }

    // If offline and we have cached data, use it regardless of TTL
    if (!isOnline && cached?.data) {
      return cached.data
    }

    // Set loading state while preserving existing data to prevent flickering
    individualCurriculumCache.current.set(id, {
      data: cached?.data as CurriculumData,
      timestamp: cached?.timestamp || 0,
      loading: true,
      isOfflineData: cached?.isOfflineData
    })
    // Only trigger update if we don't have existing data to prevent flicker
    if (!cached?.data) {
      triggerUpdate()
    }

    try {
      const result = await fetchCurriculumById(id)
      if (result.success && result.data) {
        const newCacheEntry: CachedIndividualCurriculum = {
          data: result.data,
          timestamp: Date.now(),
          loading: false,
          isOfflineData: false
        }
        individualCurriculumCache.current.set(id, newCacheEntry)
        setLastSyncTime(Date.now())
        triggerUpdate()
        return result.data
      } else {
        // If we have cached data on error, use it
        if (cached?.data) {
          individualCurriculumCache.current.set(id, {
            ...cached,
            loading: false,
            isOfflineData: true
          })
          triggerUpdate()
          return cached.data
        }
        
        // Clear loading state on error
        individualCurriculumCache.current.delete(id)
        triggerUpdate()
        return null
      }
    } catch (error) {
      // If we have cached data on network error, use it
      if (cached?.data) {
        individualCurriculumCache.current.set(id, {
          ...cached,
          loading: false,
          isOfflineData: true
        })
        triggerUpdate()
        return cached.data
      }
      
      // Clear loading state on error
      individualCurriculumCache.current.delete(id)
      triggerUpdate()
      throw error
    }
  }, [triggerUpdate, isOnline])

  const getCachedDashboardData = useCallback(async (userId: string, forceRefresh = false) => {
    const cached = dashboardDataCache.current.get(userId);

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && isCacheValid(cached.timestamp) && !cached.loading) {
      return {
        curricula: cached.curricula,
        dailyModules: cached.dailyModules,
        bookResources: cached.bookResources,
        otherResources: cached.otherResources,
        moduleCompletions: cached.moduleCompletions,
        isOfflineData: cached.isOfflineData
      };
    }

    // If dashboard data is already loading, or if curricula data is loading,
    // return the current data to avoid inconsistent states.
    const userCurriculaLoading = userCurriculaCache.current.get(userId)?.loading;
    if ((cached?.loading && !forceRefresh) || (userCurriculaLoading && !forceRefresh)) {
      console.log('⏳ Already loading dashboard or curricula data, returning existing data:', cached?.curricula?.length || 0, 'curricula');
      return {
        curricula: cached?.curricula || userCurriculaCache.current.get(userId)?.data || [],
        dailyModules: cached?.dailyModules || [],
        bookResources: cached?.bookResources || [],
        otherResources: cached?.otherResources || [],
        moduleCompletions: cached?.moduleCompletions || [],
        isOfflineData: cached?.isOfflineData
      };
    }

    // If offline and we have cached data, use it regardless of TTL
    if (!isOnline && cached) {
      return {
        curricula: cached.curricula,
        dailyModules: cached.dailyModules,
        bookResources: cached.bookResources,
        otherResources: cached.otherResources,
        moduleCompletions: cached.moduleCompletions,
        isOfflineData: cached.isOfflineData
      };
    }

    // Set loading state while preserving existing data to prevent flickering
    dashboardDataCache.current.set(userId, {
      curricula: cached?.curricula || [],
      dailyModules: cached?.dailyModules || [],
      bookResources: cached?.bookResources || [],
      otherResources: cached?.otherResources || [],
      moduleCompletions: cached?.moduleCompletions || [],
      timestamp: cached?.timestamp || 0,
      loading: true,
      isOfflineData: cached?.isOfflineData
    })
    // Only trigger update if we don't have existing data to prevent flicker
    if (!cached?.curricula || cached.curricula.length === 0) {
      triggerUpdate()
    }

    try {
      // Get curricula data (this will use the user curricula cache)
      const curricula = await getCachedUserCurricula(userId, forceRefresh)
      
      // Fetch module completions
      const moduleCompletionsResult = await fetchAllModuleCompletions(userId)
      const moduleCompletions = moduleCompletionsResult.success ? moduleCompletionsResult.data : []
      
      const dashboardData = processDashboardData(curricula, moduleCompletions, false)
      
      const newCacheEntry: CachedDashboardData = {
        ...dashboardData,
        timestamp: Date.now(),
        loading: false
      }
      dashboardDataCache.current.set(userId, newCacheEntry)
      setLastSyncTime(Date.now())
      triggerUpdate()
      
      return dashboardData
    } catch (error) {
      // If we have cached data on error, use it
      if (cached) {
        const offlineData = {
          curricula: cached.curricula || [],
          dailyModules: cached.dailyModules || [],
          bookResources: cached.bookResources || [],
          otherResources: cached.otherResources || [],
          moduleCompletions: cached.moduleCompletions || [],
          isOfflineData: true
        }
        
        dashboardDataCache.current.set(userId, {
          ...offlineData,
          timestamp: cached.timestamp || 0,
          loading: false
        })
        triggerUpdate()
        return offlineData
      }
      
      // Clear loading state on error
      dashboardDataCache.current.set(userId, {
        curricula: [],
        dailyModules: [],
        bookResources: [],
        otherResources: [],
        moduleCompletions: [],
        timestamp: 0,
        loading: false,
        isOfflineData: false
      })
      triggerUpdate()
      throw error
    }
  }, [getCachedUserCurricula, processDashboardData, triggerUpdate, isOnline])

  const isLoadingUserCurricula = useCallback((userId: string): boolean => {
    const isLoading = userCurriculaCache.current.get(userId)?.loading || false
    console.log('🔍 isLoadingUserCurricula check:', { userId, isLoading })
    return isLoading
  }, [])

  const isLoadingCurriculum = useCallback((id: number): boolean => {
    return individualCurriculumCache.current.get(id)?.loading || false
  }, [])

  const isLoadingDashboardData = useCallback((userId: string): boolean => {
    return dashboardDataCache.current.get(userId)?.loading || false
  }, [])

  // Cleanup expired cache entries periodically
  useEffect(() => {
    const cleanup = () => {
      // Clean user curricula cache
      for (const [key, value] of userCurriculaCache.current.entries()) {
        if (!isCacheValid(value.timestamp)) {
          userCurriculaCache.current.delete(key)
        }
      }
      
      // Clean individual curriculum cache
      for (const [key, value] of individualCurriculumCache.current.entries()) {
        if (!isCacheValid(value.timestamp)) {
          individualCurriculumCache.current.delete(key)
        }
      }
      
      // Clean dashboard data cache
      for (const [key, value] of dashboardDataCache.current.entries()) {
        if (!isCacheValid(value.timestamp)) {
          dashboardDataCache.current.delete(key)
        }
      }
    }

    // Run cleanup every minute
    const interval = setInterval(cleanup, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Setup online/offline detection and service worker communication
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return (registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync?.register('curriculum-sync');
        }).catch(err => console.log('Sync registration failed:', err));
      }
    }

    const handleOffline = () => setIsOnline(false)

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_CURRICULUM_DATA') {
        // Service worker is requesting data sync
        // Force refresh all cached data
        invalidateAllCaches()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    // Initial online state
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOffline)
      window.removeEventListener('offline', handleOffline)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
    }
  }, [invalidateAllCaches])

  const contextValue: CurriculumCacheContextType = {
    getCachedUserCurricula,
    getCachedCurriculum,
    getCachedDashboardData,
    invalidateUserCurricula,
    invalidateCurriculum,
    invalidateAllCaches,
    isLoadingUserCurricula,
    isLoadingCurriculum,
    isLoadingDashboardData,
    isOnline,
    lastSyncTime
  }

  return (
    <CurriculumCacheContext.Provider value={contextValue}>
      {children}
    </CurriculumCacheContext.Provider>
  )
}

export function useCurriculumCache() {
  const context = useContext(CurriculumCacheContext)
  if (context === undefined) {
    throw new Error('useCurriculumCache must be used within a CurriculumCacheProvider')
  }
  return context
} 