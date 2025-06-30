"use client"

import { BookOpen, Plus } from "lucide-react"
import { useUser } from "@stackframe/stack"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchUserCurricula } from "@/lib/actions"
import { CurriculumData } from "@/lib/database"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

interface CurriculaListProps {
  activeCurriculumId?: number
}

export function CurriculaList({ activeCurriculumId }: CurriculaListProps) {
  const user = useUser()
  const router = useRouter()
  const [curricula, setCurricula] = useState<CurriculumData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCurricula() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const result = await fetchUserCurricula(user.id)
        if (result.success && result.data) {
          setCurricula(result.data)
        } else {
          setError(result.error || 'Unknown error occurred')
        }
      } catch (err) {
        setError('Failed to load curricula')
        console.error('Error loading curricula:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCurricula()
  }, [user?.id])

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            Loading curricula...
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (error) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-500">
            Error: {error}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (curricula.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex flex-col gap-2 px-3 py-2">
            <div className="text-sm text-muted-foreground">
              No curricula found
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => router.push("/new-curriculum")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Curriculum
            </Button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {curricula.map((curriculum) => (
        <SidebarMenuItem key={curriculum.id}>
          <SidebarMenuButton 
            isActive={activeCurriculumId === curriculum.id}
            onClick={() => router.push(`/curriculum/${curriculum.id}`)}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium truncate">
                  {curriculum.title}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {curriculum.topic}
                </span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      
      <SidebarMenuItem>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => router.push("/new-curriculum")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  )
} 