import { Skeleton } from "@/components/ui/skeleton";
import { useLoadingContext } from "@/components/loading";
// import { Loader } from "lucide-react";

export function DashboardSkeleton() {
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  return (
    <div className="p-4">
      {/* Loader on top */}
      {/* <div className="absolute inset-0 z-50 flex items-start pt-10 justify-center bg-[rgba(255,255,255,.01)]">
        <div className="flex items-center space-x-2">
          <Loader size="25px" className="animate-spin" />
          <span className="text-sm font-medium">Timeline...</span>
        </div>
      </div> */}

      {/* Main layout */}
      <div className="flex space-x-4">
        {/* Sidebar */}
        <div className="w-64 space-y-4">
          {/* Workspace name */}
          <Skeleton className="h-8 w-40" />
          {/* Navigation items */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-36" />
          </div>
          {/* Project Section */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          {/* User info */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-card">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-card">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
