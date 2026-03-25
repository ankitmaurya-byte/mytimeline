"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthContext } from "@/context/useAuthContext";
import { useLoadingContext } from "@/components/loading";
import { useQuery } from "@tanstack/react-query";
import { getAllWorkspacesUserIsMemberQueryFn } from "@/lib/api";

const WorkspaceHeader = () => {
  const { workspaceLoading, workspace, user } = useAuthContext();
  const { isStrategicLoading } = useLoadingContext(); // Removed updateLoadingState

  // Monitor workspaces loading state
  const { isLoading: workspacesLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getAllWorkspacesUserIsMemberQueryFn,
    enabled: !!user,
  });

  // Don't show ANYTHING during strategic loading period
  if (isStrategicLoading) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-2">
      {/* Remove the loading spinner - let CentralLoader handle all loading */}
      <div className="flex items-center gap-7 p-5 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-blue-300/70 shadow-md dark:hover:shadow-blue-900/30 transition-all duration-300 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tr from-pink-400/20 to-yellow-200/10 rounded-full blur-2xl" />
        </div>
        <Avatar className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-700 shadow-xl ring-4 ring-blue-100 dark:ring-blue-900/40 z-10">
          <AvatarFallback className="flex items-center justify-center w-full h-full rounded-2xl bg-black text-white text-4xl font-extrabold shadow-inner">
            {workspace?.name?.split(" ")?.[0]?.charAt(0) || "W"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left space-y-2 z-10">
          <span className="block text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
            {workspace?.name}
          </span>
          <span className="block text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
            {workspace?.description || "No description available"}
          </span>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active Workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceHeader;
