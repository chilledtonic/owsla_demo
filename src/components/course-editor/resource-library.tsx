"use client"

import { useState, useEffect, useCallback } from "react"
import { useDraggable } from "@dnd-kit/core"
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
  RefreshCw,
  Library,
  GraduationCap,
  ExternalLink
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

  // Get source badge
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
          {resource.doi && (
            <p className="text-xs text-muted-foreground truncate">
              DOI: {resource.doi}
            </p>
          )}
          {resource.journal && (
            <p className="text-xs text-muted-foreground truncate">
              Journal: {resource.journal}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ResourceSkeleton() {
  return (
    <div className="p-3 border rounded-lg">
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
  )
}

function EmptyState({ 
  hasSearched, 
  onExampleSearch 
}: { 
  hasSearched: boolean
  onExampleSearch: (query: string) => void 
}) {
  const examples = ['algorithms', 'psychology', 'economics', 'AI', 'climate', 'quantum']

  if (!hasSearched) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium mb-2">Search for resources</p>
          <p className="text-xs opacity-75">Try searching for:</p>
        </div>
        <div className="flex flex-col gap-1">
          {examples.slice(0, 4).map((example) => (
            <Button
              key={example}
              variant="outline"
              size="sm"
              className="text-xs h-7 justify-start"
              onClick={() => onExampleSearch(example)}
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-6 text-muted-foreground">
      <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
      <p className="text-xs">No resources found</p>
      <p className="text-xs opacity-75">Try different keywords or sources</p>
    </div>
  )
}

export function ResourceLibrary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedSource, setSelectedSource] = useState<SearchSource>('openlibrary')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Resource[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  
  // Zotero integration state
  const [zoteroEnabled, setZoteroEnabled] = useState(false)
  const [checkingZotero, setCheckingZotero] = useState(true)

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

    // Search OpenLibrary for books (sequential)
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

    // Search Crossref for papers (sequential)
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

        // Search the selected source
        if (selectedSource === 'zotero' && zoteroEnabled) {
          try {
            const zoteroResults = await searchZoteroResources(debouncedQuery)
            allResults.push(...zoteroResults)
          } catch (err) {
            console.error('Zotero search error:', err)
            setError(err instanceof Error ? err.message : 'Zotero search failed')
          }
        } else if (selectedSource !== 'zotero') {
          try {
            const externalResults = await searchExternalResources(debouncedQuery, [selectedSource])
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
  }, [debouncedQuery, selectedSource, zoteroEnabled])

  const handleExampleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleRetry = useCallback(() => {
    if (debouncedQuery) {
      // Force a re-search by clearing and setting the query again
      const query = debouncedQuery
      setDebouncedQuery('')
      setTimeout(() => setDebouncedQuery(query), 100)
    }
  }, [debouncedQuery])

  const handleSourceToggle = useCallback((sourceId: SearchSource) => {
    if (sourceId === 'zotero' && !zoteroEnabled) {
      // Navigate to integrations page
      window.open('/settings/integrations', '_blank', 'noopener,noreferrer')
      return
    }

    // Simply set the new source - this creates toggle behavior
    setSelectedSource(sourceId)
  }, [zoteroEnabled])

  return (
    <div className="h-full flex flex-col p-4">
      {/* Search Section */}
      <div className="space-y-3 pb-4">
        {/* Search */}
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
              const isSelected = selectedSource === source.id
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
          <p className="text-xs text-muted-foreground">
            {`Searching ${SEARCH_SOURCES.find(src => src.id === selectedSource)?.name || 'Unknown'}`}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-xs">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-6 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-2">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <ResourceSkeleton key={i} />
              ))
            ) : searchResults.length > 0 ? (
              searchResults.map((resource) => (
                <DraggableResource key={resource.id} resource={resource} />
              ))
            ) : (
                          <EmptyState
              hasSearched={hasSearched}
              onExampleSearch={handleExampleSearch}
            />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 