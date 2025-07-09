"use client"

import { useUser } from "@stackframe/stack"
import { useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { deduplicateBooks } from "@/lib/utils"
import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import React from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Target,
  BookOpenCheck,
  BarChart3,
  Plus,
  RefreshCw
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"

export default function Dashboard() {
  const user = useUser({ or: "redirect" })
  const { dashboardData, loading, error, refresh } = useCachedDashboardData()
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())

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

  // Memoize expensive calculations
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

    // Group upcoming modules by date
    const groupedUpcomingModules = upcomingModules.reduce((acc, module) => {
      const dateKey = new Date(module.date).toDateString()
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(module)
      return acc
    }, {} as Record<string, typeof upcomingModules>)

    const sortedDates = Object.keys(groupedUpcomingModules).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    )

    const recentModules = dashboardData.dailyModules.filter(module => {
      const moduleDate = new Date(module.date)
      moduleDate.setHours(0, 0, 0, 0)
      const daysDiff = (today.getTime() - moduleDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff > 0 && daysDiff <= 7
    }).slice(0, 5)

    const totalStudyTime = dashboardData.dailyModules.reduce((acc, module) => {
      const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
      return acc + time
    }, 0)

    const uniqueBookCount = deduplicateBooks(dashboardData.bookResources).length

    return {
      todayModules,
      upcomingModules,
      groupedUpcomingModules,
      sortedDates,
      recentModules,
      totalStudyTime,
      uniqueBookCount,
      nextDay: sortedDates[0]
    }
  }, [dashboardData])

  const totalCompletedToday = useMemo(() => {
    if (!calculatedData) return 0
    return calculatedData.todayModules.filter(module => 
      completedModules.has(`${module.curriculumId}-${module.day}`)
    ).length
  }, [calculatedData, completedModules])

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
        <div className="p-6">
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

  if (!dashboardData || !calculatedData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Welcome to your learning dashboard</h2>
            <p className="text-sm text-muted-foreground mb-4">Create your first curriculum to get started</p>
            <Button asChild>
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

  const { todayModules, sortedDates, groupedUpcomingModules, recentModules, totalStudyTime, uniqueBookCount, nextDay } = calculatedData

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
                <p className="text-muted-foreground">
                  Welcome back, {user?.displayName || 'learner'}! Here's your study overview.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refresh}
                >
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

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Active Curricula</span>
                </div>
                <p className="text-2xl font-bold">{dashboardData.curricula.length}</p>
                <p className="text-xs text-muted-foreground">Learning paths</p>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Today&apos;s Focus</span>
                </div>
                <p className="text-2xl font-bold">{todayModules.length}</p>
                <p className="text-xs text-muted-foreground">Modules to complete</p>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpenCheck className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Resources</span>
                </div>
                <p className="text-2xl font-bold">{uniqueBookCount}</p>
                <p className="text-xs text-muted-foreground">Unique books</p>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Study Time</span>
                </div>
                <p className="text-2xl font-bold">{Math.round(totalStudyTime / 60)}h</p>
                <p className="text-xs text-muted-foreground">Total planned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Focus */}
        {todayModules.length > 0 && (
          <TodaysFocus 
            modules={todayModules}
            completedModules={completedModules}
            onToggleCompletion={toggleModuleCompletion}
          />
        )}

        {/* Upcoming Modules */}
        {sortedDates.length > 0 && (
          <UpcomingSchedule 
            sortedDates={sortedDates.slice(0, 7)}
            groupedModules={groupedUpcomingModules}
            nextDay={nextDay}
          />
        )}

      </div>
    </AppLayout>
  )
}

// Memoized components for better performance
const TodaysFocus = React.memo(function TodaysFocus({ 
  modules, 
  completedModules, 
  onToggleCompletion 
}: {
  modules: any[]
  completedModules: Set<string>
  onToggleCompletion: (key: string) => void
}) {
  return (
    <div className="border-b">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Today&apos;s Focus
          </h2>
          <Badge variant="secondary" className="text-xs">
            {modules.length} module{modules.length > 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {modules.map((module: any) => (
            <TodayModule
              key={`${module.curriculumId}-${module.day}`}
              module={module}
              isCompleted={completedModules.has(`${module.curriculumId}-${module.day}`)}
              onToggleCompletion={onToggleCompletion}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

const TodayModule = React.memo(function TodayModule({
  module,
  isCompleted,
  onToggleCompletion
}: {
  module: any
  isCompleted: boolean
  onToggleCompletion: (key: string) => void
}) {
  const moduleKey = `${module.curriculumId}-${module.day}`
  
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCompletion(moduleKey)
  }, [moduleKey, onToggleCompletion])

  return (
    <Link 
      href={`/curriculum/${module.curriculumId}`}
      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors block"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={handleToggle}
          className="flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate mb-1">
            {module.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {module.curriculumTitle} • Day {module.day}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <Badge variant="outline" className="text-xs">
            {module.totalTime}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            Primary: {module.primaryReadingTime}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
})

const UpcomingSchedule = React.memo(function UpcomingSchedule({
  sortedDates,
  groupedModules,
  nextDay
}: {
  sortedDates: string[]
  groupedModules: Record<string, any[]>
  nextDay: string
}) {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold mb-4 flex items-center">
        <Calendar className="h-4 w-4 mr-2" />
        Upcoming Study Schedule
      </h2>
      
      <div className="space-y-3">
        {sortedDates.map((dateKey) => (
          <UpcomingDay
            key={dateKey}
            dateKey={dateKey}
            modules={groupedModules[dateKey]}
            isNextDay={dateKey === nextDay}
          />
        ))}
      </div>
    </div>
  )
})

const UpcomingDay = React.memo(function UpcomingDay({
  dateKey,
  modules,
  isNextDay
}: {
  dateKey: string
  modules: any[]
  isNextDay: boolean
}) {
  const date = new Date(dateKey)
  const totalMinutes = modules.reduce((total: number, module: any) => {
    const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
    return total + time
  }, 0)

  return (
    <Collapsible defaultOpen={isNextDay}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <ChevronDown className="h-4 w-4" />
          <div className="text-left">
            <p className="font-medium text-sm">
              {date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {modules.length} module{modules.length > 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {totalMinutes} min
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 ml-6 space-y-2">
        {modules.map((module: any) => (
          <Link
            key={`${module.curriculumId}-${module.day}-upcoming`}
            href={`/curriculum/${module.curriculumId}`}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border block"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate mb-1">
                {module.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {module.curriculumTitle} • Day {module.day}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {module.totalTime}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
})
