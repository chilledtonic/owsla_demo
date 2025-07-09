"use client"

import { useUser } from "@stackframe/stack"
import { useState } from "react"
import { useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { AppLayout } from "@/components/app-layout"
import { BookCarousel } from "@/components/ui/book-carousel"
import { ResourcesTable } from "@/components/ui/resources-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { BookOpen, FileText, ExternalLink, RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function LibraryPage() {
  useUser({ or: "redirect" })
  const { dashboardData, loading, error, refresh } = useCachedDashboardData()
  const [deduplicatedBookCount, setDeduplicatedBookCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState("")
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading library...</p>
          </div>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  if (!dashboardData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Learning Library</h1>
            <p className="text-muted-foreground">No resources available</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const totalResources = deduplicatedBookCount + dashboardData.otherResources.length

  // Filter resources based on search query
  const filteredOtherResources = dashboardData.otherResources.filter(resource =>
    searchQuery === "" || 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isMobile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          {/* Mobile Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Library</h1>
                <p className="text-sm text-muted-foreground">
                  {totalResources} resources
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-primary" />
                  <span>{deduplicatedBookCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-blue-600" />
                  <span>{dashboardData.otherResources.length}</span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Books Section */}
          {dashboardData.bookResources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Required Books</h2>
                <Badge variant="secondary" className="text-xs">
                  {deduplicatedBookCount}
                </Badge>
              </div>
              <BookCarousel 
                books={dashboardData.bookResources} 
                onDeduplicatedCountChange={setDeduplicatedBookCount}
              />
            </div>
          )}

          {/* Papers Section */}
          {filteredOtherResources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Academic Papers</h2>
                <Badge variant="secondary" className="text-xs">
                  {filteredOtherResources.length}
                </Badge>
              </div>
              
                             {/* Mobile-optimized paper list */}
               <div className="space-y-2">
                 {filteredOtherResources.map((resource, index) => (
                   <div key={index} className="p-3 rounded-lg border bg-background">
                     <div className="space-y-2">
                       <h3 className="font-medium text-sm leading-tight line-clamp-2">
                         {resource.title}
                       </h3>
                       <div className="flex flex-wrap gap-1">
                         <Badge variant="outline" className="text-xs">
                           {resource.author}
                         </Badge>
                         <Badge variant="outline" className="text-xs">
                           {resource.journal}
                         </Badge>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-xs text-muted-foreground">
                           {resource.year} • Day {resource.day}
                         </span>
                         {resource.doi && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               const link = `https://doi.org/${resource.doi}`
                               window.open(link, '_blank', 'noopener,noreferrer')
                             }}
                             className="h-6 px-2 text-xs"
                           >
                             <ExternalLink className="h-3 w-3 mr-1" />
                             View
                           </Button>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Empty State */}
          {totalResources === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Resources Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your learning resources will appear here as you create curricula.
              </p>
            </div>
          )}

          {/* No Search Results */}
          {totalResources > 0 && searchQuery && filteredOtherResources.length === 0 && dashboardData.bookResources.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    )
  }

  // Desktop layout
  return (
    <AppLayout>
      <div className="flex-1">
        {/* Desktop Header */}
        <div className="border-b p-6">
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
                <span className="font-medium">{dashboardData.otherResources.length}</span>
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
        <div className="p-6 space-y-6">
          {/* Required Books Section */}
          {dashboardData.bookResources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Required Books</h2>
                <span className="text-sm text-muted-foreground">({deduplicatedBookCount})</span>
              </div>
              
              <BookCarousel 
                books={dashboardData.bookResources} 
                onDeduplicatedCountChange={setDeduplicatedBookCount}
              />
            </div>
          )}

          {/* Academic Papers Section */}
          {dashboardData.otherResources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Academic Papers & Resources</h2>
                <span className="text-sm text-muted-foreground">({dashboardData.otherResources.length})</span>
              </div>
              
              <ResourcesTable resources={dashboardData.otherResources} />
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