"use client"

import { useState, useEffect, useCallback } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookCover } from "@/components/ui/book-cover"
import { 
  Search, 
  BookOpen, 
  FileText, 
  Youtube, 
  Globe,
  Loader2,
  AlertCircle,
  GripVertical,
  Library,
  GraduationCap,
  ExternalLink,
  Plus,
  X
} from "lucide-react"
import { Resource } from "@/types/course-editor"
import { searchBooks, searchPapers } from "@/lib/search-apis"

// Source configuration
type SearchSource = 'openlibrary' | 'crossref' | 'zotero'

interface SearchSourceConfig {
  id: SearchSource
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  searchTypes: ('books' | 'papers')[]
}

const SEARCH_SOURCES: SearchSourceConfig[] = [
  {
    id: 'openlibrary',
    name: 'OpenLibrary',
    icon: Library,
    description: 'Search millions of books',
    searchTypes: ['books']
  },
  {
    id: 'crossref',
    name: 'Crossref',
    icon: GraduationCap,
    description: 'Search academic papers',
    searchTypes: ['papers']
  },
  {
    id: 'zotero',
    name: 'Zotero',
    icon: BookOpen,
    description: 'Search your personal library',
    searchTypes: ['books', 'papers']
  }
]

interface SourceTabProps {
  primaryResource: Resource | null
  setPrimaryResource: (resource: Resource | null) => void
  secondaryResources: Resource[]
  setSecondaryResources: (resources: Resource[]) => void
  academicPapers: Resource[]
  setAcademicPapers: (papers: Resource[]) => void
  courseOutline: string
  setCourseOutline: (outline: string) => void
}

interface DraggableResourceProps {
  resource: Resource
}

