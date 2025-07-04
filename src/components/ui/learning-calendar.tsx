"use client"

import { DailyModule } from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Calendar } from "./calendar"
import { Badge } from "./badge"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { ScrollArea } from "./scroll-area"
import { Separator } from "./separator"
import { Clock, BookOpen, Calendar as CalendarIcon, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface LearningCalendarProps {
  modules: DailyModule[]
}

export function LearningCalendar({ modules }: LearningCalendarProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Create a map of dates to modules
  const modulesByDate = modules.reduce((acc, module) => {
    const dateKey = module.date
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(module)
    return acc
  }, {} as Record<string, DailyModule[]>)

  // Get modules for selected date
  const selectedDateModules = selectedDate 
    ? modulesByDate[selectedDate.toISOString().split('T')[0]] || []
    : []

  // Create date objects for calendar highlighting
  const moduleDates = modules.map(module => new Date(module.date))

  if (modules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Learning Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No scheduled learning modules
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Calendar Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Learning Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Large Calendar */}
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasModule: moduleDates
                }}
                modifiersClassNames={{
                  hasModule: "bg-primary/20 text-primary font-semibold hover:bg-primary/30"
                }}
                className="rounded-lg border w-full [--cell-size:3rem]"
              />
            </div>

            {/* Selected Date Overview */}
            <div className="xl:w-80 space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'Select a date'}
                </h3>
                
                {selectedDateModules.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedDateModules.length} module{selectedDateModules.length > 1 ? 's' : ''} scheduled
                    </p>
                    
                    <ScrollArea className="h-72">
                      <div className="space-y-2">
                        {selectedDateModules.map((module, index) => (
                          <div
                            key={`${module.curriculumId}-${module.day}-${index}`}
                            className="group cursor-pointer"
                            onClick={() => router.push(`/curriculum/${module.curriculumId}`)}
                          >
                            <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm leading-tight mb-1">
                                      {module.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {module.curriculumTitle} • Day {module.day}
                                    </p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {module.totalTime}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : selectedDate ? (
                  <p className="text-muted-foreground text-sm">
                    No learning modules scheduled for this date
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Select a date to view scheduled modules
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats & Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Modules</p>
                <p className="text-lg font-bold">{modules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Curricula</p>
                <p className="text-lg font-bold">
                  {new Set(modules.map(m => m.curriculumId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Today's Modules</p>
                <p className="text-lg font-bold">
                  {modulesByDate[new Date().toISOString().split('T')[0]]?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Modules */}
      {modules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {modules
                  .filter(module => new Date(module.date) >= new Date())
                  .slice(0, 5)
                  .map((module, index) => (
                    <div
                      key={`${module.curriculumId}-${module.day}-upcoming-${index}`}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => router.push(`/curriculum/${module.curriculumId}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground min-w-16">
                          {new Date(module.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{module.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {module.curriculumTitle}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {module.totalTime}
                      </Badge>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 