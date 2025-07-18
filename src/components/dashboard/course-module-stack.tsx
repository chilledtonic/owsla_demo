"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUser } from "@stackframe/stack"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Play,
  BookOpen,
  Video,
  Timer
} from "lucide-react"
import { toggleModuleCompletionAction, fetchModuleCompletions } from "@/lib/actions"
import { toast } from "sonner"

interface Module {
  day: number
  title: string
  totalTime: string
  curriculumId: number
  curriculumTitle: string
  curriculumType: string
}

interface CourseModuleStackProps {
  curriculum: {
    id: number
    title: string
    curriculum_type: string
    topic: string
  }
  modules: Module[]
  className?: string
}

export function CourseModuleStack({ curriculum, modules, className }: CourseModuleStackProps) {
  const user = useUser()
  const isMobile = useIsMobile()
  const [completedModules, setCompletedModules] = useState<number[]>([])
  const [currentStackPosition, setCurrentStackPosition] = useState(0)
  const [loadingCompletion, setLoadingCompletion] = useState(false)

  // Fetch module completion status on mount
  useEffect(() => {
    if (!user?.id) return
    
    fetchModuleCompletions(user.id, curriculum.id).then(result => {
      if (result.success && result.data) {
        const completed = result.data.map(c => c.module_number)
        setCompletedModules(completed)
        
        // Set current position to first incomplete module
        const firstIncomplete = modules.findIndex(module => !completed.includes(module.day))
        setCurrentStackPosition(firstIncomplete !== -1 ? firstIncomplete : Math.max(0, modules.length - 1))
      }
    })
  }, [user?.id, curriculum.id, modules])

  const handleToggleComplete = async (moduleNumber: number) => {
    if (!user?.id || loadingCompletion) return
    
    setLoadingCompletion(true)
    const result = await toggleModuleCompletionAction(user.id, curriculum.id, moduleNumber)
    
    if (result.success) {
      if (result.completed) {
        const newCompleted = [...completedModules, moduleNumber]
        setCompletedModules(newCompleted)
        toast.success(`Module ${moduleNumber} completed!`)
        
        // Auto-advance to next incomplete module
        const nextIncomplete = modules.findIndex((module, index) => 
          index > currentStackPosition && !newCompleted.includes(module.day)
        )
        if (nextIncomplete !== -1) {
          setCurrentStackPosition(nextIncomplete)
        }
      } else {
        setCompletedModules(completedModules.filter(m => m !== moduleNumber))
        toast.success(`Module ${moduleNumber} marked incomplete`)
      }
    } else {
      toast.error("Failed to update module completion")
    }
    
    setLoadingCompletion(false)
  }

  const handlePrevious = () => {
    setCurrentStackPosition(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentStackPosition(prev => Math.min(modules.length - 1, prev + 1))
  }

  if (modules.length === 0) {
    return (
      <div className={cn("p-6 border rounded-lg bg-muted/20", className)}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {curriculum.curriculum_type === 'video' ? (
              <Video className="h-8 w-8 text-muted-foreground" />
            ) : (
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="font-medium text-sm mb-1">{curriculum.title}</h3>
          <p className="text-xs text-muted-foreground">No modules available</p>
        </div>
      </div>
    )
  }

  const currentModule = modules[currentStackPosition]
  const completedCount = completedModules.length
  const progressPercentage = Math.round((completedCount / modules.length) * 100)
  const curriculumPath = curriculum.curriculum_type === 'video' 
    ? `/video-curriculum/${curriculum.id}` 
    : `/curriculum/${curriculum.id}`

  return (
    <div className={cn("border rounded-lg bg-background", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {curriculum.curriculum_type === 'video' ? (
                <Video className="h-4 w-4 text-blue-600 flex-shrink-0" />
              ) : (
                <BookOpen className="h-4 w-4 text-green-600 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-sm truncate">{curriculum.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{curriculum.topic}</p>
          </div>
          <Badge variant="secondary" className="text-xs ml-2">
            {completedCount}/{modules.length}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Current Module Card */}
      <div className="p-4">
        <div className="relative">
          {/* Stack Effect - Show cards behind current one */}
          <div className="absolute inset-0 bg-muted/30 rounded-lg transform translate-x-1 translate-y-1 -z-10" />
          <div className="absolute inset-0 bg-muted/15 rounded-lg transform translate-x-2 translate-y-2 -z-20" />
          
          {/* Current Module */}
          <div className={cn(
            "relative bg-background border rounded-lg p-4 transition-all duration-200",
            completedModules.includes(currentModule.day) 
              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
              : "hover:shadow-sm"
          )}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Module {currentModule.day}
                  </span>
                  {completedModules.includes(currentModule.day) && (
                    <Badge variant="secondary" className="text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium text-sm leading-tight mb-2">{currentModule.title}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {currentModule.totalTime}
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                variant={completedModules.includes(currentModule.day) ? "secondary" : "outline"}
                onClick={() => handleToggleComplete(currentModule.day)}
                disabled={loadingCompletion}
                className="ml-2"
              >
                {completedModules.includes(currentModule.day) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStackPosition === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {!isMobile && "Previous"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentStackPosition === modules.length - 1}
                >
                  {!isMobile && "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Button size="sm" asChild>
                <Link href={curriculumPath}>
                  <Play className="h-4 w-4 mr-1" />
                  {isMobile ? "Study" : "Start Module"}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stack Position Indicator */}
        <div className="flex items-center justify-center mt-3 gap-1">
          {modules.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStackPosition(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentStackPosition 
                  ? "bg-primary" 
                  : completedModules.includes(modules[index].day)
                    ? "bg-green-500"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 