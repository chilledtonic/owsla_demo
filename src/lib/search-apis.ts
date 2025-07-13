import { Resource } from '@/types/course-editor'

// API Functions
export async function searchBooks(query: string, limit: number = 20): Promise<Resource[]> {
  if (!query.trim()) return []
  
  try {
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString()
    })
    
    // Use our internal API route instead of direct external call
    const response = await fetch(`/api/search/books?${searchParams}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.books || []
  } catch (error) {
    console.error('Error searching books:', error)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to book database. Please check your internet connection.')
    } else {
      throw new Error(error instanceof Error ? error.message : 'Failed to search books. Please try again later.')
    }
  }
}

export async function searchPapers(query: string, limit: number = 20): Promise<Resource[]> {
  if (!query.trim()) return []
  
  try {
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString()
    })
    
    // Use our internal API route instead of direct external call
    const response = await fetch(`/api/search/papers?${searchParams}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.papers || []
  } catch (error) {
    console.error('Error searching papers:', error)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to academic database. Please check your internet connection.')
    } else {
      throw new Error(error instanceof Error ? error.message : 'Failed to search academic papers. Please try again later.')
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