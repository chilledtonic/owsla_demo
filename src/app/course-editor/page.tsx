"use client"

import { useRouter } from "next/navigation"
import { Suspense, lazy, useEffect, useState } from "react"
import { useUser } from "@stackframe/stack"
import { AppLayout } from "@/components/app-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { CourseData } from "@/types/course-editor"
import { saveCurriculum } from "@/lib/actions"
import { toast } from "sonner"
import { useCurriculumCache } from "@/lib/curriculum-cache"

// Lazy load the course editor component for better performance
const CourseEditor = lazy(() => 
  import("@/components/course-editor").then(module => ({ 
    default: module.CourseEditor 
  }))
)

// Loading skeleton for the course editor
function CourseEditorSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="border-b px-6">
          <div className="h-12 flex items-center gap-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>

        {/* Main editor skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {/* Course Metadata */}
            <div className="p-4 border rounded-lg space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>

            {/* Daily Modules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-20" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Skeleton */}
      <div className="w-80 border-l bg-background/50 flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-8 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CourseEditorPage() {
  const router = useRouter()
  const user = useUser()
  const curriculumCache = useCurriculumCache()
  const [initialCourse, setInitialCourse] = useState<CourseData | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Check for course data from curriculum editor
    const editCourseData = sessionStorage.getItem('editCourseData')
    if (editCourseData) {
      try {
        const courseData = JSON.parse(editCourseData) as CourseData
        setInitialCourse(courseData)
        // Clear the session storage data after loading
        sessionStorage.removeItem('editCourseData')
      } catch (error) {
        console.error('Failed to parse course data from session storage:', error)
      }
    }
    setIsLoading(false)
  }, [])

  const handleCancel = () => {
    router.push("/")
  }

  const handleSave = async (courseData: CourseData) => {
    if (!user?.id) {
      toast.error("You must be signed in to save courses")
      return
    }

    setIsSaving(true)
    try {
      const result = await saveCurriculum(courseData, user.id)
      
      if (result.success) {
        // IMPORTANT: Use targeted cache invalidation to avoid blanking components
        console.log('Invalidating curriculum caches after successful save')
        
        // 1. Invalidate client-side curriculum cache strategically
        if (courseData.id) {
          // For updates, invalidate the specific curriculum 
          curriculumCache.invalidateCurriculum(parseInt(courseData.id))
          // Also mark user curricula as stale to show updated data
          curriculumCache.invalidateUserCurricula(user.id)
        } else {
          // For new curricula, only invalidate user curricula to show the new item
          curriculumCache.invalidateUserCurricula(user.id)
        }
        
        // 2. Tell service worker to clear curriculum caches
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_INVALIDATE',
            cacheKey: 'user-curricula',
            userId: user.id
          })
          console.log('Invalidated service worker caches after course save')
        }
        
        toast.success(courseData.id ? "Course updated successfully!" : "Course saved successfully!")
        
        // Navigate without cache busting timestamp since caches are cleared
        if (result.data?.id) {
          router.push(`/curriculum/${result.data.id}`)
        } else {
          router.push("/")
        }
      } else {
        toast.error(result.error || "Failed to save course")
      }
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error("An unexpected error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    // Handle Topsters-style export
    console.log("Exporting course pack...")
  }

  if (isLoading) {
    return (
      <AppLayout>
        <CourseEditorSkeleton />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Suspense fallback={<CourseEditorSkeleton />}>
        <CourseEditor 
          onCancel={handleCancel} 
          onSave={handleSave}
          onExport={handleExport}
          initialCourse={initialCourse}
          isSaving={isSaving}
        />
      </Suspense>
    </AppLayout>
  )
} 