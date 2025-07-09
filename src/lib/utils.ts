import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper function to create Amazon.ca search URL for an ISBN
 */
export function getAmazonIsbnUrl(isbn: string): string | null {
  if (!isbn || isbn === 'N/A') return null
  // Clean ISBN - remove any non-digit characters except X
  const cleanIsbn = isbn.replace(/[-\s]/g, '')
  return `https://amazon.com/dp/${cleanIsbn}`
}

/**
 * Helper function to create DOI lookup URL
 */
export function getDoiUrl(doi: string): string {
  if (!doi) return ""
  // Clean DOI - remove any extra whitespace
  const cleanDoi = doi.trim()
  return `https://doi.org/${encodeURIComponent(cleanDoi)}`
}

/**
 * Helper function to handle resource clicks based on resource type
 */
export function handleResourceClick(resource: { isbn?: string | null, doi?: string | null }) {
  if (resource.isbn && resource.isbn !== 'N/A') {
    // It's a book - go to Amazon.ca
    const url = getAmazonIsbnUrl(resource.isbn)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } else if (resource.doi && resource.doi !== 'N/A') {
    // It's a paper - go to DOI lookup
    const url = getDoiUrl(resource.doi)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
}

// Helper function to deduplicate books by normalized title
export function deduplicateBooks<T extends { title: string; type: 'primary' | 'supplementary'; author: string | null; year: number | null; isbn: string | null }>(books: T[]): T[] {
  // Helper function to normalize titles for better matching
  const normalizeTitle = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      // Remove everything after a dash
      .replace(/\s*-.*$/, '')
      // Remove everything in parentheses except standalone years
      .replace(/\s*\([^)]*\)/g, (match) => {
        // Keep if it's just a year (4 digits)
        const yearMatch = match.match(/^\s*\((\d{4})\)\s*$/)
        return yearMatch ? yearMatch[0] : ''
      })
      // Remove edition information
      .replace(/\s*\d+(st|nd|rd|th)\s+edition/gi, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Helper function to get the core title for similarity matching
  const getCoreTitle = (title: string): string => {
    const normalized = normalizeTitle(title)
    // Extract the main title before any dash or colon
    const mainPart = normalized.split(/\s*[-:]\s*/)[0].trim()
    return mainPart || normalized
  }

  // Deduplicate by normalized title
  const deduplicatedBooks = books.reduce((acc, book) => {
    const normalizedTitle = normalizeTitle(book.title)
    const coreTitle = getCoreTitle(book.title)
    
    // Check for exact normalized match first
    let matchKey = normalizedTitle
    let existingEntry = acc.get(matchKey)
    
    // If no exact match, check for core title similarity
    if (!existingEntry) {
      // Look for books with the same core title
      for (const [key, value] of acc.entries()) {
        const existingCore = getCoreTitle(value.title)
        if (existingCore === coreTitle && existingCore.length > 3) { // Avoid matching very short titles
          matchKey = key
          existingEntry = value
          break
        }
      }
    }
    
    // If we haven't seen this title (or similar) before, add it
    if (!existingEntry) {
      acc.set(matchKey, book)
    } else {
      // If we have seen it, prefer primary over supplementary
      if (book.type === 'primary' && existingEntry.type === 'supplementary') {
        acc.set(matchKey, book)
      }
      // If both are same type, prefer the one with more complete data
      else if (book.type === existingEntry.type) {
        const bookScore = (book.author ? 1 : 0) + (book.year ? 1 : 0) + (book.isbn && book.isbn !== 'N/A' ? 1 : 0)
        const existingScore = (existingEntry.author ? 1 : 0) + (existingEntry.year ? 1 : 0) + (existingEntry.isbn && existingEntry.isbn !== 'N/A' ? 1 : 0)
        if (bookScore > existingScore) {
          acc.set(matchKey, book)
        }
        // If scores are equal, prefer the shorter, cleaner title
        else if (bookScore === existingScore && book.title.length < existingEntry.title.length) {
          acc.set(matchKey, book)
        }
      }
    }
    
    return acc
  }, new Map<string, T>())

  return Array.from(deduplicatedBooks.values())
}
