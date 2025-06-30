"use client"

import { AppLayout } from "@/components/app-layout"
import { CurriculumContent } from "@/components/curriculum-content"
import { RightSidebar } from "@/components/right-sidebar"
import { fetchCurriculumById } from "@/lib/actions"
import { CurriculumData } from "@/lib/database"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

// Transform database curriculum to display format
function transformDatabaseCurriculum(dbCurriculum: any, rawCurriculumData?: CurriculumData) {
  const dailyModules = (dbCurriculum.daily_modules || []).map((module: any) => ({
    day: module.day || 1,
    date: module.date || new Date().toISOString().split('T')[0],
    title: String(module.title || "Untitled Module"),
    key_insights: module.key_insights || ["Key insights for this module"],
    core_concepts: module.core_concepts || ["Core concepts to master"],
    time_allocation: module.time_allocation || {
      total: "60 minutes",
      primary_text: "42 minutes", 
      supplementary_materials: "18 minutes"
    },
    knowledge_benchmark: module.knowledge_benchmark || {
      connect: "Connect concepts to real-world applications",
      explain: "Explain key concepts in your own words",
      awareness: "Be aware of the broader context and significance",
      recognize: "Recognize patterns and relationships",
      understand: "Understand fundamental principles"
    },
    practical_connections: module.practical_connections || "Apply these concepts in practical situations",
    primary_reading_focus: module.primary_reading_focus || "Focus on understanding the core concepts",
    supplementary_readings: module.supplementary_readings || []
  }))

  return {
    title: String(dbCurriculum.title || "Untitled Curriculum"),
    executive_overview: String(dbCurriculum.executive_overview || "This curriculum provides comprehensive coverage of the subject matter"),
    visual_learning_path: dbCurriculum.visual_learning_path || {},
    daily_modules: dailyModules,
    primary_resource: dbCurriculum.primary_resource || {
      title: rawCurriculumData?.primary_resource_title || "Primary Resource",
      author: rawCurriculumData?.primary_resource_author || "Author",
      isbn: rawCurriculumData?.primary_resource_isbn || dbCurriculum.primary_resource?.isbn || "9780000000000"
    }
  }
}

export default function CurriculumPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null)
  const [curriculumData, setCurriculumData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDay, setCurrentDay] = useState(1)

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const result = await fetchCurriculumById(parseInt(params.id))
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
  }, [params.id])

  const handleCurriculumSelect = (selectedCurriculum: CurriculumData) => {
    router.push(`/curriculum/${selectedCurriculum.id}`)
  }

  const handlePreviousDay = () => {
    setCurrentDay(prev => Math.max(1, prev - 1))
  }

  const handleNextDay = () => {
    if (curriculumData) {
      setCurrentDay(prev => Math.min(curriculumData.curriculum.daily_modules.length, prev + 1))
    }
  }

  if (error) {
    return (
      <AppLayout onCurriculumSelect={handleCurriculumSelect}>
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
      onCurriculumSelect={handleCurriculumSelect}
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
          <CurriculumContent 
            curriculum={curriculumData.curriculum}
            currentDay={currentDay}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
          />
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