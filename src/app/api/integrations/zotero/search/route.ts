import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { getUserIntegration, upsertUserIntegration } from '@/lib/database'
import { decrypt } from '@/lib/encryption'
import { Resource } from '@/types/course-editor'

// Cache settings
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const MAX_RETRIES = 3
const BACKOFF_MULTIPLIER = 2

interface ZoteroCacheEntry {
  data: any[]
  version: number
  timestamp: number
  etag?: string
}

// In-memory cache (in production, you'd want Redis or similar)
const libraryCache = new Map<string, ZoteroCacheEntry>()

// GET - Search user's Zotero library with proper caching
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Zotero Search API called with caching')
    
    const user = await stackServerApp.getUser()
    if (!user) {
      console.log('❌ No user found - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ User authenticated:', { userId: user.id, email: user.primaryEmail })

    // Get user's Zotero integration
    const integration = await getUserIntegration(user.id, 'zotero')
    if (!integration || !integration.is_enabled || !integration.api_key_encrypted) {
      console.log('❌ Zotero integration not found or not enabled')
      return NextResponse.json(
        { error: 'Zotero integration not configured' }, 
        { status: 400 }
      )
    }

    // Decrypt API key
    const apiKey = decrypt(integration.api_key_encrypted)
    console.log('🔑 API key decrypted successfully')

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') as 'book' | 'journalArticle' | undefined
    const limit = parseInt(searchParams.get('limit') || '25')
    const start = parseInt(searchParams.get('start') || '0')

    console.log('📊 Search parameters:', {
      query,
      type,
      limit,
      start,
      fullUrl: request.url
    })

    // Get user ID from API key (cached for performance)
    const userId = await getZoteroUserIdCached(apiKey)
    if (!userId) {
      console.log('❌ Failed to get user ID from API key')
      return NextResponse.json(
        { error: 'Invalid API key or access denied' }, 
        { status: 401 }
      )
    }

    console.log('👤 Zotero User ID:', userId)

    // Search Zotero library with proper caching and conditional requests
    const searchResult = await searchZoteroLibraryCached(apiKey, userId, {
      query,
      itemType: type,
      limit,
      start
    }, integration)

    if (searchResult.status === 429) {
      console.log('⏳ Rate limited by Zotero API')
      return NextResponse.json(
        { error: 'Rate limited. Please try again later.' }, 
        { 
          status: 429,
          headers: searchResult.retryAfter ? {
            'Retry-After': searchResult.retryAfter.toString()
          } : {}
        }
      )
    }

    console.log('📚 Found', searchResult.items.length, 'items from Zotero API')

    // Convert to Resource format for the frontend
    const resources: Resource[] = searchResult.items.map(convertZoteroItemToResource)

    console.log('🔄 Converted resources for frontend:', {
      count: resources.length,
      items: resources.slice(0, 3).map(r => ({
        title: r.title,
        type: r.type,
        author: r.author,
        source: r.source
      }))
    })

    const response = {
      resources,
      total: searchResult.items.length,
      hasMore: searchResult.items.length === limit,
      cached: searchResult.fromCache,
      lastModified: searchResult.lastModified
    }

    console.log('✅ Search completed successfully:', {
      resourceCount: response.resources.length,
      total: response.total,
      hasMore: response.hasMore,
      cached: response.cached
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Error searching Zotero:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to search Zotero library' }, 
      { status: 500 }
    )
  }
}

// Cache for user ID lookups (since these don't change)
const userIdCache = new Map<string, { userId: number; timestamp: number }>()

