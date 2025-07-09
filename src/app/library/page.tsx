"use client"

import { useUser } from "@stackframe/stack"
import { useState } from "react"
import { useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { AppLayout } from "@/components/app-layout"
import { BookCarousel } from "@/components/ui/book-carousel"
import { ResourcesTable } from "@/components/ui/resources-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { BookOpen, FileText, ExternalLink, RefreshCw, Search, Download, FileDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookResource } from "@/lib/actions"
import { deduplicateBooks } from "@/lib/utils"
import { BookCover } from "@/components/ui/book-cover"

type ViewMode = 'all' | 'by-course'
type ExportFormat = 'txt' | 'csv' | 'json' | 'markdown'

export default function LibraryPage() {
  useUser({ or: "redirect" })
  const { dashboardData, loading, error, refresh } = useCachedDashboardData()
  const [deduplicatedBookCount, setDeduplicatedBookCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>('all') // Changed default to 'all'
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading library...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4">
          <Alert>
            <AlertDescription>
              Error loading library: {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  if (!dashboardData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Learning Library</h1>
            <p className="text-muted-foreground">No resources available</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const totalResources = deduplicatedBookCount + dashboardData.otherResources.length

  // Filter resources based on search query
  const filteredOtherResources = dashboardData.otherResources.filter(resource =>
    searchQuery === "" || 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Organize books by curriculum
  const booksByCourse = dashboardData.bookResources.reduce((acc, book) => {
    if (!acc[book.curriculumId]) {
      acc[book.curriculumId] = {
        curriculumTitle: book.curriculumTitle,
        books: []
      }
    }
    acc[book.curriculumId].books.push(book)
    return acc
  }, {} as Record<number, { curriculumTitle: string; books: BookResource[] }>)

  // Deduplicate books within each course
  Object.keys(booksByCourse).forEach(courseId => {
    booksByCourse[parseInt(courseId)].books = deduplicateBooks(booksByCourse[parseInt(courseId)].books)
  })

  // Export functions
  const generateReadingList = (format: ExportFormat, courseId?: number) => {
    const books = courseId 
      ? booksByCourse[courseId]?.books || []
      : deduplicateBooks(dashboardData.bookResources)
    
    const courseName = courseId ? booksByCourse[courseId]?.curriculumTitle : 'All Courses'
    
    switch (format) {
      case 'txt': {
        const content = [
          `Reading List - ${courseName}`,
          `Generated on: ${new Date().toLocaleDateString()}`,
          '',
          ...books.map((book, index) => 
            `${index + 1}. ${book.title}${book.author ? ` by ${book.author}` : ''}${book.year ? ` (${book.year})` : ''}${book.isbn ? ` - ISBN: ${book.isbn}` : ''}`
          )
        ].join('\n')
        downloadFile(content, `reading-list-${courseName.replace(/\s+/g, '-').toLowerCase()}.txt`, 'text/plain')
        break
      }
      case 'csv': {
        const headers = ['Title', 'Author', 'Year', 'ISBN', 'Type', 'Course']
        const rows = books.map(book => [
          book.title,
          book.author || '',
          book.year?.toString() || '',
          book.isbn || '',
          book.type,
          book.curriculumTitle
        ])
        const content = [headers, ...rows].map(row => 
          row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        ).join('\n')
        downloadFile(content, `reading-list-${courseName.replace(/\s+/g, '-').toLowerCase()}.csv`, 'text/csv')
        break
      }
      case 'json': {
        const content = JSON.stringify({
          course: courseName,
          generatedOn: new Date().toISOString(),
          books: books.map(book => ({
            title: book.title,
            author: book.author,
            year: book.year,
            isbn: book.isbn,
            type: book.type,
            course: book.curriculumTitle
          }))
        }, null, 2)
        downloadFile(content, `reading-list-${courseName.replace(/\s+/g, '-').toLowerCase()}.json`, 'application/json')
        break
      }
      case 'markdown': {
        const content = [
          `# Reading List - ${courseName}`,
          '',
          `*Generated on: ${new Date().toLocaleDateString()}*`,
          '',
          ...books.map((book, index) => {
            const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent([book.title, book.author].filter(Boolean).join(' '))}&i=stripbooks`
            return `${index + 1}. **${book.title}**${book.author ? ` by ${book.author}` : ''}${book.year ? ` (${book.year})` : ''} - [Find on Amazon](${searchUrl})`
          })
        ].join('\n')
        downloadFile(content, `reading-list-${courseName.replace(/\s+/g, '-').toLowerCase()}.md`, 'text/markdown')
        break
      }
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }



  const handleBookClick = (book: BookResource) => {
    const searchTerms = [book.title, book.author].filter(Boolean).join(' ')
    if (searchTerms) {
      const encodedSearch = encodeURIComponent(searchTerms)
      const url = `https://www.amazon.com/s?k=${encodedSearch}&i=stripbooks`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  if (isMobile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          {/* Mobile Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Library</h1>
                <p className="text-sm text-muted-foreground">
                  {totalResources} resources
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-primary" />
                  <span>{deduplicatedBookCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-blue-600" />
                  <span>{dashboardData.otherResources.length}</span>
                </div>
              </div>
            </div>

            {/* View Mode and Export Controls */}
            <div className="flex gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Books</SelectItem>
                  <SelectItem value="by-course">By Course</SelectItem>
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Reading List</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => generateReadingList('txt')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Text File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateReadingList('csv')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    CSV Spreadsheet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateReadingList('json')}>
                    <FileText className="h-4 w-4 mr-2" />
                    JSON Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateReadingList('markdown')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Books Section */}
          {dashboardData.bookResources.length > 0 && (
            <div className="space-y-3">
              {viewMode === 'by-course' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Required Books by Course</h2>
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(booksByCourse).length} courses
                    </Badge>
                  </div>
                  
                  {/* Condensed Mobile Course View */}
                  <div className="space-y-3">
                    {Object.entries(booksByCourse).map(([courseId, courseData]) => (
                      <div key={courseId} className="p-3 rounded-lg border bg-background">
                        <div className="flex items-center justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm line-clamp-1">{courseData.curriculumTitle}</h3>
                            <p className="text-xs text-muted-foreground">{courseData.books.length} books</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => generateReadingList('txt', parseInt(courseId))}>
                                Text File
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateReadingList('csv', parseInt(courseId))}>
                                CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateReadingList('markdown', parseInt(courseId))}>
                                Markdown
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Book Grid */}
                        <div className="grid grid-cols-4 gap-2">
                          {courseData.books.slice(0, 8).map((book, index) => (
                            <div 
                              key={index}
                              className="group cursor-pointer"
                              onClick={() => handleBookClick(book)}
                            >
                              <div className="relative mb-1">
                                <BookCover 
                                  isbn={book.isbn}
                                  title={book.title}
                                  author={book.author}
                                  year={book.year}
                                  className="h-14 w-10 mx-auto shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
                                />
                                <div className="absolute -top-1 -right-1">
                                  <Badge 
                                    variant={book.type === 'primary' ? 'default' : 'secondary'}
                                    className="text-xs px-0.5 py-0 h-3 min-w-0 w-3 flex items-center justify-center"
                                  >
                                    {book.type === 'primary' ? 'P' : 'S'}
                                  </Badge>
                                </div>
                              </div>
                              <h4 className="font-medium text-xs line-clamp-2 leading-tight text-center">
                                {book.title}
                              </h4>
                            </div>
                          ))}
                          {courseData.books.length > 8 && (
                            <div className="flex items-center justify-center text-xs text-muted-foreground">
                              +{courseData.books.length - 8} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">All Required Books</h2>
                    <Badge variant="secondary" className="text-xs">
                      {deduplicatedBookCount}
                    </Badge>
                  </div>
                  <BookCarousel 
                    books={dashboardData.bookResources} 
                    onDeduplicatedCountChange={setDeduplicatedBookCount}
                  />
                </div>
              )}
            </div>
          )}

          {/* Papers Section */}
          {filteredOtherResources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Academic Papers</h2>
                <Badge variant="secondary" className="text-xs">
                  {filteredOtherResources.length}
                </Badge>
              </div>
              
              {/* Mobile-optimized paper list */}
              <div className="space-y-2">
                {filteredOtherResources.map((resource, index) => (
                  <div key={index} className="p-3 rounded-lg border bg-background">
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm leading-tight line-clamp-2">
                        {resource.title}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {resource.author}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {resource.journal}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {resource.year} • Day {resource.day}
                        </span>
                        {resource.doi && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = `https://doi.org/${resource.doi}`
                              window.open(link, '_blank', 'noopener,noreferrer')
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalResources === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Resources Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your learning resources will appear here as you create curricula.
              </p>
            </div>
          )}

          {/* No Search Results */}
          {totalResources > 0 && searchQuery && filteredOtherResources.length === 0 && dashboardData.bookResources.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    )
  }

  // Desktop layout
  return (
    <AppLayout>
      <div className="flex-1">
        {/* Desktop Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Learning Library</h1>
              <p className="text-sm text-muted-foreground mt-1">
                All your required books and academic resources organized by course
              </p>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{deduplicatedBookCount}</span>
                <span className="text-muted-foreground">Books</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{dashboardData.otherResources.length}</span>
                <span className="text-muted-foreground">Papers</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-green-600" />
                <span className="font-medium">{totalResources}</span>
                <span className="text-muted-foreground">Total</span>
              </div>
              
              {/* Export Controls */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Reading List
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export All Books</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => generateReadingList('txt')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Text File (.txt)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateReadingList('csv')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    CSV Spreadsheet (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateReadingList('json')}>
                    <FileText className="h-4 w-4 mr-2" />
                    JSON Data (.json)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generateReadingList('markdown')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Markdown (.md)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* View Mode Selector */}
          <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as ViewMode)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all">All Books</TabsTrigger>
              <TabsTrigger value="by-course">By Course</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Required Books Section */}
              {dashboardData.bookResources.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">All Required Books</h2>
                    <span className="text-sm text-muted-foreground">({deduplicatedBookCount})</span>
                  </div>
                  
                  <BookCarousel 
                    books={dashboardData.bookResources} 
                    onDeduplicatedCountChange={setDeduplicatedBookCount}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="by-course" className="space-y-6">
              {/* Required Books by Course - Condensed Desktop View */}
              {Object.keys(booksByCourse).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Required Books by Course</h2>
                    <span className="text-sm text-muted-foreground">({Object.keys(booksByCourse).length} courses)</span>
                  </div>
                  
                  <div className="grid gap-4">
                    {Object.entries(booksByCourse).map(([courseId, courseData]) => (
                      <div key={courseId} className="p-4 rounded-lg border bg-background">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{courseData.curriculumTitle}</h3>
                            <p className="text-sm text-muted-foreground">
                              {courseData.books.length} required book{courseData.books.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Export {courseData.curriculumTitle}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => generateReadingList('txt', parseInt(courseId))}>
                                <FileText className="h-4 w-4 mr-2" />
                                Text File
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateReadingList('csv', parseInt(courseId))}>
                                <FileDown className="h-4 w-4 mr-2" />
                                CSV Spreadsheet
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateReadingList('json', parseInt(courseId))}>
                                <FileText className="h-4 w-4 mr-2" />
                                JSON Data
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateReadingList('markdown', parseInt(courseId))}>
                                <FileText className="h-4 w-4 mr-2" />
                                Markdown
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Condensed Book Grid */}
                        <div className="grid grid-cols-8 lg:grid-cols-12 gap-3">
                          {courseData.books.map((book, index) => (
                            <div 
                              key={index}
                              className="group cursor-pointer"
                              onClick={() => handleBookClick(book)}
                            >
                              <div className="relative mb-2">
                                <BookCover 
                                  isbn={book.isbn}
                                  title={book.title}
                                  author={book.author}
                                  year={book.year}
                                  className="h-20 w-14 mx-auto shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
                                />
                                <div className="absolute -top-1 -right-1">
                                  <Badge 
                                    variant={book.type === 'primary' ? 'default' : 'secondary'}
                                    className="text-xs px-1 py-0 h-4"
                                  >
                                    {book.type === 'primary' ? 'P' : 'S'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-center space-y-1">
                                <h4 className="font-medium text-xs line-clamp-2 leading-tight">
                                  {book.title}
                                </h4>
                                {book.author && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {book.author.split(' ').slice(-1)[0]}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Academic Papers Section */}
          {dashboardData.otherResources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Academic Papers & Resources</h2>
                <span className="text-sm text-muted-foreground">({dashboardData.otherResources.length})</span>
              </div>
              
              <ResourcesTable resources={dashboardData.otherResources} />
            </div>
          )}

          {/* Empty State */}
          {totalResources === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Resources Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Your learning resources will appear here as you create and progress through curricula.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
} 