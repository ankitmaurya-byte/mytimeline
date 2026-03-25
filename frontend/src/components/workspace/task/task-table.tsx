"use client";
import { FC, useState, useEffect } from "react";
import { getColumns } from "./table/columns";
import { DataTable } from "./table/table";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Calendar, User, FolderOpen, Tag, CheckCircle2, PartyPopper, Sparkles, Search, Filter } from "lucide-react";
import { DataTableFacetedFilter } from "./table/table-faceted-filter";
import { priorities, statuses } from "./table/data";
import useTaskTableFilter from "@/hooks/use-task-table-filter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getAllTasksQueryFn, editTaskMutationFn } from "@/lib/api";
import { TaskType } from "@/types/api.type";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TaskStatusEnum, TaskPriorityEnum } from "@/constant";
import { formatStatusToEnum } from "@/lib/helper";
import TaskCompletionToggle from "@/components/workspace/taskCompletetionToggle";
import { DataTableRowActions } from "./table/table-row-actions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTaskSyncStore } from "@/stores"; // Import the Zustand sync store
import { useProfilePictures } from "@/hooks/use-profile-pictures";
import { useMemo } from "react";

type Filters = ReturnType<typeof useTaskTableFilter>[0];
type SetFilters = ReturnType<typeof useTaskTableFilter>[1];

interface DataTableFilterToolbarProps {
  isLoading?: boolean;
  projectId?: string;
  filters: Filters;
  setFilters: SetFilters;
}

// Celebration Ribbon Component
const CelebrationRibbon = ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-3xl p-4 sm:p-8 mx-4 shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm sm:max-w-md">
        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <PartyPopper className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-300 animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-yellow-200 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-2">🎉 Task Completed! 🎉</h2>
          <p className="text-base sm:text-lg mb-6 text-green-100">Great job! You've successfully completed this task.</p>

          <Button
            onClick={onClose}
            className="bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
          >
            Awesome! ✨
          </Button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};

const TaskTable = () => {
  const params = useParams<Record<string, string>>();
  const urlWorkspaceId = params?.workspaceId as string;
  const projectId = params?.projectId as string | undefined;
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { triggerTaskStatusChanged } = useTaskSyncStore();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sorting, setSorting] = useState<{ field: string; order: 'asc' | 'desc' } | null>(null);

  const [filters, setFilters] = useTaskTableFilter();
  const workspaceId = useWorkspaceId() || urlWorkspaceId;

  const { data, isLoading } = useQuery({
    queryKey: [
      "all-tasks",
      workspaceId,
      pageSize,
      pageNumber,
      filters,
      projectId,
      sorting,
    ],
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        keyword: filters.keyword,
        priority: filters.priority,
        status: filters.status,
        projectId: projectId || filters.projectId,
        assignedTo: filters.assigneeId,
        pageNumber,
        pageSize,
        sortBy: sorting?.field || null,
        sortOrder: sorting?.order || null,
      }),
    staleTime: 30 * 1000, // 30 seconds cache (reduced for better sync)
    refetchOnWindowFocus: false, // Disable refetch on focus
    refetchOnMount: true, // Enable refetch on mount for fresh data
    refetchOnReconnect: true, // Allow refetch on reconnect
  });

  // Mutation for updating task status
  const { mutate: updateTaskStatus, isPending: isUpdating } = useMutation({
    mutationFn: editTaskMutationFn,
  });

  const tasks: TaskType[] = data?.tasks || [];
  const totalCount = data?.pagination.totalCount || 0;

  // Extract unique user IDs from tasks for profile picture fetching
  const userIds = useMemo(() => {
    if (!tasks) return [];
    const ids = tasks
      .map(task => task.assignedTo?._id)
      .filter((id): id is string => !!id);
    return [...new Set(ids)]; // Remove duplicates
  }, [tasks]);

  // Fetch profile pictures separately
  const { data: profilePicturesData } = useProfilePictures(userIds);

  const columns = getColumns(projectId as string | undefined, profilePicturesData?.profilePictures);

  // Listen for WebSocket task events
  useEffect(() => {
    // console.log('🔧 Task Table: Setting up WebSocket event listeners for workspace:', workspaceId);

    // Test event listener setup
    const testEvent = new CustomEvent('task-updated', {
      detail: {
        type: 'updated',
        workspaceId: workspaceId,
        projectId: 'test-project',
        taskId: 'test-task',
        updatedBy: 'test-user'
      }
    });
    // console.log('🧪 Task Table: Test event created:', testEvent.detail);

    const handleTaskCreated = (event: CustomEvent) => {
      // console.log('📥 Task Table: Received task-created event:', event.detail);
      const { workspaceId: eventWorkspaceId } = event.detail;
      if (eventWorkspaceId === workspaceId) {
        // console.log('✅ Task Table: Invalidating queries for task creation');
        queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId], exact: false, refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId], exact: false });
        queryClient.invalidateQueries({ queryKey: ['calendar-tasks', workspaceId], exact: false });
      } else {
        // console.log('❌ Task Table: Workspace ID mismatch:', eventWorkspaceId, 'vs', workspaceId);
      }
    };

    const handleTaskUpdated = (event: CustomEvent) => {
      console.log('📥 Task Table: Received task-updated event:', event.detail);
      const { workspaceId: eventWorkspaceId, taskId, changes } = event.detail;
      if (eventWorkspaceId === workspaceId) {
        console.log('✅ Task Table: Processing task update for workspace:', workspaceId);

        // Force refetch to get latest data
        console.log('🔄 Task Table: Forcing refetch after task update');
        queryClient.refetchQueries({ queryKey: ["all-tasks", workspaceId], exact: false });

        console.log('✅ Task Table: Refetch triggered for instant update');
      } else {
        console.log('❌ Task Table: Workspace ID mismatch:', eventWorkspaceId, 'vs', workspaceId);
      }
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      // console.log('📥 Task Table: Received task-deleted event:', event.detail);
      const { workspaceId: eventWorkspaceId } = event.detail;
      if (eventWorkspaceId === workspaceId) {
        // console.log('✅ Task Table: Invalidating queries for task deletion');
        queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId], exact: false, refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId], exact: false });
        queryClient.invalidateQueries({ queryKey: ['calendar-tasks', workspaceId], exact: false });
      } else {
        // console.log('❌ Task Table: Workspace ID mismatch:', eventWorkspaceId, 'vs', workspaceId);
      }
    };

    window.addEventListener('task-created', handleTaskCreated as EventListener);
    window.addEventListener('task-updated', handleTaskUpdated as EventListener);
    window.addEventListener('task-deleted', handleTaskDeleted as EventListener);

    return () => {
      // console.log('🧹 Task Table: Cleaning up WebSocket event listeners');
      window.removeEventListener('task-created', handleTaskCreated as EventListener);
      window.removeEventListener('task-updated', handleTaskUpdated as EventListener);
      window.removeEventListener('task-deleted', handleTaskDeleted as EventListener);
    };
  }, [workspaceId, queryClient]);

  // Test function to manually trigger WebSocket event
  const testWebSocketEvent = () => {
    // console.log('🧪 Testing WebSocket event manually...');
    const testEvent = new CustomEvent('task-updated', {
      detail: {
        type: 'updated',
        workspaceId: workspaceId,
        projectId: 'test-project',
        taskId: 'test-task',
        updatedBy: 'test-user'
      }
    });
    window.dispatchEvent(testEvent);
    // console.log('🧪 Test event dispatched');
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  // Handle page size changes
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };

  // Handle sorting changes
  const handleSortingChange = (field: string, order: 'asc' | 'desc') => {
    setSorting({ field, order });
    setPageNumber(1); // Reset to first page when sorting changes
  };

  // Handle task completion toggle with celebration
  const handleTaskComplete = async (task: TaskType) => {
    try {
      const newStatus = task.status === TaskStatusEnum.DONE ? TaskStatusEnum.IN_PROGRESS : TaskStatusEnum.DONE;
      const payload = {
        workspaceId,
        projectId: task.project?._id || "",
        taskId: task._id,
        data: {
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          status: newStatus,
          assignedTo: task.assignedTo?._id || "",
          dueDate: task.dueDate || new Date().toISOString(),
        },
      };

      updateTaskStatus(payload, {
        onSuccess: () => {
          // Show celebration only when completing a task
          if (newStatus === TaskStatusEnum.DONE) {
            setShowCelebration(true);
            // Auto-hide celebration after 5 seconds
            setTimeout(() => {
              setShowCelebration(false);
            }, 5000);
          }

          // Invalidate all task-related queries
          queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
          queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
          queryClient.invalidateQueries({ queryKey: ['calendar-tasks', workspaceId] });

          // Also invalidate project analytics to update the completed task count immediately
          if (task.project?._id) {
            queryClient.invalidateQueries({ queryKey: ["project-analytics", task.project._id] });
          }

          // Trigger Zustand sync
          triggerTaskStatusChanged();
        },
        onError: (error) => {
          console.error('Failed to complete task:', error);
          // You could add a toast notification here for error
        },
      });

    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  // Mobile Task Card Component
  const MobileTaskCard = ({ task }: { task: TaskType }) => {
    const isCompleted = task.status === TaskStatusEnum.DONE;
    const status = statuses.find((s) => s.value === task.status);
    const priority = priorities.find((p) => p.value === task.priority);
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatusEnum.DONE;
    const isHighPriority = task.priority === "HIGH";

    // Enhanced priority color scheme for better dark mode
    const getPriorityColors = () => {
      switch (task.priority) {
        case "HIGH":
          return {
            bg: "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-green-500",
            border: "border-red-200 dark:border-red-800/50",
            accent: "bg-red-500",
            text: "text-red-700 dark:text-red-300"
          };
        case "MEDIUM":
          return {
            bg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
            border: "border-amber-200 dark:border-amber-800/50",
            accent: "bg-amber-500",
            text: "text-amber-700 dark:text-amber-300"
          };
        case "LOW":
          return {
            bg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
            border: "border-blue-200 dark:border-blue-800/50",
            accent: "bg-blue-500",
            text: "text-blue-700 dark:text-blue-300"
          };
        default:
          return {
            bg: "bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/20 dark:to-gray-800/20",
            border: "border-slate-200 dark:border-slate-700/50",
            accent: "bg-slate-500",
            text: "text-slate-700 dark:text-slate-300"
          };
      }
    };

    const priorityColors = getPriorityColors();

    return (
      <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-xl ${isCompleted
        ? 'border-green-200 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/60'
        : `${priorityColors.border} ${priorityColors.bg}`
        }`}>
        {/* Priority indicator bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${priorityColors.accent}`} />

        {/* Main card content */}
        <div className="py-4 sm:py-5 px-3 sm:px-4 space-y-3 sm:space-y-4">
          {/* Header with Task Code and Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center min-w-0 flex-1">
              {/* Task Code Badge */}
              <div className="relative">
                <Badge
                  variant="outline"
                  className={`font-semibold text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${isCompleted
                    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/70 dark:text-green-300 dark:border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600'
                    }`}
                >
                  {task.taskCode}
                </Badge>
                {isHighPriority && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>

            {/* Completion Toggle */}
            <div className="relative flex-shrink-0">
              {isMobile ? (
                <button
                  onClick={() => handleTaskComplete(task)}
                  disabled={isUpdating}
                  className={`flex items-center px-2 sm:px-3 py-1.5 rounded-full border font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${isCompleted
                    ? "bg-green-100 dark:bg-green-900/70 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-green-400 dark:border-green-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
                >
                  {isCompleted ? (
                    <>
                      <span className="hidden sm:inline">Mark as Incomplete</span>
                      <span className="sm:hidden">Incomplete</span>
                    </>
                  ) : isUpdating ? (
                    <>
                      <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span className="hidden sm:inline ml-1">Updating...</span>
                      <span className="sm:hidden ml-1">...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ml-1">Mark as Complete</span>
                      <span className="sm:hidden ml-1">Complete</span>
                    </>
                  )}
                </button>
              ) : (
                <TaskCompletionToggle task={task} />
              )}
            </div>
          </div>

          {/* Task Title */}
          <div className="min-w-0">
            <h3 className={`text-base sm:text-lg font-semibold leading-tight ${isCompleted
              ? 'text-gray-400 dark:text-gray-500 line-through decoration-gray-400 dark:decoration-gray-500 decoration-2'
              : 'text-gray-900 dark:text-white'
              }`}>
              {task.title}
            </h3>
          </div>

          {/* Project Info */}
          {!projectId && task.project && (
            <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${isCompleted
              ? 'bg-green-50/50 dark:bg-green-950/60 border-green-200 dark:border-green-700'
              : 'bg-white/70 dark:bg-gray-800/90 border-gray-100 dark:border-gray-700'
              }`}>
              <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-base sm:text-lg ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                {task.project.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium uppercase tracking-wide ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>Project</p>
                <p className={`font-medium truncate text-sm sm:text-base ${isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
                  }`}>{task.project.name}</p>
              </div>
            </div>
          )}

          {/* Assignee */}
          {task.assignedTo && (
            <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${isCompleted
              ? 'bg-green-50/50 dark:bg-green-950/60 border-green-200 dark:border-green-700'
              : 'bg-white/70 dark:bg-gray-800/90 border-gray-100 dark:border-gray-700'
              }`}>
              <Avatar
                className={`h-8 w-8 sm:h-9 sm:w-9 ring-2 ${isCompleted ? 'ring-green-200 dark:ring-green-700' : 'ring-gray-100 dark:ring-gray-700'
                  }`}
              >
                <AvatarImage
                  src={getProfilePictureUrl(profilePicturesData?.profilePictures?.[task.assignedTo._id || ''] || undefined) || undefined}
                  alt={task.assignedTo.name}
                />
                <AvatarFallback className={`${getAvatarColor(task.assignedTo.name)} font-semibold text-xs sm:text-sm`}>
                  {getAvatarFallbackText(task.assignedTo.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium uppercase tracking-wide ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>Assigned to</p>
                <p className={`font-medium truncate text-sm sm:text-base ${isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
                  }`}>{task.assignedTo.name}</p>
              </div>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${isCompleted
              ? 'bg-green-50/50 dark:bg-green-950/60 border-green-200 dark:border-green-700'
              : isOverdue
                ? 'bg-red-50/80 dark:bg-red-950/70 border-red-200 dark:border-red-800'
                : 'bg-white/70 dark:bg-gray-800/90 border-gray-100 dark:border-gray-700'
              }`}>
              <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${isCompleted
                ? 'bg-green-500 text-white'
                : isOverdue
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
                }`}>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium uppercase tracking-wide ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>Due Date</p>
                <p className={`font-medium text-sm sm:text-base ${isCompleted
                  ? 'text-green-700 dark:text-green-300'
                  : isOverdue
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-900 dark:text-white'
                  }`}>
                  {format(new Date(task.dueDate), "MMM dd, yyyy")}
                </p>
                {isOverdue && !isCompleted && (
                  <Badge variant="destructive" className="mt-1 text-xs px-2 py-0.5">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Status and Priority Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {status && (
              <Badge
                variant={TaskStatusEnum[formatStatusToEnum(status.value) as keyof typeof TaskStatusEnum]}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 font-medium text-xs rounded-full"
              >
                {status.icon && <status.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                <span className="text-xs">{status.label}</span>
              </Badge>
            )}
            {priority && (
              <Badge
                variant={TaskPriorityEnum[formatStatusToEnum(priority.value) as keyof typeof TaskPriorityEnum]}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 font-medium text-xs rounded-full"
              >
                {priority.icon && <priority.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                <span className="text-xs">{priority.label}</span>
                {isHighPriority && <span className="text-xs">🔥</span>}
              </Badge>
            )}
          </div>

          {/* Actions Section */}
          <div className={`flex items-center justify-between pt-3 border-t ${isCompleted
            ? 'border-green-200 dark:border-green-700'
            : 'border-gray-100 dark:border-gray-700'
            }`}>
            <div className="flex items-center gap-2">
              {/* Progress indicator for non-completed tasks */}
              {!isCompleted && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-12 sm:w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${priorityColors.accent} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.random() * 100}%` }} />
                  </div>
                  <span className="text-xs">In Progress</span>
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <DataTableRowActions row={{ original: task } as any} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full relative space-y-4">
      {/* Test WebSocket Button - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">WebSocket Debug</h3>
          <Button
            onClick={testWebSocketEvent}
            variant="outline"
            size="sm"
            className="text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600"
          >
            🧪 Test WebSocket Event
          </Button>
        </div>
      )}

      {/* Celebration Ribbon */}
      <CelebrationRibbon
        isVisible={showCelebration}
        onClose={() => setShowCelebration(false)}
      />

      {/* Filters Toolbar */}
      <DataTableFilterToolbar
        isLoading={isLoading}
        projectId={projectId}
        filters={filters}
        setFilters={setFilters}
        showMobileFilters={showMobileFilters}
        setShowMobileFilters={setShowMobileFilters}
      />

      {/* Mobile View - Task Cards */}
      {isMobile ? (
        <div className="space-y-3 sm:space-y-4">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800/80 rounded-lg border border-gray-200 dark:border-slate-700 p-3 sm:p-4 space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {tasks.map((task) => (
                <MobileTaskCard key={task._id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              <div className="space-y-2">
                <p className="text-lg font-medium">No tasks found</p>
                <p className="text-sm">Try adjusting your filters or create a new task.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Desktop View - Data Table */
        <DataTable
          isLoading={isLoading}
          data={tasks}
          columns={columns}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pagination={{
            totalCount,
            pageNumber,
            pageSize,
          }}
          onSortingChange={handleSortingChange}
        />
      )}

      {/* Pagination for Mobile */}
      {isMobile && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-3 sm:p-4 shadow-sm dark:shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Page {pageNumber}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Showing {(pageNumber - 1) * pageSize + 1}-{Math.min(pageNumber * pageSize, totalCount)} of {totalCount} tasks
              </p>
            </div>
            <div className="flex gap-2 justify-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={pageNumber === 1}
                onClick={() => handlePageChange(pageNumber - 1)}
                className="px-3 py-2 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                ← Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pageNumber * pageSize >= totalCount}
                onClick={() => handlePageChange(pageNumber + 1)}
                className="px-3 py-2 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                Next →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DataTableFilterToolbar: FC<DataTableFilterToolbarProps & { showMobileFilters: boolean; setShowMobileFilters: (show: boolean) => void }> = ({
  isLoading,
  projectId,
  filters,
  setFilters,
  showMobileFilters,
  setShowMobileFilters,
}) => {
  const workspaceId = useWorkspaceId();
  const isMobile = useIsMobile();

  const { data } = useGetProjectsInWorkspaceQuery({
    workspaceId,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const projects = data?.projects || [];
  const members = memberData?.members || [];

  // Extract unique user IDs from members for profile picture fetching
  const memberUserIds = useMemo(() => {
    if (!members) return [];
    const ids = members
      .map(member => member.userId?._id)
      .filter((id): id is string => !!id);
    return [...new Set(ids)]; // Remove duplicates
  }, [members]);

  // Fetch profile pictures for filter options
  const { data: memberProfilePicturesData } = useProfilePictures(memberUserIds);

  //Workspace Projects
  const projectOptions = projects?.map((project) => {
    return {
      label: (
        <div className="flex items-center gap-1">
          <span>{project.emoji}</span>
          <span>{project.name}</span>
        </div>
      ),
      value: project._id,
    };
  });

  // Workspace Memebers
  const assigneesOptions = members?.map((member) => {
    const name = member.userId?.name || "Unknown";
    const initials = getAvatarFallbackText(name);

    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={getProfilePictureUrl(memberProfilePicturesData?.profilePictures?.[member.userId._id || ''] || undefined) || undefined}
              alt={name}
            />
            <AvatarFallback className={getAvatarColor(name)}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: member.userId._id,
    };
  });

  const handleFilterChange = (key: keyof Filters, values: string[]) => {
    setFilters({
      ...filters,
      [key]: values.length > 0 ? values.join(",") : null,
    });
  };

  return (
    <div className="mt-1 space-y-4">
      {/* Search Input - Full width on mobile */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={filters.keyword || ""}
          onChange={(e) =>
            setFilters({
              keyword: e.target.value,
            })
          }
          className="h-10 w-full pl-10 pr-4 text-sm"
        />
      </div>

      {/* Mobile Filter Toggle */}
      {isMobile && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      )}

      {/* Filter Section - Responsive Grid */}
      <div className={`${isMobile && !showMobileFilters ? 'hidden' : ''} space-y-3`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status filter */}
          <DataTableFacetedFilter
            title="Status"
            multiSelect={true}
            options={statuses}
            disabled={isLoading}
            selectedValues={filters.status?.split(",") || []
            }
            onFilterChange={(values) => handleFilterChange("status", values)}
          />

          {/* Priority filter */}
          <DataTableFacetedFilter
            title="Priority"
            multiSelect={true}
            options={priorities}
            disabled={isLoading}
            selectedValues={filters.priority?.split(",") || []}
            onFilterChange={(values) => handleFilterChange("priority", values)}
          />

          {/* Assigned To filter */}
          <DataTableFacetedFilter
            title="Assigned To"
            multiSelect={true}
            options={assigneesOptions}
            disabled={isLoading}
            selectedValues={filters.assigneeId?.split(",") || []}
            onFilterChange={(values) => handleFilterChange("assigneeId", values)}
          />

          {!projectId && (
            <DataTableFacetedFilter
              title="Projects"
              multiSelect={false}
              options={projectOptions}
              disabled={isLoading}
              selectedValues={filters.projectId?.split(",") || []}
              onFilterChange={(values) => handleFilterChange("projectId", values)}
            />
          )}
        </div>

        {/* Reset Button - Only show when filters are active */}
        {Object.values(filters).some(
          (value) => value !== null && value !== ""
        ) && (
            <div className="flex justify-center sm:justify-start">
              <Button
                disabled={isLoading}
                variant="ghost"
                className="h-10 px-4 w-full sm:w-auto text-sm"
                onClick={() =>
                  setFilters({
                    keyword: null,
                    status: null,
                    priority: null,
                    projectId: null,
                    assigneeId: null,
                  })
                }
              >
                Reset Filters
                <X className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
      </div>
    </div>
  );
};

export default TaskTable;
