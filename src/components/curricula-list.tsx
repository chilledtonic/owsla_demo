"use client"

import { BookOpen, Plus, Trash2 } from "lucide-react"
import { useUser } from "@stackframe/stack"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchUserCurricula, deleteCurriculum } from "@/lib/actions"
import { CurriculumData } from "@/lib/database"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CurriculaListProps {
  activeCurriculumId?: number
}

export function CurriculaList({ activeCurriculumId }: CurriculaListProps) {
  const user = useUser()
  const router = useRouter()
  const [curricula, setCurricula] = useState<CurriculumData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function handleDeleteCurriculum(curriculumId: number) {
    try {
      const result = await deleteCurriculum(curriculumId)
      if (result.success) {
        // Remove the deleted curriculum from the local state
        setCurricula(prev => prev.filter(c => c.id !== curriculumId))
        
        // If the deleted curriculum was active, redirect to homepage
        if (activeCurriculumId === curriculumId) {
          router.push('/')
        }
      } else {
        setError(result.error || 'Failed to delete curriculum')
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error)
      setError('Failed to delete curriculum')
    }
  }

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
          <div className="flex items-center w-full">
            <SidebarMenuButton 
              isActive={activeCurriculumId === curriculum.id}
              onClick={() => router.push(`/curriculum/${curriculum.id}`)}
              className="flex-1"
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
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 ml-1 text-muted-foreground hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Curriculum</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{curriculum.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDeleteCurriculum(curriculum.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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