"use client"

import { useUser } from "@stackframe/stack"
import { useEffect, useState } from "react"
import { fetchDashboardData, DailyModule, BookResource, OtherResource } from "@/lib/actions"
import { CurriculumData } from "@/lib/database"
import { AppLayout } from "@/components/app-layout"
import { CurriculaOverview } from "@/components/ui/curricula-overview"
import { LearningCalendar } from "@/components/ui/learning-calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, FileText, Clock } from "lucide-react"

interface DashboardData {
  curricula: CurriculumData[]
  dailyModules: DailyModule[]
  bookResources: BookResource[]
  otherResources: OtherResource[]
}

export default function Dashboard() {
  const user = useUser({ or: "redirect" })
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const result = await fetchDashboardData(user.id)
        if (result.success && result.data) {
          setDashboardData(result.data)
        } else {
          setError(result.error || 'Failed to load dashboard data')
        }
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  if (loading) {
    return (
      <AppLayout>
        <div className="h-full p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-2">Loading your learning dashboard...</h1>
              <p className="text-muted-foreground">Gathering your curriculum data</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="h-full p-6">
          <div className="max-w-7xl mx-auto">
            <Alert className="mb-6">
              <AlertDescription>
                Error loading dashboard: {error}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!dashboardData) {
    return (
      <AppLayout>
        <div className="h-full p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-2">Welcome to your learning dashboard</h1>
              <p className="text-muted-foreground">No data available</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate some summary stats
  const totalStudyTime = dashboardData.dailyModules.reduce((acc, module) => {
    const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
    return acc + time
  }, 0)

  const upcomingModules = dashboardData.dailyModules.filter(module => {
    const moduleDate = new Date(module.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return moduleDate >= today
  }).slice(0, 3)

  return (
    <AppLayout>
      <div className="h-full p-4 overflow-x-hidden">
        <div className="space-y-6 min-w-0">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Learning Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Your complete overview of everything you're learning
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">Active Curricula</p>
                    <p className="text-lg font-bold">{dashboardData.curricula.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs font-medium">Study Days</p>
                    <p className="text-lg font-bold">{dashboardData.dailyModules.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium">Required Books</p>
                    <p className="text-lg font-bold">{dashboardData.bookResources.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs font-medium">Total Hours</p>
                    <p className="text-lg font-bold">{Math.round(totalStudyTime / 60)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Curricula Overview */}
          <CurriculaOverview curricula={dashboardData.curricula} />

          {/* Main Grid Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2 min-w-0">
              <LearningCalendar modules={dashboardData.dailyModules} />
            </div>

            {/* Upcoming Modules */}
            <div className="min-w-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Upcoming Modules</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {upcomingModules.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingModules.map((module, index) => (
                        <div 
                          key={`${module.curriculumId}-${module.day}-${index}`}
                          className="flex items-start justify-between p-3 bg-muted rounded-md"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-medium text-sm line-clamp-1">
                              {module.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {module.curriculumTitle} • Day {module.day}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(module.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            {module.totalTime}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8 text-sm">
                      No upcoming modules scheduled
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
