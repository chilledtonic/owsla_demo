"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { BookOpen, Plus, TrendingUp, Clock } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()

  return (
    <AppLayout>
      <div className="h-full p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome to Your Learning Journey</h1>
            <p className="text-xl text-muted-foreground">
              Create personalized curricula tailored to your learning goals and interests
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
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
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
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
                <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Flexible Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Study at your own pace with schedules that adapt to your daily routine and commitments
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Card className="inline-block">
              <CardHeader>
                <CardTitle>Ready to Start Learning?</CardTitle>
                <CardDescription>
                  Create your first curriculum and begin your personalized learning experience
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
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 