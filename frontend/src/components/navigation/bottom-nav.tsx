"use client";

import {
    LucideIcon,
    Settings,
    CheckCircle,
    LayoutDashboard,
    BarChart3,
    FolderOpen,
    User,
    HelpCircle,
    LogOut,
    Users,
    Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/useAuthContext";
import { useOnboarding } from "@/hooks/use-onboarding";
import { logoutMutationFn } from "@/lib/api";
import { clearAllProfilePictureCaches } from "@/lib/profile-picture-utils";
import { Permissions } from "@/constant";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getProjectsInWorkspaceQueryFn } from "@/lib/api";
import { useProjectDialog } from "@/context/project-dialog-context";

type NavItem = {
    title: string;
    url: string;
    icon: LucideIcon;
    permission?: string;
};

export function BottomNav() {
    const { hasPermission } = useAuthContext();
    const workspaceId = useWorkspaceId();
    const pathname = usePathname();
    const router = useRouter();
    const [projectsOpen, setProjectsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { openDialog } = useProjectDialog();
    const { showOnboarding } = useOnboarding();
    const queryClient = useQueryClient();

    const canManageSettings = hasPermission(
        Permissions.MANAGE_WORKSPACE_SETTINGS
    );

    const canCreateProject = hasPermission(
        Permissions.CREATE_PROJECT
    );

    // Fetch projects
    const { data: projectsData } = useQuery({
        queryKey: ["projects", workspaceId],
        queryFn: () => getProjectsInWorkspaceQueryFn({ workspaceId: workspaceId! }),
        enabled: !!workspaceId,
    });

    const projects = projectsData?.projects || [];

    // Handler functions for settings dropdown
    const handleProfileClick = () => {
        // Navigate to profile page
        if (workspaceId) {
            router.push(`/workspace/${workspaceId}/profile`);
        }
    };

    const handleSettingsClick = () => {
        // Navigate to settings page
        if (workspaceId) {
            router.push(`/workspace/${workspaceId}/settings`);
        }
    };

    const handleTakeTourClick = () => {
        setSettingsOpen(false);
        showOnboarding();
    };

    const handleMembersClick = () => {
        // Navigate to members page
        if (workspaceId) {
            router.push(`/workspace/${workspaceId}/members`);
        }
    };

    const handleLogoutClick = useCallback(async () => {
        if (isLoggingOut) return;

        try {
            setIsLoggingOut(true);
            setSettingsOpen(false);

            // Clear local state first to prevent race conditions
            queryClient.resetQueries();
            queryClient.clear();

            // Clear all profile picture caches
            clearAllProfilePictureCaches();

            // Clear axios authorization header
            delete axios.defaults.headers.common['Authorization'];

            // Clear any stored biometric credentials in the browser
            try {
                if (window.PublicKeyCredential) {
                    // This will clear stored WebAuthn credentials for this domain
                }
            } catch (error) {
                console.warn('Failed to clear biometric credentials:', error);
            }

            // Call backend logout
            await logoutMutationFn().catch((error) => {
                console.warn("Backend logout failed (continuing local cleanup)", error);
            });

            // Clear any remaining cookies manually
            try {
                const cookiesToClear = ['auth_token', 'auth_token_js', 'auth_active'];
                cookiesToClear.forEach(cookieName => {
                    // Clear for current domain
                    document.cookie = `${cookieName}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                    // Clear for parent domain
                    document.cookie = `${cookieName}=; Path=/; Domain=.timelline.tech; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                    // Clear for localhost
                    document.cookie = `${cookieName}=; Path=/; Domain=localhost; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                });
            } catch (error) {
                console.warn("Failed to clear cookies manually:", error);
            }

            // Force redirect to home page immediately
            window.location.href = window.location.origin;

        } catch (error) {
            console.error("Error during logout:", error);
            toast({
                title: "Error",
                description: "An error occurred during logout",
                variant: "destructive",
            });
        } finally {
            setIsLoggingOut(false);
        }
    }, [isLoggingOut, queryClient]);

    const navItems: NavItem[] = [
        {
            title: "Home",
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
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-black/5 dark:shadow-gray-900/30 safe-area-pb">
            <div className="flex items-center justify-around px-1 py-2 pb-safe">
                {/* Main Navigation Items */}
                {navItems.map((item) => {
                    const isActive = pathname === item.url;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.title}
                            href={item.url}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 transition-all duration-300 min-w-0 flex-1 group touch-manipulation",
                                isActive
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            )}
                        >
                            <div className="relative p-1.5 transition-all duration-300">
                                <Icon className={cn(
                                    "h-5 w-5 transition-all duration-300",
                                    isActive && "scale-110"
                                )} />
                                {isActive && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium truncate max-w-full transition-all duration-300 mt-1",
                                isActive && "font-semibold"
                            )}>
                                {item.title}
                            </span>
                        </Link>
                    );
                })}

                {/* Projects Dropdown */}
                <DropdownMenu open={projectsOpen} onOpenChange={setProjectsOpen}>
                    <DropdownMenuTrigger asChild>
                        <button className="flex flex-col items-center justify-center p-3 transition-all duration-300 min-w-0 flex-1 group touch-manipulation">
                            <div className="relative p-1.5 transition-all duration-300">
                                <FolderOpen className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-all duration-300" />
                                {projects.length > 0 && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full" />
                                )}
                            </div>
                            <span className="text-[10px] font-medium truncate max-w-full transition-all duration-300 mt-1 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                                Projects
                            </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        align="center"
                        className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-64 overflow-y-auto"
                    >
                        {canCreateProject && (
                            <>
                                <DropdownMenuItem
                                    onClick={openDialog}
                                    className="cursor-pointer text-blue-600 dark:text-blue-400"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Project
                                </DropdownMenuItem>
                                {projects.length > 0 && <DropdownMenuSeparator />}
                            </>
                        )}
                        {projects.length > 0 ? (
                            projects.map((project) => (
                                <DropdownMenuItem
                                    key={project._id}
                                    asChild
                                    className="cursor-pointer"
                                >
                                    <Link href={`/workspace/${workspaceId}/project/${project._id}`}>
                                        <span className="mr-2">{project.emoji}</span>
                                        {project.name}
                                    </Link>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            !canCreateProject && (
                                <DropdownMenuItem disabled>
                                    No projects found
                                </DropdownMenuItem>
                            )
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings Dropdown - Always visible for Profile access */}
                <DropdownMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DropdownMenuTrigger asChild>
                        <button className="flex flex-col items-center justify-center p-3 transition-all duration-300 min-w-0 flex-1 group touch-manipulation">
                            <div className="relative p-1.5 transition-all duration-300">
                                <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-all duration-300" />
                            </div>
                            <span className="text-[10px] font-medium truncate max-w-full transition-all duration-300 mt-1 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                                Settings
                            </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        align="center"
                        className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                    >
                        {/* Settings option - only show if user has permission */}
                        {canManageSettings && (
                            <DropdownMenuItem
                                onClick={handleSettingsClick}
                                className="cursor-pointer"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                        )}

                        {/* Profile - always available */}
                        <DropdownMenuItem
                            onClick={handleProfileClick}
                            className="cursor-pointer"
                        >
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </DropdownMenuItem>

                        {/* Members - only show if user has permission */}
                        {canManageSettings && (
                            <DropdownMenuItem
                                onClick={handleMembersClick}
                                className="cursor-pointer"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Members
                            </DropdownMenuItem>
                        )}

                        {/* Take Tour - always available */}
                        <DropdownMenuItem
                            onClick={handleTakeTourClick}
                            className="cursor-pointer"
                        >
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Take Tour
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Logout - always available */}
                        <DropdownMenuItem
                            onClick={handleLogoutClick}
                            disabled={isLoggingOut}
                            className="cursor-pointer text-red-600 dark:text-red-400 disabled:opacity-50"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            {isLoggingOut ? "Logging out..." : "Log out"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
}
