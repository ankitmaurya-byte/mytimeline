import { Button } from "@/components/ui/button";
import { TaskType } from "@/types/api.type";
import { TaskStatusEnum } from "@/constant";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editTaskMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { CheckCircle, Circle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const TaskCompletionToggle = ({ task }: { task: TaskType }) => {
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();

    const { mutate, isPending } = useMutation({
        mutationFn: editTaskMutationFn,
    });

    const isCompleted = task.status === TaskStatusEnum.DONE;

    const handleToggleComplete = () => {
        if (isPending) return;

        const newStatus = isCompleted ? TaskStatusEnum.TODO : TaskStatusEnum.DONE;

        const payload = {
            workspaceId,
            projectId: task.project?._id ?? "",
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

        mutate(payload, {
            onSuccess: () => {
                // Invalidate all task-related queries
                queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
                queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
                queryClient.invalidateQueries({ queryKey: ['calendar-tasks', workspaceId] });
                // Also invalidate project analytics to update the completed task count immediately
                if (task.project?._id) {
                    queryClient.invalidateQueries({ queryKey: ["project-analytics", task.project._id] });
                }
                toast({
                    title: "Success",
                    description: `Task marked as ${isCompleted ? 'incomplete' : 'complete'}`,
                    variant: "success",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update task status",
                    variant: "destructive",
                });
            },
        });
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleComplete}
                        disabled={isPending}
                        className={`p-0 transition-colors duration-150 rounded-full ${isCompleted
                            ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300 dark:bg-green-900/20 dark:border-green-700 dark:hover:bg-green-900/30'
                            : 'text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50 border-gray-200 hover:border-green-200 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-green-900/20'
                            } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <Circle className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isCompleted ? 'Mark as incomplete' : 'Mark as complete'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default TaskCompletionToggle;
