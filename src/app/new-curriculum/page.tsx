"use client"

import { useRouter } from "next/navigation"
import { Suspense, lazy } from "react"
import { AppLayout } from "@/components/app-layout"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load the form component for better performance
const NewCurriculumForm = lazy(() => 
  import("@/components/new-curriculum-form").then(module => ({ 
    default: module.NewCurriculumForm 
  }))
)

// Loading skeleton for the form
function FormSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-11 w-full" />
        </div>
      </div>

      {/* Form skeleton */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="space-y-6">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        
        {/* Sliders skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-10 w-16 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-6 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-32 mx-auto" />
            </div>
          ))}
        </div>

        <Skeleton className="h-32 w-full" />
        
        <div className="flex justify-between pt-8 border-t">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewCurriculumPage() {
  const router = useRouter()

  const handleCancel = () => {
    router.push("/")
  }

  const handleSuccess = () => {
    // For now redirect to home, but ideally we'd get the curriculum ID from the submission
    // and redirect to /curriculum/[id] once the generation is complete
    router.push("/")
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<FormSkeleton />}>
          <NewCurriculumForm onCancel={handleCancel} onSuccess={handleSuccess} />
        </Suspense>
      </div>
    </AppLayout>
  )
} 