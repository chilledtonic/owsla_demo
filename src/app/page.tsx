"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { CurriculumContent } from "@/components/curriculum-content"
import { RightSidebar } from "@/components/right-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useUser } from "@stackframe/stack"
import { fetchLatestCurriculum, fetchCurriculumById } from "@/lib/actions"
import { CurriculumData } from "@/lib/database"
import { Suspense, useEffect, useState } from "react"

// Fallback curriculum data for when no user curriculum is found
const fallbackCurriculumData = {
  curriculum: {
    title: "Welcome to Your Learning Journey",
    executive_overview: "Create your first curriculum to begin your personalized learning experience. Use the sidebar to generate a curriculum tailored to your interests and learning goals.",
    visual_learning_path: {
      day_1: "Create Your First Curriculum",
      day_2: "Begin Your Learning Journey",
      day_3: "Track Your Progress",
      day_4: "Complete Your Studies",
      day_5: "Continue Learning",
    },
    daily_modules: [
      {
        day: 1,
        date: new Date().toISOString().split('T')[0],
        title: "Get Started with Your Learning Journey",
        key_insights: [
          "Personalized curricula provide structured learning paths",
          "AI-generated content adapts to your specific goals",
          "Self-directed learning requires clear objectives and timelines"
        ],
        core_concepts: [
          "Understanding curriculum structure",
          "Setting learning objectives",
          "Creating study schedules",
          "Tracking progress effectively"
        ],
        time_allocation: {
          total: "30 minutes",
          primary_text: "20 minutes",
          supplementary_materials: "10 minutes"
        },
        knowledge_benchmark: {
          connect: "Understand how structured learning applies to your goals",
          explain: "Describe the benefits of personalized curriculum design",
          awareness: "Recognize the importance of self-directed learning",
          recognize: "Identify key components of effective curricula",
          understand: "Grasp the concept of adaptive learning systems"
        },
        practical_connections: "Use the sidebar to create your first curriculum based on a topic you're interested in learning. Consider your available time, current knowledge level, and learning preferences.",
        primary_reading_focus: "Understanding how to get started with curriculum creation and learning goal setting",
        supplementary_readings: []
      },
    ],
    primary_resource: {
      title: "Getting Started Guide",
      author: "Learning Platform",
      isbn: "9780000000000"
    }
  },
}

function transformDatabaseCurriculum(dbCurriculum: any, rawCurriculumData?: CurriculumData) {
  // Transform daily modules with complete data structure
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

export default function Dashboard() {
  const user = useUser({ or: "redirect" })
  const [currentCurriculum, setCurrentCurriculum] = useState<CurriculumData | null>(null)
  const [curriculumData, setCurriculumData] = useState(fallbackCurriculumData)
  const [loading, setLoading] = useState(true)
  const [currentDay, setCurrentDay] = useState(1)

  // Load initial curriculum when user is available
  useEffect(() => {
    async function loadInitialCurriculum() {
      if (!user?.id) return

      try {
        const result = await fetchLatestCurriculum(user.id)
        if (result.success && result.data?.full_curriculum_data) {
          setCurrentCurriculum(result.data)
          setCurriculumData({
            curriculum: transformDatabaseCurriculum(result.data.full_curriculum_data, result.data)
          })
          setCurrentDay(1) // Reset to day 1 when loading initial curriculum
        }
      } catch (error) {
        console.error('Error loading initial curriculum:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialCurriculum()
  }, [user?.id])

  const handleCurriculumSelect = async (curriculum: CurriculumData) => {
    try {
      setLoading(true)
      const result = await fetchCurriculumById(curriculum.id)
      if (result.success && result.data?.full_curriculum_data) {
        setCurrentCurriculum(result.data)
        setCurriculumData({
          curriculum: transformDatabaseCurriculum(result.data.full_curriculum_data, result.data)
        })
        setCurrentDay(1) // Reset to day 1 when loading new curriculum
      }
    } catch (error) {
      console.error('Error loading selected curriculum:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousDay = () => {
    setCurrentDay(prev => Math.max(1, prev - 1))
  }

  const handleNextDay = () => {
    setCurrentDay(prev => Math.min(curriculumData.curriculum.daily_modules.length, prev + 1))
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          onCurriculumSelect={handleCurriculumSelect}
          activeCurriculumId={currentCurriculum?.id}
        />
        <SidebarInset className="flex-1">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading curriculum...</div>}>
            {loading ? (
              <div className="flex items-center justify-center h-full">Loading curriculum...</div>
            ) : (
              <CurriculumContent 
                curriculum={curriculumData.curriculum}
                currentDay={currentDay}
                onPreviousDay={handlePreviousDay}
                onNextDay={handleNextDay}
              />
            )}
          </Suspense>
        </SidebarInset>
        <RightSidebar 
          currentModule={curriculumData.curriculum.daily_modules[currentDay - 1]}
          totalDays={curriculumData.curriculum.daily_modules.length}
          currentDay={currentDay}
          nextModules={curriculumData.curriculum.daily_modules.slice(currentDay)}
        />
      </div>
    </SidebarProvider>
  )
}
