"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Loader, LogOut, Settings, User, HelpCircle } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroupContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SidebarLogo from "./sidebar-logo";
import LogoutDialog from "./logout-dialog";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { Separator } from "../ui/separator";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/useAuthContext";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { useLoadingContext } from "@/components/loading";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Permissions } from "@/constant";

const Asidebar = () => {
  const { isLoading, user, hasPermission } = useAuthContext();
  const { isStrategicLoading } = useLoadingContext();
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { showOnboarding } = useOnboarding();

  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  // Don't render sidebar if no valid workspace ID
  if (!workspaceId) {
    return null;
  }

  const handleProfileClick = () => {
    if (workspaceId) {
      router.push(`/workspace/${workspaceId}/profile`);
    }
  };

  const handleSettingsClick = () => {
    if (workspaceId) {
      router.push(`/workspace/${workspaceId}/settings`);
    }
  };

  const handleTakeTourClick = () => {
    setIsDropdownOpen(false);
    showOnboarding();
  };

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="
          border-r border-border/30 dark:border-gray-700/60 
          shadow-xl shadow-black/5 dark:shadow-gray-900/30
          bg-gradient-to-b from-white via-gray-50/50 to-white
          dark:from-gray-950 dark:via-gray-900/98 dark:to-gray-800
          backdrop-blur-xl
          transition-all duration-500 ease-out
        "
      >
        {/* Compact Header */}
        <SidebarHeader className="
          bg-background/95 
          border-b border-border/50 dark:border-gray-700/60
          h-14
          relative
          backdrop-blur-sm
          dark:shadow-lg dark:shadow-gray-900/20
        ">
          <div className="flex justify-between items-center h-full w-full gap-10 relative">
            {/* Subtle background gradient */}
            <div className="absolute bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-lg opacity-50 dark:opacity-40" />
            <div className="relative transform transition-transform duration-300 hover:scale-105 group-data-[collapsible=icon]:scale-90">
              <SidebarLogo url={workspaceId ? `/workspace/${workspaceId}` : '/workspace'} />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="py-1">
            <SidebarGroupContent className="gap-1">
              {/* Workspace Switcher */}
              <div className="transition-all duration-300">
                <WorkspaceSwitcher />
              </div>

              {/* Compact Separator */}
              <Separator className="
                  opacity-30 bg-border dark:bg-gradient-to-r dark:from-transparent dark:via-gray-600/60 dark:to-transparent
                  h-px my-1
                " />

              {/* Navigation Main */}
              <div className="space-y-0.5">
                <NavMain />
              </div>

              {/* Separator */}
              <Separator className="
                  opacity-30 bg-border dark:bg-gradient-to-r dark:from-transparent dark:via-gray-600/60 dark:to-transparent
                  my-1
                " />

              {/* Navigation Projects */}
              <div className="space-y-0.5">
                <NavProjects />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Compact Footer */}
        <SidebarFooter className="
             bg-background/95 dark:bg-background/95
             border-t border-border/30 dark:border-gray-700/60
             backdrop-blur-sm
            dark:shadow-lg dark:shadow-gray-900/20
          ">
          <SidebarMenu>
            <SidebarMenuItem>
              {isLoading ? (
                <div className="flex items-center justify-center py-2 sm:py-3">
                  <Loader
                    size="16px"
                    className="animate-spin text-muted-foreground"
                  />
                  <span className="ml-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                    Loading...
                  </span>
                </div>
              ) : (
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center w-full sm:gap-2 overflow-hidden text-left outline-none ring-0 focus-visible:ring-2 focus-visible:ring-blue-500/50
                      disabled:pointer-events-none disabled:opacity-50 
                      active:scale-[0.98]
                      data-[state=open]:bg-muted/50
                      dark:data-[state=open]:bg-muted/30
                      
                      group-data-[collapsible=icon]:!flex-shrink-0
                      h-10 sm:h-12 text-xs sm:text-sm
                      transition-all duration-300 ease-out
                      rounded-lg 
                      border border-transparent
                      shadow-sm
                      backdrop-blur-sm"
                      data-state={isDropdownOpen ? "open" : "closed"}
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="menu"
                    >
                      {/* Compact Avatar Container */}
                      <div className="relative flex items-center justify-center">
                        <div className="
                              relative rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
                              shadow-lg shadow-blue-500/25 dark:shadow-blue-500/50 
                              transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40
                              dark:hover:shadow-2xl dark:hover:shadow-purple-500/30
                              group-hover:scale-105
                          ">
                          <Avatar className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-background border-0 shadow-inner transition-colors duration-300">
                            <AvatarImage
                              src={getProfilePictureUrl(user?.profilePicture || undefined) || undefined}
                              alt={user?.name || "User"}
                              className="rounded-full"
                            />
                            <AvatarFallback className={`rounded-full text-xs sm:text-sm lg:text-base font-bold ${getAvatarColor(user?.name || "")}`}>
                              {getAvatarFallbackText(user?.name || "")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        {/* Compact Online Status */}
                        <div className="
                            absolute bottom-0 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3
                            bg-gradient-to-br from-green-400 to-green-500 
                            border-2 border-white dark:border-gray-800 
                            rounded-full shadow-sm
                            ring-1 ring-green-400/30 dark:ring-green-400/50
                            group-hover:scale-110 group-hover:ring-2 group-hover:ring-green-400/60
                            dark:group-hover:ring-green-400/70
                            transition-all duration-300
                          ">
                          <div className="absolute inset-0.5 bg-green-300 rounded-full opacity-75 group-hover:opacity-90 transition-opacity duration-300" />
                        </div>
                      </div>

                      {/* Compact User Info */}
                      <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden ml-2">
                        <span className="truncate font-normal text-foreground dark:text-gray-200 text-xs sm:text-sm transition-colors duration-300">
                          {user?.name}
                        </span>
                        <span className="truncate text-sm dark:text-white/80 text-muted-foreground    transition-colors duration-300">
                          {user?.email}
                        </span>
                      </div>

                      {/* Compact Menu Icon */}
                      <div className="
                          ml-auto p-1 rounded-md bg-gray-100/60 dark:bg-gray-700/60
                          group-data-[collapsible=icon]:hidden 
                          transition-all duration-300
                          group-hover:bg-blue-100/80 dark:group-hover:bg-blue-800/50
                          group-hover:shadow-md dark:group-hover:shadow-blue-500/20
                          group-data-[state=open]:rotate-90 group-data-[state=open]:bg-blue-200/80 dark:group-data-[state=open]:bg-blue-800/60
                          group-data-[state=open]:shadow-lg dark:group-data-[state=open]:shadow-blue-500/30
                        ">
                        <MoreHorizontal className="h-3 w-3 text-muted-foreground transition-colors duration-300" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>

                  {/* Enhanced Dropdown */}
                  <DropdownMenuContent
                    className="
                        w-[--radix-dropdown-menu-trigger-width] min-w-52  sm:min-w-64
                        rounded-xl sm:rounded-2xl border border-border/30 dark:border-gray-700/50 
                        shadow-xl sm:shadow-2xl shadow-black/10 dark:shadow-gray-900/30
                        bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
                        p-1 sm:p-2
                        animate-in slide-in-from-bottom-2 duration-200
                      "
                    side={"bottom"}
                    align="start"
                    sideOffset={8}
                  >
                    {/* User Info Header - Compact for Mobile */}
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b border-border/30 dark:border-gray-700/50">
                      <div className="relative">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full shadow-lg border-0">
                          <AvatarImage
                            src={getProfilePictureUrl(user?.profilePicture || undefined) || undefined}
                            alt={user?.name || "User"}
                            className="rounded-full"
                          />
                          <AvatarFallback className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full shadow-lg border-0">
                            {getAvatarFallbackText(user?.name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm dark:shadow-gray-900/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground/80 break-all overflow-hidden">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Menu Items - Compact for Mobile */}
                    <DropdownMenuGroup className="p-1 sm:p-2">
                      <DropdownMenuItem
                        className="
                            rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200
                            hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50
                            dark:hover:from-blue-900/30 dark:hover:to-purple-900/30
                            hover:shadow-sm p-2 sm:p-3
                            focus:bg-gradient-to-r focus:from-blue-50 focus:to-purple-50
                          "
                        onClick={handleProfileClick}
                      >
                        <div className="mr-2 sm:mr-3 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-blue-100 dark:bg-blue-800/30">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium text-sm">Profile</span>
                      </DropdownMenuItem>
                      {hasPermission && hasPermission(Permissions.MANAGE_WORKSPACE_SETTINGS) && (
                        <DropdownMenuItem
                          className="
                              rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200
                              hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50
                              dark:hover:from-gray-800/30 dark:hover:to-blue-900/30
                              hover:shadow-sm p-2 sm:p-3
                              focus:bg-gradient-to-r focus:from-gray-50 focus:to-blue-50
                            "
                          onClick={handleSettingsClick}
                        >
                          <div className="mr-2 sm:mr-3 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-gray-100 dark:bg-gray-700/50">
                            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <span className="font-medium text-sm">Settings</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="
                            rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200
                            hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50
                            dark:hover:from-green-800/30 dark:hover:to-blue-900/30
                            hover:shadow-sm p-2 sm:p-3
                            focus:bg-gradient-to-r focus:from-green-50 focus:to-blue-50
                          "
                        onClick={handleTakeTourClick}
                      >
                        <div className="mr-2 sm:mr-3 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-green-100 dark:bg-green-800/30">
                          <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-medium text-sm">Take Tour</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="my-1 sm:my-2 bg-gradient-to-r from-transparent via-border dark:via-gray-700/50 to-transparent" />

                    {/* Logout Item - Compact for Mobile */}
                    <DropdownMenuItem
                      onClick={() => setIsOpen(true)}
                      className="
                          rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200
                          text-red-600 dark:text-red-400
                          hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 
                          dark:hover:from-red-900/20 dark:hover:to-pink-900/20
                          focus:bg-red-50 dark:focus:bg-red-900/20
                          hover:shadow-sm p-2 sm:p-3 m-1
                          font-medium text-sm
                        "
                    >
                      <div className="mr-2 sm:mr-3 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-red-100 dark:bg-red-800/30">
                        <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <LogoutDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
};

export default Asidebar;
