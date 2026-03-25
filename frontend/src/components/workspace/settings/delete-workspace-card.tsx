"use client";

import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Button } from "@/components/ui/button";
import { Permissions } from "@/constant";
import { useAuthContext } from "@/context/useAuthContext";
import useConfirmDialog from "@/hooks/use-confirm-dialog";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { deleteWorkspaceMutationFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const DeleteWorkspaceCard = () => {
  const { workspace } = useAuthContext();
  const router = useRouter();

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { open, onOpenDialog, onCloseDialog } = useConfirmDialog();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteWorkspaceMutationFn,
  });

  const handleConfirm = () => {
    mutate(workspaceId, {
      onSuccess: (data) => {

        // Clear all workspace-related queries to ensure fresh data
        queryClient.removeQueries({
          queryKey: ["workspaces"],
        });
        queryClient.removeQueries({
          queryKey: ["workspace"],
        });
        queryClient.removeQueries({
          queryKey: ["userWorkspaces"],
        });
        queryClient.invalidateQueries({
          queryKey: ["authUser"],
        });

        // Refetch auth user to get updated currentWorkspace
        queryClient.refetchQueries({
          queryKey: ["authUser"],
        });

        // Immediately redirect to prevent any further API calls to the deleted workspace

        // Handle the case when user has no workspaces left
        if (data.currentWorkspace && data.currentWorkspace !== 'null' && data.currentWorkspace !== 'undefined') {
          // User has another workspace, redirect there immediately
          router.replace(`/workspace/${data.currentWorkspace}`);
        } else {
          // User has no workspaces left, redirect to workspace creation immediately
          router.replace('/workspace');
        }

        setTimeout(() => onCloseDialog(), 200);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };
  return (
    <>
      <div className="w-full">
        <div className="mb-5 border-b">
          <h1
            className="text-[17px] tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1.5
           text-center sm:text-left"
          >
            Delete Workspace
          </h1>
        </div>

        <PermissionsGuard
          showMessage
          requiredPermission={Permissions.DELETE_WORKSPACE}
        >
          <div className="flex flex-col items-start justify-between py-0">
            <div className="flex-1 mb-2">
              <p>
                Deleting a workspace is a permanent action and cannot be undone.
                Once you delete a workspace, all its associated data, including
                projects, tasks, and member roles, will be permanently removed.
                Please proceed with caution and ensure this action is
                intentional.
              </p>
            </div>
            <Button
              className="shrink-0 flex place-self-end h-[40px]"
              variant="destructive"
              onClick={onOpenDialog}
            >
              Delete Workspace
            </Button>
          </div>
        </PermissionsGuard>
      </div>

      <ConfirmDialog
        isOpen={open}
        isLoading={isPending}
        onClose={onCloseDialog}
        onConfirm={handleConfirm}
        title={`Delete  ${workspace?.name} Workspace`}
        description={`Are you sure you want to delete? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default DeleteWorkspaceCard;
