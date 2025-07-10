"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookCover } from "@/components/ui/book-cover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Calendar,
  Clock,
  Target,
  Lightbulb,
  BookOpen,
  FileText,
  Youtube,
  Globe,
  Plus,
  X,
  GripVertical,
  Trash2
} from "lucide-react"
import { DailyModule, Resource } from "@/types/course-editor"

interface DailyModuleEditorProps {
  module: DailyModule
  onUpdate: (module: DailyModule) => void
  onRemove: () => void
  canRemove: boolean
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

function ResourceCard({ resource, onRemove }: { resource: Resource; onRemove: () => void }) {
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

  return (
    <div className="p-3 border rounded-lg bg-background">
      <div className="flex items-start gap-3">
        {resource.isbn && (
          <BookCover 
            isbn={resource.isbn}
            title={resource.title}
            className="h-12 w-8 flex-shrink-0"
          />
        )}
        {!resource.isbn && (
          <div className="flex items-center justify-center w-8 h-8 rounded bg-muted flex-shrink-0">
            {getResourceIcon(resource.type)}
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-medium text-sm leading-tight line-clamp-2">
              {resource.title}
            </h5>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {resource.author}
          </p>
          <div className="flex items-center gap-2">
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
    </div>
  )
}

export function DailyModuleEditor({ module, onUpdate, onRemove, canRemove }: DailyModuleEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFieldChange = (field: keyof DailyModule, value: any) => {
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
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => onUpdate(index, e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(index)}
                className="px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={`Add ${label.toLowerCase()}...`}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAdd()
                }
              }}
            />
            <Button onClick={handleAdd} size="sm" disabled={!newItem.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Day {module.day}: {module.title}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {canRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Basic Info - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor={`title-${module.day}`}>Day Title</Label>
            <Input
              id={`title-${module.day}`}
              value={module.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter day title..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`date-${module.day}`}>Date</Label>
            <Input
              id={`date-${module.day}`}
              type="date"
              value={module.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Key Insights */}
          <ListEditor
            label="Key Insights"
            items={module.key_insights}
            onAdd={(value) => addToList('key_insights', value)}
            onRemove={(index) => removeFromList('key_insights', index)}
            onUpdate={(index, value) => updateListItem('key_insights', index, value)}
          />

          {/* Core Concepts */}
          <ListEditor
            label="Core Concepts"
            items={module.core_concepts}
            onAdd={(value) => addToList('core_concepts', value)}
            onRemove={(index) => removeFromList('core_concepts', index)}
            onUpdate={(index, value) => updateListItem('core_concepts', index, value)}
          />

          {/* Time Allocation */}
          <div className="space-y-4">
            <Label>Time Allocation</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Total Time</Label>
                <Input
                  value={module.time_allocation.total}
                  onChange={(e) => handleTimeAllocationChange('total', e.target.value)}
                  placeholder="e.g., 3 hours"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Primary Reading</Label>
                <Input
                  value={module.time_allocation.primary_text}
                  onChange={(e) => handleTimeAllocationChange('primary_text', e.target.value)}
                  placeholder="e.g., 120 minutes"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Supplementary</Label>
                <Input
                  value={module.time_allocation.supplementary_materials}
                  onChange={(e) => handleTimeAllocationChange('supplementary_materials', e.target.value)}
                  placeholder="e.g., 60 minutes"
                />
              </div>
            </div>
          </div>

          {/* Practical Connections */}
          <div className="space-y-2">
            <Label htmlFor={`practical-${module.day}`}>Practical Connections</Label>
            <Textarea
              id={`practical-${module.day}`}
              value={module.practical_connections}
              onChange={(e) => handleFieldChange('practical_connections', e.target.value)}
              placeholder="Describe how this day's content connects to practical applications..."
              rows={3}
            />
          </div>

          {/* Primary Reading Focus */}
          <div className="space-y-2">
            <Label htmlFor={`reading-focus-${module.day}`}>Primary Reading Focus</Label>
            <Textarea
              id={`reading-focus-${module.day}`}
              value={module.primary_reading_focus}
              onChange={(e) => handleFieldChange('primary_reading_focus', e.target.value)}
              placeholder="Describe the main reading focus for this day..."
              rows={2}
            />
          </div>

          {/* Knowledge Benchmark */}
          <Accordion type="single" collapsible>
            <AccordionItem value="knowledge-benchmark">
              <AccordionTrigger>Knowledge Benchmark</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {Object.entries(module.knowledge_benchmark).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key}</Label>
                    <Textarea
                      value={value}
                      onChange={(e) => handleKnowledgeBenchmarkChange(key as keyof typeof module.knowledge_benchmark, e.target.value)}
                      placeholder={`Define what students should ${key}...`}
                      rows={2}
                    />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Supplementary Resources */}
          <div className="space-y-4">
            <Label>Supplementary Resources</Label>
            <DroppableArea
              id={`daily-module-${module.day}-resources`}
              type="daily_module"
              moduleDay={module.day}
            >
              <div className="min-h-[100px] border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {module.supplementary_readings.length > 0 ? (
                  <div className="space-y-3">
                    {module.supplementary_readings.map((resource, index) => (
                      <ResourceCard 
                        key={index} 
                        resource={resource} 
                        onRemove={() => removeResource(index)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">
                      No resources added yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Drag resources from the library to add them here
                    </p>
                  </div>
                )}
              </div>
            </DroppableArea>
          </div>
        </CardContent>
      )}
    </Card>
  )
} 