import { QueryClient } from '@tanstack/react-query';

/**
 * Utility function to invalidate all task-related queries
 * This ensures that when a task is updated, all views are refreshed
 */
export function invalidateAllTaskQueries(
    queryClient: QueryClient,
    workspaceId: string,
    projectId?: string
) {
    // Invalidate all possible task query keys EXCEPT the current kanban board
    // This prevents the task from snapping back to original position
    const allTaskQueryKeys = [
        ['all-tasks', workspaceId],
        ['calendar-tasks', workspaceId],
        ['tasks', workspaceId], // For task table
    ];

    // Filter out the kanban board query to prevent task snapback
    // The kanban board uses ['tasks', workspaceId] when projectId is undefined
    const kanbanBoardQuery = projectId ? ['tasks', workspaceId, projectId] : ['tasks', workspaceId];

    const taskQueryKeys = allTaskQueryKeys.filter(queryKey => {
        // Don't invalidate the kanban board query
        if (JSON.stringify(queryKey) === JSON.stringify(kanbanBoardQuery)) {
            return false;
        }
        return true;
    }).filter(key => !key.some(item => item === undefined)); // Remove any keys that contain undefined

    // Invalidate each query key (this marks them as stale)
    taskQueryKeys.forEach(queryKey => {
        const result = queryClient.invalidateQueries({ queryKey });
    });

    // Also invalidate project analytics if projectId is provided
    if (projectId) {
        const analyticsResult = queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
    }

    // Only refetch the most critical queries to avoid rate limiting
    // Refetch recent tasks immediately, but NOT the kanban board
    const recentTasksResult = queryClient.refetchQueries({
        queryKey: ['all-tasks', workspaceId],
        type: 'active' // Only refetch if component is currently mounted
    });
}

/**
 * Utility function to force refetch all task queries
 * Use this when you need immediate data refresh
 */
export function refetchAllTaskQueries(
    queryClient: QueryClient,
    workspaceId: string,
    projectId?: string
) {
    const taskQueryKeys = [
        ['tasks', workspaceId, projectId],
        ['all-tasks', workspaceId],
        ['calendar-tasks', workspaceId],
        ['tasks', workspaceId],
    ];

    taskQueryKeys.forEach(queryKey => {
        queryClient.refetchQueries({ queryKey });
    });
}
