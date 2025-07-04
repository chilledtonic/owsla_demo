"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookCover } from "@/components/ui/book-cover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Clock, Target, BookOpen, Lightbulb, CheckCircle, MapPin, Users, Calendar, Timer, ChevronLeft, ChevronRight } from "lucide-react"
import { getAmazonIsbnUrl, getDoiUrl, handleResourceClick } from "@/lib/utils"
import { ExpertRecommendation } from "./expert-recommendation"

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
    doi?: string
  }>
}

interface CurriculumProps {
  curriculum: {
    title: string
    executive_overview: string
    daily_modules: DailyModule[]
    visual_learning_path: Record<string, string>
    primary_resource: {
      title: string
      author: string
      isbn: string
    }
  }
  currentDay: number
  onPreviousDay: () => void
  onNextDay: () => void
}

export function CurriculumContent({ curriculum, currentDay, onPreviousDay, onNextDay }: CurriculumProps) {
  const totalDays = curriculum.daily_modules.length
  const progress = (currentDay / totalDays) * 100

  const currentModule = curriculum.daily_modules[currentDay - 1]
  const nextModule = currentDay < curriculum.daily_modules.length 
    ? curriculum.daily_modules[currentDay] 
    : null

  const handlePrimaryBookClick = () => {
    if (curriculum.primary_resource.isbn && curriculum.primary_resource.isbn !== 'N/A') {
      const url = getAmazonIsbnUrl(curriculum.primary_resource.isbn)
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const handleSupplementaryClick = (reading: { isbn?: string; doi?: string }) => {
    handleResourceClick(reading)
  }

  return (
    <div className="flex-1 p-6 space-y-6 max-w-5xl">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{curriculum.title}</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            {curriculum.executive_overview}
          </p>
        </div>
        
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">Day {currentDay} of {totalDays}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Today's Focus - Most Important Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Today's Focus - Day {currentModule.day}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousDay}
                disabled={currentDay === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextDay}
                disabled={currentDay === totalDays}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-base font-medium text-foreground">
            {currentModule.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Insights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold">Key Insights</h3>
            </div>
            <ul className="space-y-2">
              {currentModule.key_insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Concepts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold">Core Concepts to Master</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentModule.core_concepts.map((concept, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                  <span className="leading-relaxed">{concept}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Time Management */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="h-4 w-4 text-green-500" />
              <h3 className="font-semibold">Time Allocation</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-lg">{currentModule.time_allocation.total}</div>
                <div className="text-muted-foreground">Total Time</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-lg">{currentModule.time_allocation.primary_text}</div>
                <div className="text-muted-foreground">Primary Reading</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-lg">{currentModule.time_allocation.supplementary_materials}</div>
                <div className="text-muted-foreground">Supplementary</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Guide & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Reading */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <CardTitle className="text-lg">Reading Guide</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors" onClick={handlePrimaryBookClick}>
              <BookCover 
                isbn={curriculum.primary_resource.isbn}
                title={curriculum.primary_resource.title}
                className="h-20 w-15 flex-shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{curriculum.primary_resource.title}</h4>
                <p className="text-xs text-muted-foreground">{curriculum.primary_resource.author}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Focus Areas</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentModule.primary_reading_focus}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Practical Applications */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <CardTitle className="text-lg">Practical Connections</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {currentModule.practical_connections}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Objectives & Self-Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Objectives & Self-Assessment</CardTitle>
          <CardDescription>Use these benchmarks to evaluate your understanding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(currentModule.knowledge_benchmark).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="font-medium text-sm capitalize bg-muted px-2 py-1 rounded">
                  {key}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expert Recommendation */}
      <ExpertRecommendation 
        curriculumTitle={curriculum.title}
        curriculumTopics={currentModule.core_concepts}
      />

      {/* Expandable Sections */}
      <Accordion type="single" collapsible className="w-full">
        {/* Supplementary Resources */}
        <AccordionItem value="supplementary">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Supplementary Resources ({currentModule.supplementary_readings.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-4">
              {currentModule.supplementary_readings.map((reading, index) => (
                <Card 
                  key={index} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => handleSupplementaryClick(reading)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{reading.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {reading.reading_time}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{reading.author}</p>
                    <p className="text-sm leading-relaxed">{reading.focus}</p>
                  </div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Course Overview */}
        <AccordionItem value="overview">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Complete Learning Path
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-3">
              {Object.entries(curriculum.visual_learning_path).map(([key, milestone], index) => (
                <div key={key} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      index < currentDay
                        ? "bg-primary text-primary-foreground"
                        : index === currentDay - 1
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className={`text-sm font-medium ${index === currentDay - 1 ? "text-primary" : ""}`}>
                      Day {index + 1}
                    </div>
                    <div className={`text-sm leading-relaxed ${index === currentDay - 1 ? "font-medium" : "text-muted-foreground"}`}>
                      {milestone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Next Up Preview */}
      {nextModule && (
        <Card className="border-dashed border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-muted-foreground">Coming Up Next</CardTitle>
            <CardDescription>Day {nextModule.day}: {nextModule.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {nextModule.key_insights?.[0] || "Continue your learning journey"}
            </p>
          </CardContent>
        </Card>
      )}
      
      {currentDay === totalDays && (
        <Card className="border-dashed border-2 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-700 dark:text-green-300">Course Complete!</CardTitle>
            <CardDescription>You've reached the end of this curriculum</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Congratulations on completing your learning journey. Consider creating a new curriculum to continue exploring new topics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
