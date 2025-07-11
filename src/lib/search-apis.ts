import { Resource } from '@/types/course-editor'

// Open Library API types
interface OpenLibraryDoc {
  title: string
  author_name?: string[]
  isbn?: string[]
  publish_year?: number[]
  publisher?: string[]
  first_publish_year?: number
  number_of_pages_median?: number
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[]
  numFound: number
}

// Crossref API types
interface CrossrefAuthor {
  given?: string
  family?: string
}

interface CrossrefWork {
  DOI: string
  title: string[]
  author?: CrossrefAuthor[]
  published?: {
    'date-parts': number[][]
  }
  'container-title'?: string[]
  publisher?: string
  type: string
  abstract?: string
}

interface CrossrefResponse {
  message: {
    items: CrossrefWork[]
    'total-results': number
  }
}

// Utility functions
function formatAuthorName(authors: CrossrefAuthor[]): string {
  if (!authors || authors.length === 0) return 'Unknown Author'
  
  const firstAuthor = authors[0]
  const name = `${firstAuthor.given || ''} ${firstAuthor.family || ''}`.trim()
  
  if (authors.length > 1) {
    return `${name} et al.`
  }
  
  return name || 'Unknown Author'
}

function estimateReadingTime(pages?: number): string {
  if (!pages) return '30-45 minutes'
  
  // Estimate 2-3 minutes per page for academic content
  const minutes = Math.round(pages * 2.5)
  
  if (minutes < 60) {
    return `${minutes} minutes`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }
}

function extractAbstractPreview(abstract?: string): string {
  if (!abstract) return ''
  
  // Remove HTML tags and get first 150 characters
  const cleanText = abstract.replace(/<[^>]*>/g, '').trim()
  return cleanText.length > 150 ? `${cleanText.substring(0, 150)}...` : cleanText
}

// API Functions
export async function searchBooks(query: string, limit: number = 20): Promise<Resource[]> {
  if (!query.trim()) return []
  
  try {
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      fields: 'title,author_name,isbn,publish_year,publisher,first_publish_year,number_of_pages_median'
    })
    
    const response = await fetch(`https://openlibrary.org/search.json?${searchParams}`)
    
    if (!response.ok) {
      throw new Error(`Open Library API error: ${response.status}`)
    }
    
    const data: OpenLibraryResponse = await response.json()
    
    return data.docs.map((doc, index) => {
      const author = doc.author_name?.[0] || 'Unknown Author'
      const year = doc.first_publish_year || doc.publish_year?.[0]
      const isbn = doc.isbn?.find(i => i.length === 13) || doc.isbn?.[0] // Prefer ISBN-13
      const publisher = doc.publisher?.[0]
      
      return {
        id: `book-${Date.now()}-${index}`,
        title: doc.title,
        author,
        isbn,
        year: year?.toString(),
        publisher,
        type: 'book' as const,
        reading_time: estimateReadingTime(doc.number_of_pages_median),
        focus: `Published ${year ? `in ${year}` : 'date unknown'}${publisher ? ` by ${publisher}` : ''}`
      }
    })
  } catch (error) {
    console.error('Error searching books:', error)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to book database. Please check your internet connection.')
    } else {
      throw new Error('Failed to search books. Please try again later.')
    }
  }
}

export async function searchPapers(query: string, limit: number = 20): Promise<Resource[]> {
  if (!query.trim()) return []
  
  try {
    const searchParams = new URLSearchParams({
      query: query,
      rows: limit.toString(),
      select: 'DOI,title,author,published,container-title,publisher,type,abstract'
    })
    
    // Use a CORS proxy for Crossref API to avoid CORS issues in development
    const apiUrl = `https://api.crossref.org/works?${searchParams}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Crossref API error: ${response.status}`)
    }
    
    const data: CrossrefResponse = await response.json()
    
    return data.message.items.map((work, index) => {
      const title = work.title?.[0] || 'Untitled'
      const author = formatAuthorName(work.author || [])
      const year = work.published?.['date-parts']?.[0]?.[0]
      const journal = work['container-title']?.[0]
      const abstractPreview = extractAbstractPreview(work.abstract)
      
      return {
        id: `paper-${Date.now()}-${index}`,
        title,
        author,
        doi: work.DOI,
        year: year?.toString(),
        journal,
        publisher: work.publisher,
        type: work.type === 'journal-article' ? 'paper' : 'article' as const,
        reading_time: '15-30 minutes', // Standard estimate for academic papers
        focus: abstractPreview || `${work.type.replace('-', ' ')}${journal ? ` from ${journal}` : ''}`
      }
    })
  } catch (error) {
    console.error('Error searching papers:', error)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to academic database. Please check your internet connection.')
    } else if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error('Academic paper search temporarily unavailable due to browser security restrictions.')
    } else {
      throw new Error('Failed to search academic papers. Please try again later.')
    }
  }
}

// Combined search function
export async function searchResources(query: string, type: 'books' | 'papers' | 'all' = 'all'): Promise<{
  books: Resource[]
  papers: Resource[]
  errors: string[]
}> {
  const results = { books: [] as Resource[], papers: [] as Resource[], errors: [] as string[] }
  
  if (!query.trim()) return results
  
  const promises: Promise<void>[] = []
  
  if (type === 'books' || type === 'all') {
    promises.push(
      searchBooks(query, 10)
        .then(books => {
          results.books = books
        })
        .catch(error => {
          console.error('Books search failed:', error)
          results.errors.push(`Books: ${error.message}`)
        })
    )
  }
  
  if (type === 'papers' || type === 'all') {
    promises.push(
      searchPapers(query, 10)
        .then(papers => {
          results.papers = papers
        })
        .catch(error => {
          console.error('Papers search failed:', error)
          results.errors.push(`Papers: ${error.message}`)
        })
    )
  }
  
  await Promise.all(promises)
  return results
} 