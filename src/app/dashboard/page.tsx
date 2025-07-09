"use client"

import { AppLayout } from "@/components/app-layout"
import { LearningCalendar } from "@/components/ui/learning-calendar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { BookOpen, Plus, TrendingUp, Clock, Calendar, Target, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { DailyModule } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [modules, setModules] = useState<DailyModule[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration - replace with actual data fetching
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      // Generate some sample data for demonstration
      const sampleModules: DailyModule[] = [
        {
          curriculumId: 1,
          curriculumTitle: "Introduction to Web Development",
          day: 1,
          date: new Date().toISOString().split('T')[0],
          title: "HTML Fundamentals and Structure",
          totalTime: "2h 30m",
          primaryReadingTime: "1h 45m",
          supplementaryTime: "45m"
        },
        {
          curriculumId: 1,
          curriculumTitle: "Introduction to Web Development",
          day: 2,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          title: "CSS Styling and Layout",
          totalTime: "3h 15m",
          primaryReadingTime: "2h 30m",
          supplementaryTime: "45m"
        },
        {
          curriculumId: 2,
          curriculumTitle: "Advanced JavaScript Concepts",
          day: 1,
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          title: "Async/Await and Promises",
          totalTime: "2h 45m",
          primaryReadingTime: "2h",
          supplementaryTime: "45m"
        }
      ]
      setModules(sampleModules)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const todayModules = modules.filter(module => {
    const moduleDate = new Date(module.date)
    const today = new Date()
    moduleDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return moduleDate.getTime() === today.getTime()
  })

  const upcomingModules = modules.filter(module => {
    const moduleDate = new Date(module.date)
    const today = new Date()
    moduleDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return moduleDate > today
  }).slice(0, 3)

  const totalStudyTime = modules.reduce((acc, module) => {
    const time = parseInt(module.totalTime.replace(/\D/g, '')) || 60
    return acc + time
  }, 0)

  if (isMobile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Learning Overview</h1>
              <p className="text-sm text-muted-foreground">Track your progress</p>
            </div>
            <Button size="sm" asChild>
              <Link href="/new-curriculum">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Link>
            </Button>
          </div>

          {modules.length > 0 ? (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 py-4 border-y">
                <div className="text-center">
                  <div className="text-lg font-semibold">{todayModules.length}</div>
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{upcomingModules.length}</div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{Math.round(totalStudyTime / 60)}h</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>

              {/* Today's Schedule */}
              {todayModules.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Today&apos;s Schedule</h2>
                  <div className="space-y-2">
                    {todayModules.map((module) => (
                      <div key={`${module.curriculumId}-${module.day}`} className="p-3 rounded-lg border bg-primary/5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm leading-tight">{module.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{module.curriculumTitle}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs ml-2">{module.totalTime}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Calendar View</h2>
                <LearningCalendar modules={modules} />
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/library">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse Library
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/new-curriculum">
                      <div className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Curriculum
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Welcome state when no modules exist
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Welcome to Your Dashboard</h2>
              <p className="text-sm text-muted-foreground mb-6">Create your first curriculum to get started</p>
              <Button size="lg" asChild>
                <Link href="/new-curriculum">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Curriculum
                </Link>
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    )
  }

  // Desktop layout
  return (
    <AppLayout>
      <div className="h-full p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Track your learning progress and manage your study schedule
              </p>
            </div>
            <Button 
              onClick={() => router.push("/new-curriculum")}
              className="sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Curriculum
            </Button>
          </div>

          {/* Main Content */}
          {modules.length > 0 ? (
            <div className="space-y-8">
              {/* Learning Calendar */}
              <LearningCalendar modules={modules} />
            </div>
          ) : (
            // Welcome state when no modules exist
            <div className="space-y-8">
              {/* Welcome Banner */}
              <div className="text-center py-12 rounded-lg border">
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to Your Learning Dashboard</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Start your learning journey by creating your first curriculum
                </p>
                <Button 
                  size="lg" 
                  onClick={() => router.push("/new-curriculum")}
                  className="px-8"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Curriculum
                </Button>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-lg border">
                  <div className="mx-auto mb-4 p-3 bg-blue-100 rounded w-fit">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Personalized Content</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-generated curricula adapted to your knowledge level, learning style, and available time
                  </p>
                </div>

                <div className="text-center p-6 rounded-lg border">
                  <div className="mx-auto mb-4 p-3 bg-green-100 rounded w-fit">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Track Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your learning journey with detailed progress tracking and milestone achievements
                  </p>
                </div>

                <div className="text-center p-6 rounded-lg border">
                  <div className="mx-auto mb-4 p-3 bg-purple-100 rounded w-fit">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Flexible Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    Study at your own pace with schedules that adapt to your daily routine and commitments
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-lg border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Get Started
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={() => router.push("/new-curriculum")}
                  >
                    <div className="text-left">
                      <div className="font-medium">Create a Curriculum</div>
                      <div className="text-sm text-muted-foreground">Start with a new learning path</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={() => router.push("/library")}
                  >
                    <div className="text-left">
                      <div className="font-medium">Browse Library</div>
                      <div className="text-sm text-muted-foreground">Explore existing curricula</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
} 