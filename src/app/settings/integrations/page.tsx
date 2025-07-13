"use client"

import { useState, useEffect } from "react"
import { useUser } from "@stackframe/stack"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Save, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  Info
} from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { UserIntegrationData } from "@/lib/database"

interface ZoteroIntegrationState {
  isEnabled: boolean
  apiKey: string
  isLoading: boolean
  isSaving: boolean
  isDeleting: boolean
  isSyncing: boolean
  lastSyncAt: string | null
  error: string | null
  success: string | null
  showApiKey: boolean
}

export default function IntegrationsPage() {
  const user = useUser({ or: "redirect" })
  const [zotero, setZotero] = useState<ZoteroIntegrationState>({
    isEnabled: false,
    apiKey: "",
    isLoading: true,
    isSaving: false,
    isDeleting: false,
    isSyncing: false,
    lastSyncAt: null,
    error: null,
    success: null,
    showApiKey: false
  })

  // Load existing integration data
  useEffect(() => {
    if (!user?.id) return

    const loadIntegration = async () => {
      try {
        const response = await fetch('/api/integrations/zotero')
        if (response.ok) {
          const data: UserIntegrationData = await response.json()
          setZotero(prev => ({
            ...prev,
            isEnabled: data.is_enabled,
            lastSyncAt: data.last_sync_at,
            isLoading: false
          }))
        } else if (response.status === 404) {
          // No integration exists yet
          setZotero(prev => ({ ...prev, isLoading: false }))
        } else {
          throw new Error('Failed to load integration')
        }
      } catch (error) {
        console.error('Error loading integration:', error)
        setZotero(prev => ({
          ...prev,
          error: 'Failed to load integration settings',
          isLoading: false
        }))
      }
    }

    loadIntegration()
  }, [user?.id])

  const clearMessages = () => {
    setZotero(prev => ({ ...prev, error: null, success: null }))
  }

  const handleSave = async () => {
    if (!zotero.apiKey.trim()) {
      setZotero(prev => ({ ...prev, error: 'API key is required' }))
      return
    }

    setZotero(prev => ({ ...prev, isSaving: true, error: null, success: null }))

    try {
      const response = await fetch('/api/integrations/zotero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_enabled: true, // Always enable when saving a key
          api_key: zotero.apiKey
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save integration')
      }

      const data: UserIntegrationData = await response.json()
      setZotero(prev => ({
        ...prev,
        lastSyncAt: data.last_sync_at,
        success: 'Integration saved and enabled successfully',
        apiKey: "", // Clear the input for security
        isEnabled: true // Always enabled when key is saved
      }))
    } catch (error) {
      console.error('Error saving integration:', error)
      setZotero(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save integration'
      }))
    } finally {
      setZotero(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // If trying to enable but no saved integration exists, show error
      if (!zotero.lastSyncAt) {
        setZotero(prev => ({ 
          ...prev, 
          error: 'Please save your API key first to enable the integration'
        }))
        return
      }
      
      // Enable the existing integration
      setZotero(prev => ({ ...prev, isSaving: true, error: null, success: null }))
      
      try {
        const response = await fetch('/api/integrations/zotero', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_enabled: true,
            api_key: null // Don't change the existing key
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to enable integration')
        }

        setZotero(prev => ({
          ...prev,
          isEnabled: true,
          success: 'Integration enabled successfully'
        }))
      } catch (error) {
        console.error('Error enabling integration:', error)
        setZotero(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to enable integration'
        }))
      } finally {
        setZotero(prev => ({ ...prev, isSaving: false }))
      }
    } else {
      // If disabling, delete the integration entirely
      if (!confirm('Disabling will delete your API key and all cached Zotero resources. Are you sure?')) {
        return
      }
      
      await handleDelete()
    }
  }

  const handleDelete = async () => {
    setZotero(prev => ({ ...prev, isDeleting: true, error: null, success: null }))

    try {
      const response = await fetch('/api/integrations/zotero', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete integration')
      }

      setZotero({
        isEnabled: false,
        apiKey: "",
        isLoading: false,
        isSaving: false,
        isDeleting: false,
        isSyncing: false,
        lastSyncAt: null,
        error: null,
        success: 'Integration deleted successfully',
        showApiKey: false
      })
    } catch (error) {
      console.error('Error deleting integration:', error)
      setZotero(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete integration',
        isDeleting: false
      }))
    }
  }

  const handleSync = async () => {
    setZotero(prev => ({ ...prev, isSyncing: true, error: null, success: null }))

    try {
      const response = await fetch('/api/integrations/zotero/sync', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync library')
      }

      const data = await response.json()
      setZotero(prev => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
        success: `Synced ${data.synced || 0} resources from your Zotero library`
      }))
    } catch (error) {
      console.error('Error syncing library:', error)
      setZotero(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sync library'
      }))
    } finally {
      setZotero(prev => ({ ...prev, isSyncing: false }))
    }
  }

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return "Never"
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(lastSyncAt))
  }

  if (zotero.isLoading) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Integrations</h1>
              <p className="text-muted-foreground">Connect external services to enhance your learning experience</p>
            </div>
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground">Connect external services to enhance your learning experience</p>
          </div>

          {/* Zotero Integration Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">Z</span>
                    </div>
                    Zotero
                    {zotero.isEnabled && (
                      <Badge variant="default" className="ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Access your Zotero library when searching for resources. Books and journal articles from your library will be available in the course editor.
                    {!zotero.lastSyncAt && (
                      <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                        Enter your API key below to enable this integration.
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch
                    checked={zotero.isEnabled}
                    onCheckedChange={handleToggle}
                    disabled={zotero.isSaving || zotero.isDeleting}
                  />
                  {!zotero.lastSyncAt && (
                    <span className="text-xs text-muted-foreground">
                      Requires API key
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status Messages */}
              {zotero.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{zotero.error}</AlertDescription>
                </Alert>
              )}

              {zotero.success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{zotero.success}</AlertDescription>
                </Alert>
              )}

              {/* API Key Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zotero-api-key">Zotero API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="zotero-api-key"
                        type={zotero.showApiKey ? "text" : "password"}
                        value={zotero.apiKey}
                        onChange={(e) => {
                          setZotero(prev => ({ ...prev, apiKey: e.target.value }))
                          clearMessages()
                        }}
                        placeholder={!zotero.lastSyncAt ? "Enter your Zotero API key..." : "Enter new API key to update..."}
                        disabled={zotero.isSaving || zotero.isDeleting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setZotero(prev => ({ ...prev, showApiKey: !prev.showApiKey }))}
                      >
                        {zotero.showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="default"
                      asChild
                    >
                      <a
                        href="https://www.zotero.org/settings/keys/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Get API Key
                      </a>
                    </Button>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>Your API key is encrypted and stored securely. It&apos;s only used to access your Zotero library.</p>
                      <p className="mt-1">
                        To get an API key: visit the link above, give it a descriptive name like &quot;Owsla Integration&quot;, 
                        and ensure &quot;Allow library access&quot; is checked.
                      </p>
                      {zotero.lastSyncAt && (
                        <p className="mt-1 text-amber-600 dark:text-amber-400">
                          Note: Disabling the integration will delete your API key and cached resources.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={zotero.isSaving || zotero.isDeleting || !zotero.apiKey.trim()}
                  >
                    {zotero.isSaving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {!zotero.lastSyncAt ? 'Save & Enable' : 'Update API Key'}
                  </Button>

                  {zotero.lastSyncAt && (
                    <Button
                      variant="outline"
                      onClick={handleSync}
                      disabled={zotero.isSyncing || !zotero.isEnabled}
                    >
                      {zotero.isSyncing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sync Now
                    </Button>
                  )}
                </div>
              </div>

              {/* Sync Status */}
              {zotero.lastSyncAt && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last sync:</span>
                    <span>{formatLastSync(zotero.lastSyncAt)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Future Integrations Placeholder */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground font-bold text-sm">+</span>
                </div>
                More integrations coming soon
              </CardTitle>
              <CardDescription>
                We&apos;re working on integrations with Google Scholar, JSTOR, and other academic databases.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
} 