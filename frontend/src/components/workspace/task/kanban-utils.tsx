import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnum, TaskStatusEnumType } from '@/constant';
import { TaskType } from '@/types/api.type';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

// Utility function for other components to notify about task updates
export const notifyTaskUpdate = (workspaceId: string, projectId?: string) => {
    triggerTaskUpdateEvent('updated', workspaceId, projectId);
};

// Utility functions for cross-component communication
export const triggerTaskUpdateEvent = (type: 'created' | 'updated' | 'deleted' | 'status-changed', workspaceId: string, projectId?: string) => {
    const event = new CustomEvent(`task-${type}`, {
        detail: { type, workspaceId, projectId }
    });
    window.dispatchEvent(event);
};

export const triggerGlobalRefresh = (workspaceId: string) => {
    const event = new CustomEvent('refresh-tasks', {
        detail: { workspaceId }
    });
    window.dispatchEvent(event);
};

// Priority utility functions
export const getPriorityColor = (priority?: TaskPriorityEnumType) => {
    switch (priority) {
        case TaskPriorityEnum.HIGH:
            return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300';
        case TaskPriorityEnum.MEDIUM:
            return 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300';
        case TaskPriorityEnum.LOW:
            return 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
};

export const getPriorityIcon = (priority?: TaskPriorityEnumType) => {
    switch (priority) {
        case TaskPriorityEnum.HIGH:
            return <ArrowUp className="w-3 h-3 text-red-500" />;
        case TaskPriorityEnum.MEDIUM:
            return <ArrowRight className="w-3 h-3 text-yellow-500" />;
        case TaskPriorityEnum.LOW:
            return <ArrowDown className="w-3 h-3 text-green-500" />;
        default:
            return <ArrowRight className="w-3 h-3 text-gray-500" />;
    }
};

// Column border color utility function
export const getColumnBorderColor = (columnId: string) => {
    switch (columnId) {
        case TaskStatusEnum.TODO:
            return 'border-blue-200 dark:border-blue-500';
        case TaskStatusEnum.IN_PROGRESS:
            return 'border-orange-200 dark:border-orange-500';
        case TaskStatusEnum.IN_REVIEW:
            return 'border-purple-200 dark:border-purple-500';
        case TaskStatusEnum.DONE:
            return 'border-green-200 dark:border-green-500';
        default:
            return 'border-border';
    }
};

// Date formatting utility
export const formatDate = (dueDate: string | Date | undefined, taskStatus?: TaskStatusEnumType) => {
    if (!dueDate) {
        return { text: 'No due date', color: 'text-gray-400' };
    }

    // If task is completed, show "Completed" instead of overdue
    if (taskStatus === TaskStatusEnum.DONE) {
        return { text: 'Completed', color: 'text-green-600' };
    }

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: 'Overdue', color: 'text-red-600' };
    } else if (diffDays === 0) {
        return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
        return { text: 'Due tomorrow', color: 'text-yellow-600' };
    } else if (diffDays <= 7) {
        return { text: `Due in ${diffDays} days`, color: 'text-blue-600' };
    } else {
        return { text: date.toLocaleDateString(), color: 'text-gray-600' };
    }
};

// Priority accent bar colors
export const getPriorityAccent = (priority?: TaskPriorityEnumType) => {
    switch (priority) {
        case TaskPriorityEnum.HIGH:
            return 'bg-gradient-to-b from-red-500 via-red-400 to-red-500';
        case TaskPriorityEnum.MEDIUM:
            return 'bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400';
        case TaskPriorityEnum.LOW:
            return 'bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-400';
        default:
            return 'bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300';
    }
};

// Column status accent colors
export const getColumnStatusAccent = (status: string) => {
    switch (status) {
        case TaskStatusEnum.TODO:
            return 'bg-gradient-to-b from-blue-500 via-blue-400 to-blue-500';
        case TaskStatusEnum.IN_PROGRESS:
            return 'bg-gradient-to-b from-amber-500 via-amber-400 to-amber-500';
        case TaskStatusEnum.IN_REVIEW:
            return 'bg-gradient-to-b from-purple-500 via-purple-400 to-purple-500';
        case TaskStatusEnum.DONE:
            return 'bg-gradient-to-b from-green-500 via-green-400 to-green-500';
        case TaskStatusEnum.BACKLOG:
            return 'bg-gradient-to-b from-slate-400 via-slate-300 to-slate-400';
        default:
            return 'bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300';
    }
};

// Column load accent colors
export const getColumnLoadAccent = (count: number) => {
    if (count <= 3) return 'bg-emerald-400';
    if (count <= 7) return 'bg-amber-400';
    if (count <= 12) return 'bg-orange-500';
    return 'bg-red-600';
};

// Assignee workload accent colors
export const getAssigneeAccent = (count: number, assigneeId?: string) => {
    if (!assigneeId) return 'bg-slate-300';
    if (count <= 2) return 'bg-emerald-400';
    if (count <= 5) return 'bg-amber-400';
    if (count <= 8) return 'bg-orange-500';
    return 'bg-red-600';
};

// Accent mode configuration
export const ACCENT_MODE = 'column-status' as const;
export type AccentMode = 'priority' | 'column-load' | 'assignee-workload' | 'column-relative' | 'column-status';

// Base column configuration
export const getBaseColumns = () => [
    {
        id: TaskStatusEnum.TODO,
        title: 'To Do',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
    },
    {
        id: TaskStatusEnum.IN_PROGRESS,
        title: 'In Progress',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
    },
    {
        id: TaskStatusEnum.IN_REVIEW,
        title: 'Review',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
    },
    {
        id: TaskStatusEnum.DONE,
        title: 'Done',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
    }
];

// Status configuration for new sections
export const getStatusConfig = (status: string) => {
    const statusConfig = {
        [TaskStatusEnum.BACKLOG]: {
            title: 'Backlog',
            color: 'text-purple-700',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        }
    };

    return statusConfig[status as TaskStatusEnumType] || {
        title: status.replace('_', ' '),
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
    };
};

// Grid layout classes based on column count
export const getGridLayoutClasses = (columnCount: number) => {
    if (columnCount === 1) return 'grid-cols-1';
    if (columnCount === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (columnCount === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
};
