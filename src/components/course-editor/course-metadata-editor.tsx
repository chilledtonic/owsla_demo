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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BookOpen, 
  Target, 
  Brain, 
  Lightbulb,
  Plus,
  X
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
        ...course.primary_resource,
        [key]: value
      }
    })
  }

  const clearPrimaryResource = () => {
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

  const hasPrimaryResource = course.primary_resource.title && course.primary_resource.author

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Course Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Course Title */}
          <div className="space-y-2">
            <Label htmlFor="course-title">Course Title</Label>
            <Input
              id="course-title"
              value={course.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter course title..."
              className="text-lg font-medium"
            />
          </div>

          {/* Executive Overview */}
          <div className="space-y-2">
            <Label htmlFor="executive-overview">Executive Overview</Label>
            <Textarea
              id="executive-overview"
              value={course.executive_overview}
              onChange={(e) => handleOverviewChange(e.target.value)}
              placeholder="Provide a comprehensive overview of the course objectives, target audience, and learning outcomes..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Primary Resource */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Primary Resource
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DroppableArea
            id="primary-resource-drop"
            type="primary_resource"
            className="space-y-4"
          >
            {hasPrimaryResource ? (
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="flex items-start gap-4">
                  {course.primary_resource.isbn && (
                    <BookCover 
                      isbn={course.primary_resource.isbn}
                      title={course.primary_resource.title}
                      className="h-20 w-14 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{course.primary_resource.title}</h4>
                        <p className="text-sm text-muted-foreground">{course.primary_resource.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.primary_resource.publisher} • {course.primary_resource.year}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearPrimaryResource}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Editable fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">ISBN</Label>
                        <Input
                          value={course.primary_resource.isbn}
                          onChange={(e) => handlePrimaryResourceChange('isbn', e.target.value)}
                          placeholder="ISBN"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Year</Label>
                        <Input
                          value={course.primary_resource.year}
                          onChange={(e) => handlePrimaryResourceChange('year', e.target.value)}
                          placeholder="Year"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No primary resource set</p>
                <p className="text-xs text-muted-foreground">Drag a book from the resource library here</p>
                
                {/* Manual entry option */}
                <div className="mt-4 space-y-3">
                  <div className="text-xs text-muted-foreground">Or enter manually:</div>
                  <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                    <Input
                      value={course.primary_resource.title}
                      onChange={(e) => handlePrimaryResourceChange('title', e.target.value)}
                      placeholder="Book title"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={course.primary_resource.author}
                      onChange={(e) => handlePrimaryResourceChange('author', e.target.value)}
                      placeholder="Author"
                      className="h-8 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={course.primary_resource.publisher}
                        onChange={(e) => handlePrimaryResourceChange('publisher', e.target.value)}
                        placeholder="Publisher"
                        className="h-8 text-xs"
                      />
                      <Input
                        value={course.primary_resource.year}
                        onChange={(e) => handlePrimaryResourceChange('year', e.target.value)}
                        placeholder="Year"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DroppableArea>
        </CardContent>
      </Card>

      {/* Knowledge Framework - Collapsible */}
      <Accordion type="single" collapsible>
        <AccordionItem value="knowledge-framework">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <span>Knowledge Framework</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="foundational-concepts">Foundational Concepts</Label>
                  <Textarea
                    id="foundational-concepts"
                    value={course.knowledge_framework.foundational_concepts}
                    onChange={(e) => handleKnowledgeFrameworkChange('foundational_concepts', e.target.value)}
                    placeholder="Describe the foundational concepts that students will learn..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advanced-applications">Advanced Applications</Label>
                  <Textarea
                    id="advanced-applications"
                    value={course.knowledge_framework.advanced_applications}
                    onChange={(e) => handleKnowledgeFrameworkChange('advanced_applications', e.target.value)}
                    placeholder="Explain how students will apply advanced concepts..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="synthesis-goals">Synthesis Goals</Label>
                  <Textarea
                    id="synthesis-goals"
                    value={course.knowledge_framework.synthesis_goals}
                    onChange={(e) => handleKnowledgeFrameworkChange('synthesis_goals', e.target.value)}
                    placeholder="Define the learning synthesis goals and outcomes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
} 