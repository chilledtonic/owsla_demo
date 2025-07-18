"use client"

import { AppLayout } from "@/components/app-layout"
import { VideoCurriculumContent } from "@/components/video-curriculum-content"
import { deleteCurriculum } from "@/lib/actions"
import { useCachedCurriculum } from "@/hooks/use-curriculum-data"
import { CurriculumData } from "@/lib/database"
import { calculateCurrentCurriculumDay } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { Trash2, Calendar, Clock, ChevronLeft, ChevronRight, Timer, Users, Play, Video, Edit } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Transform database curriculum to video display format
function transformDatabaseVideoCurriculum(dbCurriculum: {
  title?: string;
  executive_overview?: string;
  visual_learning_path?: Record<string, unknown>;
  primary_video?: {
    title?: string;
    channel?: string;
    duration?: string;
    url?: string;
    published?: string;
    video_id?: string;
  };
  daily_modules?: Array<{
    day?: number;
    date?: string;
    title?: string;
    video_segment?: {
      start?: string;
      end?: string;
      duration?: string;
      chapters?: string[];
      rewatch_segments?: string[];
    };
    key_insights?: string[];
    core_concepts?: string[];
    time_allocation?: {
      total?: string;
      video_viewing?: string;
      preparation?: string;
      supplementary_materials?: string;
      synthesis?: string;
    };
    knowledge_benchmark?: {
      connect?: string;
      explain?: string;
      awareness?: string;
      recognize?: string;
      understand?: string;
    };
    pre_viewing_primer?: string;
    primary_reading_focus?: string;
    post_viewing_synthesis?: string;
    supplementary_readings?: unknown[];
  }>;
}, rawCurriculumData?: CurriculumData) {
  const dailyModules = (dbCurriculum.daily_modules || []).map((module) => ({
    day: module.day || 1,
    date: module.date || new Date().toISOString().split('T')[0],
    title: String(module.title || "Untitled Module"),
    video_segment: {
      start: module.video_segment?.start || "00:00",
      end: module.video_segment?.end || "10:00",
      duration: module.video_segment?.duration || "10:00",
      chapters: module.video_segment?.chapters || [],
      rewatch_segments: module.video_segment?.rewatch_segments || []
    },
    key_insights: module.key_insights || ["Key insights for this module"],
    core_concepts: module.core_concepts || ["Core concepts to master"],
    time_allocation: {
      total: module.time_allocation?.total || "2 hours",
      video_viewing: module.time_allocation?.video_viewing || "25 minutes",
      preparation: module.time_allocation?.preparation || "20 minutes",
      supplementary_materials: module.time_allocation?.supplementary_materials || "45 minutes",
      synthesis: module.time_allocation?.synthesis || "30 minutes"
    },
    knowledge_benchmark: {
      connect: module.knowledge_benchmark?.connect || "Connect concepts to real-world applications",
      explain: module.knowledge_benchmark?.explain || "Explain key concepts in your own words",
      awareness: module.knowledge_benchmark?.awareness || "Be aware of the broader context and significance",
      recognize: module.knowledge_benchmark?.recognize || "Recognize patterns and relationships",
      understand: module.knowledge_benchmark?.understand || "Understand fundamental principles"
    },
    pre_viewing_primer: module.pre_viewing_primer || "Review this section before watching the video",
    primary_reading_focus: module.primary_reading_focus || "Focus on understanding the core concepts",
    post_viewing_synthesis: module.post_viewing_synthesis || "Reflect on what you've learned",
    supplementary_readings: (module.supplementary_readings || []) as Array<{
      title: string
      author: string
      reading_time: string
      focus: string
      isbn?: string
      doi?: string
    }>
  }))

  return {
    title: String(dbCurriculum.title || "Untitled Video Curriculum"),
    executive_overview: String(dbCurriculum.executive_overview || "This video curriculum provides comprehensive coverage of the subject matter"),
    visual_learning_path: Object.fromEntries(
      Object.entries(dbCurriculum.visual_learning_path || {}).map(([key, value]) => [key, String(value)])
    ) as Record<string, string>,
    daily_modules: dailyModules,
    primary_video: {
      title: rawCurriculumData?.primary_video_url ? dbCurriculum.primary_video?.title || rawCurriculumData?.title || "Video Course" : "Video Course",
      channel: rawCurriculumData?.primary_video_channel || dbCurriculum.primary_video?.channel || "Unknown Channel",
      duration: rawCurriculumData?.primary_video_duration || dbCurriculum.primary_video?.duration || "Unknown Duration",
      url: rawCurriculumData?.primary_video_url || dbCurriculum.primary_video?.url || "",
      published: rawCurriculumData?.primary_video_published || dbCurriculum.primary_video?.published || "",
      video_id: rawCurriculumData?.primary_video_id || dbCurriculum.primary_video?.video_id || ""
    }
  }
}

