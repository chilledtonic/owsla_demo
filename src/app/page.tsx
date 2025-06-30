"use client"

import { useUser } from "@stackframe/stack"
import { fetchLatestCurriculum } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Dashboard() {
  const user = useUser({ or: "redirect" })
  const router = useRouter()

  // Redirect to latest curriculum or dashboard when user is available
  useEffect(() => {
    async function redirectBasedOnCurricula() {
      if (!user?.id) return

      try {
        const result = await fetchLatestCurriculum(user.id)
        if (result.success && result.data) {
          router.push(`/curriculum/${result.data.id}`)
        } else {
          // No curricula found, redirect to dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error loading latest curriculum:', error)
        // On error, redirect to dashboard as fallback
        router.push('/dashboard')
      }
    }

    redirectBasedOnCurricula()
  }, [user?.id, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        <p className="text-muted-foreground">Redirecting to your curriculum dashboard</p>
      </div>
    </div>
  )
}