function DraggableResource({ resource }: DraggableResourceProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: resource.id!,
    data: {
      type: 'resource',
      resource: resource,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

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

  const getSourceBadge = (source?: string) => {
    const sourceConfig = SEARCH_SOURCES.find(s => s.id === source)
    if (!sourceConfig) return null
    
    return (
      <Badge variant="outline" className="text-xs bg-muted/50">
        <sourceConfig.icon className="h-3 w-3 mr-1" />
        {sourceConfig.name}
      </Badge>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {resource.isbn ? (
          <BookCover 
            isbn={resource.isbn}
            title={resource.title}
            className="h-12 w-8 flex-shrink-0"
          />
        ) : (
          <div className="flex items-center justify-center w-8 h-12 rounded bg-muted flex-shrink-0">
            {getResourceIcon(resource.type)}
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">
              {resource.title}
            </h4>
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {resource.author}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {resource.type}
            </Badge>
            {resource.reading_time && (
              <Badge variant="secondary" className="text-xs">
                {resource.reading_time}
              </Badge>
            )}
            {resource.year && (
              <Badge variant="secondary" className="text-xs">
                {resource.year}
              </Badge>
            )}
            {getSourceBadge(resource.source)}
          </div>
          {resource.focus && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {resource.focus}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface DroppableZoneProps {
  id: string
  title: string
  description: string
  resources: Resource[]
  onRemove: (resourceId: string) => void
  maxItems?: number
  emptyMessage: string
}

function DroppableZone({ id, title, description, resources, onRemove, maxItems, emptyMessage }: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 min-h-[200px] transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
    >
      <div className="mb-4">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
        {maxItems && (
          <p className="text-xs text-muted-foreground mt-1">
            {resources.length}/{maxItems} selected
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <div key={resource.id} className="flex items-center gap-2 p-2 bg-muted/20 rounded border">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">{resource.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{resource.author}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(resource.id!)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function SourceTab({
  primaryResource,
  setPrimaryResource,
  secondaryResources,
  setSecondaryResources,
  academicPapers,
  setAcademicPapers,
  courseOutline,
  setCourseOutline
}: SourceTabProps) {
  const [selectedSources, setSelectedSources] = useState<SearchSource[]>(['openlibrary', 'crossref'])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Resource[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [zoteroEnabled, setZoteroEnabled] = useState(false)
  const [checkingZotero, setCheckingZotero] = useState(true)
  const [, setActiveDragId] = useState<string | null>(null)
  const [draggedResource, setDraggedResource] = useState<Resource | null>(null)

  // Check if Zotero integration is available
  useEffect(() => {
    const checkZoteroIntegration = async () => {
      try {
        const response = await fetch('/api/integrations/zotero')
        if (response.ok) {
          const data = await response.json()
          setZoteroEnabled(data.is_enabled)
        }
      } catch (error) {
        console.error('Error checking Zotero integration:', error)
      } finally {
        setCheckingZotero(false)
      }
    }

    checkZoteroIntegration()
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search functions
  const searchZoteroResources = async (query: string): Promise<Resource[]> => {
    const params = new URLSearchParams({ q: query, limit: '15' })
    const response = await fetch(`/api/integrations/zotero/search?${params}`)
    if (!response.ok) {
      throw new Error('Failed to search Zotero library')
    }
    const data = await response.json()
    return data.resources as Resource[]
  }

  const searchExternalResources = async (query: string, sources: SearchSource[]): Promise<Resource[]> => {
    const results: Resource[] = []
    const errors: string[] = []

    if (sources.includes('openlibrary')) {
      try {
        const books = await searchBooks(query, 10)
        const booksWithSource = books.map(book => ({ ...book, source: 'openlibrary' as const }))
        results.push(...booksWithSource)
      } catch (error) {
        console.error('OpenLibrary search failed:', error)
        errors.push(`OpenLibrary: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (sources.includes('crossref')) {
      try {
        const papers = await searchPapers(query, 10)
        const papersWithSource = papers.map(paper => ({ ...paper, source: 'crossref' as const }))
        results.push(...papersWithSource)
      } catch (error) {
        console.error('Crossref search failed:', error)
        errors.push(`Crossref: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(' • '))
    }

    return results
  }

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([])
        setHasSearched(false)
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)
      setHasSearched(true)

      try {
        const allResults: Resource[] = []

        if (selectedSources.includes('zotero') && zoteroEnabled) {
          try {
            const zoteroResults = await searchZoteroResources(debouncedQuery)
            allResults.push(...zoteroResults)
          } catch (err) {
            console.error('Zotero search error:', err)
            setError(err instanceof Error ? err.message : 'Zotero search failed')
          }
        }

        const externalSources = selectedSources.filter(s => s !== 'zotero')
        if (externalSources.length > 0) {
          try {
            const externalResults = await searchExternalResources(debouncedQuery, externalSources)
            allResults.push(...externalResults)
          } catch (err) {
            console.error('External search error:', err)
            setError(err instanceof Error ? err.message : 'External search failed')
          }
        }

        setSearchResults(allResults)
      } catch (err) {
        console.error('Search error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while searching')
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery, selectedSources, zoteroEnabled])

  const handleSourceToggle = useCallback((sourceId: SearchSource) => {
    if (sourceId === 'zotero' && !zoteroEnabled) {
      window.open('/settings/integrations', '_blank', 'noopener,noreferrer')
      return
    }

    setSelectedSources(prev => {
      if (prev.includes(sourceId)) {
        if (prev.length === 1) return prev
        return prev.filter(s => s !== sourceId)
      } else {
        return [...prev, sourceId]
      }
    })
  }, [zoteroEnabled])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
    const resource = searchResults.find(r => r.id === event.active.id)
    setDraggedResource(resource || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event
    
    if (!over || !draggedResource) {
      setActiveDragId(null)
      setDraggedResource(null)
      return
    }

    const resource = { ...draggedResource, id: draggedResource.id || `${Date.now()}-${Math.random()}` }

    switch (over.id) {
      case 'primary':
        if (!primaryResource) {
          setPrimaryResource(resource)
        }
        break
      case 'secondary':
        if (secondaryResources.length < 5 && !secondaryResources.find(r => r.id === resource.id)) {
          setSecondaryResources([...secondaryResources, resource])
        }
        break
      case 'papers':
        if (academicPapers.length < 10 && !academicPapers.find(r => r.id === resource.id)) {
          setAcademicPapers([...academicPapers, resource])
        }
        break
    }

    setActiveDragId(null)
    setDraggedResource(null)
  }

  const removePrimaryResource = () => setPrimaryResource(null)
  const removeSecondaryResource = (id: string) => setSecondaryResources(secondaryResources.filter(r => r.id !== id))
  const removeAcademicPaper = (id: string) => setAcademicPapers(academicPapers.filter(r => r.id !== id))

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Curated Sources</h4>
          <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
            Build your curriculum from carefully selected sources. Choose a primary resource as your main text, 
            add secondary sources for depth, and include academic papers for rigorous backing. 
            Perfect for when you want full control over your learning materials.
          </p>
        </div>

        {/* Course Outline Section */}
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="font-medium mb-2">Course Outline</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Describe the general flow and structure you want for your course. This helps guide how your selected sources will be organized into a cohesive learning experience.
            </p>
          </div>
          <div className="relative">
            <textarea
              placeholder="Describe how you want your course structured... For example: 'Start with foundational concepts, then move to practical applications, followed by advanced theory and case studies.'"
              value={courseOutline}
              onChange={(e) => setCourseOutline(e.target.value.slice(0, 500))}
              className="w-full min-h-[100px] p-3 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
              rows={4}
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {courseOutline.length}/500
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Panel */}
          <div className="space-y-4">
            <h3 className="font-medium">Search Resources</h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
                disabled={isLoading}
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Source Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Search Sources:</span>
                {(hasSearched || searchResults.length > 0) && (
                  <span className="text-xs text-muted-foreground">
                    {isLoading ? 'Searching...' : `${searchResults.length} found`}
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {SEARCH_SOURCES.map((source) => {
                  const isSelected = selectedSources.includes(source.id)
                  const isZoteroUnavailable = source.id === 'zotero' && !zoteroEnabled
                  
                  return (
                    <Button
                      key={source.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs px-2 gap-1 ${
                        isZoteroUnavailable ? 'opacity-60' : ''
                      }`}
                      onClick={() => handleSourceToggle(source.id)}
                      disabled={checkingZotero && source.id === 'zotero'}
                    >
                      <source.icon className="h-3 w-3" />
                      {source.name}
                      {isZoteroUnavailable && <ExternalLink className="h-3 w-3 ml-1" />}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {/* Search Results */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-12 w-8 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-12" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : searchResults.length > 0 ? (
                  searchResults.map((resource) => (
                    <DraggableResource key={resource.id} resource={resource} />
                  ))
                ) : hasSearched ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No resources found</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Search for resources to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Drop Zones */}
          <div className="space-y-4">
            <h3 className="font-medium">Selected Sources</h3>
            
            <div className="space-y-4">
              <DroppableZone
                id="primary"
                title="Primary Resource"
                description="Your main textbook or foundational source"
                resources={primaryResource ? [primaryResource] : []}
                onRemove={removePrimaryResource}
                maxItems={1}
                emptyMessage="Drag a book or main resource here"
              />
              
              <DroppableZone
                id="secondary"
                title="Secondary Resources"
                description="Supporting books and supplementary materials"
                resources={secondaryResources}
                onRemove={removeSecondaryResource}
                maxItems={5}
                emptyMessage="Drag additional books and resources here"
              />
              
              <DroppableZone
                id="papers"
                title="Academic Papers"
                description="Research papers and academic articles"
                resources={academicPapers}
                onRemove={removeAcademicPaper}
                maxItems={10}
                emptyMessage="Drag academic papers and articles here"
              />
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {draggedResource ? <DraggableResource resource={draggedResource} /> : null}
      </DragOverlay>
    </DndContext>
  )
} 