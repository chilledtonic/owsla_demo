"use client"

import { useState, useEffect } from "react"
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Download, 
  X, 
  Plus, 
  BookOpen, 
  FileText, 
  Youtube,
  GripVertical
} from "lucide-react"
import { CourseEditorProps, CourseData, DailyModule, Resource } from "@/types/course-editor"
import { ResourceLibrary } from "@/components/course-editor/resource-library"
import { DailyModuleEditor } from "@/components/course-editor/daily-module-editor"
import { CourseMetadataEditor } from "@/components/course-editor/course-metadata-editor"
import { ExportDialog } from "@/components/course-editor/export-dialog"

const defaultCourse: CourseData = {
  title: "New Course",
  executive_overview: "",
  daily_modules: [
    {
      day: 1,
      date: new Date().toISOString().split('T')[0],
      title: "Day 1",
      key_insights: [],
      core_concepts: [],
      time_allocation: {
        total: "3 hours",
        primary_text: "120 minutes",
        supplementary_materials: "60 minutes"
      },
      knowledge_benchmark: {
        connect: "",
        explain: "",
        awareness: "",
        recognize: "",
        understand: ""
      },
      practical_connections: "",
      primary_reading_focus: "",
      supplementary_readings: []
    }
  ],
  primary_resource: {
    isbn: "",
    year: "",
    title: "",
    author: "",
    publisher: ""
  },
  knowledge_framework: {
    synthesis_goals: "",
    advanced_applications: "",
    foundational_concepts: ""
  },
  visual_learning_path: {
    "day_1": ""
  },
  resource_requirements: {
    primary_book: {
      isbn: "",
      year: "",
      title: "",
      author: "",
      publisher: ""
    },
    academic_papers: [],
    equipment_needed: "",
    total_reading_time: "",
    supplementary_books: []
  }
}

export function CourseEditor({ 
  onCancel, 
  onSave, 
  onExport, 
  initialCourse 
}: CourseEditorProps) {
  const [course, setCourse] = useState<CourseData>(initialCourse || defaultCourse)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    setHasChanges(true)
  }, [course])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    // Handle dropping resources onto course elements
    if (active.data.current?.type === 'resource' && over.data.current?.type === 'droppable') {
      const resource = active.data.current.resource as Resource
      const dropArea = over.data.current.area
      
      // Add resource to appropriate location
      if (dropArea.type === 'daily_module' && dropArea.moduleDay) {
        setCourse(prev => ({
          ...prev,
          daily_modules: prev.daily_modules.map(module =>
            module.day === dropArea.moduleDay
              ? {
                  ...module,
                  supplementary_readings: [...module.supplementary_readings, resource]
                }
              : module
          )
        }))
      } else if (dropArea.type === 'primary_resource') {
        setCourse(prev => ({
          ...prev,
          primary_resource: {
            isbn: resource.isbn || "",
            year: resource.year || "",
            title: resource.title,
            author: resource.author,
            publisher: resource.publisher || ""
          }
        }))
      }
    }

    setActiveId(null)
  }

  const addDailyModule = () => {
    const newDay = course.daily_modules.length + 1
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + newDay - 1)
    
    const newModule: DailyModule = {
      day: newDay,
      date: newDate.toISOString().split('T')[0],
      title: `Day ${newDay}`,
      key_insights: [],
      core_concepts: [],
      time_allocation: {
        total: "3 hours",
        primary_text: "120 minutes",
        supplementary_materials: "60 minutes"
      },
      knowledge_benchmark: {
        connect: "",
        explain: "",
        awareness: "",
        recognize: "",
        understand: ""
      },
      practical_connections: "",
      primary_reading_focus: "",
      supplementary_readings: []
    }

    setCourse(prev => ({
      ...prev,
      daily_modules: [...prev.daily_modules, newModule],
      visual_learning_path: {
        ...prev.visual_learning_path,
        [`day_${newDay}`]: ""
      }
    }))
  }

  const removeDailyModule = (day: number) => {
    setCourse(prev => ({
      ...prev,
      daily_modules: prev.daily_modules
        .filter(module => module.day !== day)
        .map((module, index) => ({ ...module, day: index + 1 })),
      visual_learning_path: Object.fromEntries(
        Object.entries(prev.visual_learning_path)
          .filter(([key]) => key !== `day_${day}`)
          .map(([key, value], index) => [`day_${index + 1}`, value])
      )
    }))
  }

  const handleSave = () => {
    onSave?.(course)
  }

  const handleExport = () => {
    setShowExportDialog(true)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Course Editor</h1>
                <p className="text-sm text-muted-foreground">
                  Drag and drop resources to build your custom course
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleSave} disabled={!hasChanges}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Course
                </Button>
                <Button onClick={handleExport} disabled={!course.title || course.daily_modules.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Pack
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Resource Library */}
              <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
                <div className="max-h-[calc(100vh-8rem)] overflow-hidden">
                  <ResourceLibrary />
                </div>
              </div>

              {/* Course Editor */}
              <div className="lg:col-span-3">
                <div className="space-y-6 pb-20">
                    {/* Course Metadata */}
                    <CourseMetadataEditor 
                      course={course}
                      onUpdate={setCourse}
                    />

                    <Separator />

                    {/* Daily Modules */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Daily Modules</h2>
                        <Button onClick={addDailyModule} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Day
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {course.daily_modules.map((module, index) => (
                          <DailyModuleEditor
                            key={module.day}
                            module={module}
                            onUpdate={(updatedModule: DailyModule) => {
                              setCourse(prev => ({
                                ...prev,
                                daily_modules: prev.daily_modules.map(m =>
                                  m.day === module.day ? updatedModule : m
                                )
                              }))
                            }}
                            onRemove={() => removeDailyModule(module.day)}
                            canRemove={course.daily_modules.length > 1}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Course Summary */}
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <h3 className="font-medium mb-2">Course Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Days:</span>{" "}
                          <span className="font-medium">{course.daily_modules.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Resources:</span>{" "}
                          <span className="font-medium">
                            {course.daily_modules.reduce((acc, module) => 
                              acc + module.supplementary_readings.length, 0
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Has Primary Resource:</span>{" "}
                          <Badge variant={course.primary_resource.title ? "default" : "secondary"}>
                            {course.primary_resource.title ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Overview Complete:</span>{" "}
                          <Badge variant={course.executive_overview ? "default" : "secondary"}>
                            {course.executive_overview ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog 
        course={course}
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </DndContext>
  )
} 