"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useUser } from "@stackframe/stack"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { Home, BookOpen, Users, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
  activeCurriculumId?: number
  rightSidebar?: React.ReactNode
}

export function AppLayout({ children, activeCurriculumId, rightSidebar }: AppLayoutProps) {
  const user = useUser({ or: "redirect" })
  const isMobile = useIsMobile()
  const pathname = usePathname()

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const mobileNavItems = [
    { href: "/", icon: Home, label: "Home", isActive: pathname === "/" },
    { href: "/library", icon: BookOpen, label: "Library", isActive: pathname === "/library" },
    { href: "/experts", icon: Users, label: "Experts", isActive: pathname === "/experts" },
    { href: "/new-curriculum", icon: Plus, label: "New", isActive: pathname === "/new-curriculum" },
  ]

  if (isMobile) {
    return (
      <SidebarProvider>
        <AppSidebar activeCurriculumId={activeCurriculumId} />
        <SidebarInset className="flex flex-col min-h-screen w-full">
          {/* Mobile Header */}
          <header className="flex h-14 items-center justify-between px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger className="h-9 w-9 p-0" />
            
            <div className="font-semibold text-lg">
              {pathname === "/" && "Dashboard"}
              {pathname === "/library" && "Library"}
              {pathname === "/experts" && "Experts"}
              {pathname === "/new-curriculum" && "New Curriculum"}
              {pathname.startsWith("/curriculum/") && "Curriculum"}
              {pathname === "/dashboard" && "Overview"}
            </div>
            
            <div className="w-9"> {/* Spacer for balance */}</div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto pb-16"> {/* Bottom padding for mobile nav */}
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
            <div className="flex items-center justify-around h-16 px-2">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center space-y-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    item.isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Desktop layout (existing functionality)
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