"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Edit3 } from "lucide-react";
import CreateTaskDialog from "../task/create-task-dialog";
import EditProjectDialog from "./edit-project-dialog";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProjectByIdQueryFn } from "@/lib/api";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";

const ProjectHeader = () => {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const projectId = params?.projectId || "";
  const workspaceId = useWorkspaceId() || params?.workspaceId || "";
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ["singleProject", projectId],
    queryFn: () =>
      getProjectByIdQueryFn({
        workspaceId,
        projectId,
      }),
    staleTime: Infinity,
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });

  const project = data?.project;

  // Fallback if no project data is found
  const projectEmoji = project?.emoji || "📊";
  const projectName = project?.name || "Untitled project";

  const renderContent = () => {
    if (isPending) return <span className="text-gray-500 dark:text-gray-400">Loading...</span>;
    if (isError) return <span className="text-red-500 dark:text-red-400">Error occurred</span>;
    return (
      <>
        <span>{projectEmoji}</span>
        {projectName}
      </>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 bg-card/50 dark:bg-slate-800/40 border border-border/50 dark:border-slate-700/30 rounded-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-medium truncate tracking-tight text-gray-900 dark:text-gray-100">
          {renderContent()}
        </h2>
        <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary flex-shrink-0"
            title="Edit Project"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </PermissionsGuard>
      </div>
      <div className="flex-shrink-0">
        <CreateTaskDialog projectId={projectId} />
      </div>

      <EditProjectDialog
        project={project}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />
    </div>
  );
};

export default ProjectHeader;
