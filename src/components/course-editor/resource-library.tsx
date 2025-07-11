"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  RefreshCw
} from "lucide-react"
import { Resource } from "@/types/course-editor"
import { searchResources, searchBooks, searchPapers } from "@/lib/search-apis"

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
  type, 
  hasSearched, 
  onExampleSearch 
}: { 
  type: string
  hasSearched: boolean
  onExampleSearch: (query: string) => void 
}) {
  const examples = {
    books: ['algorithms', 'psychology', 'economics'],
    papers: ['AI', 'climate', 'quantum'],
    all: ['data science', 'philosophy', 'biology']
  }

  const typeExamples = examples[type as keyof typeof examples] || examples.all

  if (!hasSearched) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium mb-2">Search for {type === 'all' ? 'resources' : type}</p>
          <p className="text-xs opacity-75">Try searching for:</p>
        </div>
        <div className="flex flex-col gap-1">
          {typeExamples.map((example) => (
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
      <p className="text-xs">No {type === 'all' ? 'resources' : type} found</p>
      <p className="text-xs opacity-75">Try different keywords</p>
    </div>
  )
}

export function ResourceLibrary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<{
    books: Resource[]
    papers: Resource[]
  }>({ books: [], papers: [] })
  const [hasSearched, setHasSearched] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults({ books: [], papers: [] })
        setHasSearched(false)
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)
      setHasSearched(true)

      try {
        let results: { books: Resource[]; papers: Resource[] }

        if (selectedType === 'book') {
          const books = await searchBooks(debouncedQuery, 15)
          results = { books, papers: [] }
        } else if (selectedType === 'paper') {
          const papers = await searchPapers(debouncedQuery, 15)
          results = { books: [], papers }
        } else {
          const searchResult = await searchResources(debouncedQuery, 'all')
          results = { books: searchResult.books, papers: searchResult.papers }
          
          // Handle partial errors
          if (searchResult.errors.length > 0) {
            setError(searchResult.errors.join(' • '))
          }
        }

        setSearchResults(results)
      } catch (err) {
        console.error('Search error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while searching')
        setSearchResults({ books: [], papers: [] })
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery, selectedType])

  const allResources = useMemo(() => [
    ...searchResults.books,
    ...searchResults.papers
  ], [searchResults])

  const resourcesByType = useMemo(() => ({
    books: searchResults.books,
    papers: searchResults.papers,
    videos: [] as Resource[], // Videos not implemented yet
    other: [] as Resource[]
  }), [searchResults])

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

  const getResourceCount = (type: string) => {
    switch (type) {
      case 'book':
        return searchResults.books.length
      case 'paper':
        return searchResults.papers.length
      case 'all':
        return allResources.length
      default:
        return 0
    }
  }

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

        {/* Results Count */}
        {(hasSearched || getResourceCount(selectedType) > 0) && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {isLoading ? 'Searching...' : `${getResourceCount(selectedType)} found`}
            </span>
          </div>
        )}

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

      {/* Resource Tabs */}
      <Tabs value={selectedType} onValueChange={setSelectedType} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="all" className="text-xs">
            All
            {getResourceCount('all') > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                {getResourceCount('all')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="book" className="text-xs">
            Books
            {getResourceCount('book') > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                {getResourceCount('book')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paper" className="text-xs">
            Papers
            {getResourceCount('paper') > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                {getResourceCount('paper')}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-3 overflow-hidden">
          <TabsContent value="all" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <ResourceSkeleton key={i} />
                  ))
                ) : allResources.length > 0 ? (
                  allResources.map((resource) => (
                    <DraggableResource key={resource.id} resource={resource} />
                  ))
                ) : (
                  <EmptyState 
                    type="all" 
                    hasSearched={hasSearched}
                    onExampleSearch={handleExampleSearch}
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="book" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <ResourceSkeleton key={i} />
                  ))
                ) : resourcesByType.books.length > 0 ? (
                  resourcesByType.books.map((resource) => (
                    <DraggableResource key={resource.id} resource={resource} />
                  ))
                ) : (
                  <EmptyState 
                    type="books" 
                    hasSearched={hasSearched}
                    onExampleSearch={handleExampleSearch}
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="paper" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <ResourceSkeleton key={i} />
                  ))
                ) : resourcesByType.papers.length > 0 ? (
                  resourcesByType.papers.map((resource) => (
                    <DraggableResource key={resource.id} resource={resource} />
                  ))
                ) : (
                  <EmptyState 
                    type="papers" 
                    hasSearched={hasSearched}
                    onExampleSearch={handleExampleSearch}
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 