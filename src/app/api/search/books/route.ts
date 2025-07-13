import { NextRequest, NextResponse } from 'next/server'

// CORS headers for API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

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

// Utility function to estimate reading time
function estimateReadingTime(pages?: number): string {
  if (!pages) return 'Unknown'
  
  const wordsPerPage = 250
  const readingSpeed = 200 // words per minute
  const totalWords = pages * wordsPerPage
  const minutes = Math.round(totalWords / readingSpeed)
  
  if (minutes < 60) {
    return `${minutes} minutes`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const openLibraryParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      fields: 'title,author_name,isbn,publish_year,publisher,first_publish_year,number_of_pages_median'
    })

    const response = await fetch(`https://openlibrary.org/search.json?${openLibraryParams}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'owsla.io/1.0 (contact@owsla.io)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`OpenLibrary API error: ${response.status}`)
    }

    const data: OpenLibraryResponse = await response.json()

    const books = data.docs.map((doc, index) => {
      const author = doc.author_name?.[0] || 'Unknown Author'
      const year = doc.first_publish_year || doc.publish_year?.[0]
      const isbn = doc.isbn?.find(i => i.length === 13) || doc.isbn?.[0] // Prefer ISBN-13
      const publisher = doc.publisher?.[0]

      return {
        id: `book-${Date.now()}-${index}`,
        title: doc.title,
        author,
        isbn: isbn || '',
        year: year?.toString() || '',
        publisher: publisher || '',
        type: 'book' as const,
        reading_time: estimateReadingTime(doc.number_of_pages_median),
        focus: `Published ${year ? `in ${year}` : 'date unknown'}${publisher ? ` by ${publisher}` : ''}`,
        source: 'openlibrary' as const
      }
    })

    return NextResponse.json(
      { books, total: data.numFound },
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error searching books:', error)
    
    let errorMessage = 'Failed to search books. Please try again later.'
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Unable to connect to book database. Please check your internet connection.'
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    )
  }
} 