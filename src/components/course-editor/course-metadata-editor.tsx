"use client"

import { useDroppable } from "@dnd-kit/core"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookCover } from "@/components/ui/book-cover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { 
  BookOpen, 
  Target, 
  Brain, 
  X,
  Youtube,
  Play,
  Clock
} from "lucide-react"
import { CourseData, PrimaryResource } from "@/types/course-editor"

interface CourseMetadataEditorProps {
  course: CourseData
  onUpdate: (course: CourseData) => void
}

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

export function CourseMetadataEditor({ course, onUpdate }: CourseMetadataEditorProps) {
  const handleTitleChange = (title: string) => {
    onUpdate({ ...course, title })
  }

  const handleOverviewChange = (executive_overview: string) => {
    onUpdate({ ...course, executive_overview })
  }

  const handleKnowledgeFrameworkChange = (key: keyof typeof course.knowledge_framework, value: string) => {
    onUpdate({
      ...course,
      knowledge_framework: {
        ...course.knowledge_framework,
        [key]: value
      }
    })
  }

  const handlePrimaryResourceChange = (key: keyof PrimaryResource, value: string) => {
    onUpdate({
      ...course,
      primary_resource: {
        ...(course.primary_resource || { isbn: "", year: "", title: "", author: "", publisher: "" }),
        [key]: value
      }
    })
  }

  const handlePrimaryVideoChange = (key: keyof NonNullable<CourseData['primary_video']>, value: string) => {
    onUpdate({
      ...course,
      primary_video: {
        ...(course.primary_video || { title: "", channel: "", duration: "", url: "", published: "", video_id: "" }),
        [key]: value,
        // Auto-extract video ID from YouTube URL
        ...(key === 'url' && value.includes('youtube.com/watch?v=') ? {
          video_id: value.split('v=')[1]?.split('&')[0] || ""
        } : {})
      }
    })
  }

  const handlePrimaryTypeChange = (type: 'book' | 'video') => {
    onUpdate({
      ...course,
      type: type,
      // Initialize the appropriate resource when switching
      ...(type === 'video' ? {
        primary_video: course.primary_video || {
          title: "",
          channel: "",
          duration: "",
          url: "",
          published: "",
          video_id: ""
        }
      } : {
        primary_resource: course.primary_resource || {
          isbn: "",
          year: "",
          title: "",
          author: "",
          publisher: ""
        }
      })
    })
  }

  const clearPrimaryResource = () => {
    if (course.type === 'video') {
      onUpdate({
        ...course,
        primary_video: {
          title: "",
          channel: "",
          duration: "",
          url: "",
          published: "",
          video_id: ""
        }
      })
    } else {
      onUpdate({
        ...course,
        primary_resource: {
          isbn: "",
          year: "",
          title: "",
          author: "",
          publisher: ""
        }
      })
    }
  }

  // Ensure primary_resource exists for all course types
  const primaryResource = course.primary_resource || { isbn: "", year: "", title: "", author: "", publisher: "" }
  const hasPrimaryResource = primaryResource.title && primaryResource.author

  return (
    <div className="space-y-8">
      {/* Course Overview Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Course Overview</h2>
            <p className="text-sm text-muted-foreground">Start with the basics - what&apos;s your course about?</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Course Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="course-title" className="text-base font-medium">Course Title</Label>
              <Badge variant={course.title ? "default" : "secondary"} className="text-xs">
                {course.title ? "✓" : "Required"}
              </Badge>
            </div>
            <Input
              id="course-title"
              value={course.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., &apos;Introduction to Data Science&apos; or &apos;Advanced Photography Techniques&apos;"
              className="text-lg font-medium h-12"
            />
            <p className="text-xs text-muted-foreground">Make it clear and compelling - this is what learners will see first</p>
          </div>

          {/* Executive Overview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="executive-overview" className="text-base font-medium">Course Description</Label>
              <Badge variant={course.executive_overview ? "default" : "secondary"} className="text-xs">
                {course.executive_overview ? "✓" : "Recommended"}
              </Badge>
            </div>
            <Textarea
              id="executive-overview"
              value={course.executive_overview}
              onChange={(e) => handleOverviewChange(e.target.value)}
              placeholder="Describe what learners will achieve, who this course is for, and what makes it valuable. Think of this as your course's elevator pitch..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {course.executive_overview.length}/300 characters • Help learners understand if this course is right for them
            </p>
          </div>
        </div>
      </div>

      {/* Primary Resource Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {course.type === 'video' ? (
                <Youtube className="h-6 w-6 text-primary" />
              ) : (
                <BookOpen className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {course.type === 'video' ? 'Primary Video' : 'Primary Resource'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {course.type === 'video' 
                  ? 'The main video content your course will be based on'
                  : 'The main book or resource your course will be based on'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={(course.type === 'video' ? course.primary_video?.title : course.primary_resource?.title) ? "default" : "secondary"} className="text-xs">
              {(course.type === 'video' ? course.primary_video?.title : course.primary_resource?.title) ? "✓" : "Required"}
            </Badge>
            <ToggleGroup 
              type="single" 
              value={course.type} 
              onValueChange={(value: 'book' | 'video') => {
                if (value) handlePrimaryTypeChange(value)
              }}
              className="h-9"
            >
              <ToggleGroupItem value="book" size="sm" className="h-9 px-4">
                <BookOpen className="h-4 w-4 mr-1" />
                Book
              </ToggleGroupItem>
              <ToggleGroupItem value="video" size="sm" className="h-9 px-4">
                <Youtube className="h-4 w-4 mr-1" />
                Video
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        
        {course.type === 'video' ? (
          // Video Mode
          <>
            {course.primary_video?.title ? (
              <div className="p-6 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{course.primary_video.title}</h4>
                        <p className="text-muted-foreground">{course.primary_video.channel}</p>
                        {course.primary_video.duration && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-4 w-4" />
                            {course.primary_video.duration}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearPrimaryResource}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Editable video fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Video Title</Label>
                        <Input
                          value={course.primary_video.title}
                          onChange={(e) => handlePrimaryVideoChange('title', e.target.value)}
                          placeholder="Video title"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Channel</Label>
                        <Input
                          value={course.primary_video.channel}
                          onChange={(e) => handlePrimaryVideoChange('channel', e.target.value)}
                          placeholder="Channel name"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Duration</Label>
                        <Input
                          value={course.primary_video.duration}
                          onChange={(e) => handlePrimaryVideoChange('duration', e.target.value)}
                          placeholder="e.g., 1H30M or 90 minutes"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Video URL</Label>
                        <Input
                          value={course.primary_video.url}
                          onChange={(e) => handlePrimaryVideoChange('url', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center bg-muted/20">
                <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Add Your Primary Video</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  This should be a comprehensive video (like a lecture, documentary, or tutorial) that your daily modules will reference
                </p>
                
                {/* Manual entry for video */}
                <div className="space-y-4 max-w-lg mx-auto">
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      value={course.primary_video?.title || ""}
                      onChange={(e) => handlePrimaryVideoChange('title', e.target.value)}
                      placeholder="Video title"
                      className="h-10"
                    />
                    <Input
                      value={course.primary_video?.channel || ""}
                      onChange={(e) => handlePrimaryVideoChange('channel', e.target.value)}
                      placeholder="Channel name"
                      className="h-10"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={course.primary_video?.duration || ""}
                        onChange={(e) => handlePrimaryVideoChange('duration', e.target.value)}
                        placeholder="Duration"
                        className="h-10"
                      />
                      <Input
                        value={course.primary_video?.url || ""}
                        onChange={(e) => handlePrimaryVideoChange('url', e.target.value)}
                        placeholder="YouTube URL"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Book Mode (existing functionality)
          <DroppableArea
            id="primary-resource-drop"
            type="primary_resource"
          >
            {hasPrimaryResource ? (
              <div className="p-6 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                <div className="flex items-start gap-4">
                  {primaryResource.isbn && (
                    <BookCover 
                      isbn={primaryResource.isbn}
                      title={primaryResource.title}
                      className="h-24 w-16 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{primaryResource.title}</h4>
                        <p className="text-muted-foreground">{primaryResource.author}</p>
                        <p className="text-sm text-muted-foreground">
                          {primaryResource.publisher} • {primaryResource.year}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearPrimaryResource}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Editable fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">ISBN</Label>
                        <Input
                          value={primaryResource.isbn}
                          onChange={(e) => handlePrimaryResourceChange('isbn', e.target.value)}
                          placeholder="ISBN"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Year</Label>
                        <Input
                          value={primaryResource.year}
                          onChange={(e) => handlePrimaryResourceChange('year', e.target.value)}
                          placeholder="Year"
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center bg-muted/20">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Add Your Primary Book</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  This should be the main textbook or resource your course is based on. You can drag a book from the library or enter details manually.
                </p>
                
                {/* Manual entry option */}
                <div className="space-y-4 max-w-lg mx-auto">
                  <div className="text-sm text-muted-foreground mb-3">Enter book details:</div>
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      value={primaryResource.title}
                      onChange={(e) => handlePrimaryResourceChange('title', e.target.value)}
                      placeholder="Book title"
                      className="h-10"
                    />
                    <Input
                      value={primaryResource.author}
                      onChange={(e) => handlePrimaryResourceChange('author', e.target.value)}
                      placeholder="Author"
                      className="h-10"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={primaryResource.publisher}
                        onChange={(e) => handlePrimaryResourceChange('publisher', e.target.value)}
                        placeholder="Publisher"
                        className="h-10"
                      />
                      <Input
                        value={primaryResource.year}
                        onChange={(e) => handlePrimaryResourceChange('year', e.target.value)}
                        placeholder="Year"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DroppableArea>
        )}
      </div>

      {/* Learning Framework Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Learning Framework</h2>
            <p className="text-sm text-muted-foreground">Define what learners will achieve at different stages</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="foundational-concepts" className="text-base font-medium">Foundation Building</Label>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <Textarea
              id="foundational-concepts"
              value={course.knowledge_framework.foundational_concepts}
              onChange={(e) => handleKnowledgeFrameworkChange('foundational_concepts', e.target.value)}
              placeholder="What basic concepts and principles will learners learn first? These are the building blocks for everything else..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Think: What do learners need to know before they can tackle more complex topics?</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="advanced-applications" className="text-base font-medium">Practical Application</Label>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <Textarea
              id="advanced-applications"
              value={course.knowledge_framework.advanced_applications}
              onChange={(e) => handleKnowledgeFrameworkChange('advanced_applications', e.target.value)}
              placeholder="How will learners apply what they've learned in real situations? What can they do with this knowledge..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Think: What practical skills or abilities will learners gain?</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="synthesis-goals" className="text-base font-medium">Mastery Goals</Label>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            <Textarea
              id="synthesis-goals"
              value={course.knowledge_framework.synthesis_goals}
              onChange={(e) => handleKnowledgeFrameworkChange('synthesis_goals', e.target.value)}
              placeholder="What will learners be able to create, analyze, or synthesize by the end? What&apos;s the ultimate learning outcome..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Think: How will learners demonstrate mastery? What&apos;s the end goal?</p>
          </div>
        </div>
      </div>
    </div>
  )
} 