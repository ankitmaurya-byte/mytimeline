"use client";
import React, { memo } from 'react';
import { TaskType } from '@/types/api.type';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import KanbanTaskCard from './kanban-task-card';
import { TaskStatusEnum } from '@/constant';

// Move helper functions outside component for better performance
const getColumnAccentColor = (columnId: string) => {
    switch (columnId) {
        case TaskStatusEnum.TODO:
            return 'bg-blue-500/60 dark:bg-blue-400/60';
        case TaskStatusEnum.IN_PROGRESS:
            return 'bg-orange-500/60 dark:bg-orange-400/60';
        case TaskStatusEnum.IN_REVIEW:
            return 'bg-purple-500/60 dark:bg-purple-400/60';
        case TaskStatusEnum.DONE:
            return 'bg-green-500/60 dark:bg-green-400/60';
        default:
            return 'bg-primary/60';
    }
};

// Helper function to get column border colors
const getColumnBorderColor = (columnId: string) => {
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

// Helper function to get column background colors
const getColumnBackgroundColor = (columnId: string) => {
    switch (columnId) {
        case TaskStatusEnum.TODO:
            return 'bg-blue-50 dark:bg-blue-900/40';
        case TaskStatusEnum.IN_PROGRESS:
            return 'bg-orange-50 dark:bg-orange-900/40';
        case TaskStatusEnum.IN_REVIEW:
            return 'bg-purple-50 dark:bg-purple-900/40';
        case TaskStatusEnum.DONE:
            return 'bg-green-50 dark:bg-green-900/40';
        default:
            return 'bg-background/80 dark:bg-card/80';
    }
};

// Helper function to get column drag-over ring colors
const getColumnRingColor = (columnId: string) => {
    switch (columnId) {
        case TaskStatusEnum.TODO:
            return 'ring-blue-500 dark:ring-blue-400';
        case TaskStatusEnum.IN_PROGRESS:
            return 'ring-orange-500 dark:ring-orange-400';
        case TaskStatusEnum.IN_REVIEW:
            return 'ring-purple-500 dark:ring-purple-400';
        case TaskStatusEnum.DONE:
            return 'ring-green-500 dark:ring-green-400';
        default:
            return 'ring-primary dark:ring-primary';
    }
};

// Helper function to get column drag-over shadow colors
const getColumnShadowColor = (columnId: string) => {
    switch (columnId) {
        case TaskStatusEnum.TODO:
            return 'shadow-blue-500/25 dark:shadow-blue-400/25';
        case TaskStatusEnum.IN_PROGRESS:
            return 'shadow-orange-500/25 dark:shadow-orange-400/25';
        case TaskStatusEnum.IN_REVIEW:
            return 'shadow-purple-500/25 dark:shadow-purple-400/25';
        case TaskStatusEnum.DONE:
            return 'shadow-green-500/25 dark:shadow-green-400/25';
        default:
            return 'shadow-primary/25';
    }
};

interface Column {
    id: string;
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
    tasks: TaskType[];
}

interface KanbanColumnProps {
    column: Column;
    isCustomColumn: boolean;
    maxColumnTasks: number;
    assigneeTaskCounts: Record<string, number>;
    profilePictures?: Record<string, string | null>;
    dragOverColumn: string | null;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, task: TaskType, columnId: string) => void;
    onDragEnd: () => void;
    onTaskClick: (task: TaskType) => void;
    onEditTask: (task: TaskType) => void;
    onDeleteTask: (task: TaskType) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void;
    onRemoveCustomColumn: (columnId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
    column,
    isCustomColumn,
    maxColumnTasks,
    assigneeTaskCounts,
    profilePictures,
    dragOverColumn,
    onDragStart,
    onDragEnd,
    onTaskClick,
    onEditTask,
    onDeleteTask,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onRemoveCustomColumn
}) => {
    return (
        <div
            className={`${getColumnBackgroundColor(column.id)} rounded-lg p-2 sm:p-3 border ${getColumnBorderColor(column.id)} shadow-sm relative
                ${dragOverColumn === column.id ? `ring-4 ${getColumnRingColor(column.id)} ring-opacity-90 dark:ring-opacity-90 shadow-xl ${getColumnShadowColor(column.id)} scale-[1.02]` : ''}
                transition-all duration-200 hover:shadow-sm dark:hover:shadow-md min-h-[300px] sm:min-h-[400px] md:min-h-[500px]`}
            onDragOver={onDragOver}
            onDragEnter={(e) => onDragEnter(e, column.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, column.id)}
        >
            {/* Subtle column accent border */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-lg ${getColumnAccentColor(column.id)}`}></div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1 sm:gap-2">
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground">{column.title}</h3>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-muted text-muted-foreground">
                        {column.tasks.length}
                    </Badge>
                </div>
                {isCustomColumn && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveCustomColumn(column.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/10"
                        title="Remove section"
                    >
                        ✕
                    </Button>
                )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
                {/* Drop zone indicator at top of column */}
                <div
                    className="h-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-muted/30 transition-all duration-200 opacity-0 hover:opacity-100 group-hover:opacity-100"
                    onDragOver={onDragOver}
                    onDragEnter={(e) => onDragEnter(e, column.id)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, column.id)}
                >
                    <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Drop here to add at top</span>
                    </div>
                </div>

                {/* Task cards */}
                {column.tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No tasks</p>
                    </div>
                ) : (
                    column.tasks.map((task) => (
                        <KanbanTaskCard
                            key={task._id}
                            task={task}
                            columnId={column.id}
                            columnLoad={column.tasks.length}
                            maxColumnTasks={maxColumnTasks}
                            assigneeTaskCounts={assigneeTaskCounts}
                            profilePictures={profilePictures}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onTaskClick={onTaskClick}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            onDragOver={onDragOver}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        />
                    ))
                )}

                {/* Drop zone indicator at bottom of column */}
                <div
                    className="h-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-muted/30 transition-all duration-200 opacity-0 hover:opacity-100 group-hover:opacity-100"
                    onDragOver={onDragOver}
                    onDragEnter={(e) => onDragEnter(e, column.id)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, column.id)}
                >
                    <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Drop here to add at bottom</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(KanbanColumn, (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
        prevProps.column.id === nextProps.column.id &&
        prevProps.column.tasks.length === nextProps.column.tasks.length &&
        prevProps.dragOverColumn === nextProps.dragOverColumn &&
        prevProps.maxColumnTasks === nextProps.maxColumnTasks &&
        // Deep compare tasks by checking if any task._id or status changed
        prevProps.column.tasks.every((task, idx) => 
            task._id === nextProps.column.tasks[idx]?._id &&
            task.status === nextProps.column.tasks[idx]?.status &&
            task.updatedAt === nextProps.column.tasks[idx]?.updatedAt
        )
    );
});
