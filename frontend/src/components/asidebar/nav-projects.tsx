import {
  ArrowRight,
  Edit3,
  Folder,
  Loader,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useProjectDialog } from "@/context/project-dialog-context";
import { ConfirmDialog } from "../resuable/confirm-dialog";
import useConfirmDialog from "@/hooks/use-confirm-dialog";
import { Button } from "../ui/button";
import { Permissions } from "@/constant";
import PermissionsGuard from "../resuable/permission-guard";
import { useState } from "react";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import { PaginationType } from "@/types/api.type";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProjectMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useLoadingContext } from "@/components/loading";
import { useAuthContext } from "@/context/useAuthContext";
import EditProjectDialog from "../workspace/project/edit-project-dialog";

function NavProjectsComponent() {
  const router = useRouter();
  const pathname = usePathname();

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { hasPermission, user, workspace } = useAuthContext();

  const { isMobile } = useSidebar();
  const { openDialog } = useProjectDialog();
  const { context, open, onOpenDialog, onCloseDialog } = useConfirmDialog();

  const [pageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: deleteProjectMutationFn,
  });

  const { data, isPending, isFetching, isError } =
    useGetProjectsInWorkspaceQuery({
      workspaceId,
      pageSize,
      pageNumber,
    });

  const projects = (data as any)?.projects || [];
  const pagination = (data as any)?.pagination || ({} as PaginationType);
  const hasMore = pagination?.totalPages > pageNumber;

  const fetchNextPage = () => {
    if (!hasMore || isFetching) return;
    setPageSize((prev) => prev + 5);
  };

  const handleConfirm = () => {
    if (!context) return;
    mutate(
      {
        workspaceId,
        projectId: context?._id,
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({
            queryKey: ["allprojects", workspaceId],
          });
          toast({
            title: "Success",
            description: data.message,
            variant: "success",
          });

          router.push(`/workspace/${workspaceId}`);
          setTimeout(() => onCloseDialog(), 100);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingProject(null);
    // Refresh the projects list after editing
    queryClient.invalidateQueries({
      queryKey: ["allprojects", workspaceId],
    });
  };

  // Debug: Check what permissions you have
  /*  const debugPermissions = () => {
     const allPermissions = Object.values(Permissions);
     const userPermissions = allPermissions.filter(permission => hasPermission(permission));
 
     );
 
     // Additional debugging
     // Test individual permissions
     allPermissions.forEach(permission => {
     });
 
     return userPermissions;
   }; */

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="w-full flex items-center justify-between px-1 py-0.5">
          <span className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Projects</span>

          <PermissionsGuard requiredPermission={Permissions.CREATE_PROJECT}>
            <button
              onClick={openDialog}
              type="button"
              className="flex h-4 w-4 items-center justify-center rounded-sm bg-muted hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-muted-foreground dark:text-slate-300"
              title="Create Project"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </PermissionsGuard>
        </SidebarGroupLabel>
        <SidebarMenu className="space-y-0">
          {isError && <div className="text-destructive dark:text-red-400 text-xs px-2 py-1">Error occurred</div>}
          {isPending && (
            <div className="flex justify-center items-center py-3">
              <Loader className="w-4 h-4 animate-spin text-muted-foreground dark:text-gray-400" />
            </div>
          )}

          {!isPending && projects?.length === 0 ? (
            <div className="px-1 py-1">
              <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">
                No projects yet.
              </p>
              <PermissionsGuard requiredPermission={Permissions.CREATE_PROJECT}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 w-full"
                  onClick={openDialog}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create Project
                </Button>
              </PermissionsGuard>
            </div>
          ) : (
            projects.map((item: any) => {
              const projectUrl = `/workspace/${workspaceId}/project/${item._id}`;
              return (
                <SidebarMenuItem key={item._id}>
                  <SidebarMenuButton
                    asChild
                    isActive={projectUrl === pathname}
                    className="w-full"
                  >
                    <Link href={projectUrl} className="flex items-center gap-1.5 px-1.5 py-1 text-xs hover:bg-gray-100/50 dark:hover:bg-gray-800/60 rounded-md transition-all duration-300 hover:shadow-sm dark:hover:shadow-gray-900/20 hover:scale-[1.02] group">
                      <span className="text-xs flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{item.emoji}</span>
                      <span className="truncate font-medium group-data-[collapsible=icon]:hidden text-foreground dark:text-gray-200 transition-colors duration-300">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal className="w-3 h-3" />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-900/50"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem
                        onClick={() => router.push(`${projectUrl}`)}
                        className="text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Folder className="mr-2 w-3 h-3" />
                        View
                      </DropdownMenuItem>

                      <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
                        <DropdownMenuItem
                          onClick={() => handleEditProject(item)}
                          className="text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Edit3 className="mr-2 w-3 h-3" />
                          Edit
                        </DropdownMenuItem>
                      </PermissionsGuard>

                      <PermissionsGuard requiredPermission={Permissions.DELETE_PROJECT}>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isLoading}
                          onClick={() => onOpenDialog(item)}
                          className="text-sm text-destructive dark:text-red-400 focus:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="mr-2 w-3 h-3" />
                          Delete
                        </DropdownMenuItem>
                      </PermissionsGuard>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            })
          )}

          {hasMore && (
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-xs text-muted-foreground dark:text-gray-400 py-1 hover:bg-gray-100/50 dark:hover:bg-gray-800/60 transition-all duration-300 hover:shadow-sm dark:hover:shadow-gray-900/20 hover:scale-[1.02] group"
                disabled={isFetching}
                onClick={fetchNextPage}
              >
                <MoreHorizontal className="w-3 h-3 mr-1 transition-transform duration-300 group-hover:scale-110" />
                <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{isFetching ? "Loading..." : "More"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>

      <ConfirmDialog
        isOpen={open}
        isLoading={isLoading}
        onClose={onCloseDialog}
        onConfirm={handleConfirm}
        title="Delete Project"
        description={`Are you sure you want to delete ${context?.name || "this item"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <EditProjectDialog
        project={editingProject}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
      />
    </>
  );
}

export function NavProjects() {
  const router = useRouter();
  const pathname = usePathname();
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }
  return <NavProjectsComponent />;
}
