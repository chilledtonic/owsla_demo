"use client"

import { BookResource } from "@/lib/actions"
import { BookCover } from "./book-cover"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface BookCarouselProps {
  books: BookResource[]
}

export function BookCarousel({ books }: BookCarouselProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const booksPerPage = 4
  const totalPages = Math.ceil(books.length / booksPerPage)

  const startIndex = currentPage * booksPerPage
  const endIndex = startIndex + booksPerPage
  const currentBooks = books.slice(startIndex, endIndex)

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  if (books.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Required Books</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No books required for your current curricula
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Required Books ({books.length})</CardTitle>
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
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {currentBooks.map((book, index) => (
            <Card 
              key={`${book.curriculumId}-${startIndex + index}`}
              className="cursor-pointer hover:shadow-md transition-shadow h-full"
              onClick={() => router.push(`/curriculum/${book.curriculumId}`)}
            >
              <CardContent className="p-3 h-full">
                <div className="flex flex-col items-center space-y-3 h-full">
                  <BookCover 
                    isbn={book.isbn}
                    title={book.title}
                    className="h-32 w-24"
                  />
                  <div className="text-center space-y-1 w-full flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2">
                      {book.title}
                    </h4>
                    {book.author && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        by {book.author}
                      </p>
                    )}
                    {book.year && (
                      <p className="text-xs text-muted-foreground">
                        {book.year}
                      </p>
                    )}
                    <div className="flex justify-center">
                      <Badge 
                        variant={book.type === 'primary' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {book.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                      {book.curriculumTitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 