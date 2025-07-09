"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import { 
  Calendar, 
  Timer,
  TrendingUp,
  PlayCircle,
  PauseCircle,
  Target, 
  BookOpen
} from "lucide-react"
import * as React from "react"
import { handleResourceClick } from "@/lib/utils"
import { useEffect } from "react"

interface DailyModule {
  day: number
  date: string
  title: string
  key_insights: string[]
  core_concepts: string[]
  time_allocation: {
    total: string
    primary_text: string
    supplementary_materials: string
  }
  knowledge_benchmark: {
    connect: string
    explain: string
    awareness: string
    recognize: string
    understand: string
  }
  practical_connections: string
  primary_reading_focus: string
  supplementary_readings: Array<{
    title: string
    author: string
    reading_time: string
    focus: string
    isbn?: string
  }>
}

interface RightSidebarProps {
  currentModule?: DailyModule
  totalDays?: number
  currentDay?: number
  nextModules?: DailyModule[]
}

export function RightSidebar({ 
  currentModule, 
  totalDays = 10, 
  currentDay = 1, 
  nextModules = [] 
}: RightSidebarProps) {
  const [studyTimer, setStudyTimer] = React.useState(0)
  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [completedConcepts, setCompletedConcepts] = React.useState<Set<number>>(new Set())
  const [completedBenchmarks, setCompletedBenchmarks] = React.useState<Set<string>>(new Set())

  // Helper to get localStorage keys
  const getConceptsKey = React.useCallback(() => currentModule ? `concepts-completion-${currentModule.day}` : '', [currentModule])
  const getBenchmarksKey = React.useCallback(() => currentModule ? `benchmarks-completion-${currentModule.day}` : '', [currentModule])

  // Load completed concepts/benchmarks from localStorage on mount or when module changes
  useEffect(() => {
    if (!currentModule) return
    if (typeof window !== "undefined") {
      const cKey = getConceptsKey()
      const bKey = getBenchmarksKey()
      if (cKey) {
        const storedConcepts = localStorage.getItem(cKey)
        if (storedConcepts) {
          try {
            setCompletedConcepts(new Set(JSON.parse(storedConcepts)))
          } catch {}
        } else {
          setCompletedConcepts(new Set())
        }
      }
      if (bKey) {
        const storedBenchmarks = localStorage.getItem(bKey)
        if (storedBenchmarks) {
          try {
            setCompletedBenchmarks(new Set(JSON.parse(storedBenchmarks)))
          } catch {}
        } else {
          setCompletedBenchmarks(new Set())
        }
      }
    }
  }, [currentModule, getBenchmarksKey, getConceptsKey])

  // Save completed concepts/benchmarks to localStorage whenever they change
  useEffect(() => {
    if (!currentModule) return
    if (typeof window !== "undefined") {
      const cKey = getConceptsKey()
      const bKey = getBenchmarksKey()
      if (cKey) {
        localStorage.setItem(cKey, JSON.stringify(Array.from(completedConcepts)))
      }
      if (bKey) {
        localStorage.setItem(bKey, JSON.stringify(Array.from(completedBenchmarks)))
      }
    }
  }, [completedConcepts, completedBenchmarks, currentModule, getBenchmarksKey, getConceptsKey])

  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStudyTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const toggleConcept = (index: number) => {
    const newCompleted = new Set(completedConcepts)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedConcepts(newCompleted)
  }

  const toggleBenchmark = (key: string) => {
    const newCompleted = new Set(completedBenchmarks)
    if (newCompleted.has(key)) {
      newCompleted.delete(key)
    } else {
      newCompleted.add(key)
    }
    setCompletedBenchmarks(newCompleted)
  }

  const progress = (currentDay / totalDays) * 100
  const conceptsProgress = currentModule ? (completedConcepts.size / currentModule.core_concepts.length) * 100 : 0
  const benchmarkProgress = currentModule ? (completedBenchmarks.size / Object.keys(currentModule.knowledge_benchmark).length) * 100 : 0

  return (
    <div className="w-80 border-l bg-muted/10 p-4 space-y-4 self-stretch">
      {/* Study Session Timer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Study Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold">
              {formatTime(studyTimer)}
            </div>
            <div className="text-xs text-muted-foreground">
              Today&apos;s Study Time
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isTimerRunning ? "destructive" : "default"}
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="flex-1"
            >
              {isTimerRunning ? (
                <>
                  <PauseCircle className="h-3 w-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStudyTimer(0)
                setIsTimerRunning(false)
              }}
            >
              Reset
            </Button>
          </div>
          {currentModule && (
            <div className="text-xs text-muted-foreground text-center">
              Target: {currentModule.time_allocation.total}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Course Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              Day {currentDay} of {totalDays}
            </div>
          </div>

          {currentModule && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Today&apos;s Concepts</span>
                  <span>{Math.round(conceptsProgress)}%</span>
                </div>
                <Progress value={conceptsProgress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {completedConcepts.size} of {currentModule.core_concepts.length} completed
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Learning Objectives</span>
                  <span>{Math.round(benchmarkProgress)}%</span>
                </div>
                <Progress value={benchmarkProgress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {completedBenchmarks.size} of {Object.keys(currentModule.knowledge_benchmark).length} mastered
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Today's Learning Checklist */}
      {currentModule && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Today&apos;s Checklist
            </CardTitle>
            <CardDescription className="text-xs">Track your mastery of core concepts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Core Concepts</h4>
              {currentModule.core_concepts.map((concept, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Checkbox
                    checked={completedConcepts.has(index)}
                    onCheckedChange={() => toggleConcept(index)}
                    className="mt-0.5"
                  />
                  <span className={`text-xs leading-relaxed ${completedConcepts.has(index) ? 'line-through text-muted-foreground' : ''}`}>
                    {concept}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Learning Objectives</h4>
              {Object.entries(currentModule.knowledge_benchmark).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <Checkbox
                    checked={completedBenchmarks.has(key)}
                    onCheckedChange={() => toggleBenchmark(key)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <span className={`text-xs font-medium capitalize ${completedBenchmarks.has(key) ? 'line-through text-muted-foreground' : ''}`}>
                      {key}
                    </span>
                    <p className={`text-xs leading-relaxed ${completedBenchmarks.has(key) ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access Resources */}
      {currentModule && currentModule.supplementary_readings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Quick Resources
            </CardTitle>
            <CardDescription className="text-xs">Supplementary readings for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentModule.supplementary_readings.map((reading, index) => (
                <div
                  key={index}
                  className="p-2 bg-muted/30 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleResourceClick(reading)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-xs font-medium leading-tight">{reading.title}</h5>
                    <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                      {reading.reading_time}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{reading.author}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Schedule */}
      {nextModules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Coming Up
            </CardTitle>
            <CardDescription className="text-xs">Next few days in your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextModules.slice(0, 3).map((module, index) => (
                <div key={module.day} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Day {module.day}</span>
                    <span className="text-xs text-muted-foreground">{module.date}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{module.title}</p>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Next Up
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
