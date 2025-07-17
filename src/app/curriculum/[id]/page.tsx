import { getCurriculumById } from "@/lib/database"
import { calculateCurrentCurriculumDay } from "@/lib/utils"
import { redirect } from "next/navigation"
import { CurriculumView } from "@/components/curriculum-view"
import { AppLayout } from "@/components/app-layout"
import { CurriculumData } from "@/lib/database"

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

export default async function CurriculumPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  if (isNaN(id)) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Error</h1>
            <p className="text-muted-foreground">Invalid curriculum ID.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const curriculum = await getCurriculumById(id)

  if (!curriculum) {
  return (
      <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Curriculum Not Found</h1>
              <p className="text-muted-foreground">The requested curriculum could not be found.</p>
            </div>
          </div>
      </AppLayout>
    )
  }

  // Redirect to video curriculum page if this is a video curriculum
  if (curriculum.curriculum_type === 'video') {
    redirect(`/video-curriculum/${curriculum.id}`)
  }
  
  if (!curriculum.full_curriculum_data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Error</h1>
            <p className="text-muted-foreground">Curriculum data is missing.</p>
          </div>
        </div>
    </AppLayout>
    )
  }
  
  const transformedCurriculum = transformDatabaseCurriculum(curriculum.full_curriculum_data, curriculum)
  
  const { currentDay: calculatedCurrentDay, actualDay: calculatedActualDay } = 
    calculateCurrentCurriculumDay(transformedCurriculum.daily_modules)

  return (
    <CurriculumView
      initialCurriculum={transformedCurriculum}
      initialCurrentDay={calculatedCurrentDay}
      initialActualDay={calculatedActualDay}
      rawCurriculum={curriculum}
    />
  )
} 