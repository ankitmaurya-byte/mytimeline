import { Column, ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTableColumnHeader } from "./table-column-header";
import { DataTableRowActions } from "./table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import {
  formatStatusToEnum,
  getAvatarColor,
  getAvatarFallbackText,
} from "@/lib/helper";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";
import { priorities, statuses } from "./data";
import { TaskType } from "@/types/api.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TaskCompletionToggle from "@/components/workspace/taskCompletetionToggle";
import { Calendar, User, FolderOpen, Tag, CheckCircle2 } from "lucide-react";

// Column definitions with enhanced sorting functionality
// - All sortable columns use "basic" sorting for reliable alphabetical and numerical sorting
// - Text-based columns sort alphabetically (A-Z, Z-A)
// - Date columns sort chronologically
// - All sortable columns have enableSorting: true and proper sortingFn

export const getColumns = (projectId?: string, profilePictures?: Record<string, string | null>): ColumnDef<TaskType>[] => {
  // Base columns that are always included
  const baseColumns: ColumnDef<TaskType>[] = [
    {
      id: "_id",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
      minSize: 40,
      maxSize: 40,
    },
    {
      id: "title", // Add id for accessorFn
      accessorFn: (row) => row.title || '', // Extract task title for sorting
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task Details" />
      ),
      enableSorting: true,
      sortingFn: "basic" as const, // Use basic sorting for titles
      cell: ({ row }) => {
        const isCompleted = row.original.status === TaskStatusEnum.DONE;

        return (
          <div className="flex flex-col space-y-2 py-1">
            {/* Task Code Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="capitalize shrink-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 font-medium text-xs px-2 py-1"
              >
                {row.original.taskCode}
              </Badge>
              {isCompleted && (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>

            {/* Task Title */}
            <div className="min-w-0 flex-1">
              <span className={`font-semibold truncate block max-w-[120px] sm:max-w-[150px] lg:max-w-[200px] leading-tight ${isCompleted ? 'text-gray-900 dark:text-gray-50 line-through' : 'text-gray-900 dark:text-white'
                }`}>
                {row.original.title}
              </span>
            </div>
          </div>
        );
      },
      size: 200,
      minSize: 180,
      maxSize: 250,
    },
  ];

  // Project column (only when not viewing a specific project)
  const projectColumn: ColumnDef<TaskType> = {
    id: "project", // Add id for accessorFn columns
    accessorFn: (row) => row.project?.name || 'No Project', // Extract project name for sorting
    header: ({ column }: { column: Column<TaskType, unknown> }) => (
      <DataTableColumnHeader column={column} title="Project" />
    ),
    enableSorting: true,
    sortingFn: "basic" as const, // Use basic sorting for project names
    cell: ({ row }: { row: Row<TaskType> }) => {
      const project = row.original.project;
      const isCompleted = row.original.status === TaskStatusEnum.DONE;

      if (!project) {
        return (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <FolderOpen className="h-4 w-4" />
            <span className="text-sm">No Project</span>
          </div>
        );
      }

      return (
        <div className={`flex items-center gap-2 group transition-all duration-200 ${isCompleted ? 'opacity-75' : ''
          }`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${isCompleted
            ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700/50'
            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
            }`}>
            <span className="text-lg">{project.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className={`capitalize truncate block w-[60px] sm:w-[80px] font-medium text-sm transition-colors ${isCompleted
              ? 'text-gray-900 dark:text-gray-50'
              : 'text-gray-900 dark:text-white'
              }`}>
              {project.name}
            </span>
          </div>
        </div>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 140,
  };

  // Remaining columns that are always included
  const remainingColumns: ColumnDef<TaskType>[] = [
    {
      id: "assignedTo", // Add id for accessorFn columns
      accessorFn: (row) => row.assignedTo?.name || 'Unassigned', // Extract assignee name for sorting
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assignee" />
      ),
      enableSorting: true,
      sortingFn: "basic" as const, // Use basic sorting for assignee names
      cell: ({ row }) => {
        const assignee = row.original.assignedTo || null;
        const name = assignee?.name || "";
        const isCompleted = row.original.status === TaskStatusEnum.DONE;

        if (!name) {
          return (
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <User className="h-4 w-4" />
              <span className="text-sm">Unassigned</span>
            </div>
          );
        }

        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);

        return (
          <div className={`flex items-center gap-3 group transition-all duration-200 ${isCompleted ? 'opacity-75' : ''
            }`}>
            <Avatar className={`h-8 w-8 ring-2 transition-all ${isCompleted
              ? 'ring-green-200 dark:ring-green-700/50'
              : 'ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-300 dark:group-hover:ring-blue-600'
              }`}>
              <AvatarImage src={getProfilePictureUrl(profilePictures?.[assignee?._id || ''] || undefined) || undefined} alt={name} />
              <AvatarFallback className={`${avatarColor} text-sm font-semibold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className={`truncate block w-[60px] sm:w-[80px] font-medium text-sm transition-colors ${isCompleted
                ? 'text-gray-900 dark:text-gray-50'
                : 'text-gray-900 dark:text-white'
                }`}>
                {assignee?.name}
              </span>
            </div>
          </div>
        );
      },
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      enableSorting: true,
      sortingFn: "basic" as const, // Use basic sorting for dates
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        const isCompleted = row.original.status === TaskStatusEnum.DONE;
        const isOverdue = dueDate && new Date(dueDate) < new Date() && !isCompleted;

        if (!dueDate) {
          return (
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">No Due Date</span>
            </div>
          );
        }

        return (
          <div className={`flex items-center gap-2 transition-all duration-200 ${isCompleted ? 'opacity-75' : ''
            }`}>
            <Calendar className={`h-4 w-4 transition-colors ${isCompleted
              ? 'text-gray-800 dark:text-gray-100'
              : isOverdue
                ? 'text-red-500'
                : 'text-gray-500'
              }`} />
            <div className="flex flex-col">
              <span className={`whitespace-nowrap text-sm font-medium transition-colors ${isCompleted
                ? 'text-gray-900 dark:text-gray-50 line-through'
                : isOverdue
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
                }`}>
                {format(dueDate, "MMM dd")}
              </span>
              <span className={`text-xs transition-colors ${isCompleted
                ? 'text-gray-800 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
                }`}>
                {format(dueDate, "yyyy")}
              </span>
            </div>
            {isOverdue && !isCompleted && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                Overdue
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                Done
              </Badge>
            )}
          </div>
        );
      },
      size: 100,
      minSize: 90,
      maxSize: 120,
    },
    {
      id: "completion",
      header: () => <span className="sr-only">Completion</span>,
      cell: ({ row }) => {
        const isCompleted = row.original.status === TaskStatusEnum.DONE;

        return (
          <div className={`flex items-center justify-center transition-all duration-200 ${isCompleted ? 'opacity-75' : ''
            }`}>
            <TaskCompletionToggle task={row.original} />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
    {
      id: "status", // Add id for accessorFn columns
      accessorFn: (row) => {
        // Extract status label for sorting
        const status = statuses.find(s => s.value === row.status);
        return status?.label || row.status || '';
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      sortingFn: "basic" as const, // Use basic sorting for status
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.original.status
        );
        const isCompleted = row.original.status === TaskStatusEnum.DONE;

        if (!status) {
          return null;
        }

        const statusKey = formatStatusToEnum(
          status.value
        ) as TaskStatusEnumType;
        const Icon = status.icon;

        if (!Icon) {
          return null;
        }

        return (
          <div className={`flex items-center justify-center transition-all duration-200 ${isCompleted ? 'opacity-75' : ''
            }`}>
            <Badge
              variant={TaskStatusEnum[statusKey]}
              className={`flex w-auto items-center gap-2 px-3 py-2 font-medium shadow-sm uppercase border-0 rounded-full text-xs transition-all ${isCompleted
                ? 'opacity-80 bg-opacity-70'
                : ''
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-semibold">{status.label}</span>
            </Badge>
          </div>
        );
      },
      size: 100,
      minSize: 90,
      maxSize: 120,
    },
    {
      id: "priority", // Add id for accessorFn columns
      accessorFn: (row) => {
        // Extract priority label for sorting
        const priority = priorities.find(p => p.value === row.priority);
        return priority?.label || row.priority || '';
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      enableSorting: true,
      sortingFn: "basic" as const, // Use basic sorting for priority
      cell: ({ row }) => {
        const priority = priorities.find(
          (priority) => priority.value === row.original.priority
        );
        const isCompleted = row.original.status === TaskStatusEnum.DONE;

        if (!priority) {
          return null;
        }

        const statusKey = formatStatusToEnum(
          priority.value
        ) as TaskPriorityEnumType;
        const Icon = priority.icon;

        if (!Icon) {
          return null;
        }

        return (
          <div className={`flex items-center justify-center transition-all duration-200 ${isCompleted ? 'opacity-75' : ''
            }`}>
            <Badge
              variant={TaskPriorityEnum[statusKey]}
              className={`flex w-auto items-center gap-2 px-3 py-2 font-medium shadow-sm uppercase border-0 rounded-full text-xs transition-all ${isCompleted
                ? 'opacity-80 bg-opacity-70'
                : ''
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-semibold">{priority.label}</span>
            </Badge>
          </div>
        );
      },
      size: 100,
      minSize: 90,
      maxSize: 120,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center">
            <DataTableRowActions row={row} />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
  ];

  // Build final columns array
  const columns: ColumnDef<TaskType>[] = [
    ...baseColumns,
    ...(projectId ? [] : [projectColumn]),
    ...remainingColumns,
  ];

  return columns;
};
