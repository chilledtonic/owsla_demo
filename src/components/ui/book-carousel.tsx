"use client"

import { BookResource } from "@/lib/actions"
import { BookCover } from "./book-cover"
import { Badge } from "./badge"
import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { ChevronLeft, ChevronRight, SortAsc } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { deduplicateBooks } from "@/lib/utils"

interface BookCarouselProps {
  books: BookResource[]
  onDeduplicatedCountChange?: (count: number) => void
}

type SortOption = 'type' | 'curriculum' | 'author' | 'year' | 'title'

export function BookCarousel({ books, onDeduplicatedCountChange }: BookCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortOption>('type')
  const booksPerPage = 24 // 3 rows of 8 books
  
  // Deduplicate books by title and smart sorting logic
  const sortedBooks = useMemo(() => {
    // Use the utility function to deduplicate books
    const uniqueBooks = deduplicateBooks(books)
    
    const sorted = [...uniqueBooks].sort((a, b) => {
      switch (sortBy) {
        case 'type':
          // Primary books first, then supplementary
          if (a.type !== b.type) {
            return a.type === 'primary' ? -1 : 1
          }
          // Then by curriculum title
          return a.curriculumTitle.localeCompare(b.curriculumTitle)
          
        case 'curriculum':
          const curriculumCompare = a.curriculumTitle.localeCompare(b.curriculumTitle)
          if (curriculumCompare !== 0) return curriculumCompare
          // Then by type (primary first)
          return a.type === 'primary' ? -1 : 1
          
        case 'author':
          const authorA = a.author || 'Unknown'
          const authorB = b.author || 'Unknown'
          const authorCompare = authorA.localeCompare(authorB)
          if (authorCompare !== 0) return authorCompare
          // Then by title
          return a.title.localeCompare(b.title)
          
        case 'year':
          const yearA = a.year || 0
          const yearB = b.year || 0
          if (yearA !== yearB) return yearB - yearA // Newest first
          // Then by title
          return a.title.localeCompare(b.title)
          
        case 'title':
          return a.title.localeCompare(b.title)
          
        default:
          return 0
      }
    })
    return sorted
  }, [books, sortBy])

  // Notify parent component of deduplicated count
  useEffect(() => {
    if (onDeduplicatedCountChange) {
      onDeduplicatedCountChange(sortedBooks.length)
    }
  }, [sortedBooks.length, onDeduplicatedCountChange])

  const totalPages = Math.ceil(sortedBooks.length / booksPerPage)
  const startIndex = currentPage * booksPerPage
  const endIndex = startIndex + booksPerPage
  const currentBooks = sortedBooks.slice(startIndex, endIndex)

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setCurrentPage(0) // Reset to first page when sorting
  }

  const handleBookClick = (book: BookResource) => {
    // Create Amazon search query using title and author
    const searchTerms = [book.title, book.author].filter(Boolean).join(' ')
    if (searchTerms) {
      const encodedSearch = encodeURIComponent(searchTerms)
      const url = `https://www.amazon.com/s?k=${encodedSearch}&i=stripbooks`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No books required for your current curricula
      </div>
    )
  }

  // Calculate grid layout based on number of books
  const getGridCols = () => {
    if (currentBooks.length <= 8) return "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8"
    if (currentBooks.length <= 16) return "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8"
    return "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8"
  }

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'type': return 'Type (Primary First)'
      case 'curriculum': return 'By Curriculum'
      case 'author': return 'By Author'
      case 'year': return 'By Year (Newest)'
      case 'title': return 'By Title'
      default: return option
    }
  }

  // Show deduplication info if there were duplicates
  const originalCount = books.length
  const uniqueCount = sortedBooks.length
  const duplicatesRemoved = originalCount - uniqueCount

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">{getSortLabel('type')}</SelectItem>
              <SelectItem value="curriculum">{getSortLabel('curriculum')}</SelectItem>
              <SelectItem value="author">{getSortLabel('author')}</SelectItem>
              <SelectItem value="year">{getSortLabel('year')}</SelectItem>
              <SelectItem value="title">{getSortLabel('title')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navigation Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(endIndex, sortedBooks.length)} of {sortedBooks.length} unique books
        {duplicatesRemoved > 0 && (
          <span className="ml-2 text-xs">
            ({duplicatesRemoved} duplicate{duplicatesRemoved !== 1 ? 's' : ''} removed)
          </span>
        )}
      </div>

      {/* Bookshelf Grid */}
      <div className={`grid ${getGridCols()} gap-3`}>
        {currentBooks.map((book, index) => (
          <div 
            key={`${book.curriculumId}-${startIndex + index}`}
            className="group cursor-pointer"
            onClick={() => handleBookClick(book)}
          >
            {/* Book Cover */}
            <div className="relative mb-2">
              <BookCover 
                isbn={book.isbn}
                title={book.title}
                className="h-20 w-14 mx-auto shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
              />
              {/* Type Badge */}
              <div className="absolute -top-1 -right-1">
                <Badge 
                  variant={book.type === 'primary' ? 'default' : 'secondary'}
                  className="text-xs px-1 py-0 h-4"
                >
                  {book.type === 'primary' ? 'P' : 'S'}
                </Badge>
              </div>
            </div>

            {/* Book Info */}
            <div className="text-center space-y-1">
              <h4 className="font-medium text-xs line-clamp-2 leading-tight">
                {book.title}
              </h4>
              {book.author && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {book.author.split(' ').slice(-1)[0]} {/* Last name only */}
                </p>
              )}
              {book.year && (
                <p className="text-xs text-muted-foreground">
                  {book.year}
                </p>
              )}
              <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                {book.curriculumTitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile-friendly pagination dots */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 lg:hidden">
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentPage ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 