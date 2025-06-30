import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper function to create Amazon.ca search URL for an ISBN
 */
export function getAmazonIsbnUrl(isbn: string): string {
  if (!isbn) return ""
  // Clean ISBN - remove any non-digit characters except X
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '')
  return `https://www.amazon.ca/s?k=${encodeURIComponent(cleanIsbn)}`
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
