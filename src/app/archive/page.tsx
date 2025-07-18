"use client"

import React from "react"
import { useUser } from "@stackframe/stack"
import { useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { filterCompletedCourses, getCourseCompletionStatuses, calculateCurrentCurriculumDay } from "@/lib/utils"
import { 
  Archive,
  BookOpen,
  Trophy,
  Calendar,
  Clock,
  RefreshCw
} from "lucide-react"
import { DashboardCurriculaOverview } from "@/components/dashboard/curricula-overview"

export default function ArchivePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = useUser({ or: "redirect" })
  const { dashboardData, loading, error } = useCachedDashboardData()
  const isMobile = useIsMobile()
  const [isHydrated, setIsHydrated] = useState(false)

  // Set hydrated state for SSR compatibility
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Filter completed curricula - only show courses with ALL modules marked as completed
  const completedCurricula = useMemo(() => {
    if (!dashboardData || !isHydrated) return []
    
    // Create a map of curriculum ID to total module count
    const moduleCounts = new Map<number, number>()
    dashboardData.dailyModules.forEach(module => {
      moduleCounts.set(module.curriculumId, (moduleCounts.get(module.curriculumId) || 0) + 1)
    })

    // Filter to only show fully completed courses
    return filterCompletedCourses(
      dashboardData.curricula, 
      dashboardData.moduleCompletions || [], 
      moduleCounts
    )
  }, [dashboardData, isHydrated])

  // Calculate archive statistics
  const archiveStats = useMemo(() => {
    if (!dashboardData || !completedCurricula.length) return null

    const completedModules = dashboardData.dailyModules.filter(module => 
      completedCurricula.some(curriculum => curriculum.id === module.curriculumId)
    )

    const totalStudyTime = completedModules.reduce((acc, module) => {
      const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
      return acc + time
    }, 0)

    const totalBooks = dashboardData.bookResources.filter(book =>
      completedCurricula.some(curriculum => curriculum.id === book.curriculumId)
    ).length

    const totalPapers = dashboardData.otherResources.filter(resource =>
      completedCurricula.some(curriculum => curriculum.id === resource.curriculumId)
    ).length

    return {
      totalCourses: completedCurricula.length,
      totalModules: completedModules.length,
      totalStudyHours: Math.round(totalStudyTime / 60),
      totalBooks,
      totalPapers
    }
  }, [dashboardData, completedCurricula])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load archive data: {error}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  if (!dashboardData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No data available</h2>
            <p className="text-sm text-muted-foreground">Unable to load archive data</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (completedCurricula.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No completed courses yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Complete your first course to see it in your archive. Courses appear here when you&apos;ve marked all modules as completed.
            </p>
            <Button asChild size={isMobile ? "default" : "lg"}>
              <Link href="/">
                <BookOpen className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl">
        {isMobile ? (
          // Mobile layout
          <div className="p-4 space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Archive className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Archive</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Your completed learning journey
              </p>
            </div>

            {/* Stats */}
            {archiveStats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg border">
                  <div className="flex items-center justify-center mb-1">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="text-lg font-semibold">{archiveStats.totalCourses}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-lg font-semibold">{archiveStats.totalStudyHours}h</div>
                  <div className="text-xs text-muted-foreground">Study Time</div>
                </div>
              </div>
            )}

            {/* Completed Curricula */}
            <DashboardCurriculaOverview 
              curricula={completedCurricula}
              dailyModules={dashboardData.dailyModules}
              showCompleted={true}
            />
          </div>
        ) : (
          // Desktop layout
          <div className="p-6 space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Archive className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Archive</h1>
                  <p className="text-muted-foreground">
                    Your completed learning journey
                  </p>
                </div>
              </div>

              {/* Stats */}
              {archiveStats && (
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center p-4 rounded-lg border">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-semibold">{archiveStats.totalCourses}</div>
                    <div className="text-sm text-muted-foreground">Courses Completed</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-semibold">{archiveStats.totalModules}</div>
                    <div className="text-sm text-muted-foreground">Modules Completed</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-semibold">{archiveStats.totalStudyHours}h</div>
                    <div className="text-sm text-muted-foreground">Study Hours</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border">
                    <div className="flex items-center justify-center mb-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-semibold">{archiveStats.totalBooks}</div>
                    <div className="text-sm text-muted-foreground">Books Read</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border">
                    <div className="flex items-center justify-center mb-2">
                      <Archive className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-2xl font-semibold">{archiveStats.totalPapers}</div>
                    <div className="text-sm text-muted-foreground">Papers Read</div>
                  </div>
                </div>
              )}
            </div>

            {/* Completed Curricula */}
            <DashboardCurriculaOverview 
              curricula={completedCurricula}
              dailyModules={dashboardData.dailyModules}
              showCompleted={true}
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
} 