"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, BookOpen } from "lucide-react"

interface CurriculumProps {
  curriculum: {
    title: string
    executive_overview: {
      learning_objective: string
      time_commitment: string
      prerequisites: string
      learning_outcome: string
    }
    visual_learning_path: Record<string, string>
    daily_modules: Array<{
      day: number
      title: string
      milestone: string
      primary_reading: {
        book: string
        chapters: string
        pages: string
      }
      time_allocation: string
    }>
  }
}

export function CurriculumContent({ curriculum }: CurriculumProps) {
  const currentDay = 1
  const totalDays = curriculum.daily_modules.length
  const progress = (currentDay / totalDays) * 100

  const currentModule = curriculum.daily_modules[currentDay - 1]

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{curriculum.title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {curriculum.executive_overview.learning_objective}
        </p>
      </div>

      {/* Current Reading Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-12 bg-muted rounded-none">
              <BookOpen className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-base font-medium">{currentModule.primary_reading.book}</CardTitle>
              <CardDescription className="text-xs">{currentModule.primary_reading.pages}</CardDescription>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground font-mono">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Module */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Day {currentModule.day}</CardTitle>
              <CardDescription className="mt-1">{currentModule.title}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {currentModule.milestone}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {currentModule.time_allocation}
          </div>
        </CardContent>
      </Card>

      {/* Learning Path Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Path</CardTitle>
          <CardDescription>Visual progression through course milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(curriculum.visual_learning_path).map(([key, milestone], index) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-medium ${
                    index < currentDay
                      ? "bg-primary text-primary-foreground"
                      : index === currentDay - 1
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`text-sm ${index === currentDay - 1 ? "font-medium" : "text-muted-foreground"}`}>
                  {milestone}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {curriculum.executive_overview.prerequisites}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Commitment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{curriculum.executive_overview.time_commitment}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
