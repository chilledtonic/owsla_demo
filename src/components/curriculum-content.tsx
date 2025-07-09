"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookCover } from "@/components/ui/book-cover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Target, Lightbulb, CheckCircle, MapPin, Calendar, Timer, ChevronLeft, ChevronRight } from "lucide-react"
import { handleResourceClick, getCurriculumProgressStatus, getRelativeDateInfo } from "@/lib/utils"

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
  actualDay: number
  onPreviousDay: () => void
  onNextDay: () => void
}

export function CurriculumContent({ curriculum, currentDay, actualDay, onPreviousDay, onNextDay }: CurriculumProps) {
  const totalDays = curriculum.daily_modules.length
  const actualProgress = (actualDay / totalDays) * 100

  const currentModule = curriculum.daily_modules[currentDay - 1]
  const nextModule = currentDay < curriculum.daily_modules.length 
    ? curriculum.daily_modules[currentDay] 
    : null

  const progressStatus = getCurriculumProgressStatus(currentDay, actualDay, currentModule.date)
  const currentDateInfo = getRelativeDateInfo(currentModule.date)

  const handleSupplementaryClick = (reading: { title: string; author: string; isbn?: string; doi?: string }) => {
    handleResourceClick(reading)
  }

  return (
    <div className="flex-1">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden border-b bg-background p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">{curriculum.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Day {currentDay} of {totalDays}</span>
                <Badge variant={progressStatus.variant} className="text-xs">
                  {progressStatus.status === 'on-schedule' ? 'Current' : 
                   progressStatus.status === 'preview' ? 'Preview' : 
                   progressStatus.status === 'ahead' ? 'Ahead' : 'Behind'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentDateInfo.formattedDate}
                {currentDateInfo.isToday && (
                  <span className="ml-1 text-primary font-medium">• Today</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(actualProgress)}%
          </span>
        </div>
        <Progress value={actualProgress} className="h-2 mb-1" />
        <div className="text-xs text-muted-foreground mb-3">
          {progressStatus.message}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousDay}
            disabled={currentDay === 1}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextDay}
            disabled={currentDay === totalDays}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Desktop Header - Only visible on desktop */}
      <div className="hidden lg:block p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{curriculum.title}</h1>
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
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Your Progress</span>
            <Badge variant={progressStatus.variant}>
              {progressStatus.status === 'on-schedule' ? 'Current' : 
               progressStatus.status === 'preview' ? 'Preview' : 
               progressStatus.status === 'ahead' ? 'Ahead' : 'Behind'} Day {currentDay}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            Completed {actualDay} of {totalDays} days
          </span>
        </div>
        <Progress value={actualProgress} className="h-2" />
        <div className="text-xs text-muted-foreground mt-1">
          {progressStatus.message}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-6 space-y-6">
        {/* Today's Focus Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg lg:text-xl font-semibold">Day {currentModule.day}: {currentModule.title}</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentDateInfo.formattedDate}
              {currentDateInfo.isToday && (
                <span className="ml-1 text-primary font-medium">• Today</span>
              )}
            </div>
          </div>
          
          {/* Mobile: Stack vertically, Desktop: Grid */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Key Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h3 className="font-medium text-sm">Key Insights</h3>
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
                <h3 className="font-medium text-sm">Core Concepts</h3>
              </div>
              <ul className="space-y-2">
                {currentModule.core_concepts.map((concept, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                    <span className="leading-relaxed">{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Time Allocation */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Timer className="h-4 w-4 text-green-500" />
                <h3 className="font-medium text-sm">Time Allocation</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Time:</span>
                  <span className="font-medium">{currentModule.time_allocation.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primary Reading:</span>
                  <span>{currentModule.time_allocation.primary_text}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplementary:</span>
                  <span>{currentModule.time_allocation.supplementary_materials}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Practical Connections - Mobile friendly */}
        <div className="lg:hidden">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4" />
            <h3 className="font-medium">Practical Connections</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {currentModule.practical_connections}
          </p>
        </div>

        {/* Learning Objectives Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Learning Objectives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Object.entries(currentModule.knowledge_benchmark).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="font-medium text-sm capitalize bg-muted/50 px-3 py-1 rounded-full text-center">
                  {key}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed px-1">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Practical Connections */}
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold mb-4">Practical Connections</h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-4xl">
            {currentModule.practical_connections}
          </p>
        </div>

        {/* Supplementary Resources - Prominent Display */}
        {currentModule.supplementary_readings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Supplementary Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentModule.supplementary_readings.map((reading, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors" 
                  onClick={() => handleSupplementaryClick(reading)}
                >
                  {reading.isbn ? (
                    // Display with book cover if ISBN exists
                    <div className="flex gap-3 mb-3">
                      <BookCover 
                        isbn={reading.isbn}
                        title={reading.title}
                        className="h-16 w-12 flex-shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm leading-tight">{reading.title}</h4>
                          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                            {reading.reading_time}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{reading.author}</p>
                      </div>
                    </div>
                  ) : (
                    // Default display for papers/articles
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm leading-tight">{reading.title}</h4>
                        <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                          {reading.reading_time}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{reading.author}</p>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{reading.focus}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable Sections */}
        <div>
          <Accordion type="single" collapsible className="w-full">
            {/* Course Overview - Only on desktop */}
            <AccordionItem value="overview" className="border-none hidden lg:block">
              <AccordionTrigger className="text-left hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Complete Learning Path</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {Object.entries(curriculum.visual_learning_path).map(([key, milestone], index) => (
                    <div key={key} className="flex items-start gap-3 p-3 rounded border hover:bg-muted/30 transition-colors">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                          index < actualDay
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
        </div>

        {/* Next Up Preview */}
        {nextModule && (
          <div className="p-4 lg:p-6 border rounded-lg bg-muted/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                {nextModule.day}
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Coming Up Next</h3>
                <p className="font-medium">{nextModule.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {nextModule.key_insights?.[0] || "Continue your learning journey"}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {currentDay === totalDays && (
          <div className="p-4 lg:p-6 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
            <div className="text-center">
              <h3 className="font-medium text-green-700 dark:text-green-300 mb-1">Course Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Congratulations on completing your learning journey. Consider creating a new curriculum to continue exploring new topics.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
