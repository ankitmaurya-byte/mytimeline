"use client";
import * as React from "react";
import { Check, ChevronDown, Loader, Plus, Building2 } from "lucide-react";
import { useAuthContext } from "@/context/useAuthContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useWorkspaceDialog } from "@/context/workspace-dialog-context";
import { useQuery } from "@tanstack/react-query";
import { getAllWorkspacesUserIsMemberQueryFn } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLoadingContext } from "@/components/loading";

type WorkspaceType = {
  _id: string;
  name: string;
};

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { loading } = useAuthContext();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const { openDialog } = useWorkspaceDialog();
  const workspaceId = useWorkspaceId();

  const [activeWorkspace, setActiveWorkspace] = React.useState<WorkspaceType>();
  const [isOpen, setIsOpen] = React.useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getAllWorkspacesUserIsMemberQueryFn,
    staleTime: 1,
    refetchOnMount: true,
    enabled: !loading, // Wait for auth state
  });

  const workspaces = data?.workspaces?.filter((workspace) => workspace && workspace._id) || [];

  // Debug logging
  React.useEffect(() => {
    // console.log('[WorkspaceSwitcher] Query data:', {
    //   data,
    //   isPending,
    //   loading,
    //   workspacesLength: workspaces?.length,
    //   workspaces: workspaces?.map(ws => ({ id: ws._id, name: ws.name })),
    //   rawData: data
    // });
  }, [data, isPending, loading, workspaces]);

  // In your WorkspaceSwitcher component
  const handleCreateWorkspace = () => {
    // console.log("[WorkspaceSwitcher] Create workspace clicked");
    openDialog(); // This should call the openDialog from useWorkspaceDialog
  };

  React.useEffect(() => {
    // console.log('[WorkspaceSwitcher] Effect triggered:', {
    //   workspacesLength: workspaces?.length,
    //   workspaceId,
    //   workspaces: workspaces?.map(ws => ({ id: ws._id, name: ws.name }))
    // });

    if (workspaces?.length) {
      // Find the current workspace based on ID or default to first one
      const workspace = workspaceId
        ? workspaces.find((ws) => ws && ws._id === workspaceId)
        : workspaces.find((ws) => ws && ws._id);

      // console.log('[WorkspaceSwitcher] Found workspace:', workspace);

      if (workspace && workspace._id) {
        setActiveWorkspace(workspace);
        // console.log('[WorkspaceSwitcher] Set active workspace:', workspace.name);

        // Only navigate if we don't have a workspaceId and we're not already on that page
        if (!workspaceId && typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          const targetPath = `/workspace/${workspace._id}`;

          // Only navigate if not already on the correct workspace page
          if (currentPath !== targetPath) {
            router.replace(targetPath, { scroll: false });
          }
        }
      }
    } else {
      // console.log('[WorkspaceSwitcher] No workspaces found or workspaces array is empty');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, workspaces]);

  const onSelect = (workspace: WorkspaceType) => {
    if (!workspace || !workspace._id) {
      return;
    }

    setIsOpen(false);
    // Only navigate if not already on the correct workspace page
    if (workspace._id !== workspaceId && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const targetPath = `/workspace/${workspace._id}`;
      if (currentPath !== targetPath) {
        setActiveWorkspace(workspace);
        router.push(targetPath, { scroll: false });
      }
    }
  };

  const getWorkspaceInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  const getWorkspaceColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-red-500"
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <>
      <SidebarGroupLabel className="group w-full justify-between pr-2 mb-2">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <span className="font-medium dark:text-white/70 ">Workspaces</span>
        </div>
        <button
          onClick={handleCreateWorkspace}
          type="button"
          className="flex size-7 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-all duration-200 text-primary shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 hover:scale-105 active:scale-95"
          title="Create Workspace"
        >
          <Plus className="size-4" />
        </button>
      </SidebarGroupLabel>

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                data-tour-id="workspace-switcher"
                className={cn(
                  "group relative overflow-hidden transition-all duration-200 hover:bg-sidebar-accent/80 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-transparent hover:border-sidebar-border/50 ",
                  isSmallScreen && "max-w-[calc(100vw-2rem)]"
                )}
              >
                {activeWorkspace ? (
                  <>
                    <div className={cn(
                      "flex aspect-square size-10 items-center font-bold justify-center rounded-xl text-white shadow-md transition-transform duration-200 group-hover:scale-105",
                      getWorkspaceColor(activeWorkspace.name)
                    )}>
                      {getWorkspaceInitials(activeWorkspace.name)}
                    </div>
                    <div className="flex flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold  text-sidebar-foreground">
                        {activeWorkspace.name}
                      </span>
                      {/* <span className="truncate text-xs text-muted-foreground font-medium">
                        Free Plan
                      </span> */}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-muted border-2 border-dashed border-muted-foreground/30">
                      <Building2 className="size-4 text-muted-foreground" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-muted-foreground">
                        No Workspace Selected
                      </span>
                      <span className="truncate text-xs text-muted-foreground/70">
                        Select or create one
                      </span>
                    </div>
                  </>
                )}
                <ChevronDown className={cn(
                  "ml-auto size-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className={cn(
                "rounded-xl border shadow-lg backdrop-blur-sm bg-background/95 p-1",
                isSmallScreen
                  ? "w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]"
                  : "w-[--radix-dropdown-menu-trigger-width] min-w-64"
              )}
              align={isSmallScreen ? "center" : "start"}
              side={isMobile ? "bottom" : "right"}
              sideOffset={8}
              onCloseAutoFocus={(e) => {
                if (isSmallScreen) {
                  e.preventDefault();
                }
              }}
            >
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-2 flex items-center gap-2">
                <Building2 className="size-3" />
                Your Workspaces
              </DropdownMenuLabel>

              {isPending ? (
                <div className="min-h-[200px] w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
                  <div className="text-center max-w-sm sm:max-w-md mx-auto">
                    <div className="animate-spin rounded-full h-20 w-20 sm:h-32 sm:w-32 border-b-2 border-gray-900 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-base sm:text-lg text-gray-600 px-4">Loading workspaces...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className={cn(
                    "max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
                    isSmallScreen && "max-h-[50vh]"
                  )}>
                    {workspaces?.map((workspace) => (
                      <DropdownMenuItem
                        key={workspace._id}
                        onClick={() => onSelect(workspace)}
                        className={cn(
                          "group gap-3 p-3 mx-1 my-0.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/80 focus:bg-accent/80",
                          workspace._id === workspaceId && "bg-accent/50 border border-accent-foreground/10"
                        )}
                      >
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg text-white font-semibold text-sm shadow-sm transition-transform duration-200 group-hover:scale-105",
                          getWorkspaceColor(workspace.name)
                        )}>
                          {getWorkspaceInitials(workspace.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate font-medium text-sm block">
                            {workspace.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Free Plan
                          </span>
                        </div>

                        {workspace._id === workspaceId && (
                          <DropdownMenuShortcut className="tracking-normal !opacity-100">
                            <div className="flex items-center justify-center size-6 rounded-full bg-primary/10">
                              <Check className="size-3 text-primary" />
                            </div>
                          </DropdownMenuShortcut>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem
                    className="group gap-3 p-3 mx-1 mb-1 rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/5 focus:bg-primary/5 border border-dashed border-primary/20 hover:border-primary/40"
                    onClick={() => {
                      setIsOpen(false);
                      handleCreateWorkspace(); // Use handleCreateWorkspace instead of onOpen
                    }}
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-200">
                      <Plus className="size-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-primary">
                        Create Workspace
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Start a new project
                      </div>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
