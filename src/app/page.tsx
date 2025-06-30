"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { CurriculumContent } from "@/components/curriculum-content"
import { RightSidebar } from "@/components/right-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useUser } from "@stackframe/stack"

// Sample curriculum data
const curriculumData = {
  curriculum: {
    title: "Chaos Magic: Theory, Practice, and Contemporary Applications",
    executive_overview: {
      learning_objective:
        "To develop comprehensive understanding of chaos magic theory, practice, and its significance within contemporary occult traditions through critical analysis of foundational texts and practical application of core techniques.",
      time_commitment: "3-day intensive study program requiring 6-8 hours daily commitment",
      prerequisites:
        "Bachelor-level critical thinking skills, basic understanding of Western esotericism or religious studies, and openness to examining alternative belief systems from academic perspective",
      learning_outcome:
        "Students will synthesize chaos magic philosophy, demonstrate understanding of its historical development, and critically evaluate its theoretical foundations while developing practical familiarity with core techniques",
    },
    visual_learning_path: {
      milestone_1: "Historical Foundations and Theoretical Framework",
      milestone_2: "Core Practices and Methodological Applications",
      milestone_3: "Contemporary Developments and Critical Synthesis",
      milestone_4: "Practical Integration and Assessment",
      milestone_5: "Final Synthesis and Evaluation",
    },
    daily_modules: [
      {
        day: 1,
        title: "Foundations of Chaos Magic: Historical Development and Core Theory",
        milestone: "Historical Foundations and Theoretical Framework",
        primary_reading: {
          book: "Liber Null & Psychonaut by Peter J. Carroll",
          chapters: "Complete work",
          pages: "Focus on theoretical foundations",
        },
        time_allocation: "8 hours focused study including reading, note-taking, and practical exercises",
      },
      {
        day: 2,
        title: "Practical Methodologies and Contemporary Applications",
        milestone: "Core Practices and Methodological Applications",
        primary_reading: {
          book: "The Book of Results by Ray Sherwin",
          chapters: "Complete work",
          pages: "Focus on practical methodology sections",
        },
        time_allocation: "8 hours combining theoretical study with practical methodology analysis",
      },
      {
        day: 3,
        title: "Critical Analysis and Contemporary Significance",
        milestone: "Contemporary Developments and Critical Synthesis",
        primary_reading: {
          book: "Liber Kaos by Peter J. Carroll",
          chapters: "Complete work",
          pages: "Focus on advanced theoretical discussions",
        },
        time_allocation: "8 hours dedicated to critical analysis, synthesis, and final project completion",
      },
    ],
  },
}

export default function Dashboard() {
  // Protect this page - redirect to login if user is not authenticated
  const user = useUser({ or: "redirect" })

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <CurriculumContent curriculum={curriculumData.curriculum} />
        </SidebarInset>
        <RightSidebar />
      </div>
    </SidebarProvider>
  )
}
