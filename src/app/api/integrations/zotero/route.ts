import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { 
  getUserIntegration, 
  upsertUserIntegration, 
  deleteUserIntegration,
  deleteZoteroResources
} from '@/lib/database'
import { encrypt } from '@/lib/encryption'

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

// GET - Fetch user's Zotero integration
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const integration = await getUserIntegration(user.id, 'zotero')
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404, headers: corsHeaders })
    }

    // Don't return the encrypted API key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { api_key_encrypted, ...safeIntegration } = integration
    return NextResponse.json(safeIntegration, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching Zotero integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST - Create or update Zotero integration
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { is_enabled, api_key } = body

    if (typeof is_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'is_enabled must be a boolean' }, 
        { status: 400, headers: corsHeaders }
      )
    }

    let api_key_encrypted = null
    if (api_key && typeof api_key === 'string' && api_key.trim()) {
      // Validate API key format (basic check)
      if (!/^[a-zA-Z0-9]{24}$/.test(api_key.trim())) {
        return NextResponse.json(
          { error: 'Invalid API key format. Zotero API keys should be 24 characters long.' }, 
          { status: 400, headers: corsHeaders }
        )
      }
      
      api_key_encrypted = encrypt(api_key.trim())
    }

    const integration = await upsertUserIntegration(user.id, 'zotero', {
      is_enabled,
      api_key_encrypted,
      settings: {}
    })

    // Don't return the encrypted API key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { api_key_encrypted: encryptedKey, ...safeIntegration } = integration
    return NextResponse.json(safeIntegration, { headers: corsHeaders })
  } catch (error) {
    console.error('Error saving Zotero integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE - Remove Zotero integration
export async function DELETE() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    await deleteUserIntegration(user.id, 'zotero')
    
    // Also delete cached Zotero resources
    await deleteZoteroResources(user.id)
    
    return NextResponse.json({ message: 'Integration deleted successfully' }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error deleting Zotero integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: corsHeaders }
    )
  }
} 