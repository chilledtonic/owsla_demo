"use client"

import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { NewCurriculumForm } from "@/components/new-curriculum-form"

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
      <div className="h-full overflow-auto">
        <NewCurriculumForm onCancel={handleCancel} onSuccess={handleSuccess} />
      </div>
    </AppLayout>
  )
} 