import { useState, useEffect } from 'react';

type ViewMode = 'list' | 'board';

const STORAGE_KEY = 'project-view-mode';

export const useViewMode = (defaultMode: ViewMode = 'list') => {
    const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load view mode from localStorage on mount
    useEffect(() => {
        try {
            const savedMode = localStorage.getItem(STORAGE_KEY) as ViewMode;
            if (savedMode && (savedMode === 'list' || savedMode === 'board')) {
                setViewMode(savedMode);
            }
        } catch (error) {
            console.warn('Failed to load view mode from localStorage:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save view mode to localStorage whenever it changes
    const updateViewMode = (newMode: ViewMode) => {
        setViewMode(newMode);
        try {
            localStorage.setItem(STORAGE_KEY, newMode);
        } catch (error) {
            console.warn('Failed to save view mode to localStorage:', error);
        }
    };

    return {
        viewMode,
        setViewMode: updateViewMode,
        isLoaded,
    };
};
