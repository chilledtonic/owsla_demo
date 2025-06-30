import { AppSidebar } from "@/components/app-sidebar"
import { CurriculumContent } from "@/components/curriculum-content"
import { RightSidebar } from "@/components/right-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { stackServerApp } from "@/stack"
import { fetchLatestCurriculum } from "@/lib/actions"
import { Suspense } from "react"

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
  const visualLearningPath: Record<string, string> = {}
  if (dbCurriculum.visual_learning_path) {
    Object.entries(dbCurriculum.visual_learning_path).forEach(([key, value], index) => {
      visualLearningPath[`milestone_${index + 1}`] = value as string
    })
  }

  // Transform daily modules to match component expectations
  const dailyModules = (dbCurriculum.daily_modules || []).map((module: any) => ({
    day: module.day || 1,
    title: module.title || "Untitled Module",
    milestone: module.title || "Module Milestone", // Use title as milestone for now
    primary_reading: {
      book: dbCurriculum.primary_resource?.title || "Primary Reading",
      chapters: "As specified in curriculum",
      pages: module.primary_reading_focus || "Reading focus as defined"
    },
    time_allocation: typeof module.time_allocation === 'object' 
      ? module.time_allocation.total || "Time as allocated"
      : module.time_allocation || "Time not specified"
  }))

  return {
    title: dbCurriculum.title || "Untitled Curriculum",
    executive_overview: {
      learning_objective: dbCurriculum.executive_overview || "No learning objective provided",
      time_commitment: `${dbCurriculum.daily_modules?.length || 0} days of intensive study`,
      prerequisites: dbCurriculum.knowledge_framework?.foundational_concepts || "Prerequisites as defined in curriculum",
      learning_outcome: dbCurriculum.knowledge_framework?.synthesis_goals || "Learning outcomes as defined in curriculum"
    },
    visual_learning_path: visualLearningPath,
    daily_modules: dailyModules
  }
}

export default async function Dashboard() {
  // Get the current user - redirect to login if not authenticated
  const user = await stackServerApp.getUser({ or: "redirect" })

  // Fetch the user's latest curriculum
  const curriculumResult = await fetchLatestCurriculum(user.id)
  
  // Transform and use the fetched curriculum or fallback data
  let curriculumData
  if (curriculumResult.success && curriculumResult.data?.full_curriculum_data) {
    curriculumData = {
      curriculum: transformDatabaseCurriculum(curriculumResult.data.full_curriculum_data)
    }
  } else {
    curriculumData = fallbackCurriculumData
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading curriculum...</div>}>
            <CurriculumContent curriculum={curriculumData.curriculum} />
          </Suspense>
        </SidebarInset>
        <RightSidebar />
      </div>
    </SidebarProvider>
  )
}
