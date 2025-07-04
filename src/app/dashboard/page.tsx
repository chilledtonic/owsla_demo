"use client"

import { AppLayout } from "@/components/app-layout"
import { LearningCalendar } from "@/components/ui/learning-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { BookOpen, Plus, TrendingUp, Clock, Calendar, Target } from "lucide-react"
import { useState, useEffect } from "react"
import { DailyModule } from "@/lib/actions"

export default function DashboardPage() {
  const router = useRouter()
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
        <div className="h-full p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 bg-muted rounded"></div>
                <div className="h-96 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

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
              <Card className="text-center py-12">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Welcome to Your Learning Dashboard</CardTitle>
                  <CardDescription className="text-lg">
                    Start your learning journey by creating your first curriculum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="lg" 
                    onClick={() => router.push("/new-curriculum")}
                    className="px-8"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Curriculum
                  </Button>
                </CardContent>
              </Card>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Personalized Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      AI-generated curricula adapted to your knowledge level, learning style, and available time
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Track Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Monitor your learning journey with detailed progress tracking and milestone achievements
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Flexible Scheduling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Study at your own pace with schedules that adapt to your daily routine and commitments
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Get Started
                  </CardTitle>
                  <CardDescription>
                    Here are some ways to begin your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
} 