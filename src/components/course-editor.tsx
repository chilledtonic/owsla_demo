"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Save, 
  Download, 
  X, 
  Plus, 
  BookOpen, 
  FileText,
  GripVertical,
  Edit,
  Package,
  Target,
  Play,
  Video,
  Clock,
  ExternalLink,
  RefreshCw
} from "lucide-react"
import { CourseEditorProps, CourseData, DailyModule, Resource } from "@/types/course-editor"
import { ResourceLibrary } from "@/components/course-editor/resource-library"
import { DailyModuleEditor } from "@/components/course-editor/daily-module-editor"
import { TopstersExport } from "@/components/course-editor/topsters-export"
import { BookCover } from "@/components/ui/book-cover"

// YouTube metadata types (from new-curriculum-form.tsx)
interface YoutubeMetadata {
  title: string
  author_name: string
  thumbnail_url: string
  html: string
}

interface ExtendedYoutubeMetadata extends YoutubeMetadata {
  duration?: number
  durationString?: string
}

// DroppableArea component for primary resource
interface DroppableAreaProps {
  id: string
  children: React.ReactNode
  className?: string
  type: 'primary_resource'
}

function DroppableArea({ id, children, className = "", type }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'droppable',
      area: { type }
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''}`}
    >
      {children}
    </div>
  )
}

const defaultCourse: CourseData = {
  type: 'book',
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
  initialCourse,
  isSaving = false
}: CourseEditorProps) {
  const [course, setCourse] = useState<CourseData>(initialCourse || defaultCourse)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  
  // Video metadata state
  const [videoMetadata, setVideoMetadata] = useState<ExtendedYoutubeMetadata | null>(null)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  
  // Custom cover states
  const [customBookCover, setCustomBookCover] = useState<string | null>(null)
  const [customVideoThumbnail, setCustomVideoThumbnail] = useState<string | null>(null)
  // Add custom covers for supplementary resources - keyed by resource ID
  const [customSupplementaryCovers, setCustomSupplementaryCovers] = useState<Map<string, string>>(new Map())
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState<'book' | 'video' | string | null>(null)
  const [videoUrl, setVideoUrl] = useState("")

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

  // File drop handlers
  const handleFileRead = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/') && 
           ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  }

  const handleFileDrop = async (e: React.DragEvent, type: 'book' | 'video' | string) => {
    e.preventDefault()
    setIsDraggingFile(null)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (type === 'book') {
          setCustomBookCover(dataUrl)
        } else if (type === 'video') {
          setCustomVideoThumbnail(dataUrl)
        } else {
          // Handle supplementary resource custom cover
          setCustomSupplementaryCovers(prev => new Map(prev.set(type, dataUrl)))
        }
      }
      reader.readAsDataURL(imageFile)
    }
  }

  const handleDragOver = (e: React.DragEvent, type: 'book' | 'video' | string) => {
    e.preventDefault()
    setIsDraggingFile(type)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(null)
    }
  }

  const clearCustomCover = (type: 'book' | 'video' | string) => {
    if (type === 'book') {
      setCustomBookCover(null)
    } else if (type === 'video') {
      setCustomVideoThumbnail(null)
    } else {
      // Clear supplementary resource custom cover
      setCustomSupplementaryCovers(prev => {
        const newMap = new Map(prev)
        newMap.delete(type)
        return newMap
      })
    }
  }

  // YouTube metadata fetching functions (adapted from new-curriculum-form.tsx)
  const extractYouTubeVideoId = useCallback((url: string): string | null => {
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    
    for (const pattern of regexPatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }, [])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getYouTubeVideoDuration = async (videoId: string): Promise<number | null> => {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`)
      if (!response.ok) return null
      
      const data = await response.json()
      if (!data.items?.[0]?.contentDetails?.duration) return null
      
      const duration = data.items[0].contentDetails.duration
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return null
      
      const hours = parseInt(match[1] || '0')
      const minutes = parseInt(match[2] || '0')
      const seconds = parseInt(match[3] || '0')
      
      return hours * 3600 + minutes * 60 + seconds
    } catch {
      return null
    }
  }

  const fetchVideoMetadata = useCallback(async (url: string) => {
    if (!url) {
      setVideoMetadata(null)
      setMetadataError(null)
      return
    }

    setFetchingMetadata(true)
    setMetadataError(null)
    
    try {
      const videoId = extractYouTubeVideoId(url)
      if (!videoId) {
        setMetadataError("Invalid YouTube URL")
        setVideoMetadata(null)
        return
      }

      const youtube = await import('youtube-metadata-from-url')
      const basicMetadata = await youtube.metadata(url)
      const duration = await getYouTubeVideoDuration(videoId)
      
      const extendedMetadata: ExtendedYoutubeMetadata = {
        ...basicMetadata,
        duration: duration || undefined,
        durationString: duration ? formatDuration(duration) : undefined
      }
      
      setVideoMetadata(extendedMetadata)
      
      // Auto-populate video fields
      if (course.type === 'video') {
        setCourse(prev => ({
          ...prev,
          primary_video: {
            ...prev.primary_video,
            title: basicMetadata.title,
            channel: basicMetadata.author_name,
            duration: extendedMetadata.durationString || "",
            url: url,
            video_id: videoId,
            published: ""
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching video metadata:', error)
      setMetadataError("Failed to fetch video information")
      setVideoMetadata(null)
    } finally {
      setFetchingMetadata(false)
    }
  }, [extractYouTubeVideoId, course.type])

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
        if (course.type === 'book' && resource.type === 'book') {
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
        } else if (course.type === 'video' && resource.type === 'video') {
          // Handle video resource drop - extract video ID if it's a YouTube URL
          const videoId = extractYouTubeVideoId(resource.title) // Assuming title contains URL
          setCourse(prev => ({
            ...prev,
            primary_video: {
              title: resource.title,
              channel: resource.author,
              duration: resource.reading_time || "",
              url: resource.title, // Assuming title contains the URL
              video_id: videoId || "",
              published: resource.year || ""
            }
          }))
          
          // Also fetch metadata if it's a valid YouTube URL
          if (videoId && resource.title.includes('youtube')) {
            fetchVideoMetadata(resource.title)
          }
        }
      }
    }

    setActiveId(null)
  }

  const handleCourseTypeChange = (newType: 'book' | 'video') => {
    setCourse(prev => {
      const updated = { ...prev, type: newType }
      
      if (newType === 'video') {
        // Initialize video fields if switching to video
        updated.primary_video = updated.primary_video || {
          title: "",
          channel: "",
          duration: "",
          url: "",
          published: "",
          video_id: ""
        }
        updated.resource_requirements = {
          ...updated.resource_requirements,
          primary_video: updated.primary_video,
          total_time_commitment: updated.resource_requirements.total_time_commitment || ""
        }
      } else {
        // Initialize book fields if switching to book
        updated.primary_resource = updated.primary_resource || {
          isbn: "",
          year: "",
          title: "",
          author: "",
          publisher: ""
        }
        updated.resource_requirements = {
          ...updated.resource_requirements,
          primary_book: updated.primary_resource,
          total_reading_time: updated.resource_requirements.total_reading_time || ""
        }
      }
      
      return updated
    })
  }

  const addDailyModule = () => {
    const nextDay = Math.max(...course.daily_modules.map(m => m.day), 0) + 1
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + nextDay - 1)
    
    const newModule: DailyModule = {
      day: nextDay,
      date: nextDate.toISOString().split('T')[0],
      title: `Day ${nextDay}`,
      key_insights: [],
      core_concepts: [],
      time_allocation: course.type === 'video' 
        ? {
            total: "3 hours",
            video_viewing: "90 minutes",
            preparation: "30 minutes",
            supplementary_materials: "45 minutes",
            synthesis: "15 minutes"
          }
        : {
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
      supplementary_readings: [],
      ...(course.type === 'video' && {
        video_segment: {
        start: "00:00",
        end: "10:00",
        duration: "10:00",
        chapters: [],
        rewatch_segments: []
        },
        pre_viewing_primer: "",
        post_viewing_synthesis: ""
      })
    }

    setCourse(prev => ({
      ...prev,
      daily_modules: [...prev.daily_modules, newModule].sort((a, b) => a.day - b.day),
      visual_learning_path: {
        ...prev.visual_learning_path,
        [`day_${nextDay}`]: ""
      }
    }))
  }

  const removeDailyModule = (day: number) => {
    setCourse(prev => {
      const updatedModules = prev.daily_modules.filter(m => m.day !== day)
      const updatedVisualPath = { ...prev.visual_learning_path }
      delete updatedVisualPath[`day_${day}`]
      
      return {
      ...prev,
        daily_modules: updatedModules,
        visual_learning_path: updatedVisualPath
      }
    })
  }

  const handleSave = async () => {
    if (onSave) {
      await onSave(course)
    }
  }

  const handleExport = () => {
    onExport?.(course)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen">
        {/* Main Content - Now truly multi-column */}
        <div className="flex-1 flex flex-col">
          {/* Compact Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    {course.type === 'video' ? (
                    <Play className="h-5 w-5 text-primary" />
                    ) : (
                    <BookOpen className="h-5 w-5 text-primary" />
                    )}
                  <h1 className="text-lg font-bold">
                    {course.title || "New Course"}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {course.type === 'video' ? 'Video Course' : 'Book Course'}
                  </Badge>
                  <span>•</span>
                  <span>{course.daily_modules.length} day{course.daily_modules.length !== 1 ? 's' : ''}</span>
                    {(course.title && (course.type === 'video' ? course.primary_video?.title : course.primary_resource?.title)) && (
                    <>
                      <span>•</span>
                      <Badge variant="default" className="text-xs">
                        Ready 🚀
                      </Badge>
                    </>
                    )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={onCancel} variant="ghost" size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" disabled={!hasChanges || isSaving}>
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button onClick={handleExport} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Export Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="editor" className="flex-1 flex m-0">
              {/* Three-column layout */}
              <div className="flex-1 grid grid-cols-12 gap-4 p-4">
                
                {/* Left Column - Course Metadata (3 cols) */}
                <div className="col-span-3 space-y-4">
                <ScrollArea className="h-full">
                    <div className="space-y-6 pr-2">
                      {/* Course Basics */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Target className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">Course Basics</h3>
                        </div>
                        
                        {/* Course Type */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Course Type</Label>
                          <Select value={course.type} onValueChange={handleCourseTypeChange}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="book">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  Book Course
                                </div>
                              </SelectItem>
                              <SelectItem value="video">
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  Video Course
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Course Title */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Course Title</Label>
                          <Input
                            value={course.title}
                            onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter course title..."
                            className="h-9"
                          />
                        </div>

                        {/* Course Description */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Description</Label>
                          <Textarea
                            value={course.executive_overview}
                            onChange={(e) => setCourse(prev => ({ ...prev, executive_overview: e.target.value }))}
                            placeholder="What will students learn from this course?"
                            className="h-20 text-sm"
                          />
                        </div>
                      </div>

                      {/* Primary Resource/Video */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          {course.type === 'video' ? (
                            <Video className="h-4 w-4 text-primary" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-primary" />
                          )}
                          <h3 className="font-semibold">Primary {course.type === 'video' ? 'Video' : 'Resource'}</h3>
                        </div>
                        
                        {(customBookCover || customVideoThumbnail || course.primary_resource?.isbn || videoMetadata?.thumbnail_url) && (
                          <p className="text-xs text-muted-foreground">
                            💡 Drag an image file onto the cover to customize it
                          </p>
                        )}

                        {course.type === 'video' ? (
                          <div className="space-y-3">
                            {/* Video Cover Display */}
                            {(customVideoThumbnail || videoMetadata?.thumbnail_url || course.primary_video?.title) && (
                              <div className="flex justify-center">
                                <div 
                                  className={`relative group cursor-pointer transition-all duration-200 ${
                                    isDraggingFile === 'video' ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''
                                  }`}
                                  onDrop={(e) => handleFileDrop(e, 'video')}
                                  onDragOver={(e) => handleDragOver(e, 'video')}
                                  onDragLeave={handleDragLeave}
                                >
                                  {customVideoThumbnail ? (
                                    <img 
                                      src={customVideoThumbnail} 
                                      alt="Custom video thumbnail"
                                      className="w-32 h-24 object-cover rounded-lg border shadow-sm"
                                    />
                                  ) : videoMetadata?.thumbnail_url ? (
                                    <img 
                                      src={videoMetadata.thumbnail_url} 
                                      alt="Video thumbnail"
                                      className="w-32 h-24 object-cover rounded-lg border shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-32 h-24 bg-muted rounded-lg border flex items-center justify-center">
                                      <Video className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  
                                  {/* Overlay for drop indication */}
                                  <div className={`absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center transition-opacity ${
                                    isDraggingFile === 'video' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  }`}>
                                    <div className="text-center text-white">
                                      <ExternalLink className="h-4 w-4 mx-auto mb-1" />
                                      <span className="text-xs font-medium">Drop image</span>
                                    </div>
                                  </div>

                                  {course.primary_video?.title && (
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                                      <Badge variant="secondary" className="text-xs">
                                        Primary Video
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {/* Clear custom cover button */}
                                  {customVideoThumbnail && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => clearCustomCover('video')}
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            <DroppableArea
                              id="primary-video"
                              type="primary_resource"
                              className="space-y-3 p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg transition-colors"
                            >
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">YouTube URL</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={course.primary_video?.url || ""}
                                    onChange={(e) => {
                                      const url = e.target.value
                                      setCourse(prev => ({
                                        ...prev,
                                        primary_video: {
                                          ...prev.primary_video,
                                          url: url,
                                          title: prev.primary_video?.title || "",
                                          channel: prev.primary_video?.channel || "",
                                          duration: prev.primary_video?.duration || "",
                                          published: prev.primary_video?.published || "",
                                          video_id: prev.primary_video?.video_id || ""
                                        }
                                      }))
                                      
                                      // Debounced metadata fetch
                                      if (url) {
                                        const timer = setTimeout(() => {
                                          fetchVideoMetadata(url)
                                        }, 500)
                                        return () => clearTimeout(timer)
                                      }
                                    }}
                                    placeholder="https://youtube.com/watch?v=... or drag a video from library"
                                    className="h-9"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fetchVideoMetadata(course.primary_video?.url || "")}
                                    disabled={fetchingMetadata || !course.primary_video?.url}
                                    className="h-9 px-3"
                                  >
                                    {fetchingMetadata ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <ExternalLink className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                {metadataError && (
                                  <p className="text-xs text-red-500">{metadataError}</p>
                                )}
                              </div>

                              {videoMetadata && (
                                <div className="p-3 border rounded-lg bg-muted/30">
                                  <div className="flex gap-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium leading-tight line-clamp-2">
                                        {videoMetadata.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground">
                                        by {videoMetadata.author_name}
                                      </p>
                                      {videoMetadata.durationString && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <Clock className="h-3 w-3" />
                                          <span className="text-xs">{videoMetadata.durationString}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Video Title</Label>
                              <Input
                                value={course.primary_video?.title || ""}
                                onChange={(e) => setCourse(prev => ({
                                  ...prev,
                                  primary_video: {
                                    ...prev.primary_video,
                                    title: e.target.value,
                                    channel: prev.primary_video?.channel || "",
                                    duration: prev.primary_video?.duration || "",
                                    url: prev.primary_video?.url || "",
                                    published: prev.primary_video?.published || "",
                                    video_id: prev.primary_video?.video_id || ""
                                  }
                                }))}
                                placeholder="Video title..."
                                className="h-9"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Channel</Label>
                              <Input
                                value={course.primary_video?.channel || ""}
                                onChange={(e) => setCourse(prev => ({
                                  ...prev,
                                  primary_video: {
                                    ...prev.primary_video,
                                    channel: e.target.value,
                                    title: prev.primary_video?.title || "",
                                    duration: prev.primary_video?.duration || "",
                                    url: prev.primary_video?.url || "",
                                    published: prev.primary_video?.published || "",
                                    video_id: prev.primary_video?.video_id || ""
                                  }
                                }))}
                                placeholder="Channel name..."
                                className="h-9"
                              />
                            </div>
                          </DroppableArea>
                        </div>
                                              ) : (
                          <div className="space-y-3">
                            {/* Book Cover Display */}
                            {(customBookCover || course.primary_resource?.isbn || course.primary_resource?.title) && (
                              <div className="flex justify-center">
                                <div 
                                  className={`relative group cursor-pointer transition-all duration-200 ${
                                    isDraggingFile === 'book' ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''
                                  }`}
                                  onDrop={(e) => handleFileDrop(e, 'book')}
                                  onDragOver={(e) => handleDragOver(e, 'book')}
                                  onDragLeave={handleDragLeave}
                                >
                                  {customBookCover ? (
                                    <img 
                                      src={customBookCover} 
                                      alt="Custom book cover"
                                      className="h-32 w-24 object-cover rounded-lg border shadow-sm"
                                    />
                                  ) : course.primary_resource?.isbn ? (
                                    <BookCover 
                                      isbn={course.primary_resource.isbn}
                                      title={course.primary_resource.title}
                                      author={course.primary_resource.author}
                                      className="h-32 w-24 shadow-sm"
                                    />
                                  ) : (
                                    <div className="h-32 w-24 bg-muted rounded-lg border flex items-center justify-center">
                                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  
                                  {/* Overlay for drop indication */}
                                  <div className={`absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center transition-opacity ${
                                    isDraggingFile === 'book' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  }`}>
                                    <div className="text-center text-white">
                                      <ExternalLink className="h-4 w-4 mx-auto mb-1" />
                                      <span className="text-xs font-medium">Drop image</span>
                                    </div>
                                  </div>

                                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                                    <Badge variant="secondary" className="text-xs">
                                      Primary Book
                                    </Badge>
                                  </div>
                                  
                                  {/* Clear custom cover button */}
                                  {customBookCover && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => clearCustomCover('book')}
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            <DroppableArea
                              id="primary-book"
                              type="primary_resource"
                              className="space-y-3 p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg transition-colors"
                            >
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Book Title</Label>
                               <Input
                                 value={course.primary_resource?.title || ""}
                                 onChange={(e) => setCourse(prev => ({
                                   ...prev,
                                   primary_resource: {
                                     ...prev.primary_resource,
                                     title: e.target.value,
                                     isbn: prev.primary_resource?.isbn || "",
                                     year: prev.primary_resource?.year || "",
                                     author: prev.primary_resource?.author || "",
                                     publisher: prev.primary_resource?.publisher || ""
                                   }
                                 }))}
                                 placeholder="Book title... or drag a book from library"
                                 className="h-9"
                               />
                             </div>

                             <div className="space-y-2">
                               <Label className="text-sm font-medium">Author</Label>
                               <Input
                                 value={course.primary_resource?.author || ""}
                                 onChange={(e) => setCourse(prev => ({
                                   ...prev,
                                   primary_resource: {
                                     ...prev.primary_resource,
                                     author: e.target.value,
                                     title: prev.primary_resource?.title || "",
                                     isbn: prev.primary_resource?.isbn || "",
                                     year: prev.primary_resource?.year || "",
                                     publisher: prev.primary_resource?.publisher || ""
                                   }
                                 }))}
                                 placeholder="Author name..."
                                 className="h-9"
                               />
                             </div>

                             <div className="grid grid-cols-2 gap-2">
                               <div className="space-y-2">
                                 <Label className="text-sm font-medium">ISBN</Label>
                                 <Input
                                   value={course.primary_resource?.isbn || ""}
                                   onChange={(e) => setCourse(prev => ({
                                     ...prev,
                                     primary_resource: {
                                       ...prev.primary_resource,
                                       isbn: e.target.value,
                                       title: prev.primary_resource?.title || "",
                                       year: prev.primary_resource?.year || "",
                                       author: prev.primary_resource?.author || "",
                                       publisher: prev.primary_resource?.publisher || ""
                                     }
                                   }))}
                                   placeholder="ISBN..."
                                   className="h-9"
                                 />
                               </div>
                               <div className="space-y-2">
                                 <Label className="text-sm font-medium">Year</Label>
                                 <Input
                                   value={course.primary_resource?.year || ""}
                                   onChange={(e) => setCourse(prev => ({
                                     ...prev,
                                     primary_resource: {
                                       ...prev.primary_resource,
                                       year: e.target.value,
                                       title: prev.primary_resource?.title || "",
                                       isbn: prev.primary_resource?.isbn || "",
                                       author: prev.primary_resource?.author || "",
                                       publisher: prev.primary_resource?.publisher || ""
                                     }
                                   }))}
                                   placeholder="Year..."
                                   className="h-9"
                                 />
                               </div>
                             </div>
                           </DroppableArea>
                          </div>
                        )}
                      </div>

                      {/* Progress Summary */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Target className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">Progress</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${course.title ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>Title</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${(course.type === 'video' ? course.primary_video?.title : course.primary_resource?.title) ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>Resource</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${course.daily_modules.some(m => m.title && m.primary_reading_focus) ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>Modules</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${course.executive_overview ? 'bg-green-500' : 'bg-yellow-400'}`} />
                            <span>Description</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>

                {/* Center Column - Daily Modules (6 cols) */}
                <div className="col-span-6 border-l border-r px-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b sticky top-0 bg-background">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">Daily Modules</h3>
                          <Badge variant="outline" className="text-xs">
                            {course.daily_modules.filter(m => m.title && m.primary_reading_focus).length}/{course.daily_modules.length} Complete
                          </Badge>
                        </div>
                        <Button onClick={addDailyModule} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Day
                        </Button>
                      </div>

                      {course.daily_modules.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center bg-muted/20">
                          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">Create Your First Daily Module</h3>
                          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            Each day should have a clear focus and manageable amount of content. Start with Day 1 to set the foundation.
                          </p>
                          <Button onClick={addDailyModule}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Day 1
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {course.daily_modules.map((module, index) => (
                            <DailyModuleEditor
                              key={module.day}
                              module={module}
                              onUpdate={(updatedModule) => {
                                setCourse(prev => ({
                                  ...prev,
                                  daily_modules: prev.daily_modules.map(m =>
                                    m.day === module.day ? updatedModule : m
                                  )
                                }))
                              }}
                              onRemove={() => removeDailyModule(module.day)}
                              canRemove={course.daily_modules.length > 1}
                              customSupplementaryCovers={customSupplementaryCovers}
                              onSupplementaryFileDrop={handleFileDrop}
                              onSupplementaryDragOver={handleDragOver}
                              onSupplementaryDragLeave={handleDragLeave}
                              onClearSupplementaryCover={clearCustomCover}
                              isDraggingFile={isDraggingFile}
                            />
                          ))}

                          <div className="pt-4 border-t border-dashed">
                            <Button 
                              onClick={addDailyModule} 
                              variant="outline" 
                              className="w-full h-12 border-dashed"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Day {course.daily_modules.length + 1}
                            </Button>
                          </div>
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </div>
              
                {/* Right Column - Resource Library & Tools (3 cols) */}
                <div className="col-span-3">
                <ResourceLibrary />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="flex-1 m-0">
              <div className="h-full p-6">
                <TopstersExport 
                  course={course} 
                  customBookCover={customBookCover}
                  customVideoThumbnail={customVideoThumbnail}
                  customSupplementaryCovers={customSupplementaryCovers}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DndContext>
  )
} 