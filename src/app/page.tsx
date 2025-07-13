"use client"

import React from "react"
import { useUser } from "@stackframe/stack"
import { useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { deduplicateBooks, calculateCurrentCurriculumDay } from "@/lib/utils"
import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { useState, useCallback, useMemo, useEffect } from "react"

// Import dashboard components directly to fix webpack issues
import { TodaysFocus, UpcomingSchedule, DashboardCurriculaOverview } from "@/components/dashboard"

import { 
  BookOpen, 
  Clock, 
  Circle,
  Target,
  BarChart3,
  Plus,
  RefreshCw
} from "lucide-react"

// Error boundary wrapper for the dashboard
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center max-w-md">
              <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Please refresh the page to try again
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </AppLayout>
      )
    }

    return this.props.children
  }
}

function DashboardContent() {
  const user = useUser({ or: "redirect" })
  const { dashboardData, loading, error, refresh } = useCachedDashboardData()
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const isMobile = useIsMobile()

  // Handle mounting and localStorage access
  useEffect(() => {
    setIsMounted(true)
    
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("module-completion")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setCompletedModules(new Set(parsed))
        } catch {}
      }
      setIsHydrated(true)
    }
  }, [])

  // Save completed modules to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("module-completion", JSON.stringify(Array.from(completedModules)))
    }
  }, [completedModules])

  const toggleModuleCompletion = useCallback((moduleKey: string) => {
    setCompletedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleKey)) {
        newSet.delete(moduleKey)
      } else {
        newSet.add(moduleKey)
      }
      return newSet
    })
  }, [])

  // Memoize expensive calculations with stable dependencies
  const calculatedData = useMemo(() => {
    if (!dashboardData) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayModules = dashboardData.dailyModules.filter(module => {
      const moduleDate = new Date(module.date)
      moduleDate.setHours(0, 0, 0, 0)
      return moduleDate.getTime() === today.getTime()
    })

    const upcomingModules = dashboardData.dailyModules.filter(module => {
      const moduleDate = new Date(module.date)
      moduleDate.setHours(0, 0, 0, 0)
      return moduleDate > today
    }).slice(0, 20)

    return {
      todayModules,
      upcomingModules,
      today
    }
  }, [dashboardData])

  // Split grouping calculation to reduce complexity
  const groupedUpcomingData = useMemo(() => {
    if (!calculatedData) return null

    // Group upcoming modules by date
    const groupedUpcomingModules = calculatedData.upcomingModules.reduce((acc, module) => {
      const dateKey = new Date(module.date).toDateString()
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(module)
      return acc
    }, {} as Record<string, typeof calculatedData.upcomingModules>)

    const sortedDates = Object.keys(groupedUpcomingModules).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    )

    return {
      groupedUpcomingModules,
      sortedDates,
      nextDay: sortedDates[0]
    }
  }, [calculatedData])

  // Split stats calculation to reduce complexity
  const statsData = useMemo(() => {
    if (!dashboardData || !calculatedData || !isHydrated) return null

    // Filter out completed curricula for stats
    const activeCurricula = dashboardData.curricula.filter(curriculum => {
      const curriculumModules = dashboardData.dailyModules.filter(m => m.curriculumId === curriculum.id)
      const { currentDay } = calculateCurrentCurriculumDay(curriculumModules)
      const totalDays = curriculumModules.length
      
      // Calculate date-based progress percentage
      const dateProgressPercentage = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0
      
      // Calculate manual completion progress percentage
      const manuallyCompletedModules = curriculumModules.filter(module => 
        completedModules.has(`${module.curriculumId}-${module.day}`)
      )
      const manualProgressPercentage = totalDays > 0 ? Math.round((manuallyCompletedModules.length / totalDays) * 100) : 0
      
      // Course is NOT completed if NONE of these are true:
      // 1. Date-based progress is 100% (past end date)
      // 2. Manual completion is 100% (all modules marked complete)
      // 3. Manual completion is 80%+ (mostly complete)
      return !(dateProgressPercentage >= 100 || manualProgressPercentage >= 100 || manualProgressPercentage >= 80)
    })

    const recentModules = dashboardData.dailyModules.filter(module => {
      const moduleDate = new Date(module.date)
      moduleDate.setHours(0, 0, 0, 0)
      const daysDiff = (calculatedData.today.getTime() - moduleDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff > 0 && daysDiff <= 7
    }).slice(0, 5)

    // Only count study time from active curricula
    const totalStudyTime = dashboardData.dailyModules
      .filter(module => activeCurricula.some(curriculum => curriculum.id === module.curriculumId))
      .reduce((acc, module) => {
        const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
        return acc + time
      }, 0)

    // Only count books from active curricula
    const activeBooks = dashboardData.bookResources.filter(book =>
      activeCurricula.some(curriculum => curriculum.id === book.curriculumId)
    )
    const uniqueBookCount = deduplicateBooks(activeBooks).length

    return {
      recentModules,
      totalStudyTime,
      uniqueBookCount,
      activeCurriculaCount: activeCurricula.length
    }
  }, [dashboardData, calculatedData, completedModules, isHydrated])

  const totalCompletedToday = useMemo(() => {
    if (!calculatedData || !isHydrated) return 0
    return calculatedData.todayModules.filter(module => 
      completedModules.has(`${module.curriculumId}-${module.day}`)
    ).length
  }, [calculatedData, completedModules, isHydrated])

  // Early return for SSR to prevent hydration mismatches
  if (!isMounted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading your learning dashboard...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading your learning dashboard...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4">
          <Alert>
            <AlertDescription>
              Error loading dashboard: {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  if (!dashboardData || !calculatedData || !groupedUpcomingData || !statsData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Welcome to your learning dashboard</h2>
            <p className="text-sm text-muted-foreground mb-4">Create your first curriculum to get started</p>
            <Button asChild size={isMobile ? "default" : "lg"}>
              <Link href="/new-curriculum">
                <Plus className="h-4 w-4 mr-2" />
                Create Curriculum
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const { todayModules } = calculatedData
  const { groupedUpcomingModules, sortedDates, nextDay } = groupedUpcomingData
  const { recentModules, totalStudyTime, uniqueBookCount } = statsData

  // Mobile-optimized layout
  if (isMobile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          {/* Header with buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Learning Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.displayName || 'there'}! Here&apos;s your study overview.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" asChild>
                <Link href="/new-curriculum">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Condensed Stats as Taglines */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center mb-1">
                <Circle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-lg font-semibold">{statsData.activeCurriculaCount}</div>
              <div className="text-xs text-muted-foreground">Active Curricula</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center mb-1">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-lg font-semibold">{todayModules.length}</div>
              <div className="text-xs text-muted-foreground">Today&apos;s Focus</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center mb-1">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-lg font-semibold">{uniqueBookCount}</div>
              <div className="text-xs text-muted-foreground">Resources</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-lg font-semibold">{Math.round(totalStudyTime / 60)}h</div>
              <div className="text-xs text-muted-foreground">Study Time</div>
            </div>
          </div>

          {/* Curricula Overview */}
          <DashboardCurriculaOverview 
            curricula={dashboardData.curricula}
            dailyModules={dashboardData.dailyModules}
          />

          {/* Today's Progress */}
          {todayModules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Today&apos;s Focus</h2>
                <Badge variant="secondary" className="text-xs">
                  {totalCompletedToday}/{todayModules.length}
                </Badge>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(totalCompletedToday / todayModules.length) * 100}%` 
                  }}
                />
              </div>

              {/* Today's Modules */}
              <TodaysFocus 
                modules={todayModules} 
                completedModules={completedModules}
                onToggleCompletion={toggleModuleCompletion}
                isHydrated={isHydrated}
              />
            </div>
          )}

          {/* Upcoming Preview */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Coming Up</h2>
            <UpcomingSchedule 
              sortedDates={sortedDates.slice(0, 3)} 
              groupedModules={groupedUpcomingModules}
              nextDay={nextDay}
            />
          </div>
        </div>
      </AppLayout>
    )
  }

  // Desktop layout (existing functionality with right sidebar)
  return (
    <AppLayout
      rightSidebar={
        <div className="p-4">
          {/* Recent Activity */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-2">
              {recentModules.map((module) => (
                <div 
                  key={`recent-${module.curriculumId}-${module.day}`}
                  className="text-xs p-2 rounded bg-background/50 border"
                >
                  <p className="font-medium truncate">{module.title}</p>
                  <p className="text-muted-foreground">
                    {new Date(module.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              ))}
              {recentModules.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="p-3 rounded bg-background/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Active Curricula</span>
                <Badge variant="secondary" className="text-xs">
                  {dashboardData.curricula.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Total Study Time</span>
                <span className="text-xs">{Math.round(totalStudyTime / 60)}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Unique Books</span>
                <span className="text-xs">{uniqueBookCount}</span>
              </div>
            </div>

            <div className="p-3 rounded bg-background/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Today&apos;s Progress</span>
                <span className="text-xs">{totalCompletedToday}/{todayModules.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: todayModules.length > 0 ? `${(totalCompletedToday / todayModules.length) * 100}%` : '0%' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="h-full overflow-auto">
        {/* Header */}
        <div className="border-b">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Learning Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.displayName || 'Learner'}! Here&apos;s your study overview.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={refresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button asChild>
                  <Link href="/new-curriculum">
                    <Plus className="h-4 w-4 mr-2" />
                    New Curriculum
                  </Link>
                </Button>
              </div>
            </div>

            {/* Condensed Stats as Taglines */}
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Circle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{dashboardData.curricula.length}</div>
                <div className="text-sm text-muted-foreground">Active Curricula</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{todayModules.length}</div>
                                 <div className="text-sm text-muted-foreground">Today&apos;s Focus</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{uniqueBookCount}</div>
                <div className="text-sm text-muted-foreground">Resources</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold">{Math.round(totalStudyTime / 60)}h</div>
                <div className="text-sm text-muted-foreground">Study Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-8">
          {/* Curricula Overview */}
          <DashboardCurriculaOverview 
            curricula={dashboardData.curricula}
            dailyModules={dashboardData.dailyModules}
          />

          {/* Today's Focus */}
          <TodaysFocus 
            modules={todayModules} 
            completedModules={completedModules}
            onToggleCompletion={toggleModuleCompletion}
            isHydrated={isHydrated}
          />

          {/* Upcoming Schedule */}
          <UpcomingSchedule 
            sortedDates={sortedDates.slice(0, 5)} 
            groupedModules={groupedUpcomingModules}
            nextDay={nextDay}
          />
        </div>
      </div>
    </AppLayout>
  )
}

export default function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  )
}
