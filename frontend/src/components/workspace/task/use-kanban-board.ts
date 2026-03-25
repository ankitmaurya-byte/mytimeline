import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { useSSEEvents } from '@/hooks/use-sse-events';
import { getAllTasksQueryFn, editTaskMutationFn, deleteTaskMutationFn } from '@/lib/api';
import { TaskType } from '@/types/api.type';
import { TaskStatusEnum, TaskStatusEnumType } from '@/constant';
import { useKanbanStore, useTaskSyncStore, Column } from '@/stores';
import { toast } from '@/hooks/use-toast';
import { getBaseColumns, getStatusConfig, getGridLayoutClasses, triggerTaskUpdateEvent, triggerGlobalRefresh } from './kanban-utils';
import { invalidateAllTaskQueries } from '@/lib/cache-utils';
import { useProfilePictures } from '@/hooks/use-profile-pictures';

export const useKanbanBoard = () => {
    // Hook logic - SSR handled by "use client" directive in component
    const params = useParams<Record<string, string>>();
    const urlWorkspaceId = params?.workspaceId as string;
    const projectId = params?.projectId as string | undefined;
    const initRef = useRef(false);

    const workspaceId = useWorkspaceId() || urlWorkspaceId;
    const queryClient = useQueryClient();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');

        // Zustand stores
        const {
            customColumns,
            showAddSection,
            selectedTask,
            showTaskModal,
            isDragging,
            dragOverColumn,
            showEditDialog,
            showDeleteDialog,
            taskToDelete,
            setCustomColumns,
            addCustomColumn,
            removeCustomColumn,
            toggleAddSection,
            selectTask,
            toggleTaskModal,
            setDragging,
            setDragOverColumn,
            toggleEditDialog,
            toggleDeleteDialog,
            setTaskToDelete,
            getAvailableStatusSections,
            resetUIState
        } = useKanbanStore();

        // Task sync store for real-time updates
        const {
            lastTaskCreated,
            lastTaskUpdated,
            lastTaskDeleted,
            lastTaskStatusChanged,
            lastGlobalRefresh
        } = useTaskSyncStore();

        // Memoize query key to prevent unnecessary re-renders
        const queryKey = useMemo(() =>
            projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId],
            [workspaceId, projectId]
        );

        // Memoize query function to prevent recreation on every render
        const queryFn = useCallback(() => {
            return getAllTasksQueryFn({ workspaceId, projectId });
        }, [workspaceId, projectId]);

        // Enhanced query with caching and automatic sync
        const { data, isLoading, error, refetch } = useQuery({
            queryKey,
            queryFn,
            enabled: !!workspaceId,
            staleTime: 5 * 60 * 1000, // 5 minutes cache for better performance
            gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
            refetchOnWindowFocus: false, // Disable refetch on focus
            refetchOnMount: false, // Disable refetch on mount to prevent snapback
            refetchOnReconnect: false, // Disable refetch on reconnect
            refetchInterval: false, // Disable interval refetching
            retry: false // Disable retries to prevent unwanted refetches
        });

        // Cleanup pending task updates on unmount
        useEffect(() => {
            return () => {
                // Clear all pending timeouts
                updateQueueRef.current.forEach(({ timeout }) => {
                    clearTimeout(timeout);
                });
                updateQueueRef.current.clear();
            };
        }, []);

        // Log query state changes
        useEffect(() => {
            if (data) {
            }
            if (error) {
            }
        }, [data, error, workspaceId, projectId]);

        // Workload map: userId -> number of tasks assigned
        const assigneeTaskCounts = useMemo(() => {
            const map: Record<string, number> = {};
            const all = data?.tasks || [];
            for (const t of all) {
                const id = t.assignedTo?._id;
                if (id) map[id] = (map[id] || 0) + 1;
            }
            return map;
        }, [data?.tasks]);

        // Debounce ref for cache invalidation
        const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        
        // Debounce ref for task updates to prevent rate limiting
        const updateQueueRef = useRef<Map<string, { status: TaskStatusEnumType; timeout: NodeJS.Timeout }>>(new Map());

        // Enhanced mutation with better caching and real-time sync
        const { mutate: updateTaskStatus, isPending: isUpdating } = useMutation({
            mutationFn: editTaskMutationFn,
            onMutate: async (variables) => {
                // Cancel outgoing refetches
                const queryKey = projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId];
                await queryClient.cancelQueries({ queryKey });

                // Snapshot previous state for rollback
                const previousData = queryClient.getQueryData(queryKey);

                // Optimistic update
                queryClient.setQueryData(queryKey, (old: any) => {
                    if (!old?.data?.tasks) return old;

                    const updatedTasks = old.data.tasks.map((task: any) =>
                        task._id === variables.taskId 
                            ? { ...task, ...variables.data }
                            : task
                    );

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            tasks: updatedTasks
                        }
                    };
                });

                return { previousData, queryKey };
            },
            onError: (err, variables, context: any) => {
                // Rollback to previous state
                if (context?.previousData && context?.queryKey) {
                    queryClient.setQueryData(context.queryKey, context.previousData);
                }
                
                toast({
                    title: "Failed to update task",
                    description: "Changes reverted",
                    variant: "destructive"
                });
            },
            onSuccess: (data, variables, context) => {
                // Update the kanban board cache with the server response
                const currentQueryKey = projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId];
                
                if (data && 'data' in data && data.data) {
                    queryClient.setQueryData(currentQueryKey, (oldData: any) => {
                        if (!oldData?.data?.tasks) return oldData;

                        const updatedTasks = oldData.data.tasks.map((task: any) =>
                            task._id === (data as any).data._id ? { ...task, ...(data as any).data } : task
                        );

                        return {
                            ...oldData,
                            data: {
                                ...oldData.data,
                                tasks: updatedTasks
                            }
                        };
                    });
                }

                // Trigger custom event for other components to update
                console.log('🔄 Kanban Board: Triggering task-updated event for workspace:', workspaceId);
                // Create custom event with task data
                const updateEvent = new CustomEvent('task-updated', {
                    detail: { 
                        type: 'updated', 
                        workspaceId, 
                        projectId,
                        taskId: variables.taskId,
                        changes: variables.data
                    }
                });
                window.dispatchEvent(updateEvent);

                // Immediately invalidate other views for real-time sync
                queryClient.invalidateQueries({
                    queryKey: ['all-tasks', workspaceId],
                    exact: false
                });
                queryClient.invalidateQueries({
                    queryKey: ['calendar-tasks', workspaceId],
                    exact: false
                });

                if (projectId) {
                    queryClient.invalidateQueries({ 
                        queryKey: ['project-analytics', projectId]
                    });
                }

                setTimeout(() => resetUIState(), 0);
            }
        });

        // Delete task mutation with real-time sync
        const { mutate: deleteTask, isPending: isDeleting } = useMutation({
            mutationFn: deleteTaskMutationFn,
            onSuccess: () => {
                // Refetch kanban board data (delete requires fresh data)
                refetch();

                // Invalidate other views without forcing immediate refetch
                queryClient.invalidateQueries({
                    queryKey: ['all-tasks', workspaceId],
                    exact: false
                });
                queryClient.invalidateQueries({
                    queryKey: ['calendar-tasks', workspaceId],
                    exact: false
                });

                if (projectId) {
                    queryClient.invalidateQueries({ 
                        queryKey: ['project-analytics', projectId]
                    });
                }

                toast({ title: "Success", description: "Task deleted successfully", variant: "success" });
                setTimeout(() => {
                    toggleDeleteDialog();
                    setTaskToDelete(null);
                    resetUIState();
                }, 0);
            },
            onError: (error: any) => {
                toast({
                    title: "Error",
                    description: error.message || "Failed to delete task",
                    variant: "destructive",
                });
            }
        });

        // Auto-refresh data when component becomes visible or regains focus
        useEffect(() => {
            let lastRefreshTime = Date.now();
            
            const handleVisibilityChange = () => {
                // Smart refresh: only if tab was hidden for >60 seconds
                if (!document.hidden && workspaceId) {
                    const timeSinceRefresh = Date.now() - lastRefreshTime;
                    if (timeSinceRefresh > 60000) { // 1 minute
                        refetch();
                        lastRefreshTime = Date.now();
                    }
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }, [workspaceId, refetch]);

        // Listen for Zustand-based sync triggers - Only for other components, not kanban board
        useEffect(() => {
            if (workspaceId && (lastTaskCreated > 0 || lastTaskUpdated > 0 || lastTaskDeleted > 0 || lastTaskStatusChanged > 0 || lastGlobalRefresh > 0)) {
                // Update other components without touching kanban board
                queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
                queryClient.invalidateQueries({
                    queryKey: ['calendar-tasks', workspaceId],
                    exact: false // This will match any query starting with ['calendar-tasks', workspaceId]
                });

                if (projectId) {
                    queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
                }

            }
        }, [workspaceId, lastTaskCreated, lastTaskUpdated, lastTaskDeleted, lastTaskStatusChanged, lastGlobalRefresh, queryClient, projectId]);

        // Stable SSE callback functions to prevent infinite reconnections
        const handleTaskUpdated = useCallback((data: any) => {
            // console.log('📥 Kanban: Received task-updated via SSE - taskId:', data.taskId);
            // console.log('📥 Kanban: Current workspaceId:', workspaceId);
            // console.log('📥 Kanban: Current projectId:', projectId);
            // console.log('📥 Kanban: SSE data keys:', Object.keys(data));

            const { workspaceId: eventWorkspaceId, projectId: eventProjectId, taskId, changes } = data;
            // console.log('📥 Kanban: Extracted values:', { eventWorkspaceId, eventProjectId, taskId, changesKeys: changes ? Object.keys(changes) : 'no changes' });

            if (eventWorkspaceId === workspaceId && (!projectId || eventProjectId === projectId)) {
                // console.log('✅ Kanban: Workspace/Project match confirmed, updating cache optimistically');

                // Update the cache immediately for instant UI feedback
                const queryKey = projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId];
                // console.log('🔍 Kanban: Using query key:', queryKey);
                // console.log('🔍 Kanban: All available query keys in cache:', queryClient.getQueryCache().getAll().map(q => q.queryKey));

                queryClient.setQueryData(queryKey, (oldData: any) => {
                    // console.log('🔍 Kanban: Cache has data:', !!oldData, 'has tasks:', !!oldData?.tasks);
                    // console.log('🔍 Kanban: Looking for taskId:', taskId);
                    // console.log('🔍 Kanban: Available tasks count:', oldData?.tasks?.length || 0);

                    if (!oldData?.tasks) {
                        // console.log('❌ Kanban: No tasks found in cache data');
                        return oldData;
                    }

                    const updatedTasks = oldData.tasks.map((task: any) => {
                        if (task._id === taskId) {
                            // console.log('🔄 Kanban: Found and updating task in cache:', taskId, 'with changes:', changes);
                            // console.log('🔄 Kanban: Updating task:', taskId);
                            const updatedTask = { ...task, ...changes, updatedAt: new Date().toISOString() };
                            // console.log('🔄 Kanban: Task updated successfully');
                            return updatedTask;
                        }
                        return task;
                    });

                    // console.log('✅ Kanban: Cache updated with', updatedTasks.length, 'tasks');
                    return { ...oldData, tasks: updatedTasks };
                });

                // Also invalidate to ensure fresh data on next fetch
                queryClient.invalidateQueries({ queryKey });
                // console.log('✅ Kanban: Cache updated and invalidated for instant update');
            } else {
                // console.log('❌ Kanban: Workspace/Project ID mismatch:', eventWorkspaceId, eventProjectId, 'vs', workspaceId, projectId);
            }
        }, [workspaceId, projectId, queryClient]);

        const handleTaskCreated = useCallback((data: any) => {
            // console.log('📥 Kanban: Received task-created via SSE - taskId:', data?.taskId);
            const { workspaceId: eventWorkspaceId, projectId: eventProjectId, task } = data;
            if (eventWorkspaceId === workspaceId && (!projectId || eventProjectId === projectId)) {
                // console.log('✅ Kanban: Adding new task to cache for instant UI update');

                // Add the new task to the cache immediately
                const queryKey = projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId];
                queryClient.setQueryData(queryKey, (oldData: any) => {
                    if (!oldData?.tasks) return oldData;

                    // console.log('🔄 Kanban: Adding new task to cache:', task);
                    return { ...oldData, tasks: [...oldData.tasks, task] };
                });

                // Also invalidate to ensure fresh data
                queryClient.invalidateQueries({ queryKey });
                // console.log('✅ Kanban: New task added to cache for instant update');
            } else {
                // console.log('❌ Kanban: Workspace/Project ID mismatch:', eventWorkspaceId, eventProjectId, 'vs', workspaceId, projectId);
            }
        }, [workspaceId, projectId, queryClient]);

        const handleTaskDeleted = useCallback((data: any) => {
            // console.log('📥 Kanban: Received task-deleted via SSE - taskId:', data?.taskId);
            const { workspaceId: eventWorkspaceId, projectId: eventProjectId, taskId } = data;
            if (eventWorkspaceId === workspaceId && (!projectId || eventProjectId === projectId)) {
                // console.log('✅ Kanban: Removing deleted task from cache for instant UI update');

                // Remove the deleted task from cache immediately
                const queryKey = projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId];
                queryClient.setQueryData(queryKey, (oldData: any) => {
                    if (!oldData?.tasks) return oldData;

                    // console.log('🔄 Kanban: Removing task from cache:', taskId);
                    return { ...oldData, tasks: oldData.tasks.filter((task: any) => task._id !== taskId) };
                });

                // Also invalidate to ensure fresh data
                queryClient.invalidateQueries({ queryKey });
                // console.log('✅ Kanban: Task removed from cache for instant update');
            } else {
                // console.log('❌ Kanban: Workspace/Project ID mismatch:', eventWorkspaceId, eventProjectId, 'vs', workspaceId, projectId);
            }
        }, [workspaceId, projectId, queryClient]);

        // Use SSE for real-time updates
        const { isConnected: sseConnected } = useSSEEvents({
            onTaskUpdated: handleTaskUpdated,
            onTaskCreated: handleTaskCreated,
            onTaskDeleted: handleTaskDeleted,
            enabled: true
        });

        // console.log('🔔 Kanban: SSE connection status:', sseConnected);
        // console.log('🔔 Kanban: SSE callbacks registered:', {
        //     onTaskUpdated: !!handleTaskUpdated,
        //     onTaskCreated: !!handleTaskCreated,
        //     onTaskDeleted: !!handleTaskDeleted
        // });

        // Extract unique user IDs from tasks for profile picture fetching
        const userIds = useMemo(() => {
            if (!data?.tasks) return [];
            const ids = data.tasks
                .map(task => task.assignedTo?._id)
                .filter((id): id is string => !!id);
            return [...new Set(ids)]; // Remove duplicates
        }, [data?.tasks]);

        // Fetch profile pictures separately
        const { data: profilePicturesData } = useProfilePictures(userIds);



        // Transform tasks to columns with memoization
        const transformTasksToColumns = useCallback((tasks: TaskType[]) => {
            if (!tasks || tasks.length === 0) return [];

            const baseColumns: Column[] = getBaseColumns().map(baseCol => ({
                ...baseCol,
                tasks: tasks.filter(task => task.status === baseCol.id)
            }));

            // Add custom columns with proper task filtering
            const customColumnsWithTasks = customColumns.map(customCol => ({
                ...customCol,
                tasks: tasks.filter(task => task.status === customCol.id)
            }));

            // Combine base columns with custom columns
            const allColumns = [...baseColumns, ...customColumnsWithTasks];
            return allColumns;
        }, [customColumns]);

        // Use local columns for immediate updates, fallback to cached data
        const columns = useMemo(() => {
            const result = transformTasksToColumns(data?.tasks || []);
            return result;
        }, [data?.tasks, transformTasksToColumns]);

        // For relative coloring we need the maximum tasks in any column
        const maxColumnTasks = useMemo(() => {
            return columns.reduce((m, c) => Math.max(m, c.tasks.length), 0);
        }, [columns]);

        // Add new status section
        const handleAddSection = (status: string) => {
            const config = getStatusConfig(status);

            const newColumn: Column = {
                id: status as TaskStatusEnumType,
                title: config.title,
                color: config.color,
                bgColor: config.bgColor,
                borderColor: config.borderColor,
                tasks: []
            };

            // Debug logging removed
            addCustomColumn(newColumn);
            toggleAddSection();
        };

        // Remove custom column
        const handleRemoveCustomColumn = (columnId: string) => {
            removeCustomColumn(columnId);
        };

        // Event handlers
        const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: TaskType, columnId: string) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card._id);
            setDragging(true);
        };

        const handleDragEnd = () => {
            setDragging(false);
            setDragOverColumn(null);
        };

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
        };

        const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
            e.preventDefault();
            setDragOverColumn(columnId);
        };

        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverColumn(null);
            }
        };

        const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');

            if (!taskId) return;

            // Find the task being dragged
            const task = data?.tasks.find(t => t._id === taskId);
            if (!task) return;

            // Only update backend if status actually changed
            if (task.status !== targetColumnId) {
                // Use the exact same query key as the useQuery
                const queryKey = projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId];
                const cacheData = queryClient.getQueryData(queryKey) as any;

                if (cacheData?.tasks) {
                    // Optimistically update the UI immediately
                    queryClient.setQueryData(queryKey, (old: any) => {
                        if (!old?.tasks) return old;

                        const updatedTasks = old.tasks.map((t: TaskType) =>
                            t._id === taskId
                                ? { ...t, status: targetColumnId as TaskStatusEnumType }
                                : t
                        );

                        return {
                            ...old,
                            tasks: updatedTasks
                        };
                    });
                }

                // **DEBOUNCED UPDATE**: Cancel previous pending update for this task
                const existingUpdate = updateQueueRef.current.get(taskId);
                if (existingUpdate) {
                    clearTimeout(existingUpdate.timeout);
                }

                // Schedule the API call with a 300ms delay
                const timeout = setTimeout(() => {
                    updateTaskStatus({
                        taskId: task._id,
                        workspaceId,
                        projectId: task.project?._id || projectId || "",
                        data: {
                            status: targetColumnId as TaskStatusEnumType
                        }
                    });
                    
                    // Remove from queue after sending
                    updateQueueRef.current.delete(taskId);
                }, 300); // 300ms debounce

                // Store in queue
                updateQueueRef.current.set(taskId, {
                    status: targetColumnId as TaskStatusEnumType,
                    timeout
                });
            }

            setDragging(false);
            setDragOverColumn(null);
        };

        const handleTaskClick = useCallback((task: TaskType) => {
            selectTask(task);
            toggleTaskModal();
        }, [selectTask, toggleTaskModal]);

        const handleEditTask = (task: TaskType) => {
            selectTask(task);
            toggleEditDialog();
        };

        const handleDeleteTask = (task: TaskType) => {
            setTaskToDelete(task);
            toggleDeleteDialog();
        };

        const handleConfirmDelete = () => {
            if (taskToDelete) {
                const projectId = taskToDelete.project?._id || "";

                if (!projectId) {
                    toast({
                        title: "Error",
                        description: "Cannot delete task: Task is not associated with a project",
                        variant: "destructive",
                    });
                    return;
                }

                deleteTask({
                    workspaceId,
                    taskId: taskToDelete._id,
                    projectId
                });
            }
        };

        const gridLayoutClasses = getGridLayoutClasses(columns.length);

        // Cleanup effect to clear timeout on unmount
        useEffect(() => {
            return () => {
                if (invalidationTimeoutRef.current) {
                    clearTimeout(invalidationTimeoutRef.current);
                }
            };
        }, []);

        const result = {
            // State
            workspaceId,
            projectId,
            isMobile,
            isTablet,
            isLoading,
            error,
            columns,
            maxColumnTasks,
            assigneeTaskCounts,
            profilePictures: profilePicturesData?.profilePictures,
            dragOverColumn,
            showAddSection,
            selectedTask,
            showTaskModal,
            showEditDialog,
            showDeleteDialog,
            taskToDelete,
            isDeleting,
            isUpdating,
            availableStatusSections: getAvailableStatusSections(),

            // Actions
            refetch,
            handleAddSection,
            handleRemoveCustomColumn,
            handleDragStart,
            handleDragEnd,
            handleDragOver,
            handleDragEnter,
            handleDragLeave,
            handleDrop,
            handleTaskClick,
            handleEditTask,
            handleDeleteTask,
            handleConfirmDelete,
            toggleAddSection,
            toggleTaskModal,
            toggleEditDialog,
            toggleDeleteDialog,
            selectTask,
            setTaskToDelete,
            resetUIState,

            // Computed
            gridLayoutClasses
        };

        return result;
};

// Custom hook for other components to trigger kanban board updates
export const useKanbanSync = (workspaceId: string, projectId?: string) => {
    const triggerUpdate = useCallback((type: 'created' | 'updated' | 'deleted' | 'status-changed') => {
        triggerTaskUpdateEvent(type, workspaceId, projectId);
    }, [workspaceId, projectId]);

    const triggerRefresh = useCallback(() => {
        triggerGlobalRefresh(workspaceId);
    }, [workspaceId]);

    return { triggerUpdate, triggerRefresh };
};
