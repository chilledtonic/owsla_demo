"use client"

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@stackframe/stack'
import { useCurriculumCache } from '@/lib/curriculum-cache'
import { CurriculumData } from '@/lib/database'
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

  const loadCurricula = useCallback(async (refresh = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const data = await cache.getCachedUserCurricula(user.id, refresh)
      setCurricula(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curricula')
      console.error('Error loading curricula:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, cache])

  const refresh = useCallback(() => {
    setLoading(true)
    loadCurricula(true)
  }, [loadCurricula])

  const invalidate = useCallback(() => {
    if (user?.id) {
      cache.invalidateUserCurricula(user.id)
    }
  }, [user?.id, cache])

  useEffect(() => {
    loadCurricula(forceRefresh)
  }, [loadCurricula, forceRefresh])

  // Get loading state from cache
  const cacheLoading = user?.id ? cache.isLoadingUserCurricula(user.id) : false

  return {
    curricula,
    loading: loading || cacheLoading,
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