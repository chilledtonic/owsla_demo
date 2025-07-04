"use client"

import { AppLayout } from "@/components/app-layout"
import { CurriculumContent } from "@/components/curriculum-content"
import { RightSidebar } from "@/components/right-sidebar"
import { fetchCurriculumById, deleteCurriculum } from "@/lib/actions"
import { CurriculumData } from "@/lib/database"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
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
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null)
  const [curriculumData, setCurriculumData] = useState<{ curriculum: ReturnType<typeof transformDatabaseCurriculum> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDay, setCurrentDay] = useState(1)
  const [curriculumId, setCurriculumId] = useState<string | null>(null)

  useEffect(() => {
    async function initParams() {
      const resolvedParams = await params
      setCurriculumId(resolvedParams.id)
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (!curriculumId) return

    async function loadCurriculum() {
      try {
        setLoading(true)
        if (!curriculumId) return
        
        const id = parseInt(curriculumId)
        if (isNaN(id)) {
          setError("Invalid curriculum ID")
          return
        }
        
        const result = await fetchCurriculumById(id)
        if (result.success && result.data?.full_curriculum_data) {
          setCurriculum(result.data)
          setCurriculumData({
            curriculum: transformDatabaseCurriculum(result.data.full_curriculum_data, result.data)
          })
        } else {
          setError("Curriculum not found")
        }
      } catch (error) {
        console.error('Error loading curriculum:', error)
        setError("Failed to load curriculum")
      } finally {
        setLoading(false)
      }
    }

    loadCurriculum()
  }, [curriculumId])

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
        setError(result.error || 'Failed to delete curriculum')
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error)
      setError('Failed to delete curriculum')
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

  return (
    <AppLayout 
      activeCurriculumId={curriculum?.id}
      rightSidebar={
        curriculumData && (
          <RightSidebar 
            currentModule={curriculumData.curriculum.daily_modules[currentDay - 1]}
            totalDays={curriculumData.curriculum.daily_modules.length}
            currentDay={currentDay}
            nextModules={curriculumData.curriculum.daily_modules.slice(currentDay)}
          />
        )
      }
    >
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading curriculum...</div>}>
        {loading ? (
          <div className="flex items-center justify-center h-full">Loading curriculum...</div>
        ) : curriculumData ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h1 className="text-2xl font-bold">{curriculumData.curriculum.title}</h1>
                <p className="text-muted-foreground">Day {currentDay} of {curriculumData.curriculum.daily_modules.length}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
            <div className="flex-1">
              <CurriculumContent 
                curriculum={curriculumData.curriculum}
                currentDay={currentDay}
                onPreviousDay={handlePreviousDay}
                onNextDay={handleNextDay}
              />
            </div>
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