"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookCover } from "@/components/ui/book-cover"
import { Target, Lightbulb, CheckCircle, Timer, ChevronLeft, ChevronRight, Play, Video, BookOpen, CheckSquare, Square } from "lucide-react"
import { handleResourceClick } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useUser } from "@stackframe/stack"
import { toggleModuleCompletionAction, fetchModuleCompletions } from "@/lib/actions"
import { toast } from "sonner"

interface VideoSegment {
  start: string
  end: string
  duration: string
  chapters: string[]
  rewatch_segments: string[]
}

interface VideoDailyModule {
  day: number
  date: string
  title: string
  video_segment: VideoSegment
  key_insights: string[]
  core_concepts: string[]
  time_allocation: {
    total: string
    video_viewing: string
    preparation: string
    supplementary_materials: string
    synthesis: string
  }
  knowledge_benchmark: {
    connect: string
    explain: string
    awareness: string
    recognize: string
    understand: string
  }
  pre_viewing_primer: string
  primary_reading_focus: string
  post_viewing_synthesis: string
  supplementary_readings: Array<{
    title: string
    author: string
    reading_time: string
    focus: string
    isbn?: string
    doi?: string
  }>
}

interface VideoCurriculum {
  title: string
  executive_overview: string
  visual_learning_path: Record<string, string>
  daily_modules: VideoDailyModule[]
  primary_video: {
    title: string
    channel: string
    duration: string
    url: string
    published: string
    video_id: string
  }
}

interface VideoCurriculumContentProps {
  curriculum: VideoCurriculum
  currentDay: number
  onPreviousDay: () => void
  onNextDay: () => void
  actualDay: number
  curriculumId: number
}

// Helper function to convert time string to seconds
function timeToSeconds(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0
  }
  
  // Clean the string of any extra whitespace or characters
  const cleanStr = timeStr.trim()
  const parts = cleanStr.split(':').map(str => {
    const num = parseInt(str, 10)
    return isNaN(num) ? 0 : num
  })
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 1) {
    // SS
    return parts[0]
  }
  
  return 0
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
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

