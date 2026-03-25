// import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { editTaskMutationFn } from '@/lib/api';
import { useAuthContext } from '@/context/useAuthContext';
import { useTaskSyncStore } from '@/stores'; // Import the Zustand sync store

interface TaskCompletionToggleProps {
    taskId: string;
    projectId: string;
    isCompleted: boolean;
}

export function TaskCompletionToggle({ taskId, projectId, isCompleted }: TaskCompletionToggleProps) {
    const queryClient = useQueryClient();
    const { workspace } = useAuthContext();
    const workspaceId = workspace?._id;
    const { triggerTaskStatusChanged } = useTaskSyncStore();

    const mutation = useMutation({
        mutationFn: (data: { taskId: string; projectId: string; workspaceId: string; isCompleted: boolean }) =>
            editTaskMutationFn({
                taskId: data.taskId,
                projectId: data.projectId,
                workspaceId: data.workspaceId,
                data: { status: data.isCompleted ? 'DONE' : 'TODO' }
            }),
        onSuccess: () => {
            // Invalidate all task-related queries
            queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['calendar-tasks', workspaceId] });
            // Also invalidate project analytics to update the completed task count immediately
            queryClient.invalidateQueries({ queryKey: ["project-analytics", projectId] });
            // Trigger Zustand sync
            triggerTaskStatusChanged();
            toast({
                title: 'Success',
                description: `Task marked as ${!isCompleted ? 'completed' : 'incomplete'}`,
            });
        },
        onError: (error) => {
            console.error('Failed to update task:', error);
            toast({
                title: 'Error',
                description: 'Failed to update task status',
                variant: 'destructive',
            });
        },
    });

    const handleToggle = () => {
        if (!workspaceId) return;
        mutation.mutate({
            taskId,
            projectId,
            workspaceId,
            isCompleted: !isCompleted
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={mutation.isPending}
            className={`
        flex items-center justify-center p-1 rounded-full transition-all duration-200 border-2
        ${isCompleted
                    ? 'text-green-600 hover:text-green-700 border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'text-gray-400 hover:text-green-500 border-slate-400 dark:border-slate-500 bg-gray-50 dark:bg-gray-800/50'
                }
        ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        hover:bg-gray-100 dark:hover:bg-gray-800
      `}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
            {isCompleted ? (
                <CheckCircle className="h-5 w-5" />
            ) : (
                <Circle className="h-5 w-5" />
            )}
        </button>
    );
}
