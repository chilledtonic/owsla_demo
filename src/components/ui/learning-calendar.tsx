"use client"

import { DailyModule } from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Calendar } from "./calendar"
import { Badge } from "./badge"
import { Clock, BookOpen } from "lucide-react"
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
          <CardTitle>Learning Schedule</CardTitle>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Learning Schedule</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="min-w-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                hasModule: moduleDates
              }}
              modifiersClassNames={{
                hasModule: "bg-primary text-primary-foreground font-bold"
              }}
              className="rounded-md border w-full"
            />
          </div>

          {/* Selected date details */}
          <div className="space-y-4 min-w-0">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm mb-3">
                {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Select a date'}
              </h3>
              
              {selectedDateModules.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateModules.map((module, index) => (
                    <Card 
                      key={`${module.curriculumId}-${module.day}-${index}`}
                      className="cursor-pointer hover:shadow-md transition-shadow min-w-0"
                      onClick={() => router.push(`/curriculum/${module.curriculumId}`)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2">
                                {module.title}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {module.curriculumTitle} • Day {module.day}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              <Clock className="h-3 w-3 mr-1" />
                              {module.totalTime}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>Primary: {module.primaryReadingTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>Supp: {module.supplementaryTime}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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

            {/* Quick stats */}
            {modules.length > 0 && (
              <div className="pt-3 border-t">
                <h4 className="font-medium text-sm mb-3">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted p-3 rounded min-w-0">
                    <p className="font-medium">Total Days</p>
                    <p className="text-muted-foreground">{modules.length}</p>
                  </div>
                  <div className="bg-muted p-3 rounded min-w-0">
                    <p className="font-medium">Active Curricula</p>
                    <p className="text-muted-foreground">
                      {new Set(modules.map(m => m.curriculumId)).size}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 