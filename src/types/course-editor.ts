export interface DailyModule {
  day: number
  date: string
  title: string
  key_insights: string[]
  core_concepts: string[]
  time_allocation: {
    total: string
    primary_text: string
    supplementary_materials: string
  }
  knowledge_benchmark: {
    connect: string
    explain: string
    awareness: string
    recognize: string
    understand: string
  }
  practical_connections: string
  primary_reading_focus: string
  supplementary_readings: Resource[]
}

export interface Resource {
  id?: string
  title: string
  author: string
  reading_time?: string
  focus?: string
  isbn?: string
  doi?: string
  year?: string
  journal?: string
  publisher?: string
  type: 'book' | 'paper' | 'article' | 'video' | 'other'
}

export interface PrimaryResource {
  isbn: string
  year: string
  title: string
  author: string
  publisher: string
}

export interface KnowledgeFramework {
  synthesis_goals: string
  advanced_applications: string
  foundational_concepts: string
}

export interface ResourceRequirements {
  primary_book: PrimaryResource
  academic_papers: Resource[]
  equipment_needed: string
  total_reading_time: string
  supplementary_books: Resource[]
}

export interface CourseData {
  id?: string
  title: string
  executive_overview: string
  daily_modules: DailyModule[]
  primary_resource: PrimaryResource
  knowledge_framework: KnowledgeFramework
  visual_learning_path: Record<string, string>
  resource_requirements: ResourceRequirements
}

export interface DroppableArea {
  id: string
  type: 'daily_module' | 'primary_resource' | 'supplementary_resources' | 'academic_papers'
  moduleDay?: number
}

export interface DragItem {
  id: string
  type: 'resource'
  resource: Resource
}

export interface CourseEditorProps {
  onCancel?: () => void
  onSave?: (course: CourseData) => void
  onExport?: (course: CourseData) => void
  initialCourse?: CourseData
} 