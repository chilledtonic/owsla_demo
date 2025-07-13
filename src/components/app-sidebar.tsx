"use client"

import { Settings, LogOut, User, BookOpen, LayoutDashboard, Users, Moon, Sun, Monitor, Plus, Edit, Plug, Archive } from "lucide-react"
import { useUser } from "@stackframe/stack"
import { useTheme } from "next-themes"
import Link from "next/link"
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
  useSidebar,
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
import { usePathname } from "next/navigation"
import Image from "next/image"
import logoImage from "@/images/logo.png"
import { useIsMobile } from "@/hooks/use-mobile"

interface AppSidebarProps {
  activeCurriculumId?: number
}

export function AppSidebar({ activeCurriculumId }: AppSidebarProps) {
  const user = useUser()
  const { setTheme } = useTheme()
  const pathname = usePathname()
  const { state } = useSidebar()
  const isMobile = useIsMobile()

  const navigation = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
      isActive: pathname === "/"
    },
    {
      title: "Course Editor",
      icon: Edit,
      href: "/course-editor",
      isActive: pathname === "/course-editor"
    },
    {
      title: "Library", 
      icon: BookOpen,
      href: "/library",
      isActive: pathname === "/library"
    },
    {
      title: "Experts",
      icon: Users, 
      href: "/experts",
      isActive: pathname === "/experts"
    },
    {
      title: "Archive",
      icon: Archive,
      href: "/archive",
      isActive: pathname === "/archive"
    }
  ]

  // Mobile-specific sidebar content
  if (isMobile) {
    return (
      <Sidebar collapsible="offcanvas" className="border-r">
        <SidebarHeader className="border-b p-6">
          <div className="flex items-center gap-3">
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Image 
                src={logoImage} 
                alt="Owsla Logo" 
                width={28} 
                height={28}
                className="size-7"
              />
            </div>
            <div className="grid flex-1 text-left">
              <span className="font-semibold text-lg">Owsla</span>
              <span className="text-sm text-muted-foreground">Learn Anything at Lightspeed</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4">
          {/* User Profile Section */}
          {user && (
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={user.profileImageUrl || ""} 
                      alt={user.displayName || ""} 
                    />
                    <AvatarFallback>
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.primaryEmail?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left">
                    <span className="font-medium">
                      {user.displayName || "User"}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {user.primaryEmail}
                    </span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Settings Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/settings/integrations">
                      <Plug className="size-4" />
                      <span>Integrations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/handler/account-settings">
                      <Settings className="size-4" />
                      <span>Account Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Theme Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Theme</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setTheme("light")}>
                    <Sun className="size-4" />
                    <span>Light</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setTheme("dark")}>
                    <Moon className="size-4" />
                    <span>Dark</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setTheme("system")}>
                    <Monitor className="size-4" />
                    <span>System</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="border-t p-4">
          {user && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => user.signOut()}
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      </Sidebar>
    )
  }

  // Desktop sidebar (existing functionality)
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              asChild
            >
              <Link href="/" prefetch={true}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-primary-foreground">
                  <Image 
                    src={logoImage} 
                    alt="Owsla Logo" 
                    width={24} 
                    height={24}
                    className="size-6"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Owsla</span>
                  <span className="truncate text-xs">Learn Anything at Lightspeed</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    isActive={item.isActive}
                    tooltip={item.title}
                    asChild
                  >
                    <Link href={item.href} prefetch={true}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Curricula</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Create New Curriculum"
                  asChild
                >
                  <Link href="/new-curriculum" prefetch={true}>
                    <Plus className="size-4" />
                    <span>New Curriculum</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {state !== "collapsed" && (
              <CurriculaList 
                activeCurriculumId={activeCurriculumId}
              />
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Status</SidebarGroupLabel>
            <SidebarGroupContent>
              <JobQueue userId={user.id} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>
      
      <SidebarFooter className="border-t">
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage 
                        src={user.profileImageUrl || ""} 
                        alt={user.displayName || ""} 
                      />
                      <AvatarFallback className="rounded-lg">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.primaryEmail?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.displayName || "User"}
                      </span>
                      <span className="truncate text-xs">
                        {user.primaryEmail}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={state === "collapsed" ? "right" : "bottom"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage 
                          src={user.profileImageUrl || ""} 
                          alt={user.displayName || ""} 
                        />
                        <AvatarFallback className="rounded-lg">
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.primaryEmail?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user.displayName || "User"}
                        </span>
                        <span className="truncate text-xs">
                          {user.primaryEmail}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings/integrations">
                      <Plug className="mr-2 h-4 w-4" />
                      Integrations
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/handler/account-settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Monitor className="mr-2 h-4 w-4" />
                      Theme
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                          <Sun className="mr-2 h-4 w-4" />
                          Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                          <Moon className="mr-2 h-4 w-4" />
                          Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                          <Monitor className="mr-2 h-4 w-4" />
                          System
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => user.signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Sign In"
                asChild
              >
                <Link href="/sign-in">
                  <User className="size-4" />
                  <span>Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
