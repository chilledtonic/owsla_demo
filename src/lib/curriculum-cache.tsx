"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { CurriculumData } from './database'
import { fetchUserCurricula, fetchCurriculumById, DailyModule, BookResource, OtherResource } from './actions'

interface CachedCurriculumData {
  data: CurriculumData[]
  timestamp: number
  loading: boolean
}

interface CachedIndividualCurriculum {
  data: CurriculumData
  timestamp: number
  loading: boolean
}

interface CachedDashboardData {
  curricula: CurriculumData[]
  dailyModules: DailyModule[]
  bookResources: BookResource[]
  otherResources: OtherResource[]
  timestamp: number
  loading: boolean
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
  }>
  
  // Cache management
  invalidateUserCurricula: (userId: string) => void
  invalidateCurriculum: (id: number) => void
  invalidateAllCaches: () => void
  
  // Loading states
  isLoadingUserCurricula: (userId: string) => boolean
  isLoadingCurriculum: (id: number) => boolean
  isLoadingDashboardData: (userId: string) => boolean
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
  
  // Force re-render when cache updates
  const [, forceUpdate] = useState({})
  const triggerUpdate = useCallback(() => forceUpdate({}), [])

  // Helper function to check if cache is valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_TTL
  }

  // Helper function to process dashboard data from curricula
  const processDashboardData = useCallback((curricula: CurriculumData[]) => {
    const dailyModules: DailyModule[] = []
    const bookResources: BookResource[] = []
    const otherResources: OtherResource[] = []

    curricula.forEach(curriculum => {
      // Add primary book resource if available
      if (curriculum.primary_resource_title) {
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
      if (curriculum.full_curriculum_data?.daily_modules) {
        curriculum.full_curriculum_data.daily_modules.forEach((module: {
          day: number
          date: string
          title: string
          time_allocation?: {
            total?: string
            primary_text?: string
            supplementary_materials?: string
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
          // Add daily module
          dailyModules.push({
            curriculumId: curriculum.id,
            curriculumTitle: curriculum.title,
            day: module.day,
            date: module.date,
            title: module.title,
            totalTime: module.time_allocation?.total || '60 minutes',
            primaryReadingTime: module.time_allocation?.primary_text || '42 minutes',
            supplementaryTime: module.time_allocation?.supplementary_materials || '18 minutes'
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
      }
    })

    // Sort daily modules by date
    dailyModules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      curricula,
      dailyModules,
      bookResources,
      otherResources
    }
  }, [])

  const getCachedUserCurricula = useCallback(async (userId: string, forceRefresh = false): Promise<CurriculumData[]> => {
    const cached = userCurriculaCache.current.get(userId)
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && isCacheValid(cached.timestamp) && !cached.loading) {
      return cached.data
    }

    // Return cached data if currently loading (prevent duplicate requests)
    if (cached?.loading) {
      return cached.data || []
    }

    // Set loading state
    userCurriculaCache.current.set(userId, {
      data: cached?.data || [],
      timestamp: cached?.timestamp || 0,
      loading: true
    })
    triggerUpdate()

    try {
      const result = await fetchUserCurricula(userId)
      if (result.success && result.data) {
        const newCacheEntry: CachedCurriculumData = {
          data: result.data,
          timestamp: Date.now(),
          loading: false
        }
        userCurriculaCache.current.set(userId, newCacheEntry)
        
        // Also update dashboard cache if it exists
        const dashboardCached = dashboardDataCache.current.get(userId)
        if (dashboardCached) {
          const dashboardData = processDashboardData(result.data)
          dashboardDataCache.current.set(userId, {
            ...dashboardData,
            timestamp: Date.now(),
            loading: false
          })
        }
        
        triggerUpdate()
        return result.data
      } else {
        // Clear loading state on error
        userCurriculaCache.current.set(userId, {
          data: cached?.data || [],
          timestamp: cached?.timestamp || 0,
          loading: false
        })
        triggerUpdate()
        throw new Error(result.error || 'Failed to fetch curricula')
      }
    } catch (error) {
      // Clear loading state on error
      userCurriculaCache.current.set(userId, {
        data: cached?.data || [],
        timestamp: cached?.timestamp || 0,
        loading: false
      })
      triggerUpdate()
      throw error
    }
  }, [processDashboardData, triggerUpdate])

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

    // Set loading state
    individualCurriculumCache.current.set(id, {
      data: cached?.data as CurriculumData,
      timestamp: cached?.timestamp || 0,
      loading: true
    })
    triggerUpdate()

    try {
      const result = await fetchCurriculumById(id)
      if (result.success && result.data) {
        const newCacheEntry: CachedIndividualCurriculum = {
          data: result.data,
          timestamp: Date.now(),
          loading: false
        }
        individualCurriculumCache.current.set(id, newCacheEntry)
        triggerUpdate()
        return result.data
      } else {
        // Clear loading state on error
        if (cached) {
          individualCurriculumCache.current.set(id, {
            ...cached,
            loading: false
          })
        } else {
          individualCurriculumCache.current.delete(id)
        }
        triggerUpdate()
        return null
      }
    } catch (error) {
      // Clear loading state on error
      if (cached) {
        individualCurriculumCache.current.set(id, {
          ...cached,
          loading: false
        })
      } else {
        individualCurriculumCache.current.delete(id)
      }
      triggerUpdate()
      throw error
    }
  }, [triggerUpdate])

  const getCachedDashboardData = useCallback(async (userId: string, forceRefresh = false) => {
    const cached = dashboardDataCache.current.get(userId)
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && isCacheValid(cached.timestamp) && !cached.loading) {
      return {
        curricula: cached.curricula,
        dailyModules: cached.dailyModules,
        bookResources: cached.bookResources,
        otherResources: cached.otherResources
      }
    }

    // Return cached data if currently loading (prevent duplicate requests)
    if (cached?.loading) {
      return {
        curricula: cached.curricula || [],
        dailyModules: cached.dailyModules || [],
        bookResources: cached.bookResources || [],
        otherResources: cached.otherResources || []
      }
    }

    // Set loading state
    dashboardDataCache.current.set(userId, {
      curricula: cached?.curricula || [],
      dailyModules: cached?.dailyModules || [],
      bookResources: cached?.bookResources || [],
      otherResources: cached?.otherResources || [],
      timestamp: cached?.timestamp || 0,
      loading: true
    })
    triggerUpdate()

    try {
      // Get curricula data (this will use the user curricula cache)
      const curricula = await getCachedUserCurricula(userId, forceRefresh)
      const dashboardData = processDashboardData(curricula)
      
      const newCacheEntry: CachedDashboardData = {
        ...dashboardData,
        timestamp: Date.now(),
        loading: false
      }
      dashboardDataCache.current.set(userId, newCacheEntry)
      triggerUpdate()
      
      return dashboardData
    } catch (error) {
      // Clear loading state on error
      dashboardDataCache.current.set(userId, {
        curricula: cached?.curricula || [],
        dailyModules: cached?.dailyModules || [],
        bookResources: cached?.bookResources || [],
        otherResources: cached?.otherResources || [],
        timestamp: cached?.timestamp || 0,
        loading: false
      })
      triggerUpdate()
      throw error
    }
  }, [getCachedUserCurricula, processDashboardData, triggerUpdate])

  const invalidateUserCurricula = useCallback((userId: string) => {
    userCurriculaCache.current.delete(userId)
    dashboardDataCache.current.delete(userId)
    triggerUpdate()
  }, [triggerUpdate])

  const invalidateCurriculum = useCallback((id: number) => {
    individualCurriculumCache.current.delete(id)
    // Also invalidate user curricula caches since they contain this curriculum
    userCurriculaCache.current.clear()
    dashboardDataCache.current.clear()
    triggerUpdate()
  }, [triggerUpdate])

  const invalidateAllCaches = useCallback(() => {
    userCurriculaCache.current.clear()
    individualCurriculumCache.current.clear()
    dashboardDataCache.current.clear()
    triggerUpdate()
  }, [triggerUpdate])

  const isLoadingUserCurricula = useCallback((userId: string): boolean => {
    return userCurriculaCache.current.get(userId)?.loading || false
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

  const contextValue: CurriculumCacheContextType = {
    getCachedUserCurricula,
    getCachedCurriculum,
    getCachedDashboardData,
    invalidateUserCurricula,
    invalidateCurriculum,
    invalidateAllCaches,
    isLoadingUserCurricula,
    isLoadingCurriculum,
    isLoadingDashboardData
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