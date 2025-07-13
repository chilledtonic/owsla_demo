import { NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { getUserIntegration } from '@/lib/database'
import { decrypt } from '@/lib/encryption'

// POST - Test user's Zotero API key and connection
export async function POST() {
  try {
    console.log('🔄 Zotero API test/sync called')
    
    const user = await stackServerApp.getUser()
    if (!user) {
      console.log('❌ No user found - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', { userId: user.id, email: user.primaryEmail })

    const integration = await getUserIntegration(user.id, 'zotero')
    if (!integration || !integration.is_enabled || !integration.api_key_encrypted) {
      console.log('❌ No Zotero integration found or disabled')
      return NextResponse.json(
        { error: 'Zotero integration not configured or disabled' }, 
        { status: 400 }
      )
    }

    // Decrypt API key
    let apiKey: string
    try {
      apiKey = decrypt(integration.api_key_encrypted)
      console.log('🔐 API key decrypted successfully')
    } catch (error) {
      console.error('❌ Failed to decrypt API key:', error)
      return NextResponse.json(
        { error: 'Invalid API key configuration. Please re-enter your API key.' }, 
        { status: 400 }
      )
    }

    // Test the API key by verifying it with Zotero
    const testResult = await testZoteroConnection(apiKey)
    
    if (!testResult.success) {
      console.log('❌ Zotero API test failed:', testResult.error)
      return NextResponse.json(
        { error: testResult.error }, 
        { status: 400 }
      )
    }

    console.log('✅ Zotero API test successful:', testResult.data)

    return NextResponse.json({ 
      success: true,
      message: 'Zotero API connection successful',
      userID: testResult.data.userID,
      username: testResult.data.username,
      libraryAccess: testResult.data.access?.user?.library,
      lastTested: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error testing Zotero connection:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Failed to test Zotero connection: ${errorMessage}` }, 
      { status: 500 }
    )
  }
}

// Test Zotero API connection
async function testZoteroConnection(apiKey: string): Promise<{
  success: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  error?: string
}> {
  try {
    console.log('🔑 Testing API key with Zotero...')
    
    // First verify the API key
    const keyResponse = await fetch(`https://api.zotero.org/keys/${apiKey}`, {
      headers: {
        'Zotero-API-Version': '3',
        'Zotero-API-Key': apiKey
      }
    })

    if (!keyResponse.ok) {
      console.error('❌ API key verification failed:', keyResponse.status, keyResponse.statusText)
      return {
        success: false,
        error: 'Invalid API key or access denied'
      }
    }

    const keyData = await keyResponse.json()
    console.log('✅ API key verified:', {
      userID: keyData.userID,
      username: keyData.username,
      access: keyData.access
    })

    // Test library access by fetching a small number of items
    const libraryResponse = await fetch(
      `https://api.zotero.org/users/${keyData.userID}/items?limit=1&format=json`,
      {
        headers: {
          'Zotero-API-Version': '3',
          'Zotero-API-Key': apiKey
        }
      }
    )

    if (!libraryResponse.ok) {
      console.error('❌ Library access test failed:', libraryResponse.status, libraryResponse.statusText)
      return {
        success: false,
        error: 'API key valid but cannot access library'
      }
    }

    const libraryItems = await libraryResponse.json()
    console.log('✅ Library access confirmed, sample items available:', libraryItems.length)

    return {
      success: true,
      data: {
        ...keyData,
        libraryItemCount: libraryItems.length,
        libraryAccessible: true
      }
    }
  } catch (error) {
    console.error('❌ Error testing Zotero connection:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 