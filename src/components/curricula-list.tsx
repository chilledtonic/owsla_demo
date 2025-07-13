"use client"

import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Video } from "lucide-react"
import Link from "next/link"
import React, { useState, useMemo, useEffect } from "react"
import { CurriculumData } from "@/lib/database"
import { useCachedUserCurricula, useCachedDashboardData } from "@/hooks/use-curriculum-data"
import { useUser } from "@stackframe/stack"
import { calculateCurrentCurriculumDay } from "@/lib/utils"
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
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)

  // Load completed modules from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("module-completion")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setCompletedModules(new Set(parsed))
        } catch {}
      }
      setIsHydrated(true)
    }
  }, [])

  // Filter out completed curricula for sidebar display
  const activeCurricula = useMemo(() => {
    if (!dashboardData || !isHydrated) return curricula
    
    return curricula.filter(curriculum => {
      const curriculumModules = dashboardData.dailyModules.filter(m => m.curriculumId === curriculum.id)
      const { currentDay } = calculateCurrentCurriculumDay(curriculumModules)
      const totalDays = curriculumModules.length
      
      // Calculate date-based progress percentage
      const dateProgressPercentage = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0
      
      // Calculate manual completion progress percentage
      const manuallyCompletedModules = curriculumModules.filter(module => 
        completedModules.has(`${module.curriculumId}-${module.day}`)
      )
      const manualProgressPercentage = totalDays > 0 ? Math.round((manuallyCompletedModules.length / totalDays) * 100) : 0
      
      // Course is NOT completed if NONE of these are true:
      // 1. Date-based progress is 100% (past end date)
      // 2. Manual completion is 100% (all modules marked complete)
      // 3. Manual completion is 80%+ (mostly complete)
      return !(dateProgressPercentage >= 100 || manualProgressPercentage >= 100 || manualProgressPercentage >= 80)
    })
  }, [curricula, dashboardData, completedModules, isHydrated])

  // Handle successful import
  const handleImportSuccess = React.useCallback(() => {
    // Invalidate caches to refresh the curricula list
    if (user?.id) {
      curriculumCache.invalidateUserCurricula(user.id)
      // Dashboard data will be refreshed when user curricula is invalidated
    }
  }, [user?.id, curriculumCache])

  if (loading) {
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