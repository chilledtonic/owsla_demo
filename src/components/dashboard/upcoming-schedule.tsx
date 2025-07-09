"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { DailyModule } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Calendar,
  ChevronRight,
  ChevronDown
} from "lucide-react"

interface UpcomingScheduleProps {
  sortedDates: string[]
  groupedModules: Record<string, DailyModule[]>
  nextDay: string
}

export const UpcomingSchedule = React.memo(function UpcomingSchedule({
  sortedDates,
  groupedModules,
  nextDay
}: UpcomingScheduleProps) {
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

interface UpcomingDayProps {
  dateKey: string
  modules: DailyModule[]
  isNextDay: boolean
}

const UpcomingDay = React.memo(function UpcomingDay({
  dateKey,
  modules,
  isNextDay
}: UpcomingDayProps) {
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
          {modules.map((module) => {
            // Route to the correct curriculum page based on curriculum type
            const curriculumPath = module.curriculumType === 'video' 
              ? `/video-curriculum/${module.curriculumId}` 
              : `/curriculum/${module.curriculumId}`
              
            return (
              <Link key={`${module.curriculumId}-${module.day}`} href={curriculumPath}>
                <div 
                  className={cn(
                    "flex items-center justify-between p-2 rounded border-l-2 border-muted bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer",
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
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}) 