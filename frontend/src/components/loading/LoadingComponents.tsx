'use client';

import React from 'react';

// Loading component for analytics
export const AnalyticsLoading = () => (
    <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">Loading analytics...</div>
    </div>
);

// Loading component for animations
export const AnimationsLoading = () => (
    <div className="h-96 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 rounded-lg animate-pulse" />
);

// Loading component for editors
export const EditorsLoading = () => (
    <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
);

// Loading component for files
export const FilesLoading = () => (
    <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
);

// Loading component for UI components
export const UILoading = () => (
    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
);

// Generic page loading component
export const PageLoading = ({ pageName }: { pageName: string }) => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading {pageName}...</p>
        </div>
    </div>
);























