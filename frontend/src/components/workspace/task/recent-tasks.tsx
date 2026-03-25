import { ResponsiveAvatar } from "@/components/ui/responsive-avatar";
import { Badge } from "@/components/ui/badge";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getAllTasksQueryFn } from "@/lib/api";
import {
  getAvatarColor,
  getAvatarFallbackText,
  transformStatusEnum,
} from "@/lib/helper";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";
import { TaskType } from "@/types/api.type";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLoadingContext } from "@/components/loading";
import { useProfilePictures } from "@/hooks/use-profile-pictures";

const RecentTasks = () => {
  const workspaceId = useWorkspaceId();
  const { isStrategicLoading } = useLoadingContext();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["all-tasks", workspaceId],
    queryFn: () => {
      return getAllTasksQueryFn({
        workspaceId,
        pageSize: 10, // Limit to 10 recent tasks to reduce payload size
        pageNumber: 1,
      });
    },
    staleTime: 5 * 1000, // 5 seconds cache for better real-time sync
    gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
    enabled: !!workspaceId
  });

  // Extract unique user IDs from tasks for profile picture fetching
  const userIds = useMemo(() => {
    if (!data?.tasks) return [];
    const ids = data.tasks
      .map(task => task.assignedTo?._id)
      .filter((id): id is string => !!id);
    return [...new Set(ids)]; // Remove duplicates
  }, [data?.tasks]);

  // Fetch profile pictures separately
  const { data: profilePicturesData, isLoading: profilePicturesLoading, error: profilePicturesError } = useProfilePictures(userIds);

  // Log query state changes
  useEffect(() => {
    if (data) {
    }
    if (isLoading) {
    }
  }, [data, isLoading, workspaceId]);

  // Listen for custom task update events
  useEffect(() => {
    const handleTaskUpdate = (event: CustomEvent) => {
      const { workspaceId: eventWorkspaceId } = event.detail;
      if (eventWorkspaceId === workspaceId) {
        queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId], exact: false, refetchType: 'active' });
      }
    };

    const handleTaskCreated = (event: CustomEvent) => {
      const { workspaceId: eventWorkspaceId } = event.detail;
      if (eventWorkspaceId === workspaceId) {
        queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId], exact: false, refetchType: 'active' });
      }
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      const { workspaceId: eventWorkspaceId } = event.detail;
      if (eventWorkspaceId === workspaceId) {
        queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId], exact: false, refetchType: 'active' });
      }
    };

    window.addEventListener('taskUpdated', handleTaskUpdate as EventListener);
    window.addEventListener('task-created', handleTaskCreated as EventListener);
    window.addEventListener('task-updated', handleTaskUpdate as EventListener);
    window.addEventListener('task-deleted', handleTaskDeleted as EventListener);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdate as EventListener);
      window.removeEventListener('task-created', handleTaskCreated as EventListener);
      window.removeEventListener('task-updated', handleTaskUpdate as EventListener);
      window.removeEventListener('task-deleted', handleTaskDeleted as EventListener);
    };
  }, [workspaceId, queryClient]);

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  const tasks: TaskType[] = data?.tasks || [];



  return (
    <div className="flex flex-col space-y-4 sm:space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {tasks?.length === 0 && (
        <div className="font-semibold text-sm text-muted-foreground text-center py-4 sm:py-5">
          No Task created yet
        </div>
      )}

      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700/50">
        {tasks.map((task) => {
          const name = task?.assignedTo?.name || "";
          const initials = getAvatarFallbackText(name);
          const avatarColor = getAvatarColor(name);

          return (
            <li
              key={task._id}
              className="p-3 sm:p-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
            >
              {/* Task Info - Full width on mobile, flex-grow on desktop */}
              <div className="flex flex-col space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs sm:text-sm capitalize text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800/60 px-2 py-1 rounded">
                    {task.taskCode}
                  </span>
                  {/* Status Badge - Show on mobile above title */}
                  <div className="sm:hidden">
                    <Badge
                      variant={TaskStatusEnum[task.status]}
                      className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0 text-xs"
                    >
                      <span>{transformStatusEnum(task.status)}</span>
                    </Badge>
                  </div>
                </div>

                <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 sm:line-clamp-1">
                  {task.title}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span className="hidden sm:inline">Due:</span>
                    {task.dueDate ? format(task.dueDate, "PPP") : "No due date"}
                  </span>

                  {/* Priority Badge - Show on mobile below due date */}
                  <div className="sm:hidden">
                    <Badge
                      variant={TaskPriorityEnum[task.priority]}
                      className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0 text-xs"
                    >
                      <span>{transformStatusEnum(task.priority)}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Right side elements */}
              <div className="hidden sm:flex sm:items-center sm:space-x-3 flex-shrink-0">
                {/* Task Status */}
                <div className="text-sm font-medium">
                  <Badge
                    variant={TaskStatusEnum[task.status]}
                    className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
                  >
                    <span>{transformStatusEnum(task.status)}</span>
                  </Badge>
                </div>

                {/* Task Priority */}
                <div className="text-sm">
                  <Badge
                    variant={TaskPriorityEnum[task.priority]}
                    className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
                  >
                    <span>{transformStatusEnum(task.priority)}</span>
                  </Badge>
                </div>

                {/* Assignee */}
                <div className="flex items-center space-x-2">
                  <ResponsiveAvatar
                    src={profilePicturesData?.profilePictures?.[task.assignedTo?._id || ''] || undefined}
                    alt={task.assignedTo?.name || "Assignee"}
                    fallback={initials}
                    size="md"
                    className="ring-1 ring-border/20"
                  />
                </div>
              </div>

              {/* Mobile Layout - Assignee at bottom right */}
              <div className="flex sm:hidden items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ResponsiveAvatar
                    src={profilePicturesData?.profilePictures?.[task.assignedTo?._id || ''] || undefined}
                    alt={task.assignedTo?.name || "Assignee"}
                    fallback={initials}
                    size="sm"
                    className="ring-1 ring-border/20"
                  />
                  <span className="text-xs text-gray-600">{task.assignedTo?.name}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentTasks;
