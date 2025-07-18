"use client"

import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Video } from "lucide-react"
import Link from "next/link"
import React, { useState, useMemo, useEffect } from "react"
import { CurriculumData } from "@/lib/database"
import { useCachedUserCurricula, useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { useUser } from "@stackframe/stack"
import { filterActiveCourses } from "@/lib/utils"
import { OwslaFileDropZone } from "./owsla-file-drop-zone"
import { useCurriculumCache } from "@/lib/curriculum-cache"

interface CurriculaListProps {
  activeCurriculumId?: number
}

interface CurriculumItemProps {
  curriculum: CurriculumData
  isActive: boolean
}

export const CurriculaList = React.memo(function CurriculaList({ activeCurriculumId }: CurriculaListProps) {
  const user = useUser()
  const { curricula, loading, error } = useCachedUserCurricula()
  const { dashboardData } = useCachedDashboardData()
  const curriculumCache = useCurriculumCache()
  const [deleteError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle hydration to prevent SSR/client mismatch
  useEffect(() => {
    console.log('💧 CurriculaList hydrated')
    setIsHydrated(true)
  }, [])

  // Log state changes
  useEffect(() => {
    console.log('📋 CurriculaList state update:', {
      curriculaLength: curricula.length,
      loading,
      error: !!error,
      isHydrated,
      hasDashboardData: !!dashboardData,
      userId: user?.id
    })
  }, [curricula, loading, error, isHydrated, dashboardData, user?.id])

  // Filter out completed curricula for sidebar display using the new completion logic
  const activeCurricula = useMemo(() => {
    console.log('🔍 Filtering active curricula:', {
      curriculaLength: curricula.length,
      hasDashboardData: !!dashboardData,
      isHydrated
    })
    
    if (!dashboardData || !isHydrated) {
      console.log('📝 Using raw curricula (no dashboard data or not hydrated)')
      return curricula
    }
    
    // Create a map of curriculum ID to total module count
    const moduleCounts = new Map<number, number>()
    dashboardData.dailyModules.forEach(module => {
      moduleCounts.set(module.curriculumId, (moduleCounts.get(module.curriculumId) || 0) + 1)
    })

    // Filter to only show active (non-completed) courses
    const filtered = filterActiveCourses(
      curricula, 
      dashboardData.moduleCompletions || [], 
      moduleCounts
    )
    
    console.log('🎯 Filtered active curricula:', {
      originalLength: curricula.length,
      filteredLength: filtered.length,
      moduleCompletionsCount: dashboardData.moduleCompletions?.length || 0
    })
    
    return filtered
  }, [curricula, dashboardData, isHydrated])

  // Handle successful import
  const handleImportSuccess = React.useCallback(() => {
    // Invalidate caches to refresh the curricula list
    if (user?.id) {
      curriculumCache.invalidateUserCurricula(user.id)
      // Dashboard data will be refreshed when user curricula is invalidated
    }
  }, [user?.id, curriculumCache])

  // Show loading state during hydration or actual loading
  if (!isHydrated || loading) {
    console.log('⏳ CurriculaList showing loading state:', { isHydrated, loading })
    return (
      <div className="space-y-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              Loading curricula...
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Drop zone always visible */}
        <div className="px-3">
          <OwslaFileDropZone onImportSuccess={handleImportSuccess} />
        </div>
      </div>
    )
  }

  if (error || deleteError) {
    console.log('❌ CurriculaList showing error state:', { error, deleteError })
    return (
      <div className="space-y-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-500">
              Error: {error || deleteError}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Drop zone always visible */}
        <div className="px-3">
          <OwslaFileDropZone onImportSuccess={handleImportSuccess} />
        </div>
      </div>
    )
  }

  if (activeCurricula.length === 0) {
    console.log('🚫 CurriculaList showing no curricula state')
    return (
      <div className="space-y-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-2 px-3 py-2">
              <div className="text-sm text-muted-foreground">
                No active curricula
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
        
        {/* Drop zone always visible */}
        <div className="px-3">
          <OwslaFileDropZone onImportSuccess={handleImportSuccess} />
        </div>
      </div>
    )
  }

  console.log('✅ CurriculaList rendering curricula:', activeCurricula.length)
  
  return (
    <div className="space-y-4">
      <SidebarMenu>
        {activeCurricula.map((curriculum) => (
          <CurriculumItem 
            key={curriculum.id}
            curriculum={curriculum}
            isActive={activeCurriculumId === curriculum.id}
          />
        ))}
      </SidebarMenu>
      
      {/* Drop zone always visible */}
      <div className="px-3">
        <OwslaFileDropZone onImportSuccess={handleImportSuccess} />
      </div>
    </div>
  )
})

const CurriculumItem = React.memo(function CurriculumItem({ 
  curriculum, 
  isActive, 
}: CurriculumItemProps) {
  // Enhanced video detection: check both curriculum_type and presence of video data
  const hasVideoData = !!(
    curriculum.primary_video_url || 
    curriculum.primary_video_id || 
    curriculum.full_curriculum_data?.primary_video?.url || 
    curriculum.full_curriculum_data?.primary_video?.video_id
  )
  
  const isVideoCurriculum = curriculum.curriculum_type === 'video' || hasVideoData
  
  // Determine the correct link path and icon based on enhanced detection
  const curriculumPath = isVideoCurriculum
    ? `/video-curriculum/${curriculum.id}` 
    : `/curriculum/${curriculum.id}`
  
  const IconComponent = isVideoCurriculum ? Video : BookOpen

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