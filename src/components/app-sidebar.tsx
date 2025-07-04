"use client"

import { Settings, LogOut, User, BookOpen, LayoutDashboard, Users, Moon, Sun, Monitor } from "lucide-react"
import { useUser } from "@stackframe/stack"
import { useTheme } from "next-themes"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CurriculaList } from "./curricula-list"
import { JobQueue } from "./job-queue"
import { useRouter } from "next/navigation"

interface AppSidebarProps {
  activeCurriculumId?: number
}

export function AppSidebar({ activeCurriculumId }: AppSidebarProps) {
  const user = useUser()
  const { setTheme } = useTheme()
  const router = useRouter()

  return (
    <Sidebar className="w-64">
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold"><button type="button" onClick={() => router.push("/")}>Owsla</button></h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => router.push("/")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="text-sm">Dashboard</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => router.push("/library")}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm">Library</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => router.push("/experts")}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Experts</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your Curricula</SidebarGroupLabel>
          <SidebarGroupContent>
            <CurriculaList 
              activeCurriculumId={activeCurriculumId}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Job Queue</SidebarGroupLabel>
            <SidebarGroupContent>
              <JobQueue userId={user.id} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>
      
      <SidebarFooter className="p-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="w-full justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl || ""} alt={user.displayName || ""} />
                  <AvatarFallback>
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.primaryEmail?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">
                    {user.displayName || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.primaryEmail}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={() => router.push("/handler/account-settings")}
                  className="flex items-center w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>System</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => user.signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton asChild>
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => router.push("/sign-in")}
            >
              <User className="h-4 w-4" />
              <span className="text-sm">Sign In</span>
            </button>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
