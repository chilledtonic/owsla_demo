"use client"

import { Settings, LogOut, User } from "lucide-react"
import { useUser } from "@stackframe/stack"
import { CurriculumData } from "@/lib/database"
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
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CurriculaList } from "./curricula-list"
import { JobQueue } from "./job-queue"

interface AppSidebarProps {
  activeCurriculumId?: number
}

export function AppSidebar({ activeCurriculumId }: AppSidebarProps) {
  const user = useUser()

  return (
    <Sidebar className="w-64">
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">Owsla</h2>
      </SidebarHeader>
      <SidebarContent>
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

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Preferences</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/handler/account-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => user.signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton asChild>
            <a href="/sign-in" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">Sign In</span>
            </a>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
