"use client";
import React from 'react';
import { TaskType } from '@/types/api.type';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/resuable/confirm-dialog';
import EditTaskDialog from './edit-task-dialog';

interface KanbanModalsProps {
    showTaskModal: boolean;
    selectedTask: TaskType | null;
    showAddSection: boolean;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
    taskToDelete: TaskType | null;
    isDeleting: boolean;
    availableStatusSections: string[];
    onToggleTaskModal: () => void;
    onSelectTask: (task: TaskType | null) => void;
    onToggleAddSection: () => void;
    onToggleEditDialog: () => void;
    onToggleDeleteDialog: () => void;
    onSetTaskToDelete: (task: TaskType | null) => void;
    onAddSection: (status: string) => void;
    onConfirmDelete: () => void;
}

const KanbanModals: React.FC<KanbanModalsProps> = ({
    showTaskModal,
    selectedTask,
    showAddSection,
    showEditDialog,
    showDeleteDialog,
    taskToDelete,
    isDeleting,
    availableStatusSections,
    onToggleTaskModal,
    onSelectTask,
    onToggleAddSection,
    onToggleEditDialog,
    onToggleDeleteDialog,
    onSetTaskToDelete,
    onAddSection,
    onConfirmDelete
}) => {
    return (
        <>
            {/* Task Details Modal */}
            {showTaskModal && selectedTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/20 border border-white/20">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    onToggleTaskModal();
                                    onSelectTask(null);
                                }}
                            >
                                ✕
                            </Button>
                        </div>
                        {/* Task details content */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">{selectedTask.title}</h3>
                                <p className="text-gray-600">{selectedTask.description}</p>
                            </div>
                            {/* Add more task details as needed */}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Section Modal */}
            {showAddSection && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onToggleAddSection}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full border dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-foreground dark:text-white">Add New Section</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleAddSection}
                            >
                                ✕
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Sections</label>
                                <div className="grid gap-2 mt-2">
                                    {availableStatusSections.length > 0 ? (
                                        availableStatusSections.map(status => (
                                            <Button
                                                key={status}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onAddSection(status)}
                                                className="text-xs"
                                            >
                                                {status.replace('_', ' ')}
                                            </Button>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                            All available sections are already added
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={onToggleAddSection}
                                    className="w-full"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Dialog */}
            {showEditDialog && selectedTask && (
                <EditTaskDialog
                    task={selectedTask}
                    isOpen={showEditDialog}
                    onClose={() => {
                        onToggleEditDialog();
                        onSelectTask(null);
                    }}
                />
            )}

            {/* Delete Task Confirmation Dialog */}
            {showDeleteDialog && (
                <ConfirmDialog
                    isOpen={showDeleteDialog}
                    isLoading={isDeleting}
                    onClose={() => {
                        onToggleDeleteDialog();
                        onSetTaskToDelete(null);
                    }}
                    onConfirm={onConfirmDelete}
                    title="Delete Task"
                    description={`Are you sure you want to delete "${taskToDelete?.title}"?`}
                />
            )}
        </>
    );
};

export default KanbanModals;
