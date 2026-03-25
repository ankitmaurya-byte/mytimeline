import { create } from 'zustand';
import { TaskType } from '@/types/api.type';
import { TaskStatusEnum, TaskStatusEnumType } from '@/constant';

export interface Column {
    id: TaskStatusEnumType;
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
    tasks: TaskType[];
}

interface KanbanState {
    // UI State
    customColumns: Column[];
    showAddSection: boolean;
    selectedTask: TaskType | null;
    showTaskModal: boolean;
    isDragging: boolean;
    dragOverColumn: string | null;
    showEditDialog: boolean;
    showDeleteDialog: boolean;
    taskToDelete: TaskType | null;

    // Actions
    setCustomColumns: (columns: Column[]) => void;
    addCustomColumn: (column: Column) => void;
    removeCustomColumn: (columnId: string) => void;
    toggleAddSection: () => void;
    selectTask: (task: TaskType | null) => void;
    toggleTaskModal: () => void;
    setDragging: (isDragging: boolean) => void;
    setDragOverColumn: (columnId: string | null) => void;
    toggleEditDialog: () => void;
    toggleDeleteDialog: () => void;
    setTaskToDelete: (task: TaskType | null) => void;

    // Computed values
    getAvailableStatusSections: () => string[];
    resetUIState: () => void;
}

const getColumnConfig = (status: TaskStatusEnumType) => {
    const configs = {
        [TaskStatusEnum.BACKLOG]: {
            title: 'Backlog',
            color: 'text-purple-700',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        }
    };

    return configs[status] || {
        title: status.replace('_', ' '),
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
    };
};

export const useKanbanStore = create<KanbanState>((set, get) => ({
    // Initial State
    customColumns: [],
    showAddSection: false,
    selectedTask: null,
    showTaskModal: false,
    isDragging: false,
    dragOverColumn: null,
    showEditDialog: false,
    showDeleteDialog: false,
    taskToDelete: null,

    // Actions
    setCustomColumns: (columns) => set({ customColumns: columns }),

    addCustomColumn: (column) => set((state) => ({
        customColumns: [...state.customColumns, column]
    })),

    removeCustomColumn: (columnId) => set((state) => ({
        customColumns: state.customColumns.filter(col => col.id !== columnId)
    })),

    toggleAddSection: () => set((state) => ({
        showAddSection: !state.showAddSection
    })),

    selectTask: (task) => set({ selectedTask: task }),

    toggleTaskModal: () => set((state) => ({
        showTaskModal: !state.showTaskModal
    })),

    setDragging: (isDragging) => set({ isDragging }),

    setDragOverColumn: (columnId) => set({ dragOverColumn: columnId }),

    toggleEditDialog: () => set((state) => ({
        showEditDialog: !state.showEditDialog
    })),

    toggleDeleteDialog: () => set((state) => ({
        showDeleteDialog: !state.showDeleteDialog
    })),

    setTaskToDelete: (task) => set({ taskToDelete: task }),

    // Computed values
    getAvailableStatusSections: () => {
        const { customColumns } = get();
        const currentStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
        const allStatuses = Object.values(TaskStatusEnum);

        return allStatuses.filter(status =>
            !currentStatuses.includes(status) &&
            !customColumns.some(col => col.id === status)
        );
    },

    resetUIState: () => set({
        showAddSection: false,
        selectedTask: null,
        showTaskModal: false,
        isDragging: false,
        dragOverColumn: null,
        showEditDialog: false,
        showDeleteDialog: false,
        taskToDelete: null,
    }),
}));
