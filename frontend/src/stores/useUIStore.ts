import { create } from 'zustand';

interface UIState {
    // Global UI state
    showCelebration: boolean;
    isStrategicLoading: boolean;
    currentWorkspace: string | null;

    // Actions
    setShowCelebration: (show: boolean) => void;
    setStrategicLoading: (loading: boolean) => void;
    setCurrentWorkspace: (workspaceId: string | null) => void;
    resetUI: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    // Initial State
    showCelebration: false,
    isStrategicLoading: false,
    currentWorkspace: null,

    // Actions
    setShowCelebration: (show) => set({ showCelebration: show }),

    setStrategicLoading: (loading) => set({ isStrategicLoading: loading }),

    setCurrentWorkspace: (workspaceId) => set({ currentWorkspace: workspaceId }),

    resetUI: () => set({
        showCelebration: false,
        isStrategicLoading: false,
        currentWorkspace: null,
    }),
}));