export default function VideoCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [curriculumId, setCurriculumId] = useState<number | null>(null)
  const { curriculum, loading, error } = useCachedCurriculum(curriculumId || 0)
  const [curriculumData, setCurriculumData] = useState<{ curriculum: ReturnType<typeof transformDatabaseVideoCurriculum> } | null>(null)
  const [currentDay, setCurrentDay] = useState(1)

  useEffect(() => {
    async function initParams() {
      const resolvedParams = await params
      const id = parseInt(resolvedParams.id)
      if (!isNaN(id)) {
        setCurriculumId(id)
      }
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (curriculum?.full_curriculum_data && curriculum.curriculum_type === 'video') {
      const transformedCurriculum = transformDatabaseVideoCurriculum(curriculum.full_curriculum_data, curriculum)
      setCurriculumData({
        curriculum: transformedCurriculum
      })
      
      // Intelligently calculate the current day based on today's date
      const { currentDay: calculatedCurrentDay } = 
        calculateCurrentCurriculumDay(transformedCurriculum.daily_modules)
      
      setCurrentDay(calculatedCurrentDay)
    }
  }, [curriculum])

  const handlePreviousDay = () => {
    setCurrentDay(prev => Math.max(1, prev - 1))
  }

  const handleNextDay = () => {
    if (curriculumData) {
      setCurrentDay(prev => Math.min(curriculumData.curriculum.daily_modules.length, prev + 1))
    }
  }

  async function handleDeleteCurriculum() {
    if (!curriculum?.id) return
    
    try {
      const result = await deleteCurriculum(curriculum.id)
      if (result.success) {
        router.push('/')
      } else {
        console.error('Failed to delete curriculum:', result.error)
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error)
    }
  }

  function handleEditCurriculum() {
    if (!curriculumData || !curriculum?.id) return
    
    // Transform video curriculum data to course editor format
    const courseData = {
      id: curriculum.id.toString(), // Include the curriculum ID for updating
      type: 'video' as const,
      title: curriculumData.curriculum.title,
      executive_overview: curriculumData.curriculum.executive_overview,
      primary_video: curriculumData.curriculum.primary_video,
      daily_modules: curriculumData.curriculum.daily_modules.map(module => ({
        day: module.day,
        date: module.date,
        title: module.title,
        video_segment: module.video_segment,
        key_insights: module.key_insights,
        core_concepts: module.core_concepts,
        time_allocation: {
          total: module.time_allocation.total,
          primary_text: module.time_allocation.video_viewing,
          supplementary_materials: module.time_allocation.supplementary_materials
        },
        knowledge_benchmark: module.knowledge_benchmark,
        practical_connections: "",
        primary_reading_focus: module.primary_reading_focus,
        supplementary_readings: module.supplementary_readings.map(reading => ({
          id: crypto.randomUUID(),
          title: reading.title,
          author: reading.author,
          reading_time: reading.reading_time,
          focus: reading.focus,
          isbn: reading.isbn,
          doi: reading.doi,
          year: "",
          journal: "",
          publisher: "",
          type: reading.isbn && reading.isbn !== 'N/A' ? 'book' : (reading.doi ? 'paper' : 'article')
        })),
        pre_viewing_primer: module.pre_viewing_primer,
        post_viewing_synthesis: module.post_viewing_synthesis
      })),
      knowledge_framework: {
        synthesis_goals: "",
        advanced_applications: "",
        foundational_concepts: ""
      },
      visual_learning_path: curriculumData.curriculum.visual_learning_path,
      resource_requirements: {
        primary_video: curriculumData.curriculum.primary_video,
        academic_papers: [],
        equipment_needed: "",
        total_time_commitment: "",
        supplementary_books: []
      }
    }
    
    // Store in session storage for the course editor
    sessionStorage.setItem('editCourseData', JSON.stringify(courseData))
    
    // Navigate to course editor
    router.push('/course-editor')
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Error</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Redirect to regular curriculum page if this is not a video curriculum
  if (curriculum && curriculum.curriculum_type !== 'video') {
    router.push(`/curriculum/${curriculum.id}`)
    return null
  }

  const currentModule = curriculumData?.curriculum.daily_modules[currentDay - 1]

  return (
    <AppLayout 
      activeCurriculumId={curriculum?.id}
      rightSidebar={
        !isMobile && curriculumData && currentModule && (
          <div className="p-4 space-y-4">
            {/* Primary Video - Featured at top */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Video className="h-4 w-4" />
                Primary Video
              </h3>
              <div className="p-3 rounded-lg border space-y-2">
                <h4 className="font-medium text-sm leading-tight">{curriculumData.curriculum.primary_video.title}</h4>
                <p className="text-xs text-muted-foreground">{curriculumData.curriculum.primary_video.channel}</p>
                <div className="text-xs text-muted-foreground">
                  Duration: {curriculumData.curriculum.primary_video.duration}
                </div>
                <div className="text-xs text-muted-foreground">
                  Current Segment: {currentModule.video_segment.start} - {currentModule.video_segment.end}
                </div>
              </div>
            </div>

            {/* Study Timer */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Study Session
              </h3>
              <div className="p-3 border rounded-lg space-y-3">
                <div className="text-center">
                  <div className="text-xl font-mono font-bold">
                    00:00
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Today&apos;s Study Time
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Timer className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                  <Button size="sm" variant="outline">
                    Reset
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Target: {currentModule.time_allocation.total}
                </div>
              </div>
            </div>

            {/* Current Module Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Current Module
              </h3>
              <div className="p-3 rounded-lg border space-y-2">
                <p className="font-medium text-sm">{currentModule.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Day {currentDay}</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {currentModule.time_allocation.total}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Video:</span>
                    <span>{currentModule.time_allocation.video_viewing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prep:</span>
                    <span>{currentModule.time_allocation.preparation}</span>
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

            {/* Expert Recommendation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Get Expert Help</h3>
              <div className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Expert Available</p>
                    <p className="text-xs text-muted-foreground">Get help with {curriculumData.curriculum.title}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => window.open('/experts', '_blank')}
                >
                  Find Expert
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Navigation</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePreviousDay}
                  disabled={currentDay <= 1}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNextDay}
                  disabled={currentDay >= curriculumData.curriculum.daily_modules.length}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Actions</h3>
              <div className="space-y-2">
                <Badge variant="secondary" className="text-xs w-full justify-center">
                  Video Curriculum
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleEditCurriculum}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Curriculum
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Curriculum
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Curriculum</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{curriculumData.curriculum.title}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteCurriculum}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )
      }
    >
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading video curriculum...</div>}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading video curriculum...</p>
            </div>
          </div>
        ) : curriculumData ? (
          <div className="flex-1 overflow-auto">
            {/* Mobile-specific content */}
            {isMobile && (
              <div className="p-4 space-y-4 border-b bg-background/50">
                {/* Primary Video Card for Mobile */}
                <div className="flex gap-3 p-3 rounded-lg border bg-background">
                  <div className="w-16 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    <Play className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-medium text-sm leading-tight">{curriculumData.curriculum.primary_video.title}</h4>
                    <p className="text-xs text-muted-foreground">{curriculumData.curriculum.primary_video.channel}</p>
                    <p className="text-xs text-muted-foreground">{curriculumData.curriculum.primary_video.duration}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open('/experts', '_blank')}
                    className="text-xs"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Help
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleEditCurriculum}
                    className="text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-xs text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Curriculum</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{curriculumData.curriculum.title}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteCurriculum}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
            
            <VideoCurriculumContent 
              curriculum={curriculumData.curriculum}
              currentDay={currentDay}
              onPreviousDay={handlePreviousDay}
              onNextDay={handleNextDay}
              curriculumId={curriculum?.id || curriculumId || 0}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Video Curriculum Not Found</h1>
              <p className="text-muted-foreground">The requested video curriculum could not be found.</p>
            </div>
          </div>
        )}
      </Suspense>
    </AppLayout>
  )
} 