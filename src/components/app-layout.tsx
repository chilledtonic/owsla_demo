"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useUser } from "@stackframe/stack"

interface AppLayoutProps {
  children: React.ReactNode
  activeCurriculumId?: number
  rightSidebar?: React.ReactNode
}

export function AppLayout({ children, activeCurriculumId, rightSidebar }: AppLayoutProps) {
  const user = useUser({ or: "redirect" })

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          activeCurriculumId={activeCurriculumId}
        />
        <SidebarInset className="flex-1">
          {children}
        </SidebarInset>
        {rightSidebar}
      </div>
    </SidebarProvider>
  )
} 