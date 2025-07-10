"use client"

import { useRouter } from "next/navigation"
import { Suspense, lazy, useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { CourseData } from "@/types/course-editor"

// Lazy load the course editor component for better performance
const CourseEditor = lazy(() => 
  import("@/components/course-editor").then(module => ({ 
    default: module.CourseEditor 
  }))
)

// Loading skeleton for the course editor
function CourseEditorSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <div className="max-w-7xl mx-auto">
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
      </div>

      {/* Main editor skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Resource Library Skeleton */}
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-6 w-32" />
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

          {/* Course Editor Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            {/* Course Metadata */}
            <div className="p-4 border rounded-lg space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>

            {/* Daily Modules */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
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
    </div>
  )
}

export default function CourseEditorPage() {
  const router = useRouter()
  const [initialCourse, setInitialCourse] = useState<CourseData | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

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

  const handleSave = () => {
    // Handle course save
    router.push("/")
  }

  const handleExport = () => {
    // Handle Topsters-style export
    console.log("Exporting course pack...")
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-hidden">
          <CourseEditorSkeleton />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<CourseEditorSkeleton />}>
          <CourseEditor 
            onCancel={handleCancel} 
            onSave={handleSave}
            onExport={handleExport}
            initialCourse={initialCourse}
          />
        </Suspense>
      </div>
    </AppLayout>
  )
} 