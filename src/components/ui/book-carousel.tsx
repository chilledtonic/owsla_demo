"use client"

import { BookResource } from "@/lib/actions"
import { BookCover } from "./book-cover"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./carousel"
import { useRouter } from "next/navigation"

interface BookCarouselProps {
  books: BookResource[]
}

export function BookCarousel({ books }: BookCarouselProps) {
  const router = useRouter()

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
        <CardTitle className="text-base">Required Books ({books.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-hidden">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {books.map((book, index) => (
                <CarouselItem key={`${book.curriculumId}-${index}`} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow h-full"
                    onClick={() => router.push(`/curriculum/${book.curriculumId}`)}
                  >
                    <CardContent className="p-3 h-full">
                      <div className="flex flex-col items-center space-y-3 h-full">
                        <BookCover 
                          isbn={book.isbn}
                          title={book.title}
                          className="h-32 w-24 sm:h-36 sm:w-26"
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
                          <div className="flex flex-wrap gap-1 justify-center">
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
                </CarouselItem>
              ))}
            </CarouselContent>
            {books.length > 3 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        </div>
      </CardContent>
    </Card>
  )
} 