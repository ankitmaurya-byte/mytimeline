"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { useKanbanBoard } from './use-kanban-board';
import KanbanColumn from './kanban-column';
import KanbanModals from './kanban-modals';
import { CacheDebugger } from '@/components/debug/CacheDebugger';

const KanbanBoardOptimized = () => {
    // Add safety check for hook result
    let hookResult;
    try {
        hookResult = useKanbanBoard();
    } catch (error) {
        hookResult = null;
    }

    // Destructure with fallbacks to prevent runtime errors
    const {
        // State
        workspaceId = '',
        projectId = undefined,
        isLoading = false,
        error = null,
        columns = [],
        maxColumnTasks = 0,
        assigneeTaskCounts = {},
        profilePictures = {},
        dragOverColumn = null,
        showAddSection = false,
        selectedTask = null,
        showTaskModal = false,
        showEditDialog = false,
        showDeleteDialog = false,
        taskToDelete = null,
        isDeleting = false,
        availableStatusSections = [],

        // Actions
        refetch = () => { },
        handleAddSection = () => { },
        handleRemoveCustomColumn = () => { },
        handleDragStart = () => { },
        handleDragEnd = () => { },
        handleDragOver = () => { },
        handleDragEnter = () => { },
        handleDragLeave = () => { },
        handleDrop = () => { },
        handleTaskClick = () => { },
        handleEditTask = () => { },
        handleDeleteTask = () => { },
        handleConfirmDelete = () => { },
        toggleAddSection = () => { },
        toggleTaskModal = () => { },
        toggleEditDialog = () => { },
        toggleDeleteDialog = () => { },
        selectTask = () => { },
        setTaskToDelete = () => { },
        resetUIState = () => { },

        // Computed
        gridLayoutClasses = ''
    } = hookResult || {};

    // Debug logging
    // Early return if missing required data
    if (!workspaceId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Kanban board...</p>
                </div>
            </div>
        );
    }

    // Enhanced loading state with Kanban skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen">
                {/* Header Skeleton */}
                <div className="mb-3 sm:mb-4 px-1 sm:px-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                </div>

                {/* Kanban Columns Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 px-1 sm:px-0">
                    {[...Array(4)].map((_, columnIndex) => (
                        <div key={columnIndex} className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-3 sm:p-4 shadow-sm dark:shadow-lg">
                            {/* Column Header Skeleton */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </div>

                            {/* Task Cards Skeleton */}
                            <div className="space-y-3">
                                {[...Array(3)].map((_, taskIndex) => (
                                    <div key={taskIndex} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 animate-pulse">
                                        <div className="space-y-2">
                                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="flex items-center justify-between">
                                                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-3 md:p-4 bg-gray-50 dark:bg-slate-900/50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-lg mb-2">⚠️</div>
                    <p className="text-gray-600 dark:text-slate-300 text-sm">Failed to load tasks. Please try again.</p>
                    <Button onClick={() => refetch()} className="mt-2">Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen">
                {/* Header */}
                <div className="mb-3 sm:mb-4 px-1 sm:px-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Project Board</h1>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleAddSection}
                                className="text-xs flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                            >
                                <Plus className="h-3 w-3" />
                                <span className="hidden sm:inline">Add Section</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    refetch();
                                    resetUIState();
                                }}
                                className="text-xs flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                                disabled={isLoading}
                            >
                                {isLoading ? '⏳' : '🔄'}
                                <span className="hidden sm:inline">Sync Tasks</span>
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Drag and drop tasks between columns to update their status
                        </p>
                        <div className="text-xs text-muted-foreground/70">
                            Last updated: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>

                {/* Kanban Columns Grid */}
                <div className={`grid gap-2 sm:gap-4 px-1 sm:px-0 ${gridLayoutClasses}`}>
                    {Array.isArray(columns) && columns.length > 0 ? columns.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            isCustomColumn={columns.some(col => col.id === column.id)}
                            maxColumnTasks={maxColumnTasks}
                            assigneeTaskCounts={assigneeTaskCounts}
                            profilePictures={profilePictures}
                            dragOverColumn={dragOverColumn}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onTaskClick={handleTaskClick}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onRemoveCustomColumn={handleRemoveCustomColumn}
                        />
                    )) : (
                        <div className="col-span-full flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="text-muted-foreground text-sm">No columns available</div>
                                <div className="text-xs text-muted-foreground/70 mt-1">
                                    {Array.isArray(columns) ? 'Columns array is empty' : `Columns is not an array: ${typeof columns}`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals and Dialogs */}
                <KanbanModals
                    showTaskModal={showTaskModal}
                    selectedTask={selectedTask}
                    showAddSection={showAddSection}
                    showEditDialog={showEditDialog}
                    showDeleteDialog={showDeleteDialog}
                    taskToDelete={taskToDelete}
                    isDeleting={isDeleting}
                    availableStatusSections={availableStatusSections}
                    onToggleTaskModal={toggleTaskModal}
                    onSelectTask={selectTask}
                    onToggleAddSection={toggleAddSection}
                    onToggleEditDialog={toggleEditDialog}
                    onToggleDeleteDialog={toggleDeleteDialog}
                    onSetTaskToDelete={setTaskToDelete}
                    onAddSection={handleAddSection}
                    onConfirmDelete={handleConfirmDelete}
                />

                {/* Debug Component - only in development */}
                {process.env.NODE_ENV === 'development' && workspaceId && (
                    <CacheDebugger workspaceId={workspaceId} projectId={projectId} />
                )}
            </div>
        </TooltipProvider>
    );
};

export default KanbanBoardOptimized;
