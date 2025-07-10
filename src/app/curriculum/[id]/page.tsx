"use client"

import { AppLayout } from "@/components/app-layout"
import { CurriculumContent } from "@/components/curriculum-content"
import { deleteCurriculum } from "@/lib/actions"
import { useCachedCurriculum } from "@/hooks/use-curriculum-data"
import { CurriculumData } from "@/lib/database"
import { calculateCurrentCurriculumDay } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { Trash2, Calendar, Clock, ChevronLeft, ChevronRight, Timer, Users, Edit } from "lucide-react"
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
import { BookCover } from "@/components/ui/book-cover"

// Transform database curriculum to display format
function transformDatabaseCurriculum(dbCurriculum: {
  title?: string;
  executive_overview?: string;
  visual_learning_path?: Record<string, unknown>;
  daily_modules?: Array<{
    day?: number;
    date?: string;
    title?: string;
    key_insights?: string[];
    core_concepts?: string[];
    time_allocation?: {
      total?: string;
      primary_text?: string;
      supplementary_materials?: string;
    };
    knowledge_benchmark?: {
      connect?: string;
      explain?: string;
      awareness?: string;
      recognize?: string;
      understand?: string;
    };
    practical_connections?: string;
    primary_reading_focus?: string;
    supplementary_readings?: unknown[];
  }>;
  primary_resource?: {
    isbn?: string;
  };
}, rawCurriculumData?: CurriculumData) {
  const dailyModules = (dbCurriculum.daily_modules || []).map((module: {
    day?: number;
    date?: string;
    title?: string;
    key_insights?: string[];
    core_concepts?: string[];
    time_allocation?: {
      total?: string;
      primary_text?: string;
      supplementary_materials?: string;
    };
    knowledge_benchmark?: {
      connect?: string;
      explain?: string;
      awareness?: string;
      recognize?: string;
      understand?: string;
    };
    practical_connections?: string;
    primary_reading_focus?: string;
    supplementary_readings?: unknown[];
  }) => ({
    day: module.day || 1,
    date: module.date || new Date().toISOString().split('T')[0],
    title: String(module.title || "Untitled Module"),
    key_insights: module.key_insights || ["Key insights for this module"],
    core_concepts: module.core_concepts || ["Core concepts to master"],
    time_allocation: {
      total: module.time_allocation?.total || "60 minutes",
      primary_text: module.time_allocation?.primary_text || "42 minutes", 
      supplementary_materials: module.time_allocation?.supplementary_materials || "18 minutes"
    },
    knowledge_benchmark: {
      connect: module.knowledge_benchmark?.connect || "Connect concepts to real-world applications",
      explain: module.knowledge_benchmark?.explain || "Explain key concepts in your own words",
      awareness: module.knowledge_benchmark?.awareness || "Be aware of the broader context and significance",
      recognize: module.knowledge_benchmark?.recognize || "Recognize patterns and relationships",
      understand: module.knowledge_benchmark?.understand || "Understand fundamental principles"
    },
    practical_connections: module.practical_connections || "Apply these concepts in practical situations",
    primary_reading_focus: module.primary_reading_focus || "Focus on understanding the core concepts",
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
    title: String(dbCurriculum.title || "Untitled Curriculum"),
    executive_overview: String(dbCurriculum.executive_overview || "This curriculum provides comprehensive coverage of the subject matter"),
    visual_learning_path: Object.fromEntries(
      Object.entries(dbCurriculum.visual_learning_path || {}).map(([key, value]) => [key, String(value)])
    ) as Record<string, string>,
    daily_modules: dailyModules,
    primary_resource: {
      title: rawCurriculumData?.primary_resource_title || "Primary Resource",
      author: rawCurriculumData?.primary_resource_author || "Author",
      isbn: rawCurriculumData?.primary_resource_isbn || (dbCurriculum.primary_resource && 'isbn' in dbCurriculum.primary_resource ? dbCurriculum.primary_resource.isbn : undefined) || "9780000000000"
    }
  }
}

export default function CurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [curriculumId, setCurriculumId] = useState<number | null>(null)
  const { curriculum, loading, error } = useCachedCurriculum(curriculumId || 0)
  const [curriculumData, setCurriculumData] = useState<{ curriculum: ReturnType<typeof transformDatabaseCurriculum> } | null>(null)
  const [currentDay, setCurrentDay] = useState(1)
  const [actualDay, setActualDay] = useState(1) // User's actual progress day

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
    if (curriculum?.full_curriculum_data) {
      // Redirect to video curriculum page if this is a video curriculum
      if (curriculum.curriculum_type === 'video') {
        router.push(`/video-curriculum/${curriculum.id}`)
        return
      }
      
      const transformedCurriculum = transformDatabaseCurriculum(curriculum.full_curriculum_data, curriculum)
      setCurriculumData({
        curriculum: transformedCurriculum
      })
      
      // Intelligently calculate the current day based on today's date
      const { currentDay: calculatedCurrentDay, actualDay: calculatedActualDay } = 
        calculateCurrentCurriculumDay(transformedCurriculum.daily_modules)
      
      // Debug info (can be removed in production)
      // console.log('Curriculum date calculation:', {
      //   today: new Date().toISOString().split('T')[0],
      //   calculatedCurrentDay,
      //   calculatedActualDay,
      //   firstModuleDate: transformedCurriculum.daily_modules[0]?.date,
      //   lastModuleDate: transformedCurriculum.daily_modules[transformedCurriculum.daily_modules.length - 1]?.date
      // })
      
      setCurrentDay(calculatedCurrentDay)
      setActualDay(calculatedActualDay)
    }
  }, [curriculum, router])

  const handlePreviousDay = () => {
    setCurrentDay(prev => Math.max(1, prev - 1))
  }

  const handleNextDay = () => {
    if (curriculumData) {
      setCurrentDay(prev => Math.min(curriculumData.curriculum.daily_modules.length, prev + 1))
    }
  }



  function handleEditCurriculum() {
    if (!curriculumData?.curriculum) return
    
    // Convert curriculum data to course editor format
    const courseData = {
      title: curriculumData.curriculum.title,
      executive_overview: curriculumData.curriculum.executive_overview,
      daily_modules: curriculumData.curriculum.daily_modules.map(module => ({
        ...module,
        supplementary_readings: module.supplementary_readings.map(reading => ({
          ...reading,
          id: `${reading.title}-${reading.author}`.replace(/\s+/g, '-').toLowerCase(),
          type: reading.isbn ? 'book' as const : 'paper' as const
        }))
      })),
      primary_resource: {
        isbn: curriculumData.curriculum.primary_resource.isbn,
        year: "",
        title: curriculumData.curriculum.primary_resource.title,
        author: curriculumData.curriculum.primary_resource.author,
        publisher: ""
      },
      knowledge_framework: {
        synthesis_goals: "",
        advanced_applications: "",
        foundational_concepts: ""
      },
      visual_learning_path: curriculumData.curriculum.visual_learning_path,
      resource_requirements: {
        primary_book: {
          isbn: curriculumData.curriculum.primary_resource.isbn,
          year: "",
          title: curriculumData.curriculum.primary_resource.title,
          author: curriculumData.curriculum.primary_resource.author,
          publisher: ""
        },
        academic_papers: [],
        equipment_needed: "",
        total_reading_time: "",
        supplementary_books: []
      }
    }
    
    // Store the course data in sessionStorage to pass to the editor
    sessionStorage.setItem('editCourseData', JSON.stringify(courseData))
    
    // Navigate to course editor
    router.push('/course-editor')
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

  const currentModule = curriculumData?.curriculum.daily_modules[currentDay - 1]

  return (
    <AppLayout 
      activeCurriculumId={curriculum?.id}
      rightSidebar={
        !isMobile && curriculumData && currentModule && (
          <div className="p-4 space-y-4">
            {/* Primary Resource - Featured at top */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Primary Resource</h3>
              <div 
                className="cursor-pointer hover:bg-muted/30 p-3 rounded-lg transition-colors border"
                onClick={() => {
                  const title = encodeURIComponent(curriculumData.curriculum.primary_resource.title || "");
                  const author = encodeURIComponent(curriculumData.curriculum.primary_resource.author || "");
                  const url = `https://www.amazon.com/s?k=${title}+${author}`;
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
              >
                <div className="flex gap-3">
                  <BookCover 
                    isbn={curriculumData.curriculum.primary_resource.isbn}
                    title={curriculumData.curriculum.primary_resource.title}
                    className="h-24 w-18 flex-shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">{curriculumData.curriculum.primary_resource.title}</h4>
                    <p className="text-xs text-muted-foreground">{curriculumData.curriculum.primary_resource.author}</p>
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentModule.primary_reading_focus}
                      </p>
                    </div>
                  </div>
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
                    <span className="text-muted-foreground">Primary:</span>
                    <span>{currentModule.time_allocation.primary_text}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplementary:</span>
                    <span>{currentModule.time_allocation.supplementary_materials}</span>
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
                  Active Curriculum
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleEditCurriculum}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit in Course Editor
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
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading curriculum...</div>}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading curriculum...</p>
            </div>
          </div>
        ) : curriculumData ? (
          <div className="flex-1 overflow-auto">
            {/* Mobile-specific content */}
            {isMobile && (
              <div className="p-4 space-y-4 border-b bg-background/50">
                {/* Primary Resource Card for Mobile */}
                <div className="flex gap-3 p-3 rounded-lg border bg-background">
                  <BookCover 
                    isbn={curriculumData.curriculum.primary_resource.isbn}
                    title={curriculumData.curriculum.primary_resource.title}
                    className="h-16 w-12 flex-shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-medium text-sm leading-tight">{curriculumData.curriculum.primary_resource.title}</h4>
                    <p className="text-xs text-muted-foreground">{curriculumData.curriculum.primary_resource.author}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7 mt-2"
                      onClick={() => {
                        const title = encodeURIComponent(curriculumData.curriculum.primary_resource.title || "");
                        const author = encodeURIComponent(curriculumData.curriculum.primary_resource.author || "");
                        const url = `https://www.amazon.com/s?k=${title}+${author}`;
                        window.open(url, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      Find Book
                    </Button>
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
                    Get Help
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
            
            <CurriculumContent 
              curriculum={curriculumData.curriculum}
              currentDay={currentDay}
              onPreviousDay={handlePreviousDay}
              onNextDay={handleNextDay}
              actualDay={actualDay}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Curriculum Not Found</h1>
              <p className="text-muted-foreground">The requested curriculum could not be found.</p>
            </div>
          </div>
        )}
      </Suspense>
    </AppLayout>
  )
} 