'use client';
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useLoadingContext } from "@/components/loading";
import ThemeSwitch from "@/components/Navbar/ThemeSwitch";
import { Separator } from "./ui/separator";
import { useState } from "react";
import { ChevronDown, Building2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getAllWorkspacesUserIsMemberQueryFn } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useWorkspaceDialog } from "@/context/workspace-dialog-context";
import { NotificationHistory } from "@/components/header/notification-history";

const Header = () => {
  const pathname = usePathname();
  const safePathname = pathname ?? "";
  const workspaceId = useWorkspaceId();
  const { isStrategicLoading } = useLoadingContext();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const { openDialog } = useWorkspaceDialog();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  // Fetch workspaces
  const { data: workspacesData } = useQuery({
    queryKey: ["userWorkspaces"],
    queryFn: getAllWorkspacesUserIsMemberQueryFn,
    enabled: !!workspaceId,
  });

  const workspaces = workspacesData?.workspaces?.filter((ws) => ws && ws._id) || [];
  const currentWorkspace = workspaces.find((ws) => ws._id === workspaceId);

  const handleCreateWorkspace = () => {
    // Open the workspace creation dialog
    openDialog();
  };

  const getPageLabel = (pathname: string) => {
    if (/^\/workspace\/[\w-]+$/.test(pathname)) return "Dashboard";
    if (pathname === "/workspace") return "Settings";
    if (pathname.includes("/project/")) return "Project";
    if (pathname.includes("/settings/security")) return "Security";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/tasks")) return "Tasks";
    if (pathname.includes("/members")) return "Members";
    if (pathname.includes("/analytics")) return "Analytics";
    if (pathname.includes("/profile")) return "Profile";
    return null;
  };

  const pageHeading = pathname ? getPageLabel(pathname) : "";

  return (
    <header className="flex sticky top-0 z-50 bg-background border-b border-border h-12 shrink-0 items-center">
      <div className="flex flex-1 items-center gap-2 px-3">
        {pathname !== "/workspace" && <div className="hidden md:block"><SidebarTrigger /></div>}

        {/* Workspace Switcher - Only visible on mobile and dashboard */}
        {/^\/workspace\/[\w-]+$/.test(safePathname) && (
          <div className="md:hidden">
            <DropdownMenu open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm truncate max-w-32">
                    {currentWorkspace?.name || "Workspace"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="start"
                className="w-48 bg-background border border-border shadow-lg"
              >
                <DropdownMenuItem
                  onClick={handleCreateWorkspace}
                  className="cursor-pointer text-blue-600 dark:text-blue-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </DropdownMenuItem>
                {workspaces.length > 0 && <DropdownMenuSeparator />}
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace._id}
                    asChild
                    className="cursor-pointer"
                  >
                    <Link href={`/workspace/${workspace._id}`}>
                      <Building2 className="h-4 w-4 mr-2" />
                      {workspace.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Page Label */}
        {pageHeading && (
          <>
            {/^\/workspace\/[\w-]+$/.test(safePathname) && (
              <Separator orientation="vertical" className="mx-2 h-4 md:hidden" />
            )}
            <span className="text-sm text-muted-foreground">
              {pageHeading}
            </span>
          </>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-1 px-3">
        <NotificationHistory />
        <ThemeSwitch />
      </div>
    </header>
  );
};

export default Header;