export function VideoCurriculumContent({ 
  curriculum, 
  currentDay, 
  onPreviousDay, 
  onNextDay,
  actualDay,
  curriculumId
}: VideoCurriculumContentProps) {
  const user = useUser()
  const [completedModules, setCompletedModules] = useState<number[]>([])
  const [loadingCompletion, setLoadingCompletion] = useState(false)
  
  const currentModule = curriculum.daily_modules[currentDay - 1]
  const totalModules = curriculum.daily_modules.length
  const completedCount = completedModules.length
  const progressPercentage = (completedCount / totalModules) * 100
  
  const videoId = extractYouTubeVideoId(curriculum.primary_video.url) || curriculum.primary_video.video_id
  const startTime = timeToSeconds(currentModule.video_segment.start)
  
  // YouTube iframe embed URL with start time
  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=0&rel=0&modestbranding=1`
    : null

  // Fetch module completion status on mount
  useEffect(() => {
    if (!user?.id) return
    
    fetchModuleCompletions(user.id, curriculumId).then(result => {
      if (result.success && result.data) {
        setCompletedModules(result.data.map(c => c.module_number))
      }
    })
  }, [user?.id, curriculumId])

  const handleToggleComplete = async (moduleNumber: number) => {
    if (!user?.id || loadingCompletion) return
    
    setLoadingCompletion(true)
    const result = await toggleModuleCompletionAction(user.id, curriculumId, moduleNumber)
    
    if (result.success) {
      if (result.completed) {
        setCompletedModules([...completedModules, moduleNumber])
        toast.success(`Module ${moduleNumber} marked as complete`)
      } else {
        setCompletedModules(completedModules.filter(m => m !== moduleNumber))
        toast.success(`Module ${moduleNumber} marked as incomplete`)
      }
    } else {
      toast.error("Failed to update module completion")
    }
    
    setLoadingCompletion(false)
  }

  const jumpToTime = (timeStr: string) => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    if (iframe && videoId) {
      // Clean the time string - handle different formats:
      // Format 1: "28:23-29:33: Program synthesis analogy"
      // Format 2: "16:13 - 16:45 (Language control)"
      
      let cleanTimeStr = timeStr.trim()
      
      // Handle colon format: "28:23-29:33: description" - split on the range separator and description
      if (cleanTimeStr.includes('-') && cleanTimeStr.includes(': ')) {
        // Find the pattern "MM:SS-MM:SS: " or "H:MM:SS-H:MM:SS: "
        const match = cleanTimeStr.match(/^(\d{1,2}:\d{2}(?::\d{2})?)-\d{1,2}:\d{2}(?::\d{2})?:\s/)
        if (match) {
          cleanTimeStr = match[1] // Get the start time
        }
      }
      // Handle parentheses format: "16:13 - 16:45 (description)"
      else if (cleanTimeStr.includes(' - ') && cleanTimeStr.includes('(')) {
        cleanTimeStr = cleanTimeStr.split(' - ')[0].trim()
      }
      // Handle simple range format: "16:13 - 16:45"
      else if (cleanTimeStr.includes(' - ')) {
        cleanTimeStr = cleanTimeStr.split(' - ')[0].trim()
      }
      
      const seconds = timeToSeconds(cleanTimeStr)
      
      if (seconds > 0) {
        const newUrl = `https://www.youtube.com/embed/${videoId}?start=${seconds}&autoplay=1&rel=0&modestbranding=1`
        iframe.src = newUrl
      }
    }
  }

  const handleSupplementaryClick = (reading: { title: string; author: string; isbn?: string; doi?: string }) => {
    handleResourceClick(reading)
  }

  return (
    <div className="flex-1">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden border-b bg-background p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold">{curriculum.title}</h1>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Module {currentDay} of {totalModules}</span>
                {completedModules.includes(currentDay) && (
                  <Badge variant="secondary" className="text-xs">
                    Completed
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant={completedModules.includes(currentDay) ? "secondary" : "outline"}
                onClick={() => handleToggleComplete(currentDay)}
                disabled={loadingCompletion}
                className="h-7"
              >
                {completedModules.includes(currentDay) ? (
                  <CheckSquare className="h-3 w-3" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalModules} modules ({Math.round(progressPercentage)}%)
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 mb-3" />
        
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
            disabled={currentDay === totalModules}
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
              disabled={currentDay === totalModules}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Module Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Module {currentDay} of {totalModules}</span>
              {completedModules.includes(currentDay) && (
                <Badge variant="secondary" className="text-xs">
                  Completed
                </Badge>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant={completedModules.includes(currentDay) ? "secondary" : "outline"}
            onClick={() => handleToggleComplete(currentDay)}
            disabled={loadingCompletion}
          >
            {completedModules.includes(currentDay) ? (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Completed
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Mark Complete
              </>
            )}
          </Button>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="text-xs text-muted-foreground mt-1">
          {completedCount} of {totalModules} modules completed
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg lg:text-xl font-semibold">Module {currentModule.day}: {currentModule.title}</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              <Timer className="h-4 w-4 inline mr-1" />
              {currentModule.video_segment.duration} segment
            </div>
          </div>
          
          {/* Pre-Viewing Primer */}
          <div className="p-4 bg-muted/30 rounded-lg mb-4">
            <p className="text-sm leading-relaxed">{currentModule.pre_viewing_primer}</p>
          </div>
        </div>

        {/* Video Player and Supplementary Materials - Side by side on large screens */}
        <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-5">
          {/* Video Player Section */}
          <div className="lg:col-span-2 xl:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Video Segment</h3>
              <Badge variant="outline" className="text-xs">
                {currentModule.video_segment.start} - {currentModule.video_segment.end}
              </Badge>
            </div>
            
            {embedUrl ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden border bg-black">
                <iframe
                  src={embedUrl}
                  title={curriculum.primary_video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-lg border flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Video not available</p>
                </div>
              </div>
            )}

            {/* Video Controls - Simplified */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => jumpToTime(currentModule.video_segment.start)}
                className="flex items-center gap-1"
              >
                <Play className="h-3 w-3" />
                Start ({currentModule.video_segment.start})
              </Button>
            </div>
          </div>

          {/* Supplementary Materials - Next to video on large screens */}
          {currentModule.supplementary_readings.length > 0 && (
            <div className="lg:col-span-1 xl:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Required Readings</h3>
              </div>
              <div className="space-y-4 mb-6">
                {currentModule.supplementary_readings.map((reading, index) => (
                  <div 
                    key={index} 
                    className="flex gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSupplementaryClick(reading)}
                  >
                    {reading.isbn && (
                      <BookCover 
                        isbn={reading.isbn}
                        title={reading.title}
                        author={reading.author}
                        className="h-16 w-12 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm leading-tight">{reading.title}</h4>
                        <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                          {reading.reading_time}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{reading.author}</p>
                      <p className="text-xs leading-relaxed">{reading.focus}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Video Segments - Simple links under readings */}
              {currentModule.video_segment.rewatch_segments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Key Video Segments</h4>
                  <ul className="space-y-1 text-sm">
                    {currentModule.video_segment.rewatch_segments.map((segment, index) => {
                      // Parse the segment - handle different formats:
                      // Format 1: "28:23-29:33: Program synthesis analogy" 
                      // Format 2: "16:13 - 16:45 (Language control)"
                      
                      let startTime = ''
                      let description = ''
                      
                      if (segment.includes('-') && segment.includes(': ')) {
                        // Format 1: "28:23-29:33: Program synthesis analogy"
                        const match = segment.match(/^(\d{1,2}:\d{2}(?::\d{2})?)-\d{1,2}:\d{2}(?::\d{2})?:?\s(.+)/)
                        if (match) {
                          startTime = match[1]
                          description = match[2]
                        }
                      } else if (segment.includes(' - ')) {
                        // Format 2: "16:13 - 16:45 (Language control)"
                        const parts = segment.split(' - ')
                        startTime = parts[0].trim()
                        if (parts[1] && parts[1].includes('(')) {
                          description = parts[1].split('(')[1].replace(')', '')
                        }
                      }
                      
                      // Fallback
                      if (!startTime) {
                        startTime = segment.split(/[\s-]/)[0]
                        description = `Segment ${index + 1}`
                      }
                      
                      return (
                        <li key={index} className="flex items-center">
                          <span className="text-muted-foreground mr-2">•</span>
                          <button
                            onClick={() => jumpToTime(segment)}
                            className="text-blue-600 hover:text-blue-700 hover:underline text-left"
                          >
                            ({startTime}) {description}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>



        {/* Today's Focus - Matching text curriculum exactly */}
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
                <span className="text-muted-foreground">Video:</span>
                <span>{currentModule.time_allocation.video_viewing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reading:</span>
                <span>{currentModule.time_allocation.supplementary_materials}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Synthesis:</span>
                <span>{currentModule.time_allocation.synthesis}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Objectives Section - Matching text curriculum exactly */}
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

        {/* Post-Viewing Synthesis */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Post-Viewing Reflection</h3>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm leading-relaxed">{currentModule.post_viewing_synthesis}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onPreviousDay}
            disabled={currentDay <= 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Day
          </Button>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Day {currentDay} of {totalModules}</div>
            <div className="font-medium">{currentModule.title}</div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onNextDay}
            disabled={currentDay >= totalModules}
            className="flex items-center gap-2"
          >
            Next Day
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 