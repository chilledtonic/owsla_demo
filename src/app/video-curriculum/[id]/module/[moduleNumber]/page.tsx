import { getCurriculumById } from "@/lib/database"
import { redirect } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { VideoCurriculumContent } from "@/components/video-curriculum-content"
import { CurriculumData } from "@/lib/database"

// Transform database curriculum to display format for video curricula
function transformDatabaseCurriculum(dbCurriculum: {
  title?: string;
  executive_overview?: string;
  primary_video?: {
    title?: string;
    url?: string;
    video_id?: string;
    video_duration?: string;
  };
  visual_learning_path?: Record<string, unknown>;
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
  const dailyModules = (dbCurriculum.daily_modules || []).map((module: any) => ({
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
      total: module.time_allocation?.total || "3 hours",
      video_viewing: module.time_allocation?.video_viewing || "90 minutes",
      preparation: module.time_allocation?.preparation || "30 minutes",
      supplementary_materials: module.time_allocation?.supplementary_materials || "45 minutes",
      synthesis: module.time_allocation?.synthesis || "15 minutes"
    },
    knowledge_benchmark: {
      connect: module.knowledge_benchmark?.connect || "Connect concepts to real-world applications",
      explain: module.knowledge_benchmark?.explain || "Explain key concepts in your own words",
      awareness: module.knowledge_benchmark?.awareness || "Be aware of the broader context and significance",
      recognize: module.knowledge_benchmark?.recognize || "Recognize patterns and relationships",
      understand: module.knowledge_benchmark?.understand || "Understand fundamental principles"
    },
    pre_viewing_primer: module.pre_viewing_primer || "Prepare for this segment by reviewing the following concepts",
    primary_reading_focus: module.primary_reading_focus || "Focus on understanding the core concepts",
    post_viewing_synthesis: module.post_viewing_synthesis || "Reflect on the key points and consider their applications",
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
    primary_video: {
      title: String(dbCurriculum.primary_video?.title || "Primary Video"),
      channel: String(rawCurriculumData?.primary_video_channel || "Unknown Channel"),
      duration: String(dbCurriculum.primary_video?.video_duration || "00:00:00"),
      url: String(dbCurriculum.primary_video?.url || ""),
      published: String(rawCurriculumData?.created_at || new Date().toISOString().split('T')[0]),
      video_id: String(dbCurriculum.primary_video?.video_id || "")
    },
    visual_learning_path: Object.fromEntries(
      Object.entries(dbCurriculum.visual_learning_path || {}).map(([key, value]) => [key, String(value)])
    ) as Record<string, string>,
    daily_modules: dailyModules
  }
}

export default async function VideoCurriculumModulePage({ 
  params 
}: { 
  params: Promise<{ id: string; moduleNumber: string }> 
}) {
  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  const moduleNumber = parseInt(resolvedParams.moduleNumber)
  
  if (isNaN(id) || isNaN(moduleNumber)) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Error</h1>
            <p className="text-muted-foreground">Invalid curriculum ID or module number.</p>
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

  // Redirect to text curriculum page if this is not a video curriculum
  if (curriculum.curriculum_type !== 'video') {
    redirect(`/curriculum/${curriculum.id}/module/${moduleNumber}`)
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
  
  // Validate module number
  if (moduleNumber < 1 || moduleNumber > transformedCurriculum.daily_modules.length) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Module Not Found</h1>
            <p className="text-muted-foreground">
              Module {moduleNumber} does not exist. This curriculum has {transformedCurriculum.daily_modules.length} modules.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const currentModule = transformedCurriculum.daily_modules[moduleNumber - 1]

  return (
    <AppLayout activeCurriculumId={curriculum.id}>
      <VideoCurriculumContent
        curriculum={transformedCurriculum}
        currentModule={currentModule}
        rawCurriculumId={id}
      />
    </AppLayout>
  )
} 