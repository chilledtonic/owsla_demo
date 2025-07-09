"use client"

import { useUser } from "@stackframe/stack"
import { useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { deduplicateBooks, calculateCurrentCurriculumDay } from "@/lib/utils"
import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import React, { useState, useCallback, useMemo } from "react"
import { CurriculumData } from "@/lib/database"
import { DailyModule } from "@/lib/actions"
import { cn } from "@/lib/utils"

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
  RefreshCw,
  Play,
  Pause
} from "lucide-react"

export default function Dashboard() {
  useUser({ or: "redirect" })
  const { dashboardData, loading, error, refresh } = useCachedDashboardData()
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())
  const isMobile = useIsMobile()

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

  if (!dashboardData || !calculatedData) {
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

  const { todayModules, sortedDates, groupedUpcomingModules, recentModules, totalStudyTime, uniqueBookCount, nextDay } = calculatedData

  // Mobile-optimized layout
  if (isMobile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          {/* Today's Progress Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Today&apos;s Focus</h1>
              <Badge variant="secondary" className="text-xs">
                {totalCompletedToday}/{todayModules.length}
              </Badge>
            </div>
            
            {todayModules.length > 0 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(totalCompletedToday / todayModules.length) * 100}%` 
                  }}
                />
              </div>
            )}
          </div>

          {/* Today's Modules */}
          <TodaysFocus 
            modules={todayModules} 
            completedModules={completedModules}
            onToggleCompletion={toggleModuleCompletion}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 py-4 border-y">
            <div className="text-center">
              <div className="text-lg font-semibold">{dashboardData.curricula.length}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{Math.round(totalStudyTime / 60)}h</div>
              <div className="text-xs text-muted-foreground">Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{uniqueBookCount}</div>
              <div className="text-xs text-muted-foreground">Books</div>
            </div>
          </div>

          {/* Upcoming Preview */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Coming Up</h2>
            <UpcomingSchedule 
              sortedDates={sortedDates.slice(0, 3)} 
              groupedModules={groupedUpcomingModules}
              nextDay={nextDay}
            />
          </div>

          {/* Curricula Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Curricula</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/new-curriculum">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Link>
              </Button>
            </div>
            <CurriculaOverview 
              curricula={dashboardData.curricula}
              dailyModules={dashboardData.dailyModules}
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
                <h1 className="text-2xl font-bold">Today&apos;s Focus</h1>
                <p className="text-sm text-muted-foreground">
                  {todayModules.length > 0 
                    ? `${todayModules.length} modules to complete today`
                    : "No modules scheduled for today"
                  }
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{totalCompletedToday}/{todayModules.length}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <div className="text-xs font-medium">
                    {todayModules.length > 0 ? Math.round((totalCompletedToday / todayModules.length) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-8">
          {/* Today's Focus */}
          <TodaysFocus 
            modules={todayModules} 
            completedModules={completedModules}
            onToggleCompletion={toggleModuleCompletion}
          />

          {/* Upcoming Schedule */}
          <UpcomingSchedule 
            sortedDates={sortedDates.slice(0, 5)} 
            groupedModules={groupedUpcomingModules}
            nextDay={nextDay}
          />

          {/* Curricula Overview */}
          <CurriculaOverview 
            curricula={dashboardData.curricula}
            dailyModules={dashboardData.dailyModules}
          />
        </div>
      </div>
    </AppLayout>
  )
}

// Rest of the existing components with mobile optimizations
const TodaysFocus = React.memo(function TodaysFocus({ 
  modules, 
  completedModules, 
  onToggleCompletion 
}: {
  modules: DailyModule[]
  completedModules: Set<string>
  onToggleCompletion: (key: string) => void
}) {
  const isMobile = useIsMobile()

  if (modules.length === 0) {
    return (
      <div className={cn("text-center py-8", isMobile && "py-6")}>
        <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-medium mb-2">No modules for today</h3>
        <p className="text-sm text-muted-foreground">
          {isMobile ? "Enjoy your free day!" : "Take a well-deserved break or get ahead on tomorrow's work."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!isMobile && (
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Today&apos;s Focus</h2>
          <Badge variant="outline">{modules.length} modules</Badge>
        </div>
      )}
      
      <div className={cn("space-y-3", !isMobile && "space-y-4")}>
        {modules.map((module) => (
          <TodayModule
            key={`${module.curriculumId}-${module.day}`}
            module={module}
            isCompleted={completedModules.has(`${module.curriculumId}-${module.day}`)}
            onToggleCompletion={onToggleCompletion}
          />
        ))}
      </div>
    </div>
  )
})

const TodayModule = React.memo(function TodayModule({
  module,
  isCompleted,
  onToggleCompletion
}: {
  module: DailyModule
  isCompleted: boolean
  onToggleCompletion: (key: string) => void
}) {
  const isMobile = useIsMobile()
  const moduleKey = `${module.curriculumId}-${module.day}`

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-all duration-200",
        isCompleted 
          ? "bg-primary/5 border-primary/20" 
          : "bg-background hover:bg-muted/50",
        isMobile && "p-3 gap-2"
      )}
    >
      <button
        onClick={() => onToggleCompletion(moduleKey)}
        className="mt-1 flex-shrink-0"
      >
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className={cn("flex items-start gap-2 mb-2", isMobile && "flex-col gap-1")}>
          <h3 className={cn(
            "font-medium leading-tight",
            isCompleted && "line-through text-muted-foreground",
            isMobile && "text-sm"
          )}>
            {module.title}
          </h3>
          {!isMobile && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {module.curriculumTitle}
            </Badge>
          )}
        </div>
        
        {isMobile && (
          <div className="text-xs text-muted-foreground mb-2">
            {module.curriculumTitle}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{module.totalTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Day {module.day}</span>
          </div>
        </div>
      </div>
      
      {!isMobile && (
        <div className="flex-shrink-0">
          {isCompleted ? (
            <Button variant="ghost" size="sm" className="text-primary">
              <Pause className="h-4 w-4 mr-1" />
              Completed
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

const UpcomingSchedule = React.memo(function UpcomingSchedule({
  sortedDates,
  groupedModules,
  nextDay
}: {
  sortedDates: string[]
  groupedModules: Record<string, DailyModule[]>
  nextDay: string
}) {
  const isMobile = useIsMobile()

  if (sortedDates.length === 0) {
    return (
      <div className={cn("text-center py-8", isMobile && "py-6")}>
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-medium mb-2">No upcoming modules</h3>
        <p className="text-sm text-muted-foreground">
          {isMobile ? "All caught up!" : "You're all caught up with your curricula schedule."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!isMobile && (
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Upcoming Schedule</h2>
          <Badge variant="outline">{sortedDates.length} days</Badge>
        </div>
      )}
      
      <div className={cn("space-y-3", !isMobile && "space-y-4")}>
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
  modules: DailyModule[]
  isNextDay: boolean
}) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(isNextDay)
  const date = new Date(dateKey)
  
  const isToday = date.toDateString() === new Date().toDateString()
  const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString()
  
  let displayDate = date.toLocaleDateString('en-US', { 
    weekday: isMobile ? 'short' : 'long', 
    month: 'short', 
    day: 'numeric' 
  })
  
  if (isTomorrow) displayDate = `Tomorrow (${displayDate})`
  if (isToday) displayDate = `Today (${displayDate})`

  const totalTime = modules.reduce((acc, module) => {
    const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
    return acc + time
  }, 0)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className={cn(
        "flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors",
        isNextDay && "border-primary/50 bg-primary/5",
        isMobile && "p-2"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isNextDay ? "bg-primary" : "bg-muted-foreground"
          )} />
          <div className="text-left">
            <div className={cn(
              "font-medium",
              isMobile && "text-sm"
            )}>
              {displayDate}
            </div>
            <div className="text-xs text-muted-foreground">
              {modules.length} modules • {Math.round(totalTime / 60)}h {totalTime % 60}m
            </div>
          </div>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2">
        <div className={cn("ml-5 space-y-2", isMobile && "ml-3")}>
          {modules.map((module) => (
            <div 
              key={`${module.curriculumId}-${module.day}`}
              className={cn(
                "flex items-center justify-between p-2 rounded border-l-2 border-muted bg-muted/20",
                isMobile && "p-1.5"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className={cn(
                  "font-medium text-sm truncate",
                  isMobile && "text-xs"
                )}>
                  {module.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {module.curriculumTitle} • {module.totalTime}
                </div>
              </div>
              {!isMobile && (
                <Badge variant="secondary" className="text-xs ml-2">
                  Day {module.day}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
})

const CurriculaOverview = React.memo(function CurriculaOverview({
  curricula,
  dailyModules
}: {
  curricula: CurriculumData[]
  dailyModules: DailyModule[]
}) {
  const isMobile = useIsMobile()

  if (curricula.length === 0) {
    return (
      <div className={cn("text-center py-8", isMobile && "py-6")}>
        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-medium mb-2">No curricula yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isMobile ? "Create your first curriculum to get started" : "Start your learning journey by creating your first curriculum"}
        </p>
        <Button asChild size={isMobile ? "default" : "lg"}>
          <Link href="/new-curriculum">
            <Plus className="h-4 w-4 mr-2" />
            Create Curriculum
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!isMobile && (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Your Curricula</h2>
          <Badge variant="outline">{curricula.length} active</Badge>
        </div>
      )}
      
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {curricula.map((curriculum) => (
          <CurriculumCard
            key={curriculum.id}
            curriculum={curriculum}
            dailyModules={dailyModules}
          />
        ))}
      </div>
    </div>
  )
})

const CurriculumCard = React.memo(function CurriculumCard({
  curriculum,
  dailyModules
}: {
  curriculum: CurriculumData
  dailyModules: DailyModule[]
}) {
  const isMobile = useIsMobile()
  const curriculumModules = dailyModules.filter(m => m.curriculumId === curriculum.id)
  const { currentDay } = calculateCurrentCurriculumDay(curriculumModules)
  
  // Calculate progress status based on current day
  const totalDays = curriculumModules.length
  const progressPercentage = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0
  
  let progressStatus = 'upcoming'
  if (progressPercentage >= 100) progressStatus = 'completed'
  else if (progressPercentage > 0) progressStatus = 'in-progress'
  
  const statusColor = {
    'completed': 'text-green-600',
    'in-progress': 'text-blue-600', 
    'upcoming': 'text-orange-600',
    'overdue': 'text-red-600'
  }[progressStatus] || 'text-muted-foreground'

  const statusLabel = {
    'completed': 'Completed',
    'in-progress': 'In Progress',
    'upcoming': 'Upcoming', 
    'overdue': 'Behind Schedule'
  }[progressStatus] || 'Unknown'

  return (
    <Link href={`/curriculum/${curriculum.id}`}>
      <div className={cn(
        "p-4 rounded-lg border hover:bg-muted/50 transition-colors",
        isMobile && "p-3"
      )}>
        <div className="flex items-start justify-between mb-3">
          <h3 className={cn(
            "font-medium leading-tight",
            isMobile && "text-sm"
          )}>
            {curriculum.title}
          </h3>
          <Badge variant="secondary" className={cn(statusColor, "text-xs")}>
            {statusLabel}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Day {currentDay} of {curriculumModules.length}</span>
            <span>{Math.round((currentDay / curriculumModules.length) * 100)}%</span>
          </div>
          
                     <div className="w-full bg-muted rounded-full h-1.5">
             <div 
               className="bg-primary h-1.5 rounded-full transition-all duration-300"
               style={{ width: `${progressPercentage}%` }}
             />
           </div>
           
           {!isMobile && curriculum.topic && (
             <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
               {curriculum.topic}
             </p>
           )}
        </div>
      </div>
    </Link>
  )
})
