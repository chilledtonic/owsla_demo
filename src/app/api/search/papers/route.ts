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

function extractAbstractPreview(abstract?: string): string {
  if (!abstract) return ''
  
  // Remove HTML tags and clean up
  const cleaned = abstract.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  
  // Return first 100 characters
  return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned
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

    const crossrefParams = new URLSearchParams({
      query: query,
      rows: limit.toString(),
      select: 'DOI,title,author,published,container-title,publisher,type,abstract'
    })

    const response = await fetch(`https://api.crossref.org/works?${crossrefParams}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'owsla.io/1.0 (contact@owsla.io)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Crossref API error: ${response.status}`)
    }

    const data: CrossrefResponse = await response.json()

    const papers = data.message.items.map((work, index) => {
      const title = work.title?.[0] || 'Untitled'
      const author = formatAuthorName(work.author || [])
      const year = work.published?.['date-parts']?.[0]?.[0]
      const journal = work['container-title']?.[0]
      const abstractPreview = extractAbstractPreview(work.abstract)

      return {
        id: `paper-${Date.now()}-${index}`,
        title,
        author,
        doi: work.DOI || '',
        year: year?.toString() || '',
        journal: journal || '',
        publisher: work.publisher || '',
        type: work.type === 'journal-article' ? 'paper' : 'article' as const,
        reading_time: '15-30 minutes', // Standard estimate for academic papers
        focus: abstractPreview || `${work.type.replace('-', ' ')}${journal ? ` from ${journal}` : ''}`,
        source: 'crossref' as const
      }
    })

    return NextResponse.json(
      { papers, total: data.message['total-results'] },
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error searching papers:', error)
    
    let errorMessage = 'Failed to search academic papers. Please try again later.'
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Unable to connect to academic database. Please check your internet connection.'
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    )
  }
} 