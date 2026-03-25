"use client";
import React from "react";
import { Target } from "lucide-react";
// Re-export the TourStep interface for backward compatibility
export interface TourStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    features?: string[];
    action?: { label: string; description: string; route?: string; };
    gradient: string;
    demoElements?: React.ReactNode;
    tips?: string[];
    keyBenefit: string;
    spotlightSelector?: string;
    workflowType?: 'dashboard' | 'analytics' | 'tasks' | 'team' | 'projects' | 'settings';
}

// Lazy load tour step data to reduce initial bundle size
const loadTourStepData = async () => {
    const { tourStepsData } = await import('./tour-steps-data');
    return tourStepsData;
};

export const createTourSteps = async (userName: string, workspaceId: string): Promise<TourStep[]> => {
    const tourStepsData = await loadTourStepData();
    return tourStepsData.map(step => ({
        ...step,
        title: step.title.replace('{userName}', userName),
        action: step.action ? {
            ...step.action,
            route: step.action.route?.replace('{workspaceId}', workspaceId)
        } : undefined
    }));
};

// Fallback for SSR or immediate needs
export const createTourStepsSync = (userName: string, workspaceId: string): TourStep[] => [
    {
        title: `🎉 Welcome to Timeline, ${userName}!`,
        description: "Let's take a visual tour of your new workspace and discover what you can achieve together.",
        icon: <Target className="w-6 h-6" />,
        keyBenefit: "Your productivity companion",
        features: ["✨ Modern & intuitive interface", "🚀 Real-time collaboration", "📊 Powerful analytics", "🎯 Goal-oriented workflows"],
        gradient: "from-gray-500 to-slate-600 dark:from-gray-600 dark:to-slate-700",
        tips: ["Click through each step to explore", "You can always restart this tour later", "Each section has unique superpowers!"],
        spotlightSelector: '[data-tour-id="nav-dashboard"]'
    }
];
