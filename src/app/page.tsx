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
    executive_overview: {
      learning_objective:
        "Create your first curriculum to begin your personalized learning experience.",
      time_commitment: "Get started by creating a curriculum tailored to your interests",
      prerequisites:
        "No prerequisites required - begin your learning journey today",
      learning_outcome:
        "You'll have access to AI-generated curricula customized for your learning goals",
    },
    visual_learning_path: {
      milestone_1: "Create Your First Curriculum",
      milestone_2: "Begin Your Learning Journey",
      milestone_3: "Track Your Progress",
      milestone_4: "Complete Your Studies",
      milestone_5: "Continue Learning",
    },
    daily_modules: [
      {
        day: 1,
        title: "Get Started",
        milestone: "Create Your First Curriculum",
        primary_reading: {
          book: "No curriculum created yet",
          chapters: "Create your first curriculum to get started",
          pages: "Use the sidebar to create a new curriculum",
        },
        time_allocation: "Create a curriculum to begin your learning journey",
      },
    ],
  },
}

function transformDatabaseCurriculum(dbCurriculum: any) {
  // Transform visual learning path from day_1, day_2... to milestone_1, milestone_2...
  const visualLearningPath = {
    milestone_1: "Create Your First Curriculum",
    milestone_2: "Begin Your Learning Journey", 
    milestone_3: "Track Your Progress",
    milestone_4: "Complete Your Studies",
    milestone_5: "Continue Learning",
  }
  
  if (dbCurriculum.visual_learning_path) {
    const pathEntries = Object.entries(dbCurriculum.visual_learning_path)
    pathEntries.forEach(([key, value], index) => {
      const milestoneKey = `milestone_${Math.min(index + 1, 5)}` as keyof typeof visualLearningPath
      if (milestoneKey in visualLearningPath) {
        visualLearningPath[milestoneKey] = String(value)
      }
    })
  }

  // Transform daily modules to match component expectations
  const dailyModules = (dbCurriculum.daily_modules || []).map((module: any) => ({
    day: module.day || 1,
    title: String(module.title || "Untitled Module"),
    milestone: String(module.title || "Module Milestone"), // Use title as milestone for now
    primary_reading: {
      book: String(dbCurriculum.primary_resource?.title || "Primary Reading"),
      chapters: "As specified in curriculum",
      pages: String(module.primary_reading_focus || "Reading focus as defined")
    },
    time_allocation: typeof module.time_allocation === 'object' 
      ? String(module.time_allocation.total || "Time as allocated")
      : String(module.time_allocation || "Time not specified")
  }))

  return {
    title: String(dbCurriculum.title || "Untitled Curriculum"),
    executive_overview: {
      learning_objective: String(dbCurriculum.executive_overview || "No learning objective provided"),
      time_commitment: `${dbCurriculum.daily_modules?.length || 0} days of intensive study`,
      prerequisites: String(dbCurriculum.knowledge_framework?.foundational_concepts || "Prerequisites as defined in curriculum"),
      learning_outcome: String(dbCurriculum.knowledge_framework?.synthesis_goals || "Learning outcomes as defined in curriculum")
    },
    visual_learning_path: visualLearningPath,
    daily_modules: dailyModules
  }
}

export default function Dashboard() {
  const user = useUser({ or: "redirect" })
  const [currentCurriculum, setCurrentCurriculum] = useState<CurriculumData | null>(null)
  const [curriculumData, setCurriculumData] = useState(fallbackCurriculumData)
  const [loading, setLoading] = useState(true)

  // Load initial curriculum when user is available
  useEffect(() => {
    async function loadInitialCurriculum() {
      if (!user?.id) return

      try {
        const result = await fetchLatestCurriculum(user.id)
        if (result.success && result.data?.full_curriculum_data) {
          setCurrentCurriculum(result.data)
          setCurriculumData({
            curriculum: transformDatabaseCurriculum(result.data.full_curriculum_data)
          })
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
          curriculum: transformDatabaseCurriculum(result.data.full_curriculum_data)
        })
      }
    } catch (error) {
      console.error('Error loading selected curriculum:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar 
          onCurriculumSelect={handleCurriculumSelect}
          activeCurriculumId={currentCurriculum?.id}
        />
        <SidebarInset className="flex-1">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading curriculum...</div>}>
            {loading ? (
              <div className="flex items-center justify-center h-full">Loading curriculum...</div>
            ) : (
              <CurriculumContent curriculum={curriculumData.curriculum} />
            )}
          </Suspense>
        </SidebarInset>
        <RightSidebar />
      </div>
    </SidebarProvider>
  )
}
