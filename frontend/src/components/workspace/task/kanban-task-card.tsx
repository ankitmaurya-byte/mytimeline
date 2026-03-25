"use client";
import React, { memo } from 'react';
import { TaskType } from '@/types/api.type';
import { TaskStatusEnum, TaskStatusEnumType } from '@/constant';
import { ResponsiveAvatar } from '@/components/ui/responsive-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getProfilePictureUrl } from '@/lib/profile-picture-utils';
import {
    MoreHorizontal,
    User,
    Clock,
    Eye,
    Edit3,
    Tag
} from 'lucide-react';
import {
    getPriorityColor,
    getPriorityIcon,
    formatDate,
    getPriorityAccent,
    getColumnStatusAccent,
    getColumnLoadAccent,
    getAssigneeAccent,
    getColumnBorderColor,
    ACCENT_MODE,
    type AccentMode
} from './kanban-utils';

interface KanbanTaskCardProps {
    task: TaskType;
    columnId: string;
    columnLoad: number;
    maxColumnTasks: number;
    assigneeTaskCounts: Record<string, number>;
    profilePictures?: Record<string, string | null>;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, task: TaskType, columnId: string) => void;
    onDragEnd: () => void;
    onTaskClick: (task: TaskType) => void;
    onEditTask: (task: TaskType) => void;
    onDeleteTask: (task: TaskType) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void;
}

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
    task,
    columnId,
    columnLoad,
    maxColumnTasks,
    assigneeTaskCounts,
    profilePictures,
    onDragStart,
    onDragEnd,
    onTaskClick,
    onEditTask,
    onDeleteTask,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop
}) => {
    const renderAccentBar = () => {
        const assigneeId = task.assignedTo?._id;
        const workload = assigneeId ? assigneeTaskCounts[assigneeId] || 0 : 0;

        switch (ACCENT_MODE as AccentMode) {
            case 'priority': {
                return (
                    <div
                        className={`absolute left-0 top-0 h-full w-1 ${getPriorityAccent(task.priority)}`}
                        title={`Priority: ${task.priority || 'N/A'}`}
                    />
                );
            }
            case 'column-load': {
                return (
                    <div
                        className={`absolute left-0 top-0 h-full w-1 ${getColumnLoadAccent(columnLoad)}`}
                        title={`Column load: ${columnLoad} task${columnLoad === 1 ? '' : 's'}`}
                    />
                );
            }
            case 'assignee-workload': {
                return (
                    <div
                        className={`absolute left-0 top-0 h-full w-1 ${getAssigneeAccent(workload, assigneeId)}`}
                        title={assigneeId ? `Assignee workload: ${workload} task${workload === 1 ? '' : 's'}` : 'Unassigned task'}
                    />
                );
            }
            case 'column-status': {
                return (
                    <div
                        className={`absolute left-0 top-0 h-full w-1 ${getColumnStatusAccent(columnId)}`}
                        title={`Column: ${columnId}`}
                    />
                );
            }
            case 'column-relative':
            default: {
                const ratio = maxColumnTasks > 0 ? columnLoad / maxColumnTasks : 0;
                const hue = Math.round(140 - 140 * ratio);
                const lightness = 45 + Math.round(15 * (1 - ratio));
                const color = `hsl(${hue} 80% ${lightness}%)`;
                return (
                    <div
                        className="absolute left-0 top-0 h-full w-1"
                        style={{ background: color }}
                        title={`Column load: ${columnLoad}/${maxColumnTasks || columnLoad} (${Math.round(ratio * 100)}%)`}
                    />
                );
            }
        }
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task, columnId)}
            onDragEnd={onDragEnd}
            className={`group relative mb-3 cursor-move overflow-hidden rounded-xl border ${getColumnBorderColor(columnId)} bg-card/95 dark:bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
            onClick={() => onTaskClick(task)}
        >
            {/* Priority accent bar */}
            {renderAccentBar()}

            {/* Hover gradient overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-transparent via-transparent to-muted/20 dark:to-muted/30" />

            <div className="relative p-3">
                {/* Drop zone indicator above task */}
                <div
                    className="h-2 -mt-3 mb-2 rounded-full transition-all duration-200 opacity-0 hover:opacity-100"
                    onDragOver={onDragOver}
                    onDragEnter={(e) => onDragEnter(e, columnId)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, columnId)}
                >
                    <div className="h-full bg-primary rounded-full transform scale-x-0 hover:scale-x-100 transition-transform duration-200"></div>
                </div>

                {/* Task content */}
                <div className="space-y-2">
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono tracking-tight text-muted-foreground">
                                    {task.taskCode || 'TASK-000'}
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${getPriorityColor(task.priority)}`}>
                                    {getPriorityIcon(task.priority)} {task.priority ? task.priority.toLowerCase() : 'medium'}
                                </span>
                                {task.dueDate && (
                                    <span className={`inline-flex items-center gap-1 rounded-md bg-background/60 ring-1 ring-inset ring-border px-2 py-0.5 text-[10px] ${formatDate(task.dueDate, task.status).color}`}>
                                        <Clock className="w-3 h-3" /> {formatDate(task.dueDate, task.status).text}
                                    </span>
                                )}
                            </div>
                            <h4 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-foreground/80 transition-colors">
                                {task.title || 'Untitled Task'}
                            </h4>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-muted/50"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}>
                                    <Eye className="w-3 h-3 mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                                    <Edit3 className="w-3 h-3 mr-2" />
                                    Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                                    className="!text-red-600 dark:!text-red-400 hover:!text-red-700 dark:hover:!text-red-300"
                                >
                                    <Tag className="w-3 h-3 mr-2" />
                                    Delete Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Project + Meta */}
                    <div className="mt-2 space-y-2">
                        {task.project && (
                            <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                                <span className="text-sm leading-none">{task.project.emoji || '📁'}</span>
                                <span className="truncate text-[11px] font-medium text-muted-foreground">
                                    {task.project.name || 'Untitled Project'}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1 min-w-[90px]">
                                <User className="w-3 h-3 text-muted-foreground/70" />
                                {task.assignedTo ? (
                                    <div className="flex items-center gap-1.5">
                                        <ResponsiveAvatar
                                            src={profilePictures?.[task.assignedTo._id || ''] || undefined}
                                            alt={task.assignedTo.name || "Assignee"}
                                            fallback={task.assignedTo.name ? task.assignedTo.name.charAt(0).toUpperCase() : 'U'}
                                            size="xs"
                                            className="ring-1 ring-border"
                                        />
                                        <span className="truncate max-w-[90px] font-medium text-foreground">{task.assignedTo.name || 'Unknown'}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground/70">Unassigned</span>
                                )}
                            </div>
                            {task.createdBy && task.createdBy._id !== task.assignedTo?._id && (
                                <div className="flex items-center gap-1 min-w-[90px]">
                                    <Tag className="w-3 h-3 text-muted-foreground/70" />
                                    <span className="truncate max-w-[90px] text-muted-foreground">{task.createdBy.name || 'Unknown'}</span>
                                </div>
                            )}
                            {!task.dueDate && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-muted-foreground/70" />
                                    <span className="text-muted-foreground/70">No due</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Drop zone indicator below task */}
                <div
                    className="h-2 mt-2 -mb-3 rounded-full transition-all duration-200 opacity-0 hover:opacity-100"
                    onDragOver={onDragOver}
                    onDragEnter={(e) => onDragEnter(e, columnId)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, columnId)}
                >
                    <div className="h-full bg-primary rounded-full transform scale-x-0 hover:scale-x-100 transition-transform duration-200"></div>
                </div>
            </div>
        </div>
    );
};

export default memo(KanbanTaskCard, (prevProps, nextProps) => {
    // Only re-render if task data or drag state changes
    return (
        prevProps.task._id === nextProps.task._id &&
        prevProps.task.title === nextProps.task.title &&
        prevProps.task.status === nextProps.task.status &&
        prevProps.task.priority === nextProps.task.priority &&
        prevProps.task.updatedAt === nextProps.task.updatedAt &&
        prevProps.task.assignedTo?._id === nextProps.task.assignedTo?._id &&
        prevProps.columnId === nextProps.columnId &&
        prevProps.columnLoad === nextProps.columnLoad
    );
});
