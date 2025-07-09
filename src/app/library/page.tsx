"use client"

import { useUser } from "@stackframe/stack"
import { useEffect, useState } from "react"
import { fetchDashboardData, BookResource, OtherResource } from "@/lib/actions"
import { AppLayout } from "@/components/app-layout"
import { BookCarousel } from "@/components/ui/book-carousel"
import { ResourcesTable } from "@/components/ui/resources-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, FileText, ExternalLink } from "lucide-react"

interface LibraryData {
  bookResources: BookResource[]
  otherResources: OtherResource[]
}

export default function LibraryPage() {
  const user = useUser({ or: "redirect" })
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deduplicatedBookCount, setDeduplicatedBookCount] = useState<number>(0)

  useEffect(() => {
    async function loadLibraryData() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const result = await fetchDashboardData(user.id)
        if (result.success && result.data) {
          setLibraryData({
            bookResources: result.data.bookResources,
            otherResources: result.data.otherResources
          })
        } else {
          setError(result.error || 'Failed to load library data')
        }
      } catch (err) {
        setError('Failed to load library data')
        console.error('Error loading library data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLibraryData()
  }, [user?.id])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4">
          <Alert>
            <AlertDescription>
              Error loading library: {error}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  if (!libraryData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">Learning Library</h1>
            <p className="text-muted-foreground">No resources available</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const totalResources = deduplicatedBookCount + libraryData.otherResources.length

  return (
    <AppLayout>
      <div className="flex-1">
        {/* Mobile Header - Only visible on mobile */}
        <div className="lg:hidden border-b bg-background p-4">
          <h1 className="text-lg font-bold mb-1">Learning Library</h1>
          <p className="text-sm text-muted-foreground mb-3">
            All your required books and academic resources
          </p>
          
          <div className="flex justify-between text-sm">
            <div className="text-center">
              <div className="font-medium">{deduplicatedBookCount}</div>
              <div className="text-muted-foreground text-xs">Books</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{libraryData.otherResources.length}</div>
              <div className="text-muted-foreground text-xs">Papers</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{totalResources}</div>
              <div className="text-muted-foreground text-xs">Total</div>
            </div>
          </div>
        </div>

        {/* Desktop Header - Only visible on desktop */}
        <div className="hidden lg:block p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Learning Library</h1>
              <p className="text-sm text-muted-foreground mt-1">
                All your required books and academic resources in one place
              </p>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{deduplicatedBookCount}</span>
                <span className="text-muted-foreground">Books</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{libraryData.otherResources.length}</span>
                <span className="text-muted-foreground">Papers</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-green-600" />
                <span className="font-medium">{totalResources}</span>
                <span className="text-muted-foreground">Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 lg:p-6 space-y-6">
          {/* Required Books Section */}
          {libraryData.bookResources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg lg:text-xl font-semibold">Required Books</h2>
                <span className="text-sm text-muted-foreground">({deduplicatedBookCount})</span>
              </div>
              
              <BookCarousel 
                books={libraryData.bookResources} 
                onDeduplicatedCountChange={setDeduplicatedBookCount}
              />
            </div>
          )}

          {/* Academic Papers Section */}
          {libraryData.otherResources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg lg:text-xl font-semibold">Academic Papers & Resources</h2>
                <span className="text-sm text-muted-foreground">({libraryData.otherResources.length})</span>
              </div>
              
              <ResourcesTable resources={libraryData.otherResources} />
            </div>
          )}

          {/* Empty State */}
          {totalResources === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Resources Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Your learning resources will appear here as you create and progress through curricula.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
} 