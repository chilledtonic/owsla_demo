"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookCover } from "@/components/ui/book-cover"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import Image from "next/image"
import { CurriculumData } from "@/lib/database"
import { DailyModule } from "@/lib/actions"
import { calculateCurrentCurriculumDay } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { 
  BookOpen,
  TrendingUp,
  Plus,
  Play
} from "lucide-react"
import { useState, useEffect } from "react"

interface DashboardCurriculaOverviewProps {
  curricula: CurriculumData[]
  dailyModules: DailyModule[]
  showCompleted?: boolean // New prop to control whether to show completed courses
}

export const DashboardCurriculaOverview = React.memo(function DashboardCurriculaOverview({
  curricula,
  dailyModules,
  showCompleted = false // Default to false for dashboard behavior
}: DashboardCurriculaOverviewProps) {
  const isMobile = useIsMobile()
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)

  // Load completed modules from localStorage for proper filtering
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("module-completion")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setCompletedModules(new Set(parsed))
        } catch {}
      }
      setIsHydrated(true)
    }
  }, [])

  // Filter curricula based on completion status
  const filteredCurricula = React.useMemo(() => {
    if (!isHydrated) return curricula
    
    if (showCompleted) {
      // For archive page - show all passed curricula (they're already filtered)
      return curricula
    }
    
    // For dashboard - filter out completed curricula
    return curricula.filter(curriculum => {
      const curriculumModules = dailyModules.filter(m => m.curriculumId === curriculum.id)
      const { currentDay } = calculateCurrentCurriculumDay(curriculumModules)
      const totalDays = curriculumModules.length
      
      // Calculate date-based progress percentage
      const dateProgressPercentage = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0
      
      // Calculate manual completion progress percentage
      const manuallyCompletedModules = curriculumModules.filter(module => 
        completedModules.has(`${module.curriculumId}-${module.day}`)
      )
      const manualProgressPercentage = totalDays > 0 ? Math.round((manuallyCompletedModules.length / totalDays) * 100) : 0
      
      // Course is NOT completed if NONE of these are true:
      // 1. Date-based progress is 100% (past end date)
      // 2. Manual completion is 100% (all modules marked complete)
      // 3. Manual completion is 80%+ (mostly complete)
      return !(dateProgressPercentage >= 100 || manualProgressPercentage >= 100 || manualProgressPercentage >= 80)
    })
  }, [curricula, dailyModules, completedModules, isHydrated, showCompleted])

  if (filteredCurricula.length === 0) {
    return (
      <div className={cn("text-center py-8", isMobile && "py-6")}>
        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-medium mb-2">
          {showCompleted ? "No completed curricula" : "No curricula yet"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {showCompleted 
            ? "Complete some courses to see them here" 
            : (isMobile ? "Create your first curriculum to get started" : "Start your learning journey by creating your first curriculum")
          }
        </p>
        {!showCompleted && (
          <Button asChild size={isMobile ? "default" : "lg"}>
            <Link href="/new-curriculum">
              <Plus className="h-4 w-4 mr-2" />
              Create Curriculum
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <h2 className={cn("font-semibold", isMobile ? "text-lg" : "text-xl")}>
          {showCompleted ? "Completed Curricula" : "Your Curricula"}
        </h2>
        <Badge variant="outline">
          {filteredCurricula.length} {showCompleted ? "completed" : "active"}
        </Badge>
      </div>
      
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {filteredCurricula.map((curriculum) => (
          <DashboardCurriculumCard
            key={curriculum.id}
            curriculum={curriculum}
            dailyModules={dailyModules}
          />
        ))}
      </div>
    </div>
  )
})

interface DashboardCurriculumCardProps {
  curriculum: CurriculumData
  dailyModules: DailyModule[]
}

const DashboardCurriculumCard = React.memo(function DashboardCurriculumCard({
  curriculum,
  dailyModules
}: DashboardCurriculumCardProps) {
  const isMobile = useIsMobile()
  const [isHydrated, setIsHydrated] = useState(false)
  const curriculumModules = dailyModules.filter(m => m.curriculumId === curriculum.id)
  const { currentDay } = calculateCurrentCurriculumDay(curriculumModules)
  
  // Handle hydration to prevent SSR/client mismatch
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // Calculate progress status based on current day and actual day
  const totalDays = curriculumModules.length
  const { actualDay } = calculateCurrentCurriculumDay(curriculumModules)
  const progressPercentage = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0
  
  let progressStatus = 'upcoming'
  // If actualDay is 0, the course hasn't started yet (future start date)
  if (actualDay === 0) {
    progressStatus = 'upcoming'
  } else if (progressPercentage >= 100) {
    progressStatus = 'completed'
  } else if (progressPercentage > 0) {
    progressStatus = 'in-progress'
  }
  
  const statusColor = {
    'completed': 'text-green-600',
    'in-progress': 'text-blue-600', 
    'upcoming': 'text-orange-600',
    'overdue': 'text-red-600'
  }[progressStatus] || 'text-muted-foreground'

  const statusLabel = {
    'completed': 'Completed',
    'in-progress': 'In Progress',
    'upcoming': 'Upcoming', 
    'overdue': 'Behind Schedule'
  }[progressStatus] || 'Unknown'

  // Simplified video curriculum detection - prioritize curriculum_type
  const isVideoCurriculum = curriculum.curriculum_type === 'video'

  // Determine the correct link path based on curriculum type
  const curriculumPath = isVideoCurriculum 
    ? `/video-curriculum/${curriculum.id}` 
    : `/curriculum/${curriculum.id}`

  // Helper function to extract YouTube video ID from URL
  const extractYouTubeVideoId = (url: string): string | null => {
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ]
    
    for (const pattern of regexPatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }

  // Get video ID for thumbnail (only if hydrated to prevent SSR mismatch)
  const getVideoId = (): string | null => {
    if (!isHydrated || !isVideoCurriculum) return null
    
    // Get video data from either top-level fields or nested full_curriculum_data
    const videoUrl = curriculum.primary_video_url || curriculum.full_curriculum_data?.primary_video?.url
    const videoId = curriculum.primary_video_id || curriculum.full_curriculum_data?.primary_video?.video_id
    const extractedId = videoUrl ? extractYouTubeVideoId(videoUrl) : null
    
    return extractedId || videoId || null
  }

  const videoId = getVideoId()

  return (
    <Link href={curriculumPath}>
      <div className={cn(
        "p-4 rounded-lg border hover:bg-muted/50 transition-colors",
        isMobile && "p-3"
      )}>
        {/* Primary Resource Cover or Video Thumbnail */}
        <div className="flex gap-3 mb-3">
          {isVideoCurriculum ? (
            // Video thumbnail for video curricula
            <div className={cn("flex-shrink-0 relative", isMobile ? "h-16 w-20" : "h-20 w-26")}>
              {videoId && isHydrated ? (
                <>
                  <Image 
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                    alt="Video thumbnail"
                    width={isMobile ? 80 : 104}
                    height={isMobile ? 50 : 65}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      console.error('Thumbnail failed to load for video ID:', videoId)
                      // Fallback to a different quality
                      const target = e.target as HTMLImageElement
                      if (target.src.includes('hqdefault')) {
                        target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                      } else if (target.src.includes('mqdefault')) {
                        target.src = `https://img.youtube.com/vi/${videoId}/default.jpg`
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 rounded-full p-2">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                  <Play className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ) : (
            // Book cover for text curricula
            <BookCover 
              isbn={curriculum.primary_resource_isbn || undefined}
              title={curriculum.primary_resource_title || undefined}
              author={curriculum.primary_resource_author || undefined}
              year={curriculum.primary_resource_year || undefined}
              className={cn("flex-shrink-0", isMobile ? "h-16 w-12" : "h-20 w-14")}
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className={cn(
                "font-medium leading-tight line-clamp-2",
                isMobile && "text-sm"
              )}>
                {curriculum.title}
              </h3>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <Badge variant="secondary" className={cn(statusColor, "text-xs")}>
                  {statusLabel}
                </Badge>
                {isVideoCurriculum && (
                  <Badge variant="outline" className="text-xs">
                    Video
                  </Badge>
                )}
              </div>
            </div>
            
            {curriculumModules.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Day {currentDay} of {curriculumModules.length}</span>
                  <span>{progressPercentage}%</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {!isMobile && curriculum.topic && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {curriculum.topic}
          </p>
        )}
      </div>
    </Link>
  )
}) 