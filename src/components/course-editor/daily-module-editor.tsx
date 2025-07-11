"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookCover } from "@/components/ui/book-cover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ResourceEditDialog } from "@/components/course-editor/resource-edit-dialog"
import { 
  Clock,
  Target,
  Lightbulb,
  BookOpen,
  FileText,
  Youtube,
  Globe,
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Pencil
} from "lucide-react"
import { DailyModule, Resource, VideoSegment } from "@/types/course-editor"

interface DailyModuleEditorProps {
  module: DailyModule
  onUpdate: (module: DailyModule) => void
  onRemove: () => void
  canRemove: boolean
  // Custom covers for supplementary resources
  customSupplementaryCovers?: Map<string, string>
  onSupplementaryFileDrop?: (e: React.DragEvent, type: string) => void
  onSupplementaryDragOver?: (e: React.DragEvent, type: string) => void
  onSupplementaryDragLeave?: (e: React.DragEvent) => void
  onClearSupplementaryCover?: (type: string) => void
  isDraggingFile?: 'book' | 'video' | string | null
}

interface DroppableAreaProps {
  id: string
  children: React.ReactNode
  className?: string
  type: 'daily_module'
  moduleDay: number
}

function DroppableArea({ id, children, className = "", type, moduleDay }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'droppable',
      area: { type, moduleDay }
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

function ResourceCard({ 
  resource, 
  onRemove,
  onEdit,
  customCover,
  onFileDrop,
  onDragOver,
  onDragLeave,
  onClearCustomCover,
  isDraggingFile
}: { 
  resource: Resource; 
  onRemove: () => void;
  onEdit: (updatedResource: Resource) => void;
  customCover?: string;
  onFileDrop?: (e: React.DragEvent, type: string) => void;
  onDragOver?: (e: React.DragEvent, type: string) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onClearCustomCover?: (type: string) => void;
  isDraggingFile?: 'book' | 'video' | string | null;
}) {
  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'book':
        return <BookOpen className="h-4 w-4" />
      case 'paper':
      case 'article':
        return <FileText className="h-4 w-4" />
      case 'video':
        return <Youtube className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const resourceId = resource.id || `${resource.title}-${resource.author}`
  const isDragging = isDraggingFile === resourceId
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  return (
    <div className="p-4 border rounded-lg bg-background">
      <div className="flex items-start gap-4">
        {/* Cover/Thumbnail with drag and drop */}
        <div className="flex-shrink-0">
          {(customCover || resource.isbn || resource.type === 'book') && (
            <div 
              className={`relative group cursor-pointer transition-all duration-200 ${
                isDragging ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''
              }`}
              onDrop={onFileDrop ? (e) => onFileDrop(e, resourceId) : undefined}
              onDragOver={onDragOver ? (e) => onDragOver(e, resourceId) : undefined}
              onDragLeave={onDragLeave}
            >
              {customCover ? (
                <img 
                  src={customCover} 
                  alt="Custom cover"
                  className="h-20 w-14 object-cover rounded-lg border shadow-sm"
                />
              ) : resource.isbn ? (
                <BookCover 
                  isbn={resource.isbn}
                  title={resource.title}
                  className="h-20 w-14 shadow-sm"
                />
              ) : (
                <div className="h-20 w-14 bg-muted rounded-lg border flex items-center justify-center">
                  {getResourceIcon(resource.type)}
                </div>
              )}
              
              {/* Drag overlay hint */}
              <div className={`absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center transition-opacity ${
                isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <Edit3 className="h-4 w-4 text-primary" />
              </div>
              
              {/* Clear custom cover button */}
              {customCover && onClearCustomCover && (
                <button
                  onClick={() => onClearCustomCover(resourceId)}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
          
          {!customCover && !resource.isbn && resource.type !== 'book' && (
            <div className="flex items-center justify-center w-14 h-20 rounded bg-muted flex-shrink-0">
              {getResourceIcon(resource.type)}
            </div>
          )}
          
          {/* Drag hint text */}
          {(customCover || resource.isbn || resource.type === 'book') && onFileDrop && (
            <p className="text-xs text-muted-foreground text-center mt-1 leading-tight">
              💡 Drop image
            </p>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-medium text-sm leading-tight line-clamp-2">
              {resource.title}
            </h5>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditDialogOpen(true)}
                className="h-6 w-6 p-0"
                title="Edit resource"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-6 w-6 p-0"
                title="Remove resource"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Author and Year */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground line-clamp-1">
              <span className="font-medium">by</span> {resource.author}
              {resource.year && <span className="ml-2">({resource.year})</span>}
            </p>
            
            {/* Publisher/Journal */}
            {(resource.publisher || resource.journal) && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                <span className="font-medium">
                  {resource.type === 'book' ? 'Publisher:' : 'Journal:'}
                </span>{' '}
                {resource.publisher || resource.journal}
              </p>
            )}
            
            {/* DOI */}
            {resource.doi && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">DOI:</span>{' '}
                <span className="font-mono text-blue-600 hover:underline cursor-pointer"
                      onClick={() => window.open(`https://doi.org/${resource.doi}`, '_blank')}>
                  {resource.doi}
                </span>
              </p>
            )}
            
            {/* ISBN */}
            {resource.isbn && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">ISBN:</span> {resource.isbn}
              </p>
            )}
            
            {/* Focus area */}
            {resource.focus && (
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                <span className="font-medium">Focus:</span> {resource.focus}
              </p>
            )}
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {resource.type}
            </Badge>
            {resource.reading_time && (
              <Badge variant="secondary" className="text-xs">
                {resource.reading_time}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <ResourceEditDialog
        resource={resource}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={onEdit}
      />
    </div>
  )
}

export function DailyModuleEditor({ 
  module, 
  onUpdate, 
  onRemove, 
  canRemove,
  customSupplementaryCovers,
  onSupplementaryFileDrop,
  onSupplementaryDragOver,
  onSupplementaryDragLeave,
  onClearSupplementaryCover,
  isDraggingFile
}: DailyModuleEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isVideoCourse = !!module.video_segment

  const handleFieldChange = (field: keyof DailyModule, value: string | string[]) => {
    onUpdate({ ...module, [field]: value })
  }

  const handleTimeAllocationChange = (field: keyof typeof module.time_allocation, value: string) => {
    onUpdate({
      ...module,
      time_allocation: {
        ...module.time_allocation,
        [field]: value
      }
    })
  }

  const handleKnowledgeBenchmarkChange = (field: keyof typeof module.knowledge_benchmark, value: string) => {
    onUpdate({
      ...module,
      knowledge_benchmark: {
        ...module.knowledge_benchmark,
        [field]: value
      }
    })
  }

  const handleVideoSegmentChange = (field: keyof VideoSegment, value: string | string[]) => {
    if (!module.video_segment) return
    
    onUpdate({
      ...module,
      video_segment: {
        ...module.video_segment,
        [field]: value
      }
    })
  }

  const addChapter = (chapter: string) => {
    if (!module.video_segment || !chapter.trim()) return
    
    handleVideoSegmentChange('chapters', [...module.video_segment.chapters, chapter.trim()])
  }

  const removeChapter = (index: number) => {
    if (!module.video_segment) return
    
    handleVideoSegmentChange('chapters', module.video_segment.chapters.filter((_, i) => i !== index))
  }

  const addRewatch = (segment: string) => {
    if (!module.video_segment || !segment.trim()) return
    
    const rewatch = module.video_segment.rewatch_segments || []
    handleVideoSegmentChange('rewatch_segments', [...rewatch, segment.trim()])
  }

  const removeRewatch = (index: number) => {
    if (!module.video_segment) return
    
    const rewatch = module.video_segment.rewatch_segments || []
    handleVideoSegmentChange('rewatch_segments', rewatch.filter((_, i) => i !== index))
  }

  const addToList = (field: 'key_insights' | 'core_concepts', value: string) => {
    if (value.trim()) {
      onUpdate({
        ...module,
        [field]: [...module[field], value.trim()]
      })
    }
  }

  const removeFromList = (field: 'key_insights' | 'core_concepts', index: number) => {
    onUpdate({
      ...module,
      [field]: module[field].filter((_, i) => i !== index)
    })
  }

  const updateListItem = (field: 'key_insights' | 'core_concepts', index: number, value: string) => {
    onUpdate({
      ...module,
      [field]: module[field].map((item, i) => i === index ? value : item)
    })
  }

  const removeResource = (index: number) => {
    onUpdate({
      ...module,
      supplementary_readings: module.supplementary_readings.filter((_, i) => i !== index)
    })
  }

  const editResource = (index: number, updatedResource: Resource) => {
    onUpdate({
      ...module,
      supplementary_readings: module.supplementary_readings.map((resource, i) => 
        i === index ? updatedResource : resource
      )
    })
  }

  const ListEditor = ({ 
    label, 
    items, 
    onAdd, 
    onRemove, 
    onUpdate 
  }: {
    label: string
    items: string[]
    onAdd: (value: string) => void
    onRemove: (index: number) => void
    onUpdate: (index: number, value: string) => void
  }) => {
    const [newItem, setNewItem] = useState("")

    const handleAdd = () => {
      onAdd(newItem)
      setNewItem("")
    }

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => onUpdate(index, e.target.value)}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(index)}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={`Add new ${label.toLowerCase()}...`}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newItem.trim()}
              className="h-8"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-background">
      {/* Module Header */}
      <div className="p-4 bg-gradient-to-r from-background to-muted/20 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                {module.day}
              </div>
              <Badge variant={isExpanded ? "default" : "outline"} className="text-xs">
                {isExpanded ? "Editing" : "Click to edit"}
              </Badge>
            </div>
            {(module.title && module.primary_reading_focus) && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                ✓ Complete
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-muted-foreground">Day {module.day} Title</Label>
            {!module.title && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
          </div>
          <Input
            value={module.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder={`e.g., "Introduction to Key Concepts" or "Deep Dive into ${module.video_segment ? 'Video Segment' : 'Chapter'} 1"`}
            className="text-lg font-medium border-0 bg-background/50 h-12 focus-visible:ring-1"
          />
          <p className="text-xs text-muted-foreground">
            Give this day a clear, descriptive title that tells learners what they&apos;ll focus on
          </p>
        </div>
      </div>

      {/* Module Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Video Segment Editor (for video courses) */}
          {isVideoCourse && module.video_segment && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">Video Segment</h4>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-blue-700">Start Time</Label>
                  <Input
                    value={module.video_segment.start}
                    onChange={(e) => handleVideoSegmentChange('start', e.target.value)}
                    placeholder="00:00"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-blue-700">End Time</Label>
                  <Input
                    value={module.video_segment.end}
                    onChange={(e) => handleVideoSegmentChange('end', e.target.value)}
                    placeholder="10:00"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-blue-700">Duration</Label>
                  <Input
                    value={module.video_segment.duration}
                    onChange={(e) => handleVideoSegmentChange('duration', e.target.value)}
                    placeholder="10:00"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Chapters */}
              <div className="space-y-2">
                <Label className="text-xs text-blue-700">Chapters</Label>
                <div className="space-y-1">
                  {module.video_segment.chapters.map((chapter, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={chapter}
                        onChange={(e) => {
                          const newChapters = [...module.video_segment!.chapters]
                          newChapters[index] = e.target.value
                          handleVideoSegmentChange('chapters', newChapters)
                        }}
                        className="h-7 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeChapter(index)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addChapter(`Chapter ${module.video_segment!.chapters.length + 1}`)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Chapter
                  </Button>
                </div>
              </div>

              {/* Rewatch Segments */}
              <div className="space-y-2">
                <Label className="text-xs text-blue-700">Key Rewatch Segments</Label>
                <div className="space-y-1">
                  {(module.video_segment.rewatch_segments || []).map((segment, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={segment}
                        onChange={(e) => {
                          const newSegments = [...(module.video_segment!.rewatch_segments || [])]
                          newSegments[index] = e.target.value
                          handleVideoSegmentChange('rewatch_segments', newSegments)
                        }}
                        placeholder="e.g., 5:30 - 6:15 (Key concept explanation)"
                        className="h-7 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRewatch(index)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addRewatch('')}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rewatch Segment
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Video Course Specific Fields */}
          {isVideoCourse && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Pre-Viewing Primer</Label>
                <Textarea
                  value={module.pre_viewing_primer || ""}
                  onChange={(e) => handleFieldChange('pre_viewing_primer', e.target.value)}
                  placeholder="Instructions for learners before watching this segment..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Post-Viewing Synthesis</Label>
                <Textarea
                  value={module.post_viewing_synthesis || ""}
                  onChange={(e) => handleFieldChange('post_viewing_synthesis', e.target.value)}
                  placeholder="Questions and reflection prompts after viewing..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Reading Focus */}
          <div className="space-y-2">
            <Label>{isVideoCourse ? 'Primary Viewing Focus' : 'Primary Reading Focus'}</Label>
            <Textarea
              value={module.primary_reading_focus}
              onChange={(e) => handleFieldChange('primary_reading_focus', e.target.value)}
              placeholder={isVideoCourse ? "What should learners focus on while watching this segment..." : "What should learners focus on while reading..."}
              rows={2}
            />
          </div>

          {/* Expandable Sections */}
          <Accordion type="single" collapsible className="w-full">
            {/* Core Concepts */}
            <AccordionItem value="core-concepts">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Core Concepts ({module.core_concepts.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ListEditor
                  label="Core Concepts"
                  items={module.core_concepts}
                  onAdd={(value) => addToList('core_concepts', value)}
                  onRemove={(index) => removeFromList('core_concepts', index)}
                  onUpdate={(index, value) => updateListItem('core_concepts', index, value)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Key Insights */}
            <AccordionItem value="key-insights">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Insights ({module.key_insights.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ListEditor
                  label="Key Insights"
                  items={module.key_insights}
                  onAdd={(value) => addToList('key_insights', value)}
                  onRemove={(index) => removeFromList('key_insights', index)}
                  onUpdate={(index, value) => updateListItem('key_insights', index, value)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Time Allocation */}
            <AccordionItem value="time-allocation">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Allocation
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Total Time</Label>
                    <Input
                      value={module.time_allocation.total}
                      onChange={(e) => handleTimeAllocationChange('total', e.target.value)}
                      placeholder="3 hours"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{isVideoCourse ? 'Video Viewing' : 'Primary Text'}</Label>
                    <Input
                      value={module.time_allocation.primary_text}
                      onChange={(e) => handleTimeAllocationChange('primary_text', e.target.value)}
                      placeholder={isVideoCourse ? "30 minutes" : "120 minutes"}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Supplementary Materials</Label>
                    <Input
                      value={module.time_allocation.supplementary_materials}
                      onChange={(e) => handleTimeAllocationChange('supplementary_materials', e.target.value)}
                      placeholder="60 minutes"
                      className="h-8"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Knowledge Benchmark */}
            <AccordionItem value="knowledge-benchmark">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Knowledge Benchmark
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {Object.entries(module.knowledge_benchmark).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm capitalize">{key.replace('_', ' ')}</Label>
                      <Textarea
                        value={value}
                        onChange={(e) => handleKnowledgeBenchmarkChange(key as keyof typeof module.knowledge_benchmark, e.target.value)}
                                                  placeholder={`Learners should ${key}...`}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Supplementary Resources */}
            <AccordionItem value="resources">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Supplementary Resources ({module.supplementary_readings.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <DroppableArea
                  id={`daily-module-${module.day}-resources`}
                  type="daily_module"
                  moduleDay={module.day}
                >
                  {module.supplementary_readings.length > 0 ? (
                    <div className="space-y-3">
                      {module.supplementary_readings.map((resource, index) => {
                        const resourceId = resource.id || `${resource.title}-${resource.author}`
                        return (
                          <ResourceCard
                            key={index}
                            resource={resource}
                            onRemove={() => removeResource(index)}
                            onEdit={(updatedResource) => editResource(index, updatedResource)}
                            customCover={customSupplementaryCovers?.get(resourceId)}
                            onFileDrop={onSupplementaryFileDrop}
                            onDragOver={onSupplementaryDragOver}
                            onDragLeave={onSupplementaryDragLeave}
                            onClearCustomCover={onClearSupplementaryCover}
                            isDraggingFile={isDraggingFile}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                      <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No resources added</p>
                      <p className="text-xs text-muted-foreground">Drag resources from the library</p>
                    </div>
                  )}
                </DroppableArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  )
} 