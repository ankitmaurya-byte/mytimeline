"use client";
import { lazy, Suspense } from "react";
import { Loader } from "lucide-react";
import { useLoadingContext } from "@/components/loading";

// Lazy load dashboard components
const WorkspaceAnalyticsLazy = lazy(() => import("./workspace-analytics").then(mod => ({ default: mod.default })));
const RecentProjectsLazy = lazy(() => import("./project/recent-projects").then(mod => ({ default: mod.default })));
const RecentTasksLazy = lazy(() => import("./task/recent-tasks").then(mod => ({ default: mod.default })));
const RecentMembersLazy = lazy(() => import("./member/recent-members").then(mod => ({ default: mod.default })));

// Loading fallback component
const DashboardFallback = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-center h-16">
                        <Loader className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                </div>
            ))}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-center h-32">
                <Loader className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        </div>
    </div>
);

export const LazyDashboard = () => {
    const { isStrategicLoading } = useLoadingContext();

    if (isStrategicLoading) {
        return null;
    }

    return (
        <Suspense fallback={<DashboardFallback />}>
            <div className="space-y-4">
                <WorkspaceAnalyticsLazy />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <RecentProjectsLazy />
                    <RecentTasksLazy />
                    <RecentMembersLazy />
                </div>
            </div>
        </Suspense>
    );
};

export default LazyDashboard;
