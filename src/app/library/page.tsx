"use client"

import { useUser } from "@stackframe/stack"
import { useEffect, useState } from "react"
import { fetchDashboardData, BookResource, OtherResource } from "@/lib/actions"
import { AppLayout } from "@/components/app-layout"
import { BookCarousel } from "@/components/ui/book-carousel"
import { ResourcesTable } from "@/components/ui/resources-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText } from "lucide-react"

interface LibraryData {
  bookResources: BookResource[]
  otherResources: OtherResource[]
}

export default function LibraryPage() {
  const user = useUser({ or: "redirect" })
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        <div className="h-full p-4">
          <div className="space-y-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-2">Loading your library...</h1>
              <p className="text-muted-foreground">Gathering your learning resources</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="h-full p-4">
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Error loading library: {error}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!libraryData) {
    return (
      <AppLayout>
        <div className="h-full p-4">
          <div className="space-y-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-2">Learning Library</h1>
              <p className="text-muted-foreground">No resources available</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const totalResources = libraryData.bookResources.length + libraryData.otherResources.length

  return (
    <AppLayout>
      <div className="h-full p-4 overflow-x-hidden">
        <div className="space-y-6 min-w-0">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Learning Library</h1>
            <p className="text-sm text-muted-foreground">
              All your required books and academic resources in one place
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">Required Books</p>
                    <p className="text-lg font-bold">{libraryData.bookResources.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium">Academic Papers</p>
                    <p className="text-lg font-bold">{libraryData.otherResources.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs font-medium">Total Resources</p>
                    <p className="text-lg font-bold">{totalResources}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resources Section */}
          <div className="space-y-6 min-w-0">
            {/* Books Carousel - Primary focus */}
            <BookCarousel books={libraryData.bookResources} />

            {/* Other Resources Table */}
            <ResourcesTable resources={libraryData.otherResources} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 