'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error)
    
    // Check if this is a chunk loading error
    if (error.message && error.message.includes('Loading chunk')) {
      // Attempt to recover by clearing module cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('webpack') || name.includes('next')) {
              caches.delete(name)
            }
          })
        })
      }
    }
  }, [error])

  const isChunkError = error.message && (
    error.message.includes('Loading chunk') ||
    error.message.includes('ChunkLoadError')
  )

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold">
          {isChunkError ? 'Update Required' : 'Something went wrong'}
        </h2>
        <p className="text-muted-foreground">
          {isChunkError 
            ? 'A new version of the app is available. Please refresh the page to get the latest updates.'
            : 'An unexpected error occurred. We apologize for the inconvenience.'
          }
        </p>
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => {
              if (isChunkError) {
                // Force a hard reload to get fresh chunks
                window.location.reload()
              } else {
                // Try to recover by resetting
                reset()
              }
            }}
          >
            {isChunkError ? 'Refresh Page' : 'Try Again'}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mt-4 p-4 bg-muted rounded text-sm">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
} 