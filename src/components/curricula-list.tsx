"use client"

import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Video } from "lucide-react"
import Link from "next/link"
import React, { useState } from "react"
import { CurriculumData } from "@/lib/database"
import { useCachedUserCurricula } from "@/hooks/use-curriculum-data"
import { useUser } from "@stackframe/stack"

interface CurriculaListProps {
  activeCurriculumId?: number
}

interface CurriculumItemProps {
  curriculum: CurriculumData
  isActive: boolean
}

export const CurriculaList = React.memo(function CurriculaList({ activeCurriculumId }: CurriculaListProps) {
  useUser()
  const { curricula, loading, error } = useCachedUserCurricula()
  const [deleteError] = useState<string | null>(null)

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
        />
      ))}
    </SidebarMenu>
  )
})

const CurriculumItem = React.memo(function CurriculumItem({ 
  curriculum, 
  isActive, 
}: CurriculumItemProps) {
  // Determine the correct link path and icon based on curriculum type
  const curriculumPath = curriculum.curriculum_type === 'video' 
    ? `/video-curriculum/${curriculum.id}` 
    : `/curriculum/${curriculum.id}`
  
  const IconComponent = curriculum.curriculum_type === 'video' ? Video : BookOpen

  return (
    <SidebarMenuItem>
      <div className="flex items-center w-full">
        <SidebarMenuButton 
          isActive={isActive}
          className="flex-1"
          asChild
        >
          <Link href={curriculumPath} prefetch={true}>
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
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
      </div>
    </SidebarMenuItem>
  )
}) 