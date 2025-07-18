"use client"

import React from "react"
import { useUser } from "@stackframe/stack"
import { useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"

// Import dashboard components
import { CourseModuleStack } from "@/components/dashboard"

import { 
  BookOpen, 
  Clock, 
  Target,
  BarChart3,
  Plus,
  RefreshCw,
  Video,
  Users,
  TrendingUp
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
  const [isMounted, setIsMounted] = useState(false)
  const isMobile = useIsMobile()

  // Handle mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Organize curricula and modules data
  const organizedData = useMemo(() => {
    if (!dashboardData) return null

    // Group modules by curriculum
    const modulesByCurriculum = dashboardData.dailyModules.reduce((acc, module) => {
      if (!acc[module.curriculumId]) {
        acc[module.curriculumId] = []
      }
      acc[module.curriculumId].push(module)
      return acc
    }, {} as Record<number, typeof dashboardData.dailyModules>)

    // Sort modules within each curriculum by day
    Object.values(modulesByCurriculum).forEach(modules => {
      modules.sort((a, b) => a.day - b.day)
    })

    // Calculate stats
    const totalModules = dashboardData.dailyModules.length
    const totalStudyTime = dashboardData.dailyModules.reduce((acc, module) => {
      const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
      return acc + time
    }, 0)

    const videoCourses = dashboardData.curricula.filter(c => c.curriculum_type === 'video').length
    const textCourses = dashboardData.curricula.filter(c => c.curriculum_type === 'text').length

    return {
      modulesByCurriculum,
      totalModules,
      totalStudyTime,
      videoCourses,
      textCourses,
      totalCourses: dashboardData.curricula.length
    }
  }, [dashboardData])

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

  if (!dashboardData || !organizedData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Welcome to your learning dashboard</h2>
            <p className="text-sm text-muted-foreground mb-4">Create your first curriculum to get started with module-based learning</p>
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

  const { modulesByCurriculum, totalModules, totalStudyTime, videoCourses, textCourses, totalCourses } = organizedData

  // Mobile-optimized layout
  if (isMobile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          {/* Header with buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Learning Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Progress through your {totalCourses} course{totalCourses !== 1 ? 's' : ''} at your own pace
              </p>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center mb-1">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-lg font-semibold">{totalCourses}</div>
              <div className="text-xs text-muted-foreground">Courses</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center mb-1">
                <BookOpen className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-lg font-semibold">{totalModules}</div>
              <div className="text-xs text-muted-foreground">Modules</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center mb-1">
                <Video className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-lg font-semibold">{videoCourses}</div>
              <div className="text-xs text-muted-foreground">Video</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-lg font-semibold">{Math.round(totalStudyTime / 60)}h</div>
              <div className="text-xs text-muted-foreground">Content</div>
            </div>
          </div>

          {/* Course Module Stacks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Courses</h2>
            <div className="space-y-4">
              {dashboardData.curricula.map((curriculum) => (
                <CourseModuleStack
                  key={curriculum.id}
                  curriculum={curriculum}
                  modules={modulesByCurriculum[curriculum.id] || []}
                />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Desktop layout
  return (
    <AppLayout
      rightSidebar={
        <div className="p-4 space-y-6">
          {/* Learning Stats */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Learning Overview
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded bg-background/50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Total Courses</span>
                  <Badge variant="secondary" className="text-xs">
                    {totalCourses}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Total Modules</span>
                  <span className="text-xs">{totalModules}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Study Content</span>
                  <span className="text-xs">{Math.round(totalStudyTime / 60)}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Course Types</span>
                  <div className="flex gap-1">
                    {textCourses > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {textCourses} Text
                      </Badge>
                    )}
                    {videoCourses > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {videoCourses} Video
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/new-curriculum">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/experts">
                  <Users className="h-4 w-4 mr-2" />
                  Find Experts
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/library">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Library
                </Link>
              </Button>
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
                  Welcome back, {user?.displayName || 'Learner'}! Progress through your courses at your own pace.
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
                    New Course
                  </Link>
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{totalCourses}</div>
                <div className="text-sm text-muted-foreground">Active Courses</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{totalModules}</div>
                <div className="text-sm text-muted-foreground">Total Modules</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Video className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{videoCourses}/{textCourses}</div>
                <div className="text-sm text-muted-foreground">Video/Text Courses</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold">{Math.round(totalStudyTime / 60)}h</div>
                <div className="text-sm text-muted-foreground">Study Content</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Course Module Stacks */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Courses</h2>
            <p className="text-sm text-muted-foreground">
              Navigate through each course using the module stacks below. Complete modules to advance automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {dashboardData.curricula.map((curriculum) => (
              <CourseModuleStack
                key={curriculum.id}
                curriculum={curriculum}
                modules={modulesByCurriculum[curriculum.id] || []}
              />
            ))}
          </div>
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