async function getZoteroUserIdCached(apiKey: string): Promise<number | null> {
  const cacheKey = `userid_${apiKey.substring(0, 8)}` // Use first 8 chars as cache key
  const cached = userIdCache.get(cacheKey)
  
  // Cache user ID for 1 hour since it doesn't change
  if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
    console.log('📋 Using cached user ID')
    return cached.userId
  }

  try {
    console.log('🔑 Verifying API key with Zotero...')
    
    const response = await fetchWithRateLimit(`https://api.zotero.org/keys/${apiKey}`, {
      headers: {
        'Zotero-API-Version': '3',
        'Zotero-API-Key': apiKey
      }
    })

    if (!response.ok) {
      console.error('❌ API key verification failed:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const userId = data.userID
    
    // Cache the result
    userIdCache.set(cacheKey, { userId, timestamp: Date.now() })
    
    console.log('✅ API key verified, user ID cached:', userId)
    return userId
  } catch (error) {
    console.error('❌ Error verifying API key:', error)
    return null
  }
}

// Enhanced search with proper caching and conditional requests
async function searchZoteroLibraryCached(
  apiKey: string, 
  userId: number, 
  options: {
    query?: string
    itemType?: 'book' | 'journalArticle'
    limit: number
    start: number
  },
  integration: any
): Promise<{
  items: any[]
  status: number
  fromCache: boolean
  lastModified?: string
  retryAfter?: number
}> {
  try {
    console.log('🔍 Searching Zotero library with caching...')
    
    // Create cache key based on search parameters
    const cacheKey = `search_${userId}_${JSON.stringify(options)}`
    const cached = libraryCache.get(cacheKey)
    
    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 Using cached search results')
      return {
        items: cached.data,
        status: 200,
        fromCache: true,
        lastModified: new Date(cached.timestamp).toISOString()
      }
    }

    // Build API URL
    const baseUrl = `https://api.zotero.org/users/${userId}/items`
    const params = new URLSearchParams({
      'format': 'json',
      'limit': options.limit.toString(),
      'start': options.start.toString()
    })

    // Add search query if provided
    if (options.query && options.query.trim()) {
      params.append('q', options.query.trim())
    }

    // Add item type filter if provided
    if (options.itemType) {
      params.append('itemType', options.itemType)
    } else {
      // Filter to only books and journal articles
      params.append('itemType', 'book || journalArticle')
    }

    // Add conditional request header if we have cached data
    const headers: Record<string, string> = {
      'Zotero-API-Version': '3',
      'Zotero-API-Key': apiKey,
      'User-Agent': 'owsla.io'
    }

    if (cached?.version) {
      headers['If-Modified-Since-Version'] = cached.version.toString()
      console.log('🔄 Making conditional request with version:', cached.version)
    }

    // Get stored library version from integration settings
    const storedVersion = integration.settings?.library_version
    if (storedVersion && !cached) {
      headers['If-Modified-Since-Version'] = storedVersion.toString()
      console.log('🔄 Using stored library version:', storedVersion)
    }

    const url = `${baseUrl}?${params.toString()}`
    console.log('📡 Fetching from:', url)

    const response = await fetchWithRateLimit(url, { headers })

    // Handle 304 Not Modified
    if (response.status === 304) {
      console.log('✅ Data not modified, using cached results')
      if (cached) {
        // Update cache timestamp but keep data
        cached.timestamp = Date.now()
        libraryCache.set(cacheKey, cached)
        return {
          items: cached.data,
          status: 304,
          fromCache: true,
          lastModified: new Date(cached.timestamp).toISOString()
        }
      } else {
        // No cached data available, this shouldn't happen
        console.warn('⚠️ Got 304 but no cached data available')
        return { items: [], status: 304, fromCache: false }
      }
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      console.log('⏳ Rate limited, retry after:', retryAfter)
      return {
        items: [],
        status: 429,
        fromCache: false,
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined
      }
    }

    if (!response.ok) {
      console.error('❌ Zotero API request failed:', response.status, response.statusText)
      throw new Error(`Zotero API error: ${response.status} ${response.statusText}`)
    }

    // Get library version from response headers
    const libraryVersion = response.headers.get('Last-Modified-Version')
    if (libraryVersion) {
      console.log('📚 Library version from API:', libraryVersion)
      
      // Store library version in integration settings
      const newSettings = { 
        ...integration.settings, 
        library_version: parseInt(libraryVersion) 
      }
      await upsertUserIntegration(integration.user_id, 'zotero', {
        is_enabled: integration.is_enabled,
        settings: newSettings
      })
    }

    const items = await response.json()
    console.log('📖 Fetched', items.length, 'items from Zotero')
    
    // Cache the results
    const cacheEntry: ZoteroCacheEntry = {
      data: items,
      version: libraryVersion ? parseInt(libraryVersion) : Date.now(),
      timestamp: Date.now()
    }
    libraryCache.set(cacheKey, cacheEntry)

    return {
      items,
      status: 200,
      fromCache: false,
      lastModified: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Error searching Zotero library:', error)
    throw error
  }
}

// Enhanced fetch with rate limiting and backoff handling
async function fetchWithRateLimit(
  url: string, 
  options: RequestInit,
  retryCount = 0
): Promise<Response> {
  const response = await fetch(url, options)
  
  // Handle backoff requests
  const backoff = response.headers.get('Backoff')
  if (backoff) {
    const backoffSeconds = parseInt(backoff)
    console.log(`⏳ Backoff requested: ${backoffSeconds} seconds`)
    
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, backoffSeconds * 1000))
      return fetchWithRateLimit(url, options, retryCount + 1)
    }
  }
  
  // Handle rate limiting with exponential backoff
  if (response.status === 429 && retryCount < MAX_RETRIES) {
    const retryAfter = response.headers.get('Retry-After')
    const delay = retryAfter 
      ? parseInt(retryAfter) * 1000 
      : Math.pow(BACKOFF_MULTIPLIER, retryCount) * 1000

    console.log(`⏳ Rate limited, retrying in ${delay/1000} seconds (attempt ${retryCount + 1})`)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    return fetchWithRateLimit(url, options, retryCount + 1)
  }
  
  return response
}

// Convert Zotero API item to our Resource format
function convertZoteroItemToResource(zoteroItem: any): Resource {
  const data = zoteroItem.data
  
  // Extract authors from creators
  const authors = data.creators?.map((creator: any) => {
    if (creator.name) return creator.name
    return [creator.firstName, creator.lastName].filter(Boolean).join(' ')
  }).filter(Boolean) || []
  
  const author = authors.length > 0 ? authors.join(', ') : 'Unknown Author'
  
  // Extract year from date
  const year = data.date ? (data.date.match(/\d{4}/)?.[0] || '') : ''
  
  // Determine type
  const type = data.itemType === 'book' ? 'book' : 'article'
  
  // Extract tags
  const tags = data.tags?.map((tag: any) => tag.tag).filter(Boolean) || undefined
  
  return {
    id: zoteroItem.key, // Use Zotero's unique key as the id
    type,
    title: data.title || 'Untitled',
    author,
    year,
    isbn: data.ISBN || '',
    doi: data.DOI || '',
    journal: data.itemType === 'journalArticle' ? (data.publicationTitle || data.journalAbbreviation || undefined) : undefined,
    publisher: data.itemType === 'book' ? (data.publisher || undefined) : undefined,
    reading_time: '', // Not available from Zotero
    focus: data.abstractNote ? data.abstractNote.substring(0, 100) + '...' : '',
    source: 'zotero' as const,
    zotero_key: zoteroItem.key,
    tags
  }
} 