"use client";
import {
  LucideIcon,
  Settings,
  Users,
  CheckCircle,
  LayoutDashboard,
  BarChart3,
  Plus,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/useAuthContext";
import { Permissions } from "@/constant";
import { useSidebar } from "@/components/ui/sidebar";
import { useProjectDialog } from "@/context/project-dialog-context";
import PermissionsGuard from "../resuable/permission-guard";

type ItemType = {
  title: string;
  url: string;
  icon: LucideIcon;
  action?: () => void;
  isAction?: boolean;
};

export function NavMain() {
  const { hasPermission } = useAuthContext();
  const { isMobile, setOpenMobile } = useSidebar();
  const { openDialog } = useProjectDialog();

  const canManageSettings = hasPermission(
    Permissions.MANAGE_WORKSPACE_SETTINGS
  );

  const canCreateProject = hasPermission(
    Permissions.CREATE_PROJECT
  );

  const workspaceId = useWorkspaceId();
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const items: ItemType[] = [
    {
      title: "Dashboard",
      url: `/workspace/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Analytics",
      url: `/workspace/${workspaceId}/analytics`,
      icon: BarChart3,
    },
    {
      title: "Tasks",
      url: `/workspace/${workspaceId}/tasks`,
      icon: CheckCircle,
    },
    {
      title: "Members",
      url: `/workspace/${workspaceId}/members`,
      icon: Users,
    },
    ...(canManageSettings
      ? [
        {
          title: "Settings",
          url: `/workspace/${workspaceId}/settings`,
          icon: Settings,
        },
      ]
      : []),
  ];

  return (
    <SidebarGroup>
      <SidebarMenu className="space-y-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={item.url === pathname}
              asChild
            >
              <Link
                href={item.url}
                prefetch={true} // Enable prefetching for faster navigation
                data-tour-id={`nav-${item.title.toLowerCase()}`}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${item.url === pathname
                  ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50 shadow-sm dark:shadow-slate-900/20'
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                onClick={handleLinkClick}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
