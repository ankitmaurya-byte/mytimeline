"use client";

import { Suspense, lazy } from 'react';
import { useParams } from 'next/navigation';

// Lazy load all workspace pages for better performance
const LazyTasks = lazy(() => import('@/page/workspace/Tasks'));
const LazyMembers = lazy(() => import('@/page/workspace/Members'));
const LazyAnalytics = lazy(() => import('@/page/workspace/Analytics'));
const LazySettings = lazy(() => import('@/page/workspace/Settings'));
const LazyProfile = lazy(() => import('@/page/workspace/Profile'));
const LazyProjectDetails = lazy(() => import('@/page/workspace/ProjectDetails'));

// Loading component with skeleton
const PageSkeleton = ({ pageName }: { pageName: string }) => (
    <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4"></div>
        <div className="grid gap-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
    </div>
);

interface OptimizedRouteWrapperProps {
    route: string;
}

export function OptimizedRouteWrapper({ route }: OptimizedRouteWrapperProps) {
    const params = useParams();
    const workspaceId = params?.workspaceId as string;
    const projectId = params?.projectId as string;

    const renderRoute = () => {
        switch (route) {
            case 'tasks':
                return <LazyTasks />;
            case 'members':
                return <LazyMembers />;
            case 'analytics':
                return <LazyAnalytics />;
            case 'settings':
                return <LazySettings />;
            case 'profile':
                return <LazyProfile />;
            case 'project':
                return projectId ? <LazyProjectDetails /> : null;
            default:
                return null;
        }
    };

    return (
        <Suspense fallback={<PageSkeleton pageName={route} />}>
            {renderRoute()}
        </Suspense>
    );
}





