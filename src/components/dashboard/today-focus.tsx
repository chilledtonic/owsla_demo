"use client"

import React, { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { DailyModule } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { 
  BookOpenCheck,
  Target,
  Clock,
  CheckCircle,
  Circle,
  Play
} from "lucide-react"

interface TodaysFocusProps {
  modules: DailyModule[]
  completedModules: Set<string>
  onToggleCompletion: (key: string) => void
  isHydrated: boolean
}

export const TodaysFocus = React.memo(function TodaysFocus({ 
  modules, 
  completedModules, 
  onToggleCompletion,
  isHydrated 
}: TodaysFocusProps) {
  const isMobile = useIsMobile()

  // Sort modules by completion status and then by day (oldest curricula first)
  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => {
      const aCompleted = completedModules.has(`${a.curriculumId}-${a.day}`)
      const bCompleted = completedModules.has(`${b.curriculumId}-${b.day}`)
      
      // If completion status differs, uncompleted modules come first
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1
      }
      
      // Within the same completion status, sort by day descending (oldest curricula first)
      return b.day - a.day
    })
  }, [modules, completedModules])

  if (modules.length === 0) {
    return (
      <div className={cn("text-center py-8", isMobile && "py-6")}>
        <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-medium mb-2">No modules for today</h3>
        <p className="text-sm text-muted-foreground">
          {isMobile ? "Enjoy your free day!" : "Take a well-deserved break or get ahead on tomorrow's work."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!isMobile && (
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Today&apos;s Focus</h2>
          <Badge variant="outline">{modules.length} modules</Badge>
        </div>
      )}
      
      <div className={cn("space-y-3", !isMobile && "space-y-4")}>
        {sortedModules.map((module) => (
          <TodayModule
            key={`${module.curriculumId}-${module.day}`}
            module={module}
            isCompleted={isHydrated ? completedModules.has(`${module.curriculumId}-${module.day}`) : false}
            onToggleCompletion={onToggleCompletion}
          />
        ))}
      </div>
    </div>
  )
})

interface TodayModuleProps {
  module: DailyModule
  isCompleted: boolean
  onToggleCompletion: (key: string) => void
}

const TodayModule = React.memo(function TodayModule({
  module,
  isCompleted,
  onToggleCompletion
}: TodayModuleProps) {
  const isMobile = useIsMobile()
  const moduleKey = `${module.curriculumId}-${module.day}`

  // Need to determine curriculum type to route correctly
  // Since module doesn't have curriculum type, we'll default to /curriculum
  // but this should be enhanced with actual curriculum data
  const curriculumPath = `/curriculum/${module.curriculumId}`

  return (
    <Link href={curriculumPath}>
      <div 
        className={cn(
          "flex items-start gap-3 p-4 rounded-lg border transition-all duration-300 hover:bg-muted/50 cursor-pointer transform",
          isCompleted 
            ? "bg-muted/30 border-muted opacity-75 scale-[0.98]" 
            : "bg-background hover:shadow-sm",
          isMobile && "p-3 gap-2"
        )}
      >
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleCompletion(moduleKey)
          }}
          className="mt-1 flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className={cn("flex items-start gap-2 mb-2", isMobile && "flex-col gap-1")}>
            <h3 className={cn(
              "font-medium leading-tight transition-all duration-200",
              isCompleted && "line-through text-muted-foreground",
              isMobile && "text-sm"
            )}>
              {module.title}
            </h3>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {module.curriculumTitle}
                </Badge>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  Day {module.day}
                </Badge>
              </div>
            )}
          </div>
          
          {isMobile && (
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <span>{module.curriculumTitle}</span>
              <Badge variant="outline" className="text-xs">
                Day {module.day}
              </Badge>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{module.totalTime}</span>
            </div>
          </div>
        </div>
        
        {!isMobile && (
          <div className="flex-shrink-0">
            {isCompleted ? (
              <Button variant="ghost" size="sm" className="text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </Button>
            ) : (
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}) 