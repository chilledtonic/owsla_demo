"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useUser } from "@stackframe/stack"
import { Separator } from "@/components/ui/separator"

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
        <SidebarInset className="flex-1 overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1">
              {/* Header content can be customized per page */}
            </div>
          </header>
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              <div className={`flex-1 overflow-auto ${rightSidebar ? 'border-r' : ''}`}>
                {children}
              </div>
              {rightSidebar && (
                <div className="w-80 overflow-auto bg-muted/20 border-l">
                  {rightSidebar}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 