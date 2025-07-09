"use client"

import { BookOpen, Plus, Trash2 } from "lucide-react"
import { useUser } from "@stackframe/stack"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import React from "react"
import { deleteCurriculum } from "@/lib/actions"
import { useCachedUserCurricula } from "@/hooks/use-curriculum-data"
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

export const CurriculaList = React.memo(function CurriculaList({ activeCurriculumId }: CurriculaListProps) {
  useUser()
  const router = useRouter()
  const { curricula, loading, error, invalidate } = useCachedUserCurricula()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteCurriculum = useCallback(async (curriculumId: number) => {
    try {
      const result = await deleteCurriculum(curriculumId)
      if (result.success) {
        // Invalidate the cache to refresh the curricula list
        invalidate()
        
        // If the deleted curriculum was active, redirect to homepage
        if (activeCurriculumId === curriculumId) {
          router.push('/')
        }
      } else {
        setDeleteError(result.error || 'Failed to delete curriculum')
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error)
      setDeleteError('Failed to delete curriculum')
    }
  }, [invalidate, activeCurriculumId, router])



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

  if (error || deleteError) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-500">
            Error: {error || deleteError}
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
              asChild
            >
              <Link href="/new-curriculum">
                <Plus className="h-4 w-4 mr-2" />
                Create Curriculum
              </Link>
            </Button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {curricula.map((curriculum) => (
        <CurriculumItem 
          key={curriculum.id}
          curriculum={curriculum}
          isActive={activeCurriculumId === curriculum.id}
          onDelete={handleDeleteCurriculum}
        />
      ))}
      
      <SidebarMenuItem>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          asChild
        >
          <Link href="/new-curriculum">
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Link>
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  )
})

interface CurriculumItemProps {
  curriculum: { id: number; title: string; topic: string }
  isActive: boolean
  onDelete: (id: number) => void
}

const CurriculumItem = React.memo(function CurriculumItem({ 
  curriculum, 
  isActive, 
  onDelete 
}: CurriculumItemProps) {
  const handleDelete = useCallback(() => {
    onDelete(curriculum.id)
  }, [onDelete, curriculum.id])

  return (
    <SidebarMenuItem>
      <div className="flex items-center w-full">
        <SidebarMenuButton 
          isActive={isActive}
          className="flex-1"
          asChild
        >
          <Link href={`/curriculum/${curriculum.id}`} prefetch={true}>
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
          </Link>
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
                Are you sure you want to delete &quot;{curriculum.title}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarMenuItem>
  )
}) 