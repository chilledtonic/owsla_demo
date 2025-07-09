"use client"

import { useUser } from "@stackframe/stack"
import { useEffect, useState } from "react"
import { fetchDashboardData, DailyModule, BookResource, OtherResource } from "@/lib/actions"
import { deduplicateBooks } from "@/lib/utils"
import { CurriculumData } from "@/lib/database"
import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
  Plus
} from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardData {
  curricula: CurriculumData[]
  dailyModules: DailyModule[]
  bookResources: BookResource[]
  otherResources: OtherResource[]
}

export default function Dashboard() {
  const user = useUser({ or: "redirect" })
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())

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

  const toggleModuleCompletion = (moduleKey: string) => {
    setCompletedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleKey)) {
        newSet.delete(moduleKey)
      } else {
        newSet.add(moduleKey)
      }
      return newSet
    })
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
        <div className="p-6">
          <Alert>
            <AlertDescription>Error loading dashboard: {error}</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  if (!dashboardData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Welcome to your learning dashboard</h2>
            <p className="text-sm text-muted-foreground mb-4">Create your first curriculum to get started</p>
            <Button onClick={() => router.push("/new-curriculum")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Curriculum
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Get today's modules and upcoming modules
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
  }).slice(0, 20) // Get more modules to show more days

  // Group upcoming modules by date
  const groupedUpcomingModules = upcomingModules.reduce((acc, module) => {
    const dateKey = new Date(module.date).toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(module)
    return acc
  }, {} as Record<string, DailyModule[]>)

  // Sort dates and get the next day for default expansion
  const sortedDates = Object.keys(groupedUpcomingModules).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )
  const nextDay = sortedDates[0] // First date is the next day

  const recentModules = dashboardData.dailyModules.filter(module => {
    const moduleDate = new Date(module.date)
    moduleDate.setHours(0, 0, 0, 0)
    const daysDiff = (today.getTime() - moduleDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff > 0 && daysDiff <= 7
  }).slice(0, 5)

  const totalCompletedToday = todayModules.filter(module => 
    completedModules.has(`${module.curriculumId}-${module.day}`)
  ).length

  const totalStudyTime = dashboardData.dailyModules.reduce((acc, module) => {
    const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
    return acc + time
  }, 0)

  // Get deduplicated book count for accurate display
  const uniqueBookCount = deduplicateBooks(dashboardData.bookResources).length

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
              {recentModules.map((module, index) => (
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
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs">
                  <BookOpenCheck className="h-3 w-3 mr-2 text-primary" />
                  Active Curricula
                </div>
                <span className="text-sm font-medium">{dashboardData.curricula.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs">
                  <Calendar className="h-3 w-3 mr-2 text-green-600" />
                  Total Modules
                </div>
                <span className="text-sm font-medium">{dashboardData.dailyModules.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs">
                  <BookOpen className="h-3 w-3 mr-2 text-blue-600" />
                  Unique Books
                </div>
                <span className="text-sm font-medium">{uniqueBookCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-2 text-orange-600" />
                  Total Hours
                </div>
                <span className="text-sm font-medium">{Math.round(totalStudyTime / 60)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => router.push("/new-curriculum")}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Curriculum
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => router.push("/library")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Library
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {/* Today's overview header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">
                {today.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {todayModules.length > 0 
                  ? `${todayModules.length} module${todayModules.length > 1 ? 's' : ''} scheduled today`
                  : 'No modules scheduled for today'
                }
              </p>
            </div>
            <div className="flex items-center space-x-6">
              {/* Quick stats in header */}
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{dashboardData.curricula.length}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{Math.round(totalStudyTime / 60)}h</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{totalCompletedToday}/{todayModules.length}</div>
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
          
          {todayModules.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(totalCompletedToday / todayModules.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round((totalCompletedToday / todayModules.length) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        
        {/* Today's Focus Section */}
        {todayModules.length > 0 && (
          <div className="border-b">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Today's Focus
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {todayModules.length} module{todayModules.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {todayModules.map((module, index) => {
                  const moduleKey = `${module.curriculumId}-${module.day}`
                  const isCompleted = completedModules.has(moduleKey)
                  
                  return (
                    <div 
                      key={moduleKey}
                      className={`group flex items-center p-4 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                        isCompleted 
                          ? 'bg-muted/50 border-muted' 
                          : 'bg-background hover:bg-muted/30'
                      }`}
                      onClick={() => toggleModuleCompletion(moduleKey)}
                    >
                      <button className="mr-4 shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1 pr-4">
                            <p className={`font-medium text-sm leading-tight mb-1 ${
                              isCompleted ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {module.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {module.curriculumTitle} • Day {module.day}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            {module.totalTime}
                          </Badge>
                        </div>
                      </div>
                      
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Coming Up Section - Grouped by Day */}
        {sortedDates.length > 0 && (
          <div>
            <div className="p-6">
              <h2 className="text-base font-semibold mb-4">Coming Up</h2>
              <div className="space-y-3">
                {sortedDates.map((dateKey) => {
                  const modules = groupedUpcomingModules[dateKey]
                  const date = new Date(dateKey)
                  const isNextDay = dateKey === nextDay
                  const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  
                  let dayLabel = date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })
                  
                  if (daysDiff === 1) {
                    dayLabel = `Tomorrow • ${dayLabel}`
                  } else if (daysDiff <= 7) {
                    dayLabel = `In ${daysDiff} days • ${dayLabel}`
                  }

                  return (
                    <Collapsible key={dateKey} defaultOpen={isNextDay}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                        <div className="flex items-center">
                          <ChevronDown className="h-4 w-4 mr-2 transition-transform duration-200 data-[state=closed]:rotate-180" />
                          <div className="text-left">
                            <p className="font-medium text-sm">{dayLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {modules.length} module{modules.length > 1 ? 's' : ''} • {
                                modules.reduce((acc, mod) => {
                                  const time = parseInt(mod.totalTime.replace(/\D/g, '')) || 60
                                  return acc + time
                                }, 0)
                              } min total
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {modules.length}
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 ml-6 space-y-2">
                        {modules.map((module) => (
                          <div 
                            key={`${module.curriculumId}-${module.day}-upcoming`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border cursor-pointer"
                            onClick={() => router.push(`/curriculum/${module.curriculumId}`)}
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
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
