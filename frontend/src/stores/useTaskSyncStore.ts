import { create } from 'zustand';

interface TaskSyncState {
    // Sync triggers
    lastTaskCreated: number;
    lastTaskUpdated: number;
    lastTaskDeleted: number;
    lastTaskStatusChanged: number;
    lastGlobalRefresh: number;

    // Actions to trigger syncs
    triggerTaskCreated: () => void;
    triggerTaskUpdated: () => void;
    triggerTaskDeleted: () => void;
    triggerTaskStatusChanged: () => void;
    triggerGlobalRefresh: () => void;

    // Get last sync time for a specific event
    getLastSyncTime: (eventType: 'created' | 'updated' | 'deleted' | 'status-changed' | 'global') => number;
}

export const useTaskSyncStore = create<TaskSyncState>((set, get) => ({
    // Initial state
    lastTaskCreated: 0,
    lastTaskUpdated: 0,
    lastTaskDeleted: 0,
    lastTaskStatusChanged: 0,
    lastGlobalRefresh: 0,

    // Actions
    triggerTaskCreated: () => {
        set({ lastTaskCreated: Date.now() });
    },
    triggerTaskUpdated: () => {
        set({ lastTaskUpdated: Date.now() });
    },
    triggerTaskDeleted: () => {
        set({ lastTaskDeleted: Date.now() });
    },
    triggerTaskStatusChanged: () => {
        set({ lastTaskStatusChanged: Date.now() });
    },
    triggerGlobalRefresh: () => {
        set({ lastGlobalRefresh: Date.now() });
    },

    // Computed
    getLastSyncTime: (eventType) => {
        const state = get();
        switch (eventType) {
            case 'created': return state.lastTaskCreated;
            case 'updated': return state.lastTaskUpdated;
            case 'deleted': return state.lastTaskDeleted;
            case 'status-changed': return state.lastTaskStatusChanged;
            case 'global': return state.lastGlobalRefresh;
            default: return 0;
        }
    },
}));

