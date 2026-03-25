"use client";
import { lazy, Suspense } from "react";
import { Loader } from "lucide-react";
import { useLoadingContext } from "@/components/loading";

// Lazy load the heavy AnimatedWorkflow component
const AnimatedWorkflowLazy = lazy(() => import("./AnimatedWorkflow"));

interface LazyAnimatedWorkflowProps {
    type: 'dashboard' | 'analytics' | 'tasks' | 'team' | 'projects' | 'settings';
    isActive: boolean;
}

export const LazyAnimatedWorkflow = ({ type, isActive }: LazyAnimatedWorkflowProps) => {
    const { isStrategicLoading } = useLoadingContext();

    // Don't show anything during strategic loading
    if (isStrategicLoading) {
        return null;
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-32 w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg">
                <Loader className="h-6 w-6 animate-spin text-gray-500" />
            </div>
        }>
            <AnimatedWorkflowLazy type={type} isActive={isActive} />
        </Suspense>
    );
};

export default LazyAnimatedWorkflow;
