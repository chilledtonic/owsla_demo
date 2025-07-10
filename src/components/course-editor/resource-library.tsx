"use client"

import { useState, useMemo } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookCover } from "@/components/ui/book-cover"
import { 
  Search, 
  BookOpen, 
  FileText, 
  Youtube, 
  Globe,
  Filter,
  Plus,
  GripVertical
} from "lucide-react"
import { Resource } from "@/types/course-editor"

// Sample resources for demonstration
const sampleResources: Resource[] = [
  {
    id: "1",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "9780262033848",
    year: "2009",
    publisher: "MIT Press",
    type: "book",
    reading_time: "120 minutes",
    focus: "Fundamental algorithms and data structures"
  },
  {
    id: "2",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    year: "2008",
    publisher: "Prentice Hall",
    type: "book",
    reading_time: "90 minutes",
    focus: "Writing maintainable and readable code"
  },
  {
    id: "3",
    title: "The Art of Computer Programming",
    author: "Donald E. Knuth",
    isbn: "9780201038041",
    year: "1997",
    publisher: "Addison-Wesley",
    type: "book",
    reading_time: "180 minutes",
    focus: "Mathematical analysis of algorithms"
  },
  {
    id: "4",
    title: "Attention Is All You Need",
    author: "Vaswani et al.",
    doi: "10.48550/arXiv.1706.03762",
    year: "2017",
    journal: "arXiv",
    type: "paper",
    reading_time: "45 minutes",
    focus: "Transformer architecture for neural networks"
  },
  {
    id: "5",
    title: "Deep Learning",
    author: "Ian Goodfellow",
    doi: "10.1038/nature14539",
    year: "2016",
    journal: "Nature",
    type: "paper",
    reading_time: "60 minutes",
    focus: "Foundations of deep learning"
  },
  {
    id: "6",
    title: "Introduction to Machine Learning",
    author: "MIT OpenCourseWare",
    type: "video",
    reading_time: "240 minutes",
    focus: "Comprehensive ML fundamentals"
  },
  {
    id: "7",
    title: "Functional Programming Principles",
    author: "Martin Odersky",
    type: "video",
    reading_time: "180 minutes",
    focus: "Scala and functional programming concepts"
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
        <div className="flex items-center justify-center w-8 h-8 rounded bg-muted flex-shrink-0">
          {getResourceIcon(resource.type)}
        </div>
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

export function ResourceLibrary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  
  const filteredResources = useMemo(() => {
    return sampleResources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.focus?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = selectedType === "all" || resource.type === selectedType
      
      return matchesSearch && matchesType
    })
  }, [searchQuery, selectedType])

  const resourcesByType = useMemo(() => {
    return {
      books: filteredResources.filter(r => r.type === 'book'),
      papers: filteredResources.filter(r => r.type === 'paper' || r.type === 'article'),
      videos: filteredResources.filter(r => r.type === 'video'),
      other: filteredResources.filter(r => !['book', 'paper', 'article', 'video'].includes(r.type))
    }
  }, [filteredResources])

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resource Library</h2>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedType} onValueChange={setSelectedType} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="book" className="text-xs">Books</TabsTrigger>
          <TabsTrigger value="paper" className="text-xs">Papers</TabsTrigger>
          <TabsTrigger value="video" className="text-xs">Videos</TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4">
          <TabsContent value="all" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {filteredResources.length > 0 ? (
                  filteredResources.map((resource) => (
                    <DraggableResource key={resource.id} resource={resource} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No resources found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="book" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {resourcesByType.books.length > 0 ? (
                  resourcesByType.books.map((resource) => (
                    <DraggableResource key={resource.id} resource={resource} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No books found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="paper" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {resourcesByType.papers.length > 0 ? (
                  resourcesByType.papers.map((resource) => (
                    <DraggableResource key={resource.id} resource={resource} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No papers found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="video" className="mt-0 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {resourcesByType.videos.length > 0 ? (
                  resourcesByType.videos.map((resource) => (
                    <DraggableResource key={resource.id} resource={resource} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No videos found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 