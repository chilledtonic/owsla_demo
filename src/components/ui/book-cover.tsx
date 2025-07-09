"use client"

import { useState, useEffect } from "react"
import { BookOpen } from "lucide-react"
import Image from "next/image"
import { GeneratedBookCover } from "./generated-book-cover"
import { BookCoverData } from "@/lib/cover-utils"

interface BookCoverProps {
  isbn?: string | null
  title?: string
  author?: string | null
  year?: number | null
  className?: string
}

export function BookCover({ isbn, title, author, year, className = "h-32 w-24" }: BookCoverProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isbn) {
      setImageUrl(null)
      return
    }

    setLoading(true)
    setImageError(false)

    // Clean ISBN - remove any non-digit characters except X
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '')
    
    if (cleanIsbn.length === 0) {
      setImageUrl(null)
      setLoading(false)
      return
    }

    // Try to fetch the cover from Open Library
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`
    
    // Test if the image exists
    const img = document.createElement('img')
    img.onload = () => {
      setImageUrl(coverUrl)
      setLoading(false)
    }
    img.onerror = () => {
      setImageError(true)
      setImageUrl(null)
      setLoading(false)
    }
    img.src = coverUrl
  }, [isbn])

  if (loading) {
    return (
      <div className={`${className} bg-muted rounded-none flex items-center justify-center animate-pulse`}>
        <BookOpen className="h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  if (!isbn || imageError || !imageUrl) {
    // If we have title information, generate a cover
    if (title) {
      const bookData: BookCoverData = {
        title,
        author: author || undefined,
        isbn: isbn || undefined,
        year: year || undefined
      }
      
      return (
        <GeneratedBookCover 
          book={bookData} 
          className={className}
          showPattern={true}
          showGradient={false}
        />
      )
    }
    
    // Fallback to placeholder
    return (
      <div className={`${className} bg-muted rounded-none flex items-center justify-center`}>
        <BookOpen className="h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={`${className} relative overflow-hidden rounded-none`}>
      <Image
        src={imageUrl}
        alt={title ? `Cover of ${title}` : "Book cover"}
        fill
        sizes="48px"
        className="object-cover"
        onError={() => {
          setImageError(true)
          setImageUrl(null)
        }}
      />
    </div>
  )
} 